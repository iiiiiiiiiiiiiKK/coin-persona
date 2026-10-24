import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Report } from '../lib/report';
import {
  clearAll,
  defaultState,
  loadState,
  saveState,
  withReport,
  withoutReport,
  type Prefs,
  type RunSnapshot,
  type SharePrefs,
  type StoredState,
} from '../lib/storage';

interface StoreApi {
  state: StoredState;
  saveRun: (run: RunSnapshot | null) => void;
  addReport: (report: Report) => void;
  removeReport: (id: string) => void;
  setPrefs: (patch: Partial<Prefs>) => void;
  setShare: (patch: Partial<SharePrefs>) => void;
  resetAll: () => void;
  storageOk: boolean;
}

const StoreContext = createContext<StoreApi | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredState>(() => loadState());
  const [storageOk, setStorageOk] = useState(true);
  /* 用 ref 保存最新状态，保证同一轮事件里连续调用多个更新不会互相覆盖 */
  const stateRef = useRef(state);

  const commit = useCallback((mutate: (prev: StoredState) => StoredState) => {
    const next = mutate(stateRef.current);
    stateRef.current = next;
    setState(next);
    setStorageOk(saveState(next));
  }, []);

  const saveRun = useCallback((run: RunSnapshot | null) => commit((prev) => ({ ...prev, run })), [commit]);

  const addReport = useCallback(
    (report: Report) => commit((prev) => withReport(prev, report)),
    [commit],
  );

  const removeReport = useCallback(
    (id: string) => commit((prev) => withoutReport(prev, id)),
    [commit],
  );

  const setPrefs = useCallback(
    (patch: Partial<Prefs>) => commit((prev) => ({ ...prev, prefs: { ...prev.prefs, ...patch } })),
    [commit],
  );

  const setShare = useCallback(
    (patch: Partial<SharePrefs>) => commit((prev) => ({ ...prev, share: { ...prev.share, ...patch } })),
    [commit],
  );

  const resetAll = useCallback(() => {
    clearAll();
    const fresh = defaultState();
    stateRef.current = fresh;
    setState(fresh);
    setStorageOk(true);
  }, []);

  /* 减少动画：用户设置或系统偏好，任一满足即生效 */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      document.documentElement.dataset.reduceMotion = state.prefs.reduceMotion || mq.matches ? 'true' : 'false';
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [state.prefs.reduceMotion]);

  const api = useMemo<StoreApi>(
    () => ({ state, saveRun, addReport, removeReport, setPrefs, setShare, resetAll, storageOk }),
    [state, saveRun, addReport, removeReport, setPrefs, setShare, resetAll, storageOk],
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useStore 必须在 AppStoreProvider 内使用');
  return value;
}
