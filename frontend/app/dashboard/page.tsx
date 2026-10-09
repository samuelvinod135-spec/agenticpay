'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
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
  Copy,
  Check,
  Clock,
  Send,
  Radio,
  ArrowUpRight,
  Server,
  Key,
  FileText,
  CheckSquare,
  CreditCard,
  Lock,
  Search,
  CheckCheck
} from 'lucide-react';

interface WalletData {
  id: string;
  agent_id?: string;
  wallet_address: string;
  chain?: string;
  provider?: 'circle' | 'cdp' | string;
  created_at?: string;
}

interface PolicyData {
  id?: string;
  agent_id?: string;
  daily_limit_usd?: number;
  max_per_tx_usd?: number;
  daily_limit?: number;
  max_per_transaction?: number;
  allowed_chains_json?: string[];
  created_at?: string;
}

interface AgentData {
  id: string;
  user_id?: string;
  name: string;
  created_at?: string;
  wallet?: WalletData;
  policy?: PolicyData;
}

interface TransactionItem {
  id: string;
  transaction_id?: string | null;
  wallet_id: string;
  destination_address: string;
  amount: number | string;
  token_address?: string;
  blockchain?: string;
  status: string;
  tx_hash?: string | null;
  amount_usd?: number;
  failure_reason?: string;
  created_at: string;
  updated_at?: string;
}

const TARGET_AGENT_NAME = 'AutoPay-Agent-01';
const TARGET_WALLET_ID = 'f94177bd-764a-5951-b5fa-0b2968f7a682';
const TARGET_WALLET_ADDRESS = '0x9f4d4f18475a4218fe6afef72352f0b9e52fdb3d';

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>('samuelvinod135@gmail.com');
  const [authToken, setAuthToken] = useState<string>('demo-token');
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [backendHealth, setBackendHealth] = useState<{ status: string; uptime: number; supabaseConfigured: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // Payment Execution / Simulator state
  const [simWalletId, setSimWalletId] = useState<string>(TARGET_WALLET_ID);
  const [simDestination, setSimDestination] = useState<string>('0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
  const [simAmount, setSimAmount] = useState<number>(0.50);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<{ success: boolean; message: string; reason?: string; txHash?: string } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // Active Tab state for Day 17 Developer Web Dashboard
  const [activeTab, setActiveTab] = useState<'overview' | 'policies' | 'audit' | 'apikeys' | 'approvals' | 'cards'>('overview');

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditFilterAgent, setAuditFilterAgent] = useState('');
  const [loadingAudit, setLoadingAudit] = useState(false);

  // API Key Manager state
  const [apiKeys, setApiKeys] = useState<{ id: string; keyPrefix: string; keyName: string; createdAt: string; status: string }[]>([
    { id: '1', keyPrefix: 'ag_live_7a9c', keyName: 'Default Production Key', createdAt: new Date().toISOString(), status: 'ACTIVE' },
  ]);
  const [newKeyOrgName, setNewKeyOrgName] = useState('Production Operations');
  const [generatedKeyResult, setGeneratedKeyResult] = useState<{ apiKey: string; keyPrefix: string } | null>(null);
  const [generatingKey, setGeneratingKey] = useState(false);

  // Approvals Queue state
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  // Virtual Cards state
  const [virtualCards, setVirtualCards] = useState<any[]>([
    {
      id: 'vcc_demo_4492',
      lastFour: '4242',
      spendingLimitUsd: 100,
      spentAmountUsd: 15.50,
      memo: 'Cloud Compute API Sandbox',
      status: 'ACTIVE',
      expiryMonth: '12',
      expiryYear: '28',
    },
  ]);
  const [newCardLimit, setNewCardLimit] = useState(50);
  const [newCardMemo, setNewCardMemo] = useState('OpenAI API Subscription');
  const [newCardMcc, setNewCardMcc] = useState('7372');
  const [issuingCard, setIssuingCard] = useState(false);

  // Hierarchy Linking state
  const [linkParentId, setLinkParentId] = useState('');
  const [linkChildId, setLinkChildId] = useState('');
  const [linkingHierarchy, setLinkingHierarchy] = useState(false);
  const [linkResultMsg, setLinkResultMsg] = useState('');

  useEffect(() => {
    initAuthAndFetch();
  }, []);

  // Auto-refresh interval (polling every 4 seconds for instant webhook update visibility)
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData(false);
    }, 4000);

    return () => clearInterval(interval);
  }, [autoRefresh, authToken]);

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

      // Fetch health and initial data
      await Promise.all([
        checkBackendHealth(),
        fetchData(false, token)
      ]);
    } catch (err: any) {
      console.warn('Dashboard init error:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkBackendHealth = async () => {
    try {
      const hRes = await fetch(`${API_URL}/health`);
      if (hRes.ok) {
        const hData = await hRes.json();
        setBackendHealth(hData);
      }
    } catch (err) {
      console.warn('Backend /health unreachable:', err);
    }
  };

  const fetchData = async (showSpinner = true, token = authToken) => {
    if (showSpinner) setRefreshing(true);
    try {
      // 1. Fetch transactions directly from Supabase (anon client) and backend API in parallel
      const supabase = createClient();
      
      const [sbTxPromise, apiTxPromise, agentRes] = await Promise.allSettled([
        supabase.from('transactions').select('*').order('created_at', { ascending: false }),
        fetch(`${API_URL}/api/v1/transactions`),
        fetch(`${API_URL}/api/agents`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      // Process Transactions
      let loadedTxs: TransactionItem[] = [];
      if (sbTxPromise.status === 'fulfilled' && !sbTxPromise.value.error && sbTxPromise.value.data) {
        loadedTxs = sbTxPromise.value.data as TransactionItem[];
      } else if (apiTxPromise.status === 'fulfilled' && apiTxPromise.value.ok) {
        const apiData = await apiTxPromise.value.json();
        if (apiData.transactions) loadedTxs = apiData.transactions;
      }
      setTransactions(loadedTxs);

      // Process Agents
      if (agentRes.status === 'fulfilled' && agentRes.value.ok) {
        const agentData = await agentRes.value.json();
        const agentList: AgentData[] = agentData.agents || [];
        setAgents(agentList);

        // Auto-select target agent or first agent
        const target = agentList.find(a => a.name === TARGET_AGENT_NAME) || agentList[0];
        if (target) {
          setSelectedAgentForPolicy(target);
          if (target.wallet?.id) setSimWalletId(target.wallet.id);
          const daily = target.policy?.daily_limit ?? target.policy?.daily_limit_usd ?? 10;
          const maxTx = target.policy?.max_per_transaction ?? target.policy?.max_per_tx_usd ?? 1;
          setEditDailyLimit(daily);
          setEditMaxPerTx(maxTx);
        }
      }
    } catch (err: any) {
      console.warn('Dashboard data fetch warning:', err);
    } finally {
      if (showSpinner) setRefreshing(false);
    }
  };

  const handleCopyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const url = auditFilterAgent
        ? `${API_URL}/api/v1/audit-logs?agentId=${encodeURIComponent(auditFilterAgent)}`
        : `${API_URL}/api/v1/audit-logs`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.warn('Failed to fetch audit logs:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  const fetchPendingApprovals = async () => {
    setLoadingApprovals(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/approvals/pending`);
      if (res.ok) {
        const data = await res.json();
        setPendingApprovals(data.approvals || []);
      }
    } catch (err) {
      console.warn('Failed to fetch approvals:', err);
    } finally {
      setLoadingApprovals(false);
    }
  };

  const handleDecideApproval = async (approvalId: string, decision: 'APPROVE' | 'REJECT') => {
    setDecidingId(approvalId);
    try {
      const res = await fetch(`${API_URL}/api/v1/approvals/${approvalId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, operatorId: userEmail, reason: 'Reviewed by dashboard operator' }),
      });
      if (res.ok) {
        await fetchPendingApprovals();
        await fetchData(false);
      }
    } catch (err) {
      console.error('Failed to decide approval:', err);
    } finally {
      setDecidingId(null);
    }
  };

  const handleGenerateKey = async () => {
    setGeneratingKey(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/organizations/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgName: newKeyOrgName }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedKeyResult({ apiKey: data.apiKey, keyPrefix: data.keyPrefix });
        setApiKeys((prev) => [
          {
            id: String(Date.now()),
            keyPrefix: data.keyPrefix,
            keyName: newKeyOrgName,
            createdAt: new Date().toISOString(),
            status: 'ACTIVE',
          },
          ...prev,
        ]);
      }
    } catch (err) {
      console.error('Failed to generate key:', err);
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleIssueCard = async () => {
    setIssuingCard(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/cards/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: targetAgent.id,
          spendingLimitUsd: newCardLimit,
          memo: newCardMemo,
          allowedMcc: newCardMcc ? [newCardMcc] : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setVirtualCards((prev) => [
          {
            id: data.card.id,
            lastFour: data.card.lastFour,
            spendingLimitUsd: data.card.spendingLimitUsd,
            spentAmountUsd: data.card.spentAmountUsd,
            memo: data.card.memo,
            status: data.card.status,
            expiryMonth: data.card.expiryMonth,
            expiryYear: data.card.expiryYear,
          },
          ...prev,
        ]);
      }
    } catch (err) {
      console.error('Failed to issue virtual card:', err);
    } finally {
      setIssuingCard(false);
    }
  };

  const handleLinkHierarchy = async () => {
    if (!linkParentId || !linkChildId) return;
    setLinkingHierarchy(true);
    setLinkResultMsg('');
    try {
      const res = await fetch(`${API_URL}/api/v1/agents/hierarchy/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childAgentId: linkChildId,
          parentAgentId: linkParentId,
          childDailyCapUsdc: 5.0,
          parentDailyCapUsdc: 10.0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setLinkResultMsg(`Sub-agent ${linkChildId} successfully linked under parent ${linkParentId}!`);
      } else {
        setLinkResultMsg(`Notice: ${data.error || 'Check agent IDs'}`);
      }
    } catch (err: any) {
      setLinkResultMsg(`Notice: ${err.message}`);
    } finally {
      setLinkingHierarchy(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') fetchAuditLogs();
    if (activeTab === 'approvals') fetchPendingApprovals();
  }, [activeTab]);

  // Find target agent "AutoPay-Agent-01" or build target card display
  const targetAgent = agents.find(a => a.name === TARGET_AGENT_NAME) || {
    id: '70b13fc9-253d-425e-8fdb-bbeb697129c2',
    name: TARGET_AGENT_NAME,
    wallet: {
      id: TARGET_WALLET_ID,
      wallet_address: TARGET_WALLET_ADDRESS,
      chain: 'base-sepolia',
      provider: 'circle'
    },
    policy: {
      daily_limit: 10.00,
      daily_limit_usd: 10.00,
      max_per_transaction: 1.00,
      max_per_tx_usd: 1.00
    }
  };

  // Target Agent limits
  const dailyLimitValue = targetAgent.policy?.daily_limit ?? targetAgent.policy?.daily_limit_usd ?? 10.00;
  const maxPerTxValue = targetAgent.policy?.max_per_transaction ?? targetAgent.policy?.max_per_tx_usd ?? 1.00;

  // Calculate real-time daily spend for target wallet (from today's completed/initiated transactions)
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const todayTxs = transactions.filter(t => {
    const isTarget =
      t.wallet_id === TARGET_WALLET_ID ||
      t.wallet_id === TARGET_WALLET_ADDRESS ||
      (targetAgent.wallet && t.wallet_id === targetAgent.wallet.id);
    const txDate = new Date(t.created_at);
    const isStatusActive = ['COMPLETE', 'INITIATED', 'PENDING', 'confirmed'].includes(t.status);
    return isTarget && txDate >= todayStart && isStatusActive;
  });

  const dailySpentAmount = todayTxs.reduce((sum, t) => {
    const amt = typeof t.amount === 'number' ? t.amount : parseFloat(String(t.amount || t.amount_usd || 0));
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);

  const spendProgressPercent = Math.min(100, Math.max(0, (dailySpentAmount / dailyLimitValue) * 100));

  // Global totals
  const totalSettledCount = transactions.filter(t =>
    ['COMPLETE', 'confirmed'].includes(t.status)
  ).length;

  const totalRejectedCount = transactions.filter(t =>
    ['REJECTED', 'FAILED', 'failed'].includes(t.status)
  ).length;

  const totalVolumeUsdc = transactions
    .filter(t => ['COMPLETE', 'confirmed'].includes(t.status))
    .reduce((sum, t) => sum + (parseFloat(String(t.amount || t.amount_usd || 0)) || 0), 0);

  // Trigger test payment (calls /api/v1/payments/transfer to test policy enforcement & Circle live execution)
  const handleExecutePayment = async (amountToTransfer: number) => {
    setSimulating(true);
    setSimResult(null);

    try {
      const res = await fetch(`${API_URL}/api/v1/payments/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletId: simWalletId,
          destinationAddress: simDestination,
          amount: amountToTransfer,
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setSimResult({
          success: false,
          message: data.error || 'Payment Request Rejected',
          reason: data.reason || data.message || 'Exceeds per-transaction policy limit'
        });
      } else {
        setSimResult({
          success: true,
          message: data.message || 'Payment successfully initiated on Base Sepolia',
          txHash: data.transaction?.txHash || data.transaction?.transactionId
        });
      }

      // Immediate refresh of ledger
      await fetchData(false);
    } catch (err: any) {
      setSimResult({
        success: false,
        message: 'Network error connecting to payment gateway',
        reason: err.message
      });
    } finally {
      setSimulating(false);
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
        throw new Error(err.message || 'Failed to deploy agent');
      }

      setShowCreateModal(false);
      setNewAgentName('');
      await fetchData(true);
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

      await fetchData(false);
      alert('Policy limits updated successfully!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingPolicy(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    document.cookie = 'agentic_guest_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/login');
  };

  return (
    <div className="min-h-screen pb-20 text-[#F3F0FF] bg-[#07090E] font-sans selection:bg-cyan-500/30">
      {/* Top Background Radial Atmosphere */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[420px] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(139,92,246,0.22),rgba(7,9,14,0))] blur-2xl pointer-events-none -z-10" />

      {/* Unified Top Navbar */}
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        {/* Banner: System Status & Webhook Listener */}
        <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-white/10 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
            <div className="text-xs">
              <span className="font-semibold text-slate-200">Express API Gateway: </span>
              <span className="font-mono text-emerald-400">{API_URL}</span>
              <span className="text-slate-400 ml-2 font-mono">
                {backendHealth ? `(Online • Uptime: ${backendHealth.uptime}s)` : '(Connecting...)'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              Webhook Listener: <span className="text-cyan-300">/api/v1/webhooks/circle</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              Provider: <span className="text-blue-300">Circle Developer-Controlled</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-[#1E293B] pb-3 overflow-x-auto scrollbar-none">
          {[
            { id: 'overview', label: 'Overview & Ledger', icon: Activity },
            { id: 'policies', label: 'Agents & Policy Sliders', icon: Sliders },
            { id: 'audit', label: 'Compliance Audit Logs', icon: FileText },
            { id: 'apikeys', label: 'API Key Manager', icon: Key },
            { id: 'approvals', label: 'Human Approvals Queue', icon: CheckSquare },
            { id: 'cards', label: 'Virtual Credit Cards', icon: CreditCard },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'text-slate-400 hover:text-white hover:bg-[#151C2C] border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'overview' && (
          <>
            {/* ============================================================== */}
            {/* REQUIREMENT 1: AGENT & POLICY SUMMARY CARD                     */}
            {/* ============================================================== */}
            <div className="relative overflow-hidden glass-panel-glow p-6 sm:p-8 rounded-3xl border border-cyan-500/30 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            {/* Header: Target Agent Identification & Status */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-glow-cyan">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white font-mono">
                      {targetAgent.name}
                    </h1>
                    {/* Status Badge: ACTIVE */}
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-sans">
                    Autonomous Payment Agent • Real-Time Policy Guarded on Base Sepolia
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-glow-blue transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Deploy Another Agent
                </button>
              </div>
            </div>

            {/* Grid: Wallet Address, Wallet ID, Network & Policy Specs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Linked Wallet Address */}
              <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span className="flex items-center gap-1.5 uppercase font-mono tracking-wider text-[11px]">
                    <Wallet className="w-3.5 h-3.5 text-cyan-400" /> Linked Wallet
                  </span>
                  <a
                    href={`https://sepolia.basescan.org/address/${targetAgent.wallet?.wallet_address || TARGET_WALLET_ADDRESS}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
                    title="View on BaseScan"
                  >
                    BaseScan <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center justify-between gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-white/5 font-mono text-xs">
                  <span className="text-slate-200 truncate">
                    {targetAgent.wallet?.wallet_address || TARGET_WALLET_ADDRESS}
                  </span>
                  <button
                    onClick={() => handleCopyAddress(targetAgent.wallet?.wallet_address || TARGET_WALLET_ADDRESS)}
                    className="text-slate-400 hover:text-white p-1 transition-colors shrink-0"
                    title="Copy full address"
                  >
                    {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between">
                  <span>Wallet ID:</span>
                  <span className="text-slate-400 truncate max-w-[170px]">
                    {targetAgent.wallet?.id || TARGET_WALLET_ID}
                  </span>
                </div>
              </div>

              {/* Network Details */}
              <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-2">
                <div className="text-slate-400 text-xs uppercase font-mono tracking-wider text-[11px]">
                  Blockchain Network
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-white font-mono pt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                  Base Sepolia
                </div>
                <div className="text-[11px] text-slate-400 font-mono space-y-0.5">
                  <div>Chain ID: <span className="text-slate-200">84532</span></div>
                  <div>Settlement Token: <span className="text-cyan-400">USDC (ERC-20)</span></div>
                </div>
              </div>

              {/* Policy Limits Card */}
              <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-2">
                <div className="text-slate-400 text-xs uppercase font-mono tracking-wider text-[11px] flex items-center justify-between">
                  <span>Enforced Policy Rules</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-400">Max Per Tx:</span>
                  <span className="font-mono text-sm font-bold text-cyan-400">
                    ${Number(maxPerTxValue).toFixed(2)} USDC
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">24h Limit:</span>
                  <span className="font-mono text-sm font-bold text-emerald-400">
                    ${Number(dailyLimitValue).toFixed(2)} USDC
                  </span>
                </div>
              </div>
            </div>

            {/* Daily Spend Progress Bar */}
            <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 bg-slate-900/60 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
                    Daily Spend Budget Usage
                  </span>
                </div>
                <div className="font-mono text-sm">
                  <span className="font-bold text-emerald-400">${dailySpentAmount.toFixed(2)}</span>
                  <span className="text-slate-400"> used out of </span>
                  <span className="font-bold text-white">${dailyLimitValue.toFixed(2)} USDC</span>
                  <span className="text-slate-400 text-xs"> daily limit</span>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full h-3.5 bg-slate-950/80 rounded-full overflow-hidden p-0.5 border border-white/10 relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 transition-all duration-700 ease-out shadow-[0_0_12px_rgba(6,182,212,0.5)]"
                  style={{ width: `${Math.max(spendProgressPercent, 2)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>{spendProgressPercent.toFixed(1)}% utilized today</span>
                <span className="text-cyan-300 font-medium">
                  ${Math.max(0, dailyLimitValue - dailySpentAmount).toFixed(2)} USDC remaining
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>ACTIVE AGENTS</span>
              <Bot className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">{agents.length || 1}</div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">{TARGET_AGENT_NAME} active</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>TOTAL 24H VOLUME</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              ${totalVolumeUsdc.toFixed(2)} <span className="text-xs text-slate-400 font-normal">USDC</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Settled Base Sepolia transfers</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>SETTLED TRANSACTIONS</span>
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">{totalSettledCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Confirmed on-chain</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>POLICY VIOLATIONS CAUGHT</span>
              <ShieldCheck className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-rose-400">{totalRejectedCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Blocked before chain submission</div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* REQUIREMENT 2: LIVE TRANSACTION LEDGER TABLE                   */}
        {/* ============================================================== */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-mono">Live Transaction Ledger</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                  {transactions.length} Records
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time synchronized on-chain transfers, policy rejections, and Circle webhook confirmations
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Webhook Auto-Sync
              </span>
            </div>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/80 border-b border-white/10 text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Timestamp</th>
                    <th className="px-5 py-3.5 font-semibold">Recipient Address</th>
                    <th className="px-5 py-3.5 font-semibold">Amount (USDC)</th>
                    <th className="px-5 py-3.5 font-semibold">Status Badge</th>
                    <th className="px-5 py-3.5 font-semibold">BaseScan Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {loading && transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-slate-500 font-sans">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                          <span>Loading real-time ledger from Supabase...</span>
                        </div>
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-slate-500 font-sans">
                        No transactions recorded yet in Supabase. Run a transfer below to populate the ledger.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const rawAmt = tx.amount !== undefined ? tx.amount : tx.amount_usd;
                      const parsedAmt = typeof rawAmt === 'number' ? rawAmt : parseFloat(String(rawAmt || 0));
                      const upperStatus = String(tx.status || '').toUpperCase();

                      // Status Badge Styles
                      // Green: COMPLETE / confirmed
                      // Yellow: INITIATED / PENDING / pending
                      // Red: REJECTED / FAILED / failed
                      const isComplete = ['COMPLETE', 'CONFIRMED', 'SUCCESS'].includes(upperStatus);
                      const isInitiated = ['INITIATED', 'PENDING'].includes(upperStatus);
                      const isRejected = ['REJECTED', 'FAILED'].includes(upperStatus);

                      return (
                        <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                          {/* 1. Timestamp */}
                          <td className="px-5 py-3.5 whitespace-nowrap text-slate-400">
                            {isMounted && tx.created_at
                              ? new Date(tx.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })
                              : (tx.created_at ? tx.created_at.slice(11, 19) : '--:--:--')}{' '}
                            <span className="text-[10px] text-slate-500 block">
                              {isMounted && tx.created_at
                                ? new Date(tx.created_at).toLocaleDateString()
                                : (tx.created_at ? tx.created_at.slice(0, 10) : '----/--/--')}
                            </span>
                          </td>

                          {/* 2. Recipient Address */}
                          <td className="px-5 py-3.5 font-mono text-slate-200 whitespace-nowrap">
                            <span className="text-slate-300 hover:text-white transition-colors" title={tx.destination_address}>
                              {tx.destination_address ? (
                                `${tx.destination_address.slice(0, 8)}...${tx.destination_address.slice(-6)}`
                              ) : (
                                <span className="text-slate-500">N/A</span>
                              )}
                            </span>
                          </td>

                          {/* 3. Amount (USDC) */}
                          <td className="px-5 py-3.5 font-bold text-slate-100 whitespace-nowrap">
                            ${isNaN(parsedAmt) ? '0.00' : parsedAmt.toFixed(2)}{' '}
                            <span className="text-[10px] font-normal text-slate-400">USDC</span>
                          </td>

                          {/* 4. Status Badge */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            {isComplete ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                COMPLETE
                              </span>
                            ) : isInitiated ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                <Activity className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                                {upperStatus || 'INITIATED'}
                              </span>
                            ) : isRejected ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                {upperStatus === 'FAILED' ? 'REJECTED (FAILED)' : 'REJECTED'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                {upperStatus}
                              </span>
                            )}
                          </td>

                          {/* 5. BaseScan Link */}
                          <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">
                            {tx.tx_hash ? (
                              <a
                                href={`https://sepolia.basescan.org/tx/${tx.tx_hash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 hover:underline font-mono text-[11px]"
                                title="Verify on BaseScan Sepolia"
                              >
                                {tx.tx_hash.slice(0, 10)}...{tx.tx_hash.slice(-6)}
                                <ExternalLink className="w-3 h-3 ml-0.5" />
                              </a>
                            ) : tx.transaction_id ? (
                              <span className="text-[11px] text-slate-500 font-mono">
                                Circle ID: {tx.transaction_id.slice(0, 8)}...
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-500 font-sans">
                                Blocked (Policy Firewall)
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Interactive Payment Tester & Policy Editor Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2">
          {/* Autonomous Payment Simulator (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                <Send className="w-4 h-4 text-cyan-400" /> Autonomous Payment Simulator
              </h2>
              <p className="text-xs text-slate-400">
                Trigger autonomous micropayments directly to verify policy enforcement and Circle settlement
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                    Sender Wallet
                  </label>
                  <select
                    value={simWalletId}
                    onChange={(e) => setSimWalletId(e.target.value)}
                    className="glass-input w-full px-3 py-2.5 rounded-xl text-xs font-mono text-slate-200"
                  >
                    <option value={TARGET_WALLET_ID} className="bg-slate-900">
                      AutoPay-Agent-01 (Circle f94177bd...)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                    Recipient EVM Address
                  </label>
                  <input
                    type="text"
                    value={simDestination}
                    onChange={(e) => setSimDestination(e.target.value)}
                    className="glass-input w-full px-3 py-2.5 rounded-xl text-xs font-mono text-slate-200"
                    placeholder="0x..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                  Transfer Amount (USDC)
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="number"
                      step="0.10"
                      min="0.01"
                      value={simAmount}
                      onChange={(e) => setSimAmount(parseFloat(e.target.value) || 0)}
                      className="glass-input w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-mono text-white font-bold"
                    />
                  </div>

                  {/* Preset quick test buttons */}
                  <button
                    type="button"
                    onClick={() => handleExecutePayment(0.50)}
                    disabled={simulating}
                    className="px-3.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-semibold transition-all"
                    title="Send $0.50 (Compliant with $1.00 max/tx policy)"
                  >
                    Test $0.50 (Pass)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleExecutePayment(2.50)}
                    disabled={simulating}
                    className="px-3.5 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-mono font-semibold transition-all"
                    title="Send $2.50 (Exceeds $1.00 limit -> Expect 403 Rejection)"
                  >
                    Test $2.50 (Reject)
                  </button>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  Enforces: Max $1.00/tx • Rolling $10.00/day
                </span>
                <button
                  onClick={() => handleExecutePayment(simAmount)}
                  disabled={simulating || simAmount <= 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold font-mono shadow-glow-blue transition-all"
                >
                  {simulating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Evaluating Policy...
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" /> Execute Payment
                    </>
                  )}
                </button>
              </div>

              {/* Simulation Result Alert */}
              {simResult && (
                <div
                  className={`p-4 rounded-xl border font-mono text-xs animate-fade-in ${
                    simResult.success
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {simResult.success ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <div className="font-bold">
                        {simResult.success ? 'Payment Approved & Initiated' : 'Policy Engine Rejection'}
                      </div>
                      <div className="text-[11px] opacity-90">{simResult.message}</div>
                      {simResult.reason && (
                        <div className="text-[11px] text-rose-300">Reason: {simResult.reason}</div>
                      )}
                      {simResult.txHash && (
                        <div className="text-[10px] text-cyan-300 truncate">
                          Tx Reference: {simResult.txHash}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Policy Controls Panel (1 Col) */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" /> Policy Engine Controls
              </h2>
              <p className="text-xs text-slate-400">Modify autonomous spending limits dynamically</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                  Daily Limit (USDC)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={editDailyLimit}
                    onChange={(e) => setEditDailyLimit(parseFloat(e.target.value) || 0)}
                    className="glass-input w-full pl-9 pr-3 py-2 rounded-xl text-xs font-mono text-white"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">Maximum 24-hour total spend</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 font-mono">
                  Max Per Transaction (USDC)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    value={editMaxPerTx}
                    onChange={(e) => setEditMaxPerTx(parseFloat(e.target.value) || 0)}
                    className="glass-input w-full pl-9 pr-3 py-2 rounded-xl text-xs font-mono text-white"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">Single transaction hard cap</span>
              </div>

              <button
                onClick={handleUpdatePolicy}
                disabled={savingPolicy}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold font-mono transition-all"
              >
                {savingPolicy ? 'Saving Limits...' : 'Update Policy Engine'}
              </button>
            </div>
          </div>
        </div>
        </>
      )}

        {/* Tab 2: Agents & Policy Sliders */}
        {activeTab === 'policies' && (
          <div className="space-y-6 animate-fade-in">
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-cyan-400" /> Dynamic Policy Rules & Sliders
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Calibrate autonomous spending limits in real-time with automatic database enforcement
                  </p>
                </div>
                <button
                  onClick={handleUpdatePolicy}
                  disabled={savingPolicy}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-mono font-bold shadow-glow-cyan transition-all"
                >
                  {savingPolicy ? 'Syncing to Engine...' : 'Save Policy Changes'}
                </button>
              </div>

              {/* Sliders Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Daily Limit Slider */}
                <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-slate-900/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" /> Rolling 24h Spend Cap
                    </label>
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-mono text-sm font-bold">
                      ${Number(editDailyLimit).toFixed(2)} USDC
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={editDailyLimit}
                    onChange={(e) => setEditDailyLimit(parseFloat(e.target.value) || 1)}
                    className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-slate-500">
                    <span>$1.00 (Minimal)</span>
                    <span>$50.00 (Standard)</span>
                    <span>$100.00 (Max Cap)</span>
                  </div>
                </div>

                {/* Max Per Tx Slider */}
                <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-slate-900/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" /> Single Transaction Hard Cap
                    </label>
                    <span className="px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-mono text-sm font-bold">
                      ${Number(editMaxPerTx).toFixed(2)} USDC
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.10"
                    max="10.00"
                    step="0.10"
                    value={editMaxPerTx}
                    onChange={(e) => setEditMaxPerTx(parseFloat(e.target.value) || 0.1)}
                    className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-slate-500">
                    <span>$0.10 (Micro)</span>
                    <span>$5.00 (Medium)</span>
                    <span>$10.00 (Single Cap)</span>
                  </div>
                </div>
              </div>

              {/* Sub-Agent Hierarchy Card */}
              <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
                <h3 className="text-sm font-bold font-mono text-slate-200 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-purple-400" /> Sub-Agent Hierarchy Umbrella Linker
                </h3>
                <p className="text-xs text-slate-400">
                  Bind worker agents under an umbrella parent agent to enforce aggregate organization spending caps.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Parent Agent ID</label>
                    <input
                      type="text"
                      placeholder="e.g. parent-orchestrator-alpha"
                      value={linkParentId}
                      onChange={(e) => setLinkParentId(e.target.value)}
                      className="glass-input w-full px-3 py-2 rounded-xl text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Sub-Agent (Worker) ID</label>
                    <input
                      type="text"
                      placeholder="e.g. sub-worker-scraper"
                      value={linkChildId}
                      onChange={(e) => setLinkChildId(e.target.value)}
                      className="glass-input w-full px-3 py-2 rounded-xl text-xs font-mono text-white"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handleLinkHierarchy}
                    disabled={linkingHierarchy || !linkParentId || !linkChildId}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-mono font-semibold transition-all"
                  >
                    {linkingHierarchy ? 'Linking Hierarchy...' : 'Link Sub-Agent Under Parent'}
                  </button>
                  {linkResultMsg && (
                    <span className="text-xs font-mono text-cyan-300">{linkResultMsg}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Compliance Audit Logs */}
        {activeTab === 'audit' && (
          <div className="space-y-6 animate-fade-in">
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-cyan-400" /> Compliance Audit Trail
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Immutable logs of every evaluated policy check, fraud scan, and settlement event
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Filter by Agent ID..."
                    value={auditFilterAgent}
                    onChange={(e) => setAuditFilterAgent(e.target.value)}
                    className="glass-input px-3 py-1.5 rounded-xl text-xs font-mono text-white w-48"
                  />
                  <button
                    onClick={fetchAuditLogs}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-semibold transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900/80 border-b border-white/10 text-slate-400">
                    <tr>
                      <th className="px-5 py-3">Timestamp</th>
                      <th className="px-5 py-3">Agent</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3">Decision</th>
                      <th className="px-5 py-3">Rule / Trigger</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-slate-500 font-sans">
                          {loadingAudit ? 'Fetching audit logs...' : 'No audit logs recorded yet.'}
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                          <td className="px-5 py-3 text-slate-400 whitespace-nowrap">
                            {isMounted
                              ? new Date(log.created_at || Date.now()).toLocaleTimeString()
                              : '--:--:--'}
                          </td>
                          <td className="px-5 py-3 text-white font-medium">{log.agent_id}</td>
                          <td className="px-5 py-3 text-slate-200">
                            ${Number(log.requested_amount_usdc || 0).toFixed(2)} USDC
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            {log.allowed ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle className="w-3 h-3" /> ALLOWED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                <XCircle className="w-3 h-3" /> BLOCKED
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-slate-400 truncate max-w-xs" title={log.reason}>
                            {log.reason || 'Compliant with spending cap'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: API Key Manager */}
        {activeTab === 'apikeys' && (
          <div className="space-y-6 animate-fade-in">
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
                    <Key className="w-5 h-5 text-cyan-400" /> Multi-Tenant API Key Manager
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Provision cryptographic SHA-256 bearer tokens (ag_live_...) for programmatic AI agent integration
                  </p>
                </div>
              </div>

              {/* Create API Key Form */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-4">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="flex-1 min-w-[240px]">
                    <label className="block text-xs font-mono text-slate-300 mb-1.5">Organization / Key Name</label>
                    <input
                      type="text"
                      value={newKeyOrgName}
                      onChange={(e) => setNewKeyOrgName(e.target.value)}
                      placeholder="e.g. Production Operations"
                      className="glass-input w-full px-3 py-2.5 rounded-xl text-xs font-mono text-white"
                    />
                  </div>
                  <button
                    onClick={handleGenerateKey}
                    disabled={generatingKey || !newKeyOrgName}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-mono font-semibold shadow-glow-blue transition-all"
                  >
                    {generatingKey ? 'Generating Key...' : 'Generate New API Key'}
                  </button>
                </div>

                {generatedKeyResult && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-200 text-xs font-mono space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-400" /> Copy Secret Key (Shown Once)
                      </span>
                      <button
                        onClick={() => handleCopyAddress(generatedKeyResult.apiKey)}
                        className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>
                    <div className="bg-black/50 p-2 rounded text-cyan-300 break-all select-all">
                      {generatedKeyResult.apiKey}
                    </div>
                  </div>
                )}
              </div>

              {/* Active API Keys Table */}
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900/80 border-b border-white/10 text-slate-400">
                    <tr>
                      <th className="px-5 py-3">Key Name</th>
                      <th className="px-5 py-3">Key Prefix</th>
                      <th className="px-5 py-3">Created</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {apiKeys.map((k) => (
                      <tr key={k.id} className="hover:bg-white/[0.02]">
                        <td className="px-5 py-3 font-semibold text-white">{k.keyName}</td>
                        <td className="px-5 py-3 text-cyan-400">{k.keyPrefix}...</td>
                        <td className="px-5 py-3 text-slate-400">
                          {isMounted && k.createdAt ? new Date(k.createdAt).toLocaleDateString() : '----/--/--'}
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> ACTIVE
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Human Approvals Queue */}
        {activeTab === 'approvals' && (
          <div className="space-y-6 animate-fade-in">
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-cyan-400" /> Multi-Sig & Human-in-the-Loop Approval Queue
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    High-value transfers exceeding the $20.00 USDC safety threshold paused for human signoff
                  </p>
                </div>
                <button
                  onClick={fetchPendingApprovals}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-semibold transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingApprovals ? 'animate-spin' : ''}`} /> Refresh Queue
                </button>
              </div>

              {pendingApprovals.length === 0 ? (
                <div className="p-12 text-center text-slate-500 font-sans space-y-2">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto opacity-60" />
                  <p className="text-sm font-semibold text-slate-300">Queue is Clear</p>
                  <p className="text-xs">No pending transfers currently require human-in-the-loop review.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApprovals.map((app) => (
                    <div
                      key={app.id}
                      className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-amber-950/10 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            PENDING REVIEW
                          </span>
                          <span className="font-mono text-xs text-white font-bold">
                            Agent: {app.agentId}
                          </span>
                        </div>
                        <div className="font-mono text-sm font-bold text-amber-400">
                          ${Number(app.amountUsdc).toFixed(2)} USDC
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                        <div>Destination: <span className="text-slate-200">{app.destinationAddress}</span></div>
                        <div>Expires: <span className="text-rose-400">{isMounted && app.expiresAt ? new Date(app.expiresAt).toLocaleTimeString() : '--:--:--'}</span></div>
                        {app.reason && <div className="sm:col-span-2 text-slate-300">Memo: {app.reason}</div>}
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          onClick={() => handleDecideApproval(app.id, 'REJECT')}
                          disabled={decidingId === app.id}
                          className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-mono font-semibold transition-all"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleDecideApproval(app.id, 'APPROVE')}
                          disabled={decidingId === app.id}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold shadow-glow-cyan transition-all"
                        >
                          {decidingId === app.id ? 'Processing...' : 'Approve & Release'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Virtual Credit Cards */}
        {activeTab === 'cards' && (
          <div className="space-y-6 animate-fade-in">
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-cyan-400" /> Ephemeral Virtual Credit Card (VCC) Issuing
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Issue Visa/Mastercard credit cards bound to autonomous agents with single-use spending caps
                  </p>
                </div>
              </div>

              {/* Issue New Card Widget */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-4">
                <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                  Issue Ephemeral Card
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                  <div>
                    <label className="block text-slate-300 mb-1">Spending Limit ($USD)</label>
                    <input
                      type="number"
                      value={newCardLimit}
                      onChange={(e) => setNewCardLimit(parseFloat(e.target.value) || 10)}
                      className="glass-input w-full px-3 py-2 rounded-xl text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Card Memo / Purpose</label>
                    <input
                      type="text"
                      value={newCardMemo}
                      onChange={(e) => setNewCardMemo(e.target.value)}
                      className="glass-input w-full px-3 py-2 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Allowed MCC (e.g. 7372 Software)</label>
                    <input
                      type="text"
                      value={newCardMcc}
                      onChange={(e) => setNewCardMcc(e.target.value)}
                      className="glass-input w-full px-3 py-2 rounded-xl text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleIssueCard}
                    disabled={issuingCard}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-mono font-bold shadow-glow-cyan transition-all"
                  >
                    {issuingCard ? 'Issuing Card...' : 'Issue Ephemeral VCC'}
                  </button>
                </div>
              </div>

              {/* Issued Cards Showcase */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {virtualCards.map((c) => (
                  <div
                    key={c.id}
                    className="p-5 rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950/40 to-slate-900 border border-white/10 space-y-4 shadow-xl"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase">
                        VIRTUAL AGENT CARD
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {c.status}
                      </span>
                    </div>

                    <div className="font-mono text-base font-bold text-white tracking-widest pt-2">
                      •••• •••• •••• {c.lastFour}
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <div>EXP: <span className="text-white">{c.expiryMonth}/{c.expiryYear}</span></div>
                      <div>CVV: <span className="text-white">•••</span></div>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-white/10">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-400">Spent:</span>
                        <span className="text-white font-bold">${Number(c.spentAmountUsd || 0).toFixed(2)} / ${c.spendingLimitUsd} USD</span>
                      </div>
                      <div className="text-[10px] font-sans text-slate-400 truncate">{c.memo}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Deploy Agent Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="glass-panel-glow w-full max-w-md p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                <Bot className="w-5 h-5 text-cyan-400" /> Deploy AI Agent Wallet
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕ close
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-4 font-mono">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Agent Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eliza Compute Agent"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Wallet Provider</label>
                <select
                  value={newAgentProvider}
                  onChange={(e) => setNewAgentProvider(e.target.value as 'circle' | 'cdp')}
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs text-white"
                >
                  <option value="circle" className="bg-slate-900">Circle Programmable Wallet (Base Sepolia)</option>
                  <option value="cdp" className="bg-slate-900">Coinbase CDP AgentKit (Base Sepolia)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Daily Cap ($)</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={newAgentDailyLimit}
                    onChange={(e) => setNewAgentDailyLimit(parseFloat(e.target.value) || 10)}
                    className="glass-input w-full px-3 py-2 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Max Per Tx ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    required
                    value={newAgentMaxPerTx}
                    onChange={(e) => setNewAgentMaxPerTx(parseFloat(e.target.value) || 1)}
                    className="glass-input w-full px-3 py-2 rounded-xl text-xs text-white"
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
