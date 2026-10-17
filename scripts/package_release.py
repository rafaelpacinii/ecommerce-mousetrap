#!/usr/bin/env python3
"""Build and verify a deterministic source archive, excluding local secrets."""
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
ROOT_FILES = {'README.md', 'SETUP_DO_ZERO.md', 'AGENTS.md', 'LICENSE.md',
              'docker-compose.yml', '.env.example'}
ROOT_DIRS = {'api', 'web', 'infra', 'docs', 'scripts'}
EXCLUDED_DIRS = {'.git', '.github', '.agents', '.codex', '.gemini', '.vscode', '.idea',
                 '.angular', '.local', '.certs', 'node_modules', 'target', 'dist',
                 'build', 'tmp', 'out-tsc', 'coverage', '__pycache__', 'test-results',
                 'playwright-report', '__screenshots__'}
SCRIPT_FILES = {'package_release.py', 'test_release.py', 'configure_stack.py', 'verify_release.sh',
                'export_hero_images.py'}
EXCLUDED_SUFFIXES = {'.zip', '.tar', '.gz', '.tgz', '.class', '.jar', '.war', '.log',
                     '.pyc', '.pem', '.key', '.p12', '.pfx', '.jks', '.env', '.swp', '.orig'}
REQUIRED = {'README.md', 'docs/release-readiness.md', 'docker-compose.yml',
            'api/pom.xml', 'api/mvnw', 'api/mvnw.cmd',
            'api/.mvn/wrapper/maven-wrapper.properties',
            'api/src/main/resources/application.properties.example',
            'web/package.json', 'web/package-lock.json', 'web/angular.json',
            'web/public/config.json', 'scripts/package_release.py'}


def allowed(relative: PurePosixPath) -> bool:
    parts = relative.parts
    if not parts or any(p in EXCLUDED_DIRS for p in parts):
        return False
    if parts[0] not in ROOT_DIRS and str(relative) not in ROOT_FILES:
        return False
    if parts[0] == 'scripts' and relative.name not in SCRIPT_FILES:
        return False
    name = relative.name
    if name in {'application.properties', '.gitignore', '.gitattributes', '.DS_Store', 'Thumbs.db'}:
        return False
    if name.startswith('.env') and name != '.env.example':
        return False
    if '.env.' in name and not name.endswith('.example'):
        return False
    if relative.suffix.lower() in EXCLUDED_SUFFIXES:
        return False
    # Only the Maven wrapper and explicitly public build configuration are hidden files.
    return not any(p.startswith('.') and p not in {'.mvn', '.dockerignore', '.editorconfig', '.env.example'} for p in parts)


def sources(root: Path):
    entries = []
    for directory, directories, files in os.walk(root, followlinks=False):
        base = Path(directory)
        directories[:] = sorted(d for d in directories if d not in EXCLUDED_DIRS
                                and not (base / d).is_symlink()
                                and (not d.startswith('.') or d == '.mvn'))
        if base == root:
            directories[:] = [d for d in directories if d in ROOT_DIRS]
        for name in sorted(files):
            path = base / name
            relative = path.relative_to(root).as_posix()
            if not path.is_symlink() and allowed(PurePosixPath(relative)):
                entries.append((path, relative))
    yield from sorted(entries, key=lambda entry: entry[1])


def verify(archive: Path, required=REQUIRED) -> dict:
    with zipfile.ZipFile(archive) as package:
        names = package.namelist()
        for name in names:
            path = PurePosixPath(name)
            if path.is_absolute() or '..' in path.parts or not allowed(path):
                raise ValueError(f'Forbidden archive entry: {name}')
        missing = required - set(names)
        if missing:
            raise ValueError('Missing required files: ' + ', '.join(sorted(missing)))
        if len(names) != len(set(names)) or package.testzip() is not None:
            raise ValueError('Archive integrity check failed')
        uncompressed = sum(info.file_size for info in package.infolist())
    compressed = archive.stat().st_size
    return {'archive': str(archive.resolve()), 'compressed_bytes': compressed,
            'uncompressed_bytes': uncompressed,
            'reduction_percent': round(100 * (1 - compressed / uncompressed), 2) if uncompressed else 0,
            'files': len(names), 'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(),
            'integrity_and_exclusions': 'passed'}


def build(root: Path, destination: Path, required=REQUIRED) -> dict:
    destination = destination.resolve()
    if destination.suffix.lower() != '.zip':
        raise ValueError('Submission archives must use the .zip extension')
    for module in ('api', 'web'):
        if destination.is_relative_to((root / module).resolve()):
            raise ValueError('Write submission archives outside api/ and web/')
    entries = list(sources(root))
    missing = required - {name for _, name in entries}
    if missing:
        raise ValueError('Missing source files: ' + ', '.join(sorted(missing)))
    destination.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(destination, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as package:
        for path, name in entries:
            info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            info.create_system = 3
            executable = name == 'api/mvnw' or name.endswith('.sh')
            info.external_attr = (0o100755 if executable else 0o100644) << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            package.writestr(info, path.read_bytes(), compresslevel=9)
    return verify(destination, required)


if __name__ == '__main__':
    destination = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'dist/mousetrap_submission.zip'
    print(json.dumps(build(ROOT, destination), indent=2))
