"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Shield, Cloud, Brain, Database, Zap, Users, FileText, Mic } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

const FEATURES = [
  "AI-Driven NGO Resource Allocation",
  "Real-Time Volunteer Dispatch",
  "Handwritten Document AI Parsing",
  "Voice-Activated Emergency Routing",
];

const FEATURE_CARDS = [
  { icon: Brain, title: "Agentic AI Engine", desc: "Gemini 2.0 powered RAG pipeline for intelligent resource matching and decision support." },
  { icon: Users, title: "Smart Dispatch", desc: "Haversine proximity + skill matching algorithm auto-assigns nearest qualified volunteers." },
  { icon: FileText, title: "Document AI", desc: "Google Document AI extracts structured data from handwritten field reports instantly." },
  { icon: Mic, title: "Voice Operations", desc: "Speech-to-Text enables hands-free emergency reporting from the field." },
];

// Canvas particle animation
function useParticleCanvas(canvasRef: React.RefObject<HTMLCanvasElement>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number }[] = [];

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 80; i++) {
      particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5 });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(99,102,241,0.35)'; ctx.fill();
      });
      // Draw lines between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 120) {
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${0.11 * (1 - dist/120)})`;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, [canvasRef]);
}

export default function LoginPage() {
  const router = useRouter();
  const [featureIndex, setFeatureIndex] = useState(0);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useParticleCanvas(canvasRef);

  useEffect(() => {
    const interval = setInterval(() => setFeatureIndex(i => (i + 1) % FEATURES.length), 2500);
    return () => clearInterval(interval);
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const token = await user.getIdToken();
      localStorage.setItem('auth', token);
      localStorage.setItem('userName', user.displayName || 'Volunteer');
      localStorage.setItem('userAvatar', user.photoURL || '');
      router.push('/');
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "Login Failed.");
    }
  };

  return (
    <div className="w-full min-h-screen relative overflow-hidden font-body bg-[#070A12]">
      {/* Particle Canvas Background */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* Sticky Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 backdrop-blur-xl bg-[#070A12]/60 border-b border-[rgba(99,102,241,0.12)]">
        <div className="flex items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <path d="M16 2L28 9V23L16 30L4 23V9L16 2Z" stroke="#6366F1" strokeWidth="2" fill="rgba(99,102,241,0.12)"/>
            <path d="M16 8L12 18H15L13 24L20 14H17L19 8H16Z" fill="#6366F1"/>
          </svg>
          <span className="font-heading text-lg font-extrabold tracking-[0.15em] gradient-text">AEGIS NEXUS</span>
        </div>
        <a href="#features" className="text-sm text-gray-400 hover:text-[#6366F1] transition-colors font-medium">Learn More ↓</a>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col lg:flex-row items-center justify-center min-h-[calc(100vh-60px)] px-8 lg:px-20 gap-12">
        {/* Left — Hero Text */}
        <motion.div className="flex-1 max-w-2xl" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
          <motion.h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] mb-6"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            Coordinate.<br />
            Dispatch.<br />
            <span className="gradient-text">Impact.</span>
          </motion.h1>

          <motion.p className="text-gray-400 text-lg md:text-xl leading-relaxed mb-8 max-w-lg"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            The AI-powered command center for NGO volunteer operations.
          </motion.p>

          {/* Feature Marquee */}
          <motion.div className="h-8 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <AnimatePresence mode="wait">
              <motion.div key={featureIndex} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#6366F1]" />
                <span className="text-sm text-[#6366F1] font-semibold tracking-wider uppercase">{FEATURES[featureIndex]}</span>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Right — Login Card */}
        <motion.div className="w-full max-w-[420px]" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}>
          <div className="glass-panel p-10 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-[#6366F1] to-transparent opacity-60" />

            <div className="flex flex-col items-center mb-8">
              <motion.div animate={{ boxShadow: ['0 0 22px rgba(99,102,241,0.28)', '0 0 44px rgba(99,102,241,0.5)', '0 0 22px rgba(99,102,241,0.28)'] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#22D3EE] flex items-center justify-center mb-5">
                <Shield className="w-8 h-8 text-[#070A12]" />
              </motion.div>
              <h2 className="font-heading text-3xl font-extrabold text-white tracking-tight text-center mb-2">Aegis Nexus</h2>
              <p className="text-xs text-gray-400 font-medium tracking-wider uppercase">Secure NGO Portal</p>
            </div>

            <div className="flex flex-col gap-4">
              {errorStatus && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-center text-xs text-red-400 font-semibold uppercase">{errorStatus}</div>
              )}
              <div className="flex justify-center w-full relative z-50 hover:scale-105 transition-transform duration-300">
                <button
                  onClick={handleGoogleSignIn}
                  className="flex items-center justify-center gap-3 w-[320px] bg-white text-black font-semibold py-3 px-6 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex justify-center gap-4 mt-8">
              {[
                { icon: Cloud, label: "Google Cloud" },
                { icon: Brain, label: "Vertex AI" },
                { icon: Database, label: "Zero Data Loss" },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-1.5 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                  <b.icon className="w-3 h-3" />{b.label}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20 px-8 lg:px-20">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl font-extrabold text-white mb-3">Platform Features</h2>
          <p className="text-gray-400 text-sm">Built for the Google Build for AI Hackathon</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {FEATURE_CARDS.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }} viewport={{ once: true }}
              className="glass-panel p-6 card-lift">
              <div className="p-3 bg-gradient-to-br from-[#6366F1] to-[#22D3EE] rounded-xl w-fit mb-4">
                <f.icon className="w-6 h-6 text-[#070A12]" />
              </div>
              <h3 className="font-heading text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
