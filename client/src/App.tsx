import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { UploadEmployees } from './pages/UploadEmployees';
import { Templates } from './pages/Templates';
import { EmailHistory } from './pages/EmailHistory';
import { Settings } from './pages/Settings';
import { DeveloperLogin } from './pages/DeveloperLogin';
import { DeveloperDashboard } from './pages/DeveloperDashboard';
import { DeveloperLayout } from './components/DeveloperLayout';
import { api } from './services/api';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function ProtectedDeveloperRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('developerToken');
  if (!token) return <Navigate to="/developer/login" replace />;
  return <>{children}</>;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [isDeveloperAuthenticated, setIsDeveloperAuthenticated] = useState(!!localStorage.getItem('developerToken'));

  useEffect(() => {
    const handleAuthExpired = (event: Event) => {
      const tokenKey = (event as CustomEvent<{ tokenKey: string }>).detail?.tokenKey;
      if (tokenKey === 'token') setIsAuthenticated(false);
      if (tokenKey === 'developerToken') setIsDeveloperAuthenticated(false);
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleDeveloperLogin = () => {
    setIsDeveloperAuthenticated(true);
  };

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />} />
      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute><Layout><Employees /></Layout></ProtectedRoute>} />
      <Route path="/employees/upload" element={<ProtectedRoute><Layout><UploadEmployees /></Layout></ProtectedRoute>} />
      <Route path="/templates" element={<ProtectedRoute><Layout><Templates /></Layout></ProtectedRoute>} />
      <Route path="/email-history" element={<ProtectedRoute><Layout><EmailHistory /></Layout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
      <Route path="/developer/login" element={isDeveloperAuthenticated ? <Navigate to="/developer/dashboard" replace /> : <DeveloperLogin onLogin={handleDeveloperLogin} />} />
      <Route path="/developer/dashboard" element={<ProtectedDeveloperRoute><DeveloperLayout><DeveloperDashboard /></DeveloperLayout></ProtectedDeveloperRoute>} />
      <Route path="/developer/settings" element={<ProtectedDeveloperRoute><DeveloperLayout><Settings isDeveloper /></DeveloperLayout></ProtectedDeveloperRoute>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
