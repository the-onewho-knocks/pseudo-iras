import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const CRUMBS = {
  '/dashboard': ['Home', 'Dashboard'],
  '/upload':    ['Home', 'Upload'],
  '/analyze':   ['Home', 'Analyze'],
  '/resume':    ['Home', 'Resume Match'],
  '/report':    ['Home', 'Report'],
  '/email':     ['Home', 'Email'],
};

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeSession } = useApp();

  const basePath = '/' + location.pathname.split('/')[1];
  const crumbs = CRUMBS[basePath] || ['Home'];

  return (
    <header className="topbar">
      <div className="topbar-breadcrumb">
        {crumbs.map((crumb, i) => (
          <React.Fragment key={crumb}>
            {i > 0 && <span style={{ color: 'var(--border-accent)' }}>›</span>}
            <span className={i === crumbs.length - 1 ? 'active' : ''}>{crumb}</span>
          </React.Fragment>
        ))}
        {location.pathname.includes('/analyze/') && (
          <>
            <span style={{ color: 'var(--border-accent)' }}>›</span>
            <span className="active" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--amber)' }}>
              {location.pathname.split('/').pop()}
            </span>
          </>
        )}
      </div>

      <div className="topbar-actions">
        {activeSession && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            padding: '6px 12px',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)', display: 'inline-block' }} />
            Session: <span style={{ color: 'var(--text-primary)' }}>{activeSession.id?.slice(0,8)}…</span>
          </div>
        )}

        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/upload')}
        >
          + New Session
        </button>
      </div>
    </header>
  );
}