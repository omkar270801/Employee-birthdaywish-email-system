import { useEffect, useState } from 'react';
import { api } from '../services/api';

type CleanupType = 'email_logs' | 'inactive_employees' | 'all_logs';

export function Settings() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cleanupType, setCleanupType] = useState<CleanupType>('email_logs');
  const [olderThanDays, setOlderThanDays] = useState(30);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.settings.getStats();
      setStats(response.data);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (!confirm(`Are you sure you want to cleanup ${cleanupType.replace(/_/g, ' ')} older than ${olderThanDays} days? This action cannot be undone.`)) {
      return;
    }

    setCleanupLoading(true);
    setMessage(null);

    try {
      const response = await api.settings.cleanup({ type: cleanupType, olderThanDays });
      setMessage({ type: 'success', text: response.message || 'Cleanup completed' });
      await loadStats();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Cleanup failed' });
    } finally {
      setCleanupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage database and system settings</p>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {stats && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Database Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs text-slate-500">Total Employees</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalEmployees}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs text-slate-500">Active Employees</p>
              <p className="text-2xl font-bold text-emerald-700">{stats.activeEmployees}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs text-slate-500">Inactive Employees</p>
              <p className="text-2xl font-bold text-amber-700">{stats.inactiveEmployees}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs text-slate-500">Total Email Logs</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalEmailLogs}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs text-slate-500">Sent Emails</p>
              <p className="text-2xl font-bold text-emerald-700">{stats.sentEmails}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs text-slate-500">Failed Emails</p>
              <p className="text-2xl font-bold text-red-700">{stats.failedEmails}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs text-slate-500">Templates</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalTemplates}</p>
            </div>
          </div>
        </div>
      )}

      <div className="card p-6 border-red-200">
        <h2 className="text-lg font-semibold text-red-900 mb-2">Database Cleanup</h2>
        <p className="text-sm text-red-700 mb-4">
          Permanently delete old records from the database. This action cannot be undone.
        </p>

        <div className="space-y-4">
          <div>
            <label className="label">Cleanup Type</label>
            <select
              className="input"
              value={cleanupType}
              onChange={e => setCleanupType(e.target.value as CleanupType)}
            >
              <option value="email_logs">Failed Email Logs Only</option>
              <option value="all_logs">All Email Logs</option>
              <option value="inactive_employees">Inactive Employees</option>
            </select>
          </div>

          <div>
            <label className="label">Older Than (days)</label>
            <input
              type="number"
              min="1"
              className="input"
              value={olderThanDays}
              onChange={e => setOlderThanDays(Number(e.target.value))}
            />
            <p className="text-xs text-slate-500 mt-1">
              Records older than this many days will be deleted.
            </p>
          </div>

          <button
            onClick={handleCleanup}
            disabled={cleanupLoading}
            className="btn-danger"
          >
            {cleanupLoading ? 'Cleaning up...' : 'Run Cleanup'}
          </button>
        </div>
      </div>
    </div>
  );
}
