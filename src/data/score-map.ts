/**
 * 评分映射层：每个选项对六个维度的影响值（-3…+3）与行为标签。
 * 这里不包含题干文案，也不包含人格描述；与 question-bank.ts 分离维护。
 *
 * 键格式：`${questionId}.${optionId}`，例如 `chase-breakout.a`。
 */
import type { Effects, TradeTag } from './types';

export interface OptionScore {
  /** 维度增量，缺省视为 0。 */
  effects: Effects;
  /** 行为标签，用于人格拟合与陷阱排序。 */
  tags?: TradeTag[];
}

export const SCORE_MAP: Record<string, OptionScore> = {
  // chase-breakout
  "chase-breakout.a": { effects: { risk: 2, chase: 3, discipline: -1, frequency: 1, stop: -1 }, tags: ["chase-green", "no-plan"] },
  "chase-breakout.b": { effects: { risk: 0, chase: -1, discipline: 2, stop: 1, frequency: -1 }, tags: ["wait-confirm", "write-plan"] },
  "chase-breakout.c": { effects: { risk: -1, chase: -2, discipline: 2, frequency: -1 }, tags: ["plan-follow", "risk-cap"] },
  "chase-breakout.d": { effects: { risk: 1, chase: 2, discipline: -1, stop: -1 }, tags: ["scale-in", "no-plan"] },
  "chase-breakout.e": { effects: { risk: 2, chase: -1, discipline: -1, emotion: -1, frequency: 1 }, tags: ["lottery"] },

  // chase-take-profit
  "chase-take-profit.a": { effects: { risk: -2, stop: 3, discipline: 1, emotion: 1 }, tags: ["profit-bank", "stop-exec"] },
  "chase-take-profit.b": { effects: { risk: 0, stop: 2, discipline: 2, frequency: 0 }, tags: ["profit-bank", "move-stop"] },
  "chase-take-profit.c": { effects: { risk: 2, stop: -2, chase: 1, discipline: -1 }, tags: ["no-stop"] },
  "chase-take-profit.d": { effects: { risk: 3, chase: 2, stop: -1, discipline: -1 }, tags: ["all-in", "chase-green"] },

  // chase-hot-alt
  "chase-hot-alt.a": { effects: { risk: 1, chase: 1, discipline: 2, stop: 2 }, tags: ["write-plan", "stop-exec"] },
  "chase-hot-alt.b": { effects: { risk: -2, chase: -2, discipline: 2, emotion: 1 }, tags: ["verify", "wait-confirm"] },
  "chase-hot-alt.c": { effects: { risk: 3, chase: 3, discipline: -2, stop: -1, frequency: 2 }, tags: ["all-in", "chase-green"] },
  "chase-hot-alt.d": { effects: { risk: 2, chase: 2, discipline: -1 }, tags: ["chase-green", "no-plan"] },

  // drawdown-stop-line
  "drawdown-stop-line.a": { effects: { risk: -2, discipline: 3, stop: 3, emotion: 1 }, tags: ["stop-exec", "plan-follow"] },
  "drawdown-stop-line.b": { effects: { risk: 1, discipline: -2, stop: -2, emotion: -1 }, tags: ["move-stop", "ignore-plan"] },
  "drawdown-stop-line.c": { effects: { risk: 3, stop: -2, discipline: -1, chase: 1 }, tags: ["add-to-loser", "no-stop"] },
  "drawdown-stop-line.d": { effects: { risk: 1, stop: -3, discipline: -1, emotion: -2, frequency: -1 }, tags: ["bag-hold", "no-stop"] },

  // drawdown-alt-crash
  "drawdown-alt-crash.a": { effects: { risk: -2, stop: 3, discipline: 2, emotion: 1 }, tags: ["stop-exec", "risk-cap"] },
  "drawdown-alt-crash.b": { effects: { risk: 2, stop: -2, discipline: -1, emotion: -1 }, tags: ["add-to-loser", "bag-hold"] },
  "drawdown-alt-crash.c": { effects: { risk: 1, stop: -2, frequency: -2, emotion: -1 }, tags: ["bag-hold", "no-stop"] },
  "drawdown-alt-crash.d": { effects: { risk: 0, stop: 1, discipline: 1 }, tags: ["stop-exec", "wait-confirm"] },

  // drawdown-stopped-out
  "drawdown-stopped-out.a": { effects: { discipline: 3, emotion: 3, stop: 2, frequency: -1 }, tags: ["review", "plan-follow"] },
  "drawdown-stopped-out.b": { effects: { risk: 2, chase: 3, emotion: -3, discipline: -2, frequency: 2, stop: -1 }, tags: ["revenge", "chase-green"] },
  "drawdown-stopped-out.c": { effects: { risk: 2, stop: -3, discipline: -2, emotion: -1 }, tags: ["move-stop", "ignore-plan"] },
  "drawdown-stopped-out.d": { effects: { discipline: 2, emotion: 2, stop: 2, frequency: -2 }, tags: ["pause", "review"] },

  // leverage-sizing
  "leverage-sizing.a": { effects: { risk: -1, discipline: 3, stop: 2, emotion: 1 }, tags: ["risk-cap", "write-plan"] },
  "leverage-sizing.b": { effects: { risk: 2, chase: 1, discipline: -1, stop: -1 }, tags: ["leverage-max", "lottery"] },
  "leverage-sizing.c": { effects: { risk: 3, discipline: -2, stop: -1, emotion: -1 }, tags: ["leverage-max", "all-in"] },
  "leverage-sizing.d": { effects: { risk: -3, discipline: 1, frequency: -1 }, tags: ["no-leverage", "risk-cap"] },

  // leverage-profit
  "leverage-profit.a": { effects: { risk: -1, discipline: 3, stop: 2, emotion: 2 }, tags: ["profit-bank", "risk-cap"] },
  "leverage-profit.b": { effects: { risk: 0, discipline: 3, stop: 3, emotion: 1 }, tags: ["move-stop", "stop-exec"] },
  "leverage-profit.c": { effects: { risk: 3, chase: 2, discipline: -2, stop: -1 }, tags: ["leverage-max", "scale-in"] },
  "leverage-profit.d": { effects: { risk: -2, stop: 2, emotion: 1 }, tags: ["profit-bank"] },

  // leverage-liquidation
  "leverage-liquidation.a": { effects: { discipline: 3, emotion: 3, frequency: -3, risk: -1 }, tags: ["pause", "review"] },
  "leverage-liquidation.b": { effects: { risk: 0, discipline: 1, stop: 1, emotion: 1 }, tags: ["trade-limit", "plan-follow"] },
  "leverage-liquidation.c": { effects: { risk: 3, emotion: -3, discipline: -2, frequency: 2, stop: -2 }, tags: ["revenge", "all-in"] },
  "leverage-liquidation.d": { effects: { risk: 2, discipline: -2, emotion: -2, frequency: 1 }, tags: ["no-plan", "overtrade"] },

  // emotion-big-loss
  "emotion-big-loss.a": { effects: { emotion: 3, discipline: 2, frequency: -1 }, tags: ["pause", "trade-limit"] },
  "emotion-big-loss.b": { effects: { emotion: 2, discipline: 3 }, tags: ["review", "write-plan"] },
  "emotion-big-loss.c": { effects: { emotion: -3, discipline: -2, risk: 2, frequency: 2 }, tags: ["revenge", "overtrade"] },
  "emotion-big-loss.d": { effects: { emotion: -2, discipline: -1, frequency: 1 }, tags: ["overtrade", "no-plan"] },

  // emotion-others-profit
  "emotion-others-profit.a": { effects: { emotion: 3, discipline: 2, chase: -2, frequency: -1 }, tags: ["plan-follow", "pause"] },
  "emotion-others-profit.b": { effects: { chase: 3, risk: 2, emotion: -2, discipline: -2 }, tags: ["copy-kol", "chase-green"] },
  "emotion-others-profit.c": { effects: { risk: 3, chase: 2, emotion: -2, frequency: 2 }, tags: ["leverage-max", "overtrade"] },
  "emotion-others-profit.d": { effects: { emotion: 2, discipline: 1, chase: -2 }, tags: ["pause", "verify"] },

  // emotion-losing-streak
  "emotion-losing-streak.a": { effects: { discipline: 3, emotion: 2, frequency: -2 }, tags: ["trade-limit", "pause"] },
  "emotion-losing-streak.b": { effects: { discipline: -1, emotion: -1, frequency: 2 }, tags: ["overtrade", "no-plan"] },
  "emotion-losing-streak.c": { effects: { risk: 3, emotion: -3, discipline: -2, frequency: 2 }, tags: ["revenge", "all-in"] },
  "emotion-losing-streak.d": { effects: { emotion: 3, discipline: 1, frequency: -2 }, tags: ["pause", "review"] },

  // profit-good-month
  "profit-good-month.a": { effects: { risk: -2, discipline: 3, emotion: 2, stop: 1 }, tags: ["profit-bank", "risk-cap"] },
  "profit-good-month.b": { effects: { risk: 3, chase: 2, discipline: -2, frequency: 1 }, tags: ["all-in", "overtrade"] },
  "profit-good-month.c": { effects: { risk: -1, discipline: 2, emotion: 2 }, tags: ["risk-cap", "review"] },
  "profit-good-month.d": { effects: { risk: 3, chase: 2, discipline: -1, stop: -1 }, tags: ["leverage-max", "chase-green"] },

  // profit-sold-too-early
  "profit-sold-too-early.a": { effects: { discipline: 3, emotion: 3 }, tags: ["review", "plan-follow"] },
  "profit-sold-too-early.b": { effects: { chase: 3, risk: 2, emotion: -2, discipline: -2 }, tags: ["chase-green", "revenge"] },
  "profit-sold-too-early.c": { effects: { risk: 2, chase: 1, discipline: -2, stop: -1 }, tags: ["ignore-plan", "no-plan"] },
  "profit-sold-too-early.d": { effects: { emotion: 2, discipline: 1, chase: -1 }, tags: ["pause", "plan-follow"] },

  // signal-kol-insider
  "signal-kol-insider.a": { effects: { chase: -2, discipline: 2, emotion: 1 }, tags: ["verify", "wait-confirm"] },
  "signal-kol-insider.b": { effects: { risk: 1, chase: 1, stop: 2, discipline: 1 }, tags: ["lottery", "stop-exec"] },
  "signal-kol-insider.c": { effects: { risk: 3, chase: 3, discipline: -2, stop: -1 }, tags: ["copy-kol", "all-in"] },
  "signal-kol-insider.d": { effects: { risk: 2, chase: -1, discipline: -1, emotion: -1 }, tags: ["lottery"] },

  // signal-conflict
  "signal-conflict.a": { effects: { risk: -1, discipline: 2, stop: 2, emotion: 1 }, tags: ["profit-bank", "wait-confirm"] },
  "signal-conflict.b": { effects: { risk: 2, chase: 1, stop: -1, discipline: -1 }, tags: ["chase-green", "ignore-plan"] },
  "signal-conflict.c": { effects: { risk: -1, stop: 2, discipline: 1 }, tags: ["news-only", "stop-exec"] },
  "signal-conflict.d": { effects: { discipline: 2, emotion: 1, frequency: -1 }, tags: ["pause", "verify"] },

  // signal-screenshot
  "signal-screenshot.a": { effects: { discipline: 3, emotion: 2, chase: -1 }, tags: ["verify", "review"] },
  "signal-screenshot.b": { effects: { risk: 1, chase: 2, discipline: -1 }, tags: ["chase-green", "no-plan"] },
  "signal-screenshot.c": { effects: { risk: 3, chase: 3, discipline: -2, stop: -1 }, tags: ["copy-kol", "all-in"] },
  "signal-screenshot.d": { effects: { discipline: 1, emotion: 1, chase: -2 }, tags: ["verify", "pause"] },

  // sizing-per-trade
  "sizing-per-trade.a": { effects: { risk: -2, discipline: 3, stop: 2 }, tags: ["risk-cap", "write-plan"] },
  "sizing-per-trade.b": { effects: { risk: 1, discipline: -1 }, tags: ["no-plan"] },
  "sizing-per-trade.c": { effects: { risk: 3, discipline: -2, stop: -1 }, tags: ["all-in", "chase-green"] },
  "sizing-per-trade.d": { effects: { risk: 2, chase: 1, discipline: -1, stop: -1 }, tags: ["all-in", "no-plan"] },

  // sizing-portfolio
  "sizing-portfolio.a": { effects: { discipline: 2, risk: -1, emotion: 1 }, tags: ["risk-cap", "review"] },
  "sizing-portfolio.b": { effects: { discipline: 1 }, tags: ["risk-cap"] },
  "sizing-portfolio.c": { effects: { risk: 2, discipline: -2, frequency: 1 }, tags: ["no-plan", "overtrade"] },
  "sizing-portfolio.d": { effects: { risk: -2, discipline: 2, frequency: -1, stop: 1 }, tags: ["risk-cap", "no-leverage"] },

  // sizing-add
  "sizing-add.a": { effects: { discipline: 3, stop: 2, risk: 1 }, tags: ["scale-in", "write-plan"] },
  "sizing-add.b": { effects: { risk: 2, stop: -2, discipline: -1, emotion: -1 }, tags: ["add-to-loser", "no-stop"] },
  "sizing-add.c": { effects: { discipline: -2, risk: 1, frequency: 1 }, tags: ["no-plan", "overtrade"] },
  "sizing-add.d": { effects: { discipline: 2, stop: 2, risk: -1, frequency: -1 }, tags: ["plan-follow", "risk-cap"] },

  // plan-before-entry
  "plan-before-entry.a": { effects: { discipline: 3, stop: 3, emotion: 1 }, tags: ["write-plan", "plan-follow"] },
  "plan-before-entry.b": { effects: { stop: -1 }, tags: ["no-plan"] },
  "plan-before-entry.c": { effects: { discipline: -2, stop: -1, frequency: 1 }, tags: ["no-plan", "overtrade"] },
  "plan-before-entry.d": { effects: { discipline: -3, stop: -2, emotion: -1, frequency: 1 }, tags: ["no-plan", "overtrade"] },

  // plan-conflict
  "plan-conflict.a": { effects: { discipline: 3, emotion: 2, chase: -2 }, tags: ["plan-follow", "pause"] },
  "plan-conflict.b": { effects: { chase: 2, discipline: -1, risk: 1 }, tags: ["chase-green", "ignore-plan"] },
  "plan-conflict.c": { effects: { discipline: -2, stop: -1, chase: 1, emotion: -1 }, tags: ["ignore-plan", "no-plan"] },
  "plan-conflict.d": { effects: { frequency: 2, discipline: -1, emotion: -1 }, tags: ["overtrade", "no-plan"] },

  // plan-no-setup
  "plan-no-setup.a": { effects: { discipline: 3, emotion: 2, frequency: -3 }, tags: ["plan-follow", "trade-limit"] },
  "plan-no-setup.b": { effects: { discipline: -1, frequency: 2, chase: 1 }, tags: ["overtrade", "ignore-plan"] },
  "plan-no-setup.c": { effects: { discipline: -2, frequency: 2, emotion: -1 }, tags: ["overtrade", "lottery"] },
  "plan-no-setup.d": { effects: { risk: 1, frequency: 1, discipline: -1, chase: 1 }, tags: ["overtrade", "lottery"] },

  // impulse-midnight-wick
  "impulse-midnight-wick.a": { effects: { discipline: 3, emotion: 3, frequency: -1 }, tags: ["pause", "plan-follow"] },
  "impulse-midnight-wick.b": { effects: { discipline: 1, emotion: 1 }, tags: ["review"] },
  "impulse-midnight-wick.c": { effects: { risk: 3, chase: 2, discipline: -2, frequency: 2 }, tags: ["leverage-max", "lottery"] },
  "impulse-midnight-wick.d": { effects: { risk: -2, emotion: -2, stop: 2, frequency: 1 }, tags: ["paper-hand", "stop-exec"] },

  // impulse-daily-count
  "impulse-daily-count.a": { effects: { frequency: -3, discipline: 2, chase: -1 }, tags: ["trade-limit", "plan-follow"] },
  "impulse-daily-count.b": { effects: { frequency: 0, discipline: 1 }, tags: ["trade-limit"] },
  "impulse-daily-count.c": { effects: { frequency: 2, discipline: -1, emotion: -1 }, tags: ["overtrade"] },
  "impulse-daily-count.d": { effects: { frequency: 3, discipline: -2, emotion: -1, chase: 1 }, tags: ["overtrade", "no-plan"] },

  // impulse-boredom
  "impulse-boredom.a": { effects: { frequency: -2, discipline: 2, emotion: 1 }, tags: ["pause", "trade-limit"] },
  "impulse-boredom.b": { effects: { discipline: 1 }, tags: ["write-plan"] },
  "impulse-boredom.c": { effects: { frequency: 2, discipline: -1, risk: 1 }, tags: ["overtrade", "lottery"] },
  "impulse-boredom.d": { effects: { chase: -1, discipline: 1, frequency: -1 }, tags: ["verify", "review"] },

};

/** 统计：题单里的选项总数（测试用于断言映射完整）。 */
export const SCORE_MAP_SIZE = Object.keys(SCORE_MAP).length;
