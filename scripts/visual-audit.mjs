/**
 * 视觉健康检查：检测文字重叠、被裁切的内容、过小的可读区域。
 * 这是 layout-audit 的补充，只看「看起来会不会坏」。
 *
 * 用法：npm run build && node scripts/visual-audit.mjs
 */
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { serveStatic } from './serve.mjs';

const OUT = join(process.cwd(), '.visual-out');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];
const findBrowser = () => {
  for (const p of CHROME_PATHS) if (existsSync(p)) return p;
  throw new Error('未找到本机 Chrome/Edge');
};

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

/** 检测：文字块之间是否有明显重叠（排除父子关系与装饰元素）。 */
async function overlaps(page) {
  return page.evaluate(() => {
    const nodes = [...document.querySelectorAll('h1, h2, h3, p, li, blockquote, dd, dt, .score-value, .option-text, .mono')];
    const boxes = nodes
      .filter((el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width > 4 && r.height > 4 && s.visibility !== 'hidden' && Number(s.opacity) > 0.1;
      })
      .map((el) => ({ el, r: el.getBoundingClientRect() }));
    const out = [];
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i];
        const b = boxes[j];
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
        const overlapW = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
        const overlapH = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
        if (overlapW > 6 && overlapH > 6) {
          out.push({
            a: (a.el.textContent ?? '').trim().slice(0, 18),
            b: (b.el.textContent ?? '').trim().slice(0, 18),
            w: Math.round(overlapW),
            h: Math.round(overlapH),
          });
        }
      }
    }
    return out.slice(0, 8);
  });
}

/** 检测：显式 overflow 隐藏的容器是否装不下内容。 */
async function clipped(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('body *')]
      .filter((el) => {
        const s = getComputedStyle(el);
        if (s.overflow !== 'hidden' && s.overflowY !== 'hidden') return false;
        if (el.classList.contains('progress-track') || el.classList.contains('meter-track') || el.classList.contains('mini-bar-track'))
          return false;
        if (el.classList.contains('sr-only')) return false;
        return el.scrollHeight > el.clientHeight + 4 || el.scrollWidth > el.clientWidth + 4;
      })
      .slice(0, 6)
      .map((el) => ({ cls: String(el.className).slice(0, 40), sh: el.scrollHeight, ch: el.clientHeight })),
  );
}

const server = await serveStatic('dist');
const browser = await puppeteer.launch({ executablePath: findBrowser(), headless: 'new', args: ['--no-sandbox'] });

try {
  for (const vp of [
    { name: 'desktop', width: 1440, height: 960 },
    { name: 'phone', width: 390, height: 844 },
  ]) {
    console.log(`\n## ${vp.name}`);
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1, isMobile: vp.name === 'phone' });
    await page.goto(server.url, { waitUntil: 'networkidle0' });

    check(`${vp.name} 首页文字无重叠`, (await overlaps(page)).length === 0, JSON.stringify(await overlaps(page)));
    check(`${vp.name} 首页无内容裁切`, (await clipped(page)).length === 0, JSON.stringify(await clipped(page)));
    await page.screenshot({ path: join(OUT, `home-${vp.name}.png`), fullPage: true });

    await clickText(page, 'button', '开始测试');
    await page.waitForSelector('.question-card');
    check(`${vp.name} 答题页文字无重叠`, (await overlaps(page)).length === 0, JSON.stringify(await overlaps(page)));
    check(`${vp.name} 答题页无内容裁切`, (await clipped(page)).length === 0, JSON.stringify(await clipped(page)));
    await page.screenshot({ path: join(OUT, `quiz-${vp.name}.png`) });

    const total = Number(
      await page.evaluate(() => (document.querySelector('.quiz-progress-meta')?.textContent ?? '').match(/\/\s*(\d+)/)?.[1] ?? '0'),
    );
    for (let i = 0; i < total; i += 1) {
      await page.click('.option:nth-child(3)');
      if (i < total - 1) {
        await clickText(page, 'button', '下一题');
        await sleep(25);
      }
    }
    await clickText(page, 'button', '生成报告');
    await page.waitForSelector('.persona-name', { timeout: 15000 });
    check(`${vp.name} 报告页文字无重叠`, (await overlaps(page)).length === 0, JSON.stringify(await overlaps(page)));
    check(`${vp.name} 报告页无内容裁切`, (await clipped(page)).length === 0, JSON.stringify(await clipped(page)));
    const vh = await page.evaluate(() => ({
      h1: document.querySelector('.persona-name')?.getBoundingClientRect().height ?? 0,
      w: document.querySelector('.persona-name')?.getBoundingClientRect().width ?? 0,
    }));
    check(`${vp.name} 主人格名占位合理`, vh.h1 > 40 && vh.w > 100, JSON.stringify(vh));
    await page.screenshot({ path: join(OUT, `report-${vp.name}.png`), fullPage: true });

    /* 分享图预览 */
    await clickText(page, 'button', '生成分享图');
    await page.waitForSelector('canvas[data-share-canvas]');
    const canvasBox = await page.$eval('canvas[data-share-canvas]', (c) => {
      const r = c.getBoundingClientRect();
      return { w: r.width, h: r.height, ratio: r.width / r.height };
    });
    check(`${vp.name} 分享图预览比例正确`, Math.abs(canvasBox.ratio - 1) < 0.02, JSON.stringify(canvasBox));
    await page.screenshot({ path: join(OUT, `share-${vp.name}.png`) });
    await page.keyboard.press('Escape');
    await page.close();
  }
} finally {
  await browser.close();
  await server.close();
}

console.log(`\n${passed} 项通过，${failures.length} 项失败`);
if (failures.length) {
  for (const f of failures) console.log(` - ${f}`);
  process.exit(1);
}
console.log('视觉健康检查通过，截图在 .visual-out/。');
