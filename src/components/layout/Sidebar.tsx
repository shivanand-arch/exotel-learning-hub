import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, Mic, Upload,
  ChevronRight, LogOut, Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/content', label: 'Content Manager', icon: Upload },
  { to: '/chat', label: 'AI Assistant', icon: MessageSquare },
  { to: '/voice', label: 'Voice Mode', icon: Mic },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const { teams, getModuleCount } = useApp();
  const location = useLocation();

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-50 shadow-2xl">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-red-600/30 shrink-0">
          E
        </div>
        <div className="overflow-hidden">
          <h1 className="font-black text-base tracking-tight leading-none truncate">Exotel Hub</h1>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">L&D Platform</p>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="px-3 pt-4 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => {
          const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/25'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={16} className="shrink-0" />
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* Teams section */}
      <div className="px-3 mt-5 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest">Teams</span>
          <Users size={11} className="text-slate-600" />
        </div>
        <div className="space-y-0.5">
          {teams.map(team => {
            const isActive = location.pathname === `/team/${team.id}`;
            const count = getModuleCount(team.id);
            return (
              <NavLink
                key={team.id}
                to={`/team/${team.id}`}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-500 hover:bg-slate-800/60 hover:text-slate-300'
                }`}
              >
                <span className="text-base shrink-0">{team.icon}</span>
                <span className="flex-1 truncate text-xs font-semibold">{team.name.split('—')[0].trim()}</span>
                <div className="flex items-center gap-1 shrink-0">
                  {count > 0 && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-slate-700 text-slate-300' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700'
                    }`}>
                      {count}
                    </span>
                  )}
                  <ChevronRight size={11} className="opacity-40 group-hover:opacity-100" />
                </div>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* User profile */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        {user && (
          <div className="flex items-center gap-3">
            {user.picture ? (
              <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full ring-2 ring-slate-700" />
            ) : (
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-xs font-black">
                {user.name[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-300 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-600 truncate">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-slate-800 transition-all"
              title="Sign out"
            >
              <LogOut size={13} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
