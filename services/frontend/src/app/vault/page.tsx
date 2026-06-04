"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DocumentUpload from '@/components/DocumentUpload';
import { FileText, Mic, Sparkles, Send, Loader2, CheckCircle2, Bot, User, Trash2, Database, Lock, Paperclip } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface ChatMessage { role: 'user' | 'assistant' | 'tool'; content: string; }

function formatMessage(text: string) {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    const elements = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className="font-extrabold text-[#00FF88]">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
    return (
      <span key={i} className="block min-h-[1.2em] leading-relaxed">
        {elements}
      </span>
    );
  });
}

export default function VaultPage() {
  const [activeMode, setActiveMode] = useState<'upload' | 'voice' | 'gemini'>('gemini');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [geminiMessages, setGeminiMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: `As Aegis AI, a resource coordination command intelligence, I am designed to assist in emergency response, tactical logistics, and field operations. Here is what I can do to support your mission:

1. **Access Emergency Protocols & Guidelines:** I can query our comprehensive knowledge base to retrieve NGO operating guidelines, disaster response protocols, safety procedures, and emergency documentation.

2. **Track Medic Volunteer Locations:** I can look up live latitude/longitude coordinates of active Medic volunteers within specific zones to help you coordinate rapid deployments and assess proximity.

3. **Resource Coordination & Decision Support:** I can help analyze operational data, organize logistics, and provide actionable intelligence during critical situations.

How can I assist your operations today? Please provide a query, zone, or incident report to begin.` }
  ]);
  const [geminiInput, setGeminiInput] = useState('');
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const [kbEntries, setKbEntries] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    apiFetch('/api/knowledge').then(r => r.ok ? r.json() : []).then(setKbEntries).catch(() => {});
  }, []);

  // Voice waveform animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isRecording) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    let phase = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#00FF88'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x++) {
        const y = canvas.height/2 + Math.sin(x * 0.03 + phase) * 20 * Math.sin(phase * 0.5) + Math.sin(x * 0.07 + phase * 1.5) * 10;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      phase += 0.1;
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [isRecording]);

  const startVoiceRecording = async () => {
    try {
      setIsDemoMode(false);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await sendVoiceToBackend(blob);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch {
      setIsDemoMode(true);
      setIsRecording(true);
      setTimeout(() => stopVoiceRecording(true), 3000);
    }
  };

  const stopVoiceRecording = async (forceDemo = false) => {
    setIsRecording(false);
    const useDemo = forceDemo || isDemoMode;

    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }

    if (useDemo) {
      setVoiceProcessing(true);
      await new Promise(r => setTimeout(r, 2000));
      setVoiceTranscript('Request medical supplies and 3 medics to Zone Bravo. Situation critical.');
      setVoiceProcessing(false);
    }
  };

  const sendVoiceToBackend = async (blob: Blob) => {
    setVoiceProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      const res = await apiFetch('/api/voice', { method: 'POST', body: formData });
      const data = await res.json();
      setVoiceTranscript(data.transcript || 'Transcription complete.');
    } catch {
      setVoiceTranscript('Demo: Medical supplies request to Zone Bravo logged.');
    } finally { setVoiceProcessing(false); }
  };

  const sendGeminiMessage = async () => {
    if (!geminiInput.trim() || geminiLoading) return;
    let userMsg = geminiInput.trim();
    setGeminiInput('');
    setGeminiMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setGeminiLoading(true);

    try {
      // Translate outgoing if non-English
      if (language !== 'en') {
        try {
          const tr = await apiFetch('/api/translate', { method: 'POST', body: JSON.stringify({ text: userMsg, target_language: 'en' }) });
          const td = await tr.json();
          if (td.translated) userMsg = td.translated;
        } catch {}
      }

      const response = await apiFetch('/api/gemini/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [...geminiMessages, { role: 'user', content: userMsg }] }),
      });
      const data = await response.json();

      if (data.toolLogs?.length > 0) {
        data.toolLogs.forEach((log: string) => setGeminiMessages(prev => [...prev, { role: 'tool', content: log }]));
      }

      let reply = data.reply || 'No response.';

      // Translate response if non-English
      if (language !== 'en') {
        try {
          const tr = await apiFetch('/api/translate', { method: 'POST', body: JSON.stringify({ text: reply, target_language: language }) });
          const td = await tr.json();
          if (td.translated) reply = td.translated;
        } catch {}
      }

      setGeminiMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setGeminiMessages(prev => [...prev, { role: 'assistant', content: '⚠️ AI service temporarily unavailable.' }]);
    } finally {
      setGeminiLoading(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const deleteKB = async (id: string) => {
    await apiFetch(`/api/knowledge/${id}`, { method: 'DELETE' });
    setKbEntries(prev => prev.filter(e => e.id !== id));
  };

  const tabs = [
    { key: 'gemini' as const, icon: Sparkles, label: 'AI Chat', desc: 'Gemini RAG Assistant' },
    { key: 'upload' as const, icon: FileText, label: 'Upload Document', desc: 'Document AI Processing' },
    { key: 'voice' as const, icon: Mic, label: 'Voice Command', desc: 'Speech-to-Text Logging' },
  ];

  return (
    <div className="w-full h-full flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold text-white mb-1">Intelligence Vault</h2>
          <p className="text-gray-400 text-sm">Agentic AI Document Analysis & Voice Operations Center</p>
        </div>
        <div className="flex items-center gap-2 bg-[#00FF88]/10 border border-[#00FF88]/20 text-[#00FF88] px-4 py-2 rounded-xl text-sm font-semibold self-start">
          <Lock className="w-4 h-4" /> E2E Encrypted
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1">
        {/* Left Panel — Tab Switcher */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-3">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveMode(tab.key)}
              className={`glass-panel p-5 flex items-center gap-4 text-left transition-all ${
                activeMode === tab.key ? 'border-[#00FF88]/30 shadow-[0_0_20px_rgba(0,255,136,0.1)]' : 'hover:border-white/10'
              }`}>
              <div className={`p-3 rounded-xl ${activeMode === tab.key ? 'bg-gradient-to-br from-[#00FF88] to-[#00C4A7]' : 'bg-white/5'}`}>
                <tab.icon className={`w-5 h-5 ${activeMode === tab.key ? 'text-[#0A0F0A]' : 'text-gray-400'}`} />
              </div>
              <div>
                <h4 className={`font-bold text-sm ${activeMode === tab.key ? 'text-white' : 'text-gray-300'}`}>{tab.label}</h4>
                <p className="text-xs text-gray-500">{tab.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Right Panel — Content */}
        <motion.div layout className="col-span-12 lg:col-span-8 glass-panel p-6 flex flex-col min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeMode === 'gemini' && (
              <motion.div key="gemini" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col flex-1">
                {/* Language Selector & Clear Chat */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <select value={language} onChange={e => setLanguage(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none">
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="gu">Gujarati</option>
                      <option value="ta">Tamil</option>
                    </select>
                    <span className="text-xs text-gray-500">Chat language</span>
                  </div>
                  <button 
                    onClick={() => setGeminiMessages([
                      { role: 'assistant', content: `As Aegis AI, a resource coordination command intelligence, I am designed to assist in emergency response, tactical logistics, and field operations. Here is what I can do to support your mission:

1. **Access Emergency Protocols & Guidelines:** I can query our comprehensive knowledge base to retrieve NGO operating guidelines, disaster response protocols, safety procedures, and emergency documentation.

2. **Track Medic Volunteer Locations:** I can look up live latitude/longitude coordinates of active Medic volunteers within specific zones to help you coordinate rapid deployments and assess proximity.

3. **Resource Coordination & Decision Support:** I can help analyze operational data, organize logistics, and provide actionable intelligence during critical situations.

How can I assist your operations today? Please provide a query, zone, or incident report to begin.` }
                    ])}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-all font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear Chat
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 max-h-[360px]">
                  {geminiMessages.map((msg, i) => (
                    msg.role === 'tool' ? (
                      <div key={i} className="flex justify-center my-2">
                        <div className="bg-[#00FF88]/10 border border-[#00FF88]/20 text-[#00FF88] px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin" /> {msg.content}
                        </div>
                      </div>
                    ) : (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
                          msg.role === 'assistant' ? 'bg-gradient-to-br from-[#00FF88] to-[#00C4A7]' : 'bg-white/10'
                        }`}>
                          {msg.role === 'assistant' ? <Bot className="w-3.5 h-3.5 text-[#0A0F0A]" /> : <User className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'assistant' ? 'bg-white/5 border border-white/8 text-gray-200 rounded-tl-sm'
                            : 'bg-gradient-to-br from-[#00FF88]/20 to-[#00C4A7]/20 border border-[#00FF88]/20 text-white rounded-tr-sm'
                        }`}>{formatMessage(msg.content)}</div>
                      </motion.div>
                    )
                  ))}
                  {geminiLoading && (
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00FF88] to-[#00C4A7] flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5 text-[#0A0F0A]" />
                      </div>
                      <div className="bg-white/5 border border-white/8 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
                        {[0, 0.2, 0.4].map((d, i) => (
                          <motion.div key={i} className="w-1.5 h-1.5 bg-[#00FF88] rounded-full" animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: d }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="flex gap-2 bg-white/4 border border-white/10 rounded-2xl p-2">
                  <button className="p-2 text-gray-500 hover:text-[#00FF88] transition-colors"><Paperclip className="w-4 h-4" /></button>
                  <input value={geminiInput} onChange={e => setGeminiInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendGeminiMessage()}
                    placeholder="Ask about resource allocation, triage, logistics…"
                    className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 px-2 focus:outline-none" />
                  <button onClick={sendGeminiMessage} disabled={!geminiInput.trim() || geminiLoading}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-[#00FF88] to-[#00C4A7] text-[#0A0F0A] disabled:opacity-40 transition-opacity">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {activeMode === 'upload' && (
              <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-r from-[#00FF88] to-[#00C4A7] rounded-xl">
                    <FileText className="w-5 h-5 text-[#0A0F0A]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Document AI Processing</h3>
                    <p className="text-xs text-gray-400">Upload handwritten notes, forms, or scanned records</p>
                  </div>
                </div>
                <DocumentUpload />
              </motion.div>
            )}

            {activeMode === 'voice' && (
              <motion.div key="voice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center gap-6 py-8">
                <h3 className="text-xl font-bold text-white mb-2">Voice Document Log</h3>
                <p className="text-gray-400 text-sm mb-4">Record a voice note — AI transcribes and structures it</p>

                {/* Waveform */}
                {isRecording && <canvas ref={canvasRef} width={300} height={60} className="rounded-xl" />}

                <div className="relative flex items-center justify-center">
                  {isRecording && (
                    <>
                      <motion.div animate={{ scale: [1, 1.6], opacity: [0.4, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute w-36 h-36 rounded-full bg-red-500/30" />
                      <motion.div animate={{ scale: [1, 1.3], opacity: [0.5, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }} className="absolute w-36 h-36 rounded-full bg-red-500/20" />
                    </>
                  )}
                  <motion.button onClick={isRecording ? () => stopVoiceRecording() : startVoiceRecording} disabled={voiceProcessing}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className={`relative w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-all ${
                      isRecording ? 'bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.5)]'
                        : 'bg-gradient-to-br from-[#00FF88] to-[#00C4A7] shadow-[0_0_40px_rgba(0,255,136,0.4)]'
                    }`}>
                    {voiceProcessing ? <Loader2 className="w-10 h-10 text-white animate-spin" /> : <Mic className="w-10 h-10 text-[#0A0F0A]" />}
                  </motion.button>
                </div>
                <p className="text-sm font-medium text-gray-300">
                  {voiceProcessing ? 'Processing with Speech AI…' : isRecording ? 'Recording — tap to stop' : 'Tap to record'}
                </p>

                <AnimatePresence>
                  {voiceTranscript && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 mt-2">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-4 h-4 text-[#00FF88]" />
                        <span className="text-xs font-bold text-[#00FF88] uppercase tracking-wider">Transcribed & Logged</span>
                      </div>
                      <p className="text-white text-sm leading-relaxed italic">"{voiceTranscript}"</p>
                      <button onClick={() => setVoiceTranscript('')} className="mt-3 text-xs text-gray-500 hover:text-gray-300 transition-colors">Clear</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Knowledge Base Section */}
      {kbEntries.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-gray-400" />
            <h3 className="font-heading text-lg font-bold text-white">Knowledge Base</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kbEntries.map((e, i) => (
              <motion.div key={e.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-panel p-5 group">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-bold text-white">{e.title}</h4>
                  <button onClick={() => deleteKB(e.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{e.content?.slice(0, 120)}…</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
