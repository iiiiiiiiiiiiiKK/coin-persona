import { QUESTIONS } from '../data/questions';
import type { Answers, Question } from '../data/types';
import { hashSeed, mulberry32, shuffle } from './rng';

/**
 * 抽题规则（确定性）：
 *   1. 由 seed 派生 PRNG；
 *   2. 题数 = 12 + hash(seed) % 5 → 12–16 道；
 *   3. 先每个主题抽 1 道（9 个主题都覆盖），再从未抽中的题里补足；
 *   4. 最后按 seed 再洗一次题序。
 * 同一 seed 永远得到同一套题、同一顺序；不同 seed 题量与组合会变化。
 */
export const MIN_QUESTIONS = 12;
export const MAX_QUESTIONS = 16;

export function countForSeed(seed: string): number {
  return MIN_QUESTIONS + (hashSeed(`count:${seed}`) % (MAX_QUESTIONS - MIN_QUESTIONS + 1));
}

export function buildQuiz(seed: string, bank: Question[] = QUESTIONS): Question[] {
  const rng = mulberry32(hashSeed(`quiz:${seed}`));
  const target = Math.min(Math.min(MAX_QUESTIONS, Math.max(MIN_QUESTIONS, countForSeed(seed))), bank.length);

  const buckets = new Map<string, Question[]>();
  for (const q of bank) {
    const list = buckets.get(q.topic) ?? [];
    list.push(q);
    buckets.set(q.topic, list);
  }

  const chosen: Question[] = [];
  const topics = shuffle([...buckets.keys()], rng);
  for (const topic of topics) {
    if (chosen.length >= target) break;
    const pool = buckets.get(topic) ?? [];
    if (pool.length) chosen.push(pool[Math.floor(rng() * pool.length)]);
  }

  const rest = shuffle(
    bank.filter((q) => !chosen.includes(q)),
    rng,
  );
  for (const q of rest) {
    if (chosen.length >= target) break;
    chosen.push(q);
  }

  return shuffle(chosen, rng).slice(0, target);
}

/** 校验一份答案是否完整覆盖本次题单。 */
export function isComplete(quiz: Question[], answers: Answers): boolean {
  return quiz.every((q) => {
    const idx = answers[q.id];
    return Number.isInteger(idx) && idx >= 0 && idx < q.options.length;
  });
}

export function answeredCount(quiz: Question[], answers: Answers): number {
  return quiz.filter((q) => Number.isInteger(answers[q.id]) && answers[q.id] >= 0 && answers[q.id] < q.options.length).length;
}

/** 题库健康检查，测试与开发期都会调用。 */
export function validateQuestionBank(bank: Question[] = QUESTIONS): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const q of bank) {
    if (ids.has(q.id)) problems.push(`重复题目 id: ${q.id}`);
    ids.add(q.id);
    if (q.options.length < 3 || q.options.length > 5) problems.push(`${q.id} 选项数量应为 3–5，实际 ${q.options.length}`);
    const optIds = new Set<string>();
    for (const opt of q.options) {
      if (optIds.has(opt.id)) problems.push(`${q.id} 重复选项 id: ${opt.id}`);
      optIds.add(opt.id);
      if (!opt.label.trim()) problems.push(`${q.id}/${opt.id} 选项文案为空`);
      if (!Object.keys(opt.effects).length) problems.push(`${q.id}/${opt.id} 未映射任何维度`);
    }
    if (!q.scene.trim() || !q.prompt.trim()) problems.push(`${q.id} 缺少情景或题干`);
  }
  return problems;
}
