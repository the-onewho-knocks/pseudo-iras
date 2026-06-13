import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReport, exportReportPdf, regenerateReport } from '../api/client';
import { useApp } from '../context/AppContext';
import { LoadingScreen, Spinner } from '../components/ui/Loader';
import ScoreGauge from '../components/charts/ScoreGauge';
import EmotionRadar from '../components/charts/EmotionRadar';
import AudioWaveBar from '../components/charts/AudioWaveBar';

export default function Report() {
  const { sessionId } = useParams();
  const navigate      = useNavigate();
  const { activeSession, addToast } = useApp();

  const resolvedId = sessionId || activeSession?.id;

  const [report, setReport]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [exporting, setExporting]   = useState(false);
  const [regenerating, setRegen]    = useState(false);

  useEffect(() => {
    if (resolvedId) fetchReport(resolvedId);
    if (resolvedId) fetchReport(resolvedId);
    else { setLoading(false); }
  }, [resolvedId]);

  async function fetchReport(id) {
    setLoading(true);
    try {
      const r = await getReport(id);
      setReport(r);
    } catch {
      setReport({});
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    if (!resolvedId) return;
    setExporting(true);
    try {
      const blob = await exportReportPdf(resolvedId);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `iras-report-${resolvedId?.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('PDF exported', 'success');
    } catch {
      addToast('Export failed — try again', 'error');
    } finally {
      setExporting(false);
    }
  }

  async function handleRegenerate() {
    if (!resolvedId) return;
    setRegen(true);
    try {
      await regenerateReport(resolvedId);
      await fetchReport(resolvedId);
      addToast('Report regenerated', 'success');
    } catch {
      addToast('Regeneration failed', 'error');
    } finally {
      setRegen(false);
    }
  }

  if (loading) return <LoadingScreen message="Generating report…" />;

  const r = report || {};

  return (
    <div>
      {/* Header */}
      <div className="flex-between mb-32 fade-in">
        <div>
          <h1 className="page-title">Interview Report</h1>
          <p className="page-subtitle">
            {r.candidate_name || 'Candidate'} ·{' '}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--amber)' }}>
              {resolvedId?.slice(0, 8) || 'demo'}
            </span>
            {' · '}{r.date || new Date().toLocaleDateString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={handleRegenerate} disabled={regenerating}>
            {regenerating ? <><Spinner size="sm" /> Regenerating…</> : '↻ Regenerate'}
          </button>
          <button className="btn btn-secondary" onClick={() => navigate(`/email?session=${resolvedId}`)}>
            ◻ Send Email
          </button>
          <button className="btn btn-primary" onClick={handleExport} disabled={exporting}>
            {exporting ? <><Spinner size="sm" color="#0d0e10" /> Exporting…</> : '↓ Export PDF'}
          </button>
        </div>
      </div>

      {/* Hero scores */}
      <div className="card fade-in stagger-1 mb-24" style={{
        background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
        border: '1px solid var(--border-accent)',
        padding: 32,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <div>
            <ScoreGauge score={r.scores?.overall ?? 78} size={140} label="Overall" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              marginBottom: 6,
            }}>{r.candidate_name || 'Candidate Name'}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
              {r.job_role || r.position || 'Software Engineer'} · {r.audio?.duration_sec ? `${Math.floor(r.audio.duration_sec/60)} min ${Math.floor(r.audio.duration_sec%60)} sec` : '—'}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'Communication', val: r.scores?.communication ?? 74 },
                { label: 'Confidence',    val: r.scores?.confidence    ?? 68 },
                { label: 'Clarity',       val: r.scores?.clarity       ?? 81 },
                { label: 'Engagement',    val: r.scores?.engagement    ?? 72 },
              ].map(({ label, val }) => (
                <div key={label} style={{
                  padding: '8px 16px',
                  background: 'var(--bg-base)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 600, color: 'var(--amber)' }}>
                    {val}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginTop: 2 }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{
              padding: '16px 20px',
              background: 'var(--bg-base)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              textAlign: 'center',
              minWidth: 120,
            }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                color: r.summary?.recommended ? 'var(--teal)' : 'var(--amber)',
                marginBottom: 4,
              }}>
                {r.summary?.recommended ? 'Hire' : 'Consider'}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                Recommendation
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Three column section */}
      <div className="grid-3 mb-24">
        <div className="card fade-in stagger-2">
          <div className="section-label" style={{ marginBottom: 16 }}>Strengths</div>
          {(r.strengths || []).map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <span style={{ color: 'var(--teal)', flexShrink: 0, marginTop: 2 }}>▲</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s}</span>
            </div>
          ))}
        </div>
        <div className="card fade-in stagger-3">
          <div className="section-label" style={{ marginBottom: 16 }}>Weaknesses</div>
          {(r.weaknesses || []).map((w, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <span style={{ color: 'var(--red)', flexShrink: 0, marginTop: 2 }}>▼</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{w}</span>
            </div>
          ))}
        </div>
        <div className="card fade-in stagger-4">
          <div className="section-label" style={{ marginBottom: 16 }}>Next Steps</div>
          {(r.next_steps || []).map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, paddingTop: 3 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2 mb-24">
        <div className="card fade-in stagger-3">
          <div className="section-label" style={{ marginBottom: 16 }}>Emotion Profile</div>
          <EmotionRadar data={r.emotions} />
        </div>
        <div className="card fade-in stagger-4">
          <div className="section-label" style={{ marginBottom: 16 }}>Audio — Volume Timeline</div>
          <AudioWaveBar metric="volume" />
          <div className="divider" style={{ margin: '16px 0' }} />
          <div className="grid-3" style={{ gap: 12 }}>
            {[
              { label: 'Avg Pace',   value: r.audio?.avg_pace   || '134 wpm' },
              { label: 'Avg Volume', value: r.audio?.avg_volume || '58 dB'   },
              { label: 'Fillers',    value: r.audio?.fillers    || '18'       },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Summary */}
      <div className="card fade-in stagger-5">
        <div className="section-label" style={{ marginBottom: 16 }}>AI Summary</div>
        <p style={{
          fontSize: 14,
          color: 'var(--text-secondary)',
          lineHeight: 1.8,
          borderLeft: '3px solid var(--amber)',
          paddingLeft: 20,
          fontStyle: 'italic',
        }}>
          {r.ai_summary || ''}
        </p>
      </div>
    </div>
  );
}

// Mocks removed