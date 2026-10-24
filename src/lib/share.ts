import type { Archetype } from '../data/archetypes';
import { DIMENSIONS, bandOf } from '../data/dimensions';
import { DISCLAIMER_SHORT, SITE_EN, SITE_NAME, SITE_URL_LABEL } from '../data/site';
import type { Advice, Trap } from '../data/traps';
import type { DimensionScores } from '../data/types';
import { SHARE_SIZES, type Box, type ShareMetrics, type ShareRatio, type ShareTheme } from './share-types';

export interface ShareView {
  reportId: string;
  seed: string;
  dateLabel: string;
  primary: Archetype;
  secondary: Archetype;
  scores: DimensionScores;
  traps: Trap[];
  advice: Advice[];
  riskTemperature: number;
  disciplineIndex: number;
  confidence: number;
}

const SANS = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC","Source Han Sans SC",sans-serif';
const MONO = '"SFMono-Regular","Cascadia Mono",Consolas,"Liberation Mono",Menlo,monospace';

interface Palette {
  bg: string;
  ink: string;
  dim: string;
  faint: string;
  green: string;
  orange: string;
  rule: string;
  track: string;
  chipFill: string;
  chipStroke: string;
  trend: string;
  panel: string;
}

const PALETTES: Record<ShareTheme, Palette> = {
  terminal: {
    bg: '#050908',
    ink: '#eaf6f0',
    dim: '#9db4ab',
    faint: '#6b827b',
    green: '#4bffb0',
    orange: '#ff9f43',
    rule: 'rgba(157,180,171,0.30)',
    track: 'rgba(157,180,171,0.20)',
    chipFill: 'rgba(75,255,176,0.10)',
    chipStroke: 'rgba(75,255,176,0.34)',
    trend: 'rgba(75,255,176,0.16)',
    panel: 'rgba(11,21,18,0.72)',
  },
  editorial: {
    bg: '#f3ede2',
    ink: '#16130f',
    dim: '#4d4438',
    faint: '#6f6455',
    green: '#1c6b4a',
    orange: '#a9481a',
    rule: 'rgba(22,19,15,0.26)',
    track: 'rgba(22,19,15,0.14)',
    chipFill: 'rgba(28,107,74,0.10)',
    chipStroke: 'rgba(28,107,74,0.32)',
    trend: 'rgba(28,107,74,0.20)',
    panel: 'rgba(255,252,246,0.60)',
  },
};

type Ctx2D = CanvasRenderingContext2D;

function fontOf(size: number, weight: number, mono: boolean): string {
  return `${weight} ${Math.round(size * 10) / 10}px ${mono ? MONO : SANS}`;
}

const NO_LEADING = '，。、；：！？）】」』%·…,.!?;:)]}';

/** 中文按字符折行；避免标点出现在行首。 */
export function wrapText(ctx: Ctx2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const ch of Array.from(text)) {
    if (ch === '\n') {
      lines.push(line);
      line = '';
      continue;
    }
    const next = line + ch;
    if (line && ctx.measureText(next).width > maxWidth) {
      if (NO_LEADING.includes(ch)) {
        line = next;
        continue;
      }
      lines.push(line);
      line = ch;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function ellipsize(ctx: Ctx2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let out = '';
  for (const ch of Array.from(text)) {
    if (ctx.measureText(`${out}${ch}…`).width > maxWidth) break;
    out += ch;
  }
  return `${out}…`;
}

function drawTracked(ctx: Ctx2D, text: string, x: number, baseline: number, tracking: number): number {
  let cursor = x;
  for (const ch of Array.from(text)) {
    ctx.fillText(ch, cursor, baseline);
    cursor += ctx.measureText(ch).width + tracking;
  }
  return cursor - x - (text ? tracking : 0);
}

function measureTracked(ctx: Ctx2D, text: string, tracking: number): number {
  let width = 0;
  for (const ch of Array.from(text)) width += ctx.measureText(ch).width + tracking;
  return Math.max(0, width - (text ? tracking : 0));
}

function roundRect(ctx: Ctx2D, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.max(0, Math.min(r, h / 2, w / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/* ------------------------------- 版式 ------------------------------- */

interface TextSpec {
  kind: 'text';
  text: string;
  size: number;
  weight: number;
  mono: boolean;
  color: keyof Palette;
  tracking: number;
  maxLines: number;
  lineHeight: number;
  align: 'left' | 'right';
  tag: string;
}
type Spec =
  | TextSpec
  | { kind: 'space'; h: number; tag: string }
  | { kind: 'rule'; tag: string }
  | { kind: 'brandRow'; tag: string }
  | { kind: 'gauge'; tag: string }
  | { kind: 'bars'; tag: string }
  | { kind: 'chips'; labels: string[]; tag: string }
  | { kind: 'trap'; index: number; trap: Trap; tag: string }
  | { kind: 'advice'; advice: Advice; tag: string };

interface Block {
  spec: Spec;
  h: number;
}

interface LayoutResult {
  blocks: Block[];
  scale: number;
  total: number;
  margin: number;
  width: number;
  height: number;
}

const GAP = (h: number): Spec => ({ kind: 'space', h, tag: 'gap' });

function buildSpecs(data: ShareView, square: boolean): Spec[] {
  const p = data.primary;
  const specs: Spec[] = [];

  specs.push({ kind: 'brandRow', tag: 'brand-row' });
  specs.push({ kind: 'rule', tag: 'rule-top' });
  specs.push(GAP(square ? 26 : 32));
  specs.push({
    kind: 'text',
    text: 'PRIMARY PERSONA / 主人格',
    size: 19,
    weight: 700,
    mono: true,
    color: 'orange',
    tracking: 2.2,
    maxLines: 1,
    lineHeight: 1.2,
    align: 'left',
    tag: 'kicker',
  });
  specs.push(GAP(8));
  specs.push({
    kind: 'text',
    text: p.name,
    size: square ? 92 : 104,
    weight: 800,
    mono: false,
    color: 'ink',
    tracking: 0,
    maxLines: 1,
    lineHeight: 1.1,
    align: 'left',
    tag: 'persona-name',
  });
  specs.push({
    kind: 'text',
    text: `${p.alias} · ${p.code}`,
    size: 23,
    weight: 500,
    mono: true,
    color: 'dim',
    tracking: 1.2,
    maxLines: 1,
    lineHeight: 1.4,
    align: 'left',
    tag: 'persona-code',
  });
  specs.push(GAP(square ? 16 : 20));
  specs.push({
    kind: 'text',
    text: p.oneLiner,
    size: square ? 29 : 31,
    weight: 500,
    mono: false,
    color: 'ink',
    tracking: 0,
    maxLines: 2,
    lineHeight: 1.42,
    align: 'left',
    tag: 'one-liner',
  });
  specs.push(GAP(square ? 18 : 24));
  specs.push({ kind: 'gauge', tag: 'gauge' });
  specs.push(GAP(square ? 14 : 18));
  specs.push({ kind: 'bars', tag: 'bars' });
  specs.push(GAP(square ? 16 : 22));
  specs.push({
    kind: 'text',
    text: 'MOST LIKELY MISTAKE / 最容易犯的错',
    size: 17,
    weight: 700,
    mono: true,
    color: 'orange',
    tracking: 2,
    maxLines: 1,
    lineHeight: 1.2,
    align: 'left',
    tag: 'trap-kicker',
  });
  specs.push(GAP(6));
  const trapCount = Math.min(square ? 1 : 2, data.traps.length);
  for (let i = 0; i < trapCount; i += 1) {
    specs.push({ kind: 'trap', index: i + 1, trap: data.traps[i], tag: `trap-${i + 1}` });
  }
  if (!square && data.advice[0]) {
    specs.push({ kind: 'advice', advice: data.advice[0], tag: 'advice-1' });
  }
  specs.push(GAP(square ? 16 : 18));
  specs.push({
    kind: 'chips',
    labels: [p.tone === 'alert' ? '需重点观察' : p.tone === 'watch' ? '有优化空间' : '相对稳健', `信心 ${data.confidence}%`, `副人格 ${data.secondary.name}`],
    tag: 'chips',
  });
  specs.push(GAP(square ? 14 : 18));
  specs.push({
    kind: 'text',
    text: `「${p.shareLine}」`,
    size: square ? 27 : 29,
    weight: 600,
    mono: false,
    color: 'green',
    tracking: 0,
    maxLines: 2,
    lineHeight: 1.48,
    align: 'left',
    tag: 'share-line',
  });
  specs.push(GAP(square ? 14 : 18));
  specs.push({ kind: 'rule', tag: 'footer-rule' });
  specs.push(GAP(10));
  specs.push({
    kind: 'text',
    text: `${DISCLAIMER_SHORT}自我反思问卷，非心理测量，不代表真实交易水平。`,
    size: 18,
    weight: 400,
    mono: false,
    color: 'dim',
    tracking: 0,
    maxLines: 2,
    lineHeight: 1.45,
    align: 'left',
    tag: 'disclaimer',
  });
  specs.push(GAP(6));
  specs.push({
    kind: 'text',
    text: `${SITE_URL_LABEL} · ${data.dateLabel}`,
    size: 18,
    weight: 600,
    mono: true,
    color: 'faint',
    tracking: 1,
    maxLines: 1,
    lineHeight: 1.35,
    align: 'left',
    tag: 'footer',
  });
  return specs;
}

interface Measured {
  h: number;
  lines?: string[];
  nameSize?: number;
}

function measureSpec(ctx: Ctx2D, spec: Spec, inner: number, scale: number, data: ShareView): Measured {
  switch (spec.kind) {
    case 'space':
      return { h: spec.h * scale };
    case 'rule':
      return { h: 1 };
    case 'brandRow':
      return { h: 30 * scale };
    case 'gauge':
      return { h: 132 * scale };
    case 'bars':
      return { h: DIMENSIONS.length * 48 * scale };
    case 'chips':
      return { h: 36 * scale };
    case 'trap':
      return { h: 92 * scale };
    case 'advice':
      return { h: 96 * scale };
    case 'text': {
      ctx.font = fontOf(spec.size * scale, spec.weight, spec.mono);
      const width = spec.align === 'right' ? inner * 0.52 : inner;
      if (spec.tracking) return { h: spec.size * scale * spec.lineHeight, lines: [spec.text] };
      const lines = wrapText(ctx, spec.text, width).slice(0, spec.maxLines);
      let size = spec.size * scale;
      // 主人格名字：单行时按可用宽度等比缩小，避免省略或溢出
      if (spec.tag === 'persona-name') {
        ctx.font = fontOf(size, spec.weight, spec.mono);
        const w = ctx.measureText(spec.text).width;
        if (w > width) size = (size * width) / w;
        ctx.font = fontOf(size, spec.weight, spec.mono);
      }
      return { h: lines.length * size * spec.lineHeight, lines, nameSize: size };
    }
    default:
      return { h: 0 };
  }
  void data;
}

function layout(ctx: Ctx2D, data: ShareView, ratio: ShareRatio): LayoutResult {
  const { width, height } = SHARE_SIZES[ratio];
  const margin = ratio === '1:1' ? 66 : 70;
  const inner = width - margin * 2;
  const specs = buildSpecs(data, ratio === '1:1');
  let scale = 1;
  let blocks: Block[] = [];
  // 预留 8px，避免取整后的文字盒刚好顶到安全边距
  for (let attempt = 0; attempt < 30; attempt += 1) {
    blocks = specs.map((spec) => ({ spec, h: measureSpec(ctx, spec, inner, scale, data).h }));
    const total = blocks.reduce((sum, b) => sum + b.h, 0);
    if (total <= height - margin * 2 - 8) break;
    scale = Math.round((scale - 0.025) * 1000) / 1000;
    if (scale <= 0.6) break;
  }
  const total = blocks.reduce((sum, b) => sum + b.h, 0);
  return { blocks, scale, total, margin, width, height };
}

/* ------------------------------- 渲染 ------------------------------- */

interface DrawState {
  ctx: Ctx2D;
  palette: Palette;
  boxes: Box[];
  texts: string[];
  truncated: number;
  width: number;
  height: number;
  margin: number;
  scale: number;
}

function drawText(st: DrawState, spec: TextSpec, x: number, y: number, inner: number): number {
  const { ctx, palette } = st;
  const size = spec.size * st.scale;
  const width = spec.align === 'right' ? inner * 0.52 : inner;
  ctx.font = fontOf(size, spec.weight, spec.mono);
  ctx.fillStyle = palette[spec.color];
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  if (spec.tracking) {
    const baseline = y + size * 0.82;
    let tx = x;
    const w = measureTracked(ctx, spec.text, spec.tracking * st.scale);
    if (spec.align === 'right') tx = x + width - w;
    drawTracked(ctx, spec.text, tx, baseline, spec.tracking * st.scale);
    st.boxes.push({ x: Math.round(tx), y: Math.round(y), w: Math.ceil(w), h: Math.ceil(size * 1.2), tag: spec.tag });
    st.texts.push(spec.text);
    return size * spec.lineHeight;
  }

  let lines = wrapText(ctx, spec.text, width);
  if (lines.length > spec.maxLines) {
    lines = lines.slice(0, spec.maxLines);
    const last = lines[lines.length - 1];
    const indexPath = spec.tag === 'disclaimer' ? lines.length - 1 : lines.length - 1;
    lines[indexPath] = ellipsize(ctx, last, width);
    st.truncated += 1;
  }
  let cursor = y;
  for (const line of lines) {
    const w = ctx.measureText(line).width;
    const tx = spec.align === 'right' ? x + width - w : x;
    ctx.fillText(line, tx, cursor + size * 0.82);
    st.boxes.push({ x: Math.round(tx), y: Math.round(cursor), w: Math.ceil(w), h: Math.ceil(size * 1.18), tag: spec.tag });
    st.texts.push(line);
    cursor += size * spec.lineHeight;
  }
  return cursor - y;
}

function drawBars(st: DrawState, y: number, data: ShareView): number {
  const { ctx, palette, margin } = st;
  const rowH = 48 * st.scale;
  const inner = st.width - margin * 2;
  const labelW = 176 * st.scale;
  const valueW = 92 * st.scale;
  const barX = margin + labelW;
  const barW = inner - labelW - valueW;
  const s = st.scale;

  DIMENSIONS.forEach((dim, i) => {
    const top = y + i * rowH;
    const score = data.scores[dim.key];
    const band = bandOf(dim.key, score);
    const risky = dim.highIsRisky ? score > 60 : score < 40;

    ctx.textAlign = 'left';
    ctx.font = fontOf(21 * s, 600, false);
    ctx.fillStyle = palette.ink;
    ctx.fillText(dim.name, margin, top + 22 * s);
    ctx.font = fontOf(14 * s, 500, true);
    ctx.fillStyle = palette.faint;
    ctx.fillText(dim.code, margin, top + 40 * s);
    st.texts.push(dim.name, dim.code);

    ctx.fillStyle = palette.track;
    roundRect(ctx, barX, top + 12 * s, barW, 11 * s, 5.5 * s);
    ctx.fill();
    ctx.fillStyle = risky ? palette.orange : palette.green;
    roundRect(ctx, barX, top + 12 * s, Math.max(5 * s, (barW * score) / 100), 11 * s, 5.5 * s);
    ctx.fill();

    ctx.font = fontOf(13 * s, 500, true);
    ctx.fillStyle = palette.faint;
    ctx.fillText(`${dim.low} · ${dim.high}`, barX, top + 40 * s);
    st.texts.push(`${dim.low} · ${dim.high}`);

    ctx.textAlign = 'right';
    ctx.font = fontOf(22 * s, 700, true);
    ctx.fillStyle = palette.ink;
    ctx.fillText(String(score), st.width - margin, top + 24 * s);
    ctx.font = fontOf(13 * s, 500, false);
    ctx.fillStyle = palette.dim;
    ctx.fillText(band.label, st.width - margin, top + 42 * s);
    st.texts.push(String(score), band.label);
    ctx.textAlign = 'left';

    st.boxes.push({ x: margin, y: Math.round(top), w: inner, h: Math.ceil(rowH), tag: `bar-${dim.key}` });
  });
  return DIMENSIONS.length * rowH;
}

function drawGauge(st: DrawState, y: number, value: number): number {
  const { ctx, palette, margin } = st;
  const h = 132 * st.scale;
  const cx = st.width / 2;
  const r = 84 * st.scale;
  const cy = y + h - 30 * st.scale;
  ctx.lineWidth = 15 * st.scale;
  ctx.lineCap = 'butt';
  const start = Math.PI * 1.1;
  const end = Math.PI * 1.9;
  const segs = 28;
  for (let i = 0; i < segs; i += 1) {
    const t0 = (i + 0.08) / segs;
    const t1 = (i + 0.92) / segs;
    ctx.strokeStyle = t0 < 0.55 ? palette.green : t0 < 0.82 ? palette.orange : '#ff5d5d';
    ctx.beginPath();
    ctx.arc(cx, cy, r, start + (end - start) * t0, start + (end - start) * t1);
    ctx.stroke();
  }
  const angle = start + (end - start) * (value / 100);
  ctx.strokeStyle = palette.ink;
  ctx.lineWidth = 2.5 * st.scale;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(angle) * (r - 9 * st.scale), cy + Math.sin(angle) * (r - 9 * st.scale));
  ctx.stroke();
  ctx.fillStyle = palette.ink;
  ctx.beginPath();
  ctx.arc(cx, cy, 4.5 * st.scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = fontOf(15 * st.scale, 700, true);
  ctx.fillStyle = palette.faint;
  ctx.textAlign = 'left';
  ctx.fillText('RISK TEMP / 风险温度', margin, y + 16 * st.scale);
  ctx.textAlign = 'right';
  ctx.fillStyle = palette.ink;
  ctx.font = fontOf(20 * st.scale, 700, true);
  ctx.fillText(`${value}`, st.width - margin, y + 16 * st.scale);
  ctx.textAlign = 'left';
  st.texts.push('RISK TEMP / 风险温度', String(value));
  st.boxes.push({ x: margin, y: Math.round(y), w: st.width - margin * 2, h: Math.ceil(h), tag: 'gauge' });
  return h;
}

function drawChips(st: DrawState, y: number, labels: string[]): number {
  const { ctx, palette, margin } = st;
  const chipH = 34 * st.scale;
  const pad = 15 * st.scale;
  let cx = margin;
  ctx.font = fontOf(16 * st.scale, 600, false);
  labels.forEach((label) => {
    const tw = ctx.measureText(label).width;
    const cw = tw + pad * 2;
    if (cx + cw > st.width - margin + 0.5) return;
    ctx.fillStyle = palette.chipFill;
    roundRect(ctx, cx, y, cw, chipH, chipH / 2);
    ctx.fill();
    ctx.strokeStyle = palette.chipStroke;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = palette.green;
    ctx.fillText(label, cx + pad, y + chipH * 0.68);
    st.texts.push(label);
    st.boxes.push({ x: Math.round(cx), y: Math.round(y), w: Math.ceil(cw), h: Math.ceil(chipH), tag: 'chip' });
    cx += cw + 9 * st.scale;
  });
  return chipH;
}

function drawTrap(st: DrawState, y: number, index: number, trap: Trap): number {
  const { ctx, palette, margin } = st;
  const s = st.scale;
  const inner = st.width - margin * 2;
  const h = 92 * s;
  ctx.textAlign = 'left';
  ctx.font = fontOf(14 * s, 700, true);
  ctx.fillStyle = palette.orange;
  ctx.fillText(`${trap.code} · 陷阱 ${index}`, margin, y + 18 * s);
  st.texts.push(`${trap.code} · 陷阱 ${index}`);

  ctx.font = fontOf(26 * s, 700, false);
  ctx.fillStyle = palette.ink;
  const nameW = ctx.measureText(trap.name).width;
  if (nameW > inner) {
    ctx.font = fontOf((26 * s * inner) / nameW, 700, false);
  }
  ctx.fillText(trap.name, margin, y + 52 * s);
  st.texts.push(trap.name);

  ctx.font = fontOf(18 * s, 400, false);
  ctx.fillStyle = palette.dim;
  const line = ellipsize(ctx, trap.symptom, inner);
  if (line !== trap.symptom) st.truncated += 1;
  ctx.fillText(line, margin, y + 80 * s);
  st.texts.push(line);

  ctx.strokeStyle = palette.rule;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(margin, Math.round(y + h) + 0.5);
  ctx.lineTo(st.width - margin, Math.round(y + h) + 0.5);
  ctx.stroke();
  st.boxes.push({ x: margin, y: Math.round(y), w: inner, h: Math.ceil(h), tag: `trap-${index}` });
  return h;
}

function drawAdvice(st: DrawState, y: number, advice: Advice): number {
  const { ctx, palette, margin } = st;
  const s = st.scale;
  const inner = st.width - margin * 2;
  const h = 96 * s;
  ctx.textAlign = 'left';
  ctx.font = fontOf(14 * s, 700, true);
  ctx.fillStyle = palette.green;
  ctx.fillText(`${advice.code} · 今日口服纪律`, margin, y + 18 * s);
  st.texts.push(`${advice.code} · 今日口服纪律`);

  ctx.font = fontOf(23 * s, 700, false);
  ctx.fillStyle = palette.ink;
  const titleW = ctx.measureText(advice.title).width;
  if (titleW > inner) ctx.font = fontOf((23 * s * inner) / titleW, 700, false);
  ctx.fillText(advice.title, margin, y + 50 * s);
  st.texts.push(advice.title);

  ctx.font = fontOf(17 * s, 400, false);
  ctx.fillStyle = palette.dim;
  const action = ellipsize(ctx, advice.action, inner);
  if (action !== advice.action) st.truncated += 1;
  ctx.fillText(action, margin, y + 80 * s);
  st.texts.push(action);
  st.boxes.push({ x: margin, y: Math.round(y), w: inner, h: Math.ceil(h), tag: 'advice' });
  return h;
}

/** 绘制分享卡，返回可断言的几何与文本指标。 */
export function renderShareCard(
  canvas: HTMLCanvasElement,
  data: ShareView,
  ratio: ShareRatio,
  theme: ShareTheme,
): ShareMetrics {
  const palette = PALETTES[theme];
  const size = SHARE_SIZES[ratio];
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('当前浏览器不支持 Canvas 2D');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  const lay = layout(ctx, data, ratio);
  const st: DrawState = {
    ctx,
    palette,
    boxes: [],
    texts: [],
    truncated: 0,
    width: size.width,
    height: size.height,
    margin: lay.margin,
    scale: lay.scale,
  };

  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, size.width, size.height);

  /* 网格 */
  ctx.strokeStyle = theme === 'terminal' ? 'rgba(75,255,176,0.05)' : 'rgba(22,19,15,0.055)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= size.width; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, size.height);
    ctx.stroke();
  }
  for (let y = 0; y <= size.height; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(size.width, y + 0.5);
    ctx.stroke();
  }

  /* 品牌行 */
  const brandY = lay.margin;
  ctx.font = fontOf(21, 700, true);
  ctx.fillStyle = palette.green;
  drawTracked(ctx, `${SITE_EN}`, lay.margin, brandY + 22, 3);
  const enW = measureTracked(ctx, `${SITE_EN}`, 3);
  ctx.fillStyle = palette.dim;
  ctx.font = fontOf(19, 500, false);
  ctx.fillText(`· ${SITE_NAME}`, lay.margin + enW + 14, brandY + 22);
  st.texts.push(SITE_EN, SITE_NAME);

  ctx.textAlign = 'right';
  ctx.font = fontOf(18, 500, true);
  ctx.fillStyle = palette.faint;
  const meta = `NO.${data.reportId} / ${data.seed}`;
  ctx.fillText(meta, size.width - lay.margin, brandY + 22);
  st.texts.push(meta);
  st.boxes.push({ x: lay.margin, y: brandY, w: size.width - lay.margin * 2, h: 30, tag: 'brand-row' });
  ctx.textAlign = 'left';

  /* 内容 */
  let y = lay.margin + 30;
  const inner = size.width - lay.margin * 2;
  for (const block of lay.blocks) {
    const spec = block.spec;
    if (spec.tag === 'brand-row') continue;
    switch (spec.kind) {
      case 'space':
        y += block.h;
        break;
      case 'rule':
        ctx.strokeStyle = palette.rule;
        ctx.lineWidth = 1;
        const ry = Math.round(y) + 0.5;
        ctx.beginPath();
        ctx.moveTo(lay.margin, ry);
        ctx.lineTo(size.width - lay.margin, ry);
        ctx.stroke();
        y += block.h;
        break;
      case 'text':
        y += drawText(st, spec, lay.margin, y, inner);
        break;
      case 'gauge':
        y += drawGauge(st, y, data.riskTemperature);
        break;
      case 'bars':
        y += drawBars(st, y, data);
        break;
      case 'chips':
        y += drawChips(st, y, spec.labels);
        break;
      case 'trap':
        y += drawTrap(st, y, spec.index, spec.trap);
        break;
      case 'advice':
        y += drawAdvice(st, y, spec.advice);
        break;
      default:
        break;
    }
  }

  /* 右下角刻度尺（装饰，不参与内容高度） */
  st.boxes.push({ x: lay.margin, y: lay.margin, w: inner, h: Math.ceil(y - lay.margin), tag: 'content' });

  const contentBottom = Math.max(...st.boxes.filter((b) => b.tag !== 'brand-row').map((b) => b.y + b.h), 0);
  return {
    width: size.width,
    height: size.height,
    ratio,
    theme,
    margin: lay.margin,
    boxes: st.boxes,
    texts: st.texts,
    contentBottom,
    scale: lay.scale,
    truncated: st.truncated,
  };
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('图片导出失败：浏览器未能生成 PNG'));
    }, 'image/png');
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function shareFilename(ratio: ShareRatio, theme: ShareTheme, id: string): string {
  return `coin-persona-${id}-${ratio.replace(':', 'x')}-${theme}.png`;
}

export function makeShareView(input: {
  report: { id: string; seed: string; createdAt: string };
  result: { scores: DimensionScores; riskTemperature: number; disciplineIndex: number; confidence: number };
  primary: Archetype;
  secondary: Archetype;
  traps: Trap[];
  advice: Advice[];
}): ShareView {
  const date = new Date(input.report.createdAt);
  const dateLabel = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  return {
    reportId: input.report.id,
    seed: input.report.seed,
    dateLabel,
    primary: input.primary,
    secondary: input.secondary,
    scores: input.result.scores,
    traps: input.traps,
    advice: input.advice,
    riskTemperature: input.result.riskTemperature,
    disciplineIndex: input.result.disciplineIndex,
    confidence: input.result.confidence,
  };
}
