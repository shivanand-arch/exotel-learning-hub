import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEY, CQA_SYSTEM_INSTRUCTION, GEMINI_CHAT_MODEL, GEMINI_TTS_MODEL } from '../config/constants';
import type { ChatMessage } from '../types';

class GeminiService {
  private client: GoogleGenAI | null = null;

  private getClient(): GoogleGenAI {
    if (!this.client) {
      if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured. Set VITE_GEMINI_API_KEY in your .env.local file.');
      }
      this.client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    }
    return this.client;
  }

  async generateChatResponse(
    messages: ChatMessage[],
    systemInstruction?: string,
    additionalContext?: string,
  ): Promise<string> {
    const client = this.getClient();
    const sysInstr = (systemInstruction || CQA_SYSTEM_INSTRUCTION) +
      (additionalContext ? '\n\nADDITIONAL CONTEXT:\n' + additionalContext : '');

    const contents = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const response = await client.models.generateContent({
      model: GEMINI_CHAT_MODEL,
      contents,
      config: {
        systemInstruction: sysInstr,
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    return response.text || 'I encountered an issue. Please try again.';
  }

  async generateQuickResponse(prompt: string): Promise<string> {
    const client = this.getClient();
    const response = await client.models.generateContent({
      model: GEMINI_CHAT_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { systemInstruction: CQA_SYSTEM_INSTRUCTION, temperature: 0.7 },
    });
    return response.text || '';
  }

  async textToSpeech(text: string): Promise<string | null> {
    if (!GEMINI_API_KEY) return null;
    try {
      const client = this.getClient();
      const response = await client.models.generateContent({
        model: GEMINI_TTS_MODEL,
        contents: [{ parts: [{ text: text.substring(0, 500) }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        } as any,
      });
      return (response as any).candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (e) {
      console.error('TTS error', e);
      return null;
    }
  }
}

export const geminiService = new GeminiService();
