"""Regression checks for source delivery and isolated environment generation."""
from datetime import date
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import zipfile
import configure_stack
from package_release import REQUIRED, build, default_destination, verify


class PackagingTests(unittest.TestCase):
    def test_deterministic_archive_only_includes_runtime_files(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            files = {'README.md': 'source', 'api/mvnw': '#!/bin/sh\n',
                     'web/src/main.ts': 'public', 'docs/others/cloudflare-r2.md': 'storage setup',
                     'docs/others/homepage-product-render/scene.blend': 'offline artwork',
                     'web/src/app/app.spec.ts': 'test', 'api/src/test/java/ApiTest.java': 'test',
                     'api/src/main/resources/application.properties.example': 'mock',
                     'api/src/main/resources/application.properties': 'secret',
                     'web/.env': 'secret', 'infra/private.key': 'secret',
                     'infra/settings.env.local': 'secret', '.local/stack.env': 'secret',
                     'web/node_modules/package/index.js': 'dependency',
                     'api/target/application.jar': 'binary', 'web/dist/main.js': 'build',
                     'web/public/images/home-sequence/frame_001.webp': 'retired frame',
                     'web/public/Hero.jpg': 'retired artwork',
                     'web/public/images/home-scenes/g-pro-superlight-speed.webp': 'static artwork'}
            for name, content in files.items():
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(content)
            (root / 'web/leak.txt').symlink_to(root / 'web/.env')
            (root / 'web/linked').symlink_to(root / '.local', target_is_directory=True)
            required = {'README.md', 'api/mvnw', 'web/src/main.ts'}
            first = build(root, root / 'dist/first.zip', required)
            second = build(root, root / 'dist/second.zip', required)
            self.assertEqual(first['sha256'], second['sha256'])
            with zipfile.ZipFile(first['archive']) as archive:
                self.assertEqual(set(archive.namelist()), required | {
                    'docs/others/cloudflare-r2.md',
                    'api/src/main/resources/application.properties.example',
                    'web/public/images/home-scenes/g-pro-superlight-speed.webp'})
                self.assertEqual(archive.getinfo('api/mvnw').external_attr >> 16, 0o100755)

    def test_default_requirements_include_stack_setup_and_runtime_assets(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            for name in REQUIRED:
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text('public source fixture')
            undated = root / 'dist/mousetrap_submission.zip'
            undated.parent.mkdir(parents=True, exist_ok=True)
            undated.write_text('legacy undated zip')
            older_dated = root / 'dist/mousetrap_submission_2026-11-21.zip'
            older_dated.write_text('previous dated zip')
            expected_default = default_destination(root, date(2026, 11, 28))
            self.assertEqual(expected_default.name, 'mousetrap_submission_2026-11-28.zip')
            report = build(root, expected_default)
            self.assertEqual(report['integrity_and_exclusions'], 'passed')
            self.assertFalse(undated.exists())
            self.assertTrue(older_dated.exists())
            self.assertTrue(expected_default.exists())
            with zipfile.ZipFile(report['archive']) as archive:
                self.assertIn('scripts/configure_stack.py', archive.namelist())
                self.assertIn('infra/identity/realm/mousetrap-realm.json', archive.namelist())
                self.assertIn('web/public/config.json', archive.namelist())
                self.assertNotIn('web/public/silent-check-sso.html', archive.namelist())
                self.assertNotIn('scripts/package_release.py', archive.namelist())

    def test_over_limit_candidate_preserves_previous_archive(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / 'README.md').write_text('runnable package fixture')
            destination = root / 'dist/source.zip'
            required = {'README.md'}
            build(root, destination, required)
            previous = destination.read_bytes()
            with patch('package_release.MAX_ZIP_BYTES', 1):
                with self.assertRaisesRegex(ValueError, 'upload limit'):
                    build(root, destination, required)
            self.assertEqual(destination.read_bytes(), previous)

    def test_rejects_incomplete_or_unsafe_archives_and_module_output(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            with self.assertRaises(ValueError):
                build(root, root / 'dist/source.zip')
            with self.assertRaises(ValueError):
                build(root, root / 'api/source.zip', set())
            with self.assertRaises(ValueError):
                build(root, root / 'README.md', set())
            archive = root / 'unsafe.zip'
            with zipfile.ZipFile(archive, 'w') as package:
                package.writestr('../README.md', 'escape')
            with self.assertRaises(ValueError):
                verify(archive, set())


class StackTests(unittest.TestCase):
    def test_private_credentials_exact_callbacks_and_non_destructive_reuse(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = Path(__file__).resolve().parents[1] / 'infra/identity/realm/mousetrap-realm.json'
            target = root / 'infra/identity/realm/mousetrap-realm.json'
            target.parent.mkdir(parents=True)
            target.write_bytes(source.read_bytes())
            with patch.object(configure_stack, 'ROOT', root):
                env = configure_stack.configure('test', 14200, 18080, 18180, 18025, True)
                self.assertEqual(env.stat().st_mode & 0o777, 0o600)
                original = env.read_bytes()
                realm = json.loads((env.parent / 'realm/mousetrap-realm.json').read_text())
                client = next(c for c in realm['clients'] if c['clientId'] == 'mousetrap-backend')
                self.assertFalse(client['publicClient'])
                self.assertTrue(client['directAccessGrantsEnabled'])
                self.assertTrue(client['serviceAccountsEnabled'])
                self.assertTrue(client.get('secret'))
                self.assertIn('IDENTITY_CLIENT_SECRET=' + client['secret'], env.read_text())
                self.assertFalse(any(c['clientId'] == 'mousetrap-web' for c in realm['clients']))
                self.assertNotIn('credentials', realm)
                with self.assertRaises(FileExistsError):
                    configure_stack.configure('test', 14200, 18080, 18180, 18025, True)
                self.assertEqual(env.read_bytes(), original)
                with self.assertRaises(ValueError):
                    configure_stack.configure('../escape', 14200, 18080, 18180, 18025, True)
                with self.assertRaises(ValueError):
                    configure_stack.configure('duplicate', 14200, 14200, 18180, 18025, True)


if __name__ == '__main__':
    unittest.main()
