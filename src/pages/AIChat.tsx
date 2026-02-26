import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Volume2, Loader2, Sparkles, RotateCcw } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { useApp } from '../contexts/AppContext';
import type { ChatMessage } from '../types';
import { CQA_SYSTEM_INSTRUCTION } from '../config/constants';

const QUICK_PROMPTS = [
  'Explain CQA value proposition',
  'What is a Quality Profile?',
  'How does 100% coverage help vs 10% sampling?',
  'Walk me through the CQA architecture',
  'How does the LLM reasoning work?',
  'Calculate ROI for a 1M minute/month contact center',
];

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function MessageBubble({ msg, onSpeak, isSpeaking }: { msg: ChatMessage; onSpeak: (id: string, text: string) => void; isSpeaking: string | null }) {
  const isUser = msg.role === 'user';

  // Simple markdown renderer
  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
        isUser ? 'bg-slate-900 text-white' : 'bg-red-50 text-red-600 border border-red-100'
      }`}>
        {isUser ? <User size={15} /> : <Bot size={15} />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] space-y-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-slate-900 text-white rounded-tr-sm'
            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
        }`}>
          {isUser ? (
            <p>{msg.content}</p>
          ) : (
            <div
              className="chat-markdown"
              dangerouslySetInnerHTML={{ __html: '<p>' + renderMarkdown(msg.content) + '</p>' }}
            />
          )}
        </div>
        <div className={`flex items-center gap-2 px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-slate-400">{formatTime(msg.timestamp)}</span>
          {!isUser && (
            <button
              onClick={() => onSpeak(msg.id, msg.content)}
              className={`flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded transition-colors ${
                isSpeaking === msg.id ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Volume2 size={10} />
              {isSpeaking === msg.id ? 'Speaking...' : 'Listen'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AIChat() {
  const { modules, teams } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'welcome',
    role: 'assistant',
    content: `Hello! I'm your Exotel Hub AI assistant, powered by Gemini. I can help you:\n\n- **Learn about CQA** and Exotel products\n- **Prepare for sales pitches** with ROI calculations\n- **Understand technical architecture** and integrations\n- **Answer any questions** about your uploaded learning content\n\nWhat would you like to explore today?`,
    timestamp: new Date().toISOString(),
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  const buildContext = () => {
    const moduleList = modules.slice(0, 20).map(m => {
      const team = teams.find(t => t.id === m.teamId);
      return `- [${m.type.toUpperCase()}] "${m.title}" (${team?.name || 'Unknown team'}): ${m.description}`;
    }).join('\n');
    return moduleList ? `\n\nAVAILABLE LEARNING CONTENT:\n${moduleList}` : '';
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setError(null);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await geminiService.generateChatResponse(
        newMessages,
        CQA_SYSTEM_INSTRUCTION,
        buildContext()
      );
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      }]);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Failed to get a response. Please try again.';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const speak = async (msgId: string, text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(msgId);
    try {
      const audioData = await geminiService.textToSpeech(text);
      if (audioData) {
        const ctx = new AudioContext({ sampleRate: 24000 });
        audioCtxRef.current = ctx;
        const binary = atob(audioData);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const int16 = new Int16Array(bytes.buffer);
        const buf = ctx.createBuffer(1, int16.length, 24000);
        const ch = buf.getChannelData(0);
        for (let i = 0; i < int16.length; i++) ch[i] = int16[i] / 32768;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.onended = () => setIsSpeaking(null);
        src.start();
      } else {
        setIsSpeaking(null);
      }
    } catch { setIsSpeaking(null); }
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome-' + Date.now(),
      role: 'assistant',
      content: 'Chat cleared! How can I help you?',
      timestamp: new Date().toISOString(),
    }]);
  };

  return (
    <div className="animate-in-up flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-t-3xl border border-slate-200 border-b-0 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-sm">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Exotel AI Assistant</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-500">Powered by Gemini · Knows your content</span>
            </div>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          title="Clear chat"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-slate-50/80 border-x border-slate-200 p-6 space-y-5">
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} onSpeak={speak} isSpeaking={isSpeaking} />
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shrink-0">
              <Bot size={15} />
            </div>
            <div className="flex items-center gap-1 px-4 py-3 bg-white border border-slate-200 rounded-2xl rounded-tl-sm">
              {[0, 150, 300].map(d => (
                <div key={d} className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-600">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="bg-white rounded-b-3xl border border-slate-200 border-t-0 px-6 pt-4 pb-5 space-y-3">
        {/* Quick prompts */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {QUICK_PROMPTS.map(p => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              disabled={isLoading}
              className="shrink-0 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={e => { e.preventDefault(); sendMessage(input); }}
          className="flex items-center gap-3 bg-slate-100 rounded-2xl px-4 py-3 border border-slate-200 focus-within:border-red-400 focus-within:ring-1 focus-within:ring-red-400 transition-all"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask anything about Exotel products..."
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-9 h-9 flex items-center justify-center bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-xl transition-all active:scale-95"
          >
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </form>
      </div>
    </div>
  );
}
