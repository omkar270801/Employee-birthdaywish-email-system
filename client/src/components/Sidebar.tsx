import { Link, useLocation } from 'react-router-dom';
import packageInfo from '../../../package.json';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/employees', label: 'Employees', icon: '👥' },
  { path: '/employees/upload', label: 'Upload Excel', icon: '📤' },
  { path: '/templates', label: 'Templates', icon: '📧' },
  { path: '/email-history', label: 'Email History', icon: '📜' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar() {
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200">
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
          <img
            src="/iim_logo.jpeg"
            alt="IIM Logo"
            className="h-8 w-auto object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <div>
            <h1 className="text-sm font-semibold text-slate-900">IIM Birthday</h1>
            <p className="text-xs text-slate-500">Email System</p>
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
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <span className="text-lg">🚪</span>
            Logout
          </button>
          <div className="mt-3 px-3 text-xs text-slate-400">
            Version {packageInfo.version}
          </div>
        </div>
      </div>
    </aside>
  );
}
