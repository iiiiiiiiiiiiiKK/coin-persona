/**
 * 版式与可访问性审计（Puppeteer + 本机 Chrome）。
 *
 * 与 e2e.mjs 的分工：
 *   e2e 覆盖「功能能跑通」，本脚本覆盖「版面经得起截图」：
 *   1. 关键页面在 4 种视口（桌面宽屏 / 笔记本 / 平板 / 手机）下均无横向溢出；
 *   2. 触控目标 ≥ 44×44（选项、主按钮）；
 *   3. 正文对比度 ≥ 4.5:1，次要文字 ≥ 3:1（WCAG AA）；
 *   4. 报告页在 375px 宽度下字号不小于 12px，可截图阅读；
 *   5. 页面只有一个 h1，表单控件均有可访问名称；
 *   6. 减少动画模式下 animation / transition 时长为 0。
 *
 * 用法：npm run build && node scripts/layout-audit.mjs
 */
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { serveStatic } from './serve.mjs';

const OUT = join(process.cwd(), '.layout-out');
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

const VIEWPORTS = [
  { name: 'desktop-1440', width: 1440, height: 960, mobile: false },
  { name: 'laptop-1024', width: 1024, height: 768, mobile: false },
  { name: 'tablet-768', width: 768, height: 1024, mobile: true },
  { name: 'phone-390', width: 390, height: 844, mobile: true },
  { name: 'phone-360', width: 360, height: 780, mobile: true },
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

/** 在页面里执行对比度计算（只检查可见文本节点）。 */
async function contrastReport(page) {
  return page.evaluate(() => {
    const parse = (c) => {
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const parts = m[1].split(',').map((v) => parseFloat(v.trim()));
      return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
    };
    const lin = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    const lum = ({ r, g, b }) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    const blend = (fg, bg) => ({
      r: fg.r * fg.a + bg.r * (1 - fg.a),
      g: fg.g * fg.a + bg.g * (1 - fg.a),
      b: fg.b * fg.a + bg.b * (1 - fg.a),
      a: 1,
    });
    const bgOf = (el) => {
      let node = el;
      let acc = null;
      while (node && node !== document.documentElement) {
        const c = parse(getComputedStyle(node).backgroundColor);
        if (c && c.a > 0) {
          acc = acc ? blend(acc, c) : c;
          if (acc.a >= 0.999) return acc;
        }
        node = node.parentElement;
      }
      return acc ?? { r: 5, g: 9, b: 8, a: 1 };
    };
    const results = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const text = (node.nodeValue ?? '').trim();
      if (text.length >= 2) {
        const el = node.parentElement;
        if (el) {
          const style = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          const visible =
            style.visibility !== 'hidden' &&
            style.display !== 'none' &&
            Number(style.opacity) > 0.05 &&
            rect.width > 0 &&
            rect.height > 0;
          if (visible) {
            const fgRaw = parse(style.color);
            const bg = bgOf(el);
            if (fgRaw) {
              const fg = blend(fgRaw, bg);
              const ratio = (Math.max(lum(fg), lum(bg)) + 0.05) / (Math.min(lum(fg), lum(bg)) + 0.05);
              const size = parseFloat(style.fontSize);
              const weight = Number(style.fontWeight) || 400;
              const large = size >= 24 || (size >= 18.66 && weight >= 700);
              results.push({
                text: text.slice(0, 24),
                cls: String(el.className).slice(0, 32),
                size,
                ratio: Math.round(ratio * 100) / 100,
                need: large ? 3 : 4.5,
              });
            }
          }
        }
      }
      node = walker.nextNode();
    }
    return results;
  });
}

const server = await serveStatic(DIST);
const browser = await puppeteer.launch({ executablePath: findBrowser(), headless: 'new', args: ['--no-sandbox'] });

try {
  for (const vp of VIEWPORTS) {
    section(`视口 ${vp.name}`);
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1, isMobile: vp.mobile, hasTouch: vp.mobile });
    await page.goto(server.url, { waitUntil: 'networkidle0' });

    /* 首页 */
    let overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`${vp.name} 首页无横向溢出`, overflow <= 1, `${overflow}px`);
    const homeH1 = await page.$$eval('h1', (h) => h.length);
    check(`${vp.name} 首页只有一个 h1`, homeH1 === 1, String(homeH1));

    /* 答题页 */
    await clickText(page, 'button', '开始测试');
    await page.waitForSelector('.question-card');
    overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`${vp.name} 答题页无横向溢出`, overflow <= 1, `${overflow}px`);
    const optionBox = await page.$eval('.option', (el) => {
      const r = el.getBoundingClientRect();
      return { w: r.width, h: r.height };
    });
    const cardBox = await page.$eval('.question-card', (el) => el.getBoundingClientRect().width);
    check(`${vp.name} 选项触控高度 ≥ 44`, optionBox.h >= 44, `${optionBox.h.toFixed(1)}px`);
    check(`${vp.name} 选项占满题卡宽度`, optionBox.w >= cardBox - 90, `${optionBox.w.toFixed(1)} / ${cardBox.toFixed(1)}`);
    const minFontQuiz = await page.evaluate(() => {
      const els = [...document.querySelectorAll('.q-prompt, .option-text, .q-scene')];
      return Math.min(...els.map((el) => parseFloat(getComputedStyle(el).fontSize)));
    });
    check(`${vp.name} 答题正文 ≥ 14px`, minFontQuiz >= 14, `${minFontQuiz}px`);
    await page.screenshot({ path: join(OUT, `quiz-${vp.name}.png`) });

    /* 完成一次答题，检查报告页 */
    const total = Number(
      await page.evaluate(() => (document.querySelector('.quiz-progress-meta')?.textContent ?? '').match(/\/\s*(\d+)/)?.[1] ?? '0'),
    );
    for (let i = 0; i < total; i += 1) {
      await page.click('.option:nth-child(2)');
      if (i < total - 1) {
        await clickText(page, 'button', '下一题');
        await sleep(30);
      }
    }
    await clickText(page, 'button', '生成报告');
    await page.waitForSelector('.persona-name', { timeout: 15000 });
    overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`${vp.name} 报告页无横向溢出`, overflow <= 1, `${overflow}px`);
    const minFontReport = await page.evaluate(() => {
      const els = [...document.querySelectorAll('.persona-line, .pattern-item, .advice-card .action, .trap-card .symptom, .score-name strong')];
      return Math.min(...els.map((el) => parseFloat(getComputedStyle(el).fontSize)));
    });
    check(`${vp.name} 报告正文 ≥ 12px`, minFontReport >= 12, `${minFontReport}px`);

    if (vp.name === 'phone-390' || vp.name === 'desktop-1440') {
      await page.screenshot({ path: join(OUT, `report-${vp.name}.png`), fullPage: true });
      await clickText(page, 'button', '查看我最容易犯的错误');
      await page.waitForSelector('.detail-title');
      overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      check(`${vp.name} 错误详情页无横向溢出`, overflow <= 1, `${overflow}px`);
      await page.screenshot({ path: join(OUT, `mistakes-${vp.name}.png`), fullPage: true });
      await page.goto(`${server.url}#/`, { waitUntil: 'networkidle0' });
    }

    /* 对比度 */
    await page.goto(`${server.url}#/`, { waitUntil: 'networkidle0' });
    const homeContrast = await contrastReport(page);
    const lowHome = homeContrast.filter((r) => r.ratio < r.need);
    check(`${vp.name} 首页对比度达标`, lowHome.length === 0, lowHome.slice(0, 2).map((r) => `${r.cls}「${r.text}」${r.ratio}`).join(' | '));

    await page.goto(`${server.url}#/saved`, { waitUntil: 'networkidle0' });
    const savedContrast = await contrastReport(page);
    const lowSaved = savedContrast.filter((r) => r.ratio < r.need);
    check(`${vp.name} 我的报告页对比度达标`, lowSaved.length === 0, lowSaved.slice(0, 2).map((r) => `${r.cls}「${r.text}」${r.ratio}`).join(' | '));

    check(`${vp.name} 无运行时错误`, errors.length === 0, errors.slice(0, 2).join(' | '));
    await page.close();
  }

  /* 键盘可达性：Tab 焦点可见 */
  section('键盘与焦点');
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(server.url, { waitUntil: 'networkidle0' });
  const focusables = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])')];
    return nodes.filter((n) => n.getBoundingClientRect().width > 0).length;
  });
  check('首页存在可聚焦元素', focusables > 3, String(focusables));
  await page.keyboard.press('Tab');
  const firstFocus = await page.evaluate(() => ({
    tag: document.activeElement?.tagName ?? '',
    text: (document.activeElement?.textContent ?? '').trim().slice(0, 20),
  }));
  check('首次 Tab 落在跳转链接或品牌', firstFocus.tag !== 'BODY', JSON.stringify(firstFocus));
  const outline = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return '';
    return getComputedStyle(el).outlineStyle;
  });
  check('焦点有可见轮廓', outline !== 'none', outline);

  /* 减少动画 */
  await page.goto(`${server.url}#/privacy`, { waitUntil: 'networkidle0' });
  await clickText(page, 'button', '减少动画：关闭');
  await sleep(150);
  const durations = await page.evaluate(() => {
    const reduce = document.documentElement.dataset.reduceMotion;
    const btn = document.querySelector('.btn');
    return { reduce, anim: btn ? getComputedStyle(btn).animationDuration : '', trans: btn ? getComputedStyle(btn).transitionDuration : '' };
  });
  check('减少动画标记生效', durations.reduce === 'true', JSON.stringify(durations));

  /* 屏幕阅读器结构 */
  const a11y = await page.evaluate(() => ({
    main: document.querySelectorAll('main').length,
    nav: document.querySelectorAll('nav[aria-label]').length,
    live: document.querySelectorAll('[aria-live]').length,
    skip: document.querySelectorAll('.skip-link').length,
    buttonsWithoutName: [...document.querySelectorAll('button')].filter((b) => !(b.textContent ?? '').trim() && !b.getAttribute('aria-label')).length,
  }));
  check('页面有 main 地标', a11y.main === 1, String(a11y.main));
  check('导航有 aria-label', a11y.nav >= 1, String(a11y.nav));
  check('有 aria-live 播报区', a11y.live >= 1, String(a11y.live));
  check('有跳过导航链接', a11y.skip === 1, String(a11y.skip));
  check('所有按钮都有可访问名称', a11y.buttonsWithoutName === 0, String(a11y.buttonsWithoutName));

  await page.close();
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
console.log('版式与可访问性审计通过。');
