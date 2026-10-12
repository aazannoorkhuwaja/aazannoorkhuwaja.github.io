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
    [320,568],[360,800],[375,812],[390,844],[430,932],
    [568,320],[844,390],[932,430],
    [768,1024],[820,1180],[900,900],[1024,768],
    [1280,800],[1366,768],[1440,900],[1920,1080],[2560,1440],
  ],
  webkit: [
    [320,568],[375,812],[390,844],[430,932],
    [667,375],[844,390],[932,430],
    [768,1024],[1024,768],[1440,900],
  ],
  firefox: [
    [360,800],[390,844],[844,390],[820,1180],[1024,768],[1440,900],
  ],
};

const engines = { chromium, firefox, webkit };
const failures = [];
const passes = [];
await fs.mkdir(OUT, { recursive: true });

const slug = (...parts) => parts.join('-').replace(/[^a-z0-9_-]+/gi, '-').toLowerCase();
const fail = (id, detail) => failures.push(`${id}: ${detail}`);
const touchLike = (w,h) => w <= 900 || Math.min(w,h) <= 700;
const compactFor = (w,h) => w <= 899 || (touchLike(w,h) && Math.min(w,h) <= 700);

async function getLayout(page) {
  return page.evaluate(() => {
    const $ = s => document.querySelector(s);
    const css = s => $(s) ? getComputedStyle($(s)) : null;
    const box = s => {
      const e = $(s); if (!e) return null;
      const r = e.getBoundingClientRect();
      return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};
    };
    const brand = $('.portfolio-brand-copy strong');
    const hero = $('.portfolio-hero h1');
    return {
      compact: document.documentElement.dataset.compactUi,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      desktopDisplay: css('.portfolio-nav-desktop')?.display || null,
      mobileDisplay: css('.portfolio-nav-mobile')?.display || null,
      brand: box('.portfolio-brand'),
      brandClient: brand?.clientWidth || 0,
      brandScroll: brand?.scrollWidth || 0,
      brandHeight: brand?.getBoundingClientRect().height || 0,
      hero: hero ? box('.portfolio-hero h1') : null,
      heroFont: hero ? parseFloat(getComputedStyle(hero).fontSize) : null,
      heroColumns: $('.portfolio-hero') ? getComputedStyle($('.portfolio-hero')).gridTemplateColumns : null,
    };
  });
}

async function overflowers(page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const bad = [];
    for (const el of document.body.querySelectorAll('*')) {
      if (!(el instanceof HTMLElement)) continue;
      if (el.id === 'the-top' || el.closest('#the-top') || ['SCRIPT','STYLE','PATH'].includes(el.tagName)) continue;
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (r.right > vw + 2 || r.left < -2) {
        bad.push({tag:el.tagName,id:el.id,cls:String(el.className||'').slice(0,120),left:Math.round(r.left),right:Math.round(r.right),vw});
        if (bad.length >= 8) break;
      }
    }
    return bad;
  });
}

async function checkRoute(page, browser, w, h, route, compact) {
  const id = `${browser}/${w}x${h}/${route.name}`;
  const res = await page.goto(`${BASE_URL}${route.path}`, {waitUntil:'networkidle',timeout:30000});
  if (!res?.ok()) { fail(id, `HTTP ${res?.status() ?? 'none'}`); return; }
  await page.waitForTimeout(50);
  const L = await getLayout(page);
  if (L.scrollWidth > L.clientWidth + 2) fail(id, `document overflow ${L.scrollWidth}>${L.clientWidth}`);
  const bad = await overflowers(page);
  if (bad.length) fail(id, `visible overflow ${JSON.stringify(bad.slice(0,3))}`);

  const desktop = L.desktopDisplay !== 'none', mobile = L.mobileDisplay !== 'none';
  if (desktop === mobile) fail(id, `nav collision desktop=${L.desktopDisplay} mobile=${L.mobileDisplay}`);
  if (compact && (!mobile || desktop)) fail(id, 'compact nav expectation failed');
  if (!compact && (!desktop || mobile)) fail(id, 'desktop nav expectation failed');

  if (L.brand) {
    if (L.brand.left < -2 || L.brand.right > L.clientWidth + 2) fail(id, 'brand exits viewport');
    if (L.brandScroll > L.brandClient + 2) fail(id, 'brand is clipped');
    if (L.brandHeight > 48) fail(id, `brand wrapped (${L.brandHeight}px)`);
  }
  if (route.name === 'home' && compact && L.hero) {
    if (L.hero.left < -2 || L.hero.right > L.clientWidth + 2) fail(id, 'hero exits viewport');
    if (L.heroFont > 56) fail(id, `hero too large (${L.heroFont}px)`);
    if (L.heroColumns?.trim().split(/\s+/).length > 1) fail(id, `hero did not stack (${L.heroColumns})`);
  }

  if (route.name === 'home' && await page.locator('.project-card').count() < 4) fail(id, 'homepage project evidence missing');
  if (route.name === 'about' && await page.locator('.profile-proof-card').count() < 4) fail(id, 'About proof cards missing');
  if (route.name === 'projects' && !(await page.locator('h1').first().textContent())?.includes('Projects')) fail(id, 'Projects title missing');
  if (route.name === 'flashyt' && await page.locator('.author').count()) fail(id, 'bulky theme author block returned');
  passes.push(id);
}

async function checkMenu(page, browser, w, h) {
  const id = `${browser}/${w}x${h}/menu`;
  await page.goto(`${BASE_URL}/`, {waitUntil:'networkidle'});
  const trigger = page.locator('.mobile-menu-trigger');
  const tb = await trigger.boundingBox();
  if (!tb || tb.width < 44 || tb.height < 44) { fail(id, `trigger target ${JSON.stringify(tb)}`); return; }
  await trigger.click();
  await page.waitForTimeout(180);
  const dialog = page.locator('.mobile-menu-dialog');
  const state = await dialog.evaluate(el => {
    const r=el.getBoundingClientRect(), s=getComputedStyle(el);
    return {visibility:s.visibility,opacity:Number(s.opacity),left:r.left,top:r.top,right:r.right,bottom:r.bottom,bg:s.backgroundColor};
  });
  if (state.visibility !== 'visible' || state.opacity < .99) fail(id, `menu visibility ${JSON.stringify(state)}`);
  if (Math.abs(state.left)>1 || Math.abs(state.top)>1 || Math.abs(state.right-w)>2 || Math.abs(state.bottom-h)>2) fail(id, `menu coverage ${JSON.stringify(state)}`);
  const bodyOverflow = await page.locator('body').evaluate(el => getComputedStyle(el).overflow);
  if (bodyOverflow !== 'hidden') fail(id, `body scroll not locked (${bodyOverflow})`);
  const cb = await page.locator('.mobile-menu-close').boundingBox();
  if (!cb || cb.width < 44 || cb.height < 44) fail(id, `close target ${JSON.stringify(cb)}`);
  if (await page.locator('.mobile-menu-links a').count() < 4) fail(id, 'mobile links missing');
  await page.locator('.mobile-menu-close').click();
  await page.waitForTimeout(180);
  if (await dialog.evaluate(el => getComputedStyle(el).visibility) !== 'hidden') fail(id, 'menu did not close');
}

async function setTheme(page, compact, target) {
  const darkNow = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  if ((target === 'dark') === darkNow) return;
  if (compact) {
    await page.locator('.mobile-menu-trigger').click();
    await page.waitForTimeout(80);
    await page.locator('#appearance-switcher-mobile').click();
    await page.waitForTimeout(100);
    await page.locator('.mobile-menu-close').click();
    await page.waitForTimeout(100);
  } else {
    await page.locator('#appearance-switcher').click();
    await page.waitForTimeout(120);
  }
}

async function checkTheme(page, browser, w, h, compact) {
  const id = `${browser}/${w}x${h}/theme-toggle`;
  await page.goto(`${BASE_URL}/`, {waitUntil:'networkidle'});
  await setTheme(page, compact, 'light');
  let state = await page.evaluate(() => ({
    dark: document.documentElement.classList.contains('dark'),
    brand: getComputedStyle(document.querySelector('.portfolio-brand-copy strong')).color,
    body: getComputedStyle(document.body).backgroundColor,
  }));
  if (state.dark) fail(id, 'failed to switch to light');
  const nums = (state.brand.match(/[\d.]+/g)||[]).slice(0,3).map(Number);
  if (nums.length===3 && nums.every(n => n > 210)) fail(id, `light-mode brand too pale (${state.brand})`);
  await setTheme(page, compact, 'dark');
  state = await page.evaluate(() => ({dark:document.documentElement.classList.contains('dark')}));
  if (!state.dark) fail(id, 'failed to switch back to dark');
}

async function checkReducedMotion(page, browser, w, h) {
  const id = `${browser}/${w}x${h}/reduced-motion`;
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(`${BASE_URL}/`, {waitUntil:'networkidle'});
  const srcs = await page.locator('.motion-demo img').evaluateAll(xs => xs.map(x => x.currentSrc || x.src));
  if (srcs.some(s => /\.gif(?:$|\?)/i.test(s))) fail(id, `GIF under reduced motion: ${srcs.join(',')}`);
  await page.emulateMedia({reducedMotion:'no-preference'});
}

async function shot(page, name) { await page.screenshot({path:path.join(OUT,`${name}.png`),fullPage:true}); }

for (const [browserName, factory] of Object.entries(engines)) {
  const browser = await factory.launch({headless:true});
  try {
    for (const [w,h] of matrices[browserName]) {
      const touch = touchLike(w,h);
      const compact = compactFor(w,h);
      const options = {viewport:{width:w,height:h},screen:{width:w,height:h},colorScheme:'dark',hasTouch:touch,deviceScaleFactor:Math.min(w,h)<=600?2:1};
      if (browserName !== 'firefox') options.isMobile = Math.min(w,h) <= 600;
      const context = await browser.newContext(options);
      const page = await context.newPage();

      for (const route of routes) await checkRoute(page,browserName,w,h,route,compact);
      if (compact) await checkMenu(page,browserName,w,h);
      if ((w===390 && h===844) || (w===1024 && h===768)) await checkTheme(page,browserName,w,h,compact);
      if (browserName !== 'firefox' && ((w===390&&h===844)||(w===1024&&h===768))) await checkReducedMotion(page,browserName,w,h);

      const allRouteShots = (browserName==='webkit'&&w===390&&h===844) || (browserName==='chromium'&&w===1024&&h===768);
      const homeShots = allRouteShots || (browserName==='chromium' && [[320,568],[430,932],[820,1180],[1440,900],[2560,1440]].some(([a,b])=>a===w&&b===h)) || (browserName==='webkit' && [[768,1024],[1024,768]].some(([a,b])=>a===w&&b===h));

      if (homeShots) {
        const shotRoutes = allRouteShots ? routes : [routes[0]];
        for (const route of shotRoutes) {
          await page.goto(`${BASE_URL}${route.path}`, {waitUntil:'networkidle'});
          await setTheme(page,compact,'dark');
          await shot(page,slug(browserName,`${w}x${h}`,route.name,'dark'));
          await setTheme(page,compact,'light');
          await shot(page,slug(browserName,`${w}x${h}`,route.name,'light'));
          await setTheme(page,compact,'dark');
        }
      }
      await context.close();
    }

    if (browserName === 'chromium' || browserName === 'webkit') {
      const context = await browser.newContext({viewport:{width:980,height:844},screen:{width:980,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2,colorScheme:'dark'});
      await context.addInitScript(() => {
        try {
          Object.defineProperty(window.screen,'width',{configurable:true,get:()=>390});
          Object.defineProperty(window.screen,'height',{configurable:true,get:()=>844});
          const native = window.matchMedia.bind(window);
          window.matchMedia = q => (q.includes('pointer: coarse')||q.includes('any-pointer: coarse'))
            ? {matches:true,media:q,onchange:null,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){},dispatchEvent(){return false;}}
            : native(q);
        } catch {}
      });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/`, {waitUntil:'networkidle'});
      const L=await getLayout(page), id=`${browserName}/in-app-phone-layout-viewport`;
      if (L.compact!=='true') fail(id,`compact fallback inactive (${L.compact})`);
      if (L.desktopDisplay!=='none'||L.mobileDisplay==='none') fail(id,'nav fallback failed');
      if (L.heroFont>56) fail(id,`hero desktop-sized (${L.heroFont})`);
      if (L.heroColumns?.trim().split(/\s+/).length>1) fail(id,`hero not stacked (${L.heroColumns})`);
      await shot(page,slug(browserName,'in-app-phone-fallback'));
      await context.close();
    }
  } finally { await browser.close(); }
}

const report={baseUrl:BASE_URL,checkedAt:new Date().toISOString(),passingRouteChecks:passes.length,failures};
await fs.writeFile(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
console.log(`Responsive QA completed: ${passes.length} route checks, ${failures.length} failures.`);
if(failures.length){console.error('\nFAILURES');failures.forEach((f,i)=>console.error(`${i+1}. ${f}`));process.exit(1);}
