import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { sendEmail, sendReportEmail, getEmailTemplates, getEmailHistory } from '../api/client';
import { useApp } from '../context/AppContext';
import { Spinner } from '../components/ui/Loader';

const TEMPLATES = [
  {
    id: 'pass',
    label: 'Move Forward',
    color: 'var(--teal)',
    subject: 'Interview Follow-Up – Next Steps',
    body: `Dear [Candidate Name],

Thank you for taking the time to interview with us for the [Position] role. We were impressed by your background and would like to move forward in the process.

Our team will be in touch shortly with next steps.

Best regards,
[Your Name]`,
  },
  {
    id: 'reject',
    label: 'Rejection',
    color: 'var(--red)',
    subject: 'Your Application – [Position]',
    body: `Dear [Candidate Name],

Thank you for interviewing with us for the [Position] role. After careful consideration, we have decided to move forward with other candidates whose experience more closely matches our current needs.

We appreciate your time and wish you success in your job search.

Best regards,
[Your Name]`,
  },
  {
    id: 'waitlist',
    label: 'Hold/Waitlist',
    color: 'var(--amber)',
    subject: 'Interview Update – [Position]',
    body: `Dear [Candidate Name],

Thank you for interviewing for the [Position] role. We are still in the process of reviewing all candidates and will be in touch with a final decision within [timeframe].

We appreciate your patience.

Best regards,
[Your Name]`,
  },
  {
    id: 'report',
    label: 'Send Report',
    color: 'var(--blue)',
    subject: 'Interview Analysis Report – [Candidate]',
    body: `Dear [Recipient],

Please find attached the AI-generated interview analysis report for [Candidate Name].

The report includes:
• Overall score and dimension breakdown
• Emotion and engagement metrics
• Audio analysis (pace, volume, filler words)
• Key findings and recommendations

Please let me know if you have any questions.

Best regards,
[Your Name]`,
  },
];

function HistoryItem({ item }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14,
      padding: '14px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        width: 32, height: 32,
        background: 'var(--bg-elevated)',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, flexShrink: 0,
        color: item.status === 'sent' ? 'var(--teal)' : 'var(--red)',
        border: `1px solid ${item.status === 'sent' ? 'rgba(0,201,167,0.3)' : 'rgba(255,77,109,0.3)'}`,
      }}>
        {item.status === 'sent' ? '✓' : '✕'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>{item.to}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.subject}</div>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
        {item.sent_at ? new Date(item.sent_at).toLocaleDateString() : '—'}
      </div>
    </div>
  );
}

export default function Email() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { activeSession, addToast } = useApp();

  const querySession = new URLSearchParams(location.search).get('session');
  const sessionId = querySession || activeSession?.id;

  const [to, setTo]             = useState('');
  const [cc, setCc]             = useState('');
  const [subject, setSubject]   = useState('');
  const [body, setBody]         = useState('');
  const [notes, setNotes]       = useState('');
  const [attachReport, setAttach] = useState(false);
  const [sending, setSending]   = useState(false);
  const [history, setHistory]   = useState([]);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [emailError, setEmailError] = useState('');

  useEffect(() => { fetchHistory(); }, []);

  async function fetchHistory() {
    try {
      const h = await getEmailHistory();
      setHistory(h.history || h || []);
    } catch {
      setHistory(MOCK_HISTORY);
    }
  }

  function applyTemplate(tpl) {
    setActiveTemplate(tpl.id);
    setSubject(tpl.subject);
    setBody(tpl.body);
    if (tpl.id === 'report') setAttach(true);
    setEmailError('');
  }

  function validateEmail(email) {
    if (!email) return { valid: false, error: '' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }
    return { valid: true, error: '' };
  }

  function handleToChange(value) {
    setTo(value);
    const result = validateEmail(value);
    setEmailError(result.error);
  }

  const isFormValid = to && validateEmail(to).valid;

  async function handleSend() {
    if (!to) { addToast('Please enter a recipient email', 'error'); return; }
    if (!subject) { addToast('Please enter a subject line', 'error'); return; }
    setSending(true);
    try {
      if (attachReport && sessionId) {
        await sendReportEmail(sessionId, to, notes);
      } else {
        await sendEmail({ to, cc, subject, body, session_id: sessionId, notes });
      }
      addToast('Email sent successfully', 'success');
      // Add to history
      setHistory((prev) => [{
        id: Date.now(), to, subject, status: 'sent', sent_at: new Date().toISOString(),
      }, ...prev]);
      // Reset
      setTo(''); setCc(''); setSubject(''); setBody(''); setNotes(''); setAttach(false); setActiveTemplate(null);
    } catch (e) {
      addToast(e.message || 'Failed to send email', 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <div className="page-header fade-in">
        <h1 className="page-title">Email</h1>
        <p className="page-subtitle">Send interview results and reports to candidates or hiring managers</p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start', gap: 28 }}>
        {/* Compose */}
        <div>
          {/* Templates */}
          <div className="section-label">Quick Templates</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => applyTemplate(tpl)}
                className="btn btn-sm"
                style={{
                  background: activeTemplate === tpl.id ? `${tpl.color}20` : 'var(--bg-elevated)',
                  color: activeTemplate === tpl.id ? tpl.color : 'var(--text-secondary)',
                  border: `1px solid ${activeTemplate === tpl.id ? tpl.color : 'var(--border)'}`,
                }}
              >
                {tpl.label}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="card fade-in stagger-1">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">To *</label>
                <input
                  className="input"
                  type="email"
                  placeholder="candidate@email.com"
                  value={to}
                  onChange={(e) => handleToChange(e.target.value)}
                />
                {emailError && (
                  <span style={{ color: 'var(--red)', fontSize: 11, marginTop: 4, display: 'block' }}>
                    {emailError}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">CC</label>
                <input
                  className="input"
                  type="email"
                  placeholder="hiring-manager@company.com"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Subject *</label>
                <input
                  className="input"
                  placeholder="Interview Follow-Up"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea
                  className="textarea"
                  placeholder="Compose your message…"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  style={{ minHeight: 200 }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Internal Notes (not sent)</label>
                <input
                  className="input"
                  placeholder="e.g. follow up in 3 days"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Attach report toggle */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                padding: '12px 16px',
                background: attachReport ? 'var(--amber-glow)' : 'var(--bg-elevated)',
                border: `1px solid ${attachReport ? 'rgba(245,166,35,0.3)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
                transition: 'var(--transition)',
              }}>
                <div style={{
                  width: 18, height: 18,
                  borderRadius: 4,
                  border: `2px solid ${attachReport ? 'var(--amber)' : 'var(--border-accent)'}`,
                  background: attachReport ? 'var(--amber)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'var(--transition)',
                }}>
                  {attachReport && <span style={{ fontSize: 10, color: '#0d0e10', fontWeight: 700 }}>✓</span>}
                </div>
                <input
                  type="checkbox"
                  checked={attachReport}
                  onChange={(e) => setAttach(e.target.checked)}
                  style={{ display: 'none' }}
                />
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                    Attach Analysis Report
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {sessionId ? `Session: ${sessionId?.slice(0, 8)}…` : 'No active session'}
                  </div>
                </div>
              </label>

              <button
                className="btn btn-primary btn-lg w-full"
                onClick={handleSend}
                disabled={sending || !isFormValid}
                style={{ justifyContent: 'center' }}
              >
                {sending ? <><Spinner size="sm" color="#0d0e10" /> Sending…</> : '◻ Send Email'}
              </button>
            </div>
          </div>
        </div>

        {/* History */}
        <div>
          <div className="section-label">Sent History</div>
          <div className="card fade-in stagger-2" style={{ padding: '0 24px' }}>
            {history.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                No emails sent yet
              </div>
            ) : (
              history.map((item) => <HistoryItem key={item.id} item={item} />)
            )}
          </div>

          {/* Session context */}
          {sessionId && (
            <div className="card mt-20 fade-in stagger-3" style={{ marginTop: 20 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10 }}>
                Linked Session
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: 'var(--teal)' }}>●</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-primary)' }}>
                  {sessionId}
                </span>
              </div>
              <button
                className="btn btn-ghost btn-sm mt-8"
                style={{ marginTop: 8, padding: '4px 0', color: 'var(--amber)' }}
                onClick={() => navigate(`/report/${sessionId}`)}
              >
                View Report →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Mock data ─────────────────────────────────────────────────
const MOCK_HISTORY = [
  { id: 1, to: 'john.doe@email.com',    subject: 'Interview Follow-Up – Next Steps',   status: 'sent',   sent_at: '2025-04-10' },
  { id: 2, to: 'jane.smith@email.com',  subject: 'Your Application – SWE Role',        status: 'sent',   sent_at: '2025-04-09' },
  { id: 3, to: 'mike.jones@email.com',  subject: 'Interview Analysis Report',          status: 'failed', sent_at: '2025-04-09' },
  { id: 4, to: 'sara.lee@email.com',    subject: 'Congratulations – Offer Extended',   status: 'sent',   sent_at: '2025-04-08' },
];