
'use client';

import { useEffect, useRef, useState } from 'react';
import { MODELS, modelLabel, type ModelKey } from '#/lib/models';
import { nowTs, uuid } from '#/lib/utils';

type ChatMsg = { id: string; role: 'user' | 'assistant'; text: string; ts: string };

type VoiceOption = 'male-professional' | 'female-professional' | 'male-casual' | 'female-casual' | 'regional-us' | 'regional-uk' | 'custom';

type Language = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja';

export default function HomePage() {
  const [model, setModel] = useState<ModelKey>('gpt-4o');
  const [connected, setConnected] = useState(true);
  const [responseTime, setResponseTime] = useState('~1.2s');
  const [voice, setVoice] = useState<VoiceOption>('male-professional');
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [sttEnabled, setSttEnabled] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: uuid(), role: 'user', text: 'my name is LOGON I am African Voice-First conversation business intel AGENT', ts: nowTs() },
    { id: uuid(), role: 'assistant', text: 'What are you?', ts: nowTs() },
    { id: uuid(), role: 'user', text: 'my name is LOGON I am African Voice-First conversation business intel AGENT', ts: nowTs() },
    { id: uuid(), role: 'assistant', text: 'Can you access my screen sharing right now with the capabilities of this application web application?', ts: nowTs() },
    { id: uuid(), role: 'assistant', text: "Hello! I understand you're LOGON, an African Voice-First conversational business intelligence agent. Yes, I can see that you have screen sharing capabilities enabled in this application. I can analyze your screen content in real-time and provide business intelligence insights based on what I observe. How can I assist you with your business intelligence needs today?", ts: nowTs() },
  ]);
  const [input, setInput] = useState('');
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [videoSource, setVideoSource] = useState<'screen'|'webcam'|'external'|'mobile'|'none'>('screen');
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [screenEnabled, setScreenEnabled] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<'standby'|'analyzing'|'idle'>('standby');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [networkStrength, setNetworkStrength] = useState<number>(3);

  const videoRef = useRef<HTMLVideoElement>(null);
  const userAnalyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send();
      if (e.key.toLowerCase() === 't') setTtsEnabled((v) => !v);
      if (e.key.toLowerCase() === 'm') toggleSTT();
      if (e.key.toLowerCase() === 'v') toggleVideo();
      if (e.key.toLowerCase() === 's') toggleScreenShare();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const updateNet = () => {
      const n = (navigator as any).connection?.downlink ?? 1.5;
      setNetworkStrength(n > 5 ? 4 : n > 2 ? 3 : n > 1 ? 2 : 1);
    };
    updateNet();
    const conn = (navigator as any).connection;
    conn?.addEventListener?.('change', updateNet);
    return () => conn?.removeEventListener?.('change', updateNet);
  }, []);

  const initMic = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micStreamRef.current = stream;
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = audioCtx;
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    userAnalyserRef.current = analyser;
    animateUserVisualizer();
  };

  const animateUserVisualizer = () => {
    const analyser = userAnalyserRef.current;
    if (!analyser) return;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const bars = document.querySelectorAll('#userVisualizer .bar');
    const loop = () => {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setUserSpeaking(avg > 20);
      bars.forEach((bar, i) => {
        const v = dataArray[i % dataArray.length] / 255;
        (bar as HTMLElement).style.height = `${Math.max(4, v * 50)}px`;
      });
      requestAnimationFrame(loop);
    };
    loop();
  };

  const toggleSTT = async () => {
    if (sttEnabled) {
      setSttEnabled(false);
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      userAnalyserRef.current?.disconnect();
      audioCtxRef.current?.close();
      return;
    }
    await initMic();
    setSttEnabled(true);
    const SR: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = language;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          setInput((prev) => prev ? prev + ' ' + r[0].transcript : r[0].transcript);
        }
      }
    };
    rec.start();
  };

  type TTSProvider = 'elevenlabs' | 'google' | 'aws';
  const [ttsProvider, setTtsProvider] = useState<TTSProvider>('google');
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  const agentAnalyserRef = useRef<AnalyserNode | null>(null);
  const agentAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const pendingChunksRef = useRef<Uint8Array[]>([]);
  const isAppendingRef = useRef(false);

  const setupAgentVisualizer = () => {
    if (agentAnalyserRef.current) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    agentAudioCtxRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    agentAnalyserRef.current = analyser;
  };

  const animateAgentVisualizer = () => {
    const analyser = agentAnalyserRef.current; if (!analyser) return;
    const bars = document.querySelectorAll('#agentVisualizer .bar');
    const data = new Uint8Array(analyser.frequencyBinCount);
    const loop = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a,b)=>a+b,0)/data.length; setAgentSpeaking(avg>12);
      bars.forEach((bar, i) => { (bar as HTMLElement).style.height = `${Math.max(4, (data[i%data.length]/255)*50)}px`; });
      requestAnimationFrame(loop);
    };
    loop();
  };

  const ensureMediaSource = async (): Promise<HTMLAudioElement> => {
    setupAgentVisualizer();
    const audioEl = ttsAudioRef.current || new Audio();
    ttsAudioRef.current = audioEl;
    if (!mediaSourceRef.current) {
      const ms = new MediaSource();
      mediaSourceRef.current = ms;
      audioEl.src = URL.createObjectURL(ms);
      ms.addEventListener('sourceopen', () => {
        try {
          const sb = ms.addSourceBuffer('audio/mpeg');
          sourceBufferRef.current = sb;
          sb.addEventListener('updateend', () => {
            isAppendingRef.current = false;
            const next = pendingChunksRef.current.shift();
            if (next && !sb.updating) { isAppendingRef.current = true; sb.appendBuffer(next); }
          });
        } catch (e) { console.error('SourceBuffer error', e); }
      });
    }
    // Connect analyser
    const ctx = agentAudioCtxRef.current!;
    const srcNode = ctx.createMediaElementSource(audioEl);
    srcNode.connect(agentAnalyserRef.current!);
    agentAnalyserRef.current!.connect(ctx.destination);
    animateAgentVisualizer();
    return audioEl;
  };

  const speak = async (text: string) => {
    if (!ttsEnabled || !text) return;
    const audioEl = await ensureMediaSource();
    const url = `/api/tts?${new URLSearchParams({ text, voice, provider: ttsProvider, stream: '1' }).toString()}`;
    const res = await fetch(url);
    if (!res.ok || !res.body) return;
    const reader = res.body.getReader();
    const pump = async () => {
      const { done, value } = await reader.read();
      if (done) { mediaSourceRef.current?.endOfStream?.(); return; }
      if (value) {
        const sb = sourceBufferRef.current;
        const chunk = new Uint8Array(value);
        if (sb) {
          if (!sb.updating && !isAppendingRef.current) { isAppendingRef.current = true; sb.appendBuffer(chunk); }
          else pendingChunksRef.current.push(chunk);
        } else {
          // Fallback: assign to src directly if MSE not ready
          const blob = new Blob([chunk], { type: 'audio/mpeg' });
          audioEl.src = URL.createObjectURL(blob);
        }
      }
      pump();
    };
    audioEl.onplay = () => setAgentSpeaking(true);
    audioEl.onended = () => setAgentSpeaking(false);
    audioEl.onerror = () => setAgentSpeaking(false);
    if (audioEl.paused) await audioEl.play().catch(()=>{});
    pump();
  };

  const send = async () => {
    const content = input.trim();
    if (!content) return;
    setInput('');
    const userMsg: ChatMsg = { id: uuid(), role: 'user', text: content, ts: nowTs() };
    setMessages((m) => [...m, userMsg]);

    const t0 = performance.now();
    setAnalysisStatus('analyzing');

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant specializing in business intelligence and voice-first interactions.' },
          ...messages.map((m) => ({ role: m.role, content: m.text })),
          { role: 'user', content },
        ],
      }),
    });

    if (!res.ok || !res.body) {
      const err = await res.text();
      const fallback = `Error: ${err || res.statusText}`;
      setMessages((m) => [...m, { id: uuid(), role: 'assistant', text: fallback, ts: nowTs() }]);
      speak(fallback);
      setAnalysisStatus('idle');
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let acc = '';
    let started = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      if (!started) {
        setLatencyMs(Math.round(performance.now() - t0));
        started = true;
      }
      acc += chunk;
      setMessages((m) => {
        const last = m[m.length - 1];
        if (last && last.role === 'assistant' && last.id.startsWith('stream-')) {
          const nm = m.slice(0, -1);
          nm.push({ ...last, text: acc });
          return nm;
        }
        return [...m, { id: 'stream-' + uuid(), role: 'assistant', text: acc, ts: nowTs() }];
      });
    }

    speak(acc);
    setAnalysisStatus('idle');
  };

  const toggleVideo = async () => {
    if (videoEnabled) {
      setVideoEnabled(false);
      const v = videoRef.current;
      v?.srcObject && (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      return;
    }
    try {
      let stream: MediaStream | null = null;
      if (videoSource === 'webcam') stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      else if (videoSource === 'screen') stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: false });
      if (!stream) return;
      const v = videoRef.current!;
      (v as any).srcObject = stream;
      await (v as any).play();
      setVideoEnabled(true);
    } catch (e) {
      console.error(e);
    }
  };

  
const lastVisionAt = { t: 0 };
const captureFrames = async () => {
  const video = videoRef.current; if (!video) return;
  const canvas = document.createElement('canvas');
  const W = 640, H = 360; canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  while (screenEnabled) {
    try {
      const now = Date.now();
      if (now - lastVisionAt.t < 1100) { await new Promise(r => setTimeout(r, 200)); continue; }
      ctx.drawImage(video, 0, 0, W, H);
      const dataUrl = canvas.toDataURL('image/png');
      setAnalysisStatus('analyzing');
      const res = await fetch('/api/vision', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: dataUrl }) });
      const j = await res.json().catch(() => ({} as any));
      const analysis = j?.analysis as string | undefined;
      if (analysis && typeof analysis === 'string') {
        setMessages((m) => [...m, { id: uuid(), role: 'assistant', text: `[Vision] ${analysis}`, ts: nowTs() }]);
      }
      lastVisionAt.t = now;
    } catch {}
    setAnalysisStatus('idle');
    await new Promise(r => setTimeout(r, 200));
  }
};

const toggleScreenShare = async () => {
    setScreenEnabled((s) => !s); if (!screenEnabled) { setTimeout(captureFrames, 400); }
    if (!screenEnabled) {
      setAnalysisStatus('analyzing');
      setTimeout(() => setAnalysisStatus('idle'), 1200);
    }
  };

  useEffect(() => { setConnected(true); }, [model]);

  return (
    <main className="container-app py-6">
      <dialog id="settings-modal" className="card w-full max-w-2xl p-0">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Agent Settings</h2>
          <button className="btn" onClick={() => (document.getElementById('settings-modal') as HTMLDialogElement).close()}>✕</button>
        </div>
        <div className="p-4 grid md:grid-cols-2 gap-6">
          <section>
            <h3 className="section-title mb-2">Agent Customization</h3>
            <label className="block text-sm mb-1">Agent Name</label>
            <input className="input w-full mb-3" defaultValue="LOG_ON Assistant" />
            <label className="block text-sm mb-1">Introduction Message</label>
            <textarea className="input w-full h-24 mb-3">Hello! I'm your LOG_ON AI assistant. How can I help you today?</textarea>
            <label className="block text-sm mb-1">Personality & Tone</label>
            <select className="select w-full">
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
            </select>
          </section>
          <section>
            <h3 className="section-title mb-2">Prompt Management</h3>
            <label className="block text-sm mb-1">Custom System Prompt</label>
            <textarea className="input w-full h-24 mb-3">You are a helpful AI assistant specializing in business intelligence and voice-first interactions.</textarea>
            <label className="block text-sm mb-1">Industry Template</label>
            <select className="select w-full mb-6">
              <option value="general">General Business</option>
              <option value="finance">Finance</option>
              <option value="healthcare">Healthcare</option>
              <option value="education">Education</option>
              <option value="technology">Technology</option>
              <option value="retail">Retail</option>
            </select>
            <h3 className="section-title mb-2">Technical Settings</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Audio Quality</label>
                <select className="select w-full">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Video Quality</label>
                <select className="select w-full">
                  <option value="1080p">1080p</option>
                  <option value="720p">720p</option>
                  <option value="480p">480p</option>
                </select>
              </div>
            </div>
          </section>
        </div>
      </dialog>

      <div className="fixed bottom-4 right-4 z-30 md:hidden"><button className="btn btn-primary">💬</button></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <h3 className="section-title flex items-center gap-2">AI MODEL
                <span className={`inline-block w-2 h-2 rounded-full ${connected ? 'bg-success' : 'bg-danger'}`} />
              </h3>
              <div className="text-xs text-text-dim">Response Time: <span className="text-text-soft">{responseTime}</span></div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <select className="select w-full" value={model} onChange={(e) => setModel(e.target.value as ModelKey)}>
                {MODELS.map((m) => (<option key={m.key} value={m.key}>{m.label}</option>))}
              </select>
              <select className="select" value={ttsProvider} onChange={(e) => setTtsProvider(e.target.value as any)}>
                <option value="elevenlabs">ElevenLabs</option>
                <option value="google">Google TTS</option>
                <option value="aws">AWS Polly</option>
              </select>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="section-title mb-2">AUDIO & VIDEO</h3>
            <div className="flex items-center gap-3">
              <select className="select" value={voice} onChange={(e) => setVoice(e.target.value as any)}>
                <option value="male-professional">Male Professional</option>
                <option value="female-professional">Female Professional</option>
                <option value="male-casual">Male Casual</option>
                <option value="female-casual">Female Casual</option>
                <option value="regional-us">Regional Accent - US</option>
                <option value="regional-uk">Regional Accent - UK</option>
                <option value="custom">Custom Voice</option>
              </select>
              <button className={`btn ${ttsEnabled ? 'btn-primary' : ''}`} onClick={() => setTtsEnabled((v) => !v)}>🔊 TTS</button>
              <button className={`btn ${sttEnabled ? 'btn-primary' : ''}`} onClick={toggleSTT}>🎤 STT</button>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold mb-3">Agent Response</h3>
            <div className="visualizer" id="agentVisualizer">
              {Array.from({ length: 12 }).map((_, i) => (<div key={i} className="bar" style={{ height: agentSpeaking ? `${10 + (i % 5) * 8}px` : '6px' }} />))}
            </div>
            <div className="mt-3 text-xs flex items-center gap-2 text-text-dim">
              <span className={`w-2 h-2 rounded-full ${agentSpeaking ? 'bg-success' : 'bg-white/20'}`} />
              <span>Agent Speaking</span>
            </div>
          </div>

          <div className="card p-4">
            <div className="section-title mb-2">USER INPUT</div>
            <div className="flex items-center gap-2 text-sm text-text-dim">
              <span className={`w-2 h-2 rounded-full ${sttEnabled ? 'bg-success' : 'bg-white/20'}`} />
              <span>{sttEnabled ? 'Internal Microphone (Active)' : 'Internal Microphone (Muted)'}</span>
            </div>
            <div className="mt-3">
              <div id="userVisualizer" className="visualizer">
                {Array.from({ length: 24 }).map((_, i) => (<div key={i} className="bar" />))}
              </div>
              <div className="mt-3 text-xs flex items-center gap-2 text-text-dim">
                <span className={`w-2 h-2 rounded-full ${userSpeaking ? 'bg-success' : 'bg-white/20'}`} />
                <span>User Speaking</span>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="section-title mb-2">VIDEO SOURCES</div>
            <div className="flex items-center gap-3">
              <select className="select" value={videoSource} onChange={(e) => setVideoSource(e.target.value as any)}>
                <option value="screen">Screen Share</option>
                <option value="webcam">Webcam</option>
                <option value="external">External Camera</option>
                <option value="mobile">Mobile Camera</option>
                <option value="none">None (Audio Only)</option>
              </select>
              <button className={`btn ${videoEnabled ? 'btn-primary' : ''}`} onClick={toggleVideo}>📹</button>
              <button className={`btn ${screenEnabled ? 'btn-primary' : ''}`} onClick={toggleScreenShare}>🖥️</button>
            </div>
            <div className="mt-3 aspect-video rounded-lg bg-bg-soft border border-white/10 flex items-center justify-center overflow-hidden">
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
              {!videoEnabled && (<div className="text-center text-text-dim"><div className="text-3xl">📹</div><div>Click to start video</div></div>)}
            </div>
            <div className="mt-3 text-xs flex items-center gap-2 text-text-dim">
              <span className={`w-2 h-2 rounded-full ${analysisStatus === 'analyzing' ? 'bg-warning' : 'bg-white/20'}`} />
              <span>Screen Analysis: {analysisStatus === 'analyzing' ? 'Analyzing' : 'Standby'}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col h-[calc(100dvh-120px)] card p-0 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <div className="text-sm text-text-soft">Voice-Agent with {modelLabel(model)}</div>
              <div className="text-xs text-text-dim flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${connected ? 'bg-success' : 'bg-danger'}`} />{connected ? 'Connected' : 'Disconnected'}</div>
            </div>
            <div>
              <select className="select" value={language} onChange={(e) => setLanguage(e.target.value as any)}>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="zh">Chinese</option>
                <option value="ja">Japanese</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4" id="chatContainer">
            {messages.map((m) => (
              <div key={m.id} className={`max-w-[85%] ${m.role === 'user' ? 'ml-auto text-right' : ''}`}>
                <div className={`inline-block rounded-2xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-primary/20 border border-primary/30' : 'bg-white/5 border border-white/10'}`}>
                  {m.text}
                </div>
                <div className="text-xs text-text-dim mt-1">{m.ts}</div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Type your message or use voice input..." className="input w-full" />
              <button className="btn btn-primary" onClick={send} aria-label="Send"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 left-4 flex items-center gap-3">
        <span className={`w-3 h-3 rounded-full ${connected ? 'bg-success' : 'bg-danger'}`} />
        <div className="flex items-end gap-1">
          {Array.from({ length: 4 }).map((_, i) => (<div key={i} className={`w-1.5 rounded-sm ${i < networkStrength ? 'bg-success' : 'bg-white/10'}`} style={{ height: 6 + i * 6 }} />))}
        </div>
        {latencyMs !== null && <span className="text-xs text-text-dim">{latencyMs} ms</span>}
      </div>
    </main>
  );
}
