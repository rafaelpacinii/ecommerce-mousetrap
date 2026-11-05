#!/usr/bin/env python3
"""Run repository AI command presets or list context paths without reading files."""
import argparse
from fnmatch import fnmatchcase
from pathlib import Path, PurePosixPath
import shlex
import subprocess
import tomllib

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / '.agents/project.toml'


def load_manifest(path=MANIFEST):
    with path.open('rb') as stream:
        config = tomllib.load(stream)
    if config.get('version') != 1:
        raise ValueError('Unsupported AI runner manifest version')
    return config


def context_allowed(relative, config):
    """Filter path names only; this is not a filesystem security boundary."""
    path = PurePosixPath(relative)
    if path.is_absolute() or '..' in path.parts:
        return False
    name = path.as_posix()
    included = any(fnmatchcase(name, p) for p in config['include_patterns'])
    excluded = any(fnmatchcase(name, p) for p in config['exclude_patterns'])
    return included and not excluded


def selected_paths(candidates, config, root=ROOT):
    """Return existing regular context files; do not follow symlinks out of scope."""
    selected = []
    for name in sorted(set(candidates)):
        if not name or not context_allowed(name, config):
            continue
        path = root / name
        if (not path.is_symlink() and path.is_file()
                and path.resolve().is_relative_to(root.resolve())):
            selected.append(name)
    return selected


def execute_presets(config, action, scope, dry_run=False, root=ROOT):
    """Execute argv arrays in known directories, stopping on the first failure."""
    scopes = ('governance', 'api', 'web') if scope == 'all' else (scope,)
    for selected in scopes:
        directory = (root / config['working_directories'][selected]).resolve()
        if not directory.is_relative_to(root.resolve()) or not directory.is_dir():
            raise ValueError(f'Invalid preset working directory: {selected}')
        for command in config[f'{action}_commands'][selected]:
            if (not isinstance(command, list) or not command
                    or not all(isinstance(arg, str) for arg in command)):
                raise ValueError(f'Invalid command argv: {selected}')
            print(f'[{selected}] {shlex.join(command)}', flush=True)
            if not dry_run:
                result = subprocess.run(command, cwd=directory, check=False)
                if result.returncode:
                    return result.returncode
    return 0


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    actions = parser.add_subparsers(dest='action', required=True)
    for name in ('setup', 'verify'):
        sub = actions.add_parser(name)
        sub.add_argument('--scope', choices=('governance', 'api', 'web', 'all'),
                         default='governance')
        sub.add_argument('--dry-run', action='store_true')
    actions.add_parser('context', help='List selected Git paths; never read their contents')
    args = parser.parse_args(argv)
    try:
        config = load_manifest()
        if args.action == 'context':
            result = subprocess.run(['git', 'ls-files', '--cached', '--others',
                                     '--exclude-standard', '-z'], cwd=ROOT,
                                    check=True, capture_output=True)
            paths = result.stdout.decode().split('\0')
            for name in selected_paths(paths, config):
                print(name)
            return 0
        return execute_presets(config, args.action, args.scope, args.dry_run)
    except (OSError, ValueError, subprocess.CalledProcessError) as error:
        parser.exit(1, f'AI runner failed: {error}\n')


if __name__ == '__main__':
    raise SystemExit(main())
