import { ARCHETYPE_MAP, type Archetype } from '../data/archetypes';
import { DIMENSIONS, DIMENSION_MAP, bandOf } from '../data/dimensions';
import { QUESTIONS } from '../data/questions';
import { ADVICE_MAP, TRAP_MAP, type Advice, type Trap } from '../data/traps';
import { DISCLAIMER_SHORT, SITE_EN, SITE_NAME, SITE_URL_LABEL } from '../data/site';
import type { Answers, DimensionScores, Question, TradeTag } from '../data/types';
import { buildQuiz } from './quiz';
import { makeReportId } from './rng';
import { SCORING_VERSION, scoreAnswers, type ScoringResult } from './scoring';

export interface Report {
  /** 报告短 id，稳定可复现。 */
  id: string;
  seed: string;
  createdAt: string;
  quizIds: string[];
  answers: Answers;
  scores: DimensionScores;
  primaryId: string;
  secondaryId: string;
  confidence: number;
  riskTemperature: number;
  disciplineIndex: number;
  trapIds: string[];
  adviceIds: string[];
  tags: Partial<Record<TradeTag, number>>;
  scoringVersion: string;
}

export const QUESTION_MAP: Record<string, Question> = QUESTIONS.reduce(
  (acc, q) => {
    acc[q.id] = q;
    return acc;
  },
  {} as Record<string, Question>,
);

export function quizFromIds(ids: string[]): Question[] {
  return ids.map((id) => QUESTION_MAP[id]).filter(Boolean);
}

export function buildReport(seed: string, quiz: Question[], answers: Answers, createdAt = new Date().toISOString()): Report | null {
  const result = scoreAnswers(quiz, answers);
  if (!result.ok) return null;
  return reportFromScoring(seed, quiz, answers, result, createdAt);
}

function reportFromScoring(
  seed: string,
  quiz: Question[],
  answers: Answers,
  result: ScoringResult,
  createdAt: string,
): Report {
  return {
    id: makeReportId(seed, answers),
    seed,
    createdAt,
    quizIds: quiz.map((q) => q.id),
    answers: { ...answers },
    scores: result.scores,
    primaryId: result.primary.id,
    secondaryId: result.secondary.id,
    confidence: result.confidence,
    riskTemperature: result.riskTemperature,
    disciplineIndex: result.disciplineIndex,
    trapIds: result.traps.map((t) => t.trap.id),
    adviceIds: result.advice.map((a) => a.id),
    tags: result.tags,
    scoringVersion: SCORING_VERSION,
  };
}

/** 校验保存下来的报告是否还和规则一致（题库升级后旧报告可能失效）。 */
export function verifyReport(report: Report): ScoringResult | null {
  const quiz = quizFromIds(report.quizIds);
  if (quiz.length !== report.quizIds.length) return null;
  const result = scoreAnswers(quiz, report.answers);
  if (!result.ok) return null;
  if (result.primary.id !== report.primaryId) return null;
  if (result.secondary.id !== report.secondaryId) return null;
  for (const key of Object.keys(report.scores) as (keyof DimensionScores)[]) {
    if (result.scores[key] !== report.scores[key]) return null;
  }
  return result;
}

export interface ReportView {
  report: Report;
  quiz: Question[];
  result: ScoringResult;
  primary: Archetype;
  secondary: Archetype;
  traps: Trap[];
  advice: Advice[];
}

export function viewOf(report: Report): ReportView | null {
  const quiz = quizFromIds(report.quizIds);
  const result = scoreAnswers(quiz, report.answers);
  if (!result.ok) return null;
  return {
    report,
    quiz,
    result,
    primary: ARCHETYPE_MAP[report.primaryId] ?? result.primary,
    secondary: ARCHETYPE_MAP[report.secondaryId] ?? result.secondary,
    traps: report.trapIds.map((id) => TRAP_MAP[id]).filter(Boolean),
    advice: report.adviceIds.map((id) => ADVICE_MAP[id]).filter(Boolean),
  };
}

/** 由 seed 重建题单，用于「重测同一套题」。 */
export function quizForSeed(seed: string): Question[] {
  return buildQuiz(seed);
}

/* ------------------------------ 文本导出 ------------------------------ */

export function dimensionLine(key: keyof DimensionScores, score: number): string {
  const dim = DIMENSION_MAP[key];
  const band = bandOf(key, score).label;
  return `${dim.name.padEnd(7, ' ')} ${String(score).padStart(3, ' ')}/100  ${band}`;
}

export function reportToText(report: Report, view?: ReportView | null): string {
  const v = view ?? viewOf(report);
  if (!v) return '报告数据已失效，请重新测试。';
  const { result, primary, secondary } = v;
  const date = new Date(report.createdAt);
  const stamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const lines: string[] = [
    `${SITE_NAME} · ${SITE_EN} — 交易人格报告`,
    `报告编号 ${report.id} · 题码 ${report.seed} · ${stamp}`,
    '',
    `主人格：${primary.name}（${primary.code}）`,
    `副人格：${secondary.name}（${secondary.code}）`,
    `拟合信心：${result.confidence}% · 风险温度 ${result.riskTemperature}/100 · 纪律指数 ${result.disciplineIndex}/100`,
    '',
    primary.oneLiner,
    '',
    '— 六维刻度 —',
    ...DIMENSIONS.map((d) => dimensionLine(d.key, report.scores[d.key])),
    '',
    '— 典型行为模式 —',
    ...primary.pattern.map((p, i) => `${i + 1}. ${p}`),
    '',
    '— 最容易犯的错误 —',
    ...v.traps.map((t, i) => `${i + 1}. ${t.name}：${t.symptom}`),
    '',
    '— 三条纪律处方 —',
    ...v.advice.map((a, i) => `${i + 1}. [${a.code}] ${a.title}\n   动作：${a.action}\n   验收：${a.metric}`),
    '',
    `个人标签：${primary.shareLine}`,
    '',
    `※ ${DISCLAIMER_SHORT}`,
    '※ 这是自我反思问卷，不是经过验证的心理测量，也不代表真实交易水平。',
    `※ 全部分数由本地确定性规则计算（${SCORING_VERSION}），未连接任何交易所或钱包。`,
    `${SITE_URL_LABEL}`,
  ];
  return lines.join('\n');
}
