import Link from 'next/link';
import { 
  Bot, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  Lock, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  Activity, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* Top Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-blue-600/20 via-cyan-500/10 to-transparent blur-[120px] pointer-events-none -z-10" />

      {/* Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-white/5 bg-background/60">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-[1px] shadow-glow-cyan transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-[#090D16] rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                agentic<span className="text-cyan-400">payments</span>
              </span>
              <span className="ml-2 text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
                MVP
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
            <a href="#policy-engine" className="hover:text-white transition-colors">Policy Firewall</a>
            <a href="https://sepolia.basescan.org" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
              Base Sepolia <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link 
              href="/login" 
              className="text-sm font-medium px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-all"
              id="nav-login-btn"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-glow-blue transition-all flex items-center gap-1.5"
              id="nav-dashboard-btn"
            >
              Console <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="pt-20 pb-24 px-6 max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 text-xs font-mono mb-8 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            Base Sepolia & Circle Programmable Wallets Active
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1] mb-6">
            Autonomous Payments for{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              AI Agents
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed mb-10">
            Equip autonomous agents (Eliza, LangChain, AutoGPT) with policy-enforced Web3 wallets. Non-custodial spend governance, granular daily budgets, and automated settlement.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 hover:opacity-95 text-white font-semibold text-base shadow-glow-cyan flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
              id="hero-launch-dashboard"
            >
              Open Agent Console <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl glass-panel hover:bg-white/10 text-slate-200 font-semibold text-base transition-all flex items-center justify-center gap-2"
              id="hero-signup"
            >
              Create Free Account <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Interactive Agent Flow Visualizer */}
          <div className="glass-panel-glow rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto text-left relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                <span className="ml-3 font-mono text-xs text-slate-400">agent-kernel // policy-gate-engine</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-800/40">
                <Activity className="w-3.5 h-3.5 animate-pulse" /> Policy Firewall: ACTIVE
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-mono">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-cyan-400 mb-2 font-semibold">
                    <Cpu className="w-4 h-4" /> 1. Autonomous Request
                  </div>
                  <p className="text-xs text-slate-400 font-sans">
                    Agent determines it needs to fetch paywalled RPC compute from an external provider.
                  </p>
                </div>
                <div className="mt-3 text-xs bg-slate-950 p-2 rounded text-slate-300 border border-white/5">
                  <span className="text-yellow-400">amount:</span> $0.75 USD<br />
                  <span className="text-cyan-400">dest:</span> 0x82b...A93b
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-blue-500/30 flex flex-col justify-between relative shadow-glow-blue">
                <div>
                  <div className="flex items-center gap-2 text-blue-400 mb-2 font-semibold">
                    <ShieldCheck className="w-4 h-4" /> 2. Policy Evaluation
                  </div>
                  <p className="text-xs text-slate-400 font-sans">
                    Validated against User limits: max $1.00/tx, $10.00 daily quota, allowed chain 'base-sepolia'.
                  </p>
                </div>
                <div className="mt-3 text-xs bg-blue-950/50 p-2 rounded text-emerald-300 border border-blue-800/40 font-mono">
                  [PASS] $0.75 &lt; $1.00<br />
                  [PASS] Daily: $2.10 / $10.00
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 mb-2 font-semibold">
                    <Zap className="w-4 h-4" /> 3. Base Settlement
                  </div>
                  <p className="text-xs text-slate-400 font-sans">
                    Circle Programmable Wallet broadcasts transaction on Base Sepolia.
                  </p>
                </div>
                <div className="mt-3 text-xs bg-slate-950 p-2 rounded text-slate-300 border border-white/5">
                  <span className="text-emerald-400">tx_hash:</span> 0x3b89...77c1<br />
                  <span className="text-slate-400">status:</span> confirmed (840ms)
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-20 px-6 max-w-6xl mx-auto border-t border-white/5">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Enterprise-Grade Agent Rails</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm">
              Built on the convergence of modern Next.js 14 App Router, Express, Supabase RLS, and Web3 Programmable Wallets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-cyan-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Deterministic Spend Guard</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Never worry about rogue agent loops draining your treasury. Strict per-transaction and rolling 24-hour limits enforced before signature creation.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-cyan-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Programmable Circle Wallets</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Dedicated non-custodial wallet instance per AI agent. Compatible with Circle developer-controlled wallets and Coinbase CDP on Base Sepolia.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-cyan-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Supabase Auth & RLS</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                PostgreSQL Row Level Security ensures users can only read and manage their own agents, wallets, policies, and ledger transactions.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-16 px-6 max-w-5xl mx-auto">
          <div className="glass-panel-glow rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-cyan-500/10 to-teal-500/10 pointer-events-none" />
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
              Ready to deploy your first payment-enabled agent?
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mb-8">
              Explore the agent management console, configure policy caps, and test real-time simulated transactions in 30 seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-glow-blue"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl glass-panel hover:bg-white/10 text-slate-300 font-semibold transition-all"
              >
                Sign In with Supabase
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-cyan-400" />
            <span>agentic-payments-mvp &copy; 2026. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://supabase.com" target="_blank" rel="noreferrer" className="hover:text-slate-400 transition-colors">Supabase</a>
            <a href="https://circle.com" target="_blank" rel="noreferrer" className="hover:text-slate-400 transition-colors">Circle</a>
            <a href="https://base.org" target="_blank" rel="noreferrer" className="hover:text-slate-400 transition-colors">Base</a>
            <Link href="/dashboard" className="text-cyan-400 hover:underline">Console</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
