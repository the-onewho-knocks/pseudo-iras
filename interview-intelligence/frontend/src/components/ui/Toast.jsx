import React from 'react';

const ICONS = {
  success: '✓',
  error:   '✕',
  info:    '◆',
  warning: '⚠',
};

const COLORS = {
  success: 'var(--teal)',
  error:   'var(--red)',
  info:    'var(--amber)',
  warning: 'var(--amber)',
};

export default function Toast({ id, message, type = 'info', onClose }) {
  return (
    <div className={`toast ${type}`}>
      <span style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: `${COLORS[type]}20`,
        color: COLORS[type],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 700,
        flexShrink: 0,
        fontFamily: 'var(--font-mono)',
      }}>
        {ICONS[type]}
      </span>
      <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1 }}>
        {message}
      </span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: 16,
          padding: '0 4px',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}