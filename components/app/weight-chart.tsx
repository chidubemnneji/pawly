'use client';

import { useMemo } from 'react';

type Point = { x: string; y: number };

/**
 * Tiny inline SVG line chart. No chart library dependency. Plots weight over
 * time and shades the breed's typical range.
 */
export function WeightChart({ logs, breedRange }: { logs: Point[]; breedRange?: readonly [number, number] }) {
  const W = 600;
  const H = 200;
  const PAD = { l: 36, r: 12, t: 12, b: 24 };

  const { path, dots, xLabels, yMin, yMax } = useMemo(() => {
    const ys = logs.map((p) => p.y);
    const lo = Math.min(...ys, breedRange?.[0] ?? Infinity);
    const hi = Math.max(...ys, breedRange?.[1] ?? -Infinity);
    const pad = (hi - lo) * 0.15 || 1;
    const yMin = Math.max(0, lo - pad);
    const yMax = hi + pad;

    const xMin = new Date(logs[0].x).getTime();
    const xMax = new Date(logs[logs.length - 1].x).getTime();
    const xRange = Math.max(1, xMax - xMin);

    const sx = (t: number) => PAD.l + ((t - xMin) / xRange) * (W - PAD.l - PAD.r);
    const sy = (v: number) => H - PAD.b - ((v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);

    const dots = logs.map((p) => ({ cx: sx(new Date(p.x).getTime()), cy: sy(p.y), v: p.y }));
    const path = dots.map((d, i) => `${i === 0 ? 'M' : 'L'} ${d.cx.toFixed(1)} ${d.cy.toFixed(1)}`).join(' ');

    const xLabels = [
      { x: PAD.l, label: new Date(xMin).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) },
      { x: W - PAD.r, label: new Date(xMax).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) },
    ];

    return { path, dots, xLabels, yMin, yMax };
  }, [logs, breedRange]);

  // Breed range band coordinates
  const bandY1 = breedRange ? H - PAD.b - ((breedRange[1] - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b) : 0;
  const bandY2 = breedRange ? H - PAD.b - ((breedRange[0] - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b) : 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* Breed range shading */}
      {breedRange && (
        <>
          <rect
            x={PAD.l}
            y={bandY1}
            width={W - PAD.l - PAD.r}
            height={Math.max(0, bandY2 - bandY1)}
            fill="#3F6B4E"
            fillOpacity="0.08"
          />
          <line x1={PAD.l} y1={bandY1} x2={W - PAD.r} y2={bandY1} stroke="#3F6B4E" strokeOpacity="0.25" strokeDasharray="2 4" />
          <line x1={PAD.l} y1={bandY2} x2={W - PAD.r} y2={bandY2} stroke="#3F6B4E" strokeOpacity="0.25" strokeDasharray="2 4" />
        </>
      )}
      {/* y-axis labels */}
      <text x={4} y={PAD.t + 8} fontSize="11" fill="#8C9591">{yMax.toFixed(1)} kg</text>
      <text x={4} y={H - PAD.b + 4} fontSize="11" fill="#8C9591">{yMin.toFixed(1)} kg</text>
      {/* line */}
      <path d={path} fill="none" stroke="#3F6B4E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* dots */}
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={3.5} fill="#3F6B4E" />
      ))}
      {/* x-axis labels */}
      {xLabels.map((l, i) => (
        <text
          key={i}
          x={l.x}
          y={H - 4}
          fontSize="11"
          fill="#8C9591"
          textAnchor={i === 0 ? 'start' : 'end'}
        >
          {l.label}
        </text>
      ))}
    </svg>
  );
}
