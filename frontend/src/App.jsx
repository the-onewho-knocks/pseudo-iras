import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Upload    from './pages/Upload';
import Analyze   from './pages/Analyze';
import Resume    from './pages/Resume';
import Report    from './pages/Report';
import Email     from './pages/Email';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/"                   element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"          element={<Dashboard />} />
            <Route path="/upload"             element={<Upload />} />
            <Route path="/analyze"            element={<Analyze />} />
            <Route path="/analyze/:sessionId" element={<Analyze />} />
            <Route path="/resume"             element={<Resume />} />
            <Route path="/report"             element={<Report />} />
            <Route path="/report/:sessionId"  element={<Report />} />
            <Route path="/email"              element={<Email />} />
            <Route path="*"                   element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
}