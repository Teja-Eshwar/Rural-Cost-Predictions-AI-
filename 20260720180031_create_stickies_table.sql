import { useMemo } from 'react';

export type Series = { label: string; color: string; values: number[] };

export function LineChart({ labels, series, height = 200 }: { labels: string[]; series: Series[]; height?: number }) {
  const W = 320, H = height, pad = { l: 36, r: 12, t: 12, b: 28 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const allVals = series.flatMap((s) => s.values);
  const max = Math.max(1, ...allVals);
  const min = Math.min(0, ...allVals);
  const range = max - min || 1;

  const xFor = (i: number) => pad.l + (i / Math.max(1, labels.length - 1)) * innerW;
  const yFor = (v: number) => pad.t + innerH - ((v - min) / range) * innerH;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((p) => min + p * range);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      {gridLines.map((g, i) => (
        <g key={i}>
          <line x1={pad.l} x2={W - pad.r} y1={yFor(g)} y2={yFor(g)} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2 3" />
          <text x={pad.l - 4} y={yFor(g) + 3} textAnchor="end" fontSize="8" fill="#94a3b8">{Math.round(g)}</text>
        </g>
      ))}
      {series.map((s) => {
        const path = s.values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(v)}`).join(' ');
        return (
          <g key={s.label}>
            <path d={path} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {s.values.map((v, i) => (
              <circle key={i} cx={xFor(i)} cy={yFor(v)} r="2.5" fill={s.color} />
            ))}
          </g>
        );
      })}
      {labels.map((l, i) => (
        <text key={i} x={xFor(i)} y={H - pad.b + 14} textAnchor="middle" fontSize="8" fill="#94a3b8">{l}</text>
      ))}
    </svg>
  );
}

export function AreaChart({ labels, values, color = '#10b981', height = 200 }: { labels: string[]; values: number[]; color?: string; height?: number }) {
  const W = 320, H = height, pad = { l: 36, r: 12, t: 12, b: 28 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const range = max - min || 1;
  const xFor = (i: number) => pad.l + (i / Math.max(1, values.length - 1)) * innerW;
  const yFor = (v: number) => pad.t + innerH - ((v - min) / range) * innerH;
  const areaPath = `M ${xFor(0)} ${yFor(values[0] ?? 0)} ${values.map((v, i) => `L ${xFor(i)} ${yFor(v)}`).join(' ')} L ${xFor(values.length - 1)} ${pad.t + innerH} L ${xFor(0)} ${pad.t + innerH} Z`;
  const linePath = `M ${xFor(0)} ${yFor(values[0] ?? 0)} ${values.map((v, i) => `L ${xFor(i)} ${yFor(v)}`).join(' ')}`;
  const gradId = useMemo(() => `grad-${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
        const g = min + p * range;
        return (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={pad.t + innerH - p * innerH} y2={pad.t + innerH - p * innerH} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2 3" />
            <text x={pad.l - 4} y={pad.t + innerH - p * innerH + 3} textAnchor="end" fontSize="8" fill="#94a3b8">{Math.round(g)}</text>
          </g>
        );
      })}
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {values.map((v, i) => (
        <circle key={i} cx={xFor(i)} cy={yFor(v)} r="2.5" fill={color} />
      ))}
      {labels.map((l, i) => (
        <text key={i} x={xFor(i)} y={H - pad.b + 14} textAnchor="middle" fontSize="8" fill="#94a3b8">{l}</text>
      ))}
    </svg>
  );
}

export function BarChart({ labels, values, color = '#0ea5e9', height = 200 }: { labels: string[]; values: number[]; color?: string; height?: number }) {
  const W = 320, H = height, pad = { l: 36, r: 12, t: 12, b: 28 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const max = Math.max(1, ...values);
  const barW = innerW / Math.max(1, values.length) - 4;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
        <g key={i}>
          <line x1={pad.l} x2={W - pad.r} y1={pad.t + innerH - p * innerH} y2={pad.t + innerH - p * innerH} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2 3" />
          <text x={pad.l - 4} y={pad.t + innerH - p * innerH + 3} textAnchor="end" fontSize="8" fill="#94a3b8">{Math.round(p * max)}</text>
        </g>
      ))}
      {values.map((v, i) => {
        const h = (v / max) * innerH;
        const x = pad.l + i * (innerW / values.length) + 2;
        const y = pad.t + innerH - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx="3" fill={color} opacity="0.85" />
            <text x={x + barW / 2} y={H - pad.b + 14} textAnchor="middle" fontSize="8" fill="#94a3b8">{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function DonutChart({ segments, size = 140 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = 50, cx = 60, cy = 60, circumference = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox="0 0 120 120">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="14" />
        {segments.map((s, i) => {
          const len = (s.value / total) * circumference;
          const dash = `${len} ${circumference - len}`;
          const el = (
            <circle
              key={i}
              cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="14"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              transform="rotate(-90 60 60)"
            />
          );
          offset += len;
          return el;
        })}
        <text x="60" y="64" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1e293b">{total}</text>
      </svg>
      <div className="flex flex-col gap-1">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full" style={{ background: s.color }} />
            <span className="text-slate-600 dark:text-slate-300">{s.label}</span>
            <span className="font-medium text-slate-800 dark:text-slate-100">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
