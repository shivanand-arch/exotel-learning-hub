import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Play, FileText, Mic2, Link2, BookOpen,
  Presentation, Trash2, ExternalLink, Eye, Plus
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import type { ContentModule, ModuleType } from '../types';
import { TEAM_COLORS } from '../config/constants';
import { getFileBlobTypedUrl } from '../db/indexedDB';
import { VideoPlayerModal } from '../components/video/VideoPlayer';
import { PDFViewerModal } from '../components/slides/PDFViewer';

const TYPE_META: Record<ModuleType, { label: string; icon: React.ReactNode; color: string }> = {
  video: { label: 'Video', icon: <Play size={14} />, color: 'text-red-600 bg-red-50' },
  audio: { label: 'Audio', icon: <Mic2 size={14} />, color: 'text-orange-600 bg-orange-50' },
  pdf: { label: 'PDF', icon: <FileText size={14} />, color: 'text-blue-600 bg-blue-50' },
  document: { label: 'Document', icon: <BookOpen size={14} />, color: 'text-emerald-600 bg-emerald-50' },
  slides: { label: 'Slides', icon: <Presentation size={14} />, color: 'text-violet-600 bg-violet-50' },
  link: { label: 'Link', icon: <Link2 size={14} />, color: 'text-teal-600 bg-teal-50' },
};

const ALL_TYPES: ModuleType[] = ['video', 'audio', 'pdf', 'document', 'slides', 'link'];

function ModuleItem({ module, onPlay, onView }: {
  module: ContentModule;
  onPlay: (m: ContentModule) => void;
  onView: (m: ContentModule) => void;
}) {
  const { removeModule } = useApp();
  const meta = TYPE_META[module.type];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm transition-all group">
      {/* Thumbnail / icon area */}
      <div className="relative mb-4 rounded-xl overflow-hidden aspect-video bg-slate-100">
        {module.thumbnail ? (
          <img src={module.thumbnail} alt={module.title} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${meta.color}`}>
            <div className="text-4xl opacity-30">{meta.icon}</div>
          </div>
        )}
        {/* Play/View overlay */}
        <div
          onClick={() => module.type === 'video' ? onPlay(module) : onView(module)}
          className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center cursor-pointer"
        >
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all">
            {module.type === 'video' ? <Play size={18} className="text-red-600 ml-0.5" /> : <Eye size={18} className="text-slate-700" />}
          </div>
        </div>
        {/* Type badge */}
        <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg ${meta.color} text-xs font-semibold backdrop-blur-sm bg-white/90`}>
          {meta.icon}
          {meta.label}
        </div>
        {module.duration && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/60 text-white text-xs font-semibold">
            {module.duration}
          </div>
        )}
      </div>

      {/* Info */}
      <h3 className="font-bold text-slate-900 text-sm mb-1 line-clamp-1">{module.title}</h3>
      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{module.description}</p>

      {/* Tags */}
      {module.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {module.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-xs">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
        <button
          onClick={() => module.type === 'video' ? onPlay(module) : onView(module)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-900 hover:bg-red-600 text-white text-xs font-semibold rounded-xl transition-all"
        >
          {module.type === 'video' ? <Play size={12} /> : <Eye size={12} />}
          {module.type === 'video' ? 'Play' : 'Open'}
        </button>
        {module.url && (
          <a
            href={module.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-all"
          >
            <ExternalLink size={14} />
          </a>
        )}
        <button
          onClick={() => { if (confirm('Delete this module?')) removeModule(module.id); }}
          className="p-2 rounded-xl border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export function TeamDetail() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { teams, getTeamModules, removeTeam } = useApp();
  const [activeType, setActiveType] = useState<ModuleType | 'all'>('all');
  const [playingModule, setPlayingModule] = useState<ContentModule | null>(null);
  const [viewingModule, setViewingModule] = useState<ContentModule | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const team = teams.find(t => t.id === teamId);
  const allModules = teamId ? getTeamModules(teamId) : [];
  const colorConfig = TEAM_COLORS.find(c => c.name === team?.color) || TEAM_COLORS[0];

  const filteredModules = activeType === 'all'
    ? allModules
    : allModules.filter(m => m.type === activeType);

  const typeCounts = ALL_TYPES.reduce<Record<string, number>>((acc, t) => {
    acc[t] = allModules.filter(m => m.type === t).length;
    return acc;
  }, {});

  const handlePlay = async (module: ContentModule) => {
    setPlayingModule(module);
    if (module.fileName && !module.url) {
      const url = await getFileBlobTypedUrl(module.id, module.fileType || 'video/mp4');
      setBlobUrl(url);
    }
  };

  const handleView = async (module: ContentModule) => {
    if (module.type === 'link' && module.url) {
      window.open(module.url, '_blank');
      return;
    }
    setViewingModule(module);
    if (module.fileName && !module.url) {
      const url = await getFileBlobTypedUrl(module.id, module.fileType || 'application/pdf');
      setBlobUrl(url);
    }
  };

  useEffect(() => {
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [blobUrl]);

  if (!team) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400 font-medium">Team not found.</p>
        <button onClick={() => navigate('/')} className="mt-3 text-red-600 font-semibold hover:underline">← Back to dashboard</button>
      </div>
    );
  }

  return (
    <div className="animate-in-up space-y-6">
      {/* Team Header */}
      <div className={`rounded-3xl p-6 border ${colorConfig.border} bg-gradient-to-br from-white to-slate-50`}>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 text-sm font-medium mb-4 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Dashboard
        </button>
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl ${colorConfig.bg} flex items-center justify-center text-3xl shrink-0`}>
            {team.icon}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-slate-900 leading-tight">{team.name}</h1>
            <p className="text-slate-500 mt-1 text-sm">{team.description}</p>
            <div className="flex items-center gap-4 mt-3">
              <span className="text-xs text-slate-400 font-medium">{allModules.length} modules total</span>
              <button
                onClick={() => navigate('/content')}
                className={`flex items-center gap-1.5 text-xs font-semibold ${colorConfig.text} hover:underline`}
              >
                <Plus size={12} />
                Add module to this team
              </button>
            </div>
          </div>
          <button
            onClick={() => { if (confirm(`Delete team "${team.name}"? This will also delete all its modules.`)) { removeTeam(team.id); navigate('/'); }}}
            className="p-2 rounded-xl border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Type filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveType('all')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
            activeType === 'all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
          }`}
        >
          All ({allModules.length})
        </button>
        {ALL_TYPES.filter(t => typeCounts[t] > 0).map(type => {
          const meta = TYPE_META[type];
          return (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeType === type ? `${meta.color} ring-1` : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {meta.icon}
              {meta.label} ({typeCounts[type]})
            </button>
          );
        })}
      </div>

      {/* Module Grid */}
      {filteredModules.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
          <BookOpen size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400 font-medium">No {activeType === 'all' ? '' : activeType + ' '}modules yet</p>
          <button onClick={() => navigate('/content')} className="mt-2 text-red-600 text-sm font-semibold hover:underline">
            Upload content →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredModules.map(mod => (
            <ModuleItem key={mod.id} module={mod} onPlay={handlePlay} onView={handleView} />
          ))}
        </div>
      )}

      {/* Video player modal */}
      {playingModule && (
        <VideoPlayerModal
          module={playingModule}
          blobUrl={blobUrl}
          onClose={() => { setPlayingModule(null); setBlobUrl(null); }}
        />
      )}

      {/* PDF/Slides viewer modal */}
      {viewingModule && (
        <PDFViewerModal
          module={viewingModule}
          blobUrl={blobUrl}
          onClose={() => { setViewingModule(null); setBlobUrl(null); }}
        />
      )}
    </div>
  );
}
