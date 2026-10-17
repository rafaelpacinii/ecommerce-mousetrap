import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';

const stack = process.env['TEST_STACK_ENV'];
const base =
  process.env['CAROUSEL_BASE_URL'] ??
  (stack
    ? readFileSync(stack, 'utf8')
        .split('\n')
        .find((line) => line.startsWith('PUBLIC_WEB_URL='))
        ?.split('=')[1]
    : undefined);
if (!base || !['localhost', '127.0.0.1'].includes(new URL(base).hostname))
  throw new Error('Use the disposable stack runner or a local CAROUSEL_BASE_URL');

const titles = [
  'A velocidade que define cada round.',
  'Precisão cirúrgica pixel por pixel.',
  'Menos peso, controle total.',
  'Deslize suave como no gelo.',
];

test.beforeEach(async ({ page }) => {
  // Public catalog fixtures isolate banner behavior from catalog availability.
  await page.route(/\/catalogo\/mouses(?:\?|$)/, (route) =>
    route.fulfill({
      json: { items: [], page: 0, pageSize: 12, totalItems: 0, totalPages: 0 },
    }),
  );
  await page.route('**/catalogo/filtros', (route) =>
    route.fulfill({
      json: {
        marcas: [],
        sensores: [],
        pollingRates: [4000, 8000],
        conexoes: [],
        pegadas: [],
        tiposSwitch: [{ id: 1, label: 'Óptico' }],
      },
    }),
  );
});

test('renders four responsive banners, Material icons and accessible controls', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(base!);
  const carousel = page.getByRole('region', { name: 'Destaques MouseTrap' });
  await expect(carousel).toBeVisible();
  await carousel.locator('.rotation-control').focus();
  await expect(
    carousel.getByRole('button', { name: 'Iniciar troca automática de banners' }),
  ).toBeVisible();
  await expect(carousel.locator('img')).toHaveCount(1);
  for (const width of [1440, 1024, 768, 375, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    let height: number | undefined;
    for (let index = 0; index < titles.length; index++) {
      const indicator = carousel.locator('.hero-indicators button').nth(index);
      if ((await indicator.getAttribute('aria-disabled')) !== 'true') await indicator.click();
      const current = carousel.locator('.hero-slide.is-active');
      await expect(current.getByRole('heading', { level: 1 })).toHaveText(titles[index]);
      await expect(carousel.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect
        .poll(() =>
          current
            .locator('img')
            .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
        )
        .toBe(true);
      const bounds = await carousel.boundingBox();
      height ??= bounds!.height;
      expect(bounds!.height).toBe(height);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      ).toBe(true);
      const button = await current.getByRole('link').boundingBox();
      const controls = await carousel.locator('.hero-controls').boundingBox();
      expect(button!.y + button!.height).toBeLessThan(controls!.y);
      expect(button!.x).toBeGreaterThanOrEqual(bounds!.x);
      expect(button!.x + button!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width);
      const icon = current.locator('.hero-eyebrow mat-icon');
      expect(await icon.evaluate((element) => getComputedStyle(element).fontFamily)).toContain(
        'Material Icons',
      );
      if (width === 1440 || width === 375) {
        const result = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();
        expect(
          result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((node) => node.target) })),
        ).toEqual([]);
        if (process.env['CAROUSEL_SCREENSHOTS'])
          await carousel.screenshot({ path: `/tmp/mousetrap-carousel-${index + 1}-${width}.png` });
      }
    }
  }
  const previous = carousel.getByRole('button', { name: 'Banner anterior' });
  await previous.focus();
  await page.keyboard.press('Enter');
  await expect(carousel.getByRole('heading', { level: 1 })).toHaveText(titles[2]);
  await expect(previous).toBeFocused();
  expect(errors).toEqual([]);
});

test('rotates automatically, pauses on hover and preserves keyboard control', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(base!);
  await page.mouse.move(0, 0);
  const carousel = page.getByRole('region', { name: 'Destaques MouseTrap' });
  await expect(carousel.getByRole('heading', { level: 1 })).toHaveText(titles[1], {
    timeout: 10_000,
  });
  await carousel.hover();
  await page.waitForTimeout(7500);
  await expect(carousel.getByRole('heading', { level: 1 })).toHaveText(titles[1]);
  await carousel.locator('.is-active a').focus();
  await expect(
    carousel.getByRole('button', { name: 'Iniciar troca automática de banners' }),
  ).toBeVisible();
  await carousel.getByRole('button', { name: 'Próximo banner' }).click();
  await expect(carousel.getByRole('heading', { level: 1 })).toHaveText(titles[2]);
  await expect(carousel.locator('[role="status"]')).toContainText('3 de 4');
});

test('CTA navigation uses existing public catalog parameters', async ({ page }) => {
  test.setTimeout(45_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const queries = [
    { pollingRateMin: '4000', tipoSwitch: '1' },
    { ordenar: 'maior-dpi' },
    { pesoMax: '59.99', ordenar: 'menor-peso' },
    {},
  ];
  for (let index = 0; index < titles.length; index++) {
    await page.goto(base!);
    const carousel = page.getByRole('region', { name: 'Destaques MouseTrap' });
    const indicator = carousel.locator('.hero-indicators button').nth(index);
    if ((await indicator.getAttribute('aria-disabled')) !== 'true') await indicator.click();
    await expect(carousel.getByRole('heading', { level: 1 })).toHaveText(titles[index]);
    await carousel.locator('.hero-slide.is-active a').click({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/catalogo(?:\?|$)/);
    expect(Object.fromEntries(new URL(page.url()).searchParams)).toEqual(queries[index]);
  }
});

test('autoplays with reduced motion without animating slide transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(base!);
  await page.mouse.move(0, 0);
  const carousel = page.getByRole('region', { name: 'Destaques MouseTrap' });
  await expect(
    carousel.getByRole('button', { name: 'Pausar troca automática de banners' }),
  ).toBeVisible();
  await expect(carousel.getByRole('heading', { level: 1 })).toHaveText(titles[1], {
    timeout: 10_000,
  });
  const duration = await carousel
    .locator('.hero-slide.is-active')
    .evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(parseFloat(duration)).toBeLessThanOrEqual(0.001);
  await carousel.hover();
  const play = carousel.getByRole('button', { name: 'Iniciar troca automática de banners' });
  await expect(play).toBeVisible();
  await play.click();
  await expect(carousel.locator('.rotation-control')).toHaveAttribute(
    'aria-label',
    'Pausar troca automática de banners',
  );
  await expect(carousel.getByRole('heading', { level: 1 })).toHaveText(titles[2], {
    timeout: 10_000,
  });
});
