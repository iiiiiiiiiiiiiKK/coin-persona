import type { DimensionBand, DimensionKey, DimensionScores } from './types';

export interface Dimension {
  key: DimensionKey;
  /** 英文代码，终端风格标签。 */
  code: string;
  name: string;
  /** 维度两端的中文锚点。 */
  low: string;
  high: string;
  /** 分数越高是否越偏「危险」方向，用于图表着色与文案。 */
  highIsRisky: boolean;
  description: string;
  bands: [DimensionBand, DimensionBand, DimensionBand, DimensionBand, DimensionBand];
}

export const DIMENSIONS: Dimension[] = [
  {
    key: 'risk',
    code: 'RISK',
    name: '风险承受倾向',
    low: '保守',
    high: '激进',
    highIsRisky: true,
    description: '你愿意为一笔交易承担多大的波动与回撤，以及亏损后是否愿意继续下注。',
    bands: [
      { index: 0, label: '极保守' },
      { index: 1, label: '偏保守' },
      { index: 2, label: '中性' },
      { index: 3, label: '偏激进' },
      { index: 4, label: '极激进' },
    ],
  },
  {
    key: 'discipline',
    code: 'DISCIPLINE',
    name: '决策纪律',
    low: '随性',
    high: '自律',
    highIsRisky: false,
    description: '你是否在开单前写下规则，并在情绪变化时仍然按规则执行。',
    bands: [
      { index: 0, label: '几乎无规则' },
      { index: 1, label: '常临时改口' },
      { index: 2, label: '规则时有时无' },
      { index: 3, label: '多数时候守规矩' },
      { index: 4, label: '高度自律' },
    ],
  },
  {
    key: 'emotion',
    code: 'STABILITY',
    name: '情绪稳定倾向',
    low: '易波动',
    high: '稳',
    highIsRisky: false,
    description: '在连续亏损、踏空、被止损打掉之后，你恢复理性所需的时间。',
    bands: [
      { index: 0, label: '极易上头' },
      { index: 1, label: '容易受影响' },
      { index: 2, label: '起伏正常' },
      { index: 3, label: '恢复较快' },
      { index: 4, label: '相当稳定' },
    ],
  },
  {
    key: 'chase',
    code: 'FOMO',
    name: '追涨冲动',
    low: '冷静',
    high: '冲动',
    highIsRisky: true,
    description: '上涨、踏空与社群情绪对你的买入决策有多大推力。',
    bands: [
      { index: 0, label: '几乎不追' },
      { index: 1, label: '偶尔心动' },
      { index: 2, label: '看情况' },
      { index: 3, label: '常常想追' },
      { index: 4, label: '先买再想' },
    ],
  },
  {
    key: 'stop',
    code: 'STOP',
    name: '止损执行倾向',
    low: '拖延',
    high: '果断',
    highIsRisky: false,
    description: '当价格触及你事先设定的失效条件时，你实际动手的概率。',
    bands: [
      { index: 0, label: '几乎不止损' },
      { index: 1, label: '经常往后拖' },
      { index: 2, label: '看心情执行' },
      { index: 3, label: '大多能执行' },
      { index: 4, label: '条件单级执行' },
    ],
  },
  {
    key: 'frequency',
    code: 'TEMPO',
    name: '交易频率偏好',
    low: '低频',
    high: '高频',
    highIsRisky: true,
    description: '你偏好的出手密度：是等少数机会，还是需要在盘面上持续有动作。',
    bands: [
      { index: 0, label: '极低频' },
      { index: 1, label: '偏低频' },
      { index: 2, label: '中等' },
      { index: 3, label: '偏高频率' },
      { index: 4, label: '手不离键盘' },
    ],
  },
];

export const DIMENSION_KEYS: DimensionKey[] = DIMENSIONS.map((d) => d.key);

export const DIMENSION_MAP: Record<DimensionKey, Dimension> = DIMENSIONS.reduce(
  (acc, d) => {
    acc[d.key] = d;
    return acc;
  },
  {} as Record<DimensionKey, Dimension>,
);

export function bandOf(key: DimensionKey, score: number): DimensionBand {
  const index = Math.min(4, Math.max(0, Math.floor(score / 20)));
  return DIMENSION_MAP[key].bands[index];
}

export function emptyScores(value = 50): DimensionScores {
  return DIMENSION_KEYS.reduce((acc, key) => {
    acc[key] = value;
    return acc;
  }, {} as DimensionScores);
}
