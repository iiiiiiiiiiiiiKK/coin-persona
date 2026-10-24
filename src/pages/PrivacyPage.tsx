import { useMemo, useState } from 'react';
import { DISCLAIMER_LONG, PRIVACY_POINTS, PRIVACY_STORAGE_KEY, SITE_NAME } from '../data/site';
import { QUESTIONS } from '../data/questions';
import { formatBytes, storageBytes } from '../lib/storage';
import { useStore } from '../store/AppStore';
import { useToast } from '../components/Toast';

interface Props {
  onNavigate: (path: string) => void;
}

export function PrivacyPage({ onNavigate }: Props) {
  const { state, resetAll, setPrefs } = useStore();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const bytes = useMemo(() => storageBytes(), [state.reports.length, state.run]);

  const clear = () => {
    resetAll();
    setConfirming(false);
    toast('本机保存的全部数据已清除');
  };

  return (
    <main className="wrap">
      <div className="legal">
        <div className="eyebrow">PRIVACY & DATA / 隐私与数据</div>
        <h1 style={{ marginTop: 12 }}>你的答案，只属于你的浏览器</h1>
        <p style={{ fontSize: 15 }}>
          {SITE_NAME}是纯前端应用：没有账号系统、没有服务端数据库、不接入交易所或钱包。下面的说明可以直接对照源码验证。
        </p>

        <h2>我们保存什么</h2>
        <ul>
          <li>答题进度：题码、已选选项、当前题号、开始与更新时间。</li>
          <li>你主动点击「保存报告」后生成的报告摘要：人格、分数、时间与题单。</li>
          <li>界面偏好：是否减少动画、是否自动跳题，以及分享图比例与配色。</li>
        </ul>
        <p className="storage-line">
          localStorage key: {PRIVACY_STORAGE_KEY} · 当前占用约 {formatBytes(bytes)} · 最多保留 40 份报告
        </p>

        <h2>我们不做什么</h2>
        <ul>
          {PRIVACY_POINTS.map((p) => (
            <li key={p.title}>
              <strong style={{ color: 'var(--ink)' }}>{p.title}：</strong>
              {p.body}
            </li>
          ))}
          <li>不读取剪贴板、摄像头、麦克风、定位、通讯录或任何文件。</li>
          <li>不请求私钥、助记词、交易所 API Key，也不读取真实持仓与资产余额。</li>
          <li>{QUESTIONS.length} 道题库与评分映射全部打包在本地代码中，答题过程不发送网络请求。</li>
        </ul>

        <h2>关于分享</h2>
        <p>
          分享图由浏览器 Canvas 在本机绘制。只有当你点击「下载 PNG」或「复制图片」，内容才会被保存到你选择的设备或剪贴板。报告页的「复制报告」把纯文本写入剪贴板，同样不会上传。
        </p>

        <h2>关于这份问卷</h2>
        <ul>
          {DISCLAIMER_LONG.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        <h2>偏好设置</h2>
        <div className="data-actions">
          <button
            type="button"
            className="btn btn-sm"
            aria-pressed={state.prefs.reduceMotion}
            onClick={() => setPrefs({ reduceMotion: !state.prefs.reduceMotion })}
          >
            减少动画：{state.prefs.reduceMotion ? '已开启' : '关闭'}
          </button>
          <button
            type="button"
            className="btn btn-sm"
            aria-pressed={state.prefs.autoNext}
            onClick={() => setPrefs({ autoNext: !state.prefs.autoNext })}
          >
            选中后自动跳下一题：{state.prefs.autoNext ? '已开启' : '关闭'}
          </button>
        </div>
        <p className="hint" style={{ marginTop: 12 }}>
          关闭减少动画时，我们仍会遵循操作系统的「减少动态效果」设置。键盘操作：答题页可用 <kbd>1</kbd>–<kbd>5</kbd> 选择选项，<kbd>←</kbd> / <kbd>→</kbd> 切换题目，<kbd>Enter</kbd> 进入下一题。
        </p>

        <div className="danger-zone">
          <h2>清除本机数据</h2>
          <p style={{ marginTop: 6 }}>
            会删除答题进度、全部已保存报告与偏好设置。此操作不可撤销，也不会影响你已经下载的分享图。
          </p>
          <div className="data-actions">
            {confirming ? (
              <>
                <button type="button" className="btn btn-sm" style={{ borderColor: 'var(--red)', color: 'var(--red)' }} onClick={clear}>
                  确认清除全部数据
                </button>
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirming(false)}>
                  取消
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-sm" onClick={() => setConfirming(true)}>
                清除全部本地数据
              </button>
            )}
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => onNavigate('/')}>
              返回首页
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
