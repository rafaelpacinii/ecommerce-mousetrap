"""Behavior checks for safe context selection and deterministic command presets."""
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

from ai_checks import context_allowed, execute_presets, load_manifest, selected_paths
import check_ai_governance


class ContextTests(unittest.TestCase):
    def test_private_build_and_lock_paths_are_excluded_without_reading_them(self):
        config = load_manifest()
        excluded = ('.env', '.env.production', 'api/.env', 'web/.env.local',
                    'api/src/main/resources/application.properties',
                    'infra/private.key', 'api/server.pem', 'web/key.p12',
                    'api/.aws/credentials', 'web/package-lock.json',
                    'api/target/classes/App.class', 'web/node_modules/p/index.js',
                    'web/dist/main.js', 'web/.angular/cache/data',
                    'scripts/__pycache__/module.pyc', '/etc/passwd', '../.env')
        for name in excluded:
            with self.subTest(name=name):
                self.assertFalse(context_allowed(name, config))
        for name in ('AGENTS.md', 'docs/SYSTEM_STATE.md', '.codex/config.toml',
                     '.agents/skills/angular-frontend/SKILL.md',
                     'api/src/main/resources/application.properties.example',
                     'web/src/app/app.routes.ts'):
            with self.subTest(name=name):
                self.assertTrue(context_allowed(name, config))


    def test_inventory_omits_deleted_files_and_symlinks_without_opening_contents(self):
        config = load_manifest()
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            source = root / 'web/src'
            source.mkdir(parents=True)
            (source / 'app.ts').write_text('public fixture')
            (root / '.env').write_text('private fixture')
            (source / 'linked.ts').symlink_to(root / '.env')
            with patch('pathlib.Path.read_text', side_effect=AssertionError('Read content')):
                paths = selected_paths(['web/src/app.ts', 'web/src/deleted.ts',
                                        'web/src/linked.ts', '.env'], config, root)
            self.assertEqual(paths, ['web/src/app.ts'])


class CommandTests(unittest.TestCase):
    def configuration(self, commands, directory='.'):
        return {'working_directories': {'web': directory},
                'verify_commands': {'web': commands}}

    def test_commands_keep_literal_arguments_and_stop_at_first_failure(self):
        config = self.configuration([['tool', '$(private)', 'two words'], ['later']])
        with tempfile.TemporaryDirectory() as folder:
            with patch('ai_checks.subprocess.run', return_value=
                       subprocess.CompletedProcess([], 7)) as run:
                self.assertEqual(execute_presets(config, 'verify', 'web', root=Path(folder)), 7)
                run.assert_called_once_with(['tool', '$(private)', 'two words'],
                                            cwd=Path(folder), check=False)

    def test_dry_run_never_starts_a_process(self):
        with tempfile.TemporaryDirectory() as folder:
            with patch('ai_checks.subprocess.run') as run:
                self.assertEqual(execute_presets(self.configuration([['npm', 'ci']]),
                                                'verify', 'web', True, Path(folder)), 0)
                run.assert_not_called()

    def test_rejects_working_directory_outside_repository(self):
        with tempfile.TemporaryDirectory() as folder:
            with self.assertRaises(ValueError):
                execute_presets(self.configuration([['tool']], '..'),
                                'verify', 'web', root=Path(folder))

    def test_rejects_shell_strings_instead_of_command_arrays(self):
        with tempfile.TemporaryDirectory() as folder:
            with patch('ai_checks.subprocess.run') as run:
                with self.assertRaises(ValueError):
                    execute_presets(self.configuration(['echo unsafe']),
                                    'verify', 'web', root=Path(folder))
                run.assert_not_called()

    def test_loads_real_manifest_and_rejects_an_unsupported_version(self):
        config = load_manifest()
        self.assertEqual(config['setup_commands']['web'], [['npm', 'ci']])
        with tempfile.TemporaryDirectory() as folder:
            manifest = Path(folder) / 'project.toml'
            manifest.write_text('version = 99\n')
            with self.assertRaises(ValueError):
                load_manifest(manifest)

    def test_governance_validator_enforces_business_rules_and_global_uml(self):
        self.assertGreaterEqual(check_ai_governance.validate(), 13)
        for public_doc in ('docs/BUSINESS_RULES.md', 'docs/modelagem/README.md',
                           'docs/modelagem/diagrama-de-classes.puml',
                           'docs/modelagem/banco-de-dados.puml'):
            with self.subTest(public_doc=public_doc):
                self.assertTrue(context_allowed(public_doc, load_manifest()))


if __name__ == '__main__':
    unittest.main()
