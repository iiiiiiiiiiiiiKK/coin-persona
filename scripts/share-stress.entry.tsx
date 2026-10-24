import fixture from './fixtures/preset-answers.json';
import { buildQuiz } from '../src/lib/quiz';
import { buildReport, viewOf } from '../src/lib/report';
import { makeShareView, renderShareCard } from '../src/lib/share';
import { SHARE_SIZES, SHARE_THEMES, type ShareMetrics, type ShareRatio, type ShareTheme } from '../src/lib/share-types';

interface Job {
  presetId: string;
  presetName: string;
  persona: string;
  ratio: ShareRatio;
  theme: ShareTheme;
  width: number;
  height: number;
  metrics: ShareMetrics;
  dataUrl: string;
}

declare global {
  interface Window {
    __shareJobs?: Job[];
    __shareReady?: boolean;
    __shareError?: string;
  }
}

const quiz = buildQuiz(fixture.seed);
const jobs: Job[] = [];

try {
  for (const preset of fixture.presets) {
    const answers = Object.fromEntries(fixture.quizIds.map((id, i) => [id, Number(preset.answers[i])]));
    const report = buildReport(fixture.seed, quiz, answers, '2026-01-02T03:04:05.000Z');
    if (!report) throw new Error(`report build failed: ${preset.id}`);
    const view = viewOf(report);
    if (!view) throw new Error(`view build failed: ${preset.id}`);
    const data = makeShareView({
      report,
      result: view.result,
      primary: view.primary,
      secondary: view.secondary,
      traps: view.traps,
      advice: view.advice,
    });
    const wrap = document.createElement('div');
    wrap.className = 'card-wrap';
    wrap.dataset.preset = preset.id;
    const meta = document.createElement('p');
    meta.className = 'meta';
    meta.textContent = `${preset.name} / ${view.primary.name}`;
    wrap.appendChild(meta);
    document.getElementById('cards')?.appendChild(wrap);

    for (const ratio of Object.keys(SHARE_SIZES) as ShareRatio[]) {
      for (const theme of SHARE_THEMES.map((t) => t.id)) {
        const canvas = document.createElement('canvas');
        canvas.dataset.shareCard = 'true';
        const metrics = renderShareCard(canvas, data, ratio, theme);
        wrap.appendChild(canvas);
        jobs.push({
          presetId: preset.id,
          presetName: preset.name,
          persona: view.primary.name,
          ratio,
          theme,
          width: canvas.width,
          height: canvas.height,
          metrics,
          dataUrl: canvas.toDataURL('image/png'),
        });
      }
    }
  }
  window.__shareJobs = jobs;
  window.__shareReady = true;
  const status = document.getElementById('status');
  if (status) status.textContent = `ready: ${jobs.length} cards`;
} catch (err) {
  window.__shareError = err instanceof Error ? err.stack ?? err.message : String(err);
  const status = document.getElementById('status');
  if (status) status.textContent = `error: ${window.__shareError}`;
}
