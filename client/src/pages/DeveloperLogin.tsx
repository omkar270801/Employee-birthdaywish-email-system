import { useState, FormEvent } from 'react';

interface DeveloperLoginProps {
  onLogin: () => void;
}

export function DeveloperLogin({ onLogin }: DeveloperLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/developer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('developerToken', data.data.token);
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-md">
        <div className="card p-8 border-slate-700 bg-slate-800">
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-slate-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <span className="text-3xl">🛠️</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Developer Portal</h2>
            <p className="mt-1 text-sm text-slate-400">System Monitoring & Diagnostics</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="label text-slate-300">Developer Email</label>
              <input
                type="email"
                required
                className="input bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:ring-indigo-500 focus:border-indigo-500"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="developer@company.com"
                autoComplete="off"
                name="devEmail"
              />
            </div>

            <div>
              <label className="label text-slate-300">Developer Password</label>
              <input
                type="password"
                required
                className="input bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:ring-indigo-500 focus:border-indigo-500"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="off"
                name="devPassword"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Authenticating...
                </span>
              ) : (
                'Access Developer Portal'
              )}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-slate-500 mt-6">
          © {new Date().getFullYear()} IIM Birthday Wish Email System
        </p>
      </div>
    </div>
  );
}
