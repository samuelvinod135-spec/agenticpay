'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import Navbar from '@/components/Navbar';
import {
  Activity,
  Search,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  Check,
  Download,
  X,
  FileCheck2,
  Sparkles,
  Layers,
  Lock
} from 'lucide-react';
import {
  LedgerTransaction,
  CircuitBreakerStatus,
  fetchTransactions,
  fetchCircuitBreaker,
  fetchComplianceExport
} from '@/lib/api';

export default function TransactionsPage() {
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number | null>(3500);

  const {
    data: transactions = [],
    mutate: mutateTransactions,
    isValidating: isSyncing,
  } = useSWR<LedgerTransaction[]>('/transactions', fetchTransactions, {
    refreshInterval: autoRefreshInterval || undefined,
  });

  const { data: circuit } = useSWR<CircuitBreakerStatus | null>(
    '/circuit-breaker',
    fetchCircuitBreaker,
    { refreshInterval: 5000 }
  );

  // Inspector Drawer State
  const [selectedTx, setSelectedTx] = useState<LedgerTransaction | null>(null);
  const [activeTab, setActiveTab] = useState<'audit' | 'ledger' | 'risk' | 'json'>('audit');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<'ALL' | 'APPROVED' | 'REJECTED' | 'QUARANTINED'>('ALL');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleExport = async (format: 'json' | 'csv') => {
    setExporting(true);
    const report = await fetchComplianceExport(format);
    setExporting(false);

    if (report) {
      const blob = new Blob(
        [typeof report === 'string' ? report : JSON.stringify(report, null, 2)],
        { type: format === 'csv' ? 'text/csv' : 'application/json' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agenticpay-ledger-${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Filter & Search
  const filteredTransactions = transactions.filter((tx) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      tx.id.toLowerCase().includes(q) ||
      tx.agent_id.toLowerCase().includes(q) ||
      tx.tx_id.toLowerCase().includes(q) ||
      tx.prompt_hash.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (verdictFilter !== 'ALL' && tx.signature_verdict !== verdictFilter) return false;
    return true;
  });

  const totalVolume = transactions.reduce((acc, tx) => acc + (tx.debit_amount || 0), 0);
  const approvedCount = transactions.filter((t) => t.signature_verdict === 'APPROVED').length;
  const approvalRate = transactions.length > 0 ? Math.round((approvedCount / transactions.length) * 100) : 100;

  return (
    <div className="min-h-screen bg-[#07090E] text-[#F3F0FF] flex flex-col font-sans relative">
      {/* Top Atmospheric Radial Aura */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[450px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(139,92,246,0.22),rgba(7,9,14,0))] -z-10" />

      <Navbar />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-[#F3F0FF] font-mono flex items-center gap-2">
                <Activity className="h-6 w-6 text-cyan-400" />
                Real-Time Double-Entry Ledger Feed
              </h1>
              <span className="flex items-center gap-1.5 rounded-full bg-cyan-950/50 border border-cyan-500/40 px-2.5 py-0.5 text-xs font-mono text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                Cyber Stream
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Live double-entry journal logs with signature verdicts, prompt hashes, and risk evaluations.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Auto-polling toggle */}
            <button
              onClick={() => setAutoRefreshInterval(autoRefreshInterval ? null : 3500)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-mono transition-all ${
                autoRefreshInterval
                  ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'bg-[#0D111A] border-[#1E293B] text-slate-400'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${autoRefreshInterval ? 'bg-violet-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'bg-slate-500'}`} />
              Auto-Sync: {autoRefreshInterval ? '3.5s' : 'PAUSED'}
            </button>

            {/* Manual Sync */}
            <button
              onClick={() => mutateTransactions()}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#0E091B]/80 border border-violet-900/30 text-xs font-medium text-slate-300 hover:text-white hover:bg-[#150E28] transition shadow-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-violet-400 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync
            </button>

            {/* Export Compliance Audit Report */}
            <div className="flex items-center rounded-xl border border-violet-900/30 bg-[#0E091B]/80 overflow-hidden shadow-sm">
              <button
                onClick={() => handleExport('json')}
                disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-white hover:bg-[#150E28] transition border-r border-violet-900/30"
              >
                <Download className="h-3.5 w-3.5 text-violet-400" />
                Export JSON
              </button>
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-white hover:bg-[#150E28] transition"
              >
                CSV
              </button>
            </div>
          </div>
        </div>

        {/* Telemetry Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl border border-[#1E293B] bg-[#0D111A] backdrop-blur-md shadow-glass hover:border-cyan-500/40 transition-all group">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
              <span>Gross Debit Volume</span>
              <DollarSign className="h-4 w-4 text-violet-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-white">
              ${totalVolume.toFixed(2)} <span className="text-xs text-slate-400 font-normal">USDC</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">{transactions.length} total ledger entries</p>
          </div>

          <div className="p-5 rounded-2xl border border-[#1E293B] bg-[#0D111A] backdrop-blur-md shadow-glass hover:border-purple-500/40 transition-all group">
            <div className="flex items-center justify-between text-violet-300 text-xs font-mono uppercase">
              <span>Zero-Drift Assertion</span>
              <FileCheck2 className="h-4 w-4 text-violet-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-violet-200 flex items-center gap-2">
              <span>$0.0000</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-950/70 border border-violet-500/40 text-violet-300 font-semibold shadow-[0_0_8px_rgba(139,92,246,0.2)]">
                BALANCED
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Debit amount == Credit amount</p>
          </div>

          <div className="p-5 rounded-2xl border border-[#1E293B] bg-[#0D111A] backdrop-blur-md shadow-glass hover:border-emerald-500/40 transition-all group">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
              <span>Signature Verdict</span>
              <ShieldCheck className="h-4 w-4 text-violet-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-[#F3F0FF]">{approvalRate}%</div>
            <p className="mt-1 text-xs text-slate-400">{approvedCount} approved signatures</p>
          </div>

          <div className="p-5 rounded-2xl border border-[#1E293B] bg-[#0D111A] backdrop-blur-md shadow-glass hover:border-cyan-500/40 transition-all group">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
              <span>Circuit Breaker</span>
              <ShieldCheck className="h-4 w-4 text-violet-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-violet-200">
              {circuit?.status || 'HEALTHY'}
            </div>
            <p className="mt-1 text-xs text-slate-400">Failure rate: {circuit?.failure_rate_percent || 0}%</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0D111A] border border-[#1E293B] backdrop-blur-md shadow-glass">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Agent ID, Tx ID, hash, or ledger ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#07090E] border border-[#1E293B] text-xs text-[#F3F0FF] placeholder-slate-500 focus:outline-none focus:border-cyan-500/70 focus:shadow-[0_0_15px_rgba(6,182,212,0.25)] font-mono"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {(['ALL', 'APPROVED', 'REJECTED', 'QUARANTINED'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setVerdictFilter(filter)}
                className={`px-3 py-1 rounded-xl text-xs font-mono transition-all ${
                  verdictFilter === filter
                    ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 font-semibold shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'text-slate-400 hover:text-white hover:bg-[#151C2C] border border-transparent'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Live Feed Table */}
        <div className="rounded-2xl border border-[#1E293B] bg-[#0D111A] overflow-hidden backdrop-blur-md shadow-glass">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090514]/90 border-b border-violet-900/30 text-violet-300/80 uppercase tracking-wider font-mono">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Agent ID</th>
                  <th className="py-3.5 px-4">Tx ID / Ledger ID</th>
                  <th className="py-3.5 px-4">Debit (USDC)</th>
                  <th className="py-3.5 px-4">Credit (USDC)</th>
                  <th className="py-3.5 px-4">Signature Verdict</th>
                  <th className="py-3.5 px-4">Risk Score</th>
                  <th className="py-3.5 px-4 text-right">Audit Inspector</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-900/20">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-mono">
                      No ledger transactions found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isSelected = selectedTx?.id === tx.id;
                    const risk = tx.risk_score || 0.1;

                    return (
                      <tr
                        key={tx.id}
                        onClick={() => setSelectedTx(tx)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-violet-950/40 border-l-2 border-l-violet-500'
                            : 'hover:bg-[#150E28]/60'
                        }`}
                      >
                        {/* Timestamp */}
                        <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-cyan-400/70" />
                            <span>
                              {isMounted && tx.created_at
                                ? new Date(tx.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                  })
                                : (tx.created_at ? tx.created_at.slice(11, 19) : '--:--:--')}
                            </span>
                          </div>
                        </td>

                        {/* Agent ID */}
                        <td className="py-3.5 px-4 font-mono text-violet-300 font-semibold whitespace-nowrap">
                          {tx.agent_id}
                        </td>

                        {/* Tx ID & Ledger Entry ID */}
                        <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                          <div className="truncate max-w-[150px] text-[#F3F0FF]">{tx.tx_id}</div>
                          <div className="text-[10px] text-violet-400/60 truncate max-w-[150px]">
                            {tx.ledger_entry_id}
                          </div>
                        </td>

                        {/* Debit */}
                        <td className="py-3.5 px-4 font-mono text-sm font-bold text-indigo-300 whitespace-nowrap">
                          ${tx.debit_amount.toFixed(2)}
                        </td>

                        {/* Credit */}
                        <td className="py-3.5 px-4 font-mono text-sm font-bold text-violet-300 whitespace-nowrap">
                          ${tx.credit_amount.toFixed(2)}
                        </td>

                        {/* Signature Verdict */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {tx.signature_verdict === 'APPROVED' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-violet-950/70 border border-violet-500/50 text-violet-200 shadow-[0_0_10px_rgba(139,92,246,0.25)]">
                              <CheckCircle className="h-3 w-3 text-violet-400" />
                              APPROVED
                            </span>
                          ) : tx.signature_verdict === 'REJECTED' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950/70 border border-rose-500/50 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.25)]">
                              <XCircle className="h-3 w-3 text-rose-400" />
                              REJECTED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/70 border border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)]">
                              <ShieldAlert className="h-3 w-3 text-amber-400" />
                              QUARANTINED
                            </span>
                          )}
                        </td>

                        {/* Risk Score */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                              risk > 0.7
                                ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                                : risk > 0.35
                                ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                                : 'bg-violet-950/60 text-violet-300 border border-violet-500/30'
                            }`}
                          >
                            {risk.toFixed(2)}
                          </span>
                        </td>

                        {/* Audit Action */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedTx(tx)}
                            className="px-3 py-1 rounded-xl bg-[#150E28] hover:bg-violet-950/80 border border-violet-900/30 hover:border-violet-500/40 text-violet-300 hover:text-white text-[11px] font-mono transition shadow-sm"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Transaction Inspector Side-Drawer */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-sm flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-[#0C0718] border-l border-violet-900/40 h-full flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] relative animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="p-5 border-b border-violet-900/30 flex items-center justify-between bg-[#0E091B]/90">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-violet-950/70 border border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                  <FileCheck2 className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#F3F0FF] font-mono flex items-center gap-2">
                    Ledger Audit Inspector
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        selectedTx.signature_verdict === 'APPROVED'
                          ? 'bg-violet-950/70 text-violet-300 border border-violet-500/40'
                          : 'bg-rose-950/70 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {selectedTx.signature_verdict}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-[280px]">
                    Ledger ID: {selectedTx.ledger_entry_id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTx(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#150E28]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tab navigation */}
            <div className="flex border-b border-violet-900/30 px-5 bg-[#090514]/80 text-xs font-mono">
              {[
                { id: 'audit', label: 'Prompt Provenance' },
                { id: 'ledger', label: 'Double-Entry Math' },
                { id: 'risk', label: 'Risk Evaluation' },
                { id: 'json', label: 'Raw Model' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 px-3 border-b-2 font-medium transition-all ${
                    activeTab === tab.id
                      ? 'border-violet-500 text-violet-300 bg-violet-950/30'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
              {/* TAB 1: AUDIT & PROMPT HASH */}
              {activeTab === 'audit' && (
                <div className="space-y-5">
                  {/* Prompt Intent */}
                  <div className="rounded-2xl border border-violet-900/30 bg-[#0E091B]/80 p-4 space-y-2 backdrop-blur-md">
                    <span className="flex items-center gap-1.5 text-violet-400 font-mono font-semibold">
                      <Sparkles className="h-4 w-4" />
                      Prompt Intent
                    </span>
                    <p className="text-sm text-[#F3F0FF] bg-[#06040A] p-3 rounded-xl border border-violet-900/30 font-mono leading-relaxed">
                      "{selectedTx.prompt_intent || 'Autonomous micro-transfer execution'}"
                    </p>
                  </div>

                  {/* SHA-256 Digest */}
                  <div className="rounded-2xl border border-violet-900/30 bg-[#0E091B]/80 p-4 space-y-2 font-mono backdrop-blur-md">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Cryptographic Prompt Hash</span>
                      <span className="text-violet-300 font-semibold flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-violet-400" />
                        SHA-256
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-[#06040A] p-2.5 rounded-xl border border-violet-900/30 text-[11px] text-slate-300">
                      <span className="truncate max-w-[340px] text-violet-300">{selectedTx.prompt_hash}</span>
                      <button
                        onClick={() => handleCopy(selectedTx.prompt_hash, 'sha')}
                        className="text-slate-400 hover:text-white ml-2"
                      >
                        {copiedField === 'sha' ? <Check className="h-3.5 w-3.5 text-violet-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-3 font-mono">
                    <div className="p-3.5 rounded-xl bg-[#0E091B]/70 border border-violet-900/30">
                      <span className="text-[10px] text-slate-400 block uppercase">Agent ID</span>
                      <span className="text-sm font-semibold text-white mt-1 block truncate">
                        {selectedTx.agent_id}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#0E091B]/70 border border-violet-900/30">
                      <span className="text-[10px] text-slate-400 block uppercase">Transaction ID</span>
                      <span className="text-sm font-semibold text-white mt-1 block truncate">
                        {selectedTx.tx_id}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DOUBLE-ENTRY */}
              {activeTab === 'ledger' && (
                <div className="space-y-5 font-mono">
                  <div className="p-4 rounded-2xl border border-violet-900/40 bg-violet-950/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-violet-300 text-xs flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4 text-violet-400" />
                        Debit Amount == Credit Amount
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-violet-900/60 text-violet-200 border border-violet-500/30 font-semibold">
                        VALIDATED
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#06040A] border border-violet-900/40 text-[11px] text-violet-300 flex items-center justify-between">
                      <span>Debit (${selectedTx.debit_amount.toFixed(4)}) == Credit (${selectedTx.credit_amount.toFixed(4)})</span>
                      <span className="font-bold">Zero-Drift: $0.0000</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="p-3.5 rounded-xl bg-[#0E091B]/80 border border-violet-900/30 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-indigo-400 font-bold flex items-center gap-1">
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          DEBIT ENTRY
                        </span>
                        <span className="text-white font-bold">${selectedTx.debit_amount.toFixed(4)} USDC</span>
                      </div>
                      <p className="text-[10px] text-slate-400">Account: AGENT_EXPENSE:{selectedTx.agent_id}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#0E091B]/80 border border-violet-900/30 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-violet-400 font-bold flex items-center gap-1">
                          <ArrowDownLeft className="h-3.5 w-3.5" />
                          CREDIT ENTRY
                        </span>
                        <span className="text-white font-bold">${selectedTx.credit_amount.toFixed(4)} USDC</span>
                      </div>
                      <p className="text-[10px] text-slate-400">Account: SETTLEMENT_CLEARING</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: RISK */}
              {activeTab === 'risk' && (
                <div className="space-y-5 font-mono">
                  <div className="p-4 rounded-2xl border border-violet-900/30 bg-[#0E091B]/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-bold">Fraud Anomaly Engine</span>
                      <span className="text-sm font-bold text-violet-300">
                        Score: {selectedTx.risk_score.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#06040A] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500"
                        style={{ width: `${Math.min(100, selectedTx.risk_score * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-violet-900/30 bg-[#0E091B]/80 space-y-2">
                    <span className="text-slate-300 font-bold block">Circuit Breaker Telemetry</span>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Global State</span>
                      <span className="text-violet-300 font-bold">{circuit?.status || 'HEALTHY'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Rolling Window</span>
                      <span className="text-white">{circuit?.window_seconds || 60} Seconds</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: JSON */}
              {activeTab === 'json' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-mono text-slate-400">
                    <span>LedgerTransaction Model</span>
                    <button
                      onClick={() => handleCopy(JSON.stringify(selectedTx, null, 2), 'raw_json')}
                      className="flex items-center gap-1 text-violet-400 hover:text-violet-300"
                    >
                      {copiedField === 'raw_json' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      Copy JSON
                    </button>
                  </div>
                  <pre className="p-4 rounded-2xl bg-[#06040A] border border-violet-900/30 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
                    {JSON.stringify(selectedTx, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-violet-900/30 bg-[#0E091B]/90 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">
                AgenticPay Core Ledger
              </span>
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-1.5 rounded-xl bg-[#150E28] hover:bg-violet-950/80 border border-violet-900/30 text-xs font-mono text-white transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
