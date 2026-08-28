import { Link, useLocation } from 'react-router-dom';
import packageInfo from '../../package.json';

const navItems = [
  { path: '/developer/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/developer/dashboard', label: 'Health', icon: '❤️' },
  { path: '/developer/dashboard', label: 'Scheduler', icon: '⏰' },
  { path: '/developer/dashboard', label: 'System Logs', icon: '📋' },
];

export function DeveloperLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('developerToken');
    window.location.href = '/developer/login';
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 border-r border-slate-700">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-lg">🛠️</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white">IIM Developer</h1>
              <p className="text-xs text-slate-400">System Monitor</p>
            </div>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-thin">
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-700'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-700">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
            >
              <span className="text-lg">🚪</span>
              Logout
            </button>
            <div className="mt-3 px-3 text-xs text-slate-500">
              Version {packageInfo.version}
            </div>
          </div>
        </div>
      </aside>

      <main className="pl-64">
        <div className="py-8 px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
