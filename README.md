# Exotel Hub — L&D Platform

A world-class, multi-modal Learning & Development platform for Exotel employees. Built with React + Vite + TypeScript.

## Features

- **🔐 Google Auth** — Sign in with Google, restricted to @exotel.com accounts
- **📚 Dynamic Content Library** — Upload videos, audio, PDFs, docs, presentations, and links
- **🏢 Team Modules** — Organize content by team/product (CQA, Sales, Tech, etc.)
- **🎬 Video Player** — Plays uploaded files, YouTube, and Vimeo links
- **📄 Slide/PDF Viewer** — Renders PDFs and built-in slide decks beautifully
- **🤖 AI Chat** — Gemini-powered assistant with full knowledge of your content
- **🎙️ Voice Mode** — Real-time voice conversation with Gemini Live
- **💾 IndexedDB Storage** — All uploaded files stored locally in the browser

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/exotel/exotel-hub.git
cd exotel-hub
npm install
```

### 2. Configure Environment

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local .env.local.example  # then edit with real values
```

```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_GEMINI_API_KEY=your_gemini_api_key
```

#### Getting Your Google OAuth Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project or select an existing one
3. Enable **Google Identity API** (or Google+ API)
4. Go to **APIs & Services → Credentials**
5. Create **OAuth 2.0 Client ID** → Web application
6. Add Authorized JavaScript Origins:
   - `http://localhost:5173` (for development)
   - Your production domain (e.g. `https://hub.exotel.com`)
7. Copy the **Client ID** to `VITE_GOOGLE_CLIENT_ID`

#### Getting Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy it to `VITE_GEMINI_API_KEY`

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

> **Dev mode**: If `VITE_GOOGLE_CLIENT_ID` is not set, you'll see a "Continue as Dev User" button that bypasses auth for local development.

## Adding Content

### Via the UI

1. Click **Add Content** in the header or navigate to **Content Manager**
2. Optionally create a new **Team** for your product/department
3. **Drag & drop files** (videos, MP3s, PDFs, PPTX, DOCX) or paste a URL
4. Fill in title, description, tags, and assign to a team
5. Click **Save Module** — it appears immediately on the dashboard

### Supported File Types

| Type | Formats |
|------|---------|
| Video | MP4, MOV, AVI, WebM, YouTube/Vimeo URLs |
| Audio | MP3, WAV, OGG, M4A |
| PDF | PDF (inline viewer) |
| Document | DOCX, TXT (download to view) |
| Slides | PDF, PPTX (rendered or download) |
| Link | Any URL |

## Architecture

```
src/
├── config/constants.ts      # App config, seed data, CQA slides
├── contexts/
│   ├── AuthContext.tsx      # Google OAuth + @exotel.com restriction
│   └── AppContext.tsx       # Teams/modules CRUD state
├── db/indexedDB.ts          # IndexedDB (idb) wrapper
├── services/geminiService.ts # @google/genai wrapper
├── pages/
│   ├── Login.tsx            # Auth landing page
│   ├── Dashboard.tsx        # Dynamic team cards + stats
│   ├── TeamDetail.tsx       # Team module library with viewer
│   ├── ContentManager.tsx   # Upload & manage content
│   ├── AIChat.tsx           # Gemini chat with content context
│   └── VoiceMode.tsx        # Gemini Live audio
└── components/
    ├── layout/              # Sidebar, Header, MainLayout
    ├── video/VideoPlayer.tsx # Multi-source video modal
    └── slides/PDFViewer.tsx  # Slides/PDF viewer modal
```

## Deployment

### Streamlit (Quick Demo)

For a quick shared demo, wrap the built React app in a Streamlit server:

```python
# streamlit_app.py
import streamlit as st
import subprocess, os

os.system("npm run build")
st.components.v1.html(open("dist/index.html").read(), height=800, scrolling=True)
```

### AWS (Production)

**Option A: S3 + CloudFront** (recommended for SPAs)
```bash
npm run build
aws s3 sync dist/ s3://your-bucket-name --delete
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

**Option B: AWS Amplify** (easiest, supports CI/CD)
```bash
# Connect your GitHub repo in AWS Amplify Console
# Set environment variables VITE_GOOGLE_CLIENT_ID and VITE_GEMINI_API_KEY
# Deploy automatically on every push
```

## Adding New Teams & Modules Programmatically

Add to `src/config/constants.ts`:

```typescript
export const DEFAULT_TEAMS: Team[] = [
  // ... existing teams ...
  {
    id: 'team-your-product',
    name: 'Your Product Name',
    description: 'What this team covers',
    color: 'teal',  // red|blue|emerald|violet|orange|teal|pink|amber
    icon: '🔧',
    createdAt: new Date().toISOString(),
  }
];
```

This gets seeded on first install. For dynamic creation, use the Content Manager UI.

## Tech Stack

- **React 19** + TypeScript + Vite 7
- **Tailwind CSS v3** for styling
- **React Router v7** for navigation
- **@react-oauth/google** for Google sign-in
- **idb** (IndexedDB) for local file storage
- **@google/genai** for Gemini AI (chat, TTS, Live voice)
- **framer-motion** for animations
- **lucide-react** for icons

## License

Internal use only — Exotel Confidential
