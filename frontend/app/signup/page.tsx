'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient, isLiveSupabaseConfigured } from '@/lib/supabase/client';
import { Bot, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDemoSigningIn, setIsDemoSigningIn] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      // Always authenticate session locally so user can enter the dashboard immediately
      document.cookie = 'agentic_guest_auth=true; path=/; max-age=86400; SameSite=Lax';

      if (signUpError) {
        if (signUpError.message?.toLowerCase().includes('already registered')) {
          setError('This email is already registered. You can sign in or enter the dashboard directly.');
        } else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      setSuccess('Account created successfully! Redirecting to your Agent Console...');
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 500);
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during signup.');
      setLoading(false);
    }
  };

  const handleDemoAccess = () => {
    setIsDemoSigningIn(true);
    document.cookie = 'agentic_guest_auth=true; path=/; max-age=86400; SameSite=Lax';
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-600/15 blur-[130px] pointer-events-none -z-10" />

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
          <h1 className="text-2xl font-bold text-slate-100 font-mono">Create Operator Account</h1>
          <p className="text-sm text-slate-400 mt-1 font-sans">
            Deploy non-custodial programmable wallets & spend policies for AI agents
          </p>
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
                onClick={handleDemoAccess}
                className="w-full py-1.5 px-3 rounded-lg bg-rose-900/40 hover:bg-rose-800/40 text-rose-200 border border-rose-700/50 text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Bypass & Enter Dashboard as Operator
              </button>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs leading-relaxed space-y-2 font-mono">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>{success}</span>
              </div>
              <button
                type="button"
                onClick={handleDemoAccess}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-glow-cyan"
              >
                Go to Dashboard Now <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="signup-email-input"
                  type="email"
                  required
                  placeholder="agent.operator@domain.com"
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
                  id="signup-password-input"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="signup-confirm-password-input"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 font-mono"
                />
              </div>
            </div>

            <button
              id="signup-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-glow-cyan flex items-center justify-center gap-2 font-mono"
            >
              {loading ? 'Creating Account...' : 'Register Operator Account'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access Bypass */}
          <div className="mt-5 pt-5 border-t border-white/10 text-center">
            <button
              onClick={handleDemoAccess}
              disabled={isDemoSigningIn}
              className="w-full py-2.5 rounded-xl glass-panel hover:bg-white/10 text-cyan-400 border border-cyan-800/40 text-xs font-mono font-semibold transition-all flex items-center justify-center gap-2 group"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-12 transition-transform" />
              <span>Instant Dashboard Access (No Verification Needed)</span>
            </button>
          </div>

          <p className="mt-5 text-center text-xs text-slate-400 font-mono">
            Already have an account?{' '}
            <Link href="/login" className="text-cyan-400 hover:underline font-semibold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
