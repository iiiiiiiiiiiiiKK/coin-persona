import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DIMENSIONS, bandOf } from '../data/dimensions';
import { DISCLAIMER_LONG, DISCLAIMER_SHORT, SITE_URL_LABEL } from '../data/site';
import { copyText } from '../lib/router';
import { reportToText, viewOf, type Report } from '../lib/report';
import { renderShareCard, makeShareView, canvasToBlob, downloadBlob, shareFilename } from '../lib/share';
import { SHARE_SIZES, type ShareRatio, type ShareTheme } from '../lib/share-types';
import { formatScoreDelta } from '../lib/scoring';
import { RadarChart, RiskDial } from '../components/Charts';
import { useStore } from '../store/AppStore';
import { useToast } from '../components/Toast';

interface Props {
  report: Report;
  onNavigate: (path: string, replace?: boolean) => void;
  onRetest: () => void;
  onRetestSame: () => void;
}

export function ResultPage({ report, onNavigate, onRetest, onRetestSame }: Props) {
  const { state, setShare, addReport } = useStore();
  const toast = useToast();
  const view = useMemo(() => viewOf(report), [report]);
  const [studioOpen, setStudioOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isSaved = state.reports.some((r) => r.id === report.id);

  useEffect(() => {
    document.title = view ? `${view.primary.name} · 炒币人格测试报告` : '炒币人格测试';
    return () => {
      document.title = '炒币人格测试 · COIN PERSONA';
    };
  }, [view]);

  const onSave = useCallback(() => {
    addReport(report);
    toast('报告已保存到本机浏览器');
  }, [addReport, report, toast]);

  const onCopy = useCallback(async () => {
    const text = reportToText(report, view);
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      toast('报告全文已复制');
      window.setTimeout(() => setCopied(false), 2400);
    } else {
      toast('复制失败，请手动选择文字复制', 'err');
    }
  }, [report, toast, view]);

  if (!view) {
    return (
      <main className="wrap report">
        <div className="empty-state">
          这份报告的数据与当前规则不一致（可能来自旧版本），无法还原。
          <br />
          <button type="button" className="btn btn-sm" style={{ marginTop: 16 }} onClick={onRetest}>
            重新测试
          </button>
        </div>
      </main>
    );
  }

  const { result, primary, secondary, traps, advice } = view;

  return (
    <main className="wrap report">
      <header className="report-head">
        <div>
          <div className="eyebrow">PERSONA REPORT / 交易人格报告</div>
          <div className="report-id" style={{ marginTop: 8 }}>
            NO.{report.id} · SEED {report.seed} · {new Date(report.createdAt).toLocaleDateString('zh-CN')} · 规则版本 {report.scoringVersion}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isSaved ? (
            <span className="tag tag-green">已保存到本机</span>
          ) : (
            <button type="button" className="btn btn-sm" onClick={onSave}>
              保存报告
            </button>
          )}
          <button type="button" className="btn btn-sm" onClick={onCopy}>
            {copied ? '已复制' : '复制报告'}
          </button>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => setStudioOpen(true)}>
            生成分享图
          </button>
        </div>
      </header>

      <section className="report-hero" aria-labelledby="persona-name">
        <div>
          <div className="eyebrow eyebrow-orange">PRIMARY PERSONA / 主人格</div>
          <h1 className="persona-name" id="persona-name">
            {primary.name}
          </h1>
          <div className="persona-alias">
            {primary.alias} · {primary.code}
          </div>
          <p className="persona-line">{primary.oneLiner}</p>
          <p className="persona-summary">{primary.summary}</p>
          <div className="tag-row">
            <span className={`tag ${primary.tone === 'alert' ? 'tag-orange' : 'tag-green'}`}>
              {primary.tone === 'alert' ? '需重点观察' : primary.tone === 'watch' ? '有优化空间' : '相对稳健'}
            </span>
            <span className="tag">拟合信心 {result.confidence}%</span>
            <span className="tag">回答 {result.count} 题</span>
            <span className="tag">与副人格差距 {result.fitGap.toFixed(1)} 分</span>
          </div>
          {primary.caution ? (
            <p
              style={{
                marginTop: 18,
                padding: '12px 14px',
                borderLeft: '2px solid var(--orange)',
                background: 'var(--orange-soft)',
                fontSize: 13,
                lineHeight: 1.75,
                color: 'var(--ink-2)',
              }}
            >
              <strong style={{ color: 'var(--orange)' }}>风险提示：</strong>
              {primary.caution}
            </p>
          ) : null}
        </div>

        <aside className="secondary-card" aria-label="副人格与仪表">
          <h3>SECONDARY / 副人格</h3>
          <div className="secondary-name">{secondary.name}</div>
          <p>
            {secondary.alias} · {secondary.code}
            <br />
            {secondary.oneLiner}
          </p>
          <div className="meter-block">
            <Meter label="RISK TEMP / 风险温度" value={result.riskTemperature} />
            <Meter label="DISCIPLINE INDEX / 纪律指数" value={result.disciplineIndex} invert />
          </div>
          <p style={{ marginTop: 14, fontSize: 11.5, color: 'var(--faint)', lineHeight: 1.7 }}>
            副人格是在排除主人格后拟合度最高的第二类型，用来解释你身上同时存在的另一种倾向。
          </p>
        </aside>
      </section>

      <section className="instrument-panel" aria-label="六维轮廓与风险仪表">
        <div className="instrument-cell">
          <div className="eyebrow" style={{ color: 'var(--faint)' }}>
            DIMENSION RADAR / 六维轮廓
          </div>
          <RadarChart scores={report.scores} size={300} />
        </div>
        <div className="instrument-cell">
          <div className="eyebrow" style={{ color: 'var(--faint)' }}>
            RISK GAUGE / 风险仪表
          </div>
          <RiskDial value={result.riskTemperature} size={300} />
          <div className="instrument-scale">
            <span>保守 {100 - result.riskTemperature}%</span>
            <span>纪律 {result.disciplineIndex}</span>
            <span>激进 {result.riskTemperature}%</span>
          </div>
        </div>
        <div className="instrument-cell instrument-note">
          <div className="eyebrow" style={{ color: 'var(--faint)' }}>
            READING / 怎么读
          </div>
          <p>
            雷达图展示六个维度的相对强度，不是六边形越大越好：风险与频率偏高、纪律与止损偏低，往往意味着账户更容易被单次事件击穿。
          </p>
          <p>
            风险温度 = 40% 风险承受 + 25% 追涨冲动 + 20% 交易频率 + 15% 反向止损执行；纪律指数 = 50% 决策纪律 + 30% 止损执行 + 20% 情绪稳定。
            两项都是 0–100 的合成刻度，不是收益预测。
          </p>
        </div>
      </section>

      <hr className="divider" />

      <div className="report-grid" style={{ marginTop: 28 }}>
        <section aria-labelledby="scores-title">
          <div className="block-title">
            <span className="num">01</span>
            <h2 id="scores-title">六维刻度</h2>
          </div>
          <div className="score-list">
            {DIMENSIONS.map((dim) => {
              const score = report.scores[dim.key];
              const band = bandOf(dim.key, score);
              const risky = dim.highIsRisky ? score > 60 : score < 40;
              return (
                <div className="score-row" key={dim.key}>
                  <div className="score-name">
                    <strong>{dim.name}</strong>
                    <span>{dim.code}</span>
                  </div>
                  <div className="scale-wrap">
                    <div className="scale" title={`${dim.low} 0–100 ${dim.high}`}>
                      <span className="scale-mid" aria-hidden="true" />
                      <span
                        className={`scale-fill ${risky ? 'warn' : ''}`}
                        style={{ left: 0, width: `${score}%` }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="scale-band">
                      <span>{dim.low}</span>
                      <span>{band.label}</span>
                      <span>{dim.high}</span>
                    </div>
                  </div>
                  <div className="score-value">
                    {score}
                    <small>
                      <br />
                      {formatScoreDelta(score)}
                    </small>
                  </div>
                </div>
              );
            })}
            <p className="score-note">
              计分规则：每个维度从 50 分出发，按「本题所选选项在该维度的影响之和 ÷ 本套题该维度的最大可能影响」线性缩放，四舍五入取整。
              六维分别独立计算，没有随机项；同一题码 + 同一组答案永远得到同一分数。
            </p>
          </div>
        </section>

        <section aria-labelledby="pattern-title">
          <div className="block-title">
            <span className="num">02</span>
            <h2 id="pattern-title">典型行为模式</h2>
          </div>
          <div className="pattern-list">
            {primary.pattern.map((p, i) => (
              <div className="pattern-item" key={p}>
                <span className="n">{String(i + 1).padStart(2, '0')}</span>
                <span>{p}</span>
              </div>
            ))}
          </div>

          <div className="block-title" style={{ marginTop: 26 }}>
            <span className="num">03</span>
            <h2>这套行为的另一面</h2>
          </div>
          <div className="pattern-list">
            {primary.strengths.map((p, i) => (
              <div className="pattern-item" key={p}>
                <span className="n" style={{ color: 'var(--green)' }}>
                  +{i + 1}
                </span>
                <span>{p}</span>
              </div>
            ))}
            {primary.blindspots.map((p, i) => (
              <div className="pattern-item" key={p}>
                <span className="n">−{i + 1}</span>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section style={{ marginTop: 34 }} aria-labelledby="traps-title">
        <div className="block-title">
          <span className="num">04</span>
          <h2 id="traps-title">最可能出现的决策陷阱</h2>
          <button type="button" className="btn btn-sm btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => onNavigate(`/report/${report.id}/mistakes`)}>
            查看我最容易犯的错误 →
          </button>
        </div>
        <div className="trap-list">
          {traps.map((t) => (
            <article className="trap-card" key={t.id}>
              <header>
                <span className="trap-code">{t.code}</span>
                <h3>{t.name}</h3>
              </header>
              <p className="symptom">{t.symptom}</p>
              <p className="counter">
                <strong>反制：</strong>
                {t.counter}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 34 }} aria-labelledby="advice-title">
        <div className="block-title">
          <span className="num">05</span>
          <h2 id="advice-title">三条可执行的交易纪律</h2>
        </div>
        <div className="advice-list">
          {advice.map((a) => (
            <article className="advice-card" key={a.id}>
              <div className="advice-head">
                <span className="advice-code">{a.code}</span>
                <h3>{a.title}</h3>
              </div>
              <p className="action">{a.action}</p>
              <p className="metric">
                <b>验收标准：</b>
                {a.metric}
              </p>
              <p className="metric">
                <b>为什么是你：</b>
                {a.why}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="share-line-box" aria-label="分享标签">
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            YOUR SIGNATURE / 个人标签
          </div>
          <blockquote>「{primary.shareLine}」</blockquote>
        </div>
        <div className="share-actions">
          <button type="button" className="btn btn-sm" onClick={onCopy}>
            复制报告
          </button>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => setStudioOpen(true)}>
            导出分享图
          </button>
        </div>
      </section>

      <section className="disclaimer-box" aria-labelledby="disclaimer-title">
        <h3 id="disclaimer-title">IMPORTANT / 重要说明</h3>
        <ul>
          {DISCLAIMER_LONG.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <div className="report-foot-actions">
        <button type="button" className="btn" onClick={onRetest}>
          重新测试（新题码）
        </button>
        <button type="button" className="btn btn-ghost" onClick={onRetestSame}>
          用同一套题重测
        </button>
        {!isSaved ? (
          <button type="button" className="btn btn-ghost" onClick={onSave}>
            保存到本机
          </button>
        ) : (
          <span className="saved-note">✓ 已保存到本机</span>
        )}
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--faint)' }}>{SITE_URL_LABEL}</span>
      </div>

      {studioOpen ? (
        <ShareStudio
          report={report}
          onClose={() => setStudioOpen(false)}
          initialRatio={state.share.ratio}
          initialTheme={state.share.theme}
          onPrefs={setShare}
          onToast={toast}
        />
      ) : null}
    </main>
  );
}

function Meter({ label, value, invert = false }: { label: string; value: number; invert?: boolean }) {
  const risky = invert ? value < 40 : value > 60;
  const danger = invert ? value < 25 : value > 80;
  return (
    <div className="meter">
      <div className="meter-label">
        <span>{label}</span>
        <span style={{ color: 'var(--ink)' }}>{value}</span>
      </div>
      <div className="meter-track">
        <span className={`meter-fill ${danger ? 'danger' : risky ? 'warn' : ''}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

/* ------------------------------ 分享工作室 ------------------------------ */

interface StudioProps {
  report: Report;
  onClose: () => void;
  initialRatio: ShareRatio;
  initialTheme: ShareTheme;
  onPrefs: (patch: { ratio?: ShareRatio; theme?: ShareTheme }) => void;
  onToast: (msg: string, kind?: 'ok' | 'err') => void;
}

function ShareStudio({ report, onClose, initialRatio, initialTheme, onPrefs, onToast }: StudioProps) {
  const view = useMemo(() => viewOf(report), [report]);
  const [ratio, setRatio] = useState<ShareRatio>(initialRatio);
  const [theme, setTheme] = useState<ShareTheme>(initialTheme);
  const [status, setStatus] = useState('正在渲染…');
  const [statusKind, setStatusKind] = useState<'ok' | 'err' | ''>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const metricsRef = useRef<ReturnType<typeof renderShareCard> | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const data = useMemo(
    () =>
      view
        ? makeShareView({
            report,
            result: view.result,
            primary: view.primary,
            secondary: view.secondary,
            traps: view.traps,
            advice: view.advice,
          })
        : null,
    [report, view],
  );

  useEffect(() => {
    if (!canvasRef.current || !data) return;
    try {
      const metrics = renderShareCard(canvasRef.current, data, ratio, theme);
      metricsRef.current = metrics;
      setStatus(`已就绪 · ${SHARE_SIZES[ratio].label} · 内容高度 ${Math.round(metrics.contentBottom)} / ${metrics.height}px`);
      setStatusKind('ok');
    } catch (err) {
      setStatus(`渲染失败：${err instanceof Error ? err.message : String(err)}`);
      setStatusKind('err');
    }
  }, [data, ratio, theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const doDownload = async () => {
    if (!canvasRef.current || busy) return;
    setBusy(true);
    setStatus('正在生成 PNG…');
    try {
      const blob = await canvasToBlob(canvasRef.current);
      downloadBlob(blob, shareFilename(ratio, theme, report.id));
      setStatus(`已导出 ${SHARE_SIZES[ratio].label} · ${(blob.size / 1024).toFixed(0)} KB`);
      setStatusKind('ok');
      onToast('分享图已开始下载');
    } catch (err) {
      setStatus(`导出失败：${err instanceof Error ? err.message : String(err)}`);
      setStatusKind('err');
    } finally {
      setBusy(false);
    }
  };

  const pickRatio = (r: ShareRatio) => {
    setRatio(r);
    onPrefs({ ratio: r });
  };
  const pickTheme = (t: ShareTheme) => {
    setTheme(t);
    onPrefs({ theme: t });
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        ref={dialogRef}
        tabIndex={-1}
        data-share-ready={statusKind === 'ok' ? 'true' : 'false'}
      >
        <div className="modal-head">
          <div>
            <div className="eyebrow">SHARE STUDIO / 分享图</div>
            <h2 id="share-title" style={{ marginTop: 6 }}>
              导出一张适合发出去的卡
            </h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭分享图">
            ×
          </button>
        </div>

        <div className="share-studio">
          <div>
            <div className="preview-frame">
              <canvas ref={canvasRef} className="preview-canvas" data-share-canvas aria-label="分享图预览" />
            </div>
            <div className="preview-meta" data-share-metrics>
              {SHARE_SIZES[ratio].width} × {SHARE_SIZES[ratio].height} PX · PNG
            </div>
          </div>

          <div className="share-controls">
            <div className="control-group">
              <h3>画布比例</h3>
              <div className="seg" role="group" aria-label="画布比例">
                <button type="button" aria-pressed={ratio === '1:1'} onClick={() => pickRatio('1:1')}>
                  1 : 1
                </button>
                <button type="button" aria-pressed={ratio === '3:4'} onClick={() => pickRatio('3:4')}>
                  3 : 4
                </button>
              </div>
            </div>
            <div className="control-group">
              <h3>配色</h3>
              <div className="seg" role="group" aria-label="配色">
                <button type="button" aria-pressed={theme === 'terminal'} onClick={() => pickTheme('terminal')}>
                  终端黑绿
                </button>
                <button type="button" aria-pressed={theme === 'editorial'} onClick={() => pickTheme('editorial')}>
                  杂志米白
                </button>
              </div>
            </div>
            <p className="hint">
              分享图包含主人格、六个维度、最容易犯的错误和个人标签，并固定带上「娱乐与自我反思」声明。图片在本机生成，不会上传。
            </p>
            <div className={`share-status ${statusKind}`} role="status">
              {status}
            </div>
            <button type="button" className="btn btn-primary" onClick={doDownload} disabled={busy}>
              下载 PNG
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={async () => {
                if (!canvasRef.current) return;
                try {
                  const blob = await canvasToBlob(canvasRef.current);
                  if (navigator.clipboard && 'ClipboardItem' in window) {
                    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                    onToast('图片已复制到剪贴板');
                  } else {
                    onToast('当前浏览器不支持复制图片，请使用下载', 'err');
                  }
                } catch {
                  onToast('复制图片失败，请使用下载', 'err');
                }
              }}
            >
              复制图片
            </button>
            <p className="hint" style={{ fontSize: 11 }}>
              {DISCLAIMER_SHORT}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
