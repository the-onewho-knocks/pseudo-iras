import { useCallback } from 'react';
import { useApp } from '../context/AppContext';

export function useToast() {
  const { addToast, removeToast, toasts } = useApp();

  const success = useCallback(
    (message) => addToast(message, 'success'),
    [addToast]
  );

  const error = useCallback(
    (message) => addToast(message, 'error'),
    [addToast]
  );

  const info = useCallback(
    (message) => addToast(message, 'info'),
    [addToast]
  );

  const warning = useCallback(
    (message) => addToast(message, 'warning'),
    [addToast]
  );

  return { toasts, addToast, removeToast, success, error, info, warning };
}