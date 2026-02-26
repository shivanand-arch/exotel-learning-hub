import { useState, useRef, useEffect } from 'react';
import { Mic, Volume2, AlertCircle, Loader2, Sparkles, PhoneOff } from 'lucide-react';
import { GEMINI_API_KEY, GEMINI_LIVE_MODEL } from '../config/constants';

type SessionState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

interface TranscriptEntry {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export function VoiceMode() {
  const [state, setState] = useState<SessionState>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const sessionRef = useRef<unknown>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number>(0);
  const nextStartRef = useRef(0);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Scroll transcript into view when updated
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      try { (sessionRef.current as any)?.close(); } catch {}
      outputCtxRef.current?.close();
    };
  }, []);

  function encodeBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function decodeBase64(b64: string): Uint8Array {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  async function playAudioChunk(data: Uint8Array, ctx: AudioContext) {
    const int16 = new Int16Array(data.buffer);
    const buf = ctx.createBuffer(1, int16.length, 24000);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < int16.length; i++) ch[i] = int16[i] / 32768;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    const startTime = Math.max(nextStartRef.current, ctx.currentTime);
    src.start(startTime);
    nextStartRef.current = startTime + buf.duration;
  }

  function trackAudioLevel(analyser: AnalyserNode) {
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      // Use lower frequencies (voice range) for better visualization
      const avg = Array.from(data.slice(0, 16)).reduce((a, b) => a + b, 0) / 16;
      setAudioLevel(Math.min(1, (avg / 255) * 2));
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }

  const startSession = async () => {
    if (!GEMINI_API_KEY) {
      setError('Gemini API key not configured. Contact your administrator.');
      setState('error');
      return;
    }

    setState('connecting');
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

      const outputCtx = new AudioContext({ sampleRate: 24000 });
      const inputCtx = new AudioContext({ sampleRate: 16000 });
      outputCtxRef.current = outputCtx;
      nextStartRef.current = 0;

      // Analyser for live mic level visualization
      const analyser = inputCtx.createAnalyser();
      analyser.fftSize = 256;

      const { GoogleGenAI, Modality } = await import('@google/genai');
      const ai = new (GoogleGenAI as any)({ apiKey: GEMINI_API_KEY });

      const session = await ai.live.connect({
        model: GEMINI_LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: 'You are the Exotel Hub Voice Coach — an expert in CQA (Conversation Quality Analysis) and Exotel products. Help employees learn, prepare for sales demos, and understand architecture. Be concise: 1-3 spoken sentences unless genuinely needed. Speak warmly and professionally. Never use markdown or bullet points in spoken responses.',
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          // Enable real-time transcriptions for both user and AI speech
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setState('listening');

            // Wire mic → analyser → processor → session
            const source = inputCtx.createMediaStreamSource(stream);
            source.connect(analyser);

            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              if (sessionRef.current) {
                const data = e.inputBuffer.getChannelData(0);
                const int16 = new Int16Array(data.length);
                for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
                (sessionRef.current as any).sendRealtimeInput({
                  media: { data: encodeBase64(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' },
                });
              }
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);

            trackAudioLevel(analyser);
          },

          onmessage: async (msg: any) => {
            // Play AI audio chunks
            const parts = msg.serverContent?.modelTurn?.parts ?? [];
            let hasAudio = false;
            for (const part of parts) {
              if (part.inlineData?.data) {
                hasAudio = true;
                const chunk = decodeBase64(part.inlineData.data);
                await playAudioChunk(chunk, outputCtx);
              }
            }
            if (hasAudio) setState('speaking');

            // Turn complete → back to listening
            if (msg.serverContent?.turnComplete) {
              setState('listening');
            }

            // User speech transcription
            const inputText = msg.serverContent?.inputTranscription?.text?.trim();
            if (inputText) {
              setTranscript(prev => {
                const last = prev[prev.length - 1];
                // Append to last user entry if it's still the same turn
                if (last?.role === 'user') {
                  return [...prev.slice(0, -1), { ...last, text: last.text + ' ' + inputText }];
                }
                return [...prev, { id: Date.now().toString(), role: 'user', text: inputText }];
              });
            }

            // AI speech transcription
            const outputText = msg.serverContent?.outputTranscription?.text?.trim();
            if (outputText) {
              setTranscript(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return [...prev.slice(0, -1), { ...last, text: last.text + ' ' + outputText }];
                }
                return [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', text: outputText }];
              });
            }
          },

          onerror: (e: Error) => {
            setError(`Connection error: ${e.message}`);
            setState('error');
            cancelAnimationFrame(animFrameRef.current);
            setAudioLevel(0);
          },

          onclose: () => {
            cancelAnimationFrame(animFrameRef.current);
            setAudioLevel(0);
            if (state !== 'error') setState('idle');
          },
        },
      });

      sessionRef.current = session;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to start voice session';
      setError(msg);
      setState('error');
    }
  };

  const stopSession = () => {
    cancelAnimationFrame(animFrameRef.current);
    try { (sessionRef.current as any)?.close(); } catch {}
    sessionRef.current = null;
    outputCtxRef.current?.close();
    outputCtxRef.current = null;
    setAudioLevel(0);
    setState('idle');
  };

  const isActive = state === 'listening' || state === 'speaking';

  // Waveform bars — 9 bars with sinusoidal amplitude profile
  const BAR_COUNT = 9;
  const waveformBars = Array.from({ length: BAR_COUNT }, (_, i) => {
    const profile = Math.sin((i / (BAR_COUNT - 1)) * Math.PI); // bell curve
    const minH = 4;
    const maxH = 48;
    const h = state === 'speaking'
      ? minH + profile * maxH * (0.5 + 0.5 * Math.random()) // randomise slightly for AI speech
      : minH + profile * maxH * audioLevel;
    return Math.max(minH, h);
  });

  return (
    <div className="animate-in-up max-w-2xl mx-auto space-y-5">

      {/* ── Main voice card ────────────────────────────────── */}
      <div className="bg-slate-950 rounded-3xl overflow-hidden shadow-2xl">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-1">
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-red-400" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Gemini Live Audio</span>
          </div>
          {isActive && (
            <button
              onClick={stopSession}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 rounded-full border border-red-900 hover:bg-red-950"
            >
              <PhoneOff size={12} />
              End Session
            </button>
          )}
        </div>

        {/* Orb + waveform */}
        <div className="flex flex-col items-center pt-6 pb-10 px-6 relative">

          {/* Waveform bars (visible when active) */}
          <div className={`flex items-end justify-center gap-1.5 h-14 mb-6 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
            {waveformBars.map((h, i) => (
              <div
                key={i}
                className={`w-2 rounded-full transition-all ${state === 'speaking' ? 'bg-emerald-500' : 'bg-red-500'}`}
                style={{ height: `${h}px`, transitionDuration: state === 'speaking' ? '200ms' : '75ms' }}
              />
            ))}
          </div>
          {!isActive && <div className="h-14 mb-6" />}

          {/* Big button */}
          <button
            onClick={isActive ? stopSession : startSession}
            disabled={state === 'connecting'}
            className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl focus:outline-none ${
              state === 'active' || state === 'listening'
                ? 'bg-red-600 hover:bg-red-700 shadow-red-900/50'
                : state === 'speaking'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/50'
                : state === 'connecting'
                ? 'bg-slate-700 cursor-not-allowed'
                : state === 'error'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-slate-800 hover:bg-slate-700 border-2 border-slate-600'
            }`}
          >
            {/* Pulse rings */}
            {state === 'listening' && (
              <>
                <div className="absolute inset-0 rounded-full bg-red-500/25 animate-ping" style={{ animationDuration: '1.6s' }} />
                <div className="absolute inset-[-10px] rounded-full border border-red-500/20 animate-ping" style={{ animationDuration: '2.2s' }} />
              </>
            )}
            {state === 'speaking' && (
              <div className="absolute inset-0 rounded-full bg-emerald-500/25 animate-ping" style={{ animationDuration: '1s' }} />
            )}

            {state === 'connecting' ? (
              <Loader2 size={36} className="animate-spin text-slate-300" />
            ) : state === 'speaking' ? (
              <Volume2 size={36} className="text-white" />
            ) : state === 'error' ? (
              <AlertCircle size={36} className="text-white" />
            ) : (
              <Mic size={36} className={state === 'idle' ? 'text-slate-300' : 'text-white'} />
            )}
          </button>

          {/* Status text */}
          <div className="text-center mt-7">
            <p className="text-white font-semibold text-xl">
              {state === 'idle' && 'Start Voice Session'}
              {state === 'connecting' && 'Connecting...'}
              {state === 'listening' && 'Listening'}
              {state === 'speaking' && 'AI Responding'}
              {state === 'error' && 'Connection Failed'}
            </p>
            <p className="text-slate-500 text-sm mt-1.5">
              {state === 'idle' && 'Tap the mic to speak with your AI coach'}
              {state === 'connecting' && 'Requesting microphone & establishing connection...'}
              {state === 'listening' && 'Speak naturally — I\'m ready to help'}
              {state === 'speaking' && 'AI is speaking — tap to stop'}
              {state === 'error' && 'Tap to retry'}
            </p>
          </div>

          {/* Error detail */}
          {error && (
            <div className="mt-5 w-full p-3.5 rounded-2xl bg-red-950/80 border border-red-800/40">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Transcript ─────────────────────────────────────── */}
      {transcript.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 size={14} className="text-slate-400" />
              <span className="text-sm font-semibold text-slate-800">Live Transcript</span>
              {isActive && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
            </div>
            <button
              onClick={() => setTranscript([])}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="p-5 space-y-3 max-h-72 overflow-y-auto">
            {transcript.map(t => (
              <div key={t.id} className={`flex gap-2 ${t.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  t.role === 'user'
                    ? 'bg-slate-900 text-white rounded-tr-sm'
                    : 'bg-slate-50 border border-slate-200 text-slate-700 rounded-tl-sm'
                }`}>
                  {t.text}
                </div>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}

      {/* ── Feature highlights ─────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: '🎙️', title: 'Real-time', desc: 'Sub-second responses' },
          { icon: '📝', title: 'Transcribed', desc: 'Live conversation log' },
          { icon: '🧠', title: 'CQA Expert', desc: 'Deep product knowledge' },
        ].map(f => (
          <div key={f.title} className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
            <div className="text-2xl mb-1.5">{f.icon}</div>
            <p className="font-semibold text-slate-900 text-sm">{f.title}</p>
            <p className="text-slate-400 text-xs mt-0.5">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
