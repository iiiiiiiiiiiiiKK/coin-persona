import { AUTHOR_X_URL, DISCLAIMER_SHORT, SITE_EN, SITE_LIVE_URL, SITE_NAME, SITE_REPO_URL, SITE_TAGLINE, SITE_VERSION } from '../data/site';
import { BrandMark } from './SiteHeader';

export function SiteFooter({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="footer-logo">
              <BrandMark size={22} />
              <span className="mono" style={{ letterSpacing: '0.16em', fontSize: 10.5, color: 'var(--faint)' }}>
                {SITE_EN} · {SITE_NAME} · {SITE_VERSION}
              </span>
            </div>
            <p className="footer-note">
              {SITE_TAGLINE}。{DISCLAIMER_SHORT}
              这是自我反思问卷，不是经过验证的心理测量，也不代表真实交易水平。
            </p>
          </div>

          <div className="footer-col">
            <span className="footer-title">PRODUCT</span>
            <div className="footer-links">
              <button type="button" onClick={() => onNavigate('/')}>
                开始测试
              </button>
              <button type="button" onClick={() => onNavigate('/saved')}>
                我的报告
              </button>
              <button type="button" onClick={() => onNavigate('/privacy')}>
                隐私与数据
              </button>
            </div>
          </div>

          <div className="footer-col">
            <span className="footer-title">LINKS</span>
            <div className="footer-links">
              <a href={SITE_REPO_URL} target="_blank" rel="noreferrer noopener">
                GitHub 仓库
              </a>
              <a href={AUTHOR_X_URL} target="_blank" rel="noreferrer noopener">
                𝕏 @0xkillcoin
              </a>
              <a href={SITE_LIVE_URL} target="_blank" rel="noreferrer noopener">
                在线体验
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} @0xkillcoin · MIT License</span>
          <span className="mono" style={{ fontSize: 10 }}>
            BUILT WITH REACT + VITE · NO TRACKING · NO WALLET
          </span>
        </div>
      </div>
    </footer>
  );
}
