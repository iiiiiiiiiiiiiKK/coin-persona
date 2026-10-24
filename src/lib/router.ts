import { useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'quiz'; seed: string }
  | { name: 'result'; id: string }
  | { name: 'mistakes'; id: string }
  | { name: 'saved' }
  | { name: 'privacy' };

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/';
  const [pathPart, queryPart = ''] = raw.split('?');
  const segments = pathPart.split('/').filter(Boolean);
  const params = new URLSearchParams(queryPart);

  if (segments.length === 0) return { name: 'home' };
  if (segments[0] === 'quiz') return { name: 'quiz', seed: params.get('seed') ?? '' };
  if (segments[0] === 'report' && segments[1]) {
    if (segments[2] === 'mistakes') return { name: 'mistakes', id: segments[1] };
    return { name: 'result', id: segments[1] };
  }
  if (segments[0] === 'saved') return { name: 'saved' };
  if (segments[0] === 'privacy') return { name: 'privacy' };
  return { name: 'home' };
}

export function navigate(path: string): void {
  if (window.location.hash === `#${path}`) return;
  window.location.hash = path;
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

/** 复制文本：优先 Clipboard API，失败时退回 textarea。 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
