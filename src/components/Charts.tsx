import { DIMENSIONS } from '../data/dimensions';
import type { DimensionScores } from '../data/types';

/** 半圆风险仪表：与分享图里的刻度保持一致，但用 SVG 渲染以便响应式与无障碍。 */
export function RiskDial({
  value,
  label = 'RISK TEMP / 风险温度',
  size = 220,
}: {
  value: number;
  label?: string;
  size?: number;
}) {
  const r = 78;
  const cx = 100;
  const cy = 96;
  const start = Math.PI * 1.08;
  const end = Math.PI * 1.92;
  const segs = 28;
  const arcs = Array.from({ length: segs }, (_, i) => {
    const t0 = (i + 0.08) / segs;
    const t1 = (i + 0.92) / segs;
    const a0 = start + (end - start) * t0;
    const a1 = start + (end - start) * t1;
    const color = t0 < 0.55 ? 'var(--green)' : t0 < 0.82 ? 'var(--orange)' : 'var(--red)';
    return {
      key: i,
      d: describeArc(cx, cy, r, a0, a1),
      color,
      dim: t0 > value / 100,
    };
  });
  const angle = start + (end - start) * (value / 100);
  const nx = cx + Math.cos(angle) * (r - 12);
  const ny = cy + Math.sin(angle) * (r - 12);

  return (
    <figure className="dial">
      <svg viewBox="0 0 200 120" width={size} height={size * 0.6} role="img" aria-label={`${label}：${value} / 100`}>
        {arcs.map((a) => (
          <path key={a.key} d={a.d} stroke={a.dim ? 'var(--line-strong)' : a.color} strokeWidth="7" fill="none" />
        ))}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="3.6" fill="var(--ink)" />
        <text x={cx} y={cy - 18} textAnchor="middle" className="dial-value">
          {value}
        </text>
        <text x="16" y="116" className="dial-scale">
          0
        </text>
        <text x="176" y="116" textAnchor="end" className="dial-scale">
          100
        </text>
      </svg>
      <figcaption className="dial-caption">{label}</figcaption>
    </figure>
  );
}

function polar(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function describeArc(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const p0 = polar(cx, cy, r, a0);
  const p1 = polar(cx, cy, r, a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
}

/** 六维雷达图：中点 50 是基准，越靠外表示越强。 */
export function RadarChart({ scores, size = 300 }: { scores: DimensionScores; size?: number }) {
  const cx = 150;
  const cy = 148;
  const maxR = 104;
  const count = DIMENSIONS.length;

  const point = (index: number, value: number) => {
    const angle = -Math.PI / 2 + (index / count) * Math.PI * 2;
    const r = (value / 100) * maxR;
    return polar(cx, cy, r, angle);
  };

  const rings = [0.25, 0.5, 0.75, 1];
  const polygon = DIMENSIONS.map((d, i) => point(i, scores[d.key]));
  const path = polygon.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';

  return (
    <figure className="radar">
      <svg viewBox="0 0 300 300" width={size} height={size} role="img" aria-label="六维雷达图">
        {rings.map((k) => (
          <polygon
            key={k}
            points={DIMENSIONS.map((_, i) => {
              const p = point(i, k * 100);
              return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
            }).join(' ')}
            fill="none"
            stroke="var(--line)"
            strokeWidth="1"
          />
        ))}
        {DIMENSIONS.map((d, i) => {
          const p = point(i, 100);
          return <line key={d.key} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--line)" strokeWidth="1" />;
        })}
        <polygon points={`${cx},${cy}`} fill="none" />
        <path d={path} fill="rgba(75,255,176,0.12)" stroke="var(--green)" strokeWidth="1.6" />
        {polygon.map((p, i) => (
          <circle key={DIMENSIONS[i].key} cx={p.x} cy={p.y} r="3" fill="var(--green)" />
        ))}
        {DIMENSIONS.map((d, i) => {
          const p = point(i, 118);
          const anchor = Math.abs(p.x - cx) < 6 ? 'middle' : p.x > cx ? 'start' : 'end';
          return (
            <text key={d.key} x={p.x} y={p.y} textAnchor={anchor} className="radar-label" dominantBaseline="middle">
              {d.code}
            </text>
          );
        })}
      </svg>
      <figcaption className="dial-caption">六维轮廓 · 越向外越强</figcaption>
    </figure>
  );
}
