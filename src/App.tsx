import { useCallback, useEffect, useState } from 'react';
import { SiteFooter } from './components/SiteFooter';
import { SiteHeader } from './components/SiteHeader';
import { ToastProvider, useToast } from './components/Toast';
import { buildReport, type Report } from './lib/report';
import type { Answers, Question } from './data/types';
import { isValidSeed, makeSeed, normalizeSeed } from './lib/rng';
import { copyText, navigate, useRoute } from './lib/router';
import { HomePage } from './pages/HomePage';
import { MistakesPage } from './pages/MistakesPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { QuizPage } from './pages/QuizPage';
import { ResultPage } from './pages/ResultPage';
import { SavedPage } from './pages/SavedPage';
import { AppStoreProvider, useStore } from './store/AppStore';
export function App() {
  return (
    <AppStoreProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </AppStoreProvider>
  );
}

function Shell() {
  const route = useRoute();
  const { state, saveRun, addReport } = useStore();
  const toast = useToast();
  const [activeReport, setActiveReport] = useState<Report | null>(null);

  /* 报告页：优先取本机已保存的，否则取刚生成的（内存中） */
  useEffect(() => {
    if (route.name !== 'result' && route.name !== 'mistakes') return;
    const saved = state.reports.find((r) => r.id === route.id);
    if (saved) {
      setActiveReport(saved);
      return;
    }
    if (activeReport && activeReport.id === route.id) return;
    setActiveReport(null);
  }, [route, state.reports, activeReport]);

  const startQuiz = useCallback(
    (seed?: string) => {
      const clean = normalizeSeed(seed ?? makeSeed());
      if (!isValidSeed(clean)) {
        toast('题码格式不正确', 'err');
        return;
      }
      navigate(`/quiz?seed=${clean}`);
    },
    [toast],
  );

  const finishQuiz = useCallback(
    (seed: string, quiz: Question[], answers: Answers) => {
      const report = buildReport(seed, quiz, answers);
      if (!report) {
        toast('评分失败，请检查答案是否完整', 'err');
        return;
      }
      addReport(report);
      setActiveReport(report);
      saveRun(null);
      navigate(`/report/${report.id}`);
    },
    [addReport, saveRun, toast],
  );

  const headerRoute = route.name === 'home' || route.name === 'saved' || route.name === 'privacy' ? route.name : 'home';

  let content;
  switch (route.name) {
    case 'home':
      content = <HomePage onStart={startQuiz} onNavigate={navigate} />;
      break;
    case 'quiz':
      content = <QuizPage key={route.seed} seed={route.seed} onFinish={finishQuiz} onHome={() => navigate('/')} />;
      break;
    case 'result':
      content = activeReport ? (
        <ResultPage
          report={activeReport}
          onNavigate={navigate}
          onRetest={() => startQuiz(makeSeed())}
          onRetestSame={() => startQuiz(activeReport.seed)}
        />
      ) : (
        <MissingReport onNavigate={navigate} onStart={() => startQuiz(makeSeed())} />
      );
      break;
    case 'mistakes':
      content = activeReport ? (
        <MistakesPage report={activeReport} onNavigate={navigate} />
      ) : (
        <MissingReport onNavigate={navigate} onStart={() => startQuiz(makeSeed())} />
      );
      break;
    case 'saved':
      content = <SavedPage onNavigate={navigate} onStart={() => startQuiz(makeSeed())} />;
      break;
    case 'privacy':
      content = <PrivacyPage onNavigate={navigate} />;
      break;
    default:
      content = <HomePage onStart={startQuiz} onNavigate={navigate} />;
  }

  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          const main = document.getElementById('main-content');
          if (main) {
            main.setAttribute('tabindex', '-1');
            main.focus({ preventScroll: true });
            main.scrollIntoView({ block: 'start', behavior: 'auto' });
          }
        }}
      >
        跳到主要内容
      </a>
      <SiteHeader route={headerRoute} onNavigate={navigate} />
      <div id="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {content}
      </div>
      <SiteFooter onNavigate={navigate} />
    </>
  );
}

function MissingReport({ onNavigate, onStart }: { onNavigate: (path: string) => void; onStart: () => void }) {
  const toast = useToast();
  return (
    <main className="wrap" style={{ flex: 1 }}>
      <div className="empty-state" style={{ marginTop: 40 }}>
        没有找到这份报告。报告只保存在生成它的浏览器里，换设备或清除数据后无法找回。
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 18, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" onClick={onStart}>
            重新测试
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => onNavigate('/saved')}>
            查看已保存报告
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={async () => {
              const ok = await copyText(window.location.href);
              toast(ok ? '页面链接已复制（仅含报告编号）' : '复制失败', ok ? 'ok' : 'err');
            }}
          >
            复制页面链接
          </button>
        </div>
      </div>
    </main>
  );
}
