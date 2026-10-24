import { ARCHETYPES, fitOf, type Archetype, type PersonaContext } from '../data/archetypes';
import { DIMENSION_KEYS } from '../data/dimensions';
import { ADVICE, ADVICE_MAP, TRAP_MAP, TRAPS, type Advice, type Trap } from '../data/traps';
import type { Answers, DimensionKey, DimensionScores, Question, ScoreTrace, TradeTag } from '../data/types';

export const SCORING_VERSION = 'rules-v1.0.0';
export const SCORE_BASE = 50;

export interface DimensionResult {
  key: DimensionKey;
  score: number;
  raw: number;
  potential: number;
  delta: number;
}

export interface TrapHit {
  trap: Trap;
  /** 命中分数，仅用于排序，不展示。 */
  weight: number;
  /** 命中的行为标签或维度，报告里用作「依据」。 */
  reasons: string[];
}

export interface ScoringResult {
  ok: true;
  count: number;
  scores: DimensionScores;
  trace: ScoreTrace;
  tags: Partial<Record<TradeTag, number>>;
  tagList: { tag: TradeTag; count: number }[];
  dominant: DimensionKey;
  primary: Archetype;
  secondary: Archetype;
  primaryFit: number;
  secondaryFit: number;
  fitGap: number;
  confidence: number;
  traps: TrapHit[];
  advice: Advice[];
  riskTemperature: number;
  disciplineIndex: number;
  composite: number;
}

export interface ScoringError {
  ok: false;
  error: string;
}

/**
 * 确定性评分：
 *   1. 每个维度从 50 分出发；
 *   2. 把本题单中该维度所有选项的最大绝对影响求和，作为本套题的理论满量程；
 *   3. 实际得分 = 50 + 50 × (本题所选影响之和 / 满量程)，四舍五入取整，限制在 0–100。
 *
 * 因此同一套题 + 同一组答案永远得到同一分数；不同题单之间的分数不会因为
 * 题目数量多少而系统性偏高或偏低。没有任何随机项、时间项或 AI 参与。
 */
export function scoreAnswers(quiz: Question[], answers: Answers): ScoringResult | ScoringError {
  if (!quiz.length) return { ok: false, error: '题单为空' };

  const seen = new Set<string>();
  for (const q of quiz) {
    if (seen.has(q.id)) return { ok: false, error: `题单包含重复题目 ${q.id}` };
    seen.add(q.id);
    const idx = answers[q.id];
    if (!Number.isInteger(idx) || idx < 0 || idx >= q.options.length) {
      return { ok: false, error: `题目 ${q.id} 尚未作答或选项越界` };
    }
  }

  const sums: Record<DimensionKey, number> = { risk: 0, discipline: 0, emotion: 0, chase: 0, stop: 0, frequency: 0 };
  const potentials: Record<DimensionKey, number> = { risk: 0, discipline: 0, emotion: 0, chase: 0, stop: 0, frequency: 0 };
  const tags: Partial<Record<TradeTag, number>> = {};

  for (const q of quiz) {
    for (const key of DIMENSION_KEYS) {
      let maxAbs = 0;
      for (const opt of q.options) {
        const v = opt.effects[key] ?? 0;
        if (Math.abs(v) > maxAbs) maxAbs = Math.abs(v);
      }
      potentials[key] += maxAbs;
    }
    const chosen = q.options[answers[q.id]];
    for (const key of DIMENSION_KEYS) sums[key] += chosen.effects[key] ?? 0;
    for (const t of chosen.tags ?? []) tags[t] = (tags[t] ?? 0) + 1;
  }

  const scores: DimensionScores = { risk: 50, discipline: 50, emotion: 50, chase: 50, stop: 50, frequency: 50 };
  const trace = {} as ScoreTrace;
  for (const key of DIMENSION_KEYS) {
    const potential = potentials[key];
    const raw = sums[key];
    const value = potential > 0 ? SCORE_BASE + (raw / potential) * 50 : SCORE_BASE;
    const score = Math.max(0, Math.min(100, Math.round(value)));
    scores[key] = score;
    trace[key] = { sum: raw, maxAbs: potential, score };
  }

  let dominant: DimensionKey = 'risk';
  let bestDelta = -1;
  for (const key of DIMENSION_KEYS) {
    const delta = Math.abs(scores[key] - 50);
    if (delta > bestDelta) {
      bestDelta = delta;
      dominant = key;
    }
  }

  const ctx: PersonaContext = { scores, tags, count: quiz.length, dominant };
  const ranked = ARCHETYPES.map((a, index) => ({ a, index, fit: fitOf(a, ctx) })).sort(
    (x, y) => y.fit - x.fit || x.index - y.index,
  );
  const primary = ranked[0].a;
  const families: Record<string, string> = {
    'trend-chaser': 'momentum',
    'impulse-trader': 'momentum',
    'revenge-trader': 'momentum',
    'leverage-believer': 'momentum',
    'dip-catcher': 'contrarian',
    'bag-holder': 'contrarian',
    'risk-officer': 'process',
    'breakout-confirmer': 'process',
    'range-scalper': 'process',
    'paper-hands': 'income',
    'conviction-holder': 'income',
    'news-trader': 'info',
  };
  const primaryFamily = families[primary.id] ?? primary.id;
  const secondaryPick = ranked
    .filter((r) => r.a.id !== primary.id)
    .map((r) => ({ ...r, adjusted: r.fit - (families[r.a.id] === primaryFamily ? 6 : 0) }))
    .sort((x, y) => y.adjusted - x.adjusted || x.index - y.index)[0];
  const secondary = secondaryPick.a;

  const primaryFit = round2(ranked[0].fit);
  const secondaryFit = round2(ranked.find((r) => r.a.id === secondary.id)?.fit ?? 0);
  const fitGap = round2(primaryFit - secondaryFit);

  const tagList = (Object.entries(tags) as [TradeTag, number][])
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

  const trapHits = rankTraps(primary, secondary, scores, tags, dominant).slice(0, 3);
  const advice = pickAdvice(primary, secondary, scores, dominant).slice(0, 3);

  const riskTemperature = Math.round(
    0.4 * scores.risk + 0.25 * scores.chase + 0.2 * scores.frequency + 0.15 * (100 - scores.stop),
  );
  const disciplineIndex = Math.round(0.5 * scores.discipline + 0.3 * scores.stop + 0.2 * scores.emotion);
  const composite = Math.round(0.5 * riskTemperature + 0.5 * disciplineIndex);
  const coverage = Math.min(1, quiz.length / 14);
  const confidence = Math.round(40 + 30 * coverage + Math.min(30, fitGap * 1.2));

  return {
    ok: true,
    count: quiz.length,
    scores,
    trace,
    tags,
    tagList,
    dominant,
    primary,
    secondary,
    primaryFit,
    secondaryFit,
    fitGap,
    confidence: Math.min(96, confidence),
    traps: trapHits,
    advice,
    riskTemperature,
    disciplineIndex,
    composite,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** 陷阱排序：人格预设 + 行为标签 + 维度极端程度。 */
export function rankTraps(
  primary: Archetype,
  secondary: Archetype,
  scores: DimensionScores,
  tags: Partial<Record<TradeTag, number>>,
  dominant: DimensionKey,
): TrapHit[] {
  const tagCount = (t: TradeTag) => tags[t] ?? 0;
  const weights = new Map<string, { weight: number; reasons: string[] }>();
  const add = (id: string, weight: number, reason: string) => {
    if (!TRAP_MAP[id]) return;
    const cur = weights.get(id) ?? { weight: 0, reasons: [] };
    cur.weight += weight;
    if (reason && !cur.reasons.includes(reason)) cur.reasons.push(reason);
    weights.set(id, cur);
  };

  primary.trapIds.forEach((id, i) => add(id, 26 - i * 3, `${primary.name}的典型盲区`));
  secondary.trapIds.forEach((id, i) => add(id, 10 - i * 2, `${secondary.name}的另一面`));

  add('chase-the-top', Math.max(0, scores.chase - 50) * 1.1 + tagCount('chase-green') * 7, '追涨冲动偏高');
  add('averaging-down', Math.max(0, scores.risk - 55) * 0.7 + tagCount('add-to-loser') * 9, '有越跌越买的倾向');
  add('no-stop-loss', Math.max(0, 55 - scores.stop) * 1.2 + tagCount('bag-hold') * 7, '止损执行倾向偏低');
  add('overtrading', Math.max(0, scores.frequency - 50) * 1.1 + tagCount('overtrade') * 6, '交易频率偏高');
  add('revenge-loop', Math.max(0, 60 - scores.emotion) * 1.0 + tagCount('revenge') * 10, '亏损后情绪波动较大');
  add('all-in-conviction', Math.max(0, scores.risk - 60) * 0.9 + tagCount('all-in') * 8, '仓位集中度高');
  add('no-plan-entry', Math.max(0, 60 - scores.discipline) * 0.9 + tagCount('no-plan') * 6, '交易计划缺失');
  add('cut-winners', tagCount('profit-bank') * 7 + Math.max(0, scores.stop - 65) * 0.5, '止盈执行过于积极');
  add('liquidation-risk', Math.max(0, scores.risk - 60) * 0.8 + tagCount('leverage-max') * 10, '杠杆使用偏激进');
  add('narrative-trust', tagCount('copy-kol') * 9 + tagCount('news-only') * 8 + Math.max(0, 55 - scores.discipline) * 0.6, '依赖未验证消息');
  add('fomo-watch', Math.max(0, scores.chase - 55) * 0.8 + Math.max(0, 60 - scores.emotion) * 0.7, '容易被他人收益影响');
  add('paper-hand-aftershock', tagCount('profit-bank') * 4 + Math.max(0, 45 - scores.risk) * 0.6, '卖飞后容易追回');

  if (dominant === 'risk') add('all-in-conviction', 4, '风险维度最突出');
  if (dominant === 'frequency') add('overtrading', 4, '频率维度最突出');
  if (dominant === 'stop') add('no-stop-loss', 4, '止损维度最突出');
  if (dominant === 'discipline') add('no-plan-entry', 4, '纪律维度最突出');
  if (dominant === 'emotion') add('revenge-loop', 4, '情绪维度最突出');
  if (dominant === 'chase') add('chase-the-top', 4, '追涨维度最突出');

  return [...weights.entries()]
    .map(([id, v]) => ({ trap: TRAP_MAP[id], weight: round2(v.weight), reasons: v.reasons }))
    .sort((a, b) => b.weight - a.weight || TRAPS.findIndex((t) => t.id === a.trap.id) - TRAPS.findIndex((t) => t.id === b.trap.id));
}

/** 纪律处方：优先主人格指定条目，再按维度缺口补齐，保证 3 条不重复。 */
export function pickAdvice(
  primary: Archetype,
  secondary: Archetype,
  scores: DimensionScores,
  dominant: DimensionKey,
): Advice[] {
  const picked: Advice[] = [];
  const used = new Set<string>();
  const push = (id: string) => {
    const advice = ADVICE_MAP[id];
    if (advice && !used.has(id)) {
      used.add(id);
      picked.push(advice);
    }
  };

  // 主人格的三条处方优先：它直接对应该类型的典型盲区
  primary.adviceIds.forEach((id) => push(id));
  secondary.adviceIds.forEach((id) => {
    if (picked.length < 3) push(id);
  });

  const gaps: { key: DimensionKey; gap: number }[] = [
    { key: 'discipline', gap: 60 - scores.discipline },
    { key: 'stop', gap: 60 - scores.stop },
    { key: 'emotion', gap: 60 - scores.emotion },
    { key: 'risk', gap: scores.risk - 55 },
    { key: 'frequency', gap: scores.frequency - 55 },
    { key: 'chase', gap: scores.chase - 55 },
  ] as { key: DimensionKey; gap: number }[];
  gaps.sort((a, b) => b.gap - a.gap);

  const dimensionOrder: DimensionKey[] = [dominant, ...gaps.map((g) => g.key)];
  for (const key of dimensionOrder) {
    if (picked.length >= 3) break;
    const candidates = ADVICE.filter((a) => a.dimension === key);
    for (const a of candidates) {
      if (picked.length >= 3) break;
      push(a.id);
    }
  }
  for (const a of ADVICE) {
    if (picked.length >= 3) break;
    push(a.id);
  }
  return picked.slice(0, 3);
}

/** 报告文字层：把分数转成短句，全部是模板 + 分数，不含随机。 */
export function formatScoreDelta(score: number): string {
  const d = score - 50;
  if (d === 0) return '±0';
  return d > 0 ? `+${d}` : `${d}`;
}
