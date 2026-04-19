import React from 'react';

export default function Card({
  children,
  elevated  = false,
  padding,
  style     = {},
  className = '',
  onClick,
}) {
  return (
    <div
      className={`card ${elevated ? 'card-elevated' : ''} ${className}`.trim()}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : undefined,
        padding: padding !== undefined ? padding : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, style = {} }) {
  return (
    <div
      className="flex-between"
      style={{ marginBottom: 16, ...style }}
    >
      <div>
        {title && (
          <div className="section-label" style={{ marginBottom: subtitle ? 4 : 0 }}>
            {title}
          </div>
        )}
        {subtitle && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{subtitle}</div>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardDivider({ style = {} }) {
  return (
    <div
      className="divider"
      style={{ margin: '16px 0', ...style }}
    />
  );
}

export function StatCard({ value, label, sub, color, icon, delay = 1, className = '' }) {
  return (
    <div className={`card fade-in stagger-${delay} ${className}`}>
      {icon && (
        <div style={{ fontSize: 22, color: 'var(--amber)', marginBottom: 10 }}>
          {icon}
        </div>
      )}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 42,
        fontWeight: 600,
        color: color || 'var(--text-primary)',
        lineHeight: 1,
        marginBottom: 6,
      }}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
      {sub && (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-muted)',
          marginTop: 8,
        }}>
          {sub}
        </div>
      )}
    </div>
  );
}