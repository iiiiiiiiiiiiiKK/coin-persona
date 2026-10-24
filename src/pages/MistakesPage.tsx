import { useMemo } from 'react';
import { DISCLAIMER_SHORT } from '../data/site';
import { viewOf, type Report } from '../lib/report';
import type { Trap } from '../data/traps';

interface Props {
  report: Report;
  onNavigate: (path: string) => void;
}

export function MistakesPage({ report, onNavigate }: Props) {
  const view = useMemo(() => viewOf(report), [report]);

  if (!view) {
    return (
      <main className="wrap">
        <div className="empty-state" style={{ marginTop: 40 }}>
          报告数据无法还原，请重新测试。
        </div>
      </main>
    );
  }

  const { primary, traps } = view;

  return (
    <main className="wrap" style={{ paddingBottom: 60 }}>
      <div className="detail-hero">
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => onNavigate(`/report/${report.id}`)}>
          ← 返回完整报告
        </button>
        <div className="eyebrow eyebrow-orange" style={{ marginTop: 18 }}>
          MISTAKE AUTOPSY / 错误解剖
        </div>
        <h1 className="detail-title">我最容易犯的错误</h1>
        <p className="hint" style={{ marginTop: 12, maxWidth: '62ch' }}>
          根据「{primary.name}」的行为倾向和你在本题单中触发的选项标签，以下 {traps.length} 个决策陷阱最需要留意。每一条都给出触发场景、代价和可执行的反制动作。
        </p>
      </div>

      <div className="detail-grid">
        <div>
          {traps.map((t, i) => (
            <TrapDetail key={t.id} trap={t} index={i + 1} />
          ))}
        </div>
        <aside>
          <div className="side-note">
            <h3>怎么用这一页</h3>
            <p>
              不要一次改掉所有习惯。挑一个你最近 30 天真实发生过、而且代价最大的陷阱，只针对它设一条规则，连续执行 20 次。
            </p>
            <p>
              把这一页截图存下来，下次想下单前先看一眼：你现在要做的事，是否正好是上面某一条的触发场景。
            </p>
          </div>
          <div className="side-note" style={{ marginTop: 14 }}>
            <h3>提醒</h3>
            <p>{DISCLAIMER_SHORT}这些描述是行为倾向，不是对你个人的诊断，也不预测任何市场结果。</p>
          </div>
          {view.advice.length ? (
            <div className="side-note" style={{ marginTop: 14 }}>
              <h3>配套纪律</h3>
              {view.advice.map((a) => (
                <p key={a.id}>
                  <span className="mono" style={{ color: 'var(--green)', fontSize: 10.5 }}>
                    {a.code}
                  </span>
                  <br />
                  {a.title}
                </p>
              ))}
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}

function TrapDetail({ trap, index }: { trap: Trap; index: number }) {
  return (
    <article className="trap-detail">
      <span className="code">
        {trap.code} · #{String(index).padStart(2, '0')}
      </span>
      <h2>{trap.name}</h2>
      <p className="symptom">{trap.symptom}</p>
      <dl className="detail-fields">
        <div className="detail-field">
          <dt>常见场景</dt>
          <dd>{trap.scene}</dd>
        </div>
        <div className="detail-field">
          <dt>典型信号</dt>
          <dd>
            <ul>
              {trap.signs.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div className="detail-field">
          <dt>可能的代价</dt>
          <dd>{trap.cost}</dd>
        </div>
        <div className="detail-field">
          <dt>反制动作</dt>
          <dd style={{ color: 'var(--ink)' }}>{trap.counter}</dd>
        </div>
      </dl>
    </article>
  );
}
