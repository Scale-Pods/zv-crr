"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Search, ChevronDown, ChevronUp, CheckCircle, XCircle } from "lucide-react";
import { ColumnInfo, StatusBadge } from "@/components/crr/ui-atoms";
import type { CRROutreach } from "@/lib/crr-data";

export function VoiceClient({ outreach }: { outreach: CRROutreach[] }) {
    const [search, setSearch] = useState("");
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Only rows that have at least one voice attempt
    const voiceRecords = outreach.filter(o => o.voice_1_ts || o.voice_2_ts || o.voice_3_ts);

    const filtered = voiceRecords.filter(o => {
        if (!search) return true;
        const q = search.toLowerCase();
        return o.party_name.toLowerCase().includes(q) || (o.phone || '').includes(q) || (o.contact_person || '').toLowerCase().includes(q);
    });

    const handleSearchChange = (val: string) => {
        setSearch(val);
        setCurrentPage(1);
    };

    const itemsPerPage = 10;
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const activePage = Math.min(currentPage, Math.max(1, totalPages));
    const startIndex = (activePage - 1) * itemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

    // Metrics
    let totalAttempts = 0, completed = 0, sentimentPositive = 0, sentimentNegative = 0, sentimentNeutral = 0;
    voiceRecords.forEach(o => {
        [
            { ts: o.voice_1_ts, status: o.voice_1_status, sentiment: o.voice_1_sentiment },
            { ts: o.voice_2_ts, status: o.voice_2_status, sentiment: o.voice_2_sentiment },
            { ts: o.voice_3_ts, status: o.voice_3_status, sentiment: o.voice_3_sentiment },
        ].forEach(v => {
            if (v.ts) {
                totalAttempts++;
                if (v.status?.toLowerCase() === 'completed') completed++;
                const s = v.sentiment?.toLowerCase();
                if (s === 'positive') sentimentPositive++;
                else if (s === 'negative') sentimentNegative++;
                else if (s) sentimentNeutral++;
            }
        });
    });

    const formatDateTime = (d: string | null) => {
        if (!d) return '—';
        return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--label-primary)]">Voice Outreach</h1>
                    <p className="text-[var(--label-secondary)]">AI voice call logs across all parties — {voiceRecords.length} parties contacted</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--label-tertiary)]" />
                    <input type="text" placeholder="Search party, phone..." value={search} onChange={e => handleSearchChange(e.target.value)}
                        className="pl-10 pr-4 py-2.5 w-[280px] rounded-xl bg-[var(--glass-fill)] border border-[var(--separator)] text-sm text-[var(--label-primary)] placeholder:text-[var(--label-tertiary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MiniCard title="Total Calls" value={totalAttempts} icon={<Phone className="h-5 w-5 text-purple-600" />} />
                <MiniCard title="Completed" value={completed} icon={<CheckCircle className="h-5 w-5 text-emerald-600" />} />
                <MiniCard title="Positive" value={sentimentPositive} icon={<span className="text-lg">😊</span>} subtitle={`${sentimentNeutral} neutral · ${sentimentNegative} negative`} />
                <MiniCard title="Parties Reached" value={voiceRecords.length} icon={<Phone className="h-5 w-5 text-blue-600" />} />
            </div>

            {/* Table */}
            <Card className="border-[var(--separator)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)] bg-[var(--glass-fill)] overflow-hidden">
                <CardContent className="p-0">
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
                                        <ColumnInfo label="Call 1" description="First voice call attempt — timestamp & status" />
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
                                {paginated.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-12 text-[var(--label-tertiary)]">No voice records found</td></tr>
                                ) : paginated.map(o => (
                                    <VoiceRow key={o.id} record={o} isExpanded={expandedId === o.id} onToggle={() => setExpandedId(expandedId === o.id ? null : o.id)} formatDateTime={formatDateTime} />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-[var(--separator)] bg-[var(--fill-quaternary)] text-xs text-[var(--label-secondary)]">
                            <div>
                                Showing <span className="font-semibold text-[var(--label-primary)]">{startIndex + 1}</span> to{' '}
                                <span className="font-semibold text-[var(--label-primary)]">{Math.min(startIndex + itemsPerPage, filtered.length)}</span> of{' '}
                                <span className="font-semibold text-[var(--label-primary)]">{filtered.length}</span> entries
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
                                                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
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

function VoiceRow({ record: o, isExpanded, onToggle, formatDateTime }: {
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

function MiniCard({ title, value, icon, subtitle }: { title: string; value: number; icon: React.ReactNode; subtitle?: string }) {
    return (
        <Card className="bg-[var(--glass-fill)] border-[var(--separator)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)]">
            <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[var(--fill-quaternary)]">{icon}</div>
                <div>
                    <p className="text-[10px] font-bold text-[var(--label-tertiary)] uppercase tracking-wider">{title}</p>
                    <p className="text-xl font-bold text-[var(--label-primary)]">{value}</p>
                    {subtitle && <p className="text-[10px] text-[var(--label-tertiary)]">{subtitle}</p>}
                </div>
            </CardContent>
        </Card>
    );
}
