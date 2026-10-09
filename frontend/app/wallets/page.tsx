'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import Navbar from '@/components/Navbar';
import {
  Wallet,
  Sliders,
  DollarSign,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  CheckCircle,
  Globe,
  UserCheck,
  Sparkles
} from 'lucide-react';
import {
  WalletBalance,
  AgentPolicy,
  fetchWalletBalances,
  fetchAgentPolicy,
  updateAgentPolicy
} from '@/lib/api';

const DEFAULT_AGENT_ID = '70b13fc9-253d-425e-8fdb-bbeb697129c2';

export default function WalletsPage() {
  const {
    data: balances = [],
    mutate: mutateBalances,
    isValidating: isSyncingBalances,
  } = useSWR<WalletBalance[]>('/wallets/balance', fetchWalletBalances, {
    refreshInterval: 5000,
  });

  const [agentId, setAgentId] = useState(DEFAULT_AGENT_ID);

  const {
    data: policyData,
    mutate: mutatePolicy,
  } = useSWR<AgentPolicy | null>(
    `/agents/${agentId}/policy`,
    () => fetchAgentPolicy(agentId),
    { refreshInterval: 6000 }
  );

  const [policyForm, setPolicyForm] = useState({
    single_tx_cap_usdc: 1.0,
    daily_spend_cap_usdc: 10.0,
    hitl_threshold_usdc: 20.0,
  });

  // Keep form in sync when remote policy changes
  React.useEffect(() => {
    if (policyData) {
      setPolicyForm({
        single_tx_cap_usdc: policyData.single_tx_cap_usdc,
        daily_spend_cap_usdc: policyData.daily_spend_cap_usdc,
        hitl_threshold_usdc: policyData.hitl_threshold_usdc || 20.0,
      });
    }
  }, [policyData]);

  const [savingPolicy, setSavingPolicy] = useState(false);
  const [policyNotice, setPolicyNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Interactive Policy Simulator
  const [simAmount, setSimAmount] = useState<number>(2.5);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPolicy(true);
    setPolicyNotice(null);

    const res = await updateAgentPolicy(agentId, {
      single_tx_cap_usdc: Number(policyForm.single_tx_cap_usdc),
      daily_spend_cap_usdc: Number(policyForm.daily_spend_cap_usdc),
      hitl_threshold_usdc: Number(policyForm.hitl_threshold_usdc),
    });

    setSavingPolicy(false);
    if (res.success) {
      setPolicyNotice({
        type: 'success',
        message: 'Agent spending policies updated successfully. Live boundaries enforced.',
      });
      mutatePolicy();
    } else {
      setPolicyNotice({
        type: 'error',
        message: res.error || 'Failed to update policy',
      });
    }
  };

  const getSimulationResult = (amount: number) => {
    if (amount <= 0) return { status: 'INVALID', text: 'Enter a valid transfer amount', color: 'text-slate-400', bg: 'bg-[#0E091B]' };
    if (amount > policyForm.daily_spend_cap_usdc) {
      return {
        status: 'REJECTED_DAILY',
        text: `BLOCKED: Exceeds 24-hour budget ceiling ($${policyForm.daily_spend_cap_usdc.toFixed(2)})`,
        color: 'text-rose-400',
        bg: 'bg-rose-950/40 border-rose-500/40',
      };
    }
    if (amount > policyForm.single_tx_cap_usdc) {
      return {
        status: 'REJECTED_SINGLE',
        text: `BLOCKED: Exceeds single-transaction cap ($${policyForm.single_tx_cap_usdc.toFixed(2)})`,
        color: 'text-rose-400',
        bg: 'bg-rose-950/40 border-rose-500/40',
      };
    }
    if (amount >= policyForm.hitl_threshold_usdc) {
      return {
        status: 'HITL_REQUIRED',
        text: `PAUSED: Triggers Human-in-the-Loop review threshold ($${policyForm.hitl_threshold_usdc.toFixed(2)})`,
        color: 'text-amber-300',
        bg: 'bg-amber-950/40 border-amber-500/40',
      };
    }
    return {
      status: 'AUTO_APPROVED',
      text: 'INSTANT EXECUTION: Transfer approved automatically under micro-payment policy',
      color: 'text-violet-300',
      bg: 'bg-violet-950/50 border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.25)]',
    };
  };

  const simResult = getSimulationResult(simAmount);

  // Compute portfolio valuation
  const totalUsdc = balances.reduce((acc, b) => acc + (b.usdc_balance || 0), 0);
  const totalUsdEst = totalUsdc + 157.5 + 287.0 + 225.0;

  return (
    <div className="min-h-screen bg-[#07090E] text-[#F3F0FF] flex flex-col font-sans relative">
      {/* Top Atmospheric Radial Aura */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[450px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(139,92,246,0.22),rgba(7,9,14,0))] -z-10" />

      <Navbar />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-[#F3F0FF] font-mono flex items-center gap-2">
                <Wallet className="h-6 w-6 text-violet-400" />
                Multi-Chain Balances & Spending Policy Overview
              </h1>
              <span className="rounded-full bg-violet-950/70 border border-violet-500/40 px-2.5 py-0.5 text-xs font-mono text-violet-300 shadow-[0_0_10px_rgba(139,92,246,0.2)]">
                Circle W3S
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Multi-chain wallet liquidity across Base Sepolia, Arbitrum, and Solana with dynamic policy rule editor.
            </p>
          </div>

          <button
            onClick={() => mutateBalances()}
            disabled={isSyncingBalances}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0E091B]/80 border border-violet-900/30 text-xs font-medium text-slate-300 hover:text-white hover:bg-[#150E28] transition self-start md:self-auto shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-violet-400 ${isSyncingBalances ? 'animate-spin' : ''}`} />
            Sync Balances
          </button>
        </div>

        {/* SECTION 1: Multi-Chain Wallet Balances */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
              <Globe className="h-4 w-4 text-violet-400" />
              Multi-Chain Wallet Balances
            </h2>
            <div className="text-xs font-mono text-slate-400">
              Total Estimated Portfolio:{' '}
              <span className="text-violet-200 font-bold text-sm">
                ${totalUsdEst.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {balances.map((wallet) => {
              const explorerUrl =
                wallet.chain === 'Base Sepolia'
                  ? `https://sepolia.basescan.org/address/${wallet.address}`
                  : wallet.chain === 'Arbitrum'
                  ? `https://arbiscan.io/address/${wallet.address}`
                  : `https://explorer.solana.com/address/${wallet.address}?cluster=devnet`;

              return (
                <div
                  key={wallet.chain}
                  className="rounded-2xl border border-[#1E293B] bg-[#0D111A] p-5 backdrop-blur-md shadow-glass flex flex-col justify-between hover:border-cyan-500/40 hover:bg-[#151C2C] transition-all group"
                >
                  <div>
                    {/* Chain Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-violet-900/30">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#F3F0FF] text-base font-mono">{wallet.chain}</span>
                          <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {wallet.chain === 'Base Sepolia'
                            ? 'Coinbase L2'
                            : wallet.chain === 'Arbitrum'
                            ? 'Arbitrum One'
                            : 'High-Throughput L1'}
                        </p>
                      </div>
                      <span className="text-xs font-bold font-mono text-violet-300 bg-violet-950/70 border border-violet-500/40 px-2.5 py-0.5 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.2)]">
                        ${wallet.usdc_balance.toFixed(2)} USDC
                      </span>
                    </div>

                    {/* Token Balance Currency Chips */}
                    <div className="mt-4 space-y-2.5">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono block">
                        Currency Chips
                      </span>
                      <div className="grid grid-cols-2 gap-2 font-mono">
                        {/* USDC Chip */}
                        <div className="p-2.5 rounded-xl bg-[#06040A] border border-violet-900/30 flex items-center justify-between">
                          <div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
                              USDC
                            </div>
                            <div className="text-sm font-bold text-white mt-0.5">
                              {wallet.usdc_balance.toFixed(2)}
                            </div>
                          </div>
                          <span className="text-[10px] text-indigo-300 font-bold px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/40">
                            STABLE
                          </span>
                        </div>

                        {/* Native Chip */}
                        <div className="p-2.5 rounded-xl bg-[#06040A] border border-violet-900/30 flex items-center justify-between">
                          <div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1">
                              <span
                                className={`w-2 h-2 rounded-full shadow-[0_0_6px_rgba(139,92,246,0.8)] ${
                                  wallet.native_symbol === 'ETH' ? 'bg-violet-400' : 'bg-fuchsia-400'
                                }`}
                              />
                              {wallet.native_symbol}
                            </div>
                            <div className="text-sm font-bold text-white mt-0.5">
                              {wallet.native_balance}
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded bg-[#0E091B]">
                            GAS
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Wallet Address & Explorer Link */}
                  <div className="mt-5 pt-3 border-t border-violet-900/30 font-mono text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[10px] uppercase">Wallet Address</span>
                      <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-violet-400 hover:text-violet-300 flex items-center gap-1 text-[11px]"
                      >
                        Explorer
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="flex items-center justify-between bg-[#06040A] p-2 rounded-xl border border-violet-900/30 mt-1">
                      <span className="text-[11px] text-slate-300 truncate max-w-[200px]">
                        {wallet.address}
                      </span>
                      <button
                        onClick={() => handleCopy(wallet.address, wallet.chain)}
                        className="text-slate-400 hover:text-white ml-2"
                        title="Copy Address"
                      >
                        {copiedId === wallet.chain ? (
                          <Check className="h-3.5 w-3.5 text-violet-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: Policy Rule Editor & Real-Time Simulation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
          {/* Policy Rule Form */}
          <div className="lg:col-span-7 rounded-2xl border border-[#1E293B] bg-[#0D111A] p-6 backdrop-blur-md shadow-glass space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-violet-900/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-violet-950/70 border border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                  <Sliders className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#F3F0FF] font-mono">Policy Rule Editor</h2>
                  <p className="text-xs text-slate-400">
                    Enforce programmatic spending ceilings and human-in-the-loop triggers
                  </p>
                </div>
              </div>

              {/* Agent Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">Agent:</span>
                <select
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#06040A] border border-violet-900/40 text-xs font-mono text-violet-300 focus:outline-none focus:border-violet-500 shadow-sm"
                >
                  <option value={DEFAULT_AGENT_ID}>AutoPay-Agent-01</option>
                  <option value="agent-arbitrage-02">Arbitrage-Bot-02</option>
                  <option value="agent-data-scraper-03">Scraper-SubAgent-03</option>
                </select>
              </div>
            </div>

            {policyNotice && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between shadow-sm ${
                  policyNotice.type === 'success'
                    ? 'bg-violet-950/70 border-violet-500/40 text-violet-200'
                    : 'bg-rose-950/70 border-rose-500/40 text-rose-200'
                }`}
              >
                <span>{policyNotice.message}</span>
                <button onClick={() => setPolicyNotice(null)} className="text-xs opacity-70 hover:opacity-100">
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleSavePolicy} className="space-y-6">
              {/* Rule 1: Single-Transaction Spending Cap */}
              <div className="space-y-2 p-4 rounded-2xl bg-[#06040A]/80 border border-violet-900/30">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-violet-400" />
                    Single-Transaction Spending Cap ($)
                  </label>
                  <div className="flex items-center gap-1 font-mono text-sm font-bold text-violet-300">
                    <span>$</span>
                    <input
                      type="number"
                      step="0.10"
                      min="0.10"
                      max="50.00"
                      value={policyForm.single_tx_cap_usdc}
                      onChange={(e) =>
                        setPolicyForm({ ...policyForm, single_tx_cap_usdc: parseFloat(e.target.value) || 0 })
                      }
                      className="w-20 px-2 py-0.5 rounded-lg bg-[#0E091B] border border-violet-800 text-right text-white focus:outline-none focus:border-violet-500"
                    />
                    <span className="text-xs text-slate-400">USDC</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="50"
                  step="0.5"
                  value={policyForm.single_tx_cap_usdc}
                  onChange={(e) =>
                    setPolicyForm({ ...policyForm, single_tx_cap_usdc: parseFloat(e.target.value) })
                  }
                  className="w-full accent-violet-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">
                  Maximum permitted amount for an individual autonomous micro-payment.
                </p>
              </div>

              {/* Rule 2: 24-Hour Rolling Budget Ceiling */}
              <div className="space-y-2 p-4 rounded-2xl bg-[#06040A]/80 border border-violet-900/30">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-indigo-400" />
                    24-Hour Rolling Budget Ceiling ($)
                  </label>
                  <div className="flex items-center gap-1 font-mono text-sm font-bold text-indigo-300">
                    <span>$</span>
                    <input
                      type="number"
                      step="1.00"
                      min="1.00"
                      max="500.00"
                      value={policyForm.daily_spend_cap_usdc}
                      onChange={(e) =>
                        setPolicyForm({ ...policyForm, daily_spend_cap_usdc: parseFloat(e.target.value) || 0 })
                      }
                      className="w-20 px-2 py-0.5 rounded-lg bg-[#0E091B] border border-violet-800 text-right text-white focus:outline-none focus:border-violet-500"
                    />
                    <span className="text-xs text-slate-400">USDC</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="5"
                  max="200"
                  step="5"
                  value={policyForm.daily_spend_cap_usdc}
                  onChange={(e) =>
                    setPolicyForm({ ...policyForm, daily_spend_cap_usdc: parseFloat(e.target.value) })
                  }
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Current 24h Spend: ${policyData?.current_daily_spend_usdc?.toFixed(2) || '0.00'}</span>
                  <span>
                    Remaining Budget: ${policyData?.remaining_daily_budget_usdc?.toFixed(2) || policyForm.daily_spend_cap_usdc.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Rule 3: Human-in-the-Loop Threshold Trigger */}
              <div className="space-y-2 p-4 rounded-2xl bg-[#06040A]/80 border border-amber-900/40">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-300 font-mono flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-amber-400" />
                    Human-in-the-Loop Threshold Trigger ($)
                  </label>
                  <div className="flex items-center gap-1 font-mono text-sm font-bold text-amber-400">
                    <span>$</span>
                    <input
                      type="number"
                      step="1.00"
                      min="5.00"
                      max="100.00"
                      value={policyForm.hitl_threshold_usdc}
                      onChange={(e) =>
                        setPolicyForm({ ...policyForm, hitl_threshold_usdc: parseFloat(e.target.value) || 0 })
                      }
                      className="w-20 px-2 py-0.5 rounded-lg bg-[#0E091B] border border-amber-700/60 text-right text-white focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-xs text-slate-400">USDC</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="1"
                  value={policyForm.hitl_threshold_usdc}
                  onChange={(e) =>
                    setPolicyForm({ ...policyForm, hitl_threshold_usdc: parseFloat(e.target.value) })
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">
                  Transfers exceeding this threshold will pause execution and queue for manual human operator approval.
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPolicy}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-xs font-bold font-mono text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_25px_rgba(139,92,246,0.6)] transition-all flex items-center justify-center gap-2"
                >
                  {savingPolicy && <RefreshCw className="h-4 w-4 animate-spin" />}
                  Deploy & Save Policy Rules
                </button>
              </div>
            </form>
          </div>

          {/* Policy Simulation Sandbox */}
          <div className="lg:col-span-5 rounded-2xl border border-[#1E293B] bg-[#0D111A] p-6 backdrop-blur-md shadow-glass space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-violet-900/30">
                <div className="p-2 rounded-xl bg-violet-950/70 border border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                  <Sparkles className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F3F0FF] font-mono">Live Policy Simulator</h3>
                  <p className="text-xs text-slate-400">Evaluate proposed payments against active boundaries</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-mono text-slate-300 block">
                  Simulate Transfer Amount ($ USDC)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="number"
                    step="0.25"
                    min="0.10"
                    value={simAmount}
                    onChange={(e) => setSimAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#06040A] border border-violet-900/40 text-lg font-bold font-mono text-white focus:outline-none focus:border-violet-500 shadow-sm"
                  />
                </div>

                <div className="flex gap-2">
                  {[0.5, 1.0, 5.0, 20.0, 50.0].map((quick) => (
                    <button
                      key={quick}
                      onClick={() => setSimAmount(quick)}
                      className="px-2.5 py-1 rounded-lg bg-[#0E091B] hover:bg-[#150E28] border border-violet-900/30 text-xs font-mono text-violet-300"
                    >
                      ${quick}
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulation Result Box */}
              <div className={`p-4 rounded-2xl border ${simResult.bg} space-y-2 font-mono transition-all`}>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Engine Outcome</span>
                  <span className={simResult.color}>{simResult.status}</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">{simResult.text}</p>
              </div>

              {/* Simulation Verification Matrix */}
              <div className="p-4 rounded-2xl bg-[#06040A]/80 border border-violet-900/30 space-y-2.5 text-xs font-mono">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Evaluation Checkpoints
                </span>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Single Tx Cap (${policyForm.single_tx_cap_usdc.toFixed(2)})</span>
                  {simAmount <= policyForm.single_tx_cap_usdc ? (
                    <span className="text-violet-300 flex items-center gap-1">
                      <Check className="h-3 w-3 text-violet-400" /> PASS
                    </span>
                  ) : (
                    <span className="text-rose-400">EXCEEDED</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Daily Cap (${policyForm.daily_spend_cap_usdc.toFixed(2)})</span>
                  {simAmount <= policyForm.daily_spend_cap_usdc ? (
                    <span className="text-violet-300 flex items-center gap-1">
                      <Check className="h-3 w-3 text-violet-400" /> PASS
                    </span>
                  ) : (
                    <span className="text-rose-400">EXCEEDED</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">HITL Review Trigger</span>
                  {simAmount >= policyForm.hitl_threshold_usdc ? (
                    <span className="text-amber-400">YES (&gt;=${policyForm.hitl_threshold_usdc})</span>
                  ) : (
                    <span className="text-violet-300">NO (AUTOMATED)</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-violet-900/30 text-[11px] text-slate-400 font-mono flex items-center justify-between">
              <span>Policy Enforcement: Active</span>
              <span className="text-violet-300 font-bold">Circle W3S Connected</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
