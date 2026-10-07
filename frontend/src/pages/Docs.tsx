'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Code,
  Terminal,
  Play,
  Shield,
  Layers,
  FileText,
  Copy,
  Check,
  Zap,
  CreditCard,
  Key,
  ExternalLink,
  ChevronRight,
  Server,
  Activity,
  ArrowRight,
  Search
} from 'lucide-react';

interface EndpointSpec {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  tag: string;
  title: string;
  description: string;
  requestSnippet: string;
  responseSnippet: string;
  defaultPayload?: any;
}

const ENDPOINTS: EndpointSpec[] = [
  {
    method: 'POST',
    path: '/api/v1/payments/transfer',
    tag: 'Payments',
    title: 'Execute Policy-Governed USDC Transfer',
    description: 'Executes a micro-transfer on Base Sepolia backed by institutional firewall and Circle programmable wallets.',
    defaultPayload: {
      agentId: 'AutoPay-Agent-01',
      amount: 1.50,
      recipient: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      reason: 'Purchase autonomous AI computing tokens',
    },
    requestSnippet: `import { AgenticPayClient } from '@agenticpay/sdk';

const client = new AgenticPayClient({ apiKey: 'ag_live_...' });
const result = await client.transfers.create({
  agentId: 'AutoPay-Agent-01',
  amount: 1.50,
  recipient: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  reason: 'Purchase autonomous AI computing tokens',
});`,
    responseSnippet: `{
  "success": true,
  "message": "USDC transfer successfully initiated on Base Sepolia.",
  "recordId": "rec_8a91f3bc",
  "kmsSignature": {
    "keyId": "arn:aws:kms:us-east-1:123456789012:key/agenticpay-vault",
    "version": 2,
    "algorithm": "ECDSA_SHA_256"
  },
  "transaction": {
    "transactionId": "tx_circle_f829a17",
    "state": "INITIATED",
    "amount": "1.50",
    "blockchain": "base-sepolia"
  }
}`
  },
  {
    method: 'GET',
    path: '/api/v1/agents/{id}/policy',
    tag: 'Firewall',
    title: 'Query Agent Spending Policy & Budget',
    description: 'Retrieves active daily spending caps, rolling 24h spend, and destination whitelists.',
    defaultPayload: { agentId: 'AutoPay-Agent-01' },
    requestSnippet: `const policy = await client.policies.get('AutoPay-Agent-01');
console.log('Remaining budget:', policy.remaining_daily_budget_usdc);`,
    responseSnippet: `{
  "success": true,
  "policy": {
    "agent_id": "AutoPay-Agent-01",
    "single_tx_cap_usdc": 10.0,
    "daily_spend_cap_usdc": 50.0,
    "current_daily_spend_usdc": 3.5,
    "remaining_daily_budget_usdc": 46.5,
    "active": true
  }
}`
  },
  {
    method: 'POST',
    path: '/api/v1/cards/issue',
    tag: 'Virtual Cards',
    title: 'Issue Ephemeral Virtual Credit Card (VCC)',
    description: 'Generates dynamic virtual Visa/Mastercard for Web2 APIs with spending limits and MCC category restrictions.',
    defaultPayload: {
      agentId: 'AutoPay-Agent-01',
      spendingLimitUsd: 25.0,
      memo: 'Cloud GPU Compute API',
      allowedMcc: ['5734', '7372'],
    },
    requestSnippet: `const card = await client.cards.issue({
  agentId: 'AutoPay-Agent-01',
  limitUsdc: 25.0,
  merchantCategory: 'Cloud Compute'
});`,
    responseSnippet: `{
  "success": true,
  "card": {
    "id": "vcc_card_991a",
    "agent_id": "AutoPay-Agent-01",
    "last4": "4242",
    "spending_limit_usd": 25.0,
    "current_spend_usd": 0.0,
    "status": "ACTIVE"
  }
}`
  },
  {
    method: 'GET',
    path: '/api/v1/compliance/export',
    tag: 'Compliance',
    title: 'Export SOC2 / PCI-DSS Audit Trail',
    description: 'Exports cryptographic SHA-256 prompt hashes correlated with double-entry ledger postings in JSON or CSV.',
    defaultPayload: { format: 'json', agentId: 'AutoPay-Agent-01' },
    requestSnippet: `// cURL export
curl "http://localhost:4000/api/v1/compliance/export?format=json" \\
  -H "Authorization: Bearer ag_live_..."`,
    responseSnippet: `{
  "standard": "SOC2_TYPE_II_AND_PCI_DSS",
  "exportedAt": "2026-10-08T00:15:00.000Z",
  "recordCount": 12,
  "integrityCheck": "SHA256_HASH_CORRELATED",
  "records": [
    {
      "id": "rec_91a0b3f",
      "agent_id": "AutoPay-Agent-01",
      "prompt_hash": "5ab8ac5468c4fd77f5842a88061c7b3784cc54c6bfc4e4ca5e45bed839eb096f",
      "signature_verdict": "APPROVED",
      "ledger_entry_id": "ledger_entry_uuid_999"
    }
  ]
}`
  },
  {
    method: 'GET',
    path: '/api/v1/circuit-breaker/status',
    tag: 'Circuit Breaker',
    title: 'Global Circuit Breaker & Anomaly Rates',
    description: 'Inspects real-time failure sliding window metrics and multi-tenant quarantine status.',
    defaultPayload: {},
    requestSnippet: `curl http://localhost:4000/api/v1/circuit-breaker/status`,
    responseSnippet: `{
  "success": true,
  "circuitBreaker": {
    "status": "HEALTHY",
    "quarantined": false,
    "metrics": {
      "totalTransfersInWindow": 50,
      "failedOrFlaggedTransfers": 2,
      "failureRatePercent": 4.0,
      "windowSeconds": 60
    },
    "frozenTenants": []
  }
}`
  }
];

export default function Docs() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointSpec>(ENDPOINTS[0]);
  const [activeTab, setActiveTab] = useState<'sandbox' | 'openapi' | 'sdks'>('sandbox');
  const [mockToken] = useState('ag_live_sandbox_mock_jwt_token_8891');
  const [copied, setCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [sandboxResponse, setSandboxResponse] = useState<string | null>(null);
  const [sandboxStatus, setSandboxStatus] = useState<number | null>(null);
  const [filterTag, setFilterTag] = useState<string>('All');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecuteSimulation = async () => {
    setIsSimulating(true);
    setSandboxResponse(null);
    setSandboxStatus(null);

    // Simulate real gateway latency & execution
    await new Promise((r) => setTimeout(r, 650));

    if (selectedEndpoint.path.includes('/transfer')) {
      setSandboxStatus(200);
      setSandboxResponse(JSON.stringify({
        success: true,
        message: "USDC transfer successfully initiated on Base Sepolia.",
        recordId: "rec_sim_" + Math.random().toString(36).substring(7),
        kmsSignature: {
          keyId: "arn:aws:kms:us-east-1:123456789012:key/agenticpay-vault",
          version: 2,
          algorithm: "ECDSA_SHA_256"
        },
        transaction: {
          transactionId: "tx_sim_" + Math.random().toString(36).substring(7),
          state: "INITIATED",
          amount: selectedEndpoint.defaultPayload?.amount || 1.50,
          recipient: selectedEndpoint.defaultPayload?.recipient,
          blockchain: "base-sepolia",
          promptSha256: "5ab8ac5468c4fd77f5842a88061c7b3784cc54c6bfc4e4ca5e45bed839eb096f"
        }
      }, null, 2));
    } else if (selectedEndpoint.path.includes('/policy')) {
      setSandboxStatus(200);
      setSandboxResponse(JSON.stringify({
        success: true,
        policy: {
          agent_id: "AutoPay-Agent-01",
          single_tx_cap_usdc: 10.0,
          daily_spend_cap_usdc: 50.0,
          current_daily_spend_usdc: 4.5,
          remaining_daily_budget_usdc: 45.5,
          active: true
        }
      }, null, 2));
    } else if (selectedEndpoint.path.includes('/cards')) {
      setSandboxStatus(201);
      setSandboxResponse(JSON.stringify({
        success: true,
        card: {
          id: "vcc_card_" + Math.random().toString(36).substring(7),
          agent_id: "AutoPay-Agent-01",
          last4: "4242",
          spending_limit_usd: 25.0,
          current_spend_usd: 0.0,
          status: "ACTIVE"
        }
      }, null, 2));
    } else {
      setSandboxStatus(200);
      setSandboxResponse(selectedEndpoint.responseSnippet);
    }

    setIsSimulating(false);
  };

  const filteredEndpoints = filterTag === 'All'
    ? ENDPOINTS
    : ENDPOINTS.filter((e) => e.tag === filterTag);

  const tags = ['All', 'Payments', 'Firewall', 'Virtual Cards', 'Compliance', 'Circuit Breaker'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-emerald-500/20">
                ⚡
              </div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                AgenticPay
              </span>
            </Link>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              v1.0.0 OpenAPI 3.1
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <button
                onClick={() => setActiveTab('sandbox')}
                className={`px-3 py-1.5 rounded-md font-medium transition ${
                  activeTab === 'sandbox' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                Interactive Sandbox
              </button>
              <button
                onClick={() => setActiveTab('openapi')}
                className={`px-3 py-1.5 rounded-md font-medium transition ${
                  activeTab === 'openapi' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                OpenAPI Spec
              </button>
              <button
                onClick={() => setActiveTab('sdks')}
                className={`px-3 py-1.5 rounded-md font-medium transition ${
                  activeTab === 'sdks' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                SDKs & Tools
              </button>
            </div>

            <Link
              href="/dashboard"
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition font-medium flex items-center gap-1.5"
            >
              Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner */}
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <span>Developer Portal & Interactive Sandbox</span>
              <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Live Simulator
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Simulate policy-governed micro-transfers, dynamic virtual cards, and cryptographic audit logs directly from the browser with zero risk.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="http://localhost:4000/docs"
              target="_blank"
              rel="noreferrer"
              className="text-xs px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium border border-slate-700 flex items-center gap-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              Full Redoc View
            </a>
            <a
              href="http://localhost:4000/openapi.yaml"
              download="openapi.yaml"
              className="text-xs px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-medium border border-emerald-500/30 flex items-center gap-1.5 transition"
            >
              <FileText className="w-3.5 h-3.5" />
              Download YAML
            </a>
          </div>
        </div>

        {activeTab === 'sandbox' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sidebar Endpoint List */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {tags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterTag(t)}
                    className={`text-xs px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition ${
                      filterTag === t
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {filteredEndpoints.map((ep) => {
                  const isSelected = selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method;
                  return (
                    <button
                      key={`${ep.method}-${ep.path}`}
                      onClick={() => {
                        setSelectedEndpoint(ep);
                        setSandboxResponse(null);
                        setSandboxStatus(null);
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border transition ${
                        isSelected
                          ? 'bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                          : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            ep.method === 'POST'
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                              : ep.method === 'GET'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {ep.method}
                        </span>
                        <span className="text-xs font-mono text-slate-300 truncate">
                          {ep.path}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-medium truncate">
                        {ep.title}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sandbox Console Playground */}
            <div className="lg:col-span-8 space-y-6">
              {/* Endpoint Card */}
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md ${
                        selectedEndpoint.method === 'POST'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : selectedEndpoint.method === 'GET'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {selectedEndpoint.method}
                    </span>
                    <span className="font-mono text-sm text-white font-semibold">
                      {selectedEndpoint.path}
                    </span>
                  </div>

                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {selectedEndpoint.tag}
                  </span>
                </div>

                <p className="text-sm text-slate-300 mt-4 leading-relaxed">
                  {selectedEndpoint.description}
                </p>

                {/* Pre-configured Token pill */}
                <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Key className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-xs text-slate-400 shrink-0 font-medium">Sandbox Token:</span>
                    <span className="text-xs font-mono text-slate-300 truncate">{mockToken}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(mockToken)}
                    className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white shrink-0 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    Copy
                  </button>
                </div>

                {/* Request Payload Body / Params */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Request Simulation Parameters
                    </label>
                    <span className="text-[11px] text-slate-500 font-mono">application/json</span>
                  </div>

                  <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-300">
                    <pre className="overflow-x-auto">
                      {JSON.stringify(selectedEndpoint.defaultPayload || {}, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Simulation Action Bar */}
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    onClick={handleExecuteSimulation}
                    disabled={isSimulating}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
                  >
                    {isSimulating ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        Simulating Firewall...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Execute Sandbox Request
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Response Inspector */}
              <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    Response Inspector
                  </span>

                  {sandboxStatus && (
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        sandboxStatus >= 200 && sandboxStatus < 300
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      HTTP {sandboxStatus} OK
                    </span>
                  )}
                </div>

                <div className="mt-4 rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-emerald-400 max-h-80 overflow-y-auto">
                  <pre className="overflow-x-auto">
                    {sandboxResponse || selectedEndpoint.responseSnippet}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'openapi' && (
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">OpenAPI 3.1 Specification</h2>
                <p className="text-xs text-slate-400 mt-0.5">Machine-readable contract covering Days 1–20 and Paths 1–2</p>
              </div>
              <button
                onClick={() => handleCopy('http://localhost:4000/openapi.yaml')}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium border border-slate-700 flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Spec URL
              </button>
            </div>

            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-300 max-h-[600px] overflow-y-auto">
              <pre className="overflow-x-auto">
{`openapi: 3.1.0
info:
  title: AgenticPay API
  summary: The Enterprise Financial Firewall & Programmable Rails for Autonomous AI Agents
  version: 1.0.0
servers:
  - url: http://localhost:4000
    description: Local Development & Testing Gateway
  - url: https://api.agenticpay.ai
    description: Production Enterprise Gateway

paths:
  /api/v1/payments/transfer:
    post:
      summary: Execute Policy-Governed USDC Transfer
      tags: [Payments & Transfers]
  /api/v1/agents/{id}/policy:
    get:
      summary: Query Agent Spending Policy & Remaining Budget
      tags: [Policy Firewall]
  /api/v1/cards/issue:
    post:
      summary: Issue Ephemeral Virtual Credit Card (VCC)
      tags: [Virtual Credit Cards]
  /api/v1/ledger:
    get:
      summary: Verify Double-Entry Zero-Drift Financial Ledger
      tags: [Financial Ledger]
  /api/v1/compliance/export:
    get:
      summary: Export SOC2 Type II & PCI-DSS Audit Trail Package
      tags: [Enterprise Compliance]
  /api/v1/circuit-breaker/status:
    get:
      summary: Query Global Circuit Breaker Health & Rolling Anomaly Rates
      tags: [Circuit Breakers]`}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'sdks' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TypeScript SDK */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2">
                  <Code className="w-4 h-4 text-cyan-400" />
                  TypeScript SDK (@agenticpay/sdk)
                </span>
                <span className="text-xs font-mono text-slate-400">npm</span>
              </div>
              <div className="rounded-xl bg-slate-950 p-3 font-mono text-xs text-emerald-400 border border-slate-800">
                npm install @agenticpay/sdk
              </div>
              <div className="rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-300 border border-slate-800 overflow-x-auto">
                <pre>{`import { AgenticPayClient, AgenticPayLangChainTool } from '@agenticpay/sdk';

const client = new AgenticPayClient({ apiKey: 'ag_live_...' });
const tool = new AgenticPayLangChainTool(client, { agentId: 'AutoPay-01' });`}</pre>
              </div>
            </div>

            {/* Python SDK */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Python SDK (agenticpay)
                </span>
                <span className="text-xs font-mono text-slate-400">pip</span>
              </div>
              <div className="rounded-xl bg-slate-950 p-3 font-mono text-xs text-emerald-400 border border-slate-800">
                pip install agenticpay[all]
              </div>
              <div className="rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-300 border border-slate-800 overflow-x-auto">
                <pre>{`from agenticpay import AgenticPayClient
from agenticpay.tools import AgenticPayCrewTool

client = AgenticPayClient(api_key="ag_live_...")
crew_tool = AgenticPayCrewTool(client=client)`}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
