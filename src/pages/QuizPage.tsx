import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TOPICS } from '../data/types';
import type { Answers } from '../data/types';
import { buildQuiz } from '../lib/quiz';
import type { RunSnapshot } from '../lib/storage';
import { useStore } from '../store/AppStore';

interface Props {
  seed: string;
  onFinish: (seed: string, quiz: ReturnType<typeof buildQuiz>, answers: Answers) => void;
  onHome: () => void;
}

const TOPIC_MAP = TOPICS.reduce(
  (acc, t) => {
    acc[t.key] = t;
    return acc;
  },
  {} as Record<string, (typeof TOPICS)[number]>,
);

export function QuizPage({ seed, onFinish, onHome }: Props) {
  const { state, saveRun } = useStore();
  const quiz = useMemo(() => buildQuiz(seed), [seed]);

  const savedRun = state.run && state.run.seed === seed ? state.run : null;
  const [answers, setAnswers] = useState<Answers>(() => savedRun?.answers ?? {});
  const [index, setIndex] = useState(() => Math.min(savedRun?.index ?? 0, quiz.length - 1));
  const [error, setError] = useState('');
  const [startedAt] = useState(() => savedRun?.startedAt ?? new Date().toISOString());
  const [resumed] = useState(() => Boolean(savedRun && (Object.keys(savedRun.answers).length > 0 || savedRun.index > 0)));
  const liveRef = useRef<HTMLDivElement>(null);

  const answered = quiz.filter((q) => Number.isInteger(answers[q.id]) && answers[q.id] >= 0).length;
  const total = quiz.length;
  const current = quiz[index];
  const currentAnswer = answers[current?.id ?? ''] ?? -1;
  const percent = Math.round((answered / total) * 100);
  const isLast = index === total - 1;

  const persist = useCallback(
    (nextAnswers: Answers, nextIndex: number) => {
      const run: RunSnapshot = {
        seed,
        answers: nextAnswers,
        index: nextIndex,
        startedAt,
        updatedAt: new Date().toISOString(),
      };
      saveRun(run);
    },
    [saveRun, seed, startedAt],
  );

  const choose = useCallback(
    (optionIndex: number) => {
      if (!current) return;
      const next = { ...answers, [current.id]: optionIndex };
      setAnswers(next);
      setError('');
      persist(next, index);
      if (state.prefs.autoNext && index < total - 1) {
        window.setTimeout(() => {
          setIndex((i) => Math.min(i + 1, total - 1));
          persist(next, Math.min(index + 1, total - 1));
        }, 280);
      } else if (state.prefs.autoNext && index === total - 1) {
        window.setTimeout(() => {
          if (quiz.every((q) => Number.isInteger(next[q.id]) && next[q.id] >= 0)) onFinish(seed, quiz, next);
        }, 280);
      }
    },
    [answers, current, index, persist, state.prefs.autoNext, total, onFinish, quiz, seed],
  );

  const go = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= total) return;
      setIndex(nextIndex);
      setError('');
      persist(answers, nextIndex);
      liveRef.current?.focus();
    },
    [answers, persist, total],
  );

  const submit = useCallback(() => {
    if (answered < total) {
      const firstMissing = quiz.findIndex((q) => !Number.isInteger(answers[q.id]) || answers[q.id] < 0);
      setError(`还有 ${total - answered} 道题没有作答，已跳到第 ${firstMissing + 1} 题。`);
      setIndex(firstMissing);
      liveRef.current?.focus();
      return;
    }
    onFinish(seed, quiz, answers);
  }, [answered, answers, onFinish, quiz, seed, total]);

  /* 键盘：1–5 选项，←/→ 切题，Enter 下一题 */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (['1', '2', '3', '4', '5'].includes(e.key)) {
        const opt = Number(e.key) - 1;
        if (current && opt < current.options.length) {
          e.preventDefault();
          choose(opt);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(index - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        // 焦点在普通按钮上时交给按钮自己处理；但在已选中的选项上按 Enter 视为「下一题」
        if (target && target.tagName === 'BUTTON') {
          const isSelectedOption = target.classList.contains('option') && target.getAttribute('aria-checked') === 'true';
          if (!isSelectedOption) return;
        }
        e.preventDefault();
        if (currentAnswer >= 0 && !isLast) go(index + 1);
        else if (isLast && currentAnswer >= 0) submit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choose, current, currentAnswer, go, index, isLast, submit]);

  if (!current) {
    return (
      <main className="wrap quiz">
        <div className="empty-state">题单为空，请返回首页重新开始。</div>
      </main>
    );
  }

  const topic = TOPIC_MAP[current.topic];

  return (
    <main className="wrap quiz">
      <div className="quiz-top">
        <div className="quiz-progress-meta">
          <span>
            QUESTION {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
          <span>·</span>
          <span>已答 {answered}</span>
          <span>·</span>
          <span>SEED {seed}</span>
        </div>
        <div className="quiz-progress-meta">
          <span>{percent}%</span>
          <button type="button" className="btn btn-sm btn-ghost" onClick={onHome}>
            退出
          </button>
        </div>
      </div>

      <div
        className="progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="答题进度"
      >
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="progress-ticks" aria-hidden="true">
        {quiz.map((q, i) => {
          const done = Number.isInteger(answers[q.id]) && answers[q.id] >= 0;
          return (
            <button
              key={q.id}
              type="button"
              tabIndex={-1}
              className={`progress-tick ${i === index ? 'current' : done ? 'done' : ''}`}
              title={`第 ${i + 1} 题`}
              onClick={() => go(i)}
            />
          );
        })}
      </div>

      {resumed ? (
        <p className="resume-note" role="status">
          已恢复上次未完成的作答（{answered}/{total}）。继续即可，或点右上角「退出」重新开始。
        </p>
      ) : null}

      <div className="question-wrap">
        <section className="question-card" aria-labelledby="q-prompt">
          <div className="q-head">
            <span className="q-index">Q{String(index + 1).padStart(2, '0')}</span>
            <span className="q-topic">
              {topic?.code ?? current.topic} / {topic?.name ?? ''}
            </span>
            <div className="q-chips">
              {current.chips.map((chip) => (
                <span className="q-chip" key={chip}>
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <h1 className="q-scene" id="q-prompt">
            {current.scene}
          </h1>
          <p className="q-prompt">{current.prompt}</p>

          <div className="options" role="radiogroup" aria-labelledby="q-prompt">
            {current.options.map((opt, i) => {
              const selected = currentAnswer === i;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`option ${selected ? 'selected' : ''}`}
                  onClick={() => choose(i)}
                >
                  <span className="option-key" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="option-text">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {error ? (
            <p className="quiz-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="quiz-actions">
            <button type="button" className="btn btn-ghost" onClick={() => go(index - 1)} disabled={index === 0}>
              ← 上一题
            </button>
            <div className="kbd-hint" aria-hidden="true">
              <span>
                <kbd>1</kbd>–<kbd>5</kbd> 选择
              </span>
              <span>
                <kbd>←</kbd> <kbd>→</kbd> 翻题
              </span>
              <span>
                <kbd>Enter</kbd> 下一题
              </span>
            </div>
            <span className="spacer" />
            {isLast ? (
              <button type="button" className="btn btn-primary" onClick={submit}>
                生成报告
              </button>
            ) : (
              <button type="button" className="btn" onClick={() => go(index + 1)} disabled={currentAnswer < 0}>
                下一题 →
              </button>
            )}
          </div>
        </section>
      </div>

      <div ref={liveRef} tabIndex={-1} className="sr-only" aria-live="polite">
        第 {index + 1} 题，共 {total} 题。{current.scene}
      </div>
    </main>
  );
}
