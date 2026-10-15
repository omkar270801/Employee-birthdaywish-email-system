import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DashboardStats, UpcomingBirthday } from '../types';

const IST_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const getIstDayNumber = (date: Date) => {
  const parts = IST_DATE_FORMATTER.formatToParts(date);
  const year = Number(parts.find(part => part.type === 'year')?.value);
  const month = Number(parts.find(part => part.type === 'month')?.value);
  const day = Number(parts.find(part => part.type === 'day')?.value);
  return Date.UTC(year, month - 1, day) / 86400000;
};

const getBirthdayDayNumber = (date: Date) =>
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000;

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<UpcomingBirthday[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [upcomingError, setUpcomingError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadStats();
    loadUpcomingBirthdays();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.dashboard.getStats();
      setStats(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUpcomingBirthdays = async () => {
    try {
      const response = await api.birthdays.getUpcoming(8);
      const today = getIstDayNumber(new Date());
      setUpcomingBirthdays(response.data.filter((birthday: UpcomingBirthday) => {
        const birthdayDay = getBirthdayDayNumber(new Date(birthday.date));
        return birthdayDay > today && birthdayDay < today + 8;
      }));
    } catch (err: any) {
      setUpcomingError(err.message || 'Unable to load upcoming birthdays');
    } finally {
      setUpcomingLoading(false);
    }
  };

  const handleSendEmail = async (employeeId: string, resend = false) => {
    setSendingId(employeeId);
    setMessage(null);
    try {
      const response = await api.birthdays.sendToEmployee(employeeId, resend);
      setMessage({ type: response.success ? 'success' : 'error', text: response.message || (response.success ? 'Email sent' : 'Failed to send email') });
      await loadStats();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to send email' });
    } finally {
      setSendingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 text-sm">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of your birthday email system</p>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Employees" value={stats?.totalEmployees || 0} icon="👥" color="indigo" />
        <StatCard title="Today's Birthdays" value={stats?.todayBirthdays?.length || 0} icon="🎂" color="pink" />
        <StatCard title="Emails Sent Today" value={stats?.todayEmailsSent || 0} icon="✅" color="emerald" />
        <StatCard title="Not Sent" value={stats?.todayEmailsNotSent || 0} icon="❌" color="red" />
      </div>

      {stats?.todayBirthdays && stats.todayBirthdays.length > 0 && (
        <div className="card">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">🎉 Today's Birthdays</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Designation</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Birthday</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.todayBirthdays.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{emp.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{emp.designation || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{emp.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(emp.dateOfBirth).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={emp.emailStatus} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleSendEmail(emp.id, emp.emailStatus === 'SENT' || emp.emailStatus === 'FAILED')}
                        disabled={sendingId === emp.id || emp.emailStatus === 'PROCESSING'}
                        className="btn-primary btn-sm disabled:opacity-50"
                      >
                        {sendingId === emp.id ? (
                          <span className="flex items-center gap-1">
                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Sending...
                          </span>
                        ) : emp.emailStatus === 'SENT' ? 'Resend Email' : emp.emailStatus === 'FAILED' ? 'Retry Email' : 'Send Email'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">📅 Upcoming Birthdays</h2>
            <p className="mt-1 text-sm text-slate-500">Your schedule for the next 7 days</p>
          </div>
          {!upcomingLoading && !upcomingError && (
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              {upcomingBirthdays.length} {upcomingBirthdays.length === 1 ? 'birthday' : 'birthdays'}
            </span>
          )}
        </div>

        {upcomingLoading ? (
          <div className="flex items-center gap-3 px-6 py-8 text-sm text-slate-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-r-transparent" />
            Loading upcoming birthdays...
          </div>
        ) : upcomingError ? (
          <p className="px-6 py-8 text-sm text-red-600">{upcomingError}</p>
        ) : upcomingBirthdays.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-xl">🎈</div>
            <p className="text-sm font-medium text-slate-700">No birthdays coming up this week</p>
            <p className="mt-1 text-sm text-slate-500">The schedule will appear here when a birthday is near.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {upcomingBirthdays.map(({ employee, date }) => {
              const birthdayDate = new Date(date);
              const daysAway = getBirthdayDayNumber(birthdayDate) - getIstDayNumber(new Date());

              return (
                <li key={`${employee.id}-${date}`} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/70">
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-700">
                    <span className="text-[10px] font-bold uppercase">{birthdayDate.toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' })}</span>
                    <span className="text-xl font-bold leading-5">{birthdayDate.getUTCDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{employee.name}</p>
                    <p className="mt-1 truncate text-sm text-slate-500">{employee.designation || employee.department || employee.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium text-slate-700">{birthdayDate.toLocaleDateString(undefined, { weekday: 'long', timeZone: 'UTC' })}</p>
                    <p className="mt-1 text-xs text-slate-500">{daysAway === 1 ? 'Tomorrow' : `In ${daysAway} days`}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    pink: 'bg-pink-50 text-pink-700 border-pink-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl ${colorClasses[color] || colorClasses.indigo}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    SENT: 'badge-success',
    FAILED: 'badge-danger',
    'Not Sent': 'badge-warning',
  };
  const label = status === 'SENT' ? 'Sent' : status === 'FAILED' ? 'Failed' : status === 'PROCESSING' ? 'Sending' : 'Not Sent';
  return (
    <span className={`badge ${styles[status] || 'badge-info'}`}>
      {label}
    </span>
  );
}
