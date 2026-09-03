"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Search, ChevronDown, ChevronUp, CheckCircle, DollarSign, Clock, Play, FileText, Sparkles, User, Bot } from "lucide-react";
import { ColumnInfo, StatusBadge } from "@/components/crr/ui-atoms";
import type { CRROutreach, VapiCallLog } from "@/lib/crr-data";

export function VoiceClient({ outreach, vapiLogs = [] }: { outreach: CRROutreach[]; vapiLogs?: VapiCallLog[] }) {
    const [search, setSearch] = useState("");
    const [viewTab, setViewTab] = useState<"vapi" | "outreach">("vapi");
    const [expandedId, setExpandedId] = useState<string | number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    // ── Vapi Call Logs filtering ────────────────────────────────────────────────
    const filteredVapi = vapiLogs.filter(log => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            (log.customer_name || '').toLowerCase().includes(q) ||
            (log.customer_phone || '').toLowerCase().includes(q) ||
            (log.status || '').toLowerCase().includes(q) ||
            (log.summary || '').toLowerCase().includes(q) ||
            (log.vapi_account || '').toLowerCase().includes(q)
        );
    });

    // ── Outreach Voice filtering ────────────────────────────────────────────────
    const voiceRecords = outreach.filter(o => o.voice_1_ts || o.voice_2_ts || o.voice_3_ts);
    const filteredOutreach = voiceRecords.filter(o => {
        if (!search) return true;
        const q = search.toLowerCase();
        return o.party_name.toLowerCase().includes(q) || (o.phone || '').includes(q) || (o.contact_person || '').toLowerCase().includes(q);
    });

    const handleSearchChange = (val: string) => {
        setSearch(val);
        setCurrentPage(1);
    };

    const handleTabChange = (tab: "vapi" | "outreach") => {
        setViewTab(tab);
        setExpandedId(null);
        setCurrentPage(1);
    };

    const itemsPerPage = 10;
    const currentList = viewTab === "vapi" ? filteredVapi : filteredOutreach;
    const totalPages = Math.ceil(currentList.length / itemsPerPage);
    const activePage = Math.min(currentPage, Math.max(1, totalPages));
    const startIndex = (activePage - 1) * itemsPerPage;
    const paginatedVapi = filteredVapi.slice(startIndex, startIndex + itemsPerPage);
    const paginatedOutreach = filteredOutreach.slice(startIndex, startIndex + itemsPerPage);

    // Vapi Metrics
    let totalVapiDurationSeconds = 0;
    let totalVapiCostUsd = 0;
    let vapiCompletedCount = 0;
    let vapiRecordingsCount = 0;

    vapiLogs.forEach(log => {
        if (log.duration_seconds) totalVapiDurationSeconds += log.duration_seconds;
        if (log.cost_usd) totalVapiCostUsd += log.cost_usd;
        if ((log.status || log.voice_call_status)?.toLowerCase() === 'completed' || (log.status || '').toLowerCase() === 'ended') {
            vapiCompletedCount++;
        }
        if (log.recording_url) vapiRecordingsCount++;
    });

    const totalVapiMinutes = Math.round(totalVapiDurationSeconds / 60);

    const formatDateTime = (d: string | null) => {
        if (!d) return '—';
        return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return '0s';
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    const callStatusVariant = (s: string | null): 'success' | 'info' | 'warning' | 'danger' | 'neutral' | 'purple' => {
        switch (s?.toLowerCase()) {
            case 'completed':
            case 'ended':
                return 'success';
            case 'in-progress':
            case 'queued':
                return 'info';
            case 'no-answer':
            case 'busy':
                return 'warning';
            case 'failed':
            case 'ended-with-error':
                return 'danger';
            default:
                return 'neutral';
        }
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--label-primary)]">Voice Outreach & Call Logs</h1>
                    <p className="text-[var(--label-secondary)]">AI Voice Telephony — monitoring Vapi call recordings, cost, duration & call transcripts</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* View Switcher Tabs */}
                    <div className="flex items-center rounded-xl bg-[var(--glass-fill)] border border-[var(--separator)] p-1 text-xs">
                        <button
                            onClick={() => handleTabChange("vapi")}
                            className={`px-3 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1.5 ${viewTab === "vapi" ? "bg-purple-600 text-white shadow-sm" : "text-[var(--label-secondary)] hover:text-[var(--label-primary)]"}`}
                        >
                            <Phone className="h-3.5 w-3.5" /> Vapi Call Logs ({vapiLogs.length})
                        </button>
                        <button
                            onClick={() => handleTabChange("outreach")}
                            className={`px-3 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1.5 ${viewTab === "outreach" ? "bg-purple-600 text-white shadow-sm" : "text-[var(--label-secondary)] hover:text-[var(--label-primary)]"}`}
                        >
                            Sequence Calls ({voiceRecords.length})
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--label-tertiary)]" />
                        <input
                            type="text"
                            placeholder="Search name, phone, summary..."
                            value={search}
                            onChange={e => handleSearchChange(e.target.value)}
                            className="pl-10 pr-4 py-2 w-[240px] sm:w-[280px] rounded-xl bg-[var(--glass-fill)] border border-[var(--separator)] text-sm text-[var(--label-primary)] placeholder:text-[var(--label-tertiary)] focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <MiniCard title="Total Vapi Calls" value={vapiLogs.length} icon={<Phone className="h-5 w-5 text-purple-600" />} />
                <MiniCard title="Total Duration" value={`${totalVapiMinutes} mins`} icon={<Clock className="h-5 w-5 text-blue-600" />} isString />
                <MiniCard title="Total Spend USD" value={`$${totalVapiCostUsd.toFixed(2)}`} icon={<DollarSign className="h-5 w-5 text-emerald-600" />} isString />
                <MiniCard title="Completed Calls" value={vapiCompletedCount} icon={<CheckCircle className="h-5 w-5 text-teal-600" />} />
                <MiniCard title="Recordings Available" value={vapiRecordingsCount} icon={<Play className="h-5 w-5 text-amber-600" />} />
            </div>

            {/* Main Content Table */}
            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    {viewTab === "vapi" ? (
                        /* VAPI CALL LOGS TABLE */
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[var(--separator)] bg-[var(--fill-quaternary)]">
                                        <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                            <ColumnInfo label="Customer & Phone" description="Customer name, phone number & call direction" />
                                        </th>
                                        <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                            <ColumnInfo label="Date & Duration" description="Call start timestamp & duration" />
                                        </th>
                                        <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                            <ColumnInfo label="Call Status" description="Vapi call completion status" />
                                        </th>
                                        <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                            <ColumnInfo label="Cost (USD)" description="Total Vapi AI call processing cost" />
                                        </th>
                                        <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                            <ColumnInfo label="Audio Recording" description="Playback audio recording link/player" />
                                        </th>
                                        <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                            <ColumnInfo label="AI Summary" description="AI generated call transcript summary" />
                                        </th>
                                        <th className="px-4 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--separator)]">
                                    {paginatedVapi.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-12 text-[var(--label-tertiary)]">
                                                No Vapi call logs found matching your criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedVapi.map(log => (
                                            <VapiLogRow
                                                key={log.id}
                                                log={log}
                                                isExpanded={expandedId === log.id}
                                                onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
                                                formatDateTime={formatDateTime}
                                                formatDuration={formatDuration}
                                                callStatusVariant={callStatusVariant}
                                            />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* OUTREACH SEQUENCE VOICE TABLE */
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[var(--separator)] bg-[var(--fill-quaternary)]">
                                        <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                            <ColumnInfo label="Party" description="Customer name" />
                                        </th>
                                        <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                            <ColumnInfo label="Phone" description="Phone number used for calls" />
                                        </th>
                                        <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                            <ColumnInfo label="Call 1" description="First voice call attempt" />
                                        </th>
                                        <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                            <ColumnInfo label="Call 2" description="Second voice call attempt" />
                                        </th>
                                        <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                            <ColumnInfo label="Call 3" description="Third voice call attempt" />
                                        </th>
                                        <th className="px-4 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--separator)]">
                                    {paginatedOutreach.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-12 text-[var(--label-tertiary)]">
                                                No outreach voice records found.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedOutreach.map(o => (
                                            <VoiceRow
                                                key={o.id}
                                                record={o}
                                                isExpanded={expandedId === o.id}
                                                onToggle={() => setExpandedId(expandedId === o.id ? null : o.id)}
                                                formatDateTime={formatDateTime}
                                            />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-[var(--separator)] bg-[var(--fill-quaternary)] text-xs text-[var(--label-secondary)]">
                            <div>
                                Showing <span className="font-semibold text-[var(--label-primary)]">{startIndex + 1}</span> to{' '}
                                <span className="font-semibold text-[var(--label-primary)]">{Math.min(startIndex + itemsPerPage, currentList.length)}</span> of{' '}
                                <span className="font-semibold text-[var(--label-primary)]">{currentList.length}</span> entries
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={activePage === 1}
                                    className="px-3 py-1.5 rounded-lg border border-[var(--separator)] bg-[var(--glass-fill)] disabled:opacity-40 disabled:pointer-events-none hover:bg-[var(--fill-quaternary)] transition-colors"
                                >
                                    Previous
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(page => page === 1 || page === totalPages || Math.abs(page - activePage) <= 1)
                                    .map((page, index, array) => {
                                        const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
                                        return (
                                            <div key={page} className="flex items-center">
                                                {showEllipsisBefore && <span className="px-1.5 text-[var(--label-tertiary)]">...</span>}
                                                <button
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors font-medium ${
                                                        activePage === page
                                                            ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                                                            : 'border-[var(--separator)] bg-[var(--glass-fill)] hover:bg-[var(--fill-quaternary)] text-[var(--label-primary)]'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            </div>
                                        );
                                    })}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={activePage === totalPages}
                                    className="px-3 py-1.5 rounded-lg border border-[var(--separator)] bg-[var(--glass-fill)] disabled:opacity-40 disabled:pointer-events-none hover:bg-[var(--fill-quaternary)] transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function VapiLogRow({
    log,
    isExpanded,
    onToggle,
    formatDateTime,
    formatDuration,
    callStatusVariant,
}: {
    log: VapiCallLog;
    isExpanded: boolean;
    onToggle: () => void;
    formatDateTime: (d: string | null) => string;
    formatDuration: (s: number | null) => string;
    callStatusVariant: (s: string | null) => 'success' | 'info' | 'warning' | 'danger' | 'neutral' | 'purple';
}) {
    const statusText = log.voice_call_status || log.status || 'unknown';

    return (
        <>
            <tr className="hover:bg-[var(--fill-quaternary)] transition-colors cursor-pointer" onClick={onToggle}>
                {/* Customer & Phone */}
                <td className="px-4 py-3.5">
                    <div className="space-y-0.5">
                        <span className="text-sm font-semibold text-[var(--label-primary)] block">
                            {log.customer_name || 'Anonymous Customer'}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-mono">
                                {log.customer_phone || '—'}
                            </span>
                            {log.type && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 uppercase">
                                    {log.type}
                                </span>
                            )}
                        </div>
                    </div>
                </td>

                {/* Date & Duration */}
                <td className="px-4 py-3.5">
                    <div className="space-y-0.5">
                        <span className="text-xs text-[var(--label-primary)] block">
                            {formatDateTime(log.started_at || log.created_at)}
                        </span>
                        <span className="text-[10px] text-[var(--label-tertiary)] font-mono block">
                            Duration: <strong className="text-[var(--label-secondary)]">{formatDuration(log.duration_seconds)}</strong>
                        </span>
                    </div>
                </td>

                {/* Call Status */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="space-y-1">
                        <StatusBadge value={statusText} variant={callStatusVariant(statusText)} />
                        {log.vapi_account && (
                            <span className="block text-[9px] text-[var(--label-tertiary)] font-mono">
                                Acc: {log.vapi_account}
                            </span>
                        )}
                    </div>
                </td>

                {/* Cost (USD) */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                    {log.cost_usd !== null && log.cost_usd !== undefined ? (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                            ${Number(log.cost_usd).toFixed(4)}
                        </span>
                    ) : (
                        <span className="text-xs text-[var(--label-tertiary)] italic">—</span>
                    )}
                </td>

                {/* Audio Recording */}
                <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                    {log.recording_url ? (
                        <div className="space-y-1 max-w-[210px]">
                            <audio controls src={log.recording_url} className="h-7 w-48 rounded-md border border-[var(--separator)]" />
                            <a
                                href={log.recording_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium"
                            >
                                <Play className="h-3 w-3" /> Download / Open Audio
                            </a>
                        </div>
                    ) : (
                        <span className="text-xs text-[var(--label-tertiary)] italic">No recording</span>
                    )}
                </td>

                {/* AI Summary Snippet */}
                <td className="px-4 py-3.5">
                    {log.summary ? (
                        <p className="text-[11px] text-[var(--label-secondary)] max-w-[220px] truncate leading-tight font-normal" title={log.summary}>
                            {log.summary}
                        </p>
                    ) : (
                        <span className="text-xs text-[var(--label-tertiary)] italic">—</span>
                    )}
                </td>

                {/* Toggle Chevron */}
                <td className="px-4 py-3.5 text-center">
                    {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-[var(--label-tertiary)]" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-[var(--label-tertiary)]" />
                    )}
                </td>
            </tr>

            {/* Expanded Detailed Vapi Log View */}
            {isExpanded && (
                <tr>
                    <td colSpan={7} className="px-6 py-5 bg-[var(--fill-quaternary)]">
                        <VapiLogDetailWindow log={log} formatDateTime={formatDateTime} formatDuration={formatDuration} callStatusVariant={callStatusVariant} />
                    </td>
                </tr>
            )}
        </>
    );
}

function VapiLogDetailWindow({
    log,
    formatDateTime,
    formatDuration,
    callStatusVariant,
}: {
    log: VapiCallLog;
    formatDateTime: (d: string | null) => string;
    formatDuration: (s: number | null) => string;
    callStatusVariant: (s: string | null) => 'success' | 'info' | 'warning' | 'danger' | 'neutral' | 'purple';
}) {
    // Parse transcript if present
    let transcriptMessages: { role: string; text: string }[] = [];
    if (log.transcript) {
        if (Array.isArray(log.transcript)) {
            transcriptMessages = log.transcript.map(item => ({
                role: item.role || item.speaker || 'unknown',
                text: item.message || item.text || item.content || JSON.stringify(item),
            }));
        } else if (typeof log.transcript === 'object') {
            if (Array.isArray(log.transcript.messages)) {
                transcriptMessages = log.transcript.messages.map((item: any) => ({
                    role: item.role || item.speaker || 'unknown',
                    text: item.message || item.text || item.content || JSON.stringify(item),
                }));
            } else {
                transcriptMessages = [{ role: 'transcript', text: JSON.stringify(log.transcript, null, 2) }];
            }
        } else if (typeof log.transcript === 'string') {
            transcriptMessages = [{ role: 'transcript', text: log.transcript }];
        }
    }

    return (
        <div className="rounded-2xl border border-[var(--separator)] bg-[var(--glass-fill)] overflow-hidden shadow-lg max-w-4xl mx-auto space-y-4 p-5">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[var(--separator)]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-600 font-bold text-sm">
                        <Phone className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[var(--label-primary)]">
                            {log.customer_name || 'Anonymous Customer'} ({log.customer_phone || 'No phone'})
                        </h3>
                        <p className="text-[11px] text-[var(--label-tertiary)] flex items-center gap-2">
                            <span>Vapi Call ID: <span className="font-mono">{log.id}</span></span>
                            <span>•</span>
                            <span>Started: {formatDateTime(log.started_at || log.created_at)}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <StatusBadge value={log.voice_call_status || log.status || 'unknown'} variant={callStatusVariant(log.voice_call_status || log.status)} />
                    {log.cost_usd !== null && log.cost_usd !== undefined && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold text-xs font-mono">
                            Cost: ${Number(log.cost_usd).toFixed(4)}
                        </span>
                    )}
                </div>
            </div>

            {/* Quick Details Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[var(--fill-quaternary)] border border-[var(--separator)]">
                    <span className="text-[10px] text-[var(--label-tertiary)] uppercase font-semibold block">Duration</span>
                    <span className="font-bold text-[var(--label-primary)]">{formatDuration(log.duration_seconds)}</span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--fill-quaternary)] border border-[var(--separator)]">
                    <span className="text-[10px] text-[var(--label-tertiary)] uppercase font-semibold block">Source / Account</span>
                    <span className="font-bold text-[var(--label-primary)]">{log.source || 'vapi'} ({log.vapi_account || 'normal'})</span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--fill-quaternary)] border border-[var(--separator)]">
                    <span className="text-[10px] text-[var(--label-tertiary)] uppercase font-semibold block">Assistant ID</span>
                    <span className="font-mono text-[11px] text-[var(--label-secondary)] truncate block" title={log.assistantId || 'N/A'}>
                        {log.assistantId || 'N/A'}
                    </span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--fill-quaternary)] border border-[var(--separator)]">
                    <span className="text-[10px] text-[var(--label-tertiary)] uppercase font-semibold block">Master Lead ID</span>
                    <span className="font-mono text-[11px] text-[var(--label-secondary)] truncate block" title={log.master_leads_id || 'N/A'}>
                        {log.master_leads_id || 'N/A'}
                    </span>
                </div>
            </div>

            {/* Audio Player Bar if recording exists */}
            {log.recording_url && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Play className="h-4 w-4 text-purple-600" />
                        <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Call Audio Recording Player</span>
                    </div>
                    <audio controls src={log.recording_url} className="w-full sm:w-80 h-9 rounded-lg" />
                </div>
            )}

            {/* AI Summary Block */}
            {log.summary && (
                <div className="p-4 rounded-xl bg-[var(--glass-fill)] border border-[var(--separator)] space-y-1">
                    <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" /> Call Summary
                    </h4>
                    <p className="text-xs text-[var(--label-primary)] leading-relaxed font-sans">{log.summary}</p>
                </div>
            )}

            {/* Notes if present */}
            {log.note && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                    <h4 className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Note</h4>
                    <p className="text-xs text-[var(--label-primary)]">{log.note}</p>
                </div>
            )}

            {/* Transcript Drawer */}
            {transcriptMessages.length > 0 && (
                <div className="p-4 rounded-xl bg-[var(--glass-fill)] border border-[var(--separator)] space-y-3">
                    <h4 className="text-xs font-bold text-[var(--label-primary)] uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-purple-500" /> Full Call Transcript
                    </h4>

                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                        {transcriptMessages.map((msg, idx) => {
                            const isUserRole = msg.role.toLowerCase().includes('user') || msg.role.toLowerCase().includes('customer');
                            return (
                                <div key={idx} className={`flex ${isUserRole ? 'justify-start' : 'justify-end'}`}>
                                    <div className={`max-w-[85%] rounded-xl p-3 text-xs space-y-1 ${
                                        isUserRole
                                            ? 'bg-emerald-500/15 border border-emerald-500/25 text-[var(--label-primary)]'
                                            : 'bg-purple-500/15 border border-purple-500/25 text-[var(--label-primary)]'
                                    }`}>
                                        <div className="flex items-center gap-1.5 font-bold text-[10px]">
                                            {isUserRole ? (
                                                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                    <User className="h-3 w-3" /> Customer
                                                </span>
                                            ) : (
                                                <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1">
                                                    <Bot className="h-3 w-3" /> Vapi AI Agent
                                                </span>
                                            )}
                                        </div>
                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function VoiceRow({
    record: o,
    isExpanded,
    onToggle,
    formatDateTime,
}: {
    record: CRROutreach;
    isExpanded: boolean;
    onToggle: () => void;
    formatDateTime: (d: string | null) => string;
}) {
    return (
        <>
            <tr className="hover:bg-[var(--fill-quaternary)] transition-colors cursor-pointer" onClick={onToggle}>
                <td className="px-4 py-3.5"><span className="text-sm font-semibold text-[var(--label-primary)]">{o.party_name}</span></td>
                <td className="px-4 py-3.5"><span className="text-sm text-[var(--label-secondary)]">{o.phone || '—'}</span></td>
                <td className="px-4 py-3.5"><CallCell ts={o.voice_1_ts} status={o.voice_1_status} formatDateTime={formatDateTime} /></td>
                <td className="px-4 py-3.5"><CallCell ts={o.voice_2_ts} status={o.voice_2_status} formatDateTime={formatDateTime} /></td>
                <td className="px-4 py-3.5"><CallCell ts={o.voice_3_ts} status={o.voice_3_status} formatDateTime={formatDateTime} /></td>
                <td className="px-4 py-3.5 text-center">
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-[var(--label-tertiary)]" /> : <ChevronDown className="h-4 w-4 text-[var(--label-tertiary)]" />}
                </td>
            </tr>
            {isExpanded && (
                <tr>
                    <td colSpan={6} className="px-6 py-5 bg-[var(--fill-quaternary)]">
                        <h4 className="text-xs font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-3">Call Details & Notes</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { label: 'Call 1', ts: o.voice_1_ts, status: o.voice_1_status, sentiment: o.voice_1_sentiment, note: o.voice_1_note },
                                { label: 'Call 2', ts: o.voice_2_ts, status: o.voice_2_status, sentiment: o.voice_2_sentiment, note: o.voice_2_note },
                                { label: 'Call 3', ts: o.voice_3_ts, status: o.voice_3_status, sentiment: o.voice_3_sentiment, note: o.voice_3_note },
                            ].map((call, i) => (
                                <div key={i} className="bg-[var(--glass-fill)] rounded-xl border border-[var(--separator)] p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-[var(--label-primary)]">{call.label}</span>
                                        {call.ts ? <span className="text-[10px] text-[var(--label-tertiary)]">{formatDateTime(call.ts)}</span> : <span className="text-[10px] text-[var(--label-tertiary)] italic">Not made</span>}
                                    </div>
                                    {call.status && <p className="text-xs text-[var(--label-secondary)]">Status: <strong>{call.status}</strong></p>}
                                    {call.sentiment && (
                                        <p className="text-xs mt-1">
                                            Sentiment:{' '}
                                            <strong className={call.sentiment.toLowerCase() === 'positive' ? 'text-emerald-600' : call.sentiment.toLowerCase() === 'negative' ? 'text-rose-600' : 'text-amber-600'}>
                                                {call.sentiment}
                                            </strong>
                                        </p>
                                    )}
                                    {call.note && <p className="text-xs text-[var(--label-tertiary)] mt-2 leading-relaxed">{call.note}</p>}
                                </div>
                            ))}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

function CallCell({ ts, status, formatDateTime }: { ts: string | null; status: string | null; formatDateTime: (d: string | null) => string }) {
    if (!ts) return <span className="text-[var(--label-tertiary)] text-xs italic">—</span>;
    const s = status?.toLowerCase();
    const variant = s === 'completed' ? 'success' : s === 'no_answer' || s === 'busy' ? 'warning' : s === 'failed' ? 'danger' : 'neutral';
    return (
        <div className="space-y-1">
            <span className="text-[10px] text-[var(--label-tertiary)]">{formatDateTime(ts)}</span>
            {status && <div><StatusBadge value={status} variant={variant} /></div>}
        </div>
    );
}

function MiniCard({ title, value, icon, isString }: { title: string; value: number | string; icon: React.ReactNode; isString?: boolean }) {
    return (
        <Card>
            <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[var(--fill-quaternary)]">{icon}</div>
                <div>
                    <p className="text-[10px] font-bold text-[var(--label-tertiary)] uppercase tracking-wider">{title}</p>
                    <p className="text-xl font-bold text-[var(--label-primary)]">{isString ? value : (value as number).toLocaleString()}</p>
                </div>
            </CardContent>
        </Card>
    );
}
