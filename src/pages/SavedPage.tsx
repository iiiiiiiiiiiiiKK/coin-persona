import { useMemo, useState } from 'react';
import { ARCHETYPE_MAP } from '../data/archetypes';
import { DIMENSION_MAP } from '../data/dimensions';
import { copyText } from '../lib/router';
import { reportToText, verifyReport } from '../lib/report';
import { storageBytes, formatBytes } from '../lib/storage';
import { useStore } from '../store/AppStore';
import { useToast } from '../components/Toast';

interface Props {
  onNavigate: (path: string) => void;
  onStart: () => void;
}

export function SavedPage({ onNavigate, onStart }: Props) {
  const { state, removeReport } = useStore();
  const toast = useToast();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const reports = state.reports;
  const bytes = useMemo(() => storageBytes(), [reports.length]);

  return (
    <main className="wrap" style={{ padding: '34px 0 60px' }}>
      <div className="eyebrow">ARCHIVE / 本地档案</div>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(32px,5vw,44px)', marginTop: 10 }}>我的报告</h1>
      <p className="hint" style={{ marginTop: 12, maxWidth: '62ch' }}>
        报告只保存在这台设备的浏览器里（localStorage），不会同步到云端。当前占用 {formatBytes(bytes)}。
      </p>

      <div style={{ marginTop: 22 }}>
        {reports.length === 0 ? (
          <div className="empty-state">
            还没有保存的报告。
            <br />
            完成一次测试后，在报告页点「保存报告」即可在这里找到它。
            <br />
            <button type="button" className="btn btn-primary" style={{ marginTop: 18 }} onClick={onStart}>
              开始测试
            </button>
          </div>
        ) : (
          <div className="saved-list">
            {reports.map((r) => {
              const primary = ARCHETYPE_MAP[r.primaryId];
              const valid = Boolean(verifyReport(r));
              return (
                <div className="saved-item" key={r.id}>
                  <div>
                    <div className="name">{primary?.name ?? '未知人格'}</div>
                    <div className="saved-meta">
                      <span>NO.{r.id}</span>
                      <span>SEED {r.seed}</span>
                      <span>{new Date(r.createdAt).toLocaleString('zh-CN', { hour12: false })}</span>
                      <span>{r.quizIds.length} 题</span>
                      {valid ? <span style={{ color: 'var(--green)' }}>规则校验通过</span> : <span style={{ color: 'var(--orange)' }}>规则校验失败</span>}
                    </div>
                    <div className="saved-meta" style={{ marginTop: 4 }}>
                      {Object.entries(r.scores).map(([k, v]) => (
                        <span key={k}>
                          {DIMENSION_MAP[k as keyof typeof DIMENSION_MAP]?.code ?? k} {v}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-sm" onClick={() => onNavigate(`/report/${r.id}`)}>
                      查看
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={async () => {
                        const ok = await copyText(reportToText(r));
                        toast(ok ? '报告已复制' : '复制失败', ok ? 'ok' : 'err');
                      }}
                    >
                      复制
                    </button>
                    {confirmId === r.id ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ borderColor: 'var(--red)', color: 'var(--red)' }}
                          onClick={() => {
                            removeReport(r.id);
                            setConfirmId(null);
                            toast('已删除这份报告');
                          }}
                        >
                          确认删除
                        </button>
                        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirmId(null)}>
                          取消
                        </button>
                      </>
                    ) : (
                      <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirmId(r.id)}>
                        删除
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="hint" style={{ marginTop: 20 }}>
        清空全部本地数据请前往{' '}
        <a
          href="#/privacy"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('/privacy');
          }}
        >
          隐私与数据
        </a>
        。
      </p>
    </main>
  );
}
