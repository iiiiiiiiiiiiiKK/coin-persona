import { SITE_EN, SITE_NAME } from '../data/site';

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
      </div>
    </header>
  );
}
