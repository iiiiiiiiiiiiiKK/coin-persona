export type ShareRatio = '1:1' | '3:4';
export type ShareTheme = 'terminal' | 'editorial';

export const SHARE_SIZES: Record<ShareRatio, { width: number; height: number; label: string }> = {
  '1:1': { width: 1080, height: 1080, label: '1:1 · 1080×1080' },
  '3:4': { width: 1080, height: 1440, label: '3:4 · 1080×1440' },
};

export const SHARE_THEMES: { id: ShareTheme; name: string; hint: string }[] = [
  { id: 'terminal', name: '终端黑绿', hint: '深色终端 · 适合加密社区' },
  { id: 'editorial', name: '杂志米白', hint: '纸质编辑 · 适合朋友圈' },
];

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
  tag: string;
}

export interface ShareMetrics {
  width: number;
  height: number;
  ratio: ShareRatio;
  theme: ShareTheme;
  margin: number;
  boxes: Box[];
  /** 实际绘制出来的文字，供自动化测试确认关键内容存在。 */
  texts: string[];
  /** 内容最低点，用于「无裁切」断言。 */
  contentBottom: number;
  /** 被自动缩放后的字号比例，1 表示未缩放。 */
  scale: number;
  /** 绘制过程中被省略号截断的文本数量，正常应为 0。 */
  truncated: number;
}
