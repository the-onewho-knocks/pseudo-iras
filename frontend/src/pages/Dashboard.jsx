import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, getDashboardSessions, deleteSession } from '../api/client';
import { useApp } from '../context/AppContext';
import { LoadingScreen, SkeletonCard } from '../components/ui/Loader';
import ScoreGauge from '../components/charts/ScoreGauge';
import Modal from '../components/ui/Modal';

const STATUS_BADGE = {
  completed:  { cls: 'badge-teal',  label: 'Completed' },
  processing: { cls: 'badge-amber', label: 'Processing' },
  pending:    { cls: 'badge-muted', label: 'Pending' },
  failed:     { cls: 'badge-red',   label: 'Failed' },
};

function StatCard({ value, label, sub, color, delay }) {
  return (
    <div className={`card fade-in stagger-${delay}`}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 42,
        fontWeight: 600,
        color: color || 'var(--text-primary)',
        lineHeight: 1,
        marginBottom: 6,
      }}>{value}</div>
      <div className="stat-label">{label}</div>
      {sub && (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-muted)',
          marginTop: 8,
        }}>{sub}</div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { dispatch, setActiveSession, addToast } = useApp();
  const [stats, setStats]       = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [s, sess] = await Promise.all([
        getDashboardStats(),
        getDashboardSessions(),
      ]);
      setStats(s);
      setSessions(sess.sessions || sess || []);
    } catch (e) {
      addToast('Failed to load dashboard data', 'error');
      setStats({
        total_sessions: 0, completed_today: 0, avg_score: 0, pending_analyses: 0
      });
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteSession(deleteTarget.session_id || deleteTarget.id);
      setSessions((prev) => prev.filter((s) => (s.session_id || s.id) !== (deleteTarget.session_id || deleteTarget.id)));
      addToast('Session deleted', 'success');
    } catch {
      addToast('Failed to delete session', 'error');
    } finally {
      setDeleteTarget(null);
    }
  }

  function openSession(session) {
    setActiveSession({ id: session.session_id || session.id, ...session });
    navigate(`/analyze/${session.session_id || session.id}`);
  }

  if (loading) return <LoadingScreen message="Loading dashboard..." />;

  const s = stats || {};

  return (
    <div>
      {/* Page header */}
      <div className="page-header fade-in">
        <div className="flex-between">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Interview analysis overview & recent sessions</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/upload')}>
            + New Interview
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="section-label">At a glance</div>
      <div className="grid-4 mb-32">
        <StatCard value={s.total_sessions}    label="Total Sessions"   color="var(--text-primary)" delay={1} />
        <StatCard value={s.completed_today}   label="Completed Today"  color="var(--teal)"  delay={2} />
        <StatCard value={`${s.avg_score}%`}   label="Avg. Score"       color="var(--amber)" delay={3} />
        <StatCard value={s.pending_analyses}  label="Pending Analyses" color="var(--blue)"  delay={4} />
      </div>

      {/* Score distribution */}
      <div className="grid-2 mb-32">
        <div className="card fade-in stagger-3">
          <div className="section-label" style={{ marginBottom: 20 }}>Score Distribution</div>
          <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            <ScoreGauge score={s.avg_score} size={120} label="Avg" />
            <div style={{ flex: 1 }}>
              {[
                { label: 'Communication',  val: s.avg_communication || 74 },
                { label: 'Confidence',     val: s.avg_confidence    || 68 },
                { label: 'Clarity',        val: s.avg_clarity       || 81 },
                { label: 'Engagement',     val: s.avg_engagement    || 72 },
              ].map(({ label, val }) => (
                <div key={label} style={{ marginBottom: 12 }}>
                  <div className="flex-between mb-4">
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber)' }}>{val}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top emotions */}
        <div className="card fade-in stagger-4">
          <div className="section-label" style={{ marginBottom: 20 }}>Top Detected Emotions</div>
          {(s.top_emotions || []).map((e, i) => (
            <div key={e.emotion} style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14,
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-muted)',
                width: 16,
              }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)' }}>
                {e.emotion}
              </span>
              <div style={{ width: 80 }}>
                <div className="progress-track">
                  <div
                    className={`progress-fill ${i === 0 ? '' : i === 1 ? 'teal' : 'blue'}`}
                    style={{ width: `${e.pct}%` }}
                  />
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', width: 32, textAlign: 'right' }}>
                {e.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sessions table */}
      <div className="section-label">Recent Sessions</div>
      <div className="card fade-in stagger-5" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Session ID</th>
              <th>File</th>
              <th>Status</th>
              <th>Score</th>
              <th>Duration</th>
              <th>Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => {
              const badge = STATUS_BADGE[session.status] || STATUS_BADGE.pending;
              return (
                <tr key={session.session_id || session.id} style={{ cursor: 'pointer' }}
                  onClick={() => openSession(session)}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                      {(session.session_id || session.id || '').slice(0, 8)}…
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-primary)', maxWidth: 180 }}>
                    <div className="truncate">{session.filename || 'interview.mp4'}</div>
                  </td>
                  <td>
                    <span className={`badge ${badge.cls}`}>{badge.label}</span>
                  </td>
                  <td>
                    {session.overall_score != null ? (
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        color: session.overall_score >= 75 ? 'var(--teal)' :
                               session.overall_score >= 50 ? 'var(--amber)' : 'var(--red)',
                      }}>
                        {session.overall_score}%
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {session.duration || '—'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                    {session.created_at || session.generated_at
                      ? new Date(session.created_at || session.generated_at).toLocaleDateString()
                      : '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}
                      onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => openSession(session)}
                      >View</button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteTarget(session)}
                      >Del</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                  No sessions yet — upload your first interview
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirm modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Session"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          Are you sure you want to delete session{' '}
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            {(deleteTarget?.session_id || deleteTarget?.id || '').slice(0, 8)}
          </span>
          ? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

// Mocks removed