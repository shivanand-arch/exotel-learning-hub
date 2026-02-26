// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
  domain: string;
}

// ─── Teams & Modules ─────────────────────────────────────────────────────────
export type ModuleType = 'video' | 'audio' | 'podcast' | 'pdf' | 'document' | 'link' | 'slides';

export interface Team {
  id: string;
  name: string;
  description: string;
  color: string;   // tailwind color like 'red', 'blue', 'emerald'
  icon: string;    // emoji
  createdAt: string;
  moduleCount?: number;
}

export interface ContentModule {
  id: string;
  teamId: string;
  title: string;
  description: string;
  type: ModuleType;
  // For uploaded files
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  // fileData stored separately in IndexedDB (blob store)
  // For external links / YouTube
  url?: string;
  thumbnail?: string;
  duration?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FileBlob {
  moduleId: string;
  data: ArrayBuffer;
}

// ─── Slides ──────────────────────────────────────────────────────────────────
export interface Slide {
  id: number;
  title: string;
  content: string;
  bullets: string[];
  color?: string;
}

// ─── Chat ────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// ─── App State ───────────────────────────────────────────────────────────────
export interface AppState {
  teams: Team[];
  modules: ContentModule[];
  activeTeamId: string | null;
  searchQuery: string;
}

// ─── Upload ──────────────────────────────────────────────────────────────────
export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  moduleId?: string;
  error?: string;
}
