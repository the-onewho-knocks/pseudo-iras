import React from 'react';

export default function ScoreGauge({ score = 0, size = 120, label, color }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score));
  const dash = (pct / 100) * circ;
  const gap = circ - dash;

  const resolvedColor =
    color ||
    (pct >= 75 ? 'var(--teal)' :
     pct >= 50 ? 'var(--amber)' :
     'var(--red)');

  const fontSize = size < 90 ? 18 : size < 130 ? 24 : 30;
  const subFontSize = size < 90 ? 8 : 10;

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="var(--bg-hover)"
          strokeWidth={8}
        />
        {/* Fill */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={resolvedColor}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="score-text" style={{ transform: 'rotate(90deg) translateX(-0%)' }}>
        {/* We rotate the container but counter-rotate the text */}
        <div style={{ transform: 'rotate(-90deg)' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: fontSize,
            fontWeight: 600,
            color: resolvedColor,
            lineHeight: 1,
            textAlign: 'center',
          }}>
            {Math.round(pct)}
          </div>
          {label && (
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: subFontSize,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              textAlign: 'center',
              marginTop: 2,
            }}>
              {label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}