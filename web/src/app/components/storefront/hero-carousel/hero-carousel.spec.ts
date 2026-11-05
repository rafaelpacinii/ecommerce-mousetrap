import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HeroCarouselComponent } from './hero-carousel';

// Timer and browser-preference checks prevent unattended motion and lost CTA focus.
describe('Hero carousel', () => {
  let media: EventTarget & { matches: boolean };
  let hidden = false;

  beforeEach(() => {
    vi.useFakeTimers();
    hidden = false;
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
    media = Object.assign(new EventTarget(), { matches: false });
    vi.stubGlobal('matchMedia', () => media);
    TestBed.configureTestingModule({
      imports: [HeroCarouselComponent],
      providers: [provideRouter([])],
    });
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
  function create() {
    const fixture = TestBed.createComponent(HeroCarouselComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('rotates through the four banners, wraps and loads only visited images', () => {
    const fixture = create();
    expect(fixture.nativeElement.querySelectorAll('img')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('.is-active h1').textContent).toBe(
      'A velocidade que define cada round.',
    );
    for (const index of [1, 2, 3, 0]) {
      vi.advanceTimersByTime(7000);
      fixture.detectChanges();
      expect(fixture.componentInstance.indice()).toBe(index);
    }
    expect(fixture.nativeElement.querySelectorAll('img')).toHaveLength(4);
    expect(fixture.nativeElement.querySelectorAll('.hero-slide[aria-hidden="false"]')).toHaveLength(
      1,
    );
    expect(fixture.nativeElement.querySelectorAll('.hero-slide[inert]')).toHaveLength(3);
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toBe('');
    fixture.destroy();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('pauses on hover, tab visibility and keyboard focus without resuming on blur', () => {
    const fixture = create();
    const hero = fixture.nativeElement.querySelector('.hero') as HTMLElement;
    hero.dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
    vi.advanceTimersByTime(14000);
    expect(fixture.componentInstance.indice()).toBe(0);
    hero.dispatchEvent(new Event('mouseleave'));
    fixture.detectChanges();
    vi.advanceTimersByTime(7000);
    expect(fixture.componentInstance.indice()).toBe(1);
    hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));
    fixture.detectChanges();
    vi.advanceTimersByTime(14000);
    expect(fixture.componentInstance.indice()).toBe(1);
    hidden = false;
    document.dispatchEvent(new Event('visibilitychange'));
    fixture.detectChanges();
    vi.advanceTimersByTime(7000);
    expect(fixture.componentInstance.indice()).toBe(2);
    hero.dispatchEvent(new FocusEvent('focusin'));
    hero.dispatchEvent(new FocusEvent('focusout'));
    fixture.detectChanges();
    vi.advanceTimersByTime(14000);
    expect(fixture.componentInstance.indice()).toBe(2);
    fixture.componentInstance.alternarRotacao();
    fixture.detectChanges();
    vi.advanceTimersByTime(7000);
    expect(fixture.componentInstance.indice()).toBe(3);
  });

  it('keeps the pointer pause action correct when focus pauses before click', () => {
    const fixture = create();
    const button = fixture.nativeElement.querySelector('.rotation-control') as HTMLButtonElement;
    button.dispatchEvent(new Event('pointerdown'));
    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    button.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.rotacaoSolicitada()).toBe(false);
    expect(button.getAttribute('aria-label')).toContain('Iniciar');
    vi.advanceTimersByTime(14000);
    expect(fixture.componentInstance.indice()).toBe(0);
    button.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.rotacaoSolicitada()).toBe(true);
  });

  it('shows the effective state and lets explicit play override the current hover pause', () => {
    const fixture = create();
    const hero = fixture.nativeElement.querySelector('.hero') as HTMLElement;
    const button = fixture.nativeElement.querySelector('.rotation-control') as HTMLButtonElement;
    hero.dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
    expect(button.getAttribute('aria-label')).toContain('Iniciar');
    button.dispatchEvent(new Event('pointerdown'));
    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    button.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.girando()).toBe(true);
    expect(button.getAttribute('aria-label')).toContain('Pausar');
    vi.advanceTimersByTime(7000);
    fixture.detectChanges();
    expect(fixture.componentInstance.indice()).toBe(1);
    button.dispatchEvent(new Event('pointerdown'));
    button.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.girando()).toBe(false);
    hero.dispatchEvent(new Event('mouseleave'));
    fixture.detectChanges();
    vi.advanceTimersByTime(14000);
    expect(fixture.componentInstance.indice()).toBe(1);
  });

  it('keeps automatic rotation enabled when reduced motion is requested', () => {
    media.matches = true;
    const fixture = create();
    expect(fixture.componentInstance.girando()).toBe(true);
    vi.advanceTimersByTime(7000);
    fixture.detectChanges();
    expect(fixture.componentInstance.indice()).toBe(1);
    media.dispatchEvent(Object.assign(new Event('change'), { matches: true }));
    fixture.detectChanges();
    vi.advanceTimersByTime(7000);
    fixture.detectChanges();
    expect(fixture.componentInstance.indice()).toBe(2);
  });

  it('announces manual selection and links each CTA to supported catalog filters', () => {
    const fixture = create();
    const next = fixture.nativeElement.querySelector(
      '[aria-label="Próximo banner"]',
    ) as HTMLButtonElement;
    const previous = fixture.nativeElement.querySelector(
      '[aria-label="Banner anterior"]',
    ) as HTMLButtonElement;
    const cta = () =>
      fixture.nativeElement.querySelector('.hero-slide.is-active a') as HTMLAnchorElement;
    expect(cta().getAttribute('href')).toBe('/catalogo?pollingRateMin=4000&tipoSwitch=1');
    next.click();
    fixture.detectChanges();
    expect(cta().getAttribute('href')).toBe('/catalogo?ordenar=maior-dpi');
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('2 de 4');
    (
      fixture.nativeElement.querySelectorAll('.hero-indicators button')[2] as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(cta().getAttribute('href')).toBe('/catalogo?pesoMax=59.99&ordenar=menor-peso');
    next.click();
    fixture.detectChanges();
    expect(cta().getAttribute('href')).toBe('/catalogo');
    next.click();
    fixture.detectChanges();
    previous.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.indice()).toBe(3);
    vi.advanceTimersByTime(14000);
    expect(fixture.componentInstance.indice()).toBe(3);
  });
});
