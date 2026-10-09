'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Radio,
  LogOut,
  RefreshCw,
  LayoutDashboard,
  Building2,
  Activity,
  Wallet,
  FileCode2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [userEmail, setUserEmail] = useState('samuelvinod135@gmail.com');
  const [isLiveSync, setIsLiveSync] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user session exists in Supabase
    try {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user?.email) {
          setUserEmail(data.session.user.email);
        }
      });
    } catch {
      // Fallback
    }
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('agentic_auth_token');
    }
    router.push('/login');
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 800);
  };

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Tenants', href: '/tenants', icon: Building2 },
    { name: 'Transactions', href: '/transactions', icon: Activity },
    { name: 'Wallets & Policies', href: '/wallets', icon: Wallet },
    { name: 'API Docs', href: '/docs', icon: FileCode2 },
  ];

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-[#1E293B] bg-[#07090E]/85 backdrop-blur-md transition-all shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Logo & Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[#0D111A] border border-cyan-500/30 p-1 shadow-[0_0_15px_rgba(6,182,212,0.25)] group-hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] group-hover:border-cyan-400/60 transition-all">
              <Image
                src="/agenticpay-logo.png"
                alt="AgenticPay Logo"
                width={28}
                height={28}
                className="h-7 w-7 object-contain group-hover:scale-105 transition-transform"
                priority
              />
            </div>
            <div className="flex items-baseline">
              <span className="font-mono text-base font-bold tracking-tight text-white">
                agentic<span className="text-[#06B6D4]">pay</span>
              </span>
            </div>
          </Link>

          {/* Main Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 ml-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : Boolean(pathname && (pathname === item.href || pathname.startsWith(item.href)));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Status Indicators & Session Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Network Status Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-cyan-950/40 text-cyan-300 border border-cyan-800/40">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
            <span className="font-medium">Base Sepolia (84532)</span>
          </div>

          {/* Live Sync Indicator */}
          <button
            onClick={() => setIsLiveSync(!isLiveSync)}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all border ${
              isLiveSync
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40 hover:bg-emerald-900/40'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
            title={isLiveSync ? 'Live Sync Active' : 'Live Sync Paused'}
          >
            <Radio className={`h-3 w-3 ${isLiveSync ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="text-[11px] font-medium">{isLiveSync ? 'LIVE SYNC' : 'PAUSED'}</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 border border-slate-800 transition-all disabled:opacity-50"
            title="Manual ledger sync"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* User Auth / Operator Pill */}
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-xs font-medium text-slate-200 truncate max-w-[170px]">
              {mounted ? userEmail : 'samuelvinod135@gmail.com'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Supabase Auth • Operator</span>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-rose-900/30 transition-all"
            title="Sign out of console"
          >
            <LogOut className="h-3 w-3" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
