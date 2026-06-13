import React from 'react';

const VARIANTS = {
  default: { bg: 'var(--bg-elevated)',        color: 'var(--text-secondary)', border: 'var(--border)' },
  teal:    { bg: 'rgba(0,201,167,0.12)',       color: 'var(--teal)',           border: 'rgba(0,201,167,0.3)' },
  amber:   { bg: 'rgba(245,166,35,0.12)',      color: 'var(--amber)',          border: 'rgba(245,166,35,0.3)' },
  red:     { bg: 'rgba(255,77,109,0.12)',      color: 'var(--red)',            border: 'rgba(255,77,109,0.3)' },
  blue:    { bg: 'rgba(77,159,255,0.12)',      color: 'var(--blue)',           border: 'rgba(77,159,255,0.3)' },
  muted:   { bg: 'var(--bg-elevated)',         color: 'var(--text-muted)',     border: 'var(--border)' },
};

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  style = {},
  className = '',
}) {
  const v = VARIANTS[variant] || VARIANTS.default;

  const padding = size === 'sm' ? '2px 8px' : size === 'lg' ? '6px 14px' : '3px 10px';
  const fontSize = size === 'sm' ? 9 : size === 'lg' ? 13 : 11;

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: dot ? 6 : 0,
        padding,
        background: v.bg,
        color: v.color,
        border: `1px solid ${v.border}`,
        borderRadius: 99,
        fontFamily: 'var(--font-mono)',
        fontSize,
        fontWeight: 500,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
        lineHeight: 1.4,
        ...style,
      }}
    >
      {dot && (
        <span style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: v.color,
          flexShrink: 0,
        }} />
      )}
      {children}
    </span>
  );
}