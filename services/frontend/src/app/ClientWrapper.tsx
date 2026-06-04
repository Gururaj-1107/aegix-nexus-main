"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import VoiceAssistantMic from '@/components/VoiceAssistantMic';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/login';
  const isRegister = pathname === '/register';
  const hideChrome = isLogin || isRegister;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth');
    const hasToken = token && token !== 'null' && token !== 'undefined';

    if (!hasToken) {
      if (!isLogin && !isRegister) {
        router.push('/login');
      } else {
        setLoading(false);
      }
    } else {
      if (isLogin || isRegister) {
        router.push('/');
      } else {
        setLoading(false);
      }
    }
  }, [pathname, isLogin, isRegister, router]);

  if (loading && !isLogin && !isRegister) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[#070A12] text-white font-body">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-[#6366F1]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-xs font-black tracking-[0.2em] uppercase text-gray-500 animate-pulse">Initializing Command Center...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {!hideChrome && <Header />}
      {!hideChrome && <VoiceAssistantMic />}
      <div className={`relative z-10 mx-auto flex flex-col ${
        !hideChrome 
          ? 'p-4 md:p-6 lg:p-8 max-w-[1600px] pt-0 overflow-y-auto h-[calc(100vh-56px)]' 
          : ''
      }`}>
        {children}
      </div>
    </>
  );
}
