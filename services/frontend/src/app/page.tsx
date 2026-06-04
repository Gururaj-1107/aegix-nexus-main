"use client";

import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { NeedsBarChart } from '@/components/Charts';
import { Users, AlertTriangle, Clock, CheckCircle, MapPin, Database, ArrowRight, BrainCircuit, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

function AnimatedCounter({ value, color }: { value: number; color: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, v => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(count, value, { duration: 2, ease: "easeOut" });
    const unsub = rounded.on("change", v => setDisplay(v));
    return () => { controls.stop(); unsub(); };
  }, [value, count, rounded]);

  return <span style={{ color }}>{display}</span>;
}

export default function Dashboard() {
  const [commander, setCommander] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    setCommander(localStorage.getItem('userName') || 'Commander');

    apiFetch('/api/dashboard/stats').then(r => r.ok ? r.json() : null).then(d => d && setStats(d)).catch(() => {});

    const fetchActivity = () => {
      apiFetch('/api/dispatches/recent').then(r => r.ok ? r.json() : []).then(setRecentActivity).catch(() => {});
    };
    fetchActivity();
    const interval = setInterval(fetchActivity, 30000);
    return () => clearInterval(interval);
  }, []);

  const metrics = stats ? [
    { icon: Users, label: "Total Volunteers", value: stats.total_volunteers, color: "#3b82f6" },
    { icon: CheckCircle, label: "Active Volunteers", value: stats.active_volunteers, color: "#6366F1" },
    { icon: AlertTriangle, label: "Critical Reports", value: stats.critical_reports, color: "#FF4444" },
    { icon: Clock, label: "Pending Needs", value: stats.pending_needs, color: "#FFB800" },
  ] : [];

  return (
    <div className="w-full h-full flex flex-col gap-8 overflow-y-auto pb-20 no-scrollbar relative">
      {/* HERO SECTION */}
      <section className="relative w-full min-h-[400px] flex items-center justify-center rounded-[2rem] overflow-hidden glass-panel">
        <div className="absolute inset-0 aurora-glow opacity-30 pointer-events-none" />
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#6366F1] rounded-full blur-[160px] opacity-10 pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#22D3EE] rounded-full blur-[130px] opacity-10 pointer-events-none" />

        <div className="relative z-10 p-10 md:p-14 lg:p-16 flex flex-col items-center text-center">
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="px-5 py-2 rounded-full bg-white/5 border border-white/10 flex items-center gap-3 mb-8 backdrop-blur-md">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6366F1] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6366F1]" />
            </span>
            <span className="text-[10px] font-black tracking-[0.2em] text-gray-300 uppercase">Aegis Core • Operational Status: Nominal</span>
          </motion.div>

          <motion.h1 initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }}
            className="font-heading text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[0.95] mb-8">
            Aegis <br/><span className="gradient-text">Operations Center</span>
          </motion.h1>

          <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }}
            className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed mb-10 font-light">
            Welcome back, <span className="text-white font-semibold">{commander.split(' ')[0]}</span>.
            The tactical dispatch matrix is active, tracking live volunteers and coordinating real-time crisis response.
          </motion.p>

          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-4">
            <Link href="/dispatch" className="premium-button px-8 py-3 rounded-full font-bold flex items-center gap-3 text-sm uppercase tracking-widest hover:scale-105 transition-transform">
              <MapPin className="w-5 h-5" /> Live Mission Dispatch
            </Link>
            <Link href="/vault" className="glass-panel-hover px-8 py-3 rounded-full font-bold text-white flex items-center gap-3 text-sm uppercase tracking-widest border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10">
              <BrainCircuit className="w-5 h-5 text-[#22D3EE]" /> Consult NGO Agent
            </Link>
          </motion.div>
        </div>
      </section>

      {/* METRICS ROW */}
      {stats && (
        <>
          <div className="flex items-center gap-6 px-2">
            <h2 className="font-heading text-2xl font-bold text-white whitespace-nowrap">Real-time Metrics</h2>
            <div className="h-px w-full bg-gradient-to-r from-[rgba(99,102,241,0.22)] to-transparent" />
          </div>

          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((m, i) => (
              <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 + i * 0.1 }}
                className="glass-panel p-8 relative overflow-hidden group card-lift">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all">
                  <m.icon className="w-24 h-24 text-white" />
                </div>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <m.icon className="w-4 h-4" style={{ color: m.color }} /> {m.label}
                </p>
                <p className="font-heading text-5xl font-extrabold">
                  <AnimatedCounter value={m.value} color={m.color} />
                </p>
              </motion.div>
            ))}
          </section>
        </>
      )}

      {/* MAP + CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1.0 }}
          className="col-span-1 lg:col-span-7 glass-panel p-6 overflow-hidden" style={{ minHeight: 400 }}>
          <h3 className="font-heading font-bold text-xl text-white mb-4">Volunteer Map — India</h3>
          <div style={{ height: 350 }}><MapComponent height="350px" /></div>
        </motion.div>

        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1.1 }}
          className="col-span-1 lg:col-span-5 glass-panel p-6">
          <h3 className="font-heading font-bold text-xl text-white mb-2">Demand Signature</h3>
          <p className="text-sm text-gray-500 mb-4">Needs by skill type</p>
          <div className="w-full bg-black/20 rounded-2xl p-4 border border-white/5"><NeedsBarChart /></div>
        </motion.div>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="glass-panel p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-heading font-bold text-xl text-white">Recent Activity Feed</h3>
          <span className="text-xs text-gray-500">Auto-refreshes every 30s</span>
        </div>
        <div className="space-y-3">
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No recent dispatches</p>
          ) : recentActivity.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-[rgba(99,102,241,0.18)] transition-colors">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${d.urgency === 'CRITICAL' ? 'bg-[#FF4444]' : d.urgency === 'MEDIUM' ? 'bg-[#FFB800]' : 'bg-[#6366F1]'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-semibold truncate">{d.volunteer_name} → {d.skill}</p>
                <p className="text-xs text-gray-500 truncate">{d.description || 'Dispatched'}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                d.urgency === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                d.urgency === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
              }`}>{d.urgency}</span>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                d.status === 'COMPLETED' ? 'text-indigo-300' : d.status === 'ARRIVED' ? 'text-blue-400' : 'text-yellow-400'
              }`}>{d.status}</span>
              <span className="text-xs text-gray-600">{new Date(d.dispatched_at).toLocaleDateString()}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* FAB */}
      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        onClick={() => setShowReportModal(true)}
        className="fixed bottom-8 right-8 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-[#6366F1] to-[#22D3EE] flex items-center justify-center shadow-[0_10px_34px_rgba(99,102,241,0.35)]">
        <Plus className="w-6 h-6 text-[#070A12]" />
      </motion.button>

      {/* Report Modal */}
      {showReportModal && <ReportModal onClose={() => setShowReportModal(false)} />}
    </div>
  );
}

function ReportModal({ onClose }: { onClose: () => void }) {
  const [desc, setDesc] = useState('');
  const [urgency, setUrgency] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      // Create report via a direct prisma-backed endpoint would be needed
      // For now we show the modal functionality
      await new Promise(r => setTimeout(r, 1000));
      onClose();
    } catch {} finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()} className="glass-panel p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-heading font-bold text-xl text-white">Quick Report</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>
        <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe the situation..."
          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm mb-4 resize-none h-32 focus:outline-none focus:border-[#6366F1]/30" />
        <div className="flex gap-2 mb-6">
          {['LOW', 'MEDIUM', 'CRITICAL'].map(u => (
            <button key={u} onClick={() => setUrgency(u)}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
                urgency === u ? (u === 'CRITICAL' ? 'bg-red-500/20 border-red-500/40 text-red-400' : u === 'MEDIUM' ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' : 'bg-green-500/20 border-green-500/40 text-green-400')
                : 'bg-white/5 border-white/10 text-gray-400'
              }`}>{u}</button>
          ))}
        </div>
        <button onClick={submit} disabled={!desc.trim() || submitting}
          className="premium-button w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wider disabled:opacity-40">
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </motion.div>
    </div>
  );
}
