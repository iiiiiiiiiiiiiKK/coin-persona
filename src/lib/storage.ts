import type { Answers } from '../data/types';
import type { Report } from './report';
import type { ShareRatio, ShareTheme } from './share-types';

export const STORAGE_KEY = 'coin-persona:v1';
export const STORAGE_VERSION = 1;

export interface RunSnapshot {
  seed: string;
  answers: Answers;
  index: number;
  startedAt: string;
  updatedAt: string;
}

export interface Prefs {
  reduceMotion: boolean;
  autoNext: boolean;
}

export interface SharePrefs {
  ratio: ShareRatio;
  theme: ShareTheme;
}

export interface StoredState {
  version: number;
  run: RunSnapshot | null;
  reports: Report[];
  prefs: Prefs;
  share: SharePrefs;
}

export const DEFAULT_PREFS: Prefs = { reduceMotion: false, autoNext: false };
export const DEFAULT_SHARE: SharePrefs = { ratio: '1:1', theme: 'terminal' };

export function defaultState(): StoredState {
  return { version: STORAGE_VERSION, run: null, reports: [], prefs: { ...DEFAULT_PREFS }, share: { ...DEFAULT_SHARE } };
}

function isReport(value: unknown): value is Report {
  if (!value || typeof value !== 'object') return false;
  const r = value as Partial<Report>;
  return (
    typeof r.id === 'string' &&
    typeof r.seed === 'string' &&
    typeof r.createdAt === 'string' &&
    Array.isArray(r.quizIds) &&
    r.quizIds.length > 0 &&
    !!r.answers &&
    typeof r.answers === 'object' &&
    !!r.scores &&
    typeof r.primaryId === 'string' &&
    typeof r.secondaryId === 'string' &&
    Array.isArray(r.trapIds) &&
    Array.isArray(r.adviceIds)
  );
}

/** 读取本地状态；任何损坏都回退到默认值，不让页面白屏。 */
export function loadState(): StoredState {
  if (typeof localStorage === 'undefined') return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    if (!parsed || parsed.version !== STORAGE_VERSION) return defaultState();
    const run =
      parsed.run && typeof parsed.run.seed === 'string' && parsed.run.answers && typeof parsed.run.index === 'number'
        ? parsed.run
        : null;
    const reports = Array.isArray(parsed.reports) ? parsed.reports.filter(isReport) : [];
    const prefs = { ...DEFAULT_PREFS, ...(parsed.prefs ?? {}) };
    const share = { ...DEFAULT_SHARE, ...(parsed.share ?? {}) };
    return {
      version: STORAGE_VERSION,
      run,
      reports: reports.slice(0, 40),
      prefs: {
        reduceMotion: Boolean(prefs.reduceMotion),
        autoNext: Boolean(prefs.autoNext),
      },
      share: {
        ratio: share.ratio === '3:4' ? '3:4' : '1:1',
        theme: share.theme === 'editorial' ? 'editorial' : 'terminal',
      },
    };
  } catch {
    return defaultState();
  }
}

export function saveState(state: StoredState): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/** 报告去重保存：同一个报告 id 只保留最新一份，最多 40 份。 */
export function withReport(state: StoredState, report: Report): StoredState {
  const rest = state.reports.filter((r) => r.id !== report.id);
  return { ...state, reports: [report, ...rest].slice(0, 40) };
}

export function withoutReport(state: StoredState, id: string): StoredState {
  return { ...state, reports: state.reports.filter((r) => r.id !== id) };
}

export function clearAll(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* 忽略隐私模式下的写入错误 */
  }
}

/** 估算本应用占用的存储体积（字节）。 */
export function storageBytes(): number {
  if (typeof localStorage === 'undefined') return 0;
  try {
    return new Blob([localStorage.getItem(STORAGE_KEY) ?? '']).size;
  } catch {
    return 0;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
