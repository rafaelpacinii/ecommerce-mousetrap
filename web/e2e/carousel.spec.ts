import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';

// Keep the historical filename/base override compatible with existing local runners.
const stack = process.env['TEST_STACK_ENV'];
const base =
  process.env['HOME_BASE_URL'] ??
  process.env['CAROUSEL_BASE_URL'] ??
  (stack
    ? readFileSync(stack, 'utf8')
        .split('\n')
        .find((line) => line.startsWith('PUBLIC_WEB_URL='))
        ?.split('=')[1]
    : undefined);
if (!base || !['localhost', '127.0.0.1'].includes(new URL(base).hostname))
  throw new Error('Use the disposable stack runner or a local HOME_BASE_URL');

const product = {
  id: 901,
  sku: 'HOME-901',
  nome: 'Mouse de demonstração',
  descricao: 'Fixture pública',
  cor: 'Preto',
  preco: 199.9,
  quantidadeEstoque: 4,
  dpiMaximo: 26000,
  quantidadeBotoes: 6,
  pesoGramas: 55,
  marca: { id: 901, nome: 'Marca de demonstração' },
  tiposConexao: [{ id: 1, label: 'USB' }],
  imagens: [],
};
const items = Array.from({ length: 4 }, (_, index) => ({
  ...product,
  id: 901 + index,
  nome: `Mouse de demonstração ${index + 1}`,
  quantidadeEstoque: index === 3 ? 0 : 4,
}));
const paged = (products = items) => ({
  items: products,
  page: 0,
  pageSize: 4,
  totalItems: products.length,
  totalPages: 1,
});

test.beforeEach(async ({ page }) => {
  // Local fixture runs do not need an identity server or private runtime settings.
  if (!stack)
    await page.route('**/config.json', (route) =>
      route.fulfill({ status: 503, body: 'Public fixture run' }),
    );
  await page.route(/\/catalogo\/mouses(?:\?|$)/, (route) => route.fulfill({ json: paged() }));
  await page.route('**/catalogo/filtros', (route) =>
    route.fulfill({
      json: {
        marcas: [],
        sensores: [],
        pollingRates: [4000, 8000],
        conexoes: [],
        pegadas: [
          { id: 1, label: 'Palm' },
          { id: 2, label: 'Claw' },
          { id: 3, label: 'Fingertip' },
        ],
        tiposSwitch: [{ id: 1, label: 'Óptico' }],
      },
    }),
  );
});

test('four responsive chapters and product shelves remain accessible at all supported widths', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(base!);
  await expect(page.locator('#catalogo app-product-card')).toHaveCount(4);
  await expect(page.locator('app-home h1')).toHaveCount(1);
  await expect(page.locator('app-home-chapter')).toHaveCount(4);
  for (const width of [1440, 1024, 768, 375, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const id of ['velocidade', 'precisao', 'ultraleves', 'deslizamento']) {
      const scene = page.locator('#' + id);
      await scene.scrollIntoViewIfNeeded();
      const image = scene.locator('.mouse-cutout');
      await expect
        .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
        .toBe(true);
      const bounds = (await scene.boundingBox())!;
      expect(bounds.x).toBe(0);
      expect(bounds.width).toBe(width);
      const button = (await scene.locator('.store-button').boundingBox())!;
      expect(button.x).toBeGreaterThanOrEqual(bounds.x);
      expect(button.x + button.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1);
      expect(button.y + button.height).toBeLessThanOrEqual(bounds.y + bounds.height);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
    const columns = await page
      .locator('#catalogo .product-grid')
      .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(width >= 1200 ? 4 : width >= 700 ? 2 : 1);
    if (width === 1440 || width === 375) {
      await page.locator('#catalogo').scrollIntoViewIfNeeded();
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((node) => node.target) })),
      ).toEqual([]);
    }
  }
  expect(errors).toEqual([]);
});

test('catalog and grip CTAs preserve existing public filters and native anchors', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const queries = [
    { pollingRateMin: '4000', tipoSwitch: '1' },
    { ordenar: 'maior-dpi' },
    { pesoMax: '59.99', ordenar: 'menor-peso' },
    {},
  ];
  for (const [index, id] of ['velocidade', 'precisao', 'ultraleves', 'deslizamento'].entries()) {
    await page.goto(base!);
    await page.locator('#' + id + ' .store-button').click();
    await expect(page).toHaveURL(/\/catalogo(?:\?|$)/);
    expect(Object.fromEntries(new URL(page.url()).searchParams)).toEqual(queries[index]);
  }
  await page.goto(base!);
  await page.getByRole('link', { name: 'Ver novidades', exact: true }).click();
  await expect(page).toHaveURL(/#catalogo$/);
  await expect(page.locator('#catalogo h2')).toBeInViewport();
  for (const [index, id] of [2, 1, 3].entries()) {
    await page.goto(base! + '/#pegadas');
    const grip = page.locator('.grip-card').nth(index);
    await grip.locator('summary').click();
    await grip.locator('a').click();
    await expect(page).toHaveURL(new RegExp('/catalogo\\?pegada=' + id + '$'));
  }
});

test('search, isolated errors, retries, unavailable stock and purchase actions work', async ({
  page,
}) => {
  let dpiFailed = true;
  await page.route(/\/catalogo\/mouses(?:\?|$)/, (route) => {
    const params = new URL(route.request().url()).searchParams;
    if (params.get('ordenar') === 'maior-dpi' && dpiFailed)
      return route.fulfill({ status: 503, json: { detail: 'Private database detail' } });
    return route.fulfill({ json: paged(params.get('nome') ? [] : items) });
  });
  await page.goto(base!);
  await expect(page.locator('#catalogo app-product-card')).toHaveCount(4);
  await expect(page.locator('#por-dpi')).toContainText('Não foi possível carregar');
  await expect(page.locator('#menos-de-60g app-product-card')).toHaveCount(4);
  await expect(page.locator('app-home')).not.toContainText('Private database');
  dpiFailed = false;
  await page.locator('#por-dpi').getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.locator('#por-dpi app-product-card')).toHaveCount(4);
  await page.locator('#mouse-search').fill('  desconhecido  ');
  const search = page.waitForRequest(
    (request) =>
      request.url().includes('/catalogo/mouses') &&
      new URL(request.url()).searchParams.get('nome') === 'desconhecido',
  );
  await page.locator('#busca').getByRole('button', { name: 'Buscar', exact: true }).click();
  expect(new URL((await search).url()).searchParams.get('ordenar')).toBe('recentes');
  await expect(page.locator('#catalogo')).toContainText('Nenhum mouse encontrado');
  await page
    .locator('#catalogo')
    .getByRole('button', { name: 'Limpar busca', exact: true })
    .click();
  await expect(page.locator('#catalogo app-product-card')).toHaveCount(4);
  await expect(page.locator('#catalogo .unavailable')).toHaveCount(1);
  const add = page.locator('#catalogo .add-cart-btn').first();
  await add.focus();
  const entry = page.locator('#catalogo .product-entry').first();
  await expect(entry).toHaveCSS('opacity', '1');
  await expect(entry).toHaveCSS('transform', 'none');
  await page.keyboard.press('Enter');
  await expect(page.locator('.cart-badge')).toHaveText('1');
  await page.locator('#catalogo app-favorite-button button').first().click();
  await expect(page).toHaveURL(/\/login\?returnUrl=/);
});

test('slow artwork and reduced motion leave content readable and links usable', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route('**/images/home-scenes/*', async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto(base!, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('app-home h1')).toBeVisible();
  const sceneHeight = await page
    .locator('#velocidade')
    .evaluate((element) => element.getBoundingClientRect().height);
  await expect(page.locator('#catalogo app-product-card')).toHaveCount(4);
  await expect(page.locator('#catalogo .product-entry').first()).toHaveCSS('opacity', '1');
  await expect(page.locator('#velocidade .store-button')).toBeVisible();
  release();
  await expect
    .poll(() =>
      page
        .locator('#velocidade img')
        .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
    )
    .toBe(true);
  expect(
    await page.locator('#velocidade').evaluate((element) => element.getBoundingClientRect().height),
  ).toBe(sceneHeight);
});

async function scrollToEntry(page: Page, selector: string, visibleFraction: number) {
  await page.locator(selector).evaluate((element, fraction) => {
    const { top, height } = element.getBoundingClientRect();
    window.scrollTo(0, window.scrollY + top - innerHeight + height * fraction);
  }, visibleFraction);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
}

test('editorial motion reverses while mouse illustrations stay fixed within their chapters', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const requestedFrames: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/images/home-sequence/')) requestedFrames.push(request.url());
  });
  await page.goto(base!);
  const chapter = '#precisao';
  const word = page.locator(chapter + ' .title-word-inner').first();
  const matrix = () =>
    word.evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).m42);
  const art = async () =>
    page.locator(chapter + ' .mouse-object').evaluate((element) => {
      const image = element.querySelector('img')!;
      const position = element.getBoundingClientRect();
      const stage = element.closest('.chapter-stage')!.getBoundingClientRect();
      return {
        x: Math.round(position.x - stage.x),
        y: Math.round(position.y - stage.y),
        width: Math.round(position.width),
        height: Math.round(position.height),
        src: image.getAttribute('src'),
        artTransform: getComputedStyle(element).transform,
        imageTransform: getComputedStyle(image).transform,
      };
    });

  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await scrollToEntry(page, chapter, 0.11);
    await expect.poll(matrix).toBeGreaterThan(8);
    const before = await matrix();
    const originalArt = await art();
    expect(originalArt.artTransform).toBe('none');
    expect(originalArt.imageTransform).toBe('none');
    await scrollToEntry(page, chapter, 0.72);
    await expect.poll(matrix).toBeLessThan(1);
    expect(await art()).toEqual(originalArt);
    await scrollToEntry(page, chapter, 0.11);
    await expect.poll(async () => Math.abs((await matrix()) - before)).toBeLessThan(1);

    const tile = '#por-dpi .product-entry:first-child';
    const tileBody = page.locator(tile + ' .product-reveal');
    const shift = () =>
      tileBody.evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).m41);
    await scrollToEntry(page, tile, 0.1);
    await expect.poll(shift).toBeLessThan(-2);
    await page.locator(tile + ' .add-cart-btn').focus();
    await expect(tileBody).toHaveCSS('transform', 'none');
    await page.locator(tile + ' .add-cart-btn').blur();
  }

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(word).toHaveCSS('transform', 'none');
  await expect(page.locator('app-home canvas')).toHaveCount(0);
  expect(requestedFrames).toEqual([]);
});

test('brand images drift right in a seamless edge-faded loop and keep keyboard access', async ({
  page,
}) => {
  const brands = [
    {
      id: 21,
      nome: 'Marca Atlântico',
      logomarcaUrl: 'https://logos.example.invalid/atlantico.svg',
    },
    {
      id: 22,
      nome: 'Marca Meridiano',
      logomarcaUrl: 'https://logos.example.invalid/meridiano.svg',
    },
  ];
  await page.route('**/catalogo/filtros', (route) =>
    route.fulfill({
      json: {
        marcas: brands,
        sensores: [],
        pollingRates: [],
        conexoes: [],
        pegadas: [],
        tiposSwitch: [],
      },
    }),
  );
  await page.route('https://logos.example.invalid/*.svg', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 15"><rect width="60" height="15" rx="4" fill="#0a122a"/></svg>',
    }),
  );
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(base!);
  const viewport = page.locator('.brand-viewport');
  const track = viewport.locator('.brand-track');
  await viewport.scrollIntoViewIfNeeded();
  await expect(viewport).toHaveClass(/running/);
  await expect(viewport).toHaveCSS('mask-image', /linear-gradient/);
  await expect(page.getByRole('link', { name: 'Ver mouses da Marca Atlântico' })).toHaveCount(1);

  const loop = await track.evaluate((element) => {
    const animation = element.getAnimations()[0];
    const duration = Number(animation.effect!.getComputedTiming().duration);
    const rows = Array.from(element.children);
    animation.pause();
    function x(time: number, row: Element) {
      animation.currentTime = time;
      return row.getBoundingClientRect().left;
    }
    const rightward = x(duration * 0.45, rows[0]) - x(duration * 0.25, rows[0]);
    const seam = x(duration - 0.1, rows[0]) - x(0, rows[rows.length / 2]);
    animation.play();
    return {
      rightward,
      seam,
      coverage: element.scrollWidth / 2 >= element.parentElement!.clientWidth,
    };
  });
  expect(loop.rightward).toBeGreaterThan(100);
  expect(Math.abs(loop.seam)).toBeLessThan(1);
  expect(loop.coverage).toBe(true);

  const cycleWidth = () => track.evaluate((element) => element.scrollWidth / 2);
  const desktopCycleWidth = await cycleWidth();
  await page.setViewportSize({ width: 320, height: 900 });
  await viewport.scrollIntoViewIfNeeded();
  await expect.poll(cycleWidth).toBeLessThan(desktopCycleWidth);
  expect(await cycleWidth()).toBeGreaterThanOrEqual(320);
  await expect(viewport).toHaveCSS('mask-image', /linear-gradient/);
  const accessibility = await new AxeBuilder({ page })
    .include('#marcas')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(accessibility.violations.map(({ id }) => id)).toEqual([]);

  await expect(page.locator('#marcas button')).toHaveCount(0);
  await expect(viewport).not.toContainText('Marca Atlântico');
  await page.getByRole('link', { name: 'Ver novidades', exact: true }).focus();
  await page.keyboard.press('Tab');
  const firstBrand = page.getByRole('link', { name: 'Ver mouses da Marca Atlântico' });
  await expect(firstBrand).toBeFocused();
  await expect(firstBrand).toBeInViewport();
  await expect(track).toHaveCSS('animation-name', 'none');
  await expect(viewport).toHaveCSS('mask-image', 'none');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(track).toHaveCSS('animation-name', 'none');
  await firstBrand.press('Enter');
  await expect(page).toHaveURL(/\/catalogo\?marca=21$/);
});
