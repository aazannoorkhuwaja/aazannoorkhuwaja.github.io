import { chromium, firefox, webkit } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:4173';
const OUT = process.env.QA_ARTIFACTS || 'qa-artifacts';

const routes = [
  { name: 'home', path: '/' },
  { name: 'projects', path: '/page/projects/' },
  { name: 'about', path: '/page/about/' },
  { name: 'contact', path: '/page/contact/' },
  { name: 'writing', path: '/post/' },
  { name: 'flashyt', path: '/flashyt/' },
];

const matrices = {
  chromium: [
    [320, 568], [360, 800], [375, 812], [390, 844], [430, 932],
    [768, 1024], [820, 1180], [900, 900], [1024, 768],
    [1280, 800], [1366, 768], [1440, 900], [1920, 1080], [2560, 1440],
  ],
  webkit: [
    [320, 568], [375, 812], [390, 844], [430, 932],
    [768, 1024], [1024, 768], [1440, 900],
  ],
  firefox: [
    [360, 800], [390, 844], [820, 1180], [1024, 768], [1440, 900],
  ],
};

const engines = { chromium, firefox, webkit };
const failures = [];
const results = [];

await fs.mkdir(OUT, { recursive: true });

function slug(...parts) {
  return parts.join('-').replace(/[^a-z0-9_-]+/gi, '-').toLowerCase();
}

function fail(test, detail) {
  failures.push(`${test}: ${detail}`);
}

async function getLayout(page) {
  return page.evaluate(() => {
    const $ = (sel) => document.querySelector(sel);
    const css = (sel) => {
      const el = $(sel);
      return el ? getComputedStyle(el) : null;
    };
    const rect = (sel) => {
      const el = $(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
    };
    const brandStrong = $('.portfolio-brand-copy strong');
    const hero = $('.portfolio-hero h1');
    const html = document.documentElement;
    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      compact: html.dataset.compactUi,
      scrollWidth: html.scrollWidth,
      clientWidth: html.clientWidth,
      desktopDisplay: css('.portfolio-nav-desktop')?.display || null,
      mobileDisplay: css('.portfolio-nav-mobile')?.display || null,
      brand: rect('.portfolio-brand'),
      brandTextClientWidth: brandStrong?.clientWidth || 0,
      brandTextScrollWidth: brandStrong?.scrollWidth || 0,
      brandTextHeight: brandStrong?.getBoundingClientRect().height || 0,
      hero: hero ? rect('.portfolio-hero h1') : null,
      heroFont: hero ? parseFloat(getComputedStyle(hero).fontSize) : null,
    };
  });
}

async function visibleOverflowers(page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const ignore = (el) =>
      el.id === 'the-top' ||
      el.closest('#the-top') ||
      el.classList.contains('medium-zoom-overlay') ||
      el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'PATH';

    const bad = [];
    for (const el of document.body.querySelectorAll('*')) {
      if (!(el instanceof HTMLElement) || ignore(el)) continue;
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (r.right > vw + 2 || r.left < -2) {
        bad.push({
          tag: el.tagName,
          id: el.id,
          cls: String(el.className || '').slice(0, 140),
          left: Math.round(r.left),
          right: Math.round(r.right),
          width: Math.round(r.width),
          vw,
        });
        if (bad.length >= 12) break;
      }
    }
    return bad;
  });
}

async function checkRoute(page, browserName, width, height, route, compactExpected) {
  const id = `${browserName}/${width}x${height}/${route.name}`;
  const response = await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle', timeout: 30000 });
  if (!response || !response.ok()) {
    fail(id, `HTTP ${response?.status() ?? 'no response'}`);
    return;
  }

  await page.waitForTimeout(80);
  const layout = await getLayout(page);

  if (layout.scrollWidth > layout.clientWidth + 2) {
    fail(id, `document overflow ${layout.scrollWidth}px > ${layout.clientWidth}px`);
  }

  const bad = await visibleOverflowers(page);
  if (bad.length) fail(id, `visible horizontal overflow: ${JSON.stringify(bad.slice(0, 4))}`);

  const desktopVisible = layout.desktopDisplay !== 'none';
  const mobileVisible = layout.mobileDisplay !== 'none';
  if (desktopVisible === mobileVisible) {
    fail(id, `nav collision: desktop=${layout.desktopDisplay}, mobile=${layout.mobileDisplay}`);
  }
  if (compactExpected && (!mobileVisible || desktopVisible)) {
    fail(id, `expected compact nav; desktop=${layout.desktopDisplay}, mobile=${layout.mobileDisplay}`);
  }
  if (!compactExpected && (!desktopVisible || mobileVisible)) {
    fail(id, `expected desktop nav; desktop=${layout.desktopDisplay}, mobile=${layout.mobileDisplay}`);
  }

  if (layout.brand) {
    if (layout.brand.right > layout.clientWidth + 2 || layout.brand.left < -2) fail(id, 'brand exits viewport');
    if (layout.brandTextScrollWidth > layout.brandTextClientWidth + 2) fail(id, 'brand text is clipped/truncated');
    if (layout.brandTextHeight > 48) fail(id, `brand wrapped vertically (${layout.brandTextHeight}px)`);
  }

  if (route.name === 'home' && compactExpected && layout.hero) {
    if (layout.hero.right > layout.clientWidth + 2 || layout.hero.left < -2) fail(id, 'hero heading exits viewport');
    if (layout.heroFont > 56) fail(id, `compact hero font too large (${layout.heroFont}px)`);
    const columns = await page.locator('.portfolio-hero').evaluate(el => getComputedStyle(el).gridTemplateColumns);
    if (columns.trim().split(/\s+/).length > 1) fail(id, `hero did not stack: ${columns}`);
  }

  // Route-specific integrity checks.
  if (route.name === 'home') {
    const count = await page.locator('.project-card').count();
    if (count < 4) fail(id, `homepage project cards missing (${count})`);
  }
  if (route.name === 'about') {
    const count = await page.locator('.profile-proof-card').count();
    if (count < 4) fail(id, `proof/certification cards missing (${count})`);
  }
  if (route.name === 'projects') {
    const title = await page.locator('h1').first().textContent();
    if (!title?.includes('Projects')) fail(id, 'Projects title missing');
  }
  if (route.name === 'flashyt') {
    const authorBlocks = await page.locator('.author').count();
    if (authorBlocks) fail(id, `bulky theme author block returned (${authorBlocks})`);
  }

  results.push({ id, ok: true });
}

async function checkMobileMenu(page, browserName, width, height) {
  const id = `${browserName}/${width}x${height}/menu`;
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(60);

  const trigger = page.locator('.mobile-menu-trigger');
  const box = await trigger.boundingBox();
  if (!box || box.width < 44 || box.height < 44) {
    fail(id, `menu trigger touch target <44px: ${JSON.stringify(box)}`);
    return;
  }

  await trigger.click();
  const dialog = page.locator('.mobile-menu-dialog');
  await page.waitForTimeout(180);
  const state = await dialog.evaluate(el => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return { visible: s.visibility, opacity: s.opacity, left: r.left, top: r.top, right: r.right, bottom: r.bottom, bg: s.backgroundColor };
  });
  if (state.visible !== 'visible' || Number(state.opacity) < .99) fail(id, `menu not fully visible: ${JSON.stringify(state)}`);
  if (Math.abs(state.left) > 1 || Math.abs(state.top) > 1 || Math.abs(state.right - width) > 2 || Math.abs(state.bottom - height) > 2) {
    fail(id, `menu does not cover viewport: ${JSON.stringify(state)}`);
  }
  if (state.bg.includes('rgba') && /,\s*0\.?\d*\)/.test(state.bg)) fail(id, `menu background translucent: ${state.bg}`);

  const bodyOverflow = await page.locator('body').evaluate(el => getComputedStyle(el).overflow);
  if (bodyOverflow !== 'hidden') fail(id, `body not scroll-locked (${bodyOverflow})`);

  const close = page.locator('.mobile-menu-close');
  const closeBox = await close.boundingBox();
  if (!closeBox || closeBox.width < 44 || closeBox.height < 44) fail(id, `close target <44px: ${JSON.stringify(closeBox)}`);

  const links = await page.locator('.mobile-menu-links a').count();
  if (links < 4) fail(id, `mobile nav links missing (${links})`);

  await close.click();
  await page.waitForTimeout(180);
  const visibility = await dialog.evaluate(el => getComputedStyle(el).visibility);
  if (visibility !== 'hidden') fail(id, `menu did not close (${visibility})`);
}

async function checkReducedMotion(page, browserName, width, height) {
  const id = `${browserName}/${width}x${height}/reduced-motion`;
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  const currentSources = await page.locator('.motion-demo img').evaluateAll(imgs => imgs.map(i => i.currentSrc || i.src));
  if (currentSources.some(src => /\.gif(?:$|\?)/i.test(src))) fail(id, `GIF selected under reduced motion: ${currentSources.join(', ')}`);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
}

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
}

for (const [browserName, factory] of Object.entries(engines)) {
  const browser = await factory.launch({ headless: true });
  try {
    for (const [width, height] of matrices[browserName]) {
      const context = await browser.newContext({
        viewport: { width, height },
        screen: { width, height },
        colorScheme: 'dark',
        hasTouch: width <= 900,
        isMobile: width <= 600,
        deviceScaleFactor: width <= 600 ? 2 : 1,
      });
      const page = await context.newPage();
      const compactExpected = width <= 899;

      for (const route of routes) {
        await checkRoute(page, browserName, width, height, route, compactExpected);
      }

      if (compactExpected) await checkMobileMenu(page, browserName, width, height);
      if ((width === 390 || width === 1024) && browserName !== 'firefox') await checkReducedMotion(page, browserName, width, height);

      // Key reference screenshots, both themes where useful.
      if (
        (browserName === 'webkit' && [390, 768, 1024].includes(width)) ||
        (browserName === 'chromium' && [320, 430, 820, 1024, 1440, 2560].includes(width))
      ) {
        await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
        await screenshot(page, slug(browserName, `${width}x${height}`, 'home-dark'));
        await page.evaluate(() => document.documentElement.classList.remove('dark'));
        await screenshot(page, slug(browserName, `${width}x${height}`, 'home-light'));
      }

      await context.close();
    }

    // Reproduce the class of in-app browser bug where the layout viewport looks desktop-ish
    // while the physical screen and pointer are clearly phone-sized.
    if (browserName === 'chromium' || browserName === 'webkit') {
      const context = await browser.newContext({
        viewport: { width: 980, height: 844 },
        screen: { width: 980, height: 844 },
        hasTouch: true,
        isMobile: true,
        deviceScaleFactor: 2,
      });
      await context.addInitScript(() => {
        try {
          Object.defineProperty(window.screen, 'width', { configurable: true, get: () => 390 });
          Object.defineProperty(window.screen, 'height', { configurable: true, get: () => 844 });
          const original = window.matchMedia.bind(window);
          window.matchMedia = (query) => {
            if (query.includes('pointer: coarse') || query.includes('any-pointer: coarse')) {
              return { matches: true, media: query, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; } };
            }
            return original(query);
          };
        } catch {}
      });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
      const state = await getLayout(page);
      const id = `${browserName}/in-app-phone-layout-viewport`;
      if (state.compact !== 'true') fail(id, `compact fallback did not activate (${state.compact})`);
      if (state.desktopDisplay !== 'none' || state.mobileDisplay === 'none') fail(id, `nav fallback failed: ${JSON.stringify(state)}`);
      if (state.heroFont > 56) fail(id, `hero remained desktop-sized (${state.heroFont}px)`);
      const cols = await page.locator('.portfolio-hero').evaluate(el => getComputedStyle(el).gridTemplateColumns);
      if (cols.trim().split(/\s+/).length > 1) fail(id, `hero fallback did not stack (${cols})`);
      await screenshot(page, slug(browserName, 'in-app-phone-fallback'));
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

const report = {
  baseUrl: BASE_URL,
  checkedAt: new Date().toISOString(),
  passingChecks: results.length,
  failures,
};
await fs.writeFile(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));

console.log(`Responsive QA completed: ${results.length} route checks, ${failures.length} failures.`);
if (failures.length) {
  console.error('\nFAILURES');
  failures.forEach((f, i) => console.error(`${i + 1}. ${f}`));
  process.exit(1);
}
