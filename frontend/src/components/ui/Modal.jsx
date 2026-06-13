import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ isOpen, onClose, title, children, footer, width }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="modal" style={{ maxWidth: width || 560 }}>
        <div className="modal-header">
          <div>
            {title && (
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                fontWeight: 400,
              }}>{title}</h2>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer',
              fontSize: 22, lineHeight: 1, padding: '0 4px',
              transition: 'var(--transition)',
            }}
            onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
          >×</button>
        </div>

        <div>{children}</div>

        {footer && (
          <>
            <div className="divider" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              {footer}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}