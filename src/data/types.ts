/** 六个测量维度的键值。 */
export type DimensionKey = 'risk' | 'discipline' | 'emotion' | 'chase' | 'stop' | 'frequency';

/** 一个维度在整套题里的得分（0–100 整数）。 */
export type DimensionScores = Record<DimensionKey, number>;

/** 某一维度的五档文字标签。 */
export interface DimensionBand {
  index: 0 | 1 | 2 | 3 | 4;
  label: string;
}

/** 选项造成的维度变化。 */
export type Effects = Partial<Record<DimensionKey, number>>;

/** 行为标签：被「决策陷阱」与「纪律处方」引用，用于让报告更像你本人。 */
export const TRADE_TAGS = [
  'chase-green',
  'plan-follow',
  'paper-hand',
  'all-in',
  'copy-kol',
  'ignore-plan',
  'stop-exec',
  'move-stop',
  'add-to-loser',
  'no-stop',
  'bag-hold',
  'no-leverage',
  'risk-cap',
  'leverage-max',
  'revenge',
  'pause',
  'profit-bank',
  'verify',
  'news-only',
  'wait-confirm',
  'lottery',
  'write-plan',
  'no-plan',
  'cancel-stop',
  'trade-limit',
  'review',
  'overtrade',
  'scale-in',
] as const;

export type TradeTag = (typeof TRADE_TAGS)[number];

/** 情景题分类。 */
export const TOPICS = [
  { key: 'chasing', name: '追涨与止盈', code: 'CHASE' },
  { key: 'drawdown', name: '止损与补仓', code: 'DRAWDOWN' },
  { key: 'leverage', name: '杠杆使用', code: 'LEVERAGE' },
  { key: 'emotion', name: '亏损后情绪', code: 'EMOTION' },
  { key: 'profit', name: '盈利后心态', code: 'PROFIT' },
  { key: 'signal', name: '消息与信号', code: 'SIGNAL' },
  { key: 'sizing', name: '仓位管理', code: 'SIZING' },
  { key: 'plan', name: '计划执行', code: 'PLAN' },
  { key: 'impulse', name: 'FOMO 与过度交易', code: 'IMPULSE' },
] as const;

export type TopicKey = (typeof TOPICS)[number]['key'];

export interface QuestionOption {
  id: string;
  label: string;
  effects: Effects;
  tags?: TradeTag[];
}

export interface Question {
  id: string;
  topic: TopicKey;
  /** 情景标题，显示在题卡上方。 */
  scene: string;
  /** 题干。 */
  prompt: string;
  /** 终端风格的信息条，全部是虚构演示数据。 */
  chips: string[];
  options: QuestionOption[];
}

/** 单选题的作答：题目 id → 选项下标。 */
export type Answers = Record<string, number>;

export interface DimensionRuleTrace {
  sum: number;
  maxAbs: number;
  score: number;
}

export type ScoreTrace = Record<DimensionKey, DimensionRuleTrace>;
