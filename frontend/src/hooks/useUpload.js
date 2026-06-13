import { useState, useCallback } from 'react';
import { uploadVideo, uploadAudio } from '../api/client';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const ACCEPTED = {
  video: ['.mp4', '.mov', '.avi', '.webm', '.mkv'],
  audio: ['.mp3', '.wav', '.m4a', '.ogg', '.flac'],
};

const MAX_SIZE_MB = 500;

export function useUpload() {
  const navigate = useNavigate();
  const { setActiveSession, addToast } = useApp();

  const [file, setFile]           = useState(null);
  const [fileType, setFileType]   = useState('video');
  const [progress, setProgress]   = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');
  const [dragging, setDragging]   = useState(false);

  const validateFile = useCallback(
    (f, type = fileType) => {
      const exts = ACCEPTED[type];
      const ext  = '.' + f.name.split('.').pop().toLowerCase();
      if (!exts.includes(ext))
        return `Unsupported format. Allowed: ${exts.join(', ')}`;
      if (f.size > MAX_SIZE_MB * 1024 * 1024)
        return `File too large. Max size: ${MAX_SIZE_MB}MB`;
      return null;
    },
    [fileType]
  );

  const handleFile = useCallback(
    (f) => {
      setError('');
      const err = validateFile(f);
      if (err) { setError(err); return; }
      setFile(f);
    },
    [validateFile]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragging(false), []);

  const handleInputChange = useCallback(
    (e) => {
      const f = e.target.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const changeFileType = useCallback((type) => {
    setFileType(type);
    setFile(null);
    setError('');
  }, []);

  const clearFile = useCallback(() => {
    setFile(null);
    setError('');
    setProgress(0);
  }, []);

  const upload = useCallback(async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError('');
    try {
      const fn     = fileType === 'video' ? uploadVideo : uploadAudio;
      const result = await fn(file, setProgress);
      const session = {
        id:        result.session_id || result.id,
        filename:  file.name,
        status:    'uploaded',
        fileType,
        size:      file.size,
        createdAt: new Date().toISOString(),
      };
      setActiveSession(session);
      addToast('Upload successful! Ready to analyze.', 'success');
      navigate(`/analyze/${session.id}`);
      return session;
    } catch (e) {
      const msg = e.message || 'Upload failed';
      setError(msg);
      addToast(msg, 'error');
      throw e;
    } finally {
      setUploading(false);
    }
  }, [file, fileType, setActiveSession, addToast, navigate]);

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return {
    // State
    file,
    fileType,
    progress,
    uploading,
    error,
    dragging,
    // Derived
    accepted: ACCEPTED[fileType],
    fileSizeLabel: file ? formatSize(file.size) : '',
    // Handlers
    handleFile,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleInputChange,
    changeFileType,
    clearFile,
    upload,
  };
}