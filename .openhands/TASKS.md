# Task List

1. ✅ Bootstrap Next.js 14 TypeScript + Tailwind project and configs
Initialized package.json, installed deps, added next.config.mjs, tsconfig.json, postcss.config.mjs, tailwind.config.ts, next-env.d.ts, src/app/globals.css
2. ✅ Implement UI layout to match provided dark-themed design (header, left panel, right chat)
layout.tsx and page.tsx implemented with dark theme, responsive structure, header/menu/settings modal
3. ✅ Implement model selection logic and state management with performance indicators
Model dropdown with 8 models, connection indicator, latency on stream start, response time label
4. ✅ Implement audio system (TTS/STT toggles, voice options, dual visualizers)
Web Speech TTS/STT wired, mic analyser visualizer, agent visualizer simulated
5. ✅ Implement video/screen management with WebRTC getUserMedia/getDisplayMedia
Video source selector, webcam/screen share toggles with preview and analysis status
6. ✅ Implement API routes (chat streaming, settings persistence, vision placeholder)
/api/chat streaming mock with OpenAI compatibility; /api/settings persistence; /api/vision placeholder
7. ✅ Set up GitHub Actions CI and docs/setup.md
.github/workflows/ci.yml and docs/setup.md added
8. ✅ Run and verify app on port 12000 accessible via provided host
Dev server started at http://0.0.0.0:12000; available on provided host

