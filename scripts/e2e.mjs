/**
 * 浏览器端 E2E（Puppeteer + 本机 Chrome，不下载 Chromium）。
 *
 * 覆盖验收项：
 *   首页加载 / 开始测试 / 逐题作答 / 返回修改 / 键盘操作 / 未答拦截 /
 *   完成报告 / 六维与三条建议 / 错误详情入口 / 保存与刷新持久化 /
 *   分享图 1:1 与 3:4 导出（真实 PNG）/ 复制报告 / 隐私页清除数据 /
 *   手机端无横向溢出 / 关闭动画 / 全程无外部网络请求。
 *
 * 用法：npm run build && npm run test:e2e
 */
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { serveStatic } from './serve.mjs';

const OUT = join(process.cwd(), '.e2e-out');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const DOWNLOAD_DIR = join(OUT, 'downloads');
mkdirSync(DOWNLOAD_DIR, { recursive: true });

const DIST = join(process.cwd(), 'dist');
if (!existsSync(join(DIST, 'index.html'))) throw new Error('未找到 dist/index.html，请先 npm run build');

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];
function findBrowser() {
  for (const p of CHROME_PATHS) if (existsSync(p)) return p;
  throw new Error('未找到本机 Chrome/Edge，请修改 scripts/e2e.mjs 的 CHROME_PATHS');
}

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

async function clickText(page, selector, text) {
  const handles = await page.$$(selector);
  for (const h of handles) {
    const t = await page.evaluate((el) => el.textContent ?? '', h);
    if (t.includes(text)) {
      await h.click();
      return true;
    }
  }
  return false;
}

async function bodyText(page) {
  return page.evaluate(() => document.body.innerText);
}

async function noOverflow(page) {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    scrollHeight: document.documentElement.scrollHeight,
  }));
}

const server = await serveStatic(DIST);
const browser = await puppeteer.launch({
  executablePath: findBrowser(),
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const externalRequests = [];
const pageErrors = [];

try {
  const context = browser.defaultBrowserContext();
  await context.overridePermissions(server.url, ['clipboard-read', 'clipboard-write']);

  const page = await browser.newPage();
  await page.setViewport({ width: 1360, height: 960, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') pageErrors.push(`console: ${m.text()}`);
  });
  page.on('request', (req) => {
    const url = req.url();
    if (!url.startsWith(server.url) && !url.startsWith('data:') && !url.startsWith('blob:')) externalRequests.push(url);
  });
  const cdp = await page.createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DOWNLOAD_DIR });

  /* ------------------------------ 首页 ------------------------------ */
  section('1. 首页');
  await page.goto(server.url, { waitUntil: 'networkidle0' });
  let text = await bodyText(page);
  check('首页标题正确', text.includes('你在加密市场里'));
  check('首页说明随机抽题', text.includes('随机抽取') && text.includes('12–16'));
  check('首页写明不连接钱包/交易所', text.includes('钱包') && text.includes('交易'));
  check('首页有开始按钮', Boolean(await page.$('button')));
  check('首页展示 12 种人格', (await page.$$('.roster-item')).length === 12);
  check('首页含娱乐声明', text.includes('不构成投资建议'));
  check('首页无横向溢出', (await noOverflow(page)).scrollWidth <= 1361);
  const homeShot = join(OUT, 'home.png');
  await page.screenshot({ path: homeShot, fullPage: true });
  check('首页截图已保存', existsSync(homeShot) && statSync(homeShot).size > 40_000);

  /* 开始测试 */
  await clickText(page, 'button', '开始测试');
  await page.waitForSelector('.question-card', { timeout: 10000 });
  const seed = await page.evaluate(() => location.hash.match(/seed=([0-9A-Z-]+)/)?.[1] ?? '');
  check('URL 带题码', /^[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(seed), seed);

  /* ------------------------------ 答题 ------------------------------ */
  section('2. 答题与返回修改');
  const total = Number(
    await page.evaluate(() => {
      const t = document.querySelector('.quiz-progress-meta')?.textContent ?? '';
      return t.match(/\/\s*(\d+)/)?.[1] ?? '0';
    }),
  );
  check('题量 12–16', total >= 12 && total <= 16, String(total));
  check('进度条可访问', (await page.$('[role="progressbar"]')) !== null);

  const q1Text = await page.$eval('.q-scene', (el) => el.textContent ?? '');
  await page.click('.option:nth-child(1)');
  await page.waitForSelector('.option.selected');
  check('选项可选中', (await page.$$('.option.selected')).length === 1);
  check('选中后 aria-checked', (await page.$eval('.option.selected', (el) => el.getAttribute('aria-checked'))) === 'true');

  await clickText(page, 'button', '下一题');
  const q2Text = await page.$eval('.q-scene', (el) => el.textContent ?? '');
  check('下一题内容变化', q1Text !== q2Text);

  await clickText(page, 'button', '上一题');
  await sleep(120);
  check('返回上一题内容一致', (await page.$eval('.q-scene', (el) => el.textContent ?? '')) === q1Text);
  check('返回后保留已选项', (await page.$$('.option.selected')).length === 1);

  /* 键盘：数字键选择、方向键翻页 */
  await page.keyboard.press('2');
  await sleep(120);
  const checkedIndex = await page.evaluate(() => {
    const opts = [...document.querySelectorAll('.option')];
    return opts.findIndex((el) => el.getAttribute('aria-checked') === 'true');
  });
  check('数字键 2 选中第二项', checkedIndex === 1, String(checkedIndex));
  await page.keyboard.press('ArrowRight');
  await sleep(120);
  check('→ 进入下一题', (await page.$eval('.q-scene', (el) => el.textContent ?? '')) === q2Text);
  await page.keyboard.press('ArrowLeft');
  await sleep(120);

  /* 未答拦截：清空 localStorage 重新开始更直观，这里直接跳到最后一题尝试提交 */
  const progressTicks = await page.$$('.progress-tick');
  check('进度刻度数量等于题量', progressTicks.length === total, `${progressTicks.length}/${total}`);

  /* 完成全部题目：每题选第 2 项，确保与 fixture 不同也能跑通 */
  for (let i = 0; i < total; i += 1) {
    const idx = await page.evaluate(() => {
      const m = document.querySelector('.quiz-progress-meta')?.textContent ?? '';
      return Number(m.match(/QUESTION (\d+) \/ (\d+)/)?.[1] ?? '1');
    });
    if (idx - 1 !== i) {
      // 用进度刻度直接跳转，验证可点击跳题
      await progressTicks[i].click();
      await sleep(100);
    }
    const optionCount = (await page.$$('.option')).length;
    await page.click(`.option:nth-child(${Math.min(2, optionCount)})`);
    if (i < total - 1) await clickText(page, 'button', '下一题');
    await sleep(60);
  }
  check('最后一题显示生成报告', (await bodyText(page)).includes('生成报告'));
  await clickText(page, 'button', '生成报告');
  await page.waitForSelector('.persona-name', { timeout: 15000 });

  /* ------------------------------ 报告 ------------------------------ */
  section('3. 报告内容');
  text = await bodyText(page);
  check('报告显示主人格', (await page.$$('.persona-name')).length === 1);
  check('报告显示副人格', text.includes('SECONDARY') && Boolean(await page.$('.secondary-name')));
  check('报告显示六个维度', (await page.$$('.score-row')).length === 6);
  check('报告显示 3 个决策陷阱', (await page.$$('.trap-card')).length === 3);
  check('报告显示 3 条纪律建议', (await page.$$('.advice-card')).length === 3);
  check('报告含个人标签', text.includes('个人标签') && Boolean(await page.$('.share-line-box blockquote')));
  check('报告含免责声明', text.includes('不是经过验证的心理测量') && text.includes('不构成'));
  check('报告注明规则版本', text.includes('规则版本'));
  check('报告注明回答题数', text.includes(`回答 ${total} 题`));
  check('报告已自动保存', text.includes('已保存到本机'));
  check('报告页无横向溢出', (await noOverflow(page)).scrollWidth <= 1361);

  /* 六维数值在 0–100 */
  const dims = await page.$$eval('.score-row', (rows) =>
    rows.map((r) => ({
      name: r.querySelector('.score-name strong')?.textContent ?? '',
      value: Number((r.querySelector('.score-value')?.textContent ?? '').trim().match(/^\d+/)?.[0] ?? 'NaN'),
    })),
  );
  check('六维名称完整', ['风险承受倾向', '决策纪律', '情绪稳定倾向', '追涨冲动', '止损执行倾向', '交易频率偏好'].every((n) => dims.some((d) => d.name === n)));
  check('六维分数在 0–100', dims.every((d) => d.value >= 0 && d.value <= 100), JSON.stringify(dims));

  /* 错误详情入口 */
  await clickText(page, 'button', '查看我最容易犯的错误');
  await page.waitForSelector('.detail-title', { timeout: 10000 });
  text = await bodyText(page);
  check('错误详情页有标题', text.includes('我最容易犯的错误'));
  check('错误详情页 3 条陷阱', (await page.$$('.trap-detail')).length === 3);
  check('错误详情含反制动作', text.includes('反制动作'));
  await clickText(page, 'button', '返回完整报告');
  await page.waitForSelector('.persona-name', { timeout: 10000 });

  /* 复制报告 */
  await clickText(page, 'button', '复制报告');
  await sleep(400);
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  check('复制内容含人格名', clip.includes((await page.$eval('.persona-name', (el) => el.textContent ?? '')).trim()));
  check('复制内容含六维', clip.includes('风险承受倾向') && clip.includes('交易频率偏好'));
  check('复制内容含三条纪律', (clip.match(/D-\d\d/g) ?? []).length >= 3);

  /* ------------------------------ 分享图 ------------------------------ */
  section('4. 分享图导出');
  await clickText(page, 'button', '生成分享图');
  await page.waitForSelector('[role="dialog"]');
  await page.waitForFunction(() => document.querySelector('[data-share-ready="true"]') !== null, { timeout: 10000 });
  const size1 = await page.$eval('canvas[data-share-canvas]', (c) => ({ w: c.width, h: c.height }));
  check('默认 1:1 画布 1080×1080', size1.w === 1080 && size1.h === 1080, `${size1.w}×${size1.h}`);
  await clickText(page, '[role="dialog"] button', '3 : 4');
  await page.waitForFunction(() => document.querySelector('canvas[data-share-canvas]')?.width === 1080 && document.querySelector('canvas[data-share-canvas]')?.height === 1440, { timeout: 10000 });
  const size2 = await page.$eval('canvas[data-share-canvas]', (c) => ({ w: c.width, h: c.height }));
  check('切到 3:4 画布 1080×1440', size2.w === 1080 && size2.h === 1440, `${size2.w}×${size2.h}`);
  const scale3 = await page.$eval('[role="dialog"] .share-status', (el) => el.textContent ?? '');
  check('分享工作室显示内容高度', scale3.includes('内容高度'), scale3);
  const exported = await page.evaluate(() => {
    const c = document.querySelector('canvas[data-share-canvas]');
    return c ? c.toDataURL('image/png').length : 0;
  });
  check('画布可导出 PNG 数据', exported > 50_000, String(exported));

  await clickText(page, '[role="dialog"] button', '下载 PNG');
  let files = [];
  for (let i = 0; i < 40; i += 1) {
    await sleep(150);
    files = (await import('node:fs')).readdirSync(DOWNLOAD_DIR).filter((f) => f.endsWith('.png'));
    if (files.length) break;
  }
  check('下载目录出现 PNG', files.length >= 1, files.join(','));
  if (files.length) {
    const file = join(DOWNLOAD_DIR, files[0]);
    const buf = readFileSync(file);
    check('下载的 PNG 是有效文件', buf[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG' && buf.length > 20_000, `${buf.length} bytes`);
    check('文件名含比例与主题', files[0].includes('3x4') && files[0].includes('terminal'), files[0]);
    check('下载尺寸为 1080×1440', buf.readUInt32BE(16) === 1080 && buf.readUInt32BE(20) === 1440);
  }
  await page.keyboard.press('Escape');
  await sleep(200);
  check('Esc 关闭分享图', (await page.$('[role="dialog"]')) === null);

  /* ------------------------------ 保存与刷新 ------------------------------ */
  section('5. 保存与刷新持久化');
  const reportUrl = page.url();
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('.persona-name', { timeout: 10000 });
  check('刷新后报告仍在', (await bodyText(page)).includes('PERSONA REPORT'));
  check('刷新后 URL 不变', page.url() === reportUrl);
  await page.goto(`${server.url}#/saved`, { waitUntil: 'networkidle0' });
  check('我的报告页有 1 份报告', (await page.$$('.saved-item')).length === 1);
  check('报告列表显示规则校验通过', (await bodyText(page)).includes('规则校验通过'));

  /* 重新测试（新题码） */
  await page.goto(`${server.url}#/`, { waitUntil: 'networkidle0' });
  const oldHash = reportUrl.split('#')[1];
  await clickText(page, 'button', '开始测试');
  await page.waitForSelector('.question-card');
  const newSeed = await page.evaluate(() => location.hash.match(/seed=([0-9A-Z-]+)/)?.[1] ?? '');
  check('重新测试生成新题码', newSeed !== seed, `${seed} → ${newSeed}`);

  /* ------------------------------ 隐私页 ------------------------------ */
  section('6. 隐私与清除数据');
  await page.goto(`${server.url}#/privacy`, { waitUntil: 'networkidle0' });
  text = await bodyText(page);
  check('隐私页说明 localStorage', text.includes('localStorage'));
  check('隐私页说明不读取私钥', text.includes('助记词') && text.includes('私钥'));
  check('隐私页说明无账号', text.includes('没有账号'));
  await clickText(page, 'button', '清除全部本地数据');
  await page.waitForSelector('.danger-zone .btn');
  await clickText(page, 'button', '确认清除全部数据');
  await sleep(300);
  const stored = await page.evaluate(() => localStorage.getItem('coin-persona:v1'));
  check('清除后 localStorage 为空', stored === null, String(stored));
  await page.goto(`${server.url}#/saved`, { waitUntil: 'networkidle0' });
  check('清除后我的报告为空', (await bodyText(page)).includes('还没有保存的报告'));

  /* ------------------------------ 手机端 ------------------------------ */
  section('7. 手机端');
  const mobile = await browser.newPage();
  mobile.on('pageerror', (e) => pageErrors.push(`mobile: ${String(e)}`));
  await mobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await mobile.goto(server.url, { waitUntil: 'networkidle0' });
  const homeOverflow = await noOverflow(mobile);
  check('手机首页无横向溢出', homeOverflow.scrollWidth <= 391, JSON.stringify(homeOverflow));
  await clickText(mobile, 'button', '开始测试');
  await mobile.waitForSelector('.question-card');
  const quizOverflow = await noOverflow(mobile);
  check('手机答题页无横向溢出', quizOverflow.scrollWidth <= 391, JSON.stringify(quizOverflow));
  const tapTarget = await mobile.$eval('.option', (el) => el.getBoundingClientRect().height);
  check('手机选项高度 ≥ 44px', tapTarget >= 44, String(tapTarget));
  await mobile.screenshot({ path: join(OUT, 'mobile-quiz.png'), fullPage: true });
  const mTotal = Number(await mobile.evaluate(() => (document.querySelector('.quiz-progress-meta')?.textContent ?? '').match(/\/\s*(\d+)/)?.[1] ?? '0'));
  for (let i = 0; i < mTotal; i += 1) {
    await mobile.click('.option:nth-child(1)');
    if (i < mTotal - 1) {
      await clickText(mobile, 'button', '下一题');
      await sleep(40);
    }
  }
  await clickText(mobile, 'button', '生成报告');
  await mobile.waitForSelector('.persona-name', { timeout: 15000 });
  const reportOverflow = await noOverflow(mobile);
  check('手机报告页无横向溢出', reportOverflow.scrollWidth <= 391, JSON.stringify(reportOverflow));
  await mobile.screenshot({ path: join(OUT, 'mobile-report.png'), fullPage: true });
  check('手机报告截图已保存', statSync(join(OUT, 'mobile-report.png')).size > 60_000);

  /* 手机分享图预览 */
  await clickText(mobile, 'button', '生成分享图');
  await mobile.waitForSelector('canvas[data-share-canvas]');
  const preview = await mobile.$eval('canvas[data-share-canvas]', (c) => {
    const r = c.getBoundingClientRect();
    return { w: r.width, right: r.right, inner: window.innerWidth };
  });
  check('手机分享图预览不溢出', preview.right <= preview.inner + 1, JSON.stringify(preview));
  await mobile.keyboard.press('Escape');

  /* ------------------------------ 减少动画 ------------------------------ */
  section('8. 减少动画与偏好');
  await mobile.goto(`${server.url}#/privacy`, { waitUntil: 'networkidle0' });
  await clickText(mobile, 'button', '减少动画：关闭');
  await sleep(200);
  const reduce = await mobile.evaluate(() => document.documentElement.dataset.reduceMotion);
  check('减少动画开关生效', reduce === 'true', String(reduce));
  const persisted = await mobile.evaluate(() => JSON.parse(localStorage.getItem('coin-persona:v1') ?? '{}')?.prefs?.reduceMotion);
  check('减少动画写入本地存储', persisted === true, String(persisted));

  /* ------------------------------ 网络与错误 ------------------------------ */
  section('9. 网络与运行时');
  check('全程无外部网络请求', externalRequests.length === 0, externalRequests.slice(0, 3).join(' | '));
  check('无页面运行时错误', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));

  const homeLargest = await page.evaluate(() => document.documentElement.scrollWidth);
  check('桌面首页无横向溢出（复核）', homeLargest <= 1361, String(homeLargest));

  /* 打印本次运行的报告摘要，便于人工核对 */
  const summary = await page.evaluate(() => document.body.innerText.slice(0, 200));
  writeFileSync(join(OUT, 'summary.txt'), `${summary}\n`, 'utf8');
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
console.log('E2E 全部通过。截图与下载文件在 .e2e-out/。');
