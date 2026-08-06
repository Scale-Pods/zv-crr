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
            <Card className="overflow-hidden">
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
                        <WhatsAppChatWindow record={o} formatDateTime={formatDateTime} waStatusVariant={waStatusVariant} />
                    </td>
                </tr>
            )}
        </>
    );
}

function WhatsAppChatWindow({ record: o, formatDateTime, waStatusVariant }: {
    record: CRROutreach;
    formatDateTime: (d: string | null) => string;
    waStatusVariant: (s: string | null) => 'success' | 'info' | 'warning' | 'danger' | 'neutral' | 'purple';
}) {
    // Construct sequential WhatsApp chat stream
    interface ChatItem {
        id: string;
        sender: 'bot' | 'user' | 'system';
        senderName: string;
        text: string;
        timestamp?: string | null;
        status?: string | null;
        isTemplate?: boolean;
        badge?: string;
    }

    const chatItems: ChatItem[] = [];

    // 1. Initial Outgoing Message (Bot/System Template)
    if (o.whatsapp_1_template || o.whatsapp_1_ts) {
        chatItems.push({
            id: 'msg-1-template',
            sender: 'bot',
            senderName: 'Z V STEELS (Bot)',
            text: o.whatsapp_1_template || 'Initial reorder reminder template',
            timestamp: o.whatsapp_1_ts || o.outreach_start_date,
            status: o.whatsapp_1_status || 'sent',
            isTemplate: true,
            badge: 'Initial Campaign Template',
        });
    }

    // 2. Interleaved User and Bot Turns (1 through 10)
    for (let i = 1; i <= 10; i++) {
        const userMsg = (o as any)[`user_replied_${i}`];
        const botMsg = (o as any)[`bot_replied_${i}`];
        const botStatus = (o as any)[`bot_replied_status_${i}`];

        if (userMsg) {
            chatItems.push({
                id: `user-reply-${i}`,
                sender: 'user',
                senderName: o.contact_person ? `${o.contact_person.trim()} (${o.party_name})` : o.party_name,
                text: userMsg,
            });
        }
        if (botMsg) {
            chatItems.push({
                id: `bot-reply-${i}`,
                sender: 'bot',
                senderName: 'Z V STEELS (Bot)',
                text: botMsg,
                status: botStatus || 'delivered',
            });
        }
    }

    // 3. Subsequent System / Invoice Templates (Steps 2-4)
    [
        { step: 2, template: o.whatsapp_2_template, ts: o.whatsapp_2_ts, status: o.whatsapp_2_status },
        { step: 3, template: o.whatsapp_3_template, ts: o.whatsapp_3_ts, status: o.whatsapp_3_status },
        { step: 4, template: o.whatsapp_4_template, ts: o.whatsapp_4_ts, status: o.whatsapp_4_status },
    ].forEach(({ step, template, ts, status }) => {
        if (template || ts) {
            chatItems.push({
                id: `template-step-${step}`,
                sender: 'system',
                senderName: `Z V STEELS (Message ${step})`,
                text: template || `Campaign step ${step} dispatched`,
                timestamp: ts,
                status: status || 'delivered',
                isTemplate: true,
                badge: `Step ${step} Template`,
            });
        }
    });

    return (
        <div className="rounded-2xl border border-[var(--separator)] bg-[var(--glass-fill)] overflow-hidden shadow-lg max-w-4xl mx-auto">
            {/* WhatsApp Header Bar */}
            <div className="bg-[var(--fill-quaternary)] px-5 py-3.5 border-b border-[var(--separator)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                        <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-[var(--label-primary)]">{o.party_name}</h3>
                            {o.contact_person && (
                                <span className="text-xs text-[var(--label-secondary)]">({o.contact_person.trim()})</span>
                            )}
                        </div>
                        <p className="text-[11px] text-[var(--label-tertiary)] flex items-center gap-1.5">
                            <span>WhatsApp: {o.phone || 'No phone'}</span>
                            <span>•</span>
                            <span className="text-emerald-600 font-medium">● Active Thread</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {chatItems.length} Messages
                    </span>
                </div>
            </div>

            {/* Conversation Timeline Body */}
            <div className="p-6 space-y-4 max-h-[480px] overflow-y-auto bg-[var(--glass-fill)]/50">
                {/* System Start Date Banner */}
                <div className="flex justify-center my-1">
                    <span className="text-[10px] font-bold text-[var(--label-tertiary)] uppercase tracking-wider bg-[var(--fill-quaternary)] px-3 py-1 rounded-full border border-[var(--separator)]">
                        Outreach Started {formatDateTime(o.outreach_start_date || o.created_at)}
                    </span>
                </div>

                {chatItems.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[var(--label-tertiary)] italic">
                        No WhatsApp conversation logged for this party yet.
                    </div>
                ) : (
                    chatItems.map((item) => {
                        const isUser = item.sender === 'user';
                        const isBot = item.sender === 'bot';
                        const isSystem = item.sender === 'system';

                        return (
                            <div
                                key={item.id}
                                className={`flex flex-col ${isUser ? 'items-start' : 'items-end'} w-full`}
                            >
                                <div
                                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-sm space-y-1.5 transition-all ${
                                        isUser
                                            ? 'bg-emerald-500/15 border border-emerald-500/25 rounded-tl-sm text-[var(--label-primary)]'
                                            : isSystem
                                            ? 'bg-purple-500/10 border border-purple-500/20 rounded-tr-sm text-[var(--label-primary)]'
                                            : 'bg-blue-500/15 border border-blue-500/25 rounded-tr-sm text-[var(--label-primary)]'
                                    }`}
                                >
                                    {/* Header info */}
                                    <div className="flex items-center justify-between gap-3 text-[10px] pb-1 border-b border-[var(--separator)]/40">
                                        <span className={`font-bold ${isUser ? 'text-emerald-600 dark:text-emerald-400' : isSystem ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                            {item.senderName}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            {item.badge && (
                                                <span className="px-1.5 py-0.5 rounded bg-[var(--fill-quaternary)] text-[9px] font-semibold text-[var(--label-secondary)]">
                                                    {item.badge}
                                                </span>
                                            )}
                                            {item.timestamp && (
                                                <span className="text-[var(--label-tertiary)]">
                                                    {formatDateTime(item.timestamp)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Body content */}
                                    <p className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
                                        {item.text}
                                    </p>

                                    {/* Footer status ticks */}
                                    {(isBot || isSystem) && (
                                        <div className="flex items-center justify-end gap-1.5 text-[10px] pt-0.5">
                                            {item.status && (
                                                <StatusBadge value={item.status} variant={waStatusVariant(item.status)} />
                                            )}
                                            <CheckCheck className={`h-3.5 w-3.5 ${item.status?.toLowerCase() === 'read' ? 'text-purple-500' : 'text-blue-500'}`} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

function MiniCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
    return (
        <Card>
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
