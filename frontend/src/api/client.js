import axios from 'axios';

// ── Axios Instance ────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  timeout: 120000,
});

// ── Request interceptor ───────────────────────────────────────
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// ── Response interceptor ──────────────────────────────────────
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// ─────────────────────────────────────────────────────────────
//  UPLOAD  ·  POST /api/upload/
//  Backend: routes/upload.py  →  @router.post("/")
//  Returns: { session_id, filename, file_path, message }
// ─────────────────────────────────────────────────────────────
export const uploadVideo = (file, onProgress) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/api/upload/', form, {
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
};

export const uploadAudio = (file, onProgress) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/api/upload/', form, {
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
};

// ─────────────────────────────────────────────────────────────
//  ANALYZE  ·  POST /api/analyze/
//  Backend: routes/analyze.py  →  @router.post("/")
//  Body:    { session_id, job_role, experience_level }
//  Returns: { session_id, status, summary, message }
// ─────────────────────────────────────────────────────────────
export const runFullAnalysis = (sessionId, jobRole = 'Software Engineer', experienceLevel = 'mid') =>
  api.post('/api/analyze/', {
    session_id:       sessionId,
    job_role:         jobRole,
    experience_level: experienceLevel,
  });

// Removed separate step aliases since backend runs full pipeline.
export const getMediaUrl = (sessionId) => `${api.defaults.baseURL}/api/upload/${sessionId}/media`;

// GET /api/analyze/ has no GET — report lives at /api/dashboard/{session_id}
export const getAnalysisResult = (sessionId) =>
  api.get(`/api/dashboard/${sessionId}`).then((r) => r.report ?? r);

export const getAnalysisStatus = (sessionId) =>
  api.get(`/api/dashboard/${sessionId}`);

// ─────────────────────────────────────────────────────────────
//  DASHBOARD  ·  GET /api/dashboard/
//  Backend: routes/dashboard.py
//  GET /           → { sessions, count }
//  GET /{id}       → { session_id, report }
//  DELETE /{id}    → { message }
// ─────────────────────────────────────────────────────────────
export const getDashboardSessions = () =>
  api.get('/api/dashboard/');

// Dashboard has no /stats endpoint — derive from session list
export const getDashboardStats = async () => {
  const data = await api.get('/api/dashboard/');
  const sessions = data.sessions || [];
  const completed = sessions.filter((s) => s.status === 'completed');
  const avgScore = completed.length
    ? Math.round(completed.reduce((sum, s) => sum + (s.overall_score || 0), 0) / completed.length)
    : 0;
  return {
    total_sessions:   sessions.length,
    completed_today:  completed.length,
    avg_score:        avgScore,
    pending_analyses: sessions.length - completed.length,
  };
};

export const getSession = (sessionId) =>
  api.get(`/api/dashboard/${sessionId}`);

export const deleteSession = (sessionId) =>
  api.delete(`/api/dashboard/${sessionId}`);

// ─────────────────────────────────────────────────────────────
//  REPORT  ·  GET /api/dashboard/{session_id}
//  Backend has no /report prefix — reports live under /dashboard
// ─────────────────────────────────────────────────────────────
export const getReport = (sessionId) =>
  api.get(`/api/dashboard/${sessionId}`).then((r) => r.report ?? r);

// These endpoints don't exist on the backend — graceful no-ops
export const exportReportPdf = () =>
  Promise.reject(new Error('PDF export not available'));

export const regenerateReport = (sessionId) =>
  runFullAnalysis(sessionId);

// ─────────────────────────────────────────────────────────────
//  EMAIL  ·  POST /api/email/send
//  Backend: routes/email.py  →  @router.post("/send")
//  Body:    { session_id, to_email, candidate_name }
//  Returns: { success, message }
// ─────────────────────────────────────────────────────────────
export const sendReportEmail = (sessionId, toEmail, candidateName = 'Candidate') =>
  api.post('/api/email/send', {
    session_id:     sessionId,
    to_email:       toEmail,
    candidate_name: candidateName,
  });

// Generic sendEmail maps to the same endpoint
export const sendEmail = ({ session_id, to, candidate_name }) =>
  api.post('/api/email/send', {
    session_id,
    to_email:       to,
    candidate_name: candidate_name || 'Candidate',
  });

// These don't exist on the backend — return empty stubs
export const getEmailTemplates = () => Promise.resolve([]);
export const getEmailHistory   = () => Promise.resolve({ history: [] });

// ─────────────────────────────────────────────────────────────
//  RESUME  ·  POST /api/resume/upload-and-match
//  Backend: routes/resume.py
//  POST /upload-and-match  → { resume_id, job_role, match_score,
//                              matched_skills, missing_skills, recommendations }
//  POST /match-with-session
// ─────────────────────────────────────────────────────────────
export const uploadResume = (file, jobRole = 'Software Engineer', jobDescription = '') => {
  const form = new FormData();
  form.append('file', file);
  form.append('job_role', jobRole);
  form.append('job_description', jobDescription);
  return api.post('/api/resume/upload-and-match', form);
};

export const matchResume = (sessionId, resumeIdOrFile, jobRole = 'Software Engineer') => {
  const form = new FormData();
  if (typeof resumeIdOrFile === 'string') {
    form.append('resume_id', resumeIdOrFile);
  } else {
    form.append('resume_file', resumeIdOrFile);
  }
  form.append('session_id', sessionId);
  form.append('job_role', jobRole);
  return api.post('/api/resume/match-with-session', form);
};

// These don't exist on the backend — stub responses
export const getResumeMatch = () => Promise.resolve(null);
export const listResumes    = () => Promise.resolve({ resumes: [] });
export const deleteResume   = () => Promise.resolve({ message: 'ok' });

export default api;