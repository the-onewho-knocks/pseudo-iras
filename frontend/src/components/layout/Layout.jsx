import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useApp } from '../../context/AppContext';
import Toast from '../ui/Toast';

export default function Layout({ children }) {
  const { toasts, removeToast } = useApp();

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <main className="page-body">
          {children}
        </main>
      </div>

      {/* Toast container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </div>
  );
}