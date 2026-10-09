import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Lock, 
  Layers, 
  Cpu, 
  Activity, 
  ChevronRight,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen text-[#F3F0FF] selection:bg-cyan-500 selection:text-black bg-[#07090E]">
      {/* Top Background Radial Atmosphere */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(139,92,246,0.22),rgba(7,9,14,0))] blur-2xl pointer-events-none -z-10" />

      {/* Unified Top Navigation */}
      <Navbar />

      {/* Hero Section */}
      <main>
        <section className="pt-16 pb-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
          {/* Logo Glyph Hero Feature */}
          <div className="flex justify-center mb-6">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-[#0D111A] border border-cyan-500/40 p-3.5 shadow-[0_0_40px_rgba(6,182,212,0.35)] hover:shadow-[0_0_50px_rgba(139,92,246,0.5)] transition-all hover:scale-105">
              <Image
                src="/agenticpay-logo.png"
                alt="AgenticPay Shield"
                width={76}
                height={76}
                className="h-20 w-20 object-contain drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                priority
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-xs font-mono mb-8 shadow-[0_0_15px_rgba(6,182,212,0.2)] animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Cyber Violet & Cyan Rails Active (Base Sepolia + Circle)
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1] mb-6 font-mono">
            Autonomous Payments for{' '}
            <span className="bg-gradient-to-r from-cyan-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
              AI Agents
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed mb-10">
            Equip autonomous agents (Eliza, LangChain, CrewAI) with policy-enforced Web3 wallets. Non-custodial spend governance, granular daily budgets, and automated settlement.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] hover:from-[#0891B2] hover:to-[#7C3AED] text-white font-mono font-semibold text-base shadow-[0_0_25px_rgba(6,182,212,0.45)] flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
              id="hero-launch-dashboard"
            >
              Open Console <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/docs"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0D111A] hover:bg-[#151C2C] border border-[#1E293B] text-slate-200 hover:text-white font-mono font-semibold text-base transition-all flex items-center justify-center gap-2 shadow-glass"
              id="hero-docs"
            >
              Interactive API Sandbox <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Interactive Agent Flow Visualizer */}
          <div className="glass-panel-glow rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto text-left relative overflow-hidden border border-[#1E293B] bg-[#0D111A]/90">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
                <span className="ml-3 font-mono text-xs text-slate-400">agent-kernel // policy-gate-engine</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 bg-cyan-950/50 px-2.5 py-1 rounded-md border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.25)]">
                <Activity className="w-3.5 h-3.5 animate-pulse text-cyan-400" /> Policy Firewall: ACTIVE
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-mono">
              <div className="p-4 rounded-xl bg-[#07090E] border border-[#1E293B] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-cyan-300 mb-2 font-semibold">
                    <Cpu className="w-4 h-4 text-cyan-400" /> 1. Autonomous Request
                  </div>
                  <p className="text-xs text-slate-400 font-sans">
                    Agent determines it needs to fetch paywalled RPC compute from an external provider.
                  </p>
                </div>
                <div className="mt-3 text-xs bg-[#0D111A] p-2 rounded text-slate-200 border border-[#1E293B]">
                  <span className="text-amber-400">amount:</span> $0.75 USD<br />
                  <span className="text-cyan-400">dest:</span> 0x82b...A93b
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#07090E] border border-cyan-500/40 flex flex-col justify-between relative shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <div>
                  <div className="flex items-center gap-2 text-purple-300 mb-2 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-purple-400" /> 2. Policy Evaluation
                  </div>
                  <p className="text-xs text-slate-400 font-sans">
                    Validated against User limits: max $1.00/tx, $10.00 daily quota, allowed chain 'base-sepolia'.
                  </p>
                </div>
                <div className="mt-3 text-xs bg-cyan-950/40 p-2 rounded text-emerald-300 border border-cyan-800/40 font-mono">
                  [PASS] $0.75 &lt; $1.00<br />
                  [PASS] Daily: $2.10 / $10.00
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#07090E] border border-[#1E293B] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 mb-2 font-semibold">
                    <Zap className="w-4 h-4" /> 3. Base Settlement
                  </div>
                  <p className="text-xs text-slate-400 font-sans">
                    Circle Programmable Wallet broadcasts transaction on Base Sepolia.
                  </p>
                </div>
                <div className="mt-3 text-xs bg-[#0D111A] p-2 rounded text-slate-200 border border-[#1E293B]">
                  <span className="text-emerald-400">tx_hash:</span> 0x3b89...77c1<br />
                  <span className="text-slate-400">status:</span> confirmed (840ms)
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-[#1E293B]">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-3 font-mono text-white">Enterprise-Grade Agent Rails</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm">
              Built on Next.js 14 App Router, Express, PostgreSQL Ledger, and Web3 Programmable Wallets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel p-6 rounded-2xl border border-[#1E293B] bg-[#0D111A] hover:border-cyan-500/40 hover:bg-[#151C2C] transition-all">
              <div className="w-12 h-12 rounded-xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-5 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 font-mono text-[#F3F0FF]">Deterministic Spend Guard</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Never worry about rogue agent loops draining your treasury. Strict per-transaction and rolling 24-hour limits enforced before signature creation.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-[#1E293B] bg-[#0D111A] hover:border-purple-500/40 hover:bg-[#151C2C] transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-950/50 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-5 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 font-mono text-[#F3F0FF]">Programmable Circle Wallets</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Dedicated non-custodial wallet instance per AI agent. Compatible with Circle developer-controlled wallets and Coinbase CDP on Base Sepolia.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-[#1E293B] bg-[#0D111A] hover:border-emerald-500/40 hover:bg-[#151C2C] transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 font-mono text-[#F3F0FF]">Double-Entry Ledger</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Immutable, cryptographically verifiable financial transactions with instant quarantine triggers and dynamic circuit breaker controls.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="glass-panel-glow rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden border border-[#1E293B] bg-[#0D111A]">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 via-purple-500/10 to-indigo-500/10 pointer-events-none" />
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 font-mono text-[#F3F0FF]">
              Ready to deploy your first payment-enabled agent?
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mb-8">
              Explore the agent management console, configure policy caps, and test real-time simulated transactions in seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] hover:from-[#0891B2] hover:to-[#7C3AED] text-white font-mono font-semibold transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              >
                Go to Console
              </Link>
              <Link
                href="/docs"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#07090E] hover:bg-[#151C2C] border border-[#1E293B] text-slate-200 font-mono font-semibold transition-all"
              >
                Interactive API Docs
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1E293B] py-12 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/agenticpay-logo.png"
              alt="AgenticPay Logo"
              width={20}
              height={20}
              className="h-5 w-5 object-contain"
            />
            <span className="text-slate-400">AgenticPay &copy; 2026. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-slate-300 transition-colors">Dashboard</Link>
            <Link href="/tenants" className="hover:text-slate-300 transition-colors">Tenants</Link>
            <Link href="/transactions" className="hover:text-slate-300 transition-colors">Transactions</Link>
            <Link href="/wallets" className="hover:text-slate-300 transition-colors">Wallets</Link>
            <Link href="/docs" className="hover:text-slate-300 transition-colors">API Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
