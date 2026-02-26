import type { Team, ContentModule, Slide } from '../types';

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
export const ALLOWED_DOMAIN = 'exotel.com';

// Comma-separated list of L&D admin emails — set via VITE_ADMIN_EMAILS GitHub secret.
// Admins can upload content, create teams, and access the Content Manager.
// Everyone else on @exotel.com can view content only.
export const ADMIN_EMAILS: string[] = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
export const APP_NAME = 'Exotel Hub';
export const DB_NAME = 'exotel-hub-db';
export const DB_VERSION = 1;

// ─── Gemini Model Config ──────────────────────────────────────────────────────
export const GEMINI_CHAT_MODEL = 'gemini-2.0-flash';
export const GEMINI_LIVE_MODEL = 'gemini-2.0-flash-live-001';
export const GEMINI_TTS_MODEL = 'gemini-2.0-flash';  // TTS via AUDIO modality

export const TEAM_COLORS = [
  { name: 'red', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', badge: 'bg-red-100 text-red-700', accent: '#E53935' },
  { name: 'blue', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', accent: '#1E88E5' },
  { name: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', accent: '#43A047' },
  { name: 'violet', bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700', accent: '#7C3AED' },
  { name: 'orange', bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', accent: '#FB8C00' },
  { name: 'teal', bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200', badge: 'bg-teal-100 text-teal-700', accent: '#00897B' },
  { name: 'pink', bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200', badge: 'bg-pink-100 text-pink-700', accent: '#E91E8C' },
  { name: 'amber', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', accent: '#FFB300' },
];

export const MODULE_TYPE_META: Record<string, { label: string; icon: string; accept: string; color: string }> = {
  video: { label: 'Video', icon: '🎬', accept: 'video/*', color: 'text-red-600 bg-red-50' },
  audio: { label: 'Audio', icon: '🎵', accept: 'audio/*', color: 'text-orange-600 bg-orange-50' },
  podcast: { label: 'Podcast', icon: '🎙️', accept: 'audio/*', color: 'text-purple-600 bg-purple-50' },
  pdf: { label: 'PDF', icon: '📄', accept: 'application/pdf', color: 'text-blue-600 bg-blue-50' },
  document: { label: 'Document', icon: '📝', accept: '.doc,.docx,.ppt,.pptx,.txt', color: 'text-emerald-600 bg-emerald-50' },
  slides: { label: 'Slides', icon: '🖼️', accept: '.pdf,.ppt,.pptx', color: 'text-violet-600 bg-violet-50' },
  link: { label: 'Link / URL', icon: '🔗', accept: '', color: 'text-teal-600 bg-teal-50' },
};

// ─── Seed Data: Default CQA Team + Modules ───────────────────────────────────
export const DEFAULT_TEAMS: Team[] = [
  {
    id: 'team-cqa',
    name: 'CQA — Conversation Quality Analysis',
    description: 'AI-powered contact center quality assurance. 100% call coverage, 60% cost reduction.',
    color: 'red',
    icon: '🎯',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'team-sales',
    name: 'Sales Excellence',
    description: 'Pitch mastery, ROI models, competitive landscape, and objection handling.',
    color: 'orange',
    icon: '🚀',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'team-tech',
    name: 'Technical Mastery',
    description: 'Architecture deep-dives, API references, and integration guides.',
    color: 'blue',
    icon: '⚡',
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_MODULES: ContentModule[] = [
  {
    id: 'mod-cqa-intro-video',
    teamId: 'team-cqa',
    title: 'Introduction to Exotel CQA',
    description: 'Transform QA from 10% sampling to 100% coverage. 60% cost reduction, 90%+ accuracy.',
    type: 'video',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bbda38a594a8?auto=format&fit=crop&q=80&w=800',
    duration: '01:50',
    tags: ['intro', 'cqa', 'overview'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mod-cqa-personas-video',
    teamId: 'team-cqa',
    title: 'CQA User Personas Guide',
    description: 'Administrators, Supervisors, and Agents in the CQA ecosystem.',
    type: 'video',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=800',
    duration: '02:00',
    tags: ['personas', 'cqa', 'training'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mod-cqa-slides',
    teamId: 'team-cqa',
    title: 'CQA Knowledge Deck — 16 Modules',
    description: 'Complete slide deck covering all CQA concepts from basics to advanced architecture.',
    type: 'slides',
    tags: ['slides', 'cqa', 'knowledge'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mod-sales-pitch',
    teamId: 'team-sales',
    title: 'CQA Sales Pitch Framework',
    description: 'ROI calculator, competitive positioning, and objection handling for enterprise deals.',
    type: 'slides',
    tags: ['sales', 'pitch', 'roi'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ─── CQA Built-in Slides ─────────────────────────────────────────────────────
export const CQA_SLIDES: Slide[] = [
  { id: 1, title: 'Introduction to CQA', content: 'Conversation Quality Analysis (CQA) is an AI-powered platform that automatically analyzes every customer interaction — not just a sample.', bullets: ['100% Call Coverage', 'Instant AI Analysis', '60%+ Cost Savings'], color: 'red' },
  { id: 2, title: 'The Problem: Manual QA', content: 'Traditional QA teams can only review 2–5% of calls. This creates blind spots, inconsistency, and massive operational overhead.', bullets: ['2–5% sampling = 95% blind spots', 'Human bias and inconsistency', 'Weeks of lag before insights'], color: 'slate' },
  { id: 3, title: 'The CQA Solution', content: 'CQA replaces manual sampling with 100% automated analysis using large language models trained on your quality standards.', bullets: ['Every call analyzed in minutes', '>90% accuracy vs human reviewers', 'Consistent, bias-free scoring'], color: 'emerald' },
  { id: 4, title: 'User Personas: Administrators', content: 'Administrators are the architects who configure CQA quality standards, assign profiles, and manage users.', bullets: ['Define Quality Profiles & Scoring Rubrics', 'Set automation and routing rules', 'Manage team access and permissions'], color: 'violet' },
  { id: 5, title: 'User Personas: Supervisors', content: 'Supervisors use CQA daily to monitor team health, spot high-risk calls, and coach agents.', bullets: ['Real-time team performance monitoring', 'Identify high-stakes calls instantly', 'Dispute resolution and calibration'], color: 'blue' },
  { id: 6, title: 'User Personas: Agents', content: 'Agents receive transparent, objective feedback on every call — turning every interaction into a coaching moment.', bullets: ['Instant post-call score visibility', 'Personalized improvement areas', 'Dispute AI scores with evidence'], color: 'orange' },
  { id: 7, title: 'The 60% Cost Reduction', content: 'CQA dramatically reduces QA operational costs by automating the work of large review teams.', bullets: ['Automation vs large QA headcount', 'Faster audit turnaround (minutes vs weeks)', 'Lower overhead per agent reviewed'], color: 'red' },
  { id: 8, title: 'Complete Visibility (100%)', content: 'Move from 2–5% manual sampling to 100% coverage, eliminating compliance blind spots forever.', bullets: ['Every interaction audited', 'Regulatory compliance confidence', 'No more missed risk events'], color: 'teal' },
  { id: 9, title: 'Accuracy & Consistency', content: 'CQA delivers >90% accuracy at scale, maintaining consistency that human reviewers cannot match.', bullets: ['>90% accuracy vs expert reviewers', 'Bias-free automated evaluation', 'Calibrated across all teams'], color: 'emerald' },
  { id: 10, title: 'CQA Core Architecture', content: 'Understand the data flow from telephony ingestion through intelligence engine to scoring output.', bullets: ['C1: Metadata & Call Ingestion', 'C2: AI Analysis & Reasoning Engine', 'C3: Scoring, Output & CRM Push'], color: 'slate' },
  { id: 11, title: 'Defining Quality Profiles', content: 'Quality Profiles define what a "good call" looks like for each campaign, product, or regulation.', bullets: ['KPI configuration per campaign', 'Positive / Negative indicator mapping', 'Compliance checklist automation'], color: 'violet' },
  { id: 12, title: 'LLM Reasoning Logic', content: 'CQA doesn\'t just score — it provides cited textual evidence for every evaluation decision.', bullets: ['Evidence citations from transcript', 'Model explainability built-in', 'Transparent feedback for agents'], color: 'blue' },
  { id: 13, title: 'Metadata & Assignment Rules', content: 'Contextualize calls using campaign and agent metadata for precise routing and profiling.', bullets: ['Dynamic routing by campaign', 'Campaign-specific Quality Profiles', 'Agent group contextual analysis'], color: 'orange' },
  { id: 14, title: 'Script Adherence Checks', content: 'Ensure mandatory compliance phrases and disclosure scripts are present in every interaction.', bullets: ['Mandatory phrase detection', 'Regulatory disclosure verification', 'Automated compliance audit trails'], color: 'red' },
  { id: 15, title: 'Sentiment Analysis Nuance', content: 'Detect customer frustration, agent empathy, and emotional dynamics through advanced NLP.', bullets: ['Customer friction detection', 'Agent empathy scoring', 'Conversation sentiment timeline'], color: 'teal' },
  { id: 16, title: 'CRM & API Integration', content: 'Push CQA scores, reasoning, and insights into your existing CRM and BI tools via REST APIs.', bullets: ['Webhook support', 'REST endpoint documentation', 'CRM field mapping'], color: 'emerald' },
];

export const CQA_SYSTEM_INSTRUCTION = `You are the Exotel Hub AI — a deeply knowledgeable assistant for Exotel's Learning & Development platform.

Your primary expertise is CQA (Conversation Quality Analysis), Exotel's AI-powered quality assurance platform.

KEY FACTS ABOUT CQA:
- Analyzes 100% of contact center calls (vs industry-standard 2–5% manual sampling)
- Reduces QA operational costs by 60%+
- Achieves >90% accuracy compared to expert human reviewers
- Uses LLM reasoning with evidence citations for every score
- Three user personas: Administrators (configure), Supervisors (monitor), Agents (improve)
- Core architecture: C1 (ingestion) → C2 (AI analysis) → C3 (scoring/output)

MODULES AVAILABLE:
${CQA_SLIDES.map(s => `  - Slide ${s.id}: ${s.title} — ${s.content.substring(0, 80)}...`).join('\n')}

YOUR ROLE:
1. Answer questions about CQA and Exotel products with depth and precision
2. Reference specific slides/modules when relevant
3. Help employees prepare for sales pitches, technical demos, and customer conversations
4. Be warm, encouraging, and pedagogically clear
5. Use structured markdown for complex answers

Always end responses with a relevant follow-up question or a pointer to a specific learning resource.`;
