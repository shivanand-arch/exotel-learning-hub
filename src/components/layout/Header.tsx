import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Plus, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/content': 'Content Manager',
  '/chat': 'AI Assistant',
  '/voice': 'Voice Mode',
};

export function Header() {
  const { user } = useAuth();
  const { setSearchQuery } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const title = PAGE_TITLES[location.pathname] ||
    (location.pathname.startsWith('/team/') ? 'Team Library' : 'Exotel Hub');

  const handleSearch = (value: string) => {
    setSearchValue(value);
    setSearchQuery(value);
  };

  const clearSearch = () => {
    setSearchValue('');
    setSearchQuery('');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-8 py-4 flex items-center justify-between gap-4">
      {/* Page title */}
      <div>
        <h2 className="font-bold text-slate-900 text-lg leading-none">{title}</h2>
        {user && (
          <p className="text-slate-400 text-xs mt-0.5">
            Welcome back, <span className="text-slate-600 font-medium">{user.name.split(' ')[0]}</span>
          </p>
        )}
      </div>

      {/* Search + Actions */}
      <div className="flex items-center gap-3">
        {/* Search bar */}
        <div className={`relative flex items-center transition-all duration-300 ${searchOpen ? 'w-72' : 'w-9'}`}>
          {searchOpen ? (
            <div className="flex items-center w-full bg-slate-100 rounded-xl px-3 py-2 gap-2 border border-slate-200 focus-within:border-red-400 focus-within:ring-1 focus-within:ring-red-400">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                autoFocus
                type="text"
                value={searchValue}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search modules, teams..."
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
              />
              <button onClick={() => { setSearchOpen(false); clearSearch(); }}>
                <X size={14} className="text-slate-400 hover:text-slate-600" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all"
            >
              <Search size={16} />
            </button>
          )}
        </div>

        {/* Add content button */}
        <button
          onClick={() => navigate('/content')}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-red-200 active:scale-95"
        >
          <Plus size={15} />
          Add Content
        </button>

        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Avatar */}
        {user?.picture && (
          <img
            src={user.picture}
            alt={user.name}
            className="w-9 h-9 rounded-xl ring-2 ring-slate-200"
          />
        )}
      </div>
    </header>
  );
}
