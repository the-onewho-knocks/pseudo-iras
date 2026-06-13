import { useState, useCallback, useRef } from 'react';
import {
  runFullAnalysis,
  transcribeSession,
  analyzeEmotions,
  analyzeAudioMetrics,
  getAnalysisResult,
} from '../api/client';
import { useApp } from '../context/AppContext';

const STEPS = [
  { key: 'transcribe',    label: 'Transcription',    api: transcribeSession },
  { key: 'emotions',      label: 'Emotion Analysis', api: analyzeEmotions },
  { key: 'audio_metrics', label: 'Audio Metrics',    api: analyzeAudioMetrics },
];

const INITIAL_STATUS = { transcribe: 'idle', emotions: 'idle', audio_metrics: 'idle' };

export function useAnalysis(sessionId) {
  const { addToast } = useApp();

  const [stepStatus, setStepStatus] = useState(INITIAL_STATUS);
  const [results, setResults]       = useState(null);
  const [analyzing, setAnalyzing]   = useState(false);
  const [error, setError]           = useState('');
  const pollRef                     = useRef(null);

  const updateStep = useCallback(
    (key, status) => setStepStatus((prev) => ({ ...prev, [key]: status })),
    []
  );

  const loadResults = useCallback(async (id) => {
    try {
      const r = await getAnalysisResult(id || sessionId);
      if (r) {
        setResults(r);
        setStepStatus({ transcribe: 'done', emotions: 'done', audio_metrics: 'done' });
      }
      return r;
    } catch {
      return null;
    }
  }, [sessionId]);

  const runStep = useCallback(async (step) => {
    if (!sessionId) return;
    updateStep(step.key, 'running');
    try {
      await step.api(sessionId);
      updateStep(step.key, 'done');
      addToast(`${step.label} complete`, 'success');
    } catch (e) {
      updateStep(step.key, 'error');
      addToast(`${step.label} failed`, 'error');
      throw e;
    }
  }, [sessionId, updateStep, addToast]);

  const runAll = useCallback(async (jobRole = 'Software Engineer', experienceLevel = 'mid') => {
    if (!sessionId) return;
    setAnalyzing(true);
    setResults(null);
    setError('');
    setStepStatus(INITIAL_STATUS);

    try {
      // Run pipeline steps sequentially for visual progress
      for (const step of STEPS) {
        updateStep(step.key, 'running');
        try {
          await step.api(sessionId);
          updateStep(step.key, 'done');
        } catch {
          updateStep(step.key, 'error');
          addToast(`${step.label} failed`, 'error');
        }
      }

      // Fetch consolidated result from backend
      const r = await getAnalysisResult(sessionId);
      setResults(r);
      addToast('Analysis complete!', 'success');
      return r;
    } catch (e) {
      const msg = e.message || 'Analysis failed';
      setError(msg);
      addToast(msg, 'error');
      throw e;
    } finally {
      setAnalyzing(false);
    }
  }, [sessionId, updateStep, addToast]);

  const reset = useCallback(() => {
    setStepStatus(INITIAL_STATUS);
    setResults(null);
    setError('');
    setAnalyzing(false);
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  // Normalise the backend report shape into the shape pages expect
  const normaliseResults = useCallback((raw) => {
    if (!raw) return null;
    const ai    = raw.ai_scores   || {};
    const audio = raw.audio_metrics || {};
    const emo   = raw.emotions?.emotion_profile || {};

    return {
      // Scores used by ScoreGauge / overview
      scores: {
        overall:       ai.overall_score          ?? raw.overall_score ?? 0,
        communication: ai.scores?.communication_clarity ?? 0,
        confidence:    ai.scores?.confidence             ?? 0,
        clarity:       ai.scores?.conciseness            ?? 0,
        engagement:    ai.scores?.relevance_of_answers   ?? 0,
      },
      // Transcript
      transcript:           raw.transcript || '',
      transcript_word_count: audio.word_count || 0,
      // Emotions for radar
      emotions: [
        { emotion: 'Confident', value: emo.overall_confidence_signal === 'high' ? 80 : emo.overall_confidence_signal === 'medium' ? 55 : 30 },
        { emotion: 'Engaged',   value: 65 },
        { emotion: 'Positive',  value: 60 },
        { emotion: 'Calm',      value: emo.energy_level === 'low' ? 75 : 45 },
        { emotion: 'Neutral',   value: emo.primary_emotion === 'neutral' ? 70 : 35 },
        { emotion: 'Nervous',   value: emo.overall_confidence_signal === 'low' ? 65 : 20 },
      ],
      // Audio stats
      audio: {
        avg_pace:    audio.speech_pace_wpm ? `${Math.round(audio.speech_pace_wpm)} wpm` : '—',
        avg_volume:  '—',
        filler_count: audio.filler_word_analysis?.total_filler_words ?? 0,
        timeline:    null,
      },
      // AI findings
      findings: [
        ...(ai.strengths || []).map((s) => ({ type: 'positive', title: s, desc: '' })),
        ...(ai.weaknesses || []).map((w) => ({ type: 'negative', title: w, desc: '' })),
      ],
      recommendations: ai.improvement_tips || [],
      // Keywords from vocabulary
      keywords: Object.entries(audio.vocabulary_diversity?.top_10_words || {})
        .map(([word, count]) => ({ word, count })),
      // Raw
      _raw: raw,
    };
  }, []);

  return {
    stepStatus,
    results,
    normalisedResults: normaliseResults(results),
    analyzing,
    error,
    steps: STEPS,
    loadResults,
    runStep: (stepKey) => {
      const step = STEPS.find((s) => s.key === stepKey);
      if (step) runStep(step);
    },
    runAll,
    reset,
  };
}