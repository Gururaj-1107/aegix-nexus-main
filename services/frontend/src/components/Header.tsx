"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, User, Shield, LogOut, Settings, ChevronDown, BarChart3, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';

const NAV_LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/agents', label: 'Volunteers' },
  { href: '/dispatch', label: 'Dispatch' },
  { href: '/vault', label: 'Intelligence' },
  { href: '/announcements', label: 'Announcements' },
  { href: '/analytics', label: 'Analytics' },
];

// Aegis Shield SVG logo — hexagon with lightning bolt
function AegisLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 2L28 9V23L16 30L4 23V9L16 2Z" stroke="#6366F1" strokeWidth="2" fill="rgba(99,102,241,0.12)"/>
      <path d="M16 8L12 18H15L13 24L20 14H17L19 8H16Z" fill="#6366F1"/>
    </svg>
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState('Commander');
  const [userAvatar, setUserAvatar] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('userName');
    const avatar = localStorage.getItem('userAvatar');
    if (stored) setUserName(stored);
    if (avatar) setUserAvatar(avatar);

    // Poll notifications
    const fetchNotifications = async () => {
      try {
        const res = await apiFetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.slice(0, 10));
          setUnreadCount(data.filter((n: any) => !n.is_read).length);
        }
      } catch {}
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('userName');
    localStorage.removeItem('userAvatar');
    router.push('/login');
  };

  const markRead = async (id: string) => {
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="sticky top-0 z-50 flex justify-between items-center py-3 px-6 backdrop-blur-2xl bg-[#070A12]/80"
      style={{ borderBottom: '1px solid rgba(99,102,241,0.12)', boxShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
    >
      {/* Logo */}
      <motion.div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/')}
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <AegisLogo />
        <span className="font-heading text-lg font-extrabold tracking-[0.15em] gradient-text hidden sm:block">
          AEGIS NEXUS
        </span>
      </motion.div>

      {/* Navigation */}
      <nav className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-full backdrop-blur-md">
        {NAV_LINKS.map(link => {
          const active = pathname === link.href;
          return (
            <Link key={link.href} href={link.href}
              className={`relative px-5 py-2 rounded-full text-sm font-medium tracking-wide transition-all duration-300 ${
                active ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}>
              {active && (
                <motion.div layoutId="nav-pill"
                  className="absolute inset-0 rounded-full border border-[rgba(99,102,241,0.22)] bg-[rgba(99,102,241,0.10)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }} />
              )}
              <span className="relative z-10">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Online indicator */}
        <div className="hidden md:flex items-center gap-2 text-[#6366F1] px-3 py-1.5 rounded-full text-xs font-bold tracking-widest bg-[#6366F1]/10 border border-[#6366F1]/20">
          <span className="w-2 h-2 rounded-full bg-[#6366F1] animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.75)]" />
          ONLINE
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => { setShowNotifications(p => !p); setShowProfile(false); }}
            className="p-2.5 rounded-full hover:bg-white/10 transition-colors bg-white/5 relative">
            <Bell className="w-4 h-4 text-gray-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#FF4444] rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#070A12]">
                {unreadCount}
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-[calc(100%+8px)] w-80 bg-[#070A12]/95 backdrop-blur-2xl rounded-2xl shadow-2xl z-50 border border-[rgba(99,102,241,0.16)] overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-sm font-bold text-white">Notifications</p>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-8">No notifications</p>
                    ) : notifications.map(n => (
                      <div key={n.id} onClick={() => markRead(n.id)}
                        className={`px-4 py-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors flex gap-3 ${n.is_read ? 'opacity-60' : ''}`}>
                        <div className={`w-1 rounded-full flex-shrink-0 ${
                          n.type === 'ALERT' ? 'bg-[#FF4444]' : n.type === 'WARNING' ? 'bg-[#FFB800]' : 'bg-blue-400'
                        }`} />
                        <div>
                          <p className="text-sm text-white">{n.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Profile dropdown */}
        <div className="relative">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setShowProfile(p => !p); setShowNotifications(false); }}
            className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-full hover:bg-white/10 transition-colors bg-white/5">
            {userAvatar ? (
              <img src={userAvatar} alt="avatar" className="w-8 h-8 rounded-full object-cover border-2 border-[#6366F1]/30" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366F1] to-[#22D3EE] flex items-center justify-center">
                <User className="w-4 h-4 text-[#070A12]" />
              </div>
            )}
            <span className="text-sm font-bold text-gray-200 hidden sm:block max-w-[120px] truncate">{userName}</span>
            <span className="w-2 h-2 rounded-full bg-[#6366F1] hidden sm:block" />
          </motion.button>

          <AnimatePresence>
            {showProfile && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-[calc(100%+8px)] w-56 bg-[#070A12]/95 backdrop-blur-2xl rounded-2xl shadow-2xl z-50 border border-[rgba(99,102,241,0.16)] overflow-hidden">
                  <div className="px-5 py-4 bg-gradient-to-b from-white/5 to-transparent">
                    <p className="text-base font-bold text-white truncate">{userName}</p>
                    <p className="text-xs font-semibold text-[#6366F1] mt-1 uppercase tracking-wider">Operations Admin</p>
                  </div>
                  <div className="p-3">
                    <button className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors flex items-center gap-3">
                      <Shield className="w-4 h-4 text-[#6366F1]" /> Profile
                    </button>
                    <button className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors flex items-center gap-3">
                      <Settings className="w-4 h-4 text-gray-400" /> Settings
                    </button>
                    <button onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-sm text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-xl transition-colors mt-1 flex items-center gap-3">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Menu Button */}
        <motion.button 
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }}
          onClick={() => { 
            setShowMobileMenu(p => !p); 
            setShowProfile(false); 
            setShowNotifications(false); 
          }}
          className="p-2.5 rounded-full hover:bg-white/10 transition-colors bg-white/5 lg:hidden flex items-center justify-center"
        >
          {showMobileMenu ? <X className="w-4 h-4 text-white" /> : <Menu className="w-4 h-4 text-gray-300" />}
        </motion.button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="absolute left-0 right-0 top-[100%] z-50 bg-[#070A12]/95 backdrop-blur-2xl border-b border-[rgba(99,102,241,0.16)] flex flex-col p-6 gap-3 lg:hidden overflow-hidden shadow-2xl"
          >
            {NAV_LINKS.map((link, idx) => {
              const active = pathname === link.href;
              return (
                <motion.div
                  key={link.href}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setShowMobileMenu(false)}
                    className={`block w-full px-5 py-3 rounded-2xl text-sm font-medium tracking-wide transition-all border ${
                      active
                        ? 'bg-[rgba(99,102,241,0.10)] border-[rgba(99,102,241,0.25)] text-[#00FF88] font-bold shadow-[0_0_15px_rgba(0,255,136,0.05)]'
                        : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
