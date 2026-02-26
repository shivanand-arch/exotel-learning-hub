import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, Presentation } from 'lucide-react';
import type { ContentModule } from '../../types';
import { CQA_SLIDES } from '../../config/constants';

const SLIDE_COLORS: Record<string, string> = {
  red: 'from-red-600 to-red-700',
  blue: 'from-blue-600 to-blue-700',
  emerald: 'from-emerald-600 to-emerald-700',
  violet: 'from-violet-600 to-violet-700',
  orange: 'from-orange-500 to-orange-600',
  teal: 'from-teal-600 to-teal-700',
  slate: 'from-slate-700 to-slate-800',
};

interface Props {
  module: ContentModule;
  blobUrl: string | null;
  onClose: () => void;
}

export function PDFViewerModal({ module, blobUrl, onClose }: Props) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [zoom, setZoom] = useState(1);

  // For CQA built-in slides module
  const isBuiltinSlides = module.id === 'mod-cqa-slides' || module.id === 'mod-sales-pitch';
  const slides = isBuiltinSlides ? CQA_SLIDES : [];

  const total = isBuiltinSlides ? slides.length : 1;
  const slide = isBuiltinSlides ? slides[currentSlide] : null;
  const colorGradient = slide?.color ? SLIDE_COLORS[slide.color] || SLIDE_COLORS.slate : SLIDE_COLORS.slate;

  const prev = () => setCurrentSlide(s => Math.max(0, s - 1));
  const next = () => setCurrentSlide(s => Math.min(total - 1, s + 1));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl overflow-hidden w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center">
              <Presentation size={14} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{module.title}</h3>
              {total > 1 && (
                <p className="text-slate-400 text-xs mt-0.5">
                  Slide {currentSlide + 1} of {total} · Use ← → keys to navigate
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
              <ZoomOut size={15} />
            </button>
            <span className="text-xs font-semibold text-slate-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
              <ZoomIn size={15} />
            </button>
            {blobUrl && (
              <a href={blobUrl} download={module.fileName} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
                <Download size={15} />
              </a>
            )}
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-slate-100 p-8 flex items-center justify-center">
          {blobUrl && !isBuiltinSlides ? (
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}>
              {module.type === 'pdf' || module.fileType?.includes('pdf') ? (
                <iframe src={blobUrl} className="w-[700px] h-[500px] rounded-xl shadow-2xl bg-white" title={module.title} />
              ) : (
                <div className="w-[700px] h-[500px] rounded-xl shadow-2xl bg-white flex flex-col items-center justify-center gap-4 p-8">
                  <div className="text-5xl">📄</div>
                  <p className="font-bold text-slate-900 text-lg text-center">{module.title}</p>
                  <p className="text-slate-500 text-sm text-center">{module.fileName}</p>
                  <a href={blobUrl} download={module.fileName} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2">
                    <Download size={15} />
                    Download to view
                  </a>
                </div>
              )}
            </div>
          ) : slide ? (
            <div
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}
              className={`w-[700px] min-h-[400px] rounded-2xl bg-gradient-to-br ${colorGradient} p-10 text-white shadow-2xl flex flex-col justify-between`}
            >
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-bold uppercase tracking-widest mb-6">
                  <span>Module {slide.id}</span>
                </div>
                <h2 className="text-3xl font-black mb-4 leading-tight">{slide.title}</h2>
                <p className="text-white/80 text-base leading-relaxed mb-6">{slide.content}</p>
              </div>
              <div className="space-y-2">
                {slide.bullets.map((b, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                    <span className="text-white font-medium text-sm">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 py-20">
              <p>No preview available for this file type.</p>
              {blobUrl && (
                <a href={blobUrl} download className="mt-3 text-blue-600 hover:underline text-sm block">Download file</a>
              )}
            </div>
          )}
        </div>

        {/* Navigation footer */}
        {total > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={prev}
              disabled={currentSlide === 0}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 text-sm font-semibold rounded-xl transition-all"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            {/* Dot indicators */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.min(total, 16) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`rounded-full transition-all ${
                    i === currentSlide ? 'w-4 h-2 bg-slate-900' : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
              {total > 16 && <span className="text-xs text-slate-400 ml-1">+{total - 16}</span>}
            </div>

            <button
              onClick={next}
              disabled={currentSlide === total - 1}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
