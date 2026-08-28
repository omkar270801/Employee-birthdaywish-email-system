import { useEffect, useState } from 'react';
import { api } from '../services/api';

interface ServerStatus {
  uptime: number;
  nodeVersion: string;
  environment: string;
  memoryUsage: any;
  timestamp: string;
}

interface HealthData {
  status: 'healthy' | 'degraded';
  timestamp: string;
  services: {
    api: { status: string };
    database: { status: string };
    email: { status: string };
    scheduler: { status: string };
  };
}

interface SchedulerData {
  isRunning: boolean;
  nextRun: string | null;
  lastRun: string | null;
  lastRunSuccess: boolean | null;
  lastRunMessage: string | null;
  checkTime: string | null;
}

interface StatisticsData {
  totalEmployees: number;
  totalEmailsSent: number;
  totalEmailsFailed: number;
  totalEmailLogs: number;
  totalTemplates: number;
  todaySent: number;
  todayFailed: number;
  pendingEmails: number;
}

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    connected: 'badge-success',
    disconnected: 'badge-danger',
    healthy: 'badge-success',
    degraded: 'badge-warning',
    operational: 'badge-success',
    running: 'badge-success',
    stopped: 'badge-danger',
    success: 'badge-success',
    danger: 'badge-danger',
  };
  return (
    <span className={`badge ${styles[status] || 'badge-info'}`}>
      {status}
    </span>
  );
}

export function DeveloperDashboard() {
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [scheduler, setScheduler] = useState<SchedulerData | null>(null);
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const [statusRes, healthRes, schedulerRes, statsRes, logsRes] = await Promise.all([
        api.developer.getStatus(),
        api.developer.getHealth(),
        api.developer.getScheduler(),
        api.developer.getStatistics(),
        api.developer.getLogs(),
      ]);

      setServerStatus(statusRes.data);
      setHealth(healthRes.data);
      setScheduler(schedulerRes.data);
      setStatistics(statsRes.data);
      setLogs(logsRes.data.logs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-400 text-sm">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Developer Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">System monitoring and diagnostics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-slate-700 bg-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl border border-emerald-700 bg-emerald-900/30 flex items-center justify-center text-2xl">
              🟢
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Server Status</p>
              <p className="text-2xl font-bold text-white mt-0.5">{serverStatus ? 'Online' : 'Unknown'}</p>
            </div>
          </div>
        </div>

        <div className="card p-5 border-slate-700 bg-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl border border-indigo-700 bg-indigo-900/30 flex items-center justify-center text-2xl">
              📊
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Uptime</p>
              <p className="text-2xl font-bold text-white mt-0.5">{serverStatus ? formatUptime(serverStatus.uptime) : 'Unknown'}</p>
            </div>
          </div>
        </div>

        <div className="card p-5 border-slate-700 bg-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl border border-blue-700 bg-blue-900/30 flex items-center justify-center text-2xl">
              🗄️
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Database</p>
              <p className="text-sm font-bold text-white mt-0.5">{health ? <StatusBadge status={health.services.database.status} /> : 'Unknown'}</p>
            </div>
          </div>
        </div>

        <div className="card p-5 border-slate-700 bg-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl border border-pink-700 bg-pink-900/30 flex items-center justify-center text-2xl">
              📧
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Email Service</p>
              <p className="text-sm font-bold text-white mt-0.5">{health ? <StatusBadge status={health.services.email.status} /> : 'Unknown'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card border-slate-700 bg-slate-800">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">🖥️ Server Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Node.js Version</span>
              <span className="text-sm font-medium text-white">{serverStatus?.nodeVersion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Environment</span>
              <span className="text-sm font-medium text-white">{serverStatus?.environment}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Uptime</span>
              <span className="text-sm font-medium text-white">{serverStatus ? formatUptime(serverStatus.uptime) : 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Last Updated</span>
              <span className="text-sm font-medium text-white">{serverStatus ? new Date(serverStatus.timestamp).toLocaleString() : 'Unknown'}</span>
            </div>
          </div>
        </div>

        <div className="card border-slate-700 bg-slate-800">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">❤️ API Health</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Backend API</span>
              <StatusBadge status={health?.services.api.status || 'unknown'} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Database API</span>
              <StatusBadge status={health?.services.database.status || 'unknown'} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Email API</span>
              <StatusBadge status={health?.services.email.status || 'unknown'} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Scheduler API</span>
              <StatusBadge status={health?.services.scheduler.status || 'unknown'} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Overall Status</span>
              <StatusBadge status={health?.status || 'unknown'} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card border-slate-700 bg-slate-800">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">⏰ Birthday Scheduler</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Status</span>
              <StatusBadge status={scheduler?.isRunning ? 'running' : 'stopped'} />
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Check Time</span>
              <span className="text-sm font-medium text-white">{scheduler?.checkTime || 'Not configured'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Last Run</span>
              <span className="text-sm font-medium text-white">{scheduler?.lastRun ? new Date(scheduler.lastRun).toLocaleString() : 'Never'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Last Result</span>
              {scheduler && scheduler.lastRunSuccess !== null ? (
                <StatusBadge status={scheduler.lastRunSuccess ? 'success' : 'danger'} />
              ) : (
                <span className="text-sm text-slate-500">No data</span>
              )}
            </div>
            {scheduler?.lastRunMessage && (
              <div className="bg-slate-700/50 rounded-lg p-3">
                <p className="text-xs text-slate-400">Last message: {scheduler.lastRunMessage}</p>
              </div>
            )}
          </div>
        </div>

        <div className="card border-slate-700 bg-slate-800">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">📈 Email Statistics</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Total Employees</span>
              <span className="text-sm font-medium text-white">{statistics?.totalEmployees || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Total Emails Sent</span>
              <span className="text-sm font-medium text-emerald-400">{statistics?.totalEmailsSent || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Failed Emails</span>
              <span className="text-sm font-medium text-red-400">{statistics?.totalEmailsFailed || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Pending Emails</span>
              <span className="text-sm font-medium text-amber-400">{statistics?.pendingEmails || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Total Templates</span>
              <span className="text-sm font-medium text-white">{statistics?.totalTemplates || 0}</span>
            </div>
            <div className="border-t border-slate-700 pt-4 mt-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Today</p>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Sent Today</span>
                <span className="text-sm font-medium text-emerald-400">{statistics?.todaySent || 0}</span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-sm text-slate-400">Failed Today</span>
                <span className="text-sm font-medium text-red-400">{statistics?.todayFailed || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-slate-700 bg-slate-800">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">📋 System Logs</h2>
        </div>
        <div className="p-6">
          {logs.length === 0 ? (
            <p className="text-sm text-slate-500">No logs available</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
              {logs.map((log, index) => (
                <div key={index} className="flex items-start gap-3 bg-slate-700/30 rounded-lg p-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    log.level === 'error' ? 'bg-red-900/50 text-red-300' :
                    log.level === 'warn' ? 'bg-amber-900/50 text-amber-300' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {log.level.toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 break-all">{log.message}</p>
                    <p className="text-xs text-slate-500 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
