import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadVideo, uploadAudio } from '../api/client';
import { useApp } from '../context/AppContext';
import { Spinner } from '../components/ui/Loader';

const ACCEPTED = {
  video: ['.mp4', '.mov', '.avi', '.webm', '.mkv'],
  audio: ['.mp3', '.wav', '.m4a', '.ogg', '.flac'],
};

const MAX_SIZE_MB = 500;

function FileTypeToggle({ value, onChange }) {
  return (
    <div style={{
      display: 'inline-flex',
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: 3,
      gap: 2,
    }}>
      {['video', 'audio'].map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            padding: '7px 20px',
            borderRadius: 6,
            border: 'none',
            background: value === t ? 'var(--amber)' : 'transparent',
            color: value === t ? '#0d0e10' : 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            cursor: 'pointer',
            transition: 'var(--transition)',
            fontWeight: value === t ? 600 : 400,
          }}
        >
          {t === 'video' ? '▶ Video' : '♪ Audio'}
        </button>
      ))}
    </div>
  );
}

function UploadProgress({ pct, filename }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 48,
        fontWeight: 600,
        color: 'var(--amber)',
        lineHeight: 1,
        marginBottom: 8,
      }}>{pct}%</div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
        Uploading <span style={{ color: 'var(--text-primary)' }}>{filename}</span>
      </div>
      <div className="progress-track" style={{ height: 6, maxWidth: 320, margin: '0 auto' }}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--text-muted)',
        marginTop: 12,
        animation: 'pulse 1.5s infinite',
      }}>
        Do not close this window…
      </div>
    </div>
  );
}

export default function Upload() {
  const navigate = useNavigate();
  const { setActiveSession, addToast } = useApp();

  const [fileType, setFileType] = useState('video');
  const [dragging, setDragging] = useState(false);
  const [file, setFile]         = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState('');

  const inputRef = useRef();

  const validateFile = (f) => {
    const exts = ACCEPTED[fileType];
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!exts.includes(ext)) {
      return `Unsupported format. Allowed: ${exts.join(', ')}`;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File too large. Max size: ${MAX_SIZE_MB}MB`;
    }
    return null;
  };

  const handleFile = useCallback((f) => {
    setError('');
    const err = validateFile(f);
    if (err) { setError(err); return; }
    setFile(f);
  }, [fileType]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const onInputChange = (e) => {
    const f = e.target.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      const fn = fileType === 'video' ? uploadVideo : uploadAudio;
      const result = await fn(file, setProgress);
      const session = {
        id:       result.session_id || result.id,
        filename: file.name,
        status:   'uploaded',
        fileType,
        size:     file.size,
        createdAt: new Date().toISOString(),
      };
      setActiveSession(session);
      addToast('Upload successful! Ready to analyze.', 'success');
      navigate(`/analyze/${session.id}`);
    } catch (e) {
      addToast(e.message || 'Upload failed', 'error');
      setError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <div className="page-header fade-in">
        <h1 className="page-title">Upload Interview</h1>
        <p className="page-subtitle">Upload a video or audio recording to begin analysis</p>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* File type selector */}
        <div className="flex-center mb-32 fade-in stagger-1">
          <FileTypeToggle value={fileType} onChange={(t) => { setFileType(t); setFile(null); setError(''); }} />
        </div>

        {/* Drop zone */}
        <div
          className={`dropzone fade-in stagger-2 ${dragging ? 'active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !uploading && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".mp3,.wav,.m4a,.aac,.ogg,.flac,.mp4,.mpeg,.webm,.mov,.mkv"
            onChange={onInputChange}
            style={{ display: 'none' }}
          />

          {uploading ? (
            <UploadProgress pct={progress} filename={file?.name} />
          ) : file ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>
                {fileType === 'video' ? '🎬' : '🎙'}
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                color: 'var(--text-primary)',
                marginBottom: 6,
              }}>{file.name}</div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--text-muted)',
                marginBottom: 20,
              }}>{formatSize(file.size)}</div>
              <span className="badge badge-teal">✓ Ready to upload</span>
            </div>
          ) : (
            <div>
              <div className="dropzone-icon">
                {fileType === 'video' ? '▶' : '♪'}
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                color: 'var(--text-primary)',
                marginBottom: 8,
              }}>
                Drop your {fileType} here
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
                or click to browse files
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
              }}>
                {ACCEPTED[fileType].join(' · ')} · max {MAX_SIZE_MB}MB
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginTop: 12,
            padding: '10px 16px',
            background: 'rgba(255,77,109,0.08)',
            border: '1px solid var(--red-dim)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--red)',
          }}>
            ✕ {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
          {file && !uploading && (
            <button
              className="btn btn-secondary"
              onClick={() => { setFile(null); setError(''); }}
            >
              Remove
            </button>
          )}
          <button
            className="btn btn-primary btn-lg"
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? (
              <><Spinner size="sm" color="#0d0e10" /> Uploading…</>
            ) : (
              '↑ Upload & Continue'
            )}
          </button>
        </div>

        {/* Info cards */}
        <div className="grid-2 fade-in stagger-5" style={{ marginTop: 40 }}>
          {[
            { icon: '◈', title: 'AI Transcription',   desc: 'Automatic speech-to-text with speaker diarization' },
            { icon: '◆', title: 'Emotion Detection',  desc: 'Facial and vocal emotion analysis frame-by-frame' },
            { icon: '▲', title: 'Audio Metrics',      desc: 'Pace, volume, pitch and filler word tracking' },
            { icon: '⊡', title: 'Resume Matching',    desc: 'Semantic comparison against job descriptions' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="card card-elevated" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span style={{
                fontSize: 20,
                color: 'var(--amber)',
                marginTop: 2,
                flexShrink: 0,
              }}>{icon}</span>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}