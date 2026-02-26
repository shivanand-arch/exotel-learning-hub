import { useRef, useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import type { ContentModule } from '../../types';

interface Props {
  module: ContentModule;
  blobUrl: string | null;
  onClose: () => void;
}

export function VideoPlayerModal({ module, blobUrl, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  const src = blobUrl || module.url || '';

  const isYouTube = src.includes('youtube.com') || src.includes('youtu.be');
  const isVimeo = src.includes('vimeo.com');

  const getYouTubeId = (url: string) => {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return m ? m[1] : '';
  };

  const getVimeoId = (url: string) => {
    const m = url.match(/vimeo\.com\/(\d+)/);
    return m ? m[1] : '';
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); } else { videoRef.current.play(); }
    setPlaying(!playing);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900 rounded-3xl overflow-hidden w-full max-w-4xl shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-xl flex items-center justify-center">
              <Play size={14} className="text-white ml-0.5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">{module.title}</h3>
              <p className="text-slate-500 text-xs mt-0.5 truncate max-w-xs">{module.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Video area */}
        <div className="relative bg-black aspect-video">
          {isYouTube ? (
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${getYouTubeId(src)}?autoplay=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : isVimeo ? (
            <iframe
              className="w-full h-full"
              src={`https://player.vimeo.com/video/${getVimeoId(src)}?autoplay=1`}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              ref={videoRef}
              src={src}
              className="w-full h-full"
              onTimeUpdate={() => {
                if (videoRef.current) {
                  setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
                }
              }}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
              muted={muted}
              controls
            />
          )}
        </div>

        {/* Custom progress bar for non-embed */}
        {!isYouTube && !isVimeo && (
          <div className="px-6 py-4 bg-slate-900 border-t border-slate-800">
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-4 cursor-pointer" onClick={e => {
              if (!videoRef.current) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const p = (e.clientX - rect.left) / rect.width;
              videoRef.current.currentTime = p * videoRef.current.duration;
            }}>
              <div className="h-full bg-red-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center gap-4">
              <button onClick={togglePlay} className="p-2 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all">
                {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
              </button>
              <button onClick={() => setMuted(!muted)} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all">
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <button
                onClick={() => videoRef.current?.requestFullscreen()}
                className="ml-auto p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
              >
                <Maximize2 size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
