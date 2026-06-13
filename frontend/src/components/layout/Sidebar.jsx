import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const NAV = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard',  icon: '⬡', path: '/dashboard' },
    ],
  },
  {
    section: 'Analysis',
    items: [
      { label: 'Upload',     icon: '↑', path: '/upload' },
      { label: 'Analyze',    icon: '◈', path: '/analyze' },
      { label: 'Report',     icon: '▤', path: '/report' },
    ],
  },
  {
    section: 'Tools',
    items: [
      { label: 'Resume Match', icon: '⊡', path: '/resume' },
      { label: 'Email',        icon: '◻', path: '/email' },
    ],
  },
];

export default function Sidebar() {
  const { activeSession } = useApp();
  const location = useLocation();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-mark">IRAS · v2.0</div>
        <div className="logo-name">Interview<br />Intelligence</div>
      </div>

      {/* Active session indicator */}
      {activeSession && (
        <div style={{
          margin: '12px 16px',
          padding: '10px 14px',
          background: 'var(--amber-glow)',
          border: '1px solid rgba(245,166,35,0.25)',
          borderRadius: 'var(--radius-md)',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--amber)',
            marginBottom: '4px',
          }}>Active Session</div>
          <div style={{
            fontSize: '12px',
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>{activeSession.filename || activeSession.id}</div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--amber)',
            marginTop: '4px',
          }}>● {activeSession.status || 'ready'}</div>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <div className="nav-section-label">{section}</div>
            {items.map(({ label, icon, path }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''}`
                }
              >
                <span className="nav-icon">{icon}</span>
                <span>{label}</span>
                {path === '/analyze' && activeSession && (
                  <span className="nav-badge">1</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-status">
          <span className="status-dot" />
          <span>API Connected</span>
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--text-muted)',
          marginTop: '6px',
        }}>
          {import.meta.env.VITE_API_URL || '127.0.0.1:8000'}
        </div>
      </div>
    </aside>
  );
}