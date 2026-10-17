#!/usr/bin/env python3
"""Create private local stack settings without changing an existing installation."""
import argparse
import json
import os
from pathlib import Path
import secrets

ROOT = Path(__file__).resolve().parents[1]


def configure(name: str, web: int, api: int, identity: int, mail: int, demo: bool) -> Path:
    if not name.replace('-', '').isalnum():
        raise ValueError('Use only letters, digits and hyphens in the stack name')
    ports = [web, api, identity, mail]
    if len(set(ports)) != 4 or any(not 1024 <= port <= 65535 for port in ports):
        raise ValueError('Use four distinct unprivileged ports')
    directory = ROOT / '.local' / name
    directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    env = directory / 'stack.env'
    if env.exists():
        raise FileExistsError(f'{env} already exists; reuse it to preserve credentials')
    realm = json.loads((ROOT / 'infra/identity/realm/mousetrap-realm.json').read_text())
    origin = f'http://localhost:{web}'
    client = next(c for c in realm['clients'] if c['clientId'] == 'mousetrap-web')
    client['redirectUris'] = [origin + '/auth/callback', origin + '/silent-check-sso.html']
    client['webOrigins'] = [origin]
    client['attributes']['post.logout.redirect.uris'] = origin + '/'
    realm_dir = directory / 'realm'
    realm_dir.mkdir(mode=0o700, exist_ok=True)
    # Container users need to read this public realm definition.
    os.chmod(realm_dir, 0o755)
    (realm_dir / 'mousetrap-realm.json').write_text(json.dumps(realm, indent=2) + '\n')
    values = {
        'COMPOSE_PROJECT_NAME': 'mousetrap-' + name.lower(),
        'DATABASE_PASSWORD': secrets.token_urlsafe(32),
        'IDENTITY_DATABASE_PASSWORD': secrets.token_urlsafe(32),
        'IDENTITY_ADMIN_PASSWORD': secrets.token_urlsafe(32),
        'REALM_DIRECTORY': './.local/' + name + '/realm',
        'PUBLIC_WEB_URL': origin,
        'PUBLIC_API_URL': f'http://localhost:{api}',
        'PUBLIC_IDENTITY_URL': f'http://localhost:{identity}',
        'WEB_PORT': str(web), 'API_PORT': str(api),
        'IDENTITY_PORT': str(identity), 'MAIL_PORT': str(mail),
        'PAYMENT_DEMO_ENABLED': str(demo).lower(),
    }
    with open(env, 'x', opener=lambda path, flags: os.open(path, flags, 0o600)) as stream:
        stream.write(''.join(f'{key}={value}\n' for key, value in values.items()))
    return env


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--name', default='release')
    parser.add_argument('--web-port', type=int, default=4200)
    parser.add_argument('--api-port', type=int, default=8080)
    parser.add_argument('--identity-port', type=int, default=8180)
    parser.add_argument('--mail-port', type=int, default=8025)
    parser.add_argument('--demo-payments', action='store_true')
    args = parser.parse_args()
    print(configure(args.name, args.web_port, args.api_port, args.identity_port,
                    args.mail_port, args.demo_payments))
