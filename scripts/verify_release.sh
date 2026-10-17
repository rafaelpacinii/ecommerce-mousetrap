#!/bin/sh
# Rehearse the release using disposable databases, users and localhost ports.
set -eu
cd "$(dirname "$0")/.."
project_root="$(pwd)"
stack_name="e2e-$(date +%s)-$$"
python3 scripts/configure_stack.py --name "$stack_name" \
  --web-port 14205 --api-port 18480 --identity-port 18481 --mail-port 18025 --demo-payments >/dev/null
TEST_STACK_ENV="$(pwd)/.local/$stack_name/stack.env"
export TEST_STACK_ENV
compose() {
  docker compose --project-directory "$project_root" --env-file "$TEST_STACK_ENV" -f "$project_root/docker-compose.yml" -f "$project_root/infra/testing/compose.yaml" "$@"
}
cleanup() { compose down --volumes --remove-orphans; }
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' HUP TERM
compose up -d --build
python3 - <<'PY'
import time
from urllib.request import urlopen
urls = ['http://localhost:18480/q/health/ready', 'http://localhost:14205/healthz',
        'http://localhost:18481/realms/mousetrap/.well-known/openid-configuration']
for url in urls:
    for attempt in range(180):
        try:
            with urlopen(url, timeout=2) as response:
                if response.status == 200:
                    break
        except (OSError, TimeoutError):
            pass
        time.sleep(1)
    else:
        raise SystemExit('Timed out waiting for ' + url)
PY
cd web
npm run e2e
