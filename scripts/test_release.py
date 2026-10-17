"""Regression checks for source delivery and isolated environment generation."""
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import zipfile
import configure_stack
from package_release import build, verify


class PackagingTests(unittest.TestCase):
    def test_deterministic_archive_excludes_secrets_dependencies_and_symlinks(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            files = {'README.md': 'source', 'api/mvnw': '#!/bin/sh\n',
                     'web/src/main.ts': 'public', 'docs/release-readiness.md': 'documentation',
                     'api/src/main/resources/application.properties.example': 'mock',
                     'api/src/main/resources/application.properties': 'secret',
                     'web/.env': 'secret', 'infra/private.key': 'secret',
                     'infra/settings.env.local': 'secret', '.local/stack.env': 'secret',
                     'web/node_modules/package/index.js': 'dependency',
                     'api/target/application.jar': 'binary', 'web/dist/main.js': 'build'}
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
                    'docs/release-readiness.md',
                    'api/src/main/resources/application.properties.example'})
                self.assertEqual(archive.getinfo('api/mvnw').external_attr >> 16, 0o100755)

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
                client = next(c for c in realm['clients'] if c['clientId'] == 'mousetrap-web')
                self.assertEqual(client['webOrigins'], ['http://localhost:14200'])
                self.assertNotIn('*', ''.join(client['redirectUris']))
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
