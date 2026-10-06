'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient, isLiveSupabaseConfigured } from '@/lib/supabase/client';
import { Bot, Mail, Lock, ArrowRight, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoSigningIn, setIsDemoSigningIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (!isLiveSupabaseConfigured()) {
          setError(
            'Supabase credentials are not connected yet in .env.local. Click "Quick Demo Access" below to enter the console.'
          );
        } else if (signInError.message?.toLowerCase().includes('email not confirmed')) {
          setError('Email confirmation is pending for this account. Click "Bypass & Enter Dashboard" below to access your console now.');
        } else {
          setError(signInError.message);
        }
        setLoading(false);
        return;
      }

      // Set cookie for session persistence across middleware
      document.cookie = 'agentic_guest_auth=true; path=/; max-age=86400; SameSite=Lax';
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during login.');
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setIsDemoSigningIn(true);
    // Set guest cookie for demo/operator access
    document.cookie = 'agentic_guest_auth=true; path=/; max-age=86400; SameSite=Lax';
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative font-sans">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 blur-[130px] pointer-events-none -z-10" />

      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-[1px] shadow-glow-cyan">
              <div className="w-full h-full bg-[#090D16] rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <span className="font-bold text-xl tracking-tight text-white font-mono">
              agentic<span className="text-cyan-400">pay</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-100 font-mono">Welcome Back</h1>
          <p className="text-sm text-slate-400 mt-1">Sign in to manage your AI agent wallets & policies</p>
        </div>

        {/* Card */}
        <div className="glass-panel-glow rounded-3xl p-8 border border-white/10 shadow-glass">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs leading-relaxed space-y-2 font-mono">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full py-1.5 px-3 rounded-lg bg-rose-900/40 hover:bg-rose-800/40 text-rose-200 border border-rose-700/50 text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Bypass & Enter Dashboard as Operator
              </button>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="login-email-input"
                  type="email"
                  required
                  placeholder="agent.owner@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="login-password-input"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 font-mono"
                />
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-glow-blue flex items-center justify-center gap-2 font-mono"
            >
              {loading ? 'Authenticating...' : 'Sign In with Supabase'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Mode Bypass */}
          <div className="mt-5 pt-5 border-t border-white/10 text-center">
            <button
              id="demo-login-btn"
              type="button"
              onClick={handleDemoLogin}
              disabled={isDemoSigningIn}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/40 text-cyan-300 text-xs font-mono font-medium flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              {isDemoSigningIn ? 'Entering Console...' : 'Instant Dashboard Access (Skip Sign In)'}
            </button>
          </div>

          <p className="mt-5 text-center text-xs text-slate-400 font-mono">
            Don't have an account yet?{' '}
            <Link href="/signup" className="text-cyan-400 hover:underline font-semibold">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
