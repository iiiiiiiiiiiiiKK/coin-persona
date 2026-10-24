import { useMemo } from 'react';
import { ARCHETYPES } from '../data/archetypes';
import { DIMENSIONS } from '../data/dimensions';
import { QUESTIONS } from '../data/questions';
import { DISCLAIMER_SHORT, SITE_TAGLINE } from '../data/site';
import { makeSeed } from '../lib/rng';
import { countForSeed, MAX_QUESTIONS, MIN_QUESTIONS } from '../lib/quiz';
import { useStore } from '../store/AppStore';

interface Props {
  onStart: (seed: string) => void;
  onNavigate: (path: string) => void;
}

const PREVIEW = [
  { code: 'RISK', value: 62 },
  { code: 'DISC', value: 48 },
  { code: 'EMO', value: 57 },
  { code: 'FOMO', value: 71 },
  { code: 'STOP', value: 44 },
  { code: 'TEMPO', value: 66 },
];

export function HomePage({ onStart, onNavigate }: Props) {
  const { state } = useStore();
  const last = state.reports[0];
  const run = state.run;
  const previewCount = useMemo(() => countForSeed('DEMO-0000'), []);

  return (
    <main className="home">
      <div className="wrap">
        <section className="home-hero">
          <div>
            <div className="hero-kicker">
              <span className="tag tag-green">
                <span className="live-dot" aria-hidden="true" />
                LOCAL ENGINE · 本地评分
              </span>
              <span className="eyebrow" style={{ color: 'var(--faint)' }}>
                NO WALLET · NO SIGN-UP
              </span>
            </div>

            <h1 className="hero-title">
              你在加密市场里，
              <br />
              究竟是谁？
            </h1>

            <p className="hero-sub">
              {QUESTIONS.length} 道加密交易情景题，随机抽取 {MIN_QUESTIONS}–{MAX_QUESTIONS} 道。用六维刻度给你的交易人格做一次 CT：
              风险承受、决策纪律、情绪稳定、追涨冲动、止损执行与交易频率。
            </p>

            <div className="hero-actions">
              <button type="button" className="btn btn-primary" onClick={() => onStart(makeSeed())}>
                开始测试
                <span aria-hidden="true">→</span>
              </button>
              {run ? (
                <button type="button" className="btn" onClick={() => onStart(run.seed)}>
                  继续上次答题（{run.seed}）
                </button>
              ) : null}
              {last ? (
                <button type="button" className="btn btn-ghost" onClick={() => onNavigate(`/report/${last.id}`)}>
                  查看上次报告
                </button>
              ) : null}
              <button type="button" className="btn btn-ghost" onClick={() => onNavigate('/saved')}>
                我的报告
              </button>
            </div>

            <dl className="hero-meta">
              <div className="hero-meta-cell">
                <dt>ITEM BANK</dt>
                <dd>{QUESTIONS.length} 道情景题</dd>
              </div>
              <div className="hero-meta-cell">
                <dt>SEQUENCE</dt>
                <dd>{MIN_QUESTIONS}–{MAX_QUESTIONS} 道 / 随机题序</dd>
              </div>
              <div className="hero-meta-cell">
                <dt>TIME</dt>
                <dd>约 3–5 分钟</dd>
              </div>
            </dl>

            <p className="hint" style={{ marginTop: 18 }}>
              不需要连接交易所账户、钱包，也不需要提交任何资产信息。全部计算在你的浏览器本地完成。
            </p>

            <div className="hero-chart" aria-hidden="true">
              <div className="hero-chart-head">
                <span>PERSONA SIGNAL / 示意</span>
                <span>NOT MARKET DATA</span>
              </div>
              <svg viewBox="0 0 640 84" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4bffb0" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#4bffb0" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 66 L48 58 L96 62 L144 44 L192 50 L240 34 L288 38 L336 22 L384 28 L432 16 L480 24 L528 12 L576 18 L640 8 L640 84 L0 84 Z" fill="url(#heroFill)" />
                <path d="M0 66 L48 58 L96 62 L144 44 L192 50 L240 34 L288 38 L336 22 L384 28 L432 16 L480 24 L528 12 L576 18 L640 8" fill="none" stroke="#4bffb0" strokeWidth="1.6" />
                <path d="M0 72 L64 70 L128 74 L192 66 L256 70 L320 62 L384 68 L448 60 L512 66 L576 62 L640 58" fill="none" stroke="#ff9f43" strokeWidth="1.2" strokeDasharray="4 5" opacity="0.7" />
              </svg>
            </div>
          </div>

          <aside className="terminal-card" aria-label="示例报告预览（虚构数据）">
            <div className="terminal-head">
              <span className="terminal-dot" aria-hidden="true" />
              <span className="terminal-dot" aria-hidden="true" />
              <span className="terminal-dot" aria-hidden="true" />
              <span className="terminal-title">PERSONA_TERMINAL / SAMPLE</span>
            </div>
            <div className="terminal-body">
              <div className="tick-row">
                <span>SAMPLE REPORT</span>
                <span>NO.7K2M-9QX4</span>
              </div>
              <div className="persona-preview">
                <div className="persona-preview-label">PRIMARY PERSONA</div>
                <div className="persona-preview-name">{ARCHETYPES[0].name}</div>
                <div className="persona-preview-line">
                  {ARCHETYPES[0].code} · {ARCHETYPES[0].alias}
                </div>
                <p className="persona-preview-line" style={{ marginTop: 10 }}>
                  「{ARCHETYPES[0].shareLine}」
                </p>
                <div className="mini-bar">
                  {PREVIEW.map((row) => (
                    <div className="mini-bar-row" key={row.code}>
                      <span>{row.code}</span>
                      <span className="mini-bar-track">
                        <span className="mini-bar-fill" style={{ width: `${row.value}%` }} />
                      </span>
                      <span style={{ textAlign: 'right' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="terminal-foot">
                SAMPLE DATA · 示例仅用于展示版式
                <br />
                本页数字不是你的测试结果，也不是任何真实持仓。
              </div>
            </div>
          </aside>
        </section>

        <section className="section" aria-labelledby="how-title">
          <div className="section-head">
            <span className="idx">01 / HOW IT WORKS</span>
            <h2 id="how-title">三步，得到一份可复盘的交易人格档案</h2>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-no">STEP 01</div>
              <h3>回答情景题</h3>
              <p>每次从 {QUESTIONS.length} 道题中抽取 {previewCount} 道，覆盖追涨、止损、杠杆、情绪、消息、仓位与频率九类场景。可以随时返回修改。</p>
            </div>
            <div className="step">
              <div className="step-no">STEP 02</div>
              <h3>本地规则打分</h3>
              <p>每个选项对六个维度有固定影响值。分数 = 50 + 50 ×（选项影响之和 ÷ 本套题满量程），没有随机，也不经过任何模型。</p>
            </div>
            <div className="step">
              <div className="step-no">STEP 03</div>
              <h3>报告与分享</h3>
              <p>得到主人格、副人格、六维刻度、决策陷阱和三条纪律处方，可复制报告或导出 1:1 / 3:4 分享图。</p>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="dims-title">
          <div className="section-head">
            <span className="idx">02 / DIMENSIONS</span>
            <h2 id="dims-title">六个维度，不是一张「好坏」榜</h2>
          </div>
          <div className="dimension-grid">
            {DIMENSIONS.map((dim) => (
              <article className="dimension-card" key={dim.key}>
                <div className="code">{dim.code}</div>
                <h3 style={{ marginTop: 8 }}>{dim.name}</h3>
                <p>{dim.description}</p>
                <div className="scale-line">
                  <span>{dim.low}</span>
                  <span>0 — 100</span>
                  <span>{dim.high}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="roster-title">
          <div className="section-head">
            <span className="idx">03 / PERSONA ROSTER</span>
            <h2 id="roster-title">{ARCHETYPES.length} 种交易人格，你的答案会落在其中一张牌上</h2>
            <button type="button" className="more" onClick={() => onStart(makeSeed())}>
              开始匹配 →
            </button>
          </div>
          <div className="roster">
            {ARCHETYPES.map((a) => (
              <div className={`roster-item ${a.tone}`} key={a.id}>
                <span className="en">{a.code}</span>
                <span className="name">{a.name}</span>
                <span className="line">{a.oneLiner}</span>
              </div>
            ))}
          </div>
          <p className="hint" style={{ marginTop: 14 }}>
            「需重点观察」不代表诊断，只表示该类型的典型行为更容易带来账户层面的风险。所有描述都是行为倾向，不是能力评价。
          </p>
        </section>

        <section className="privacy-strip" aria-label="隐私说明">
          <p>
            <strong style={{ color: 'var(--ink)' }}>隐私：</strong>
            本产品不连接交易所、钱包或任何账户，不读取持仓，不请求私钥、助记词或 API Key。报告只保存在你的浏览器本地，可随时一键清除。
            <br />
            <span className="muted">{DISCLAIMER_SHORT}这是自我反思问卷，不是经过验证的心理测量，也不代表真实交易水平。</span>
          </p>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => onNavigate('/privacy')}>
            查看隐私与数据
          </button>
        </section>

        <p className="hint" style={{ marginTop: 18, color: 'var(--faint)' }}>
          {SITE_TAGLINE}
        </p>
      </div>
    </main>
  );
}
