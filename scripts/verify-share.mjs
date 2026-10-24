/**
 * 分享图导出校验（自包含：用 esbuild 现打包压力测试页，不需要另开 dev server）。
 *
 * 覆盖：
 *   1. 12 组固定答案 × 2 种比例 × 2 套配色 = 48 张卡片全部渲染；
 *   2. 导出尺寸精确为 1080×1080 / 1080×1440，PNG 真实可解码；
 *   3. 卡片里每一段文字 / 元素的包围盒都在画布内，且内容底部留出安全边距；
 *   4. 没有文字被省略号截断；
 *   5. 每张卡都带品牌、网址、免责声明与「不是心理测量」说明；
 *   6. 六维刻度、主人格、副人格、陷阱、标签都在卡片上。
 *
 * 用法：npm run test:share（需先 build 吗？不需要，本脚本自己打包）
 */
import { build } from 'esbuild';
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';
import { serveStatic } from './serve.mjs';

const OUT = join(process.cwd(), '.share-check');
const WEB = join(OUT, 'web');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(WEB, { recursive: true });

const FIXTURE = JSON.parse(readFileSync('scripts/fixtures/preset-answers.json', 'utf8'));

/** 从源码读取分享图页脚网址，避免测试写死域名。 */
const SITE_URL_LABEL = (() => {
  const src = readFileSync('src/data/site.ts', 'utf8');
  const m = src.match(/export const SITE_URL_LABEL = '([^']+)'/);
  if (!m) throw new Error('无法从 src/data/site.ts 读取 SITE_URL_LABEL');
  return m[1];
})();

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];
function findBrowser() {
  for (const p of CHROME_PATHS) if (existsSync(p)) return p;
  throw new Error('未找到本机 Chrome/Edge，请改 scripts/verify-share.mjs 的 CHROME_PATHS');
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

/** 极简 PNG 解码：支持 8bit 非隔行 color type 2 / 6。 */
function decodePng(buf) {
  if (buf[0] !== 0x89 || buf.toString('ascii', 1, 4) !== 'PNG') throw new Error('not png');
  let pos = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') break;
    pos += 12 + len;
  }
  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) return { width, height, unsupported: true };
  const channels = colorType === 6 ? 4 : 3;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let x = 0; x < stride; x += 1) {
      const a = x >= channels ? line[x - channels] : 0;
      const b = prev[x];
      const c = x >= channels ? prev[x - channels] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      line[x] = v & 0xff;
    }
    line.copy(out, y * stride);
    prev = line;
  }
  return { width, height, channels, pixels: out, unsupported: false };
}

function imageStats({ width, height, channels, pixels }) {
  const colors = new Set();
  let sum = 0;
  let samples = 0;
  let opaque = 0;
  for (let y = 0; y < height; y += 9) {
    for (let x = 0; x < width; x += 9) {
      const i = (y * width + x) * channels;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = channels === 4 ? pixels[i + 3] : 255;
      if (a > 8) opaque += 1;
      colors.add(((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3));
      sum += (r + g + b) / 3;
      samples += 1;
    }
  }
  return { colors: colors.size, brightness: sum / samples, opaqueRatio: opaque / samples };
}

/* ---------- 1. 打包压力测试页 ---------- */
await build({
  entryPoints: ['scripts/share-stress.entry.tsx'],
  bundle: true,
  format: 'esm',
  target: 'es2020',
  jsx: 'automatic',
  outdir: WEB,
  entryNames: 'stress',
  assetNames: 'assets/[name]',
  define: { 'process.env.NODE_ENV': '"production"' },
  loader: { '.css': 'css' },
  logLevel: 'error',
});

writeFileSync(
  join(WEB, 'index.html'),
  `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>share stress</title><link rel="icon" href="data:,"><style>
  body{background:#050908;color:#cfe9df;font-family:monospace;margin:0;padding:12px}
  .cards{display:flex;flex-wrap:wrap;gap:10px}
  .card-wrap{width:270px}
  canvas{width:270px;height:auto;display:block;border:1px solid #23423a}
  .meta{font-size:10px;color:#7d968e;margin:0 0 4px}
  </style></head><body><p id="status">loading…</p><div class="cards" id="cards"></div><script type="module" src="./stress.js"></script></body></html>`,
  'utf8',
);

const server = await serveStatic(WEB);
const browser = await puppeteer.launch({
  executablePath: findBrowser(),
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1500, height: 1000, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  await page.goto(`${server.url}index.html`, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForFunction(() => window.__shareReady === true || window.__shareError, { timeout: 60000 });

  const pageError = await page.evaluate(() => window.__shareError);
  check('压力测试页无运行时错误', !pageError, pageError);
  check('浏览器控制台无报错', errors.length === 0, errors.join(' | '));

  const jobs = await page.evaluate(() => window.__shareJobs ?? []);
  check('卡片总数 = 12 人格 × 2 比例 × 2 配色', jobs.length === 48, String(jobs.length));

  /* ---------- 2. 每张卡的几何与文案 ---------- */
  for (const job of jobs) {
    const { metrics, ratio, theme, presetName, persona } = job;
    const label = `${presetName}/${ratio}/${theme}`;
    const expected = ratio === '1:1' ? { w: 1080, h: 1080 } : { w: 1080, h: 1440 };
    check(`${label} 尺寸 ${expected.w}×${expected.h}`, job.width === expected.w && job.height === expected.h, `${job.width}×${job.height}`);
    check(`${label} metrics 尺寸一致`, metrics.width === expected.w && metrics.height === expected.h);
    check(`${label} 有内容`, metrics.boxes.length > 5, String(metrics.boxes.length));
    check(`${label} 无文字省略`, metrics.truncated === 0, String(metrics.truncated));
    check(`${label} 内容未越界`, metrics.contentBottom <= job.height - metrics.margin, `${metrics.contentBottom} > ${job.height - metrics.margin}`);
    check(`${label} 内容在安全边距内`, metrics.contentBottom > 0 && metrics.contentBottom >= job.height * 0.65, String(metrics.contentBottom));
    const outside = metrics.boxes.filter(
      (b) => b.x < 0 || b.y < 0 || b.x + b.w > job.width + 0.5 || b.y + b.h > job.height + 0.5,
    );
    check(`${label} 所有元素在画布内`, outside.length === 0, outside.map((b) => b.tag).slice(0, 3).join(','));
    const leftMargin = Math.min(...metrics.boxes.map((b) => b.x));
    check(`${label} 左边距不小于 60`, leftMargin >= 60, String(leftMargin));

    const texts = metrics.texts.join('\n');
    check(`${label} 含人格名`, texts.includes(persona), persona);
    check(`${label} 含品牌`, texts.includes('COIN PERSONA'));
    check(`${label} 含六维名称`, ['风险承受倾向', '决策纪律', '情绪稳定倾向', '追涨冲动', '止损执行倾向', '交易频率偏好'].every((t) => texts.includes(t)));
    check(`${label} 含免责声明`, texts.includes('娱乐与自我反思工具'));
    check(`${label} 含非心理测量说明`, texts.includes('非心理测量'));
    check(`${label} 含网址`, texts.includes(SITE_URL_LABEL), SITE_URL_LABEL);
    check(`${label} 含副人格`, texts.includes('副人格'));
    check(`${label} 含风险温度`, texts.includes('RISK TEMP'));
    check(`${label} 含分享标签`, metrics.texts.some((t) => t.startsWith('「') && t.endsWith('」')));
    check(`${label} 字号未缩到不可读`, metrics.scale >= 0.72, String(metrics.scale));
  }

  const ratios = new Set(jobs.map((j) => j.ratio));
  check('两种比例都生成', ratios.has('1:1') && ratios.has('3:4'));
  const themes = new Set(jobs.map((j) => j.theme));
  check('两套配色都生成', themes.has('terminal') && themes.has('editorial'));
  const personas = new Set(jobs.map((j) => j.presetName));
  check('12 组预设都生成卡片', personas.size === 12, String(personas.size));

  /* 3:4 卡片应比 1:1 承载更多内容（多一条陷阱 + 一条建议） */
  const square = jobs.find((j) => j.ratio === '1:1' && j.theme === 'terminal');
  const tall = jobs.find((j) => j.ratio === '3:4' && j.theme === 'terminal');
  check('3:4 内容区块更多', tall.metrics.boxes.length > square.metrics.boxes.length, `${square.metrics.boxes.length} vs ${tall.metrics.boxes.length}`);
  check('3:4 包含纪律建议', tall.metrics.texts.some((t) => t.includes('今日口服纪律')));
  check('1:1 不强行塞入建议', !square.metrics.texts.some((t) => t.includes('今日口服纪律')));

  /* ---------- 3. PNG 真实可解码 ---------- */
  const sampleKeys = ['1:1/terminal', '3:4/terminal', '1:1/editorial', '3:4/editorial'];
  for (const key of sampleKeys) {
    const job = jobs.find((j) => `${j.ratio}/${j.theme}` === key);
    const data = Buffer.from(job.dataUrl.split(',')[1], 'base64');
    const safeName = key.replace(/[:/]/g, '-');
    writeFileSync(join(OUT, `sample-${safeName}.png`), data);
    const png = decodePng(data);
    check(`${key} PNG 可解码`, !png.unsupported && png.width === job.width && png.height === job.height, `${png.width}×${png.height}`);
    const stats = imageStats(png);
    check(`${key} 图片不是空白`, stats.colors > 40 && stats.opaqueRatio > 0.95, `colors=${stats.colors} opaque=${stats.opaqueRatio.toFixed(2)}`);
    check(`${key} 图片明暗分布合理`, stats.brightness > 8 && stats.brightness < 245, stats.brightness.toFixed(1));
    check(`${key} PNG 体积合理`, data.length > 20_000, String(data.length));
  }

  /* ---------- 4. 每个主题的配色确实不同 ---------- */
  const terminal = jobs.find((j) => j.ratio === '1:1' && j.theme === 'terminal');
  const editorial = jobs.find((j) => j.ratio === '1:1' && j.theme === 'editorial');
  check('两套配色输出不同图片', terminal.dataUrl !== editorial.dataUrl);

  /* ---------- 5. 不同人格输出不同图片 ---------- */
  const uniqueCards = new Set(jobs.filter((j) => j.ratio === '1:1' && j.theme === 'terminal').map((j) => j.dataUrl));
  check('12 种人格的分享图各不相同', uniqueCards.size === 12, String(uniqueCards.size));
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
console.log('分享图校验通过，样例已写入 .share-check/。');
