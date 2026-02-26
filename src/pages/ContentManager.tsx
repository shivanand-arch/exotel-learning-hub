import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Trash2, X, Check, Loader2,
  FolderPlus, Link2, ChevronDown
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import type { Team, ContentModule, ModuleType } from '../types';
import { TEAM_COLORS, MODULE_TYPE_META } from '../config/constants';
import { nanoid } from '../utils/nanoid';

// ─── Team Creator ─────────────────────────────────────────────────────────────
function CreateTeamModal({ onClose, onSave }: { onClose: () => void; onSave: (team: Team) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📚');
  const [colorIdx, setColorIdx] = useState(0);

  const EMOJIS = ['📚', '🚀', '⚡', '🎯', '💡', '🔬', '🛠️', '🌟', '🏆', '💼', '🎓', '🔐', '📊', '🌐', '❤️'];

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: 'team-' + nanoid(),
      name: name.trim(),
      description: description.trim(),
      icon,
      color: TEAM_COLORS[colorIdx].name,
      createdAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-lg">Create New Team</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition-all"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Icon picker */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 block">Team Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setIcon(e)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${icon === e ? 'bg-slate-900 ring-2 ring-offset-2 ring-slate-900' : 'bg-slate-100 hover:bg-slate-200'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 block">Color</label>
            <div className="flex gap-2">
              {TEAM_COLORS.map((c, i) => (
                <button key={c.name} onClick={() => setColorIdx(i)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${colorIdx === i ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c.accent }}
                />
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 block">Team Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. CQA — Conversation Quality Analysis"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="What does this team focus on?"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-white transition-all">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()}
            className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white text-sm font-semibold transition-all">
            Create Team
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── File Upload Card ─────────────────────────────────────────────────────────
function UploadZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files);
  }, [onFiles]);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
        dragging ? 'border-red-500 bg-red-50' : 'border-slate-300 bg-slate-50 hover:border-red-400 hover:bg-red-50/50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.txt"
        onChange={e => { if (e.target.files?.length) onFiles(Array.from(e.target.files)); }}
        className="hidden"
      />
      <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-all ${dragging ? 'bg-red-100' : 'bg-white border border-slate-200'}`}>
        <Upload size={24} className={dragging ? 'text-red-600' : 'text-slate-400'} />
      </div>
      <p className="font-bold text-slate-800 mb-1">
        {dragging ? 'Drop files here' : 'Drag & drop files'}
      </p>
      <p className="text-slate-500 text-sm mb-3">or click to browse · Videos, Audio, PDFs, Docs, Presentations</p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {['🎬 MP4', '🎵 MP3', '📄 PDF', '📝 DOCX', '🖼️ PPTX'].map(t => (
          <span key={t} className="px-2.5 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-500">{t}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Module Form ──────────────────────────────────────────────────────────────
interface ModuleFormData {
  title: string;
  description: string;
  teamId: string;
  type: ModuleType;
  url: string;
  tags: string;
  duration: string;
}

function ModuleForm({ file, teams, onSave, onCancel }: {
  file?: File;
  teams: Team[];
  onSave: (data: ModuleFormData, file?: File) => Promise<void>;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ModuleFormData>({
    title: file ? file.name.replace(/\.[^.]+$/, '') : '',
    description: '',
    teamId: teams[0]?.id || '',
    type: file ? (
      file.type.startsWith('video/') ? 'video' :
      file.type.startsWith('audio/') ? 'audio' :
      file.type === 'application/pdf' ? 'pdf' :
      file.name.match(/\.(ppt|pptx)$/i) ? 'slides' : 'document'
    ) : 'link',
    url: '',
    tags: '',
    duration: '',
  });

  const update = (k: keyof ModuleFormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.teamId) return;
    setSaving(true);
    await onSave(form, file);
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 animate-in-up">
      {file && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-lg">{MODULE_TYPE_META[form.type]?.icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
            <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 block">Title *</label>
          <input value={form.title} onChange={e => update('title', e.target.value)} placeholder="Module title"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 block">Team *</label>
          <div className="relative">
            <select value={form.teamId} onChange={e => update('teamId', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-red-500 transition-all pr-8">
              {teams.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name.split('—')[0].trim().substring(0, 30)}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 block">Type</label>
          <div className="relative">
            <select value={form.type} onChange={e => update('type', e.target.value as ModuleType)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-red-500 transition-all pr-8">
              {Object.entries(MODULE_TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {!file && (
          <div className="col-span-2">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 block">URL / YouTube Link</label>
            <input value={form.url} onChange={e => update('url', e.target.value)} placeholder="https://..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" />
          </div>
        )}

        <div className="col-span-2">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 block">Description</label>
          <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={2} placeholder="What will learners get from this module?"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all resize-none" />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 block">Tags (comma-separated)</label>
          <input value={form.tags} onChange={e => update('tags', e.target.value)} placeholder="cqa, training, demo"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" />
        </div>

        {(form.type === 'video' || form.type === 'audio') && (
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 block">Duration (e.g. 02:30)</label>
            <input value={form.duration} onChange={e => update('duration', e.target.value)} placeholder="MM:SS"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" />
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all">Cancel</button>
        <button onClick={handleSave} disabled={!form.title.trim() || !form.teamId || saving}
          className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2">
          {saving ? <><Loader2 size={14} className="animate-spin" />Saving...</> : <><Check size={14} />Save Module</>}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function ContentManager() {
  const navigate = useNavigate();
  const { teams, modules, addTeam, addModule, removeModule } = useApp();
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [savedModuleIds, setSavedModuleIds] = useState<Set<string>>(new Set());

  const handleFiles = (files: File[]) => {
    setPendingFiles(prev => [...prev, ...files]);
  };

  const handleSaveModule = async (data: ModuleFormData, file?: File) => {
    const id = 'mod-' + nanoid();
    let fileData: ArrayBuffer | undefined;
    if (file) {
      fileData = await file.arrayBuffer();
    }

    const mod: ContentModule = {
      id,
      teamId: data.teamId,
      title: data.title.trim(),
      description: data.description.trim(),
      type: data.type,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      url: !file && data.url.trim() ? data.url.trim() : undefined,
      duration: data.duration || undefined,
      tags: data.tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await addModule(mod, fileData);
    setSavedModuleIds(s => new Set([...s, id]));

    if (file) {
      setPendingFiles(prev => prev.filter(f => f !== file));
    } else {
      setShowUrlForm(false);
    }
  };

  return (
    <div className="animate-in-up space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Content Manager</h1>
        <p className="text-slate-500 mt-1">Upload files and organize content into teams. New modules appear instantly on the dashboard.</p>
      </div>

      {/* Teams section */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900">Teams ({teams.length})</h2>
          <button
            onClick={() => setShowTeamModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all"
          >
            <FolderPlus size={14} />
            New Team
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {teams.map(team => {
            const color = TEAM_COLORS.find(c => c.name === team.color) || TEAM_COLORS[0];
            const count = modules.filter(m => m.teamId === team.id).length;
            return (
              <div key={team.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${color.border} ${color.bg} cursor-pointer hover:shadow-sm transition-all`}
                onClick={() => navigate(`/team/${team.id}`)}>
                <span>{team.icon}</span>
                <span className={`text-sm font-semibold ${color.text}`}>{team.name.split('—')[0].trim()}</span>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${color.badge}`}>{count}</span>
              </div>
            );
          })}
          {teams.length === 0 && (
            <p className="text-slate-400 text-sm italic">No teams yet. Create one above.</p>
          )}
        </div>
      </section>

      {/* Upload zone */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-900">Upload Content</h2>
          <button
            onClick={() => setShowUrlForm(s => !s)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:border-slate-300 bg-white text-slate-600 text-sm font-semibold rounded-xl transition-all"
          >
            <Link2 size={14} />
            Add URL / YouTube
          </button>
        </div>

        <UploadZone onFiles={handleFiles} />

        {/* URL form */}
        {showUrlForm && (
          <div className="mt-4">
            <ModuleForm
              teams={teams}
              onSave={handleSaveModule}
              onCancel={() => setShowUrlForm(false)}
            />
          </div>
        )}

        {/* Pending file forms */}
        {pendingFiles.length > 0 && (
          <div className="mt-4 space-y-4">
            <p className="text-sm font-semibold text-slate-700">{pendingFiles.length} file{pendingFiles.length > 1 ? 's' : ''} ready to configure:</p>
            {pendingFiles.map((file, i) => (
              <ModuleForm
                key={i + file.name}
                file={file}
                teams={teams}
                onSave={handleSaveModule}
                onCancel={() => setPendingFiles(prev => prev.filter(f => f !== file))}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recently saved */}
      {savedModuleIds.size > 0 && (
        <section className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Check size={16} className="text-emerald-600" />
            <h3 className="font-semibold text-emerald-800 text-sm">{savedModuleIds.size} module{savedModuleIds.size > 1 ? 's' : ''} saved successfully</h3>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-emerald-700 text-sm font-semibold hover:underline"
          >
            View on Dashboard →
          </button>
        </section>
      )}

      {/* Module list */}
      {modules.length > 0 && (
        <section>
          <h2 className="font-bold text-slate-900 mb-4">All Modules ({modules.length})</h2>
          <div className="space-y-2">
            {[...modules].reverse().map(mod => {
              const team = teams.find(t => t.id === mod.teamId);
              const meta = MODULE_TYPE_META[mod.type];
              return (
                <div key={mod.id} className="bg-white rounded-xl border border-slate-200 px-4 py-3.5 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${meta?.color || 'bg-slate-100 text-slate-500'}`}>
                    {meta?.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{mod.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{team?.icon} {team?.name?.split('—')[0]?.trim()} · {meta?.label}</p>
                  </div>
                  <button
                    onClick={() => { if (confirm('Delete this module?')) removeModule(mod.id); }}
                    className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Team creator modal */}
      {showTeamModal && (
        <CreateTeamModal
          onClose={() => setShowTeamModal(false)}
          onSave={team => { addTeam(team); }}
        />
      )}
    </div>
  );
}
