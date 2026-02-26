import { useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, BookOpen, Video, FileAudio, FileText, Link2, Presentation, Layers, Upload } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import type { Team, ContentModule } from '../types';
import { TEAM_COLORS } from '../config/constants';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  video: <Video size={12} />,
  audio: <FileAudio size={12} />,
  pdf: <FileText size={12} />,
  document: <BookOpen size={12} />,
  slides: <Presentation size={12} />,
  link: <Link2 size={12} />,
};

function getColorConfig(colorName: string) {
  return TEAM_COLORS.find(c => c.name === colorName) || TEAM_COLORS[0];
}

function TypeBreakdown({ modules }: { modules: ContentModule[] }) {
  const counts = modules.reduce<Record<string, number>>((acc, m) => {
    acc[m.type] = (acc[m.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {Object.entries(counts).map(([type, count]) => (
        <span key={type} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
          {TYPE_ICONS[type]}
          {count} {type}
        </span>
      ))}
    </div>
  );
}

function TeamCard({ team }: { team: Team }) {
  const navigate = useNavigate();
  const { getTeamModules } = useApp();
  const modules = getTeamModules(team.id);
  const color = getColorConfig(team.color);

  return (
    <div
      onClick={() => navigate(`/team/${team.id}`)}
      className="bg-white rounded-2xl border border-slate-200 p-6 cursor-pointer hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl ${color.bg} flex items-center justify-center text-2xl shadow-sm`}>
          {team.icon}
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight size={16} className={color.text} />
        </div>
      </div>

      {/* Title & description */}
      <h3 className="font-bold text-slate-900 text-base leading-tight mb-1.5">{team.name}</h3>
      <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">{team.description}</p>

      {/* Module count */}
      <TypeBreakdown modules={modules} />

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-400 font-medium">{modules.length} module{modules.length !== 1 ? 's' : ''}</span>
        <span className={`text-xs font-semibold ${color.text}`}>View library →</span>
      </div>
    </div>
  );
}

function StatsBar() {
  const { teams, modules } = useApp();
  const typeSet = new Set(modules.map(m => m.type));

  const stats = [
    { label: 'Teams', value: teams.length, icon: '🏢' },
    { label: 'Modules', value: modules.length, icon: '📚' },
    { label: 'Content Types', value: typeSet.size, icon: '🎨' },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {stats.map(s => (
        <div key={s.label} className="bg-white rounded-2xl border border-slate-200 px-5 py-4 flex items-center gap-3">
          <span className="text-2xl">{s.icon}</span>
          <div>
            <p className="text-2xl font-black text-slate-900 leading-none">{s.value}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { teams, modules, isLoading, searchQuery } = useApp();
  const { user } = useAuth();

  const filteredTeams = searchQuery
    ? teams.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : teams;

  const recentModules = [...modules]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in-up">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-8 text-white shadow-xl border border-white/5">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/10 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl" />
          <svg className="absolute right-8 top-1/2 -translate-y-1/2 opacity-5 w-64 h-64" viewBox="0 0 200 200">
            <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#E53935"/><stop offset="100%" stopColor="#7C3AED"/></linearGradient></defs>
            {[40,70,100,130,160].map(r => (
              <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="url(#g)" strokeWidth="0.5" />
            ))}
            <line x1="100" y1="0" x2="100" y2="200" stroke="white" strokeWidth="0.2"/>
            <line x1="0" y1="100" x2="200" y2="100" stroke="white" strokeWidth="0.2"/>
          </svg>
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-600/30 text-red-400 text-xs font-bold uppercase tracking-widest mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            Learning Platform Live
          </div>
          <h1 className="text-3xl font-black mb-3 leading-tight">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-6 max-w-md">
            Your unified learning hub. Explore training from all Exotel teams — videos, decks, docs, and AI-powered coaching.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/content')}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-red-900/30 active:scale-95"
            >
              <Upload size={15} />
              Upload Content
            </button>
            <button
              onClick={() => navigate('/chat')}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold rounded-xl transition-all border border-white/10 active:scale-95"
            >
              Ask AI
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <StatsBar />

      {/* Teams Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Teams & Products</h2>
            <p className="text-slate-400 text-sm mt-0.5">
              {searchQuery ? `${filteredTeams.length} result${filteredTeams.length !== 1 ? 's' : ''} for "${searchQuery}"` : `${teams.length} active team${teams.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => navigate('/content')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            <Plus size={14} />
            Add Team
          </button>
        </div>

        {filteredTeams.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
            <Layers size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">
              {searchQuery ? `No teams match "${searchQuery}"` : 'No teams yet'}
            </p>
            {!searchQuery && (
              <button onClick={() => navigate('/content')} className="mt-3 text-red-600 text-sm font-semibold hover:underline">
                Create your first team →
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredTeams.map(team => <TeamCard key={team.id} team={team} />)}
          </div>
        )}
      </section>

      {/* Recent Modules */}
      {recentModules.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Recently Added</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentModules.map(mod => {
              const team = teams.find(t => t.id === mod.teamId);
              const color = team ? getColorConfig(team.color) : TEAM_COLORS[0];
              return (
                <div
                  key={mod.id}
                  onClick={() => navigate(`/team/${mod.teamId}`)}
                  className="bg-white rounded-xl border border-slate-200 px-4 py-3.5 flex items-center gap-3 cursor-pointer hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  <div className={`w-9 h-9 rounded-xl ${color.bg} flex items-center justify-center text-lg shrink-0`}>
                    {team?.icon || '📚'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{mod.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{team?.name} · {mod.type}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${color.badge}`}>{mod.type}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
