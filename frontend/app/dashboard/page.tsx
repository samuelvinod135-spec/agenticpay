'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  Bot,
  ShieldCheck,
  Zap,
  Activity,
  LogOut,
  Plus,
  RefreshCw,
  ExternalLink,
  Wallet,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Sliders,
  DollarSign,
  TrendingUp,
  Server,
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface WalletData {
  id: string;
  agent_id: string;
  wallet_address: string;
  chain: string;
  provider: 'circle' | 'cdp';
  created_at: string;
}

interface PolicyData {
  id: string;
  agent_id: string;
  daily_limit_usd: number;
  max_per_tx_usd: number;
  allowed_chains_json: string[];
  created_at: string;
}

interface AgentData {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  wallet?: WalletData;
  policy?: PolicyData;
}

interface TransactionData {
  id: string;
  agent_id: string;
  amount_usd: number;
  tx_hash: string | null;
  status: 'pending' | 'confirmed' | 'failed';
  failure_reason?: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>('demo-agent-master@agentic-payments.xyz');
  const [authToken, setAuthToken] = useState<string>('demo-token');
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [backendHealth, setBackendHealth] = useState<{ status: string; uptime: number; supabaseConfigured: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal / Form state for new agent
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentProvider, setNewAgentProvider] = useState<'circle' | 'cdp'>('circle');
  const [newAgentDailyLimit, setNewAgentDailyLimit] = useState(10);
  const [newAgentMaxPerTx, setNewAgentMaxPerTx] = useState(1.0);
  const [creatingAgent, setCreatingAgent] = useState(false);

  // Policy Edit state
  const [selectedAgentForPolicy, setSelectedAgentForPolicy] = useState<AgentData | null>(null);
  const [editDailyLimit, setEditDailyLimit] = useState<number>(10);
  const [editMaxPerTx, setEditMaxPerTx] = useState<number>(1);
  const [savingPolicy, setSavingPolicy] = useState(false);

  // Simulator state
  const [simAgentId, setSimAgentId] = useState<string>('');
  const [simAmount, setSimAmount] = useState<number>(0.75);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<{ success: boolean; message: string; txHash?: string } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    initAuthAndFetch();
  }, []);

  const initAuthAndFetch = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      let token = 'demo-token';
      if (session) {
        token = session.access_token;
        setUserEmail(session.user.email || 'Authenticated User');
      }
      setAuthToken(token);

      // Check backend health
      try {
        const hRes = await fetch(`${API_URL}/health`);
        if (hRes.ok) {
          const hData = await hRes.json();
          setBackendHealth(hData);
        }
      } catch (err) {
        console.warn('Backend /health unreachable:', err);
      }

      // Fetch Agents
      await fetchAgentsAndTxs(token);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentsAndTxs = async (token: string) => {
    try {
      const [agentRes, txRes] = await Promise.all([
        fetch(`${API_URL}/api/agents`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/transactions`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (agentRes.ok) {
        const data = await agentRes.json();
        setAgents(data.agents || []);
        if (data.agents && data.agents.length > 0 && !simAgentId) {
          setSimAgentId(data.agents[0].id);
          setSelectedAgentForPolicy(data.agents[0]);
          setEditDailyLimit(data.agents[0].policy?.daily_limit_usd || 10);
          setEditMaxPerTx(data.agents[0].policy?.max_per_tx_usd || 1);
        }
      }

      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions || []);
      }
    } catch (err: any) {
      console.warn('API fetch warning:', err);
    }
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingAgent(true);
    try {
      const res = await fetch(`${API_URL}/api/agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: newAgentName,
          provider: newAgentProvider,
          dailyLimitUsd: Number(newAgentDailyLimit),
          maxPerTxUsd: Number(newAgentMaxPerTx)
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create agent');
      }

      setShowCreateModal(false);
      setNewAgentName('');
      await fetchAgentsAndTxs(authToken);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreatingAgent(false);
    }
  };

  const handleUpdatePolicy = async () => {
    if (!selectedAgentForPolicy) return;
    setSavingPolicy(true);
    try {
      const res = await fetch(`${API_URL}/api/policies/${selectedAgentForPolicy.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          dailyLimitUsd: Number(editDailyLimit),
          maxPerTxUsd: Number(editMaxPerTx),
          allowedChains: ['base-sepolia']
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update policy');
      }

      await fetchAgentsAndTxs(authToken);
      alert('Policy limits updated successfully!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingPolicy(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!simAgentId) return;
    setSimulating(true);
    setSimResult(null);

    try {
      const res = await fetch(`${API_URL}/api/transactions/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          agentId: simAgentId,
          amountUsd: Number(simAmount)
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setSimResult({
          success: false,
          message: data.reason || data.message || 'Payment rejected by policy engine.'
        });
      } else {
        setSimResult({
          success: true,
          message: data.message,
          txHash: data.transaction?.tx_hash
        });
      }

      await fetchAgentsAndTxs(authToken);
    } catch (err: any) {
      setSimResult({
        success: false,
        message: err.message || 'Network error simulating payment.'
      });
    } finally {
      setSimulating(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    document.cookie = 'agentic_guest_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/login');
  };

  const totalSpend24h = transactions
    .filter(t => t.status === 'confirmed')
    .reduce((sum, t) => sum + Number(t.amount_usd), 0);

  const confirmedCount = transactions.filter(t => t.status === 'confirmed').length;

  return (
    <div className="min-h-screen pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-md border-b border-white/10 bg-background/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 p-[1px]">
                <div className="w-full h-full bg-[#090D16] rounded-lg flex items-center justify-center">
                  <Bot className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <span className="font-bold text-base tracking-tight text-white">
                agentic<span className="text-cyan-400">payments</span>
              </span>
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1.5 ml-4 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-950/60 text-blue-300 border border-blue-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
              Base Sepolia Testnet
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-medium text-slate-200">{userEmail}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {authToken === 'demo-token' ? 'Demo Sandbox Session' : 'Supabase Authenticated'}
              </span>
            </div>

            <button
              id="dashboard-refresh-btn"
              onClick={() => fetchAgentsAndTxs(authToken)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              id="dashboard-signout-btn"
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/40 border border-rose-900/30 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        {/* Banner: Backend & Network Status */}
        <div className="glass-panel p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
            <div className="text-xs">
              <span className="font-semibold text-slate-200">Express API: </span>
              <span className="font-mono text-emerald-400">{API_URL} ({backendHealth ? `Online • Uptime ${backendHealth.uptime}s` : 'Connecting...'})</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <div>Engine: <span className="text-cyan-400">Circle Programmable Wallets</span></div>
            <div>Chain: <span className="text-blue-400">Base Sepolia (84532)</span></div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>ACTIVE AGENTS</span>
              <Bot className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">{agents.length}</div>
            <div className="text-[11px] text-slate-500 mt-1">Autonomous wallet instances</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>24H SPEND VOLUME</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              ${totalSpend24h.toFixed(2)} <span className="text-xs text-slate-400 font-normal">USD</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Under strict daily policy limits</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>SETTLED TRANSACTIONS</span>
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">{confirmedCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Verified on Base Sepolia</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>POLICY FIREWALL</span>
              <ShieldCheck className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-teal-400">ACTIVE</div>
            <div className="text-[11px] text-slate-500 mt-1">Per-tx & rolling 24h checks</div>
          </div>
        </div>

        {/* Main Grid: Agents Fleet + Policy Control */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Agent Fleet (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Autonomous Agent Fleet</h2>
                <p className="text-xs text-slate-400">Configured agents with non-custodial programmable wallets</p>
              </div>
              <button
                id="open-create-agent-modal-btn"
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-glow-blue transition-all"
              >
                <Plus className="w-4 h-4" /> Deploy Agent
              </button>
            </div>

            {loading ? (
              <div className="glass-panel p-12 rounded-2xl text-center text-slate-400 text-sm">
                Loading agents from backend...
              </div>
            ) : agents.length === 0 ? (
              <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
                <Bot className="w-10 h-10 text-slate-600 mx-auto" />
                <div className="text-sm font-semibold text-slate-300">No AI agents deployed yet</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click 'Deploy Agent' to provision a Circle Programmable Wallet on Base Sepolia with spend limits.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    onClick={() => {
                      setSelectedAgentForPolicy(agent);
                      setSimAgentId(agent.id);
                      setEditDailyLimit(agent.policy?.daily_limit_usd || 10);
                      setEditMaxPerTx(agent.policy?.max_per_tx_usd || 1);
                    }}
                    className={`glass-panel p-5 rounded-2xl border transition-all cursor-pointer ${
                      selectedAgentForPolicy?.id === agent.id
                        ? 'border-cyan-500/60 shadow-glow-cyan bg-slate-900/90'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <h3 className="font-semibold text-sm text-white">{agent.name}</h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                            {agent.wallet?.provider || 'circle'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 font-mono text-xs text-slate-400">
                          <Wallet className="w-3.5 h-3.5 text-slate-500" />
                          <span>{agent.wallet?.wallet_address || 'No wallet attached'}</span>
                          {agent.wallet?.wallet_address && (
                            <a
                              href={`https://sepolia.basescan.org/address/${agent.wallet.wallet_address}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-400 hover:text-cyan-300"
                              title="View on BaseScan"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="text-right font-mono text-xs shrink-0">
                        <div className="text-slate-400">Daily Cap: <span className="text-emerald-400 font-semibold">${agent.policy?.daily_limit_usd}</span></div>
                        <div className="text-slate-400">Max/Tx: <span className="text-cyan-400 font-semibold">${agent.policy?.max_per_tx_usd}</span></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Policy Limits Panel (1 Col) */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Policy Controls</h2>
              <p className="text-xs text-slate-400">Spend rules enforced for selected agent</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
              {selectedAgentForPolicy ? (
                <>
                  <div className="border-b border-white/5 pb-3">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Selected Agent</span>
                    <div className="text-sm font-semibold text-cyan-300">{selectedAgentForPolicy.name}</div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Daily Limit (USD)
                    </label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        id="policy-daily-limit-input"
                        type="number"
                        step="0.5"
                        value={editDailyLimit}
                        onChange={(e) => setEditDailyLimit(parseFloat(e.target.value) || 0)}
                        className="glass-input w-full pl-9 pr-3 py-2 rounded-xl text-sm font-mono text-slate-100"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">Maximum 24-hour total spend</span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Max Per Transaction (USD)
                    </label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        id="policy-max-tx-input"
                        type="number"
                        step="0.1"
                        value={editMaxPerTx}
                        onChange={(e) => setEditMaxPerTx(parseFloat(e.target.value) || 0)}
                        className="glass-input w-full pl-9 pr-3 py-2 rounded-xl text-sm font-mono text-slate-100"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">Single transaction cap</span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Permitted Chains
                    </label>
                    <div className="flex items-center gap-2 font-mono text-xs p-2 rounded-lg bg-slate-900 border border-white/5 text-slate-300">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400" /> base-sepolia (84532)
                    </div>
                  </div>

                  <button
                    id="save-policy-btn"
                    onClick={handleUpdatePolicy}
                    disabled={savingPolicy}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-glow-blue transition-all"
                  >
                    {savingPolicy ? 'Updating Policy...' : 'Save Policy Changes'}
                  </button>
                </>
              ) : (
                <div className="text-center py-8 text-xs text-slate-500">
                  Select an agent from the fleet to configure spend policies
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Micropayment Simulation Studio */}
        <div className="glass-panel-glow p-6 rounded-2xl border border-cyan-500/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white">Live Micropayment Execution Simulator</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate autonomous agent payment requests to verify policy firewall compliance in real-time.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Target AI Agent</label>
              <select
                id="simulate-agent-select"
                value={simAgentId}
                onChange={(e) => setSimAgentId(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs font-mono text-slate-100"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id} className="bg-slate-900 text-white">
                    {a.name} (Max: ${a.policy?.max_per_tx_usd})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Requested Amount (USD)</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="simulate-amount-input"
                  type="number"
                  step="0.05"
                  value={simAmount}
                  onChange={(e) => setSimAmount(parseFloat(e.target.value) || 0)}
                  className="glass-input w-full pl-9 pr-3 py-2 rounded-xl text-xs font-mono text-slate-100"
                />
              </div>
            </div>

            <button
              id="simulate-payment-btn"
              onClick={handleSimulatePayment}
              disabled={simulating || !simAgentId}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 hover:opacity-90 disabled:opacity-50 text-white text-xs font-semibold shadow-glow-cyan flex items-center justify-center gap-2 transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              {simulating ? 'Evaluating Policy...' : 'Execute Agent Payment'}
            </button>
          </div>

          {/* Result Feedback Banner */}
          {simResult && (
            <div
              className={`mt-5 p-4 rounded-xl text-xs flex items-start gap-3 border ${
                simResult.success
                  ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/40 text-rose-300'
              }`}
            >
              {simResult.success ? (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              )}
              <div className="space-y-1 font-mono">
                <div className="font-semibold">{simResult.success ? 'Transaction Approved & Signed' : 'Transaction Blocked by Firewall'}</div>
                <div className="text-[11px] opacity-90">{simResult.message}</div>
                {simResult.txHash && (
                  <div className="pt-1 text-[11px]">
                    tx_hash:{' '}
                    <a
                      href={`https://sepolia.basescan.org/tx/${simResult.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-300 underline inline-flex items-center gap-1"
                    >
                      {simResult.txHash} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Transaction History Ledger */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Agent Transaction Ledger</h2>
              <p className="text-xs text-slate-400">Non-custodial on-chain micro-payments and policy rejection logs</p>
            </div>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/60 border-b border-white/10 text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Tx Hash / Reason</th>
                    <th className="px-5 py-3 font-medium">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-slate-500 font-sans">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-white/[0.02]">
                        <td className="px-5 py-3 whitespace-nowrap">
                          {tx.status === 'confirmed' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                              <CheckCircle className="w-3 h-3" /> confirmed
                            </span>
                          ) : tx.status === 'failed' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-rose-950/60 text-rose-400 border border-rose-800/40">
                              <XCircle className="w-3 h-3" /> rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-amber-950/60 text-amber-400 border border-amber-800/40">
                              <Activity className="w-3 h-3" /> pending
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-100 whitespace-nowrap">
                          ${Number(tx.amount_usd).toFixed(2)} USD
                        </td>
                        <td className="px-5 py-3 text-slate-400">
                          {tx.tx_hash ? (
                            <a
                              href={`https://sepolia.basescan.org/tx/${tx.tx_hash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                            >
                              {tx.tx_hash.slice(0, 18)}... <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-rose-400 font-sans text-[11px]">{tx.failure_reason || 'Policy check failure'}</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                          {new Date(tx.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Create Agent Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel-glow w-full max-w-md p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-cyan-400" /> Deploy AI Agent Wallet
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ESC / close
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Agent Name</label>
                <input
                  id="modal-agent-name-input"
                  type="text"
                  required
                  placeholder="e.g. Eliza Arbitrage Bot #3"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Wallet Provider</label>
                <select
                  id="modal-agent-provider-select"
                  value={newAgentProvider}
                  onChange={(e) => setNewAgentProvider(e.target.value as 'circle' | 'cdp')}
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs text-slate-100"
                >
                  <option value="circle" className="bg-slate-900">Circle Programmable Wallet (Base Sepolia)</option>
                  <option value="cdp" className="bg-slate-900">Coinbase CDP AgentKit (Base Sepolia)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Daily Cap ($)</label>
                  <input
                    id="modal-agent-daily-limit"
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={newAgentDailyLimit}
                    onChange={(e) => setNewAgentDailyLimit(parseFloat(e.target.value) || 10)}
                    className="glass-input w-full px-3 py-2 rounded-xl text-xs font-mono text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Max Per Tx ($)</label>
                  <input
                    id="modal-agent-max-per-tx"
                    type="number"
                    step="0.5"
                    min="0.1"
                    required
                    value={newAgentMaxPerTx}
                    onChange={(e) => setNewAgentMaxPerTx(parseFloat(e.target.value) || 1)}
                    className="glass-input w-full px-3 py-2 rounded-xl text-xs font-mono text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl glass-panel text-slate-300 text-xs hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  id="modal-create-agent-submit"
                  type="submit"
                  disabled={creatingAgent}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-glow-blue"
                >
                  {creatingAgent ? 'Deploying...' : 'Confirm & Deploy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
