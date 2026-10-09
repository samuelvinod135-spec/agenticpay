'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import Navbar from '@/components/Navbar';
import {
  Building2,
  ShieldAlert,
  ShieldCheck,
  Plus,
  RefreshCw,
  Search,
  Lock,
  Unlock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Copy,
  Check,
  X,
  Sparkles
} from 'lucide-react';
import {
  Tenant,
  fetchTenants,
  createTenant,
  freezeTenant,
  unfreezeTenant,
  fetchCircuitBreaker,
  CircuitBreakerStatus
} from '@/lib/api';

export default function TenantsPage() {
  const { data: tenants = [], mutate: mutateTenants, isValidating: isSyncing } = useSWR<Tenant[]>(
    '/tenants',
    fetchTenants,
    { refreshInterval: 4000 }
  );

  const { data: circuit } = useSWR<CircuitBreakerStatus | null>(
    '/circuit-breaker',
    fetchCircuitBreaker,
    { refreshInterval: 5000 }
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'QUARANTINED'>('ALL');
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    organization_id: '',
    name: '',
    daily_spend_cap: 1000,
    single_tx_cap: 50,
    hitl_threshold_usdc: 25,
    webhook_url: 'https://tenant.example.com/api/webhooks',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Freeze Modal State
  const [freezeModalTarget, setFreezeModalTarget] = useState<Tenant | null>(null);
  const [freezeReason, setFreezeReason] = useState('Abnormal velocity / Operator manual audit');
  const [freezing, setFreezing] = useState(false);

  // Notifications
  const [bannerNotice, setBannerNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() && !createForm.organization_id.trim()) {
      setCreateError('Organization identifier is required.');
      return;
    }
    setCreating(true);
    setCreateError(null);

    const res = await createTenant({
      organization_id: createForm.organization_id.trim() || undefined,
      name: createForm.name.trim() || createForm.organization_id.trim(),
      daily_spend_cap: Number(createForm.daily_spend_cap),
      single_tx_cap: Number(createForm.single_tx_cap),
      hitl_threshold_usdc: Number(createForm.hitl_threshold_usdc),
      webhook_url: createForm.webhook_url.trim() || undefined,
    });

    setCreating(false);
    if (res.success) {
      setShowCreateModal(false);
      setCreateForm({
        organization_id: '',
        name: '',
        daily_spend_cap: 1000,
        single_tx_cap: 50,
        hitl_threshold_usdc: 25,
        webhook_url: 'https://tenant.example.com/api/webhooks',
      });
      setBannerNotice({
        type: 'success',
        message: `Tenant "${res.tenant?.organization_id}" successfully registered.`,
      });
      mutateTenants();
    } else {
      setCreateError(res.error || 'Failed to create tenant');
    }
  };

  const executeFreeze = async () => {
    if (!freezeModalTarget) return;
    setFreezing(true);
    const res = await freezeTenant(freezeModalTarget.organization_id, freezeReason);
    setFreezing(false);
    setFreezeModalTarget(null);

    if (res.success) {
      setBannerNotice({
        type: 'success',
        message: `Tenant ${freezeModalTarget.organization_id} has been placed in QUARANTINE.`,
      });
      mutateTenants();
    } else {
      setBannerNotice({
        type: 'error',
        message: res.error || 'Failed to freeze tenant',
      });
    }
  };

  const executeUnfreeze = async (tenant: Tenant) => {
    const res = await unfreezeTenant(tenant.organization_id);
    if (res.success) {
      setBannerNotice({
        type: 'success',
        message: `Tenant ${tenant.organization_id} has been UN-FROZEN. Full payment execution restored.`,
      });
      mutateTenants();
    } else {
      setBannerNotice({
        type: 'error',
        message: res.error || 'Failed to unfreeze tenant',
      });
    }
  };

  // Filter & Search
  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      (t.name && t.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.organization_id.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'ACTIVE') return t.status === 'ACTIVE';
    if (statusFilter === 'QUARANTINED') return t.status === 'QUARANTINED';
    return true;
  });

  const activeCount = tenants.filter((t) => t.status === 'ACTIVE').length;
  const quarantinedCount = tenants.filter((t) => t.status === 'QUARANTINED').length;
  const totalBudget = tenants.reduce((acc, t) => acc + (t.daily_spend_cap || 0), 0);

  return (
    <div className="min-h-screen bg-[#07090E] text-[#F3F0FF] flex flex-col font-sans relative">
      {/* Top Atmospheric Radial Aura */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[450px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(139,92,246,0.22),rgba(7,9,14,0))] -z-10" />

      <Navbar />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Banner Notification */}
        {bannerNotice && (
          <div
            className={`flex items-center justify-between p-4 rounded-2xl border text-sm font-medium transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] ${
              bannerNotice.type === 'success'
                ? 'bg-violet-950/70 border-violet-500/40 text-violet-200'
                : 'bg-rose-950/70 border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {bannerNotice.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-violet-400" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-400" />
              )}
              <span>{bannerNotice.message}</span>
            </div>
            <button onClick={() => setBannerNotice(null)} className="text-xs opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-[#F3F0FF] font-mono flex items-center gap-2">
                <Building2 className="h-6 w-6 text-violet-400" />
                Tenant Management & Quarantine Controls
              </h1>
              <span className="rounded-full bg-violet-950/70 border border-violet-500/40 px-2.5 py-0.5 text-xs font-mono text-violet-300 shadow-[0_0_10px_rgba(139,92,246,0.2)]">
                Cyber Violet Live
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Active tenants, daily budget caps, single-transaction caps, and emergency panic quarantine controls.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => mutateTenants()}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0E091B]/80 border border-violet-900/30 text-xs font-medium text-slate-300 hover:text-white hover:bg-[#150E28] hover:border-violet-700/40 transition shadow-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-violet-400 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-xs font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_25px_rgba(139,92,246,0.6)] transition-all hover:scale-[1.02]"
            >
              <Plus className="h-4 w-4" />
              Add Tenant Organization
            </button>
          </div>
        </div>

        {/* KPI Metrics Grid with Glassmorphic Obsidian Violet styling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl border border-[#1E293B] bg-[#0D111A] backdrop-blur-md shadow-glass relative overflow-hidden hover:border-cyan-500/40 transition-all group">
            <div className="flex items-center justify-between text-slate-400 text-xs uppercase tracking-wider font-mono">
              <span>Total Tenants</span>
              <Building2 className="h-4 w-4 text-violet-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-[#F3F0FF]">{tenants.length}</div>
            <p className="mt-1 text-xs text-slate-400">Registered organizations</p>
          </div>

          <div className="p-5 rounded-2xl border border-[#1E293B] bg-[#0D111A] backdrop-blur-md shadow-glass relative overflow-hidden hover:border-emerald-500/40 transition-all group">
            <div className="flex items-center justify-between text-violet-300 text-xs uppercase tracking-wider font-mono">
              <span>Active Status</span>
              <ShieldCheck className="h-4 w-4 text-violet-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-violet-200">{activeCount}</div>
            <p className="mt-1 text-xs text-slate-400">Unrestricted payment flow</p>
          </div>

          <div className="p-5 rounded-2xl border border-rose-900/40 bg-[#0D111A] backdrop-blur-md shadow-glass relative overflow-hidden hover:border-rose-700/40 transition-all group">
            <div className="flex items-center justify-between text-rose-300 text-xs uppercase tracking-wider font-mono">
              <span>Quarantined</span>
              <ShieldAlert className="h-4 w-4 text-rose-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-rose-200">{quarantinedCount}</div>
            <p className="mt-1 text-xs text-slate-400">Transfers halted by circuit</p>
          </div>

          <div className="p-5 rounded-2xl border border-[#1E293B] bg-[#0D111A] backdrop-blur-md shadow-glass relative overflow-hidden hover:border-purple-500/40 transition-all group">
            <div className="flex items-center justify-between text-slate-400 text-xs uppercase tracking-wider font-mono">
              <span>Daily Budget Cap</span>
              <DollarSign className="h-4 w-4 text-violet-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-violet-200">
              ${totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="mt-1 text-xs text-slate-400">Aggregate daily spending ceiling</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0D111A] border border-[#1E293B] backdrop-blur-md shadow-glass">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by organization ID or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#07090E] border border-[#1E293B] text-xs text-[#F3F0FF] placeholder-slate-500 focus:outline-none focus:border-cyan-500/70 focus:shadow-[0_0_15px_rgba(6,182,212,0.25)] font-mono"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {(['ALL', 'ACTIVE', 'QUARANTINED'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1 rounded-xl text-xs font-mono transition-all ${
                  statusFilter === filter
                    ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 font-semibold shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'text-slate-400 hover:text-white hover:bg-[#151C2C] border border-transparent'
                }`}
              >
                {filter === 'ALL' ? 'All Tenants' : filter === 'ACTIVE' ? 'Active Only' : 'Quarantined Only'}
              </button>
            ))}
          </div>
        </div>

        {/* Tenants Table */}
        <div className="rounded-2xl border border-[#1E293B] bg-[#0D111A] overflow-hidden backdrop-blur-md shadow-glass">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#07090E]/90 border-b border-[#1E293B] text-slate-400 uppercase tracking-wider font-mono">
                <tr>
                  <th className="py-3.5 px-4">Organization ID</th>
                  <th className="py-3.5 px-4">Visual Status</th>
                  <th className="py-3.5 px-4">Single Tx Cap</th>
                  <th className="py-3.5 px-4">Daily Budget Cap</th>
                  <th className="py-3.5 px-4">Current Daily Spend</th>
                  <th className="py-3.5 px-4">Registered At</th>
                  <th className="py-3.5 px-4 text-right">Emergency Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/40">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-mono">
                      No tenants found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((tenant) => {
                    const isQuarantined = tenant.status === 'QUARANTINED';
                    return (
                      <tr
                        key={tenant.id}
                        className={`hover:bg-[#150E28]/60 transition-colors ${
                          isQuarantined ? 'bg-rose-950/15' : ''
                        }`}
                      >
                        {/* Organization ID */}
                        <td className="py-4 px-4">
                          <div className="font-semibold text-[#F3F0FF] text-sm font-mono">{tenant.name || tenant.organization_id}</div>
                          <div className="flex items-center gap-1 mt-1 text-[11px] font-mono text-slate-400">
                            <span className="truncate max-w-[200px]">{tenant.organization_id}</span>
                            <button
                              onClick={() => handleCopy(tenant.organization_id, tenant.id)}
                              className="text-slate-400 hover:text-white"
                              title="Copy ID"
                            >
                              {copiedId === tenant.id ? (
                                <Check className="h-3 w-3 text-violet-400" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Visual Status Badge */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {isQuarantined ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-rose-950/70 border border-rose-500/50 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.35)]">
                              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                              QUARANTINED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-violet-950/70 border border-violet-500/50 text-violet-200 shadow-[0_0_12px_rgba(139,92,246,0.25)]">
                              <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                              ACTIVE
                            </span>
                          )}
                        </td>

                        {/* Single Tx Cap */}
                        <td className="py-4 px-4 whitespace-nowrap font-mono text-sm text-slate-200">
                          ${tenant.single_tx_cap.toFixed(2)} USDC
                        </td>

                        {/* Daily Spend Cap */}
                        <td className="py-4 px-4 whitespace-nowrap font-mono text-sm text-violet-300">
                          ${tenant.daily_spend_cap.toFixed(2)} USDC
                        </td>

                        {/* Current Daily Spend */}
                        <td className="py-4 px-4 whitespace-nowrap font-mono text-sm text-slate-300">
                          ${tenant.current_daily_spend.toFixed(2)} USDC
                        </td>

                        {/* Created At */}
                        <td className="py-4 px-4 whitespace-nowrap font-mono text-[11px] text-slate-400">
                          {isMounted && tenant.created_at
                            ? new Date(tenant.created_at).toLocaleDateString()
                            : (tenant.created_at ? tenant.created_at.slice(0, 10) : '----/--/--')}
                        </td>

                        {/* Emergency Controls */}
                        <td className="py-4 px-4 whitespace-nowrap text-right">
                          {isQuarantined ? (
                            <button
                              onClick={() => executeUnfreeze(tenant)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-violet-600/20 hover:bg-violet-600/35 text-violet-200 border border-violet-500/40 transition-all hover:scale-[1.02] shadow-[0_0_12px_rgba(139,92,246,0.2)]"
                            >
                              <Unlock className="h-3.5 w-3.5 text-violet-400" />
                              Unfreeze Tenant
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setFreezeModalTarget(tenant);
                                setFreezeReason('Abnormal velocity / Operator manual audit');
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-rose-600/20 hover:bg-rose-600/35 text-rose-300 border border-rose-500/40 transition-all hover:scale-[1.02] shadow-[0_0_12px_rgba(244,63,94,0.2)]"
                            >
                              <Lock className="h-3.5 w-3.5 text-rose-400" />
                              Freeze Tenant
                            </button>
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
      </main>

      {/* Tenant Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-violet-900/50 bg-[#0C0718] p-6 shadow-[0_0_40px_rgba(124,58,237,0.25)] relative">
            <div className="flex items-center justify-between pb-4 border-b border-violet-900/30">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-violet-400" />
                <h3 className="text-base font-bold text-[#F3F0FF] font-mono">Add Tenant Organization</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {createError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Organization ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. org-hedge-fund-alpha"
                  value={createForm.organization_id}
                  onChange={(e) => setCreateForm({ ...createForm, organization_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#06040A] border border-violet-900/30 text-sm text-[#F3F0FF] font-mono placeholder-slate-500 focus:outline-none focus:border-violet-500/70 focus:shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Organization Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. Hedge Fund Alpha LLC"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#06040A] border border-violet-900/30 text-sm text-[#F3F0FF] placeholder-slate-500 focus:outline-none focus:border-violet-500/70 focus:shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Daily Spend Cap ($)</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={createForm.daily_spend_cap}
                    onChange={(e) => setCreateForm({ ...createForm, daily_spend_cap: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#06040A] border border-violet-900/30 text-sm text-[#F3F0FF] font-mono focus:outline-none focus:border-violet-500/70 focus:shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Single Tx Cap ($)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    required
                    value={createForm.single_tx_cap}
                    onChange={(e) => setCreateForm({ ...createForm, single_tx_cap: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#06040A] border border-violet-900/30 text-sm text-[#F3F0FF] font-mono focus:outline-none focus:border-violet-500/70 focus:shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Webhook Dispatch URL</label>
                <input
                  type="url"
                  placeholder="https://tenant.example.com/api/webhooks"
                  value={createForm.webhook_url}
                  onChange={(e) => setCreateForm({ ...createForm, webhook_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#06040A] border border-violet-900/30 text-sm text-[#F3F0FF] placeholder-slate-500 focus:outline-none focus:border-violet-500/70 focus:shadow-[0_0_15px_rgba(124,58,237,0.3)] font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-violet-900/30">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-[#150E28]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-xs font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] transition flex items-center gap-2"
                >
                  {creating && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  Register Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Freeze Reason Modal */}
      {freezeModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-rose-900/60 bg-[#0C0718] p-6 shadow-[0_0_40px_rgba(244,63,94,0.25)] relative">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-xl bg-rose-950/70 border border-rose-500/40">
                <AlertTriangle className="h-6 w-6 text-rose-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F3F0FF] font-mono">Quarantine Tenant</h3>
                <p className="text-xs text-slate-400">Halt Autonomous Execution</p>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-300 leading-relaxed">
              Quarantine tenant organization <strong className="text-[#F3F0FF] font-mono">{freezeModalTarget.organization_id}</strong>? Any transfers initiated under this organization will be immediately rejected.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-mono text-slate-300 mb-1">Reason for Emergency Freeze</label>
              <textarea
                rows={3}
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#06040A] border border-violet-900/30 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setFreezeModalTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-[#150E28]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeFreeze}
                disabled={freezing}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition flex items-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.4)]"
              >
                {freezing && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                Confirm Quarantine Freeze
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
