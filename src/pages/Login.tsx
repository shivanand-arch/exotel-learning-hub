import { useAuth } from '../contexts/AuthContext';
import { GOOGLE_CLIENT_ID } from '../config/constants';

export function Login() {
  const { login, isLoading, error } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background gradient decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-600/40">
              <span className="text-white font-black text-xl">E</span>
            </div>
            <div>
              <h1 className="text-white font-black text-2xl leading-none">Exotel Hub</h1>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mt-0.5">L&D Platform</p>
            </div>
          </div>
        </div>

        {/* Sign-in card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-white font-bold text-xl mb-2">Welcome back</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Sign in with your Exotel Google account to access the platform.
            </p>
          </div>

          {/* Domain badge */}
          <div className="flex items-center justify-center gap-2 mb-6 py-2.5 px-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-300 text-xs font-semibold">Only @exotel.com accounts permitted</span>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950 border border-red-800/50">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Google Sign-in button */}
          {!GOOGLE_CLIENT_ID ? (
            <div className="p-4 rounded-xl bg-amber-950 border border-amber-800/50 text-center">
              <p className="text-amber-400 text-sm font-semibold mb-1">Configuration Required</p>
              <p className="text-amber-500/70 text-xs">Set VITE_GOOGLE_CLIENT_ID in .env.local to enable Google Sign-In.</p>
              <button
                onClick={() => {
                  // Dev bypass - skip auth in dev mode without a client ID
                  const devUser = { id: 'dev-user', email: 'dev@exotel.com', name: 'Dev User', picture: '', domain: 'exotel.com' };
                  localStorage.setItem('exotel-hub-user', JSON.stringify(devUser));
                  window.location.reload();
                }}
                className="mt-3 w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-all"
              >
                Continue as Dev User (local only)
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-semibold transition-all duration-200 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {isLoading ? 'Signing in...' : 'Continue with Google'}
            </button>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-6">
          Exotel Hub · Internal L&D Platform · Confidential
        </p>
      </div>
    </div>
  );
}
