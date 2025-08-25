
# LOG_ON AI - Voice-First Conversational Agent

This app is a dark-themed, voice-first conversational AI interface built with Next.js 14, TypeScript, Tailwind CSS, and Web APIs for audio/video (WebRTC-ready). It includes model selection, TTS/STT toggles, dual audio visualizers, screen analysis hooks, chat streaming, and responsive UI.

## Prerequisites
- Node.js >= 18 (Node 20+ recommended)
- npm
- Optional: API keys
  - OPENAI_API_KEY (and optionally OPENAI_BASE_URL)

## Local Development

Start on port 12000 (bound to 0.0.0.0 for container access):

```bash
npm install
npm run dev
```

Open:
- https://work-1-bihvutfnmzycypvk.prod-runtime.all-hands.dev

Alternate:

```bash
npm run dev:12001
```

Open:
- https://work-2-bihvutfnmzycypvk.prod-runtime.all-hands.dev

## Environment Variables

- OPENAI_API_KEY: if set, /api/chat streams real completions via OpenAI-compatible API. Optionally set OPENAI_BASE_URL for providers like OpenRouter, DeepSeek, Together, etc.

## Features
- Model dropdown (8 models) with live switching
- Web Speech API STT and TTS
- Dual visualizers (agent simulated, user mic via Web Audio analyser)
- Video sources: screen, webcam, none
- Screen analysis placeholder via /api/vision
- Chat streaming via text streaming
- Settings modal and persistence endpoint (/api/settings)
- Performance indicators (latency + network strength)
- Responsive layout

## Production Build

```bash
npm run build
npm run start
```

## CI/CD
- GitHub Actions workflow (.github/workflows/ci.yml) runs typecheck and build on pushes/PRs.

## Deploy
- Vercel recommended. Headers in next.config.mjs allow CORS/iframes.
- Add OPENAI_API_KEY secret to project for live model streaming, or configure OPENAI_BASE_URL.

## Notes
- WebRTC signaling server example in server/ws-server.js
