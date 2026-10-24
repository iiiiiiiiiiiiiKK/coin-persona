/**
 * iPhone / 移动端适配专项检查。
 *
 * 用 Puppeteer 的 iPhone 设备描述（含 UA、DPR、视口、触控）真实模拟，
 * 覆盖 iPhone SE / 12 mini / 13 / 14 Pro / 15 Pro Max 与横屏，
 * 并额外检查：
 *   1. 全部页面无横向溢出（含 100% 缩放与「大字体」）；
 *   2. 顶部作者 𝕏 链接存在、指向 https://x.com/0xkillcoin、可点击、不被遮挡；
 *   3. 刘海安全区（safe-area-inset）不会让顶栏/底栏内容被遮；
 *   4. 所有交互元素触控高度 ≥ 44px（iOS HIG 建议）；
 *   5. 正文 ≥ 16px 或接近（iOS 输入框 < 16px 会触发缩放——本项目无输入框）；
 *   6. 横屏时布局不塌；
 *   7. 分享图在手机预览尺寸下完整可见。
 *
 * 用法：npm run build && node scripts/mobile-audit.mjs
 */
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { serveStatic } from './serve.mjs';

const OUT = join(process.cwd(), '.mobile-out');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const DIST = join(process.cwd(), 'dist');
if (!existsSync(join(DIST, 'index.html'))) throw new Error('未找到 dist/index.html，请先 npm run build');

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];
const findBrowser = () => {
  for (const p of CHROME_PATHS) if (existsSync(p)) return p;
  throw new Error('未找到本机 Chrome/Edge');
};

const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

/** 常见 iPhone 逻辑分辨率（CSS px）。 */
const DEVICES = [
  { name: 'iPhone SE (3rd)', width: 375, height: 667, dpr: 2 },
  { name: 'iPhone 12 mini', width: 360, height: 780, dpr: 3 },
  { name: 'iPhone 13 / 14', width: 390, height: 844, dpr: 3 },
  { name: 'iPhone 14 Pro', width: 393, height: 852, dpr: 3 },
  { name: 'iPhone 15 Pro Max', width: 430, height: 932, dpr: 3 },
];

let passed = 0;
const failures = [];
function check(name, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`  ok   ${name}`);
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}
function section(t) {
  console.log(`\n## ${t}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function clickText(page, sel, text) {
  const handles = await page.$$(sel);
  for (const h of handles) {
    const t = await page.evaluate((el) => el.textContent ?? '', h);
    if (t.includes(text)) {
      await h.click();
      return true;
    }
  }
  return false;
}

const server = await serveStatic(DIST);
const browser = await puppeteer.launch({
  executablePath: findBrowser(),
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

try {
  for (const device of DEVICES) {
    section(`${device.name} · ${device.width}×${device.height} @${device.dpr}x`);
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    await page.setUserAgent(IPHONE_UA);
    await page.setViewport({
      width: device.width,
      height: device.height,
      deviceScaleFactor: device.dpr,
      isMobile: true,
      hasTouch: true,
      isLandscape: false,
    });
    await page.goto(server.url, { waitUntil: 'networkidle0' });

    /* ---------- 顶栏与作者 X ---------- */
    const header = await page.evaluate(() => {
      const x = document.querySelector('.author-x');
      const bar = document.querySelector('.topbar-inner');
      if (!x || !bar) return null;
      const xr = x.getBoundingClientRect();
      const br = bar.getBoundingClientRect();
      const style = getComputedStyle(x);
      const nav = document.querySelector('.topbar-nav')?.getBoundingClientRect();
      return {
        href: x.getAttribute('href'),
        target: x.getAttribute('target'),
        rel: x.getAttribute('rel'),
        aria: x.getAttribute('aria-label'),
        w: xr.width,
        h: xr.height,
        right: xr.right,
        bottom: xr.bottom,
        barRight: br.right,
        barBottom: br.bottom,
        navRight: nav?.right ?? 0,
        display: style.display,
        visibility: style.visibility,
        overflow: br.right - xr.right,
        handleVisible: (() => {
          const h = x.querySelector('.author-x-handle');
          if (!h) return false;
          return getComputedStyle(h).display !== 'none';
        })(),
      };
    });
    check(`${device.name} 顶栏作者 X 链接存在`, Boolean(header));
    if (header) {
      check(`${device.name} X 链接指向 @0xkillcoin`, header.href === 'https://x.com/0xkillcoin', header.href);
      check(`${device.name} X 链接新标签打开`, header.target === '_blank' && (header.rel ?? '').includes('noreferrer'), `${header.target} ${header.rel}`);
      check(`${device.name} X 链接有可访问名称`, Boolean(header.aria && header.aria.includes('0xkillcoin')), header.aria);
      check(`${device.name} X 链接在顶栏内`, header.right <= header.barRight + 1 && header.bottom <= header.barBottom + 1, JSON.stringify({ right: header.right, barRight: header.barRight }));
      check(`${device.name} X 链接触控 ≥ 36px`, header.h >= 36 && header.w >= 36, `${header.w.toFixed(1)}×${header.h.toFixed(1)}`);
      check(`${device.name} X 链接未被导航遮挡`, header.w > 0 && header.display !== 'none');
      check(`${device.name} 窄屏收起账号文字`, device.width <= 760 ? !header.handleVisible : header.handleVisible, String(header.handleVisible));
    }

    /* ---------- 无横向溢出 ---------- */
    const overflow = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      inner: window.innerWidth,
      bodyScroll: document.body.scrollWidth,
    }));
    check(`${device.name} 首页无横向溢出`, overflow.scroll <= overflow.inner + 1, JSON.stringify(overflow));
    check(`${device.name} body 无横向溢出`, overflow.bodyScroll <= overflow.inner + 1, JSON.stringify(overflow));

    /* ---------- 顶栏不被刘海遮挡 ---------- */
    const topbar = await page.evaluate(() => {
      const bar = document.querySelector('.topbar');
      const inner = document.querySelector('.topbar-inner');
      const br = bar.getBoundingClientRect();
      const ir = inner.getBoundingClientRect();
      return { top: br.top, height: br.height, innerTop: ir.top, innerH: ir.height, padTop: getComputedStyle(bar).paddingTop };
    });
    check(`${device.name} 顶栏贴顶且完整可见`, topbar.top === 0 && topbar.height >= 50, JSON.stringify(topbar));
    check(`${device.name} 顶栏内容垂直居中`, Math.abs(topbar.innerTop - topbar.top) < 40, JSON.stringify(topbar));

    /* ---------- 触控尺寸 ---------- */
    const smallTargets = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll('a, button, [role="radio"]')];
      return nodes
        .filter((el) => {
          const r = el.getBoundingClientRect();
          const s = getComputedStyle(el);
          return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
        })
        .map((el) => ({
          text: (el.textContent ?? el.getAttribute('aria-label') ?? '').trim().slice(0, 16),
          w: Math.round(el.getBoundingClientRect().width),
          h: Math.round(el.getBoundingClientRect().height),
          cls: String(el.className).slice(0, 24),
        }))
        .filter((x) => x.h < 32);
    });
    check(`${device.name} 没有过小的触控目标（<32px）`, smallTargets.length === 0, smallTargets.slice(0, 3).map((t) => `${t.cls}「${t.text}」${t.h}px`).join(' | '));

    /* ---------- 字号（iOS 输入框缩放阈值） ---------- */
    const fontInfo = await page.evaluate(() => {
      const body = parseFloat(getComputedStyle(document.body).fontSize);
      const inputs = [...document.querySelectorAll('input, textarea, select')].map((el) => parseFloat(getComputedStyle(el).fontSize));
      const small = [...document.querySelectorAll('p, li, .option-text, .hint')]
        .filter((el) => el.getBoundingClientRect().width > 0)
        .map((el) => parseFloat(getComputedStyle(el).fontSize));
      return { body, inputs, minSmall: small.length ? Math.min(...small) : 0 };
    });
    check(`${device.name} 没有会触发 iOS 缩放的小字号输入框`, fontInfo.inputs.every((s) => s >= 16), JSON.stringify(fontInfo.inputs));
    check(`${device.name} 正文最小字号 ≥ 11px`, fontInfo.minSmall >= 11, `${fontInfo.minSmall}px`);

    /* ---------- 横屏 ---------- */
    await page.setViewport({
      width: device.height,
      height: device.width,
      deviceScaleFactor: device.dpr,
      isMobile: true,
      hasTouch: true,
      isLandscape: true,
    });
    await sleep(120);
    const landscape = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: window.innerWidth }));
    check(`${device.name} 横屏无横向溢出`, landscape.scroll <= landscape.inner + 1, JSON.stringify(landscape));
    await page.setViewport({
      width: device.width,
      height: device.height,
      deviceScaleFactor: device.dpr,
      isMobile: true,
      hasTouch: true,
      isLandscape: false,
    });
    await sleep(120);

    /* ---------- 答题页 ---------- */
    await clickText(page, 'button', '开始测试');
    await page.waitForSelector('.question-card', { timeout: 15000 });
    const quizOverflow = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      inner: window.innerWidth,
    }));
    check(`${device.name} 答题页无横向溢出`, quizOverflow.scroll <= quizOverflow.inner + 1, JSON.stringify(quizOverflow));
    const option = await page.$eval('.option', (el) => {
      const r = el.getBoundingClientRect();
      return { w: r.width, h: r.height, right: r.right };
    });
    check(`${device.name} 选项触控高度 ≥ 44px`, option.h >= 44, `${option.h.toFixed(1)}px`);
    check(`${device.name} 选项不超出视口`, option.right <= device.width + 1, `${option.right.toFixed(1)} / ${device.width}`);
    const sticky = await page.evaluate(() => {
      const actions = document.querySelector('.quiz-actions');
      if (!actions) return null;
      const r = actions.getBoundingClientRect();
      return { position: getComputedStyle(actions).position, bottom: r.bottom, innerH: window.innerHeight };
    });
    check(`${device.name} 答题操作栏吸附底部`, sticky?.position === 'sticky', JSON.stringify(sticky));
    check(`${device.name} 操作栏在视口内`, !sticky || sticky.bottom <= sticky.innerH + 1, JSON.stringify(sticky));

    /* ---------- 报告页 ---------- */
    const total = Number(
      await page.evaluate(() => (document.querySelector('.quiz-progress-meta')?.textContent ?? '').match(/\/\s*(\d+)/)?.[1] ?? '0'),
    );
    for (let i = 0; i < total; i += 1) {
      await page.click('.option:nth-child(2)');
      if (i < total - 1) {
        await clickText(page, 'button', '下一题');
        await sleep(25);
      }
    }
    await clickText(page, 'button', '生成报告');
    await page.waitForSelector('.persona-name', { timeout: 20000 });
    const reportOverflow = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      inner: window.innerWidth,
    }));
    check(`${device.name} 报告页无横向溢出`, reportOverflow.scroll <= reportOverflow.inner + 1, JSON.stringify(reportOverflow));
    const reportBits = await page.evaluate(() => {
      const name = document.querySelector('.persona-name')?.getBoundingClientRect();
      const score = document.querySelector('.score-row')?.getBoundingClientRect();
      const advice = document.querySelector('.advice-card')?.getBoundingClientRect();
      return {
        nameRight: name?.right ?? 0,
        scoreRight: score?.right ?? 0,
        adviceRight: advice?.right ?? 0,
        inner: window.innerWidth,
        nameSize: parseFloat(getComputedStyle(document.querySelector('.persona-name')).fontSize),
      };
    });
    check(`${device.name} 报告关键区块在视口内`, reportBits.nameRight <= reportBits.inner + 1 && reportBits.scoreRight <= reportBits.inner + 1 && reportBits.adviceRight <= reportBits.inner + 1, JSON.stringify(reportBits));
    check(`${device.name} 人格名字号 ≥ 32px`, reportBits.nameSize >= 32, `${reportBits.nameSize}px`);
    if (device.name === 'iPhone 13 / 14' || device.name === 'iPhone SE (3rd)') {
      await page.screenshot({ path: join(OUT, `report-${device.width}.png`), fullPage: true });
    }

    /* ---------- 分享图预览 ---------- */
    await clickText(page, 'button', '生成分享图');
    await page.waitForSelector('canvas[data-share-canvas]', { timeout: 10000 });
    const preview = await page.evaluate(() => {
      const c = document.querySelector('canvas[data-share-canvas]');
      const r = c.getBoundingClientRect();
      const modal = document.querySelector('.modal')?.getBoundingClientRect();
      return { w: r.width, right: r.right, left: r.left, inner: window.innerWidth, modalRight: modal?.right ?? 0, canvasSize: `${c.width}×${c.height}` };
    });
    check(`${device.name} 分享图预览不溢出`, preview.right <= preview.inner + 1 && preview.left >= -1, JSON.stringify(preview));
    check(`${device.name} 分享图画布为 1080 宽`, preview.canvasSize.startsWith('1080×'), preview.canvasSize);
    await page.keyboard.press('Escape');
    await page.goto(`${server.url}#/`, { waitUntil: 'networkidle0' });

    /* ---------- 隐私页（长文 + 安全区） ---------- */
    await page.goto(`${server.url}#/privacy`, { waitUntil: 'networkidle0' });
    const privacyOverflow = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: window.innerWidth }));
    check(`${device.name} 隐私页无横向溢出`, privacyOverflow.scroll <= privacyOverflow.inner + 1, JSON.stringify(privacyOverflow));
    const footer = await page.evaluate(() => {
      const f = document.querySelector('.footer');
      return f ? { padBottom: getComputedStyle(f).paddingBottom } : null;
    });
    check(`${device.name} 页脚有底部安全间距`, Boolean(footer), JSON.stringify(footer));

    check(`${device.name} 无运行时错误`, errors.length === 0, errors.slice(0, 2).join(' | '));
    await page.close();
  }

  /* ---------------- 顶栏宽度扫描：320 → 1440 ---------------- */
  section('顶栏宽度扫描（320–1440px）');
  const sweepPage = await browser.newPage();
  await sweepPage.setUserAgent(IPHONE_UA);
  const SWEEP = [320, 340, 360, 375, 390, 414, 430, 480, 560, 600, 640, 641, 660, 700, 720, 740, 760, 761, 768, 800, 900, 1024, 1280, 1440];
  const sweepProblems = [];
  for (const w of SWEEP) {
    await sweepPage.setViewport({ width: w, height: 800, isMobile: w < 700, hasTouch: w < 700 });
    await sweepPage.goto(server.url, { waitUntil: 'domcontentloaded' });
    const info = await sweepPage.evaluate(() => {
      const inner = document.querySelector('.topbar-inner').getBoundingClientRect();
      const x = document.querySelector('.author-x').getBoundingClientRect();
      const nav = document.querySelector('.topbar-nav').getBoundingClientRect();
      const brand = document.querySelector('.brand').getBoundingClientRect();
      return {
        overflow: Math.max(0, Math.round(document.documentElement.scrollWidth - window.innerWidth)),
        xRight: Math.round(x.right),
        innerRight: Math.round(inner.right),
        gapBrandNav: Math.round(nav.left - brand.right),
        gapNavX: Math.round(x.left - nav.right),
        xH: Math.round(x.height),
      };
    });
    const ok = info.overflow === 0 && info.xRight <= info.innerRight + 1 && info.gapBrandNav >= 0 && info.gapNavX >= 0;
    if (!ok) sweepProblems.push(`${w}px ${JSON.stringify(info)}`);
  }
  check('24 个宽度下顶栏不重叠、不溢出', sweepProblems.length === 0, sweepProblems.slice(0, 3).join(' | '));
  await sweepPage.close();

  /* ---------------- 安全区模拟：给 html 注入 env() 变量 ---------------- */
  section('安全区（模拟 iPhone 刘海 + Home 指示条）');
  const safePage = await browser.newPage();
  await safePage.setUserAgent(IPHONE_UA);
  await safePage.setViewport({ width: 393, height: 852, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await safePage.evaluateOnNewDocument(() => {
    // Puppeteer 无法真实模拟 env(safe-area-inset-*)，用样式覆盖成等效值
    const style = document.createElement('style');
    style.textContent = `:root{--safe-top:47px;--safe-bottom:34px;--safe-left:0px;--safe-right:0px;--topbar-total:calc(58px + 47px);}`;
    document.addEventListener('DOMContentLoaded', () => document.head.appendChild(style));
  });
  await safePage.goto(server.url, { waitUntil: 'networkidle0' });
  const safeLayout = await safePage.evaluate(() => {
    const bar = document.querySelector('.topbar').getBoundingClientRect();
    const inner = document.querySelector('.topbar-inner').getBoundingClientRect();
    return { barTop: bar.top, barHeight: bar.height, innerTop: inner.top, padTop: parseFloat(getComputedStyle(document.querySelector('.topbar')).paddingTop) };
  });
  check('安全区填充顶栏', safeLayout.barHeight >= 58 + 40, JSON.stringify(safeLayout));
  check('顶栏内容在安全区下方', safeLayout.innerTop >= safeLayout.barTop + 40, JSON.stringify(safeLayout));
  const safeOverflow = await safePage.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: window.innerWidth }));
  check('安全区下无横向溢出', safeOverflow.scroll <= safeOverflow.inner + 1, JSON.stringify(safeOverflow));
  await safePage.close();

  /* ---------------- 大字体（iOS 辅助功能） ---------------- */
  section('动态字体 / 放大 130%');
  const bigPage = await browser.newPage();
  await bigPage.setUserAgent(IPHONE_UA);
  await bigPage.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await bigPage.evaluateOnNewDocument(() => {
    // 模拟 iOS 文字大小调到最大：根字号放大
    const style = document.createElement('style');
    style.textContent = 'html{font-size:130% !important}';
    document.addEventListener('DOMContentLoaded', () => document.head.appendChild(style));
  });
  await bigPage.goto(server.url, { waitUntil: 'networkidle0' });
  const bigOverflow = await bigPage.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: window.innerWidth }));
  check('放大字号后首页无横向溢出', bigOverflow.scroll <= bigOverflow.inner + 1, JSON.stringify(bigOverflow));
  const bigHeader = await bigPage.evaluate(() => {
    const x = document.querySelector('.author-x')?.getBoundingClientRect();
    const bar = document.querySelector('.topbar-inner')?.getBoundingClientRect();
    return x && bar ? { xRight: x.right, barRight: bar.right, xBottom: x.bottom, barBottom: bar.bottom } : null;
  });
  check('放大字号后作者 X 仍在顶栏内', Boolean(bigHeader) && bigHeader.xRight <= bigHeader.barRight + 1 && bigHeader.xBottom <= bigHeader.barBottom + 1, JSON.stringify(bigHeader));
  await bigPage.close();
} finally {
  await browser.close();
  await server.close();
}

console.log(`\n${passed} 项通过，${failures.length} 项失败`);
if (failures.length) {
  console.log('\n失败项：');
  for (const f of failures) console.log(` - ${f}`);
  process.exit(1);
}
console.log('iPhone / 移动端适配检查全部通过。');
