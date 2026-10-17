# Setup from scratch

Use Docker Engine/Desktop with Compose v2 and Python 3.10+. Local source builds
also require JDK 17, Node.js 24, npm 11, curl and unzip. Commands below work in fish.
Run them from the repository root unless another directory is specified.

## Complete local release stack

Check that ports 4200, 8080, 8180 and 8025 are available. Existing development
services may already use them. Generate a separate named stack with alternate
ports instead of stopping or reconfiguring an installation you want to keep:

```fish
python3 scripts/configure_stack.py --name rehearsal --web-port 14200 --api-port 18080 --identity-port 18180 --mail-port 18025 --demo-payments
docker compose --env-file .local/rehearsal/stack.env up -d --build
```

The default setup uses `python3 scripts/configure_stack.py --demo-payments` and
`.local/release/stack.env`. Use the same environment file for subsequent Compose
commands. Configuration generation refuses to replace existing credentials.
The `--demo-payments` flag explicitly enables the local financial engine; omit it
to keep checkout unavailable. The customer interface does not show simulation controls.

The generated environment file is mode `0600` and ignored by Git. It contains the
three independently generated database/identity passwords and public URLs.
Keep a private copy when moving the same installation. Passwords change only
when you generate a new installation; existing identity data remains in the
project's named PostgreSQL volume. Changing a bootstrap password variable does
not reset a previously created administrator. Never commit the environment.

For the example above:

| Service | URL |
| --- | --- |
| Store | `http://localhost:14200` |
| API readiness | `http://localhost:18080/q/health/ready` |
| Identity admin console | `http://localhost:18180/admin/master/console/` |
| Local email inbox | `http://localhost:18025` |

Open `.local/rehearsal/stack.env` locally to read `IDENTITY_ADMIN_PASSWORD`.
Sign in to the **master** console as `admin`. This account manages identity,
not the store. Select realm **mousetrap**, create a user with email and name,
mark the email verified for local setup, set a permanent password satisfying the
realm policy and assign the realm role **admin** under Role mapping. Sign in to
the storefront with that user's email. Administration opens at `/admin/pedidos`.
Ordinary registration assigns the customer role and sends verification email to
Mailpit; complete it from the inbox before saving an owned profile.

Create a brand and an active product before testing purchases. Products require
price, stock, connection types and specifications; image URLs are optional.
Complete a customer profile with a valid CEP and number, then add a product to
the cart, choose PIX or card and confirm. PIX uses a fictitious recipient and
must not be used for a real transfer. Use dummy card data only for demonstrations.
An administrator approves/refuses the payment, ships a paid order and confirms
delivery. Customers follow the recorded timeline in `/meus-pedidos`.

```fish
docker compose --env-file .local/rehearsal/stack.env ps
docker compose --env-file .local/rehearsal/stack.env stop
docker compose --env-file .local/rehearsal/stack.env start
```

`stop` preserves data. `down` also preserves named volumes unless `--volumes` is
provided. Do not remove volumes from an installation whose data you need.
Realm import runs only for a missing realm; changing the JSON file does not
update an existing realm automatically.

## Source development and tests

See [API](api/README.md), [web](web/README.md) and
[identity-only development setup](docs/authentication.md). The root stack is an
alternative to these independently started processes. Local ignored
`application.properties` can remain in place: Docker excludes it and release
builds use `-Prelease` to prevent packaging it.

See [release readiness](docs/release-readiness.md) for CI, reproducible browser
checks, packaging and the required differences for public hosting.
