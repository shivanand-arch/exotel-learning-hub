import { useRef, useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';
import type { ContentModule } from '../../types';

interface Props {
  module: ContentModule;
  blobUrl: string | null;
  onClose: () => void;
}

export function AudioPlayerModal({ module, blobUrl, onClose }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [totalTime, setTotalTime] = useState('0:00');

  const src = blobUrl || module.url || '';
  const isPodcast = module.type === 'podcast';

  const fmt = (s: number) => {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); } else { audioRef.current.play(); }
    setPlaying(!playing);
  };

  const skip = (secs: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + secs);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !audioRef.current.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const p = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = p * audioRef.current.duration;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900 rounded-3xl overflow-hidden w-full max-w-lg shadow-2xl border border-slate-700">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg ${isPodcast ? 'bg-purple-700' : 'bg-orange-600'}`}>
              {isPodcast ? '🎙️' : '🎵'}
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">{module.title}</h3>
              <p className="text-slate-500 text-xs">{isPodcast ? 'Podcast Episode' : 'Audio'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Artwork / visual */}
        <div className={`${isPodcast ? 'bg-gradient-to-br from-purple-950 to-slate-950' : 'bg-gradient-to-br from-orange-950 to-slate-950'} px-8 pt-8 pb-6 flex flex-col items-center`}>
          {module.thumbnail ? (
            <img
              src={module.thumbnail}
              alt={module.title}
              className="w-40 h-40 rounded-2xl object-cover shadow-2xl mb-6"
            />
          ) : (
            <div className={`w-40 h-40 rounded-2xl flex items-center justify-center shadow-2xl mb-6 ${isPodcast ? 'bg-purple-800/50' : 'bg-orange-800/50'}`}>
              <span className="text-7xl">{isPodcast ? '🎙️' : '🎵'}</span>
            </div>
          )}

          <p className="text-white font-bold text-lg text-center leading-snug">{module.title}</p>
          {module.description && (
            <p className="text-slate-400 text-sm text-center mt-1.5 line-clamp-2 leading-relaxed">{module.description}</p>
          )}
        </div>

        {/* Controls */}
        <div className="bg-slate-900 px-6 py-5 border-t border-slate-800">
          {/* Hidden audio element */}
          <audio
            ref={audioRef}
            src={src}
            onTimeUpdate={() => {
              if (audioRef.current) {
                const cur = audioRef.current.currentTime;
                const dur = audioRef.current.duration || 0;
                setProgress(dur ? (cur / dur) * 100 : 0);
                setCurrentTime(fmt(cur));
              }
            }}
            onLoadedMetadata={() => {
              if (audioRef.current) setTotalTime(fmt(audioRef.current.duration));
            }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            muted={muted}
          />

          {/* Progress bar */}
          <div
            className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2 cursor-pointer"
            onClick={seek}
          >
            <div
              className={`h-full rounded-full transition-all ${isPodcast ? 'bg-purple-500' : 'bg-orange-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mb-5">
            <span>{currentTime}</span>
            <span>{totalTime}</span>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-center gap-5">
            {isPodcast && (
              <button
                onClick={() => skip(-15)}
                className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                title="Back 15s"
              >
                <SkipBack size={20} />
              </button>
            )}

            <button
              onClick={togglePlay}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
                isPodcast ? 'bg-purple-600 hover:bg-purple-700' : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              {playing
                ? <Pause size={22} className="text-white" />
                : <Play size={22} className="text-white ml-0.5" />}
            </button>

            {isPodcast && (
              <button
                onClick={() => skip(30)}
                className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                title="Forward 30s"
              >
                <SkipForward size={20} />
              </button>
            )}

            <button
              onClick={() => setMuted(!muted)}
              className="ml-4 p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
