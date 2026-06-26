"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Search, ChevronDown, ChevronUp, Send, CheckCheck } from "lucide-react";
import { ColumnInfo, StatusBadge } from "@/components/crr/ui-atoms";
import type { CRROutreach } from "@/lib/crr-data";

export function WhatsAppClient({ outreach }: { outreach: CRROutreach[] }) {
    const [search, setSearch] = useState("");
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const waRecords = outreach.filter(o => o.whatsapp_1_ts || o.whatsapp_2_ts || o.whatsapp_3_ts || o.whatsapp_4_ts);

    const filtered = waRecords.filter(o => {
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
    let totalSent = 0, delivered = 0, read = 0;
    waRecords.forEach(o => {
        [
            { ts: o.whatsapp_1_ts, status: o.whatsapp_1_status },
            { ts: o.whatsapp_2_ts, status: o.whatsapp_2_status },
            { ts: o.whatsapp_3_ts, status: o.whatsapp_3_status },
            { ts: o.whatsapp_4_ts, status: o.whatsapp_4_status },
        ].forEach(w => {
            if (w.ts) {
                totalSent++;
                const s = w.status?.toLowerCase();
                if (s === 'delivered' || s === 'read') delivered++;
                if (s === 'read') read++;
            }
        });
    });

    const formatDateTime = (d: string | null) => {
        if (!d) return '—';
        return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const waStatusVariant = (s: string | null): 'success' | 'info' | 'warning' | 'danger' | 'neutral' | 'purple' => {
        switch (s?.toLowerCase()) {
            case 'read': return 'purple';
            case 'delivered': return 'success';
            case 'sent': return 'info';
            case 'failed': return 'danger';
            default: return 'neutral';
        }
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--label-primary)]">WhatsApp Outreach</h1>
                    <p className="text-[var(--label-secondary)]">WhatsApp message tracking — {waRecords.length} parties contacted</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--label-tertiary)]" />
                    <input type="text" placeholder="Search party, phone..." value={search} onChange={e => handleSearchChange(e.target.value)}
                        className="pl-10 pr-4 py-2.5 w-[280px] rounded-xl bg-[var(--glass-fill)] border border-[var(--separator)] text-sm text-[var(--label-primary)] placeholder:text-[var(--label-tertiary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MiniCard title="Messages Sent" value={totalSent} icon={<Send className="h-5 w-5 text-emerald-600" />} />
                <MiniCard title="Delivered" value={delivered} icon={<CheckCheck className="h-5 w-5 text-blue-600" />} />
                <MiniCard title="Read" value={read} icon={<CheckCheck className="h-5 w-5 text-purple-600" />} />
                <MiniCard title="Parties Reached" value={waRecords.length} icon={<MessageCircle className="h-5 w-5 text-amber-600" />} />
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
                                        <ColumnInfo label="Phone" description="WhatsApp number" />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <ColumnInfo label="Msg 1" description="First WhatsApp message — timestamp & delivery status" />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <ColumnInfo label="Msg 2" description="Second WhatsApp message" />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <ColumnInfo label="Msg 3" description="Third WhatsApp message" />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <ColumnInfo label="Msg 4" description="Fourth WhatsApp message" />
                                    </th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--separator)]">
                                {paginated.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-12 text-[var(--label-tertiary)]">No WhatsApp records found</td></tr>
                                ) : paginated.map(o => (
                                    <WaRow key={o.id} record={o} isExpanded={expandedId === o.id} onToggle={() => setExpandedId(expandedId === o.id ? null : o.id)} formatDateTime={formatDateTime} waStatusVariant={waStatusVariant} />
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

function WaMsgCell({ ts, status, formatDateTime, waStatusVariant }: {
    ts: string | null; status: string | null; formatDateTime: (d: string | null) => string;
    waStatusVariant: (s: string | null) => 'success' | 'info' | 'warning' | 'danger' | 'neutral' | 'purple';
}) {
    if (!ts) return <span className="text-[var(--label-tertiary)] text-xs italic">—</span>;
    return (
        <div className="space-y-1">
            <span className="text-[10px] text-[var(--label-tertiary)]">{formatDateTime(ts)}</span>
            {status && <div><StatusBadge value={status} variant={waStatusVariant(status)} /></div>}
        </div>
    );
}

function WaRow({ record: o, isExpanded, onToggle, formatDateTime, waStatusVariant }: {
    record: CRROutreach; isExpanded: boolean; onToggle: () => void;
    formatDateTime: (d: string | null) => string;
    waStatusVariant: (s: string | null) => 'success' | 'info' | 'warning' | 'danger' | 'neutral' | 'purple';
}) {
    return (
        <>
            <tr className="hover:bg-[var(--fill-quaternary)] transition-colors cursor-pointer" onClick={onToggle}>
                <td className="px-4 py-3.5"><span className="text-sm font-semibold text-[var(--label-primary)]">{o.party_name}</span></td>
                <td className="px-4 py-3.5"><span className="text-sm text-[var(--label-secondary)]">{o.phone || '—'}</span></td>
                <td className="px-4 py-3.5"><WaMsgCell ts={o.whatsapp_1_ts} status={o.whatsapp_1_status} formatDateTime={formatDateTime} waStatusVariant={waStatusVariant} /></td>
                <td className="px-4 py-3.5"><WaMsgCell ts={o.whatsapp_2_ts} status={o.whatsapp_2_status} formatDateTime={formatDateTime} waStatusVariant={waStatusVariant} /></td>
                <td className="px-4 py-3.5"><WaMsgCell ts={o.whatsapp_3_ts} status={o.whatsapp_3_status} formatDateTime={formatDateTime} waStatusVariant={waStatusVariant} /></td>
                <td className="px-4 py-3.5"><WaMsgCell ts={o.whatsapp_4_ts} status={o.whatsapp_4_status} formatDateTime={formatDateTime} waStatusVariant={waStatusVariant} /></td>
                <td className="px-4 py-3.5 text-center">
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-[var(--label-tertiary)]" /> : <ChevronDown className="h-4 w-4 text-[var(--label-tertiary)]" />}
                </td>
            </tr>
            {isExpanded && (
                <tr>
                    <td colSpan={7} className="px-6 py-5 bg-[var(--fill-quaternary)]">
                        <h4 className="text-xs font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-3">Message Templates</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Message 1', ts: o.whatsapp_1_ts, status: o.whatsapp_1_status, template: o.whatsapp_1_template },
                                { label: 'Message 2', ts: o.whatsapp_2_ts, status: o.whatsapp_2_status, template: o.whatsapp_2_template },
                                { label: 'Message 3', ts: o.whatsapp_3_ts, status: o.whatsapp_3_status, template: o.whatsapp_3_template },
                                { label: 'Message 4', ts: o.whatsapp_4_ts, status: o.whatsapp_4_status, template: o.whatsapp_4_template },
                            ].map((msg, i) => (
                                <div key={i} className="bg-[var(--glass-fill)] rounded-xl border border-[var(--separator)] p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-[var(--label-primary)]">{msg.label}</span>
                                        {msg.status && <StatusBadge value={msg.status} variant={waStatusVariant(msg.status)} />}
                                    </div>
                                    {msg.ts && <p className="text-[10px] text-[var(--label-tertiary)] mb-2">Sent {formatDateTime(msg.ts)}</p>}
                                    {msg.template ? (
                                        <p className="text-xs text-[var(--label-secondary)] leading-relaxed whitespace-pre-wrap max-h-[150px] overflow-y-auto">{msg.template}</p>
                                    ) : (
                                        <p className="text-xs text-[var(--label-tertiary)] italic">{msg.ts ? 'Template not stored' : 'Not sent yet'}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

function MiniCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
    return (
        <Card className="bg-[var(--glass-fill)] border-[var(--separator)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)]">
            <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[var(--fill-quaternary)]">{icon}</div>
                <div>
                    <p className="text-[10px] font-bold text-[var(--label-tertiary)] uppercase tracking-wider">{title}</p>
                    <p className="text-xl font-bold text-[var(--label-primary)]">{value.toLocaleString()}</p>
                </div>
            </CardContent>
        </Card>
    );
}
