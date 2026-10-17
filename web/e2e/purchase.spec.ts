import { test, expect, Browser, Page, APIRequestContext } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

// This suite may only bootstrap its own disposable, loopback-only Compose stack.
const file = process.env['TEST_STACK_ENV'];
if (!file) throw new Error('Run scripts/verify_release.sh to create an isolated test stack');
const env = Object.fromEntries(
  readFileSync(file, 'utf8')
    .trim()
    .split('\n')
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);
if (!/^mousetrap-(e2e|release-qa)/.test(env['COMPOSE_PROJECT_NAME']))
  throw new Error('Refusing to bootstrap a non-test stack');
for (const key of ['PUBLIC_WEB_URL', 'PUBLIC_API_URL', 'PUBLIC_IDENTITY_URL']) {
  if (new URL(env[key]).hostname !== 'localhost') throw new Error('Tests require localhost URLs');
}
const web = env['PUBLIC_WEB_URL'];
const api = env['PUBLIC_API_URL'];
const identity = env['PUBLIC_IDENTITY_URL'];

test('real PKCE purchase, ownership, administrative fulfillment, responsive UI and accessibility', async ({
  browser,
  request,
}) => {
  const tag = randomUUID();
  const users: string[] = [];
  const contexts: Awaited<ReturnType<Browser['newContext']>>[] = [];
  const accounts = {
    customer: { email: `buyer-${tag}@example.test`, password: randomUUID() + 'aA1!' },
    other: { email: `other-${tag}@example.test`, password: randomUUID() + 'aA1!' },
    admin: { email: `operator-${tag}@example.test`, password: randomUUID() + 'aA1!' },
  };
  const masterResponse = await request.post(
    identity + '/realms/master/protocol/openid-connect/token',
    {
      form: {
        client_id: 'admin-cli',
        grant_type: 'password',
        username: 'admin',
        password: env['IDENTITY_ADMIN_PASSWORD'],
      },
    },
  );
  expect(masterResponse.ok()).toBeTruthy();
  const master = (await masterResponse.json()).access_token;
  const headers = { Authorization: 'Bearer ' + master };
  const realm = identity + '/admin/realms/mousetrap';
  const exceptions: string[] = [];
  const cardLeaks: string[] = [];
  const fontRequests: string[] = [];

  async function login(kind: keyof typeof accounts) {
    const context = await browser.newContext();
    contexts.push(context);
    const page = await context.newPage();
    page.on('pageerror', (error) => exceptions.push(error.message));
    let token = '';
    page.on('request', (req) => {
      if (/fonts\.(googleapis|gstatic)\.com/.test(req.url())) fontRequests.push(req.url());
      if (req.url().startsWith(api + '/')) {
        if (req.headers()['authorization'])
          token = req.headers()['authorization'].replace(/^Bearer /, '');
        if (/1234.?5678.?9012.?3456|"cvv"|"validade"|"titular"/.test(req.postData() ?? ''))
          cardLeaks.push(new URL(req.url()).pathname);
      }
    });
    await page.goto(web + '/login');
    await page.locator('app-auth-page button').click();
    await page.locator('#username').fill(accounts[kind].email);
    await page.locator('#password').fill(accounts[kind].password);
    await page.locator('#kc-login').click();
    await expect(page).toHaveURL(kind === 'admin' ? web + '/admin/pedidos' : web + '/');
    await page.goto(web + '/lista-de-desejos');
    await expect.poll(() => token).not.toBe('');
    return {
      page,
      get token() {
        return token;
      },
    };
  }

  async function apiCall(client: APIRequestContext, token: string, path: string, data?: unknown) {
    const result = await client.fetch(api + path, {
      method: data ? 'POST' : 'GET',
      headers: { Authorization: 'Bearer ' + token },
      ...(data ? { data } : {}),
    });
    expect(result.ok(), path).toBeTruthy();
    return result.json();
  }

  async function audit(page: Page, selector: string) {
    await expect(page.locator(selector).first()).toBeVisible();
    for (const width of [1440, 1024, 768, 375, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
          ),
        )
        .toBe(true);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      'Axe at ' + new URL(page.url()).pathname,
    ).toEqual([]);
  }

  async function confirm(page: Page, text: string) {
    await page.locator('.operations').getByRole('button', { name: text, exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Voltar' })).toBeFocused();
    await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click();
    await expect(dialog).not.toBeVisible();
  }

  try {
    for (const [kind, account] of Object.entries(accounts)) {
      const response = await request.post(realm + '/users', {
        headers,
        data: {
          username: account.email,
          email: account.email,
          enabled: true,
          emailVerified: true,
          firstName: 'Cliente',
          lastName: 'QA',
          credentials: [{ type: 'password', value: account.password, temporary: false }],
        },
      });
      expect(response.status()).toBe(201);
      const id = response.headers()['location'].split('/').pop()!;
      users.push(id);
      const role = await request.get(
        realm + '/roles/' + (kind === 'admin' ? 'admin' : 'customer'),
        { headers },
      );
      expect(
        (
          await request.post(realm + `/users/${id}/role-mappings/realm`, {
            headers,
            data: [await role.json()],
          })
        ).ok(),
      ).toBeTruthy();
    }
    const operator = await login('admin');
    const brand = await apiCall(request, operator.token, '/marcas', {
      nome: 'QA ' + tag,
      ativo: true,
    });
    const product = await apiCall(request, operator.token, '/mouses', {
      sku: 'QA-' + tag.toUpperCase(),
      nome: 'Mouse Release QA',
      descricao: 'Mouse para validar a compra.',
      cor: 'Preto',
      preco: 149.9,
      quantidadeEstoque: 3,
      dpiMaximo: 26000,
      quantidadeBotoes: 6,
      pesoGramas: 54,
      ativo: true,
      idMarca: brand.id,
      tiposConexao: [1],
      especificacoes: { sensor: 'PAW3395', pollingRate: 8000 },
      imagens: [
        { url: web + '/icons/icon-192.png', textoAlternativo: 'Mouse Release QA', ordem: 0 },
      ],
    });
    const buyer = await login('customer');
    const page = buyer.page;
    await page.goto(web + '/');
    await audit(page, 'app-home h1');
    await page.keyboard.press('Tab');
    await expect(page.locator('.pular-conteudo')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
    await page.goto(web + '/catalogo');
    await audit(page, 'app-product-card');
    await page.setViewportSize({ width: 375, height: 900 });
    await page.getByRole('button', { name: 'Menu da loja' }).click();
    await expect(page.locator('#store-navigation')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Menu da loja' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(web + '/catalogo/' + product.id);
    await audit(page, '.buy-cta');
    expect(
      JSON.parse((await page.locator('#product-structured-data').textContent()) ?? '{}').offers
        .price,
    ).toBe(149.9);
    await page.locator('app-favorite-button button').click();
    await expect(page.locator('app-favorite-button button')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.locator('.buy-cta').click();
    await page.goto(web + '/carrinho');
    await audit(page, 'app-cart h1');
    await page.goto(web + '/checkout');
    await page.locator('app-checkout .panel-heading a').click();
    await page.locator('.profile-form [formControlName="nome"]').fill('Cliente Release QA');
    await page.locator('.profile-form button[type="submit"]').click();
    await expect(
      page.locator('mat-error').filter({ hasText: 'Campo obrigatório.' }).first(),
    ).toBeVisible();
    await page.locator('.profile-form [formControlName="cep"]').fill('01001000');
    await page.locator('.profile-form [formControlName="cep"]').blur();
    await expect(page.locator('.profile-form .municipio-info')).toContainText('São Paulo');
    await page.locator('.profile-form [formControlName="numero"]').fill('10');
    await audit(page, '.profile-form');
    await page.getByRole('button', { name: 'Novo endereço', exact: true }).click();
    await page.locator('.form-endereco button[type="submit"]').click();
    await expect(page.locator('.form-endereco mat-error').first()).toBeVisible();
    await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
      .then((result) => expect(result.violations.map((v) => v.id)).toEqual([]));
    await page
      .locator('.form-endereco')
      .getByRole('button', { name: 'Cancelar', exact: true })
      .click();
    await page.locator('.profile-form button[type="submit"]').click();
    await expect(page.locator('.confirm-button')).toBeEnabled();
    await audit(page, '.confirm-button');
    await page.locator('.confirm-button').click();
    await expect(page.locator('app-pix-payment svg')).toBeVisible();
    const orderId = Number((await page.locator('#result-title').innerText()).split('#')[1]);
    const order = await apiCall(request, buyer.token, '/pedidos/' + orderId);
    expect(order.total).toBe(179.8);
    await audit(page, 'app-pix-payment');
    await page.goto(web + '/meus-pedidos');
    await audit(page, 'app-order-history app-order-details');
    await page.goto(web + '/meus-pedidos/' + orderId);
    await audit(page, 'app-customer-order app-order-details');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    );
    await expect(page.locator('#product-structured-data')).toHaveCount(0);
    await page.goto(web + '/lista-de-desejos');
    await audit(page, 'app-wishlist app-product-card');
    await page.reload();
    await expect(page.locator('app-wishlist app-product-card')).toHaveCount(1);
    expect(
      (
        await request.get(api + '/admin/pedidos', {
          headers: { Authorization: 'Bearer ' + buyer.token },
        })
      ).status(),
    ).toBe(403);
    const other = await login('other');
    expect(
      (
        await request.get(api + '/pedidos/' + orderId, {
          headers: { Authorization: 'Bearer ' + other.token },
        })
      ).status(),
    ).toBe(404);
    const addresses = await apiCall(request, buyer.token, '/clientes/me/enderecos');
    expect(
      (
        await request.delete(api + '/clientes/me/enderecos/' + addresses[0].id, {
          headers: { Authorization: 'Bearer ' + other.token },
        })
      ).status(),
    ).toBe(404);
    await operator.page.goto(web + '/admin/pedidos');
    await audit(operator.page, 'app-admin-orders table');
    await operator.page.goto(web + '/admin/pedidos/' + orderId);
    await audit(operator.page, '.operations');
    await operator.page
      .locator('.operations')
      .getByRole('button', { name: 'Confirmar pagamento', exact: true })
      .click();
    await operator.page.keyboard.press('Escape');
    await expect(operator.page.getByRole('dialog')).not.toBeVisible();
    expect((await apiCall(request, buyer.token, '/pedidos/' + orderId)).status.id).toBe(1);
    await confirm(operator.page, 'Recusar pagamento');
    await expect(operator.page.locator('.payment')).toContainText('Recusado');
    await page.goto(web + '/meus-pedidos/' + orderId);
    await page.locator('app-customer-order .store-button').click();
    await page.locator('#retry-method').selectOption({ label: 'Cartão de crédito' });
    await page.locator('app-card-fields [formControlName="numero"]').fill('1234 5678 9012 3456');
    await page.locator('app-card-fields [formControlName="titular"]').fill('Cliente Release QA');
    await page.locator('app-card-fields [formControlName="validade"]').fill('12/99');
    await page.locator('app-card-fields [formControlName="cvv"]').fill('123');
    await audit(page, 'app-card-fields');
    await page.getByRole('button', { name: 'Continuar com o pagamento', exact: true }).click();
    await expect(page.locator('.checkout-main')).toContainText('Pagamento em processamento');
    await operator.page.reload();
    await confirm(operator.page, 'Confirmar pagamento');
    await expect(operator.page.locator('.operations form')).toBeVisible();
    await operator.page.locator('[formControlName="transportadora"]').fill('Correios');
    await operator.page.locator('[formControlName="codigoRastreio"]').fill('BR123456789BR');
    await operator.page.locator('.operations form button[type="submit"]').click();
    await operator.page
      .getByRole('dialog')
      .getByRole('button', { name: 'Confirmar', exact: true })
      .click();
    await expect(operator.page.locator('.operations')).toContainText('Confirmar entrega');
    await confirm(operator.page, 'Confirmar entrega');
    await expect(operator.page.locator('.operations')).toContainText('Pedido finalizado');
    await page.goto(web + '/meus-pedidos/' + orderId);
    await expect(page.locator('.timeline .complete')).toHaveCount(4);
    await audit(page, 'app-customer-order app-order-details');
    // A confirmed receipt must not force a reset button before another purchase.
    await page.goto(web + '/catalogo/' + product.id);
    await page.locator('.buy-cta').click();
    await page.goto(web + '/checkout');
    await expect(page.locator('.confirm-button')).toBeEnabled();
    expect(await page.locator('#result-title').count()).toBe(0);
    await page.locator('.confirm-button').click();
    await expect(page.locator('#result-title')).not.toContainText('#' + orderId);
    expect(
      (await apiCall(request, operator.token, '/mouses/' + product.id)).quantidadeEstoque,
    ).toBe(1);
    for (const [route, selector] of [
      ['/admin/mouses', 'app-mouse-list table'],
      ['/admin/mouses/novo', 'app-mouse-form form'],
      ['/admin/marcas', 'app-marca-list table'],
      ['/admin/marcas/novo', 'app-marca-form form'],
      ['/admin/clientes', 'app-cliente-list table'],
      ['/admin/clientes/novo', 'app-cliente-form form'],
    ]) {
      await operator.page.goto(web + route);
      await audit(operator.page, selector);
    }
    expect(cardLeaks).toEqual([]);
    expect(fontRequests).toEqual([]);
    expect(exceptions).toEqual([]);
    const configResponse = await request.get(web + '/config.json');
    expect(configResponse.headers()['cache-control']).toContain('no-cache');
    expect(Object.keys(await configResponse.json()).sort()).toEqual([
      'apiUrl',
      'clientId',
      'identityUrl',
      'realm',
    ]);
    expect((await request.get(web + '/missing-release-chunk.js')).status()).toBe(404);
    expect((await request.get(web + '/minha-conta')).headers()['x-robots-tag']).toBe(
      'noindex, nofollow',
    );
    expect((await request.get(api + '/q/health/ready')).status()).toBe(200);
  } finally {
    await Promise.all(contexts.map((context) => context.close()));
    for (const id of users) await request.delete(realm + '/users/' + id, { headers });
    // Historical records live only in the disposable stack, removed by the runner.
  }
});
