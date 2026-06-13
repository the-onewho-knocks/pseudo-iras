import React from 'react';

// ── Spinner ───────────────────────────────────────────────────
export function Spinner({ size = 'md', color }) {
  const sz = size === 'sm' ? 14 : size === 'lg' ? 32 : 20;
  return (
    <svg
      width={sz}
      height={sz}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'spin 0.7s linear infinite', flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" stroke={color || 'currentColor'} strokeWidth="3" strokeOpacity="0.2" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke={color || 'currentColor'}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── LoadingScreen ─────────────────────────────────────────────
export function LoadingScreen({ message = 'Loading…' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: 16,
    }}>
      <Spinner size="lg" color="var(--amber)" />
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: 'var(--text-muted)',
        letterSpacing: '0.08em',
      }}>
        {message}
      </div>
    </div>
  );
}

// ── SkeletonCard ──────────────────────────────────────────────
export function SkeletonCard() {
  return (
    <div className="card" style={{ opacity: 0.5 }}>
      {[80, 60, 90, 50].map((w, i) => (
        <div key={i} style={{
          height: i === 0 ? 18 : 12,
          width: `${w}%`,
          background: 'var(--bg-elevated)',
          borderRadius: 4,
          marginBottom: i < 3 ? 12 : 0,
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ))}
    </div>
  );
}