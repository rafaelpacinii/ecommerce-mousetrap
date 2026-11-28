#!/usr/bin/env python3
"""Build a deterministic, runnable dated source submission and remove undated archives."""
from datetime import date
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import sys
from tempfile import TemporaryDirectory
import zipfile

ROOT = Path(__file__).resolve().parents[1]
MAX_ZIP_BYTES = 2_000_000
DATED_ARCHIVE_RE = re.compile(r'^mousetrap_submission_\d{4}-\d{2}-\d{2}\.zip$')
ROOT_DIRS = {'api', 'web', 'infra', 'docs', 'scripts'}
EXCLUDED_DIRS = {'.git', '.github', '.agents', '.codex', '.gemini', '.vscode', '.idea',
                 '.angular', '.local', '.certs', 'node_modules', 'target', 'dist',
                 'build', 'tmp', 'out-tsc', 'coverage', '__pycache__', 'test-results',
                 'playwright-report', '__screenshots__'}
EXCLUDED_SUFFIXES = {'.zip', '.tar', '.gz', '.tgz', '.class', '.jar', '.war', '.log',
                     '.pyc', '.pem', '.key', '.p12', '.pfx', '.jks', '.env', '.swp', '.orig'}
RUNTIME_FILES = {
    'README.md', 'LICENSE.md', '.env.example', 'docker-compose.yml',
    'api/pom.xml', 'api/mvnw', 'api/mvnw.cmd', 'api/Dockerfile', 'api/.dockerignore',
    'api/.mvn/wrapper/maven-wrapper.properties',
    'api/src/main/resources/application.properties.example',
    'api/src/main/resources/META-INF/microprofile-config.properties',
    'web/package.json', 'web/package-lock.json', 'web/angular.json',
    'web/tsconfig.json', 'web/tsconfig.app.json', 'web/tsconfig.spec.json',
    'web/Dockerfile', 'web/.dockerignore', 'web/nginx.conf', 'web/docker/40-runtime-config.sh',
    'web/public/config.json',
    'web/public/favicon.ico', 'web/public/favicon.svg', 'web/public/apple-touch-icon.png',
    'web/public/safari-pinned-tab.svg', 'web/public/site.webmanifest',
    'web/public/icons/icon-32.png', 'web/public/icons/icon-192.png',
    'web/public/icons/icon-512.png', 'web/public/icons/icon-maskable-512.png',
    'web/public/licenses/material-icons-LICENSE.txt',
    'web/public/images/hero-1440.webp',
    'web/public/images/home-scenes/g-pro-superlight-speed.webp',
    'web/public/images/home-scenes/g-pro-superlight-precision.webp',
    'web/public/images/home-scenes/g-pro-superlight-light.webp',
    'web/public/images/home-scenes/g-pro-superlight-glide.webp',
    'web/public/images/home-scenes/sabre-angle.avif',
    'web/public/images/home-scenes/superlight-side.webp',
    'web/public/images/home-scenes/u2-left.avif',
    'infra/identity/compose.yaml', 'infra/identity/realm/mousetrap-realm.json',
    'scripts/configure_stack.py', 'docs/others/authentication.md', 'docs/others/cloudflare-r2.md',
}
RUNTIME_TREES = (
    'api/src/main/java/',
    'api/src/main/resources/db/migration/',
    'infra/identity/themes/mousetrap/',
    'web/src/',
)
REQUIRED = RUNTIME_FILES | {
    'api/src/main/resources/db/migration/V1__criar_catalogo.sql',
    'api/src/main/resources/db/migration/V11__reservar_exclusao_imagem_r2.sql',
    'infra/identity/themes/mousetrap/login/theme.properties',
    'web/src/main.ts', 'web/src/index.html', 'web/src/styles.css', 'web/src/material-theme.scss',
    'web/src/assets/fonts/MaterialIcons-Regular.woff2',
}


def default_destination(root: Path = ROOT, today: date | None = None) -> Path:
    stamp = (today or date.today()).isoformat()
    return root / f'dist/mousetrap_submission_{stamp}.zip'


def remove_undated_archives(directory: Path, keep: Path) -> list[str]:
    removed = []
    if not directory.is_dir():
        return removed
    for entry in sorted(directory.glob('mousetrap_submission*.zip')):
        if entry.resolve() == keep.resolve():
            continue
        if not DATED_ARCHIVE_RE.match(entry.name):
            entry.unlink(missing_ok=True)
            removed.append(str(entry.resolve()))
    return removed


def allowed(relative: PurePosixPath) -> bool:
    path = relative.as_posix()
    if path in RUNTIME_FILES:
        return True
    if not path.startswith(RUNTIME_TREES):
        return False
    if any(part in EXCLUDED_DIRS or part.startswith('.') for part in relative.parts):
        return False
    if relative.name in {'application.properties', 'Thumbs.db'}:
        return False
    if '.env.' in relative.name or relative.name.endswith(('.spec.ts', '.test.ts')):
        return False
    return relative.suffix.lower() not in EXCLUDED_SUFFIXES


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
    compressed = archive.stat().st_size
    if compressed > MAX_ZIP_BYTES:
        raise ValueError(f'Archive has {compressed} bytes and exceeds the {MAX_ZIP_BYTES}-byte upload limit')
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
    return {'archive': str(archive.resolve()), 'compressed_bytes': compressed,
            'uncompressed_bytes': uncompressed,
            'reduction_percent': round(100 * (1 - compressed / uncompressed), 2) if uncompressed else 0,
            'files': len(names), 'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(),
            'integrity_and_exclusions': 'passed'}


def build(root: Path, destination: Path | None = None, required=REQUIRED) -> dict:
    destination = (destination or default_destination(root)).resolve()
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
    with TemporaryDirectory(dir=destination.parent) as temporary:
        candidate = Path(temporary) / destination.name
        with zipfile.ZipFile(candidate, 'w', compression=zipfile.ZIP_DEFLATED) as package:
            for path, name in entries:
                info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
                info.create_system = 3
                executable = name == 'api/mvnw' or name.endswith('.sh')
                info.external_attr = (0o100755 if executable else 0o100644) << 16
                info.compress_type = zipfile.ZIP_DEFLATED
                package.writestr(info, path.read_bytes(), compresslevel=9)
        report = verify(candidate, required)
        candidate.replace(destination)
    remove_undated_archives(destination.parent, destination)
    return report | {'archive': str(destination)}


if __name__ == '__main__':
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else default_destination(ROOT)
    print(json.dumps(build(ROOT, target), indent=2))
