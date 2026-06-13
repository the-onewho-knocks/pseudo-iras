import React, { createContext, useContext, useReducer, useCallback } from 'react';

const AppContext = createContext(null);

// ── Initial State ─────────────────────────────────────────────
const initialState = {
  // Active session tracking
  activeSession: null,      // { id, filename, status, createdAt }
  sessions: [],

  // Dashboard stats cache
  stats: null,

  // Toast notifications
  toasts: [],

  // Global loading flags
  loading: {
    dashboard: false,
    upload: false,
    analyze: false,
    resume: false,
  },

  // Resume library
  resumes: [],
};

// ── Reducer ───────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'SET_ACTIVE_SESSION':
      return { ...state, activeSession: action.payload };
    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload };
    case 'ADD_SESSION':
      return { ...state, sessions: [action.payload, ...state.sessions] };
    case 'UPDATE_SESSION':
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id === action.payload.id ? { ...s, ...action.payload } : s
        ),
        activeSession:
          state.activeSession?.id === action.payload.id
            ? { ...state.activeSession, ...action.payload }
            : state.activeSession,
      };
    case 'REMOVE_SESSION':
      return {
        ...state,
        sessions: state.sessions.filter((s) => s.id !== action.payload),
        activeSession:
          state.activeSession?.id === action.payload ? null : state.activeSession,
      };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    case 'SET_RESUMES':
      return { ...state, resumes: action.payload };
    case 'ADD_RESUME':
      return { ...state, resumes: [action.payload, ...state.resumes] };
    case 'REMOVE_RESUME':
      return { ...state, resumes: state.resumes.filter((r) => r.id !== action.payload) };
    case 'SET_LOADING':
      return { ...state, loading: { ...state.loading, ...action.payload } };
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload) };
    default:
      return state;
  }
}

// ── Provider ──────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Toast helpers
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now().toString();
    dispatch({ type: 'ADD_TOAST', payload: { id, message, type } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 4000);
    return id;
  }, []);

  const removeToast = useCallback(
    (id) => dispatch({ type: 'REMOVE_TOAST', payload: id }),
    []
  );

  const value = {
    ...state,
    dispatch,
    addToast,
    removeToast,
    // Convenience setters
    setActiveSession: (session) =>
      dispatch({ type: 'SET_ACTIVE_SESSION', payload: session }),
    setLoading: (flags) =>
      dispatch({ type: 'SET_LOADING', payload: flags }),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}