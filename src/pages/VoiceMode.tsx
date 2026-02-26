import { useState, useRef } from 'react';
import { Mic, Volume2, AlertCircle, Loader2, StopCircle, Sparkles } from 'lucide-react';
import { GEMINI_API_KEY, GEMINI_LIVE_MODEL } from '../config/constants';

type ConnectionState = 'idle' | 'connecting' | 'active' | 'error';

export function VoiceMode() {
  const [state, setState] = useState<ConnectionState>('idle');
  const [transcript, setTranscript] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [statusText, setStatusText] = useState('Ready to start voice session');
  const [error, setError] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextStartRef = useRef(0);
  const sessionRef = useRef<unknown>(null);

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

  const startSession = async () => {
    if (!GEMINI_API_KEY) {
      setError('Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env.local file.');
      setState('error');
      return;
    }

    setState('connecting');
    setError(null);
    setStatusText('Requesting microphone access...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStatusText('Connecting to Gemini...');

      const outputCtx = new AudioContext({ sampleRate: 24000 });
      const inputCtx = new AudioContext({ sampleRate: 16000 });
      audioCtxRef.current = outputCtx;
      nextStartRef.current = 0;

      const { GoogleGenAI, Modality } = await import('@google/genai');
      const ai = new (GoogleGenAI as any)({ apiKey: GEMINI_API_KEY });

      const session = await ai.live.connect({
        model: GEMINI_LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: 'You are the Exotel Hub Voice Coach. Help employees learn about CQA and Exotel products. Be concise, warm, and professional. Answers should be spoken naturally in 1-3 sentences unless a longer answer is truly needed.',
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
        },
        callbacks: {
          onopen: () => {
            setStatusText('Connected! Start speaking...');
            setState('active');

            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = e => {
              if (sessionRef.current) {
                const data = e.inputBuffer.getChannelData(0);
                const int16 = new Int16Array(data.length);
                for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
                (sessionRef.current as any).sendRealtimeInput({
                  media: { data: encodeBase64(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' }
                });
              }
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: any) => {
            const part = msg.serverContent?.modelTurn?.parts?.[0];
            if (part?.inlineData?.data) {
              const chunk = decodeBase64(part.inlineData.data);
              await playAudioChunk(chunk, outputCtx);
              setStatusText('AI is speaking...');
            }
            if (msg.serverContent?.turnComplete) {
              setStatusText('Listening...');
            }
            const textPart = msg.serverContent?.modelTurn?.parts?.find((p: any) => p.text);
            if (textPart?.text) {
              setTranscript(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return [...prev.slice(0, -1), { role: 'assistant', text: last.text + textPart.text }];
                }
                return [...prev, { role: 'assistant', text: textPart.text }];
              });
            }
            const inputText = msg.clientContent?.turns?.find((t: any) => t.role === 'user')?.parts?.[0]?.text;
            if (inputText) {
              setTranscript(prev => [...prev, { role: 'user', text: inputText }]);
            }
          },
          onerror: (e: Error) => {
            setError(`Connection error: ${e.message}`);
            setState('error');
          },
          onclose: () => {
            setState('idle');
            setStatusText('Session ended.');
          },
        },
      });

      sessionRef.current = session;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to start voice session';
      setError(msg);
      setState('error');
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      try { (sessionRef.current as any).close(); } catch {}
      sessionRef.current = null;
    }
    audioCtxRef.current?.close();
    setState('idle');
    setStatusText('Session ended.');
  };

  return (
    <div className="animate-in-up max-w-2xl mx-auto space-y-6">
      {/* Main voice card */}
      <div className="bg-slate-950 rounded-3xl p-8 text-white text-center relative overflow-hidden">
        {/* Background rings */}
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-500 ${state === 'active' ? 'opacity-100' : 'opacity-0'}`}>
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="absolute rounded-full border border-red-600/20"
              style={{ width: `${i * 120}px`, height: `${i * 120}px`, animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>

        {/* Status badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 mb-6">
          <Sparkles size={11} className="text-red-400" />
          Gemini Live Audio
        </div>

        {/* Mic button */}
        <div className="flex justify-center mb-6">
          <div className={`relative ${state === 'active' ? 'scale-110' : ''} transition-transform duration-300`}>
            {/* Pulse rings when active */}
            {state === 'active' && (
              <>
                <div className="absolute inset-0 rounded-full bg-red-600/20 animate-ping scale-125" />
                <div className="absolute inset-0 rounded-full bg-red-600/10 animate-ping scale-150" style={{ animationDelay: '300ms' }} />
              </>
            )}
            <button
              onClick={state === 'idle' || state === 'error' ? startSession : stopSession}
              disabled={state === 'connecting'}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                state === 'active'
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-900/50'
                  : state === 'connecting'
                  ? 'bg-slate-700 cursor-not-allowed'
                  : state === 'error'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-slate-800 hover:bg-slate-700 border-2 border-slate-600'
              }`}
            >
              {state === 'connecting' ? (
                <Loader2 size={32} className="animate-spin text-slate-300" />
              ) : state === 'active' ? (
                <StopCircle size={32} className="text-white" />
              ) : state === 'error' ? (
                <AlertCircle size={32} className="text-white" />
              ) : (
                <Mic size={32} className="text-slate-300" />
              )}
            </button>
          </div>
        </div>

        {/* Status text */}
        <p className="text-slate-300 font-medium text-base mb-1">{statusText}</p>
        <p className="text-slate-600 text-xs">
          {state === 'idle' ? 'Click the mic to start a voice session with your AI coach' :
           state === 'active' ? 'Speak naturally — click to stop' :
           state === 'connecting' ? 'Establishing connection...' : ''}
        </p>

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-950 border border-red-800/50 text-left">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Transcript */}
      {transcript.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 size={15} className="text-slate-500" />
              <h3 className="font-semibold text-slate-900 text-sm">Conversation Transcript</h3>
            </div>
            <button
              onClick={() => setTranscript([])}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="p-6 space-y-3 max-h-80 overflow-y-auto">
            {transcript.map((t, i) => (
              <div key={i} className={`flex gap-2 ${t.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  t.role === 'user'
                    ? 'bg-slate-900 text-white rounded-tr-sm'
                    : 'bg-slate-50 border border-slate-200 text-slate-700 rounded-tl-sm'
                }`}>
                  {t.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feature notes */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: '🎙️', title: 'Real-time', desc: 'Sub-second response latency' },
          { icon: '🧠', title: 'Context-aware', desc: 'Knows CQA and your content' },
          { icon: '🔊', title: 'Natural speech', desc: 'Gemini Zephyr voice' },
        ].map(f => (
          <div key={f.title} className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
            <div className="text-2xl mb-2">{f.icon}</div>
            <p className="font-semibold text-slate-900 text-sm">{f.title}</p>
            <p className="text-slate-400 text-xs mt-0.5">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
