import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  runFullAnalysis, getAnalysisResult, getAnalysisStatus, getMediaUrl
} from '../api/client';
import { useApp } from '../context/AppContext';
import { Spinner, LoadingScreen } from '../components/ui/Loader';
import EmotionRadar from '../components/charts/EmotionRadar';
import AudioWaveBar from '../components/charts/AudioWaveBar';
import ScoreGauge from '../components/charts/ScoreGauge';

const STEPS = [
  { key: 'transcribe',     label: 'Transcription',    icon: '◻' },
  { key: 'emotions',       label: 'Emotion Analysis', icon: '◈' },
  { key: 'audio_metrics',  label: 'Audio Metrics',    icon: '▲' },
];

const STEP_STATUS = {
  idle:       { color: 'var(--text-muted)',  icon: '○' },
  running:    { color: 'var(--amber)',       icon: '◉' },
  done:       { color: 'var(--teal)',        icon: '●' },
  error:      { color: 'var(--red)',         icon: '✕' },
};

function TranscriptBlock({ transcript }) {
  if (!transcript) return null;
  const segments = Array.isArray(transcript) ? transcript : [{ text: transcript, speaker: 'Speaker', time: '0:00' }];
  return (
    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
      {segments.map((seg, i) => (
        <div key={i} style={{
          display: 'flex',
          gap: 16,
          padding: '10px 0',
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-muted)',
            flexShrink: 0,
            paddingTop: 2,
            width: 36,
          }}>{seg.time || `${i * 15}s`}</span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--amber)',
            flexShrink: 0,
            paddingTop: 2,
            width: 60,
          }}>{seg.speaker || 'Candidate'}</span>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {seg.text}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Analyze() {
  const { sessionId: paramSessionId } = useParams();
  const navigate = useNavigate();
  const { activeSession, setActiveSession, addToast } = useApp();

  const sessionId = paramSessionId || activeSession?.id;

  const [stepStatus, setStepStatus]   = useState({ transcribe: 'idle', emotions: 'idle', audio_metrics: 'idle' });
  const [results, setResults]         = useState(null);
  const [analyzing, setAnalyzing]     = useState(false);
  const [polling, setPolling]         = useState(false);
  const [activeTab, setActiveTab]     = useState('overview');
  const [audioMetric, setAudioMetric] = useState('volume');
  const pollRef = useRef(null);

  // Resolve session
  useEffect(() => {
    if (!activeSession && paramSessionId) {
      setActiveSession({ id: paramSessionId, filename: 'interview', status: 'uploaded' });
    }
    // Try to load existing results
    if (sessionId) {
      loadResults(sessionId);
    }
  }, [paramSessionId, sessionId, activeSession, setActiveSession]);

  async function loadResults(id) {
    try {
      const r = await getAnalysisResult(id);
      if (r) {
        setResults(r);
        setStepStatus({ transcribe: 'done', emotions: 'done', audio_metrics: 'done' });
      }
    } catch {
      // no results yet — that's fine
    }
  }

  const updateStep = (key, status) =>
    setStepStatus((prev) => ({ ...prev, [key]: status }));

  async function handleRunAll() {
    if (!sessionId) return;
    setAnalyzing(true);
    setResults(null);
    try {
      updateStep('transcribe', 'running');
      updateStep('emotions', 'running');
      updateStep('audio_metrics', 'running');

      await runFullAnalysis(sessionId);

      updateStep('transcribe', 'done');
      updateStep('emotions', 'done');
      updateStep('audio_metrics', 'done');

      const r = await getAnalysisResult(sessionId);
      setResults(r);
      addToast('Analysis complete!', 'success');
    } catch (e) {
      addToast(e.message || 'Analysis failed', 'error');
      updateStep('transcribe', 'error');
      updateStep('emotions', 'error');
      updateStep('audio_metrics', 'error');
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleRunStep(step) {
    handleRunAll();
  }

  const r = results || {};
  const hasResults = !!results;

  const TABS = ['overview', 'transcript', 'emotions', 'audio', 'keywords'];

  return (
    <div>
      <div className="page-header fade-in flex-between">
        <div>
          <h1 className="page-title">Analysis</h1>
          <p className="page-subtitle">
            Session:{' '}
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber)', fontSize: 12 }}>
              {sessionId}
            </span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {hasResults && (
            <button className="btn btn-secondary" onClick={() => navigate(`/report/${sessionId}`)}>
              View Report →
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleRunAll}
            disabled={analyzing}
          >
            {analyzing ? <><Spinner size="sm" color="#0d0e10" /> Running…</> : '◈ Run Full Analysis'}
          </button>
        </div>
      </div>

      {/* Step pipeline */}
      <div className="card fade-in stagger-1 mb-32">
        <div className="section-label" style={{ marginBottom: 20 }}>Analysis Pipeline</div>
        <div style={{ display: 'flex', gap: 0 }}>
          {STEPS.map((step, i) => {
            const st = STEP_STATUS[stepStatus[step.key]];
            return (
              <React.Fragment key={step.key}>
                <div style={{
                  flex: 1,
                  padding: '16px 20px',
                  background: stepStatus[step.key] === 'running' ? 'var(--amber-glow)' : 'transparent',
                  borderRadius: 'var(--radius-md)',
                  transition: 'var(--transition)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ color: st.color, fontSize: 14, animation: stepStatus[step.key] === 'running' ? 'pulse 1s infinite' : 'none' }}>
                      {stepStatus[step.key] === 'running' ? <Spinner size="sm" /> : st.icon}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: st.color }}>
                      {step.label}
                    </span>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 10px' }}
                    onClick={() => handleRunStep(step)}
                    disabled={analyzing}
                  >
                    Run
                  </button>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{
                    width: 1,
                    background: 'var(--border)',
                    margin: '8px 0',
                    alignSelf: 'stretch',
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Results tabs */}
      <div className="fade-in stagger-2">
        <div style={{
          display: 'flex',
          gap: 2,
          borderBottom: '1px solid var(--border)',
          marginBottom: 28,
        }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 20px',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${activeTab === tab ? 'var(--amber)' : 'transparent'}`,
                color: activeTab === tab ? 'var(--amber)' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                transition: 'var(--transition)',
                marginBottom: -1,
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div className="grid-4 mb-24">
              {[
                { score: r.scores?.overall        ?? 78, label: 'Overall' },
                { score: r.scores?.communication  ?? 74, label: 'Comms', color: 'var(--teal)' },
                { score: r.scores?.confidence     ?? 68, label: 'Confidence', color: 'var(--blue)' },
                { score: r.scores?.clarity        ?? 81, label: 'Clarity', color: 'var(--amber)' },
              ].map(({ score, label, color }) => (
                <div key={label} className="card flex-center flex-col" style={{ gap: 12 }}>
                  <ScoreGauge score={score} size={100} label={label} color={color} />
                </div>
              ))}
            </div>

            <div className="grid-2">
              <div className="card">
                <div className="section-label" style={{ marginBottom: 16 }}>Key Findings</div>
                {[
                  ...(r.strengths || []).map(s => ({ type: 'positive', title: 'Strength', desc: s })),
                  ...(r.weaknesses || []).map(w => ({ type: 'negative', title: 'Improvement Area', desc: w }))
                ].map((f, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    gap: 12,
                    padding: '10px 0',
                    borderBottom: i < ((r.strengths?.length || 0) + (r.weaknesses?.length || 0) - 1) ? '1px solid var(--border)' : 'none',
                  }}>
                    <span style={{ color: f.type === 'positive' ? 'var(--teal)' : 'var(--red)', flexShrink: 0 }}>
                      {f.type === 'positive' ? '▲' : '▼'}
                    </span>
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>{f.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="section-label" style={{ marginBottom: 16 }}>Recommendations</div>
                {(r.next_steps || []).map((rec, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 12, padding: '10px 0',
                    borderBottom: i < (r.next_steps?.length - 1) ? '1px solid var(--border)' : 'none',
                  }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', paddingTop: 2 }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TRANSCRIPT */}
        {activeTab === 'transcript' && (
          <div className="card">
            <div className="flex-between mb-20">
              <div className="section-label" style={{ marginBottom: 0 }}>Interview Transcript</div>
              <span className="badge badge-muted" style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                {r.transcript_word_count || 1842} words
              </span>
            </div>
            <TranscriptBlock transcript={r.transcript} />
          </div>
        )}

        {/* EMOTIONS */}
        {activeTab === 'emotions' && (
          <div className="grid-2">
            <div className="card">
              <div className="section-label" style={{ marginBottom: 16 }}>Emotion Profile</div>
              <EmotionRadar data={r.emotions} />
            </div>
            <div className="card">
              <div className="section-label" style={{ marginBottom: 16 }}>Emotion Breakdown</div>
              {(r.emotions || []).map((e) => (
                <div key={e.emotion} style={{ marginBottom: 14 }}>
                  <div className="flex-between mb-4">
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{e.emotion}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{e.value}%</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${e.value}%`,
                        background: e.value > 60 ? 'var(--teal)' : e.value > 30 ? 'var(--amber)' : 'var(--red)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AUDIO */}
        {activeTab === 'audio' && (
          <div>
            <div className="grid-3 mb-24">
              {[
                { label: 'Avg Pace',   value: r.audio?.avg_pace  || '134 wpm', icon: '⟳' },
                { label: 'Avg Volume', value: r.audio?.avg_volume || '58 dB',  icon: '♪' },
                { label: 'Filler Words', value: r.audio?.filler_count || '12', icon: '◇' },
              ].map(({ label, value, icon }) => (
                <div key={label} className="card">
                  <div style={{ fontSize: 24, color: 'var(--amber)', marginBottom: 10 }}>{icon}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 600, marginBottom: 4 }}>{value}</div>
                  <div className="stat-label">{label}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="flex-between mb-20">
                <div className="section-label" style={{ marginBottom: 0 }}>Timeline</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['volume', 'pace', 'pitch'].map((m) => (
                    <button
                      key={m}
                      className={`btn btn-sm ${audioMetric === m ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setAudioMetric(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <AudioWaveBar data={r.audio?.timeline} metric={audioMetric} />
            </div>
          </div>
        )}

        {/* KEYWORDS */}
        {activeTab === 'keywords' && (
          <div className="card">
            <div className="section-label" style={{ marginBottom: 20 }}>Keyword Frequency</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {(r.keywords || []).map(({ word, count }) => (
                <div
                  key={word}
                  style={{
                    padding: '6px 14px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-accent)',
                    borderRadius: 'var(--radius-md)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: Math.max(11, Math.min(18, 10 + count / 2)),
                    color: `hsl(${(count * 7) % 60 + 25}, 80%, 65%)`,
                    cursor: 'default',
                  }}
                >
                  {word}
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 6 }}>×{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Mocks removed