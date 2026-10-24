/**
 * 规则层统一出口：给 Node 自测（esbuild 打包）和页面共用。
 * 这里只做 re-export，不含逻辑。
 */
export { QUESTIONS, ORPHAN_SCORE_KEYS } from '../data/questions';
export { SCORE_MAP, SCORE_MAP_SIZE } from '../data/score-map';
export { ARCHETYPES, ARCHETYPE_MAP, fitOf } from '../data/archetypes';
export { TRAPS, TRAP_MAP, ADVICE, ADVICE_MAP } from '../data/traps';
export { DIMENSIONS, DIMENSION_KEYS, DIMENSION_MAP, bandOf } from '../data/dimensions';
export { TOPICS } from '../data/types';
export type { Answers, DimensionKey, DimensionScores, Question, TradeTag } from '../data/types';
export { DISCLAIMER_LONG, DISCLAIMER_SHORT, PRIVACY_POINTS, SITE_URL_LABEL } from '../data/site';
export { buildQuiz, countForSeed, isComplete, answeredCount, validateQuestionBank, MIN_QUESTIONS, MAX_QUESTIONS } from './quiz';
export { scoreAnswers, rankTraps, pickAdvice, SCORING_VERSION, formatScoreDelta } from './scoring';
export { buildReport, viewOf, verifyReport, reportToText, quizFromIds, quizForSeed, QUESTION_MAP } from './report';
export { hashSeed, mulberry32, shuffle, makeSeed, normalizeSeed, isValidSeed, makeReportId } from './rng';
export { defaultState, loadState, saveState, withReport, withoutReport, formatBytes } from './storage';
export { SHARE_SIZES, SHARE_THEMES } from './share-types';
