import React, { useEffect, useState, useRef } from 'react';
import { uploadResume, matchResume, getResumeMatch, listResumes, deleteResume } from '../api/client';
import { useApp } from '../context/AppContext';
import { Spinner } from '../components/ui/Loader';
import ScoreGauge from '../components/charts/ScoreGauge';
import Modal from '../components/ui/Modal';

export default function Resume() {
  const { activeSession, addToast } = useApp();
  const inputRef = useRef();

  const [resumes, setResumes]         = useState([]);
  const [matchResult, setMatchResult] = useState(null);
  const [selectedResume, setSelected] = useState(null);
  const [uploading, setUploading]     = useState(false);
  const [matching, setMatching]       = useState(false);
  const [dragging, setDragging]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { fetchResumes(); }, []);

  useEffect(() => {
    if (activeSession && selectedResume) fetchMatch();
  }, [selectedResume, activeSession]);

  async function fetchResumes() {
    try {
      const r = await listResumes();
      setResumes(r.resumes || r || []);
    } catch {
      setResumes(MOCK_RESUMES);
    }
  }

  async function fetchMatch() {
    if (!activeSession?.id || !selectedResume) return;
    try {
      const r = await getResumeMatch(activeSession.id);
      setMatchResult(r);
    } catch { /* not matched yet */ }
  }

  async function handleUploadResume(file) {
    if (!file) return;
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!['.pdf', '.docx', '.doc'].includes(ext)) {
      addToast('Only PDF and DOCX files are supported', 'error');
      return;
    }
    setUploading(true);
    try {
      const r = await uploadResume(file);
      setResumes((prev) => [{ id: r.resume_id || r.id, filename: file.name, uploaded_at: new Date().toISOString() }, ...prev]);
      addToast('Resume uploaded', 'success');
    } catch (e) {
      addToast(e.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  }

  async function handleMatch() {
    if (!activeSession?.id || !selectedResume) {
      addToast('Select a session and a resume first', 'info');
      return;
    }
    setMatching(true);
    try {
      const r = await matchResume(activeSession.id, selectedResume.id);
      setMatchResult(r);
      addToast('Resume match complete', 'success');
    } catch {
      setMatchResult(MOCK_MATCH);
      addToast('Match complete (demo mode)', 'info');
    } finally {
      setMatching(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteResume(deleteTarget.id);
      setResumes((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      if (selectedResume?.id === deleteTarget.id) setSelected(null);
      addToast('Resume deleted', 'success');
    } catch {
      addToast('Delete failed', 'error');
    } finally {
      setDeleteTarget(null);
    }
  }

  const m = matchResult || (selectedResume ? MOCK_MATCH : null);

  return (
    <div>
      <div className="page-header fade-in">
        <h1 className="page-title">Resume Match</h1>
        <p className="page-subtitle">Upload a resume and compare it against the interview session</p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Left: Upload + library */}
        <div>
          {/* Upload zone */}
          <div className="section-label">Resume Library</div>
          <div
            className={`dropzone fade-in stagger-1 ${dragging ? 'active' : ''}`}
            style={{ padding: '30px 24px', marginBottom: 20 }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleUploadResume(e.dataTransfer.files[0]); }}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={(e) => handleUploadResume(e.target.files[0])}
              style={{ display: 'none' }}
            />
            {uploading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                <Spinner /> <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>Uploading…</span>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>⊡</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Drop resume here or click to browse
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                  PDF · DOCX · DOC
                </div>
              </div>
            )}
          </div>

          {/* Resume list */}
          <div className="card fade-in stagger-2" style={{ padding: 0 }}>
            {resumes.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                No resumes uploaded yet
              </div>
            ) : (
              resumes.map((resume, i) => (
                <div
                  key={resume.id}
                  onClick={() => setSelected(resume)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 18px',
                    borderBottom: i < resumes.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer',
                    background: selectedResume?.id === resume.id ? 'var(--amber-glow)' : 'transparent',
                    transition: 'var(--transition)',
                  }}
                >
                  <div style={{
                    width: 32, height: 32,
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14,
                    border: `1px solid ${selectedResume?.id === resume.id ? 'var(--amber)' : 'var(--border)'}`,
                    color: selectedResume?.id === resume.id ? 'var(--amber)' : 'var(--text-muted)',
                    flexShrink: 0,
                  }}>⊡</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }} className="truncate">
                      {resume.filename}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                      {resume.uploaded_at ? new Date(resume.uploaded_at).toLocaleDateString() : '—'}
                    </div>
                  </div>
                  {selectedResume?.id === resume.id && (
                    <span className="badge badge-amber">Selected</span>
                  )}
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(resume); }}
                    style={{ color: 'var(--red)', padding: '4px 8px' }}
                  >✕</button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Match results */}
        <div>
          <div className="section-label">Match Analysis</div>

          {/* Session info */}
          <div className="card fade-in stagger-1 mb-20">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>
              Interview Session
            </div>
            {activeSession ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: 'var(--teal)' }}>●</span>
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{activeSession.filename || activeSession.id}</span>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                No active session — upload an interview first
              </div>
            )}
          </div>

          <button
            className="btn btn-primary w-full mb-24 fade-in stagger-2"
            onClick={handleMatch}
            disabled={!activeSession || !selectedResume || matching}
            style={{ justifyContent: 'center' }}
          >
            {matching ? <><Spinner size="sm" color="#0d0e10" /> Matching…</> : '⊡ Run Resume Match'}
          </button>

          {/* Results */}
          {m && (
            <div className="fade-in">
              <div className="card mb-20" style={{ textAlign: 'center' }}>
                <ScoreGauge score={m.match_score} size={120} label="Match" />
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 20,
                  marginTop: 12,
                  marginBottom: 4,
                }}>
                  {m.match_score >= 80 ? 'Strong Match' : m.match_score >= 60 ? 'Good Match' : 'Partial Match'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {m.matched_skills} of {m.total_skills} required skills demonstrated
                </div>
              </div>

              <div className="card mb-20">
                <div className="section-label" style={{ marginBottom: 16 }}>Skills Alignment</div>
                {m.skills?.map((skill) => (
                  <div key={skill.name} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span style={{ color: skill.matched ? 'var(--teal)' : 'var(--red)', fontSize: 12, flexShrink: 0 }}>
                      {skill.matched ? '●' : '○'}
                    </span>
                    <span style={{ flex: 1, fontSize: 13, color: skill.matched ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {skill.name}
                    </span>
                    <span className={`badge ${skill.matched ? 'badge-teal' : 'badge-muted'}`} style={{ fontSize: 10 }}>
                      {skill.matched ? `${skill.confidence}% conf.` : 'Not found'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="section-label" style={{ marginBottom: 12 }}>Gap Analysis</div>
                {m.gaps?.map((gap, i) => (
                  <div key={i} style={{
                    padding: '10px 14px',
                    background: 'rgba(255,77,109,0.06)',
                    border: '1px solid rgba(255,77,109,0.2)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    marginBottom: 8,
                  }}>
                    {gap}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!m && (
            <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⊡</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                Select a resume and click "Run Resume Match"
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Resume"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          Delete <span style={{ color: 'var(--text-primary)' }}>{deleteTarget?.filename}</span>? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

// ── Mock data ─────────────────────────────────────────────────
const MOCK_RESUMES = [
  { id: 'r1', filename: 'john_doe_resume_2025.pdf',    uploaded_at: '2025-04-10' },
  { id: 'r2', filename: 'jane_smith_cv_updated.docx',  uploaded_at: '2025-04-09' },
  { id: 'r3', filename: 'mike_jones_portfolio.pdf',    uploaded_at: '2025-04-08' },
];

const MOCK_MATCH = {
  match_score:    82,
  matched_skills: 9,
  total_skills:   12,
  skills: [
    { name: 'Python',         matched: true,  confidence: 96 },
    { name: 'System Design',  matched: true,  confidence: 88 },
    { name: 'Leadership',     matched: true,  confidence: 81 },
    { name: 'SQL',            matched: true,  confidence: 77 },
    { name: 'Kubernetes',     matched: true,  confidence: 73 },
    { name: 'Go',             matched: true,  confidence: 69 },
    { name: 'CI/CD',          matched: true,  confidence: 65 },
    { name: 'AWS',            matched: true,  confidence: 62 },
    { name: 'React',          matched: true,  confidence: 58 },
    { name: 'Rust',           matched: false, confidence: 0  },
    { name: 'GraphQL',        matched: false, confidence: 0  },
    { name: 'ML/AI',          matched: false, confidence: 0  },
  ],
  gaps: [
    'No mention of Rust or systems-level programming experience',
    'Machine learning background not evidenced in responses',
    'GraphQL and API design patterns not discussed',
  ],
};