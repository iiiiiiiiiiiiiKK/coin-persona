import { AUTHOR_X_URL, SITE_EN, SITE_NAME } from '../data/site';

export function BrandMark({ size = 26 }: { size?: number }) {
  return (
    <svg className="brand-mark" viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="14" fill="#07110e" stroke="rgba(75,255,176,0.35)" />
      <path
        d="M13 45 L25 33 L33 39 L51 18"
        fill="none"
        stroke="#4bffb0"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13 52 H51" stroke="#ff9f43" strokeWidth="3" strokeLinecap="round" />
      <circle cx="51" cy="18" r="4" fill="#ff9f43" />
    </svg>
  );
}

interface Props {
  route: 'home' | 'saved' | 'privacy';
  onNavigate: (path: string) => void;
}

export function SiteHeader({ route, onNavigate }: Props) {
  return (
    <header className="topbar">
      <div className="wrap topbar-inner">
        <a
          className="brand"
          href="#/"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('/');
          }}
          aria-label={`${SITE_NAME} 首页`}
        >
          <BrandMark />
          <span className="brand-en">{SITE_EN}</span>
          <span className="brand-cn">{SITE_NAME}</span>
        </a>
        <nav className="topbar-nav" aria-label="主导航">
          <button
            type="button"
            className="navlink"
            aria-current={route === 'home' ? 'page' : undefined}
            onClick={() => onNavigate('/')}
          >
            测试
          </button>
          <button
            type="button"
            className="navlink"
            aria-current={route === 'saved' ? 'page' : undefined}
            onClick={() => onNavigate('/saved')}
          >
            我的报告
          </button>
          <button
            type="button"
            className="navlink"
            aria-current={route === 'privacy' ? 'page' : undefined}
            onClick={() => onNavigate('/privacy')}
          >
            隐私与数据
          </button>
        </nav>
        <a
          className="author-x"
          href={AUTHOR_X_URL}
          target="_blank"
          rel="noreferrer noopener"
          aria-label="作者 𝕏：@0xkillcoin（在新标签页打开）"
          title="作者 𝕏 · @0xkillcoin"
        >
          <svg className="author-x-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
            />
          </svg>
          <span className="author-x-handle">@0xkillcoin</span>
        </a>
      </div>
    </header>
  );
}
