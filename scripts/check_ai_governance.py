#!/usr/bin/env python3
"""Validate repository governance structure without reading private configuration."""
import json
from pathlib import Path
import re
import tomllib

ROOT = Path(__file__).resolve().parents[1]
SKILLS = ('new-feature-workflow', 'db-migration-safe', 'security-and-payment-audit',
          'quarkus-backend', 'persistencia-postgresql', 'testes-backend',
          'seguranca-oidc', 'armazenamento-s3', 'uml-classes', 'angular-frontend',
          'ui-frontend', 'testes-frontend', 'seguranca-frontend-oidc')
REQUIRED = ('AGENTS.md', 'CLAUDE.md', 'TASK.md', '.codex/config.toml',
            '.agents/project.toml', '.agents/architect.md', '.agents/qa-tester.md',
            '.agents/code-reviewer.md', 'docs/CONVENTIONS.md', 'docs/SYSTEM_STATE.md',
            'docs/ai-governance.md', 'docs/adr/0001-record-architecture-decisions.md')


def metadata(text):
    """Parse the deliberately flat YAML scalar subset used by local entrypoints."""
    if not text.startswith('---\n') or '\n---\n' not in text[4:]:
        raise ValueError('Missing YAML frontmatter')
    fields = {}
    for line in text.split('\n---\n', 1)[0].splitlines()[1:]:
        if not line.strip() or line.startswith('#'):
            continue
        key, separator, value = line.partition(':')
        if not separator or key in fields:
            raise ValueError('Invalid/duplicate flat metadata field')
        value = value.strip()
        fields[key] = json.loads(value) if value.startswith('"') else value
    return fields


def validate(root=ROOT):
    errors = []
    for name in REQUIRED:
        if not (root / name).is_file():
            errors.append(f'Missing file: {name}')
    alias = root / '.codex/skills'
    if not alias.is_symlink() or alias.resolve() != (root / '.agents/skills').resolve():
        errors.append('.codex/skills must alias ../.agents/skills')
    claude = root / 'CLAUDE.md'
    if claude.is_file() and claude.read_text().splitlines()[0] != '@AGENTS.md':
        errors.append('CLAUDE.md must start with @AGENTS.md')
    entries = {root / name for name in REQUIRED if name.endswith('.md')}
    entries.update((root / '.agents').glob('*.md'))
    entries.update((root / '.agents/rules').glob('*.md'))
    entries.update((root / '.github/agents').glob('*.md'))
    entries.update((root / 'docs/ai').glob('*.md'))
    for name in SKILLS:
        skill = root / '.agents/skills' / name / 'SKILL.md'
        entries.add(skill)
        if not skill.is_file():
            errors.append(f'Missing skill: {name}')
            continue
        try:
            fields = metadata(skill.read_text())
            if fields.get('name') != name or not fields.get('description'):
                errors.append(f'Invalid skill metadata: {name}')
            if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', name) or len(name) > 64:
                errors.append(f'Invalid skill name: {name}')
            if len(fields.get('description', '')) > 1024:
                errors.append(f'Skill description too long: {name}')
        except (ValueError, TypeError) as error:
            errors.append(f'{name}: {error}')
    for rule in (root / '.agents/rules').glob('*.md'):
        try:
            fields = metadata(rule.read_text())
            trigger = fields.get('trigger')
            if trigger not in ('always_on', 'manual', 'glob', 'model_decision'):
                errors.append(f'Invalid Antigravity trigger: {rule.name}')
            if trigger == 'glob' and not fields.get('globs'):
                errors.append(f'Missing glob patterns: {rule.name}')
        except ValueError as error:
            errors.append(f'{rule.name}: {error}')
    for file in sorted(entries):
        if not file.is_file():
            continue
        text = file.read_text()
        relative = file.relative_to(root)
        if len(text.splitlines()) > 180 or len(text) > 12000:
            errors.append(f'Context budget exceeded: {relative}')
    link_entries = entries | set((root / 'docs').rglob('*.md'))
    link_entries.update(root / name for name in ('README.md', 'api/README.md', 'web/README.md'))
    for file in sorted(link_entries):
        if not file.is_file():
            continue
        text = file.read_text()
        relative = file.relative_to(root)
        for target in re.findall(r'\]\(([^)]+)\)', text):
            if re.match(r'^[a-z]+:', target) or target.startswith('#'):
                continue
            resolved = file.parent / target.split('#', 1)[0]
            if not resolved.exists():
                errors.append(f'Broken link in {relative}: {target}')
    config_path = root / '.codex/config.toml'
    if config_path.is_file():
        try:
            config = tomllib.loads(config_path.read_text())
            forbidden = {'setup_commands', 'verify_commands', 'include_patterns',
                         'exclude_patterns'} & config.keys()
            if forbidden:
                errors.append('Repository runner keys found in native Codex config')
        except tomllib.TOMLDecodeError as error:
            errors.append(f'Invalid Codex TOML: {error}')
    if errors:
        raise ValueError('\n'.join(errors))
    return len(entries)


if __name__ == '__main__':
    try:
        count = validate()
        print(f'PASS: {count} entrypoints, {len(SKILLS)} skills, links, TOML and context budgets')
    except ValueError as error:
        raise SystemExit(str(error))
