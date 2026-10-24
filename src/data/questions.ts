import { RAW_QUESTIONS } from './question-bank';
import { SCORE_MAP } from './score-map';
import type { Question } from './types';

/**
 * 组装层：把「题库文案」与「评分映射」按 题目 id + 选项 id 合并成运行时的 Question。
 * 任何选项缺少评分映射都会在模块加载时直接报错，避免静默按 0 分处理。
 */
export const QUESTIONS: Question[] = RAW_QUESTIONS.map((question) => ({
  ...question,
  options: question.options.map((option) => {
    const key = `${question.id}.${option.id}`;
    const scoring = SCORE_MAP[key];
    if (!scoring) throw new Error(`缺少评分映射：${key}`);
    return { ...option, effects: scoring.effects, tags: scoring.tags };
  }),
}));

/** 反向核对：评分映射里不能有题单中不存在的孤儿键。 */
export const ORPHAN_SCORE_KEYS = Object.keys(SCORE_MAP).filter(
  (key) => !QUESTIONS.some((q) => q.options.some((o) => `${q.id}.${o.id}` === key)),
);
