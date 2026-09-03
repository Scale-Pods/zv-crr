"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Search, ChevronDown, ChevronUp, Send, CheckCheck, UserCheck, Bot, FileText } from "lucide-react";
import { ColumnInfo, StatusBadge } from "@/components/crr/ui-atoms";
import type { CRROutreach } from "@/lib/crr-data";

export function WhatsAppClient({ outreach }: { outreach: CRROutreach[] }) {
    const [search, setSearch] = useState("");
    const [channelFilter, setChannelFilter] = useState<string>("all");
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Filter outreach records relevant to WhatsApp
    const waRecords = outreach.filter(o => {
        const hasWaTs = !!(o.whatsapp_1_ts || o.whatsapp_2_ts || o.whatsapp_3_ts || o.whatsapp_4_ts);
        const hasWaTemplate = !!(o.whatsapp_1_template || o.whatsapp_2_template || o.whatsapp_3_template || o.whatsapp_4_template);
        const isWaChannel = o.response_channel?.toLowerCase() === 'whatsapp';
        
        let hasUserReply = false;
        let hasBotReply = false;
        for (let i = 1; i <= 10; i++) {
            if ((o as any)[`user_replied_${i}`]) hasUserReply = true;
            if ((o as any)[`bot_replied_${i}`]) hasBotReply = true;
        }
        
        return hasWaTs || hasWaTemplate || isWaChannel || hasUserReply || hasBotReply;
    });

    const filtered = waRecords.filter(o => {
        // Channel Filter
        if (channelFilter !== "all") {
            const chan = (o.response_channel || 'none').toLowerCase();
            if (channelFilter === 'whatsapp' && chan !== 'whatsapp') return false;
            if (channelFilter === 'other' && chan === 'whatsapp') return false;
            if (channelFilter === 'none' && o.response_channel) return false;
        }

        // Search Filter
        if (!search) return true;
        const q = search.toLowerCase();
        const partyMatch = o.party_name.toLowerCase().includes(q) ||
                           (o.phone || '').includes(q) ||
                           (o.contact_person || '').toLowerCase().includes(q) ||
                           (o.response_channel || '').toLowerCase().includes(q);

        if (partyMatch) return true;

        // Search within templates, user replies, bot replies
        for (let i = 1; i <= 10; i++) {
            const ur = (o as any)[`user_replied_${i}`];
            const br = (o as any)[`bot_replied_${i}`];
            if (ur && String(ur).toLowerCase().includes(q)) return true;
            if (br && String(br).toLowerCase().includes(q)) return true;
        }

        if (o.whatsapp_1_template && o.whatsapp_1_template.toLowerCase().includes(q)) return true;
        if (o.whatsapp_2_template && o.whatsapp_2_template.toLowerCase().includes(q)) return true;
        if (o.whatsapp_3_template && o.whatsapp_3_template.toLowerCase().includes(q)) return true;
        if (o.whatsapp_4_template && o.whatsapp_4_template.toLowerCase().includes(q)) return true;

        return false;
    });

    const handleSearchChange = (val: string) => {
        setSearch(val);
        setCurrentPage(1);
    };

    const handleChannelFilterChange = (val: string) => {
        setChannelFilter(val);
        setCurrentPage(1);
    };

    const itemsPerPage = 10;
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const activePage = Math.min(currentPage, Math.max(1, totalPages));
    const startIndex = (activePage - 1) * itemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

    // Metrics Calculation
    let totalTemplatesSent = 0;
    let totalUserReplies = 0;
    let totalBotReplies = 0;
    let deliveredOrReadCount = 0;

    waRecords.forEach(o => {
        // Outgoing templates
        [
            { ts: o.whatsapp_1_ts, status: o.whatsapp_1_status },
            { ts: o.whatsapp_2_ts, status: o.whatsapp_2_status },
            { ts: o.whatsapp_3_ts, status: o.whatsapp_3_status },
            { ts: o.whatsapp_4_ts, status: o.whatsapp_4_status },
        ].forEach(w => {
            if (w.ts) {
                totalTemplatesSent++;
                const s = w.status?.toLowerCase();
                if (s === 'delivered' || s === 'read') deliveredOrReadCount++;
            }
        });

        // User & Bot replies
        for (let i = 1; i <= 10; i++) {
            if ((o as any)[`user_replied_${i}`]) totalUserReplies++;
            const br = (o as any)[`bot_replied_${i}`];
            const st = (o as any)[`bot_replied_status_${i}`];
            if (br || st) {
                totalBotReplies++;
                const s = st?.toLowerCase();
                if (s === 'delivered' || s === 'read') deliveredOrReadCount++;
            }
        }
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

    const channelVariant = (ch: string | null): 'success' | 'purple' | 'info' | 'neutral' => {
        switch (ch?.toLowerCase()) {
            case 'whatsapp': return 'success';
            case 'voice': return 'purple';
            case 'email': return 'info';
            default: return 'neutral';
        }
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--label-primary)]">WhatsApp Outreach & Dialogue</h1>
                    <p className="text-[var(--label-secondary)]">WhatsApp CRM — tracking templates, user replies, bot responses & delivery statuses across {waRecords.length} parties</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    {/* Response Channel Filter Selector */}
                    <div className="flex items-center rounded-xl bg-[var(--glass-fill)] border border-[var(--separator)] p-1 text-xs">
                        <button
                            onClick={() => handleChannelFilterChange("all")}
                            className={`px-3 py-1.5 rounded-lg transition-all font-medium ${channelFilter === "all" ? "bg-blue-600 text-white shadow-sm" : "text-[var(--label-secondary)] hover:text-[var(--label-primary)]"}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => handleChannelFilterChange("whatsapp")}
                            className={`px-3 py-1.5 rounded-lg transition-all font-medium ${channelFilter === "whatsapp" ? "bg-emerald-600 text-white shadow-sm" : "text-[var(--label-secondary)] hover:text-[var(--label-primary)]"}`}
                        >
                            WA Channel
                        </button>
                        <button
                            onClick={() => handleChannelFilterChange("other")}
                            className={`px-3 py-1.5 rounded-lg transition-all font-medium ${channelFilter === "other" ? "bg-purple-600 text-white shadow-sm" : "text-[var(--label-secondary)] hover:text-[var(--label-primary)]"}`}
                        >
                            Other Channel
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--label-tertiary)]" />
                        <input
                            type="text"
                            placeholder="Search party, template, replies..."
                            value={search}
                            onChange={e => handleSearchChange(e.target.value)}
                            className="pl-10 pr-4 py-2 w-[260px] sm:w-[300px] rounded-xl bg-[var(--glass-fill)] border border-[var(--separator)] text-sm text-[var(--label-primary)] placeholder:text-[var(--label-tertiary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <MiniCard title="Parties Contacted" value={waRecords.length} icon={<MessageCircle className="h-5 w-5 text-emerald-600" />} />
                <MiniCard title="Campaign Templates" value={totalTemplatesSent} icon={<FileText className="h-5 w-5 text-blue-600" />} />
                <MiniCard title="User Replies" value={totalUserReplies} icon={<UserCheck className="h-5 w-5 text-emerald-500" />} />
                <MiniCard title="Bot Replies Sent" value={totalBotReplies} icon={<Bot className="h-5 w-5 text-purple-600" />} />
                <MiniCard title="Delivered / Read" value={deliveredOrReadCount} icon={<CheckCheck className="h-5 w-5 text-teal-600" />} />
            </div>

            {/* Main WhatsApp CRM Data Table */}
            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--separator)] bg-[var(--fill-quaternary)]">
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <ColumnInfo label="Party & Contact" description="Customer name, contact person & WhatsApp phone number" />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <ColumnInfo label="Response Channel" description="Primary response channel detected for this lead" />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <ColumnInfo label="WhatsApp Template" description="Active or sent WhatsApp outreach templates (1 to 4)" />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <ColumnInfo label="User Replied" description="Messages & replies received from the user (User_Replied_1..10)" />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <ColumnInfo label="Bot Replied" description="Automated bot responses dispatched (Bot_Replied_1..10)" />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <ColumnInfo label="Bot Replied Status" description="Delivery status of bot replies (delivered, read, sent)" />
                                    </th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--separator)]">
                                {paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12 text-[var(--label-tertiary)]">
                                            No WhatsApp records matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map(o => (
                                        <WaRow
                                            key={o.id}
                                            record={o}
                                            isExpanded={expandedId === o.id}
                                            onToggle={() => setExpandedId(expandedId === o.id ? null : o.id)}
                                            formatDateTime={formatDateTime}
                                            waStatusVariant={waStatusVariant}
                                            channelVariant={channelVariant}
                                        />
                                    ))
                                )}
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
                                                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
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

function WaRow({
    record: o,
    isExpanded,
    onToggle,
    formatDateTime,
    waStatusVariant,
    channelVariant,
}: {
    record: CRROutreach;
    isExpanded: boolean;
    onToggle: () => void;
    formatDateTime: (d: string | null) => string;
    waStatusVariant: (s: string | null) => 'success' | 'info' | 'warning' | 'danger' | 'neutral' | 'purple';
    channelVariant: (ch: string | null) => 'success' | 'purple' | 'info' | 'neutral';
}) {
    // Collect user replies
    const userReplies: { step: number; text: string }[] = [];
    for (let i = 1; i <= 10; i++) {
        const text = (o as any)[`user_replied_${i}`];
        if (text) userReplies.push({ step: i, text });
    }

    // Collect bot replies & statuses
    const botReplies: { step: number; text: string; status: string | null }[] = [];
    for (let i = 1; i <= 10; i++) {
        const text = (o as any)[`bot_replied_${i}`];
        const status = (o as any)[`bot_replied_status_${i}`];
        if (text || status) botReplies.push({ step: i, text: text || '', status: status || null });
    }

    // Active templates
    const templates: { step: number; text: string | null; ts: string | null; status: string | null }[] = [];
    if (o.whatsapp_1_template || o.whatsapp_1_ts) templates.push({ step: 1, text: o.whatsapp_1_template, ts: o.whatsapp_1_ts, status: o.whatsapp_1_status });
    if (o.whatsapp_2_template || o.whatsapp_2_ts) templates.push({ step: 2, text: o.whatsapp_2_template, ts: o.whatsapp_2_ts, status: o.whatsapp_2_status });
    if (o.whatsapp_3_template || o.whatsapp_3_ts) templates.push({ step: 3, text: o.whatsapp_3_template, ts: o.whatsapp_3_ts, status: o.whatsapp_3_status });
    if (o.whatsapp_4_template || o.whatsapp_4_ts) templates.push({ step: 4, text: o.whatsapp_4_template, ts: o.whatsapp_4_ts, status: o.whatsapp_4_status });

    const latestUserReply = userReplies.length > 0 ? userReplies[userReplies.length - 1] : null;
    const latestBotReply = botReplies.length > 0 ? botReplies[botReplies.length - 1] : null;

    return (
        <>
            <tr className="hover:bg-[var(--fill-quaternary)] transition-colors cursor-pointer" onClick={onToggle}>
                {/* Party & Contact */}
                <td className="px-4 py-3.5">
                    <div className="space-y-0.5">
                        <span className="text-sm font-semibold text-[var(--label-primary)] block">{o.party_name}</span>
                        {o.contact_person && (
                            <span className="text-xs text-[var(--label-secondary)] block font-normal">{o.contact_person}</span>
                        )}
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono block">{o.phone || '—'}</span>
                    </div>
                </td>

                {/* Response Channel Column */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                    {o.response_channel ? (
                        <StatusBadge value={o.response_channel} variant={channelVariant(o.response_channel)} />
                    ) : (
                        <span className="text-xs text-[var(--label-tertiary)] italic">No response</span>
                    )}
                </td>

                {/* WhatsApp Template Column */}
                <td className="px-4 py-3.5">
                    {templates.length === 0 ? (
                        <span className="text-xs text-[var(--label-tertiary)] italic">—</span>
                    ) : (
                        <div className="space-y-1 max-w-[200px]">
                            <div className="flex flex-wrap gap-1">
                                {templates.map(t => (
                                    <span key={t.step} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20 whitespace-nowrap">
                                        T{t.step} {t.status ? `(${t.status})` : ''}
                                    </span>
                                ))}
                            </div>
                            {templates[0].text && (
                                <p className="text-[11px] text-[var(--label-tertiary)] truncate" title={templates[0].text}>
                                    {templates[0].text}
                                </p>
                            )}
                        </div>
                    )}
                </td>

                {/* User Replied Column */}
                <td className="px-4 py-3.5">
                    {userReplies.length === 0 ? (
                        <span className="text-xs text-[var(--label-tertiary)] italic">—</span>
                    ) : (
                        <div className="space-y-1 max-w-[220px]">
                            <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/25">
                                    {userReplies.length} {userReplies.length === 1 ? 'Reply' : 'Replies'}
                                </span>
                            </div>
                            {latestUserReply && (
                                <p className="text-[11px] text-[var(--label-primary)] truncate font-normal" title={latestUserReply.text}>
                                    <span className="font-semibold text-emerald-600">#{latestUserReply.step}:</span> {latestUserReply.text}
                                </p>
                            )}
                        </div>
                    )}
                </td>

                {/* Bot Replied Column */}
                <td className="px-4 py-3.5">
                    {botReplies.length === 0 ? (
                        <span className="text-xs text-[var(--label-tertiary)] italic">—</span>
                    ) : (
                        <div className="space-y-1 max-w-[220px]">
                            <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-600 border border-purple-500/25">
                                    {botReplies.length} {botReplies.length === 1 ? 'Bot Msg' : 'Bot Msgs'}
                                </span>
                            </div>
                            {latestBotReply?.text && (
                                <p className="text-[11px] text-[var(--label-secondary)] truncate font-normal" title={latestBotReply.text}>
                                    <span className="font-semibold text-purple-600">#{latestBotReply.step}:</span> {latestBotReply.text}
                                </p>
                            )}
                        </div>
                    )}
                </td>

                {/* Bot Replied Status Column */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                    {latestBotReply?.status ? (
                        <div className="flex items-center gap-1.5">
                            <StatusBadge value={latestBotReply.status} variant={waStatusVariant(latestBotReply.status)} />
                            <CheckCheck className={`h-4 w-4 ${latestBotReply.status.toLowerCase() === 'read' ? 'text-purple-500' : 'text-blue-500'}`} />
                        </div>
                    ) : botReplies.length > 0 ? (
                        <span className="text-xs text-[var(--label-secondary)]">Sent</span>
                    ) : (
                        <span className="text-xs text-[var(--label-tertiary)] italic">—</span>
                    )}
                </td>

                {/* Toggle Icon */}
                <td className="px-4 py-3.5 text-center">
                    {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-[var(--label-tertiary)]" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-[var(--label-tertiary)]" />
                    )}
                </td>
            </tr>

            {/* Expanded WhatsApp Interactive Chat Window */}
            {isExpanded && (
                <tr>
                    <td colSpan={7} className="px-6 py-5 bg-[var(--fill-quaternary)]">
                        <WhatsAppChatWindow record={o} formatDateTime={formatDateTime} waStatusVariant={waStatusVariant} channelVariant={channelVariant} />
                    </td>
                </tr>
            )}
        </>
    );
}

function WhatsAppChatWindow({
    record: o,
    formatDateTime,
    waStatusVariant,
    channelVariant,
}: {
    record: CRROutreach;
    formatDateTime: (d: string | null) => string;
    waStatusVariant: (s: string | null) => 'success' | 'info' | 'warning' | 'danger' | 'neutral' | 'purple';
    channelVariant: (ch: string | null) => 'success' | 'purple' | 'info' | 'neutral';
}) {
    interface ChatItem {
        id: string;
        sender: 'user' | 'bot' | 'template';
        senderName: string;
        text: string;
        timestamp?: string | null;
        status?: string | null;
        stepNum?: number;
        badge?: string;
    }

    const chatItems: ChatItem[] = [];

    // 1. WhatsApp Template 1 (Initial Template)
    if (o.whatsapp_1_template || o.whatsapp_1_ts) {
        chatItems.push({
            id: 'wa-template-1',
            sender: 'template',
            senderName: 'WhatsApp Template 1',
            text: o.whatsapp_1_template || 'Initial reorder campaign template dispatched',
            timestamp: o.whatsapp_1_ts || o.outreach_start_date,
            status: o.whatsapp_1_status || 'sent',
            badge: 'Template 1',
        });
    }

    // 2. Interleaved User Replied (1..10) and Bot Replied (1..10)
    for (let i = 1; i <= 10; i++) {
        const userMsg = (o as any)[`user_replied_${i}`];
        const botMsg = (o as any)[`bot_replied_${i}`];
        const botStatus = (o as any)[`bot_replied_status_${i}`];

        if (userMsg) {
            chatItems.push({
                id: `user-replied-${i}`,
                sender: 'user',
                senderName: o.contact_person ? `${o.contact_person.trim()} (${o.party_name})` : o.party_name,
                text: userMsg,
                stepNum: i,
                badge: `User Replied #${i}`,
            });
        }

        if (botMsg || botStatus) {
            chatItems.push({
                id: `bot-replied-${i}`,
                sender: 'bot',
                senderName: 'ZV Assistant Bot',
                text: botMsg || `Automated bot reply #${i}`,
                status: botStatus || 'delivered',
                stepNum: i,
                badge: `Bot Replied #${i}`,
            });
        }
    }

    // 3. Subsequent WhatsApp Templates (Steps 2, 3, 4)
    [
        { step: 2, template: o.whatsapp_2_template, ts: o.whatsapp_2_ts, status: o.whatsapp_2_status },
        { step: 3, template: o.whatsapp_3_template, ts: o.whatsapp_3_ts, status: o.whatsapp_3_status },
        { step: 4, template: o.whatsapp_4_template, ts: o.whatsapp_4_ts, status: o.whatsapp_4_status },
    ].forEach(({ step, template, ts, status }) => {
        if (template || ts) {
            chatItems.push({
                id: `wa-template-${step}`,
                sender: 'template',
                senderName: `WhatsApp Template ${step}`,
                text: template || `Campaign step ${step} template dispatched`,
                timestamp: ts,
                status: status || 'delivered',
                badge: `Template ${step}`,
            });
        }
    });

    return (
        <div className="rounded-2xl border border-[var(--separator)] bg-[var(--glass-fill)] overflow-hidden shadow-lg max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-[var(--fill-quaternary)] px-5 py-3.5 border-b border-[var(--separator)] flex flex-wrap items-center justify-between gap-3">
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
                        <p className="text-[11px] text-[var(--label-tertiary)] flex items-center gap-2">
                            <span>Phone: {o.phone || 'No phone'}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                Response Channel: {o.response_channel ? (
                                    <StatusBadge value={o.response_channel} variant={channelVariant(o.response_channel)} />
                                ) : (
                                    <span className="text-[var(--label-tertiary)] font-normal italic">None</span>
                                )}
                            </span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-semibold">
                        {chatItems.length} Thread Messages
                    </span>
                </div>
            </div>

            {/* Chat Messages Body */}
            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto bg-[var(--glass-fill)]/50">
                {/* System Start Date Banner */}
                <div className="flex justify-center my-1">
                    <span className="text-[10px] font-bold text-[var(--label-tertiary)] uppercase tracking-wider bg-[var(--fill-quaternary)] px-3 py-1 rounded-full border border-[var(--separator)]">
                        Outreach Started {formatDateTime(o.outreach_start_date || o.created_at)}
                    </span>
                </div>

                {chatItems.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[var(--label-tertiary)] italic">
                        No WhatsApp chat messages recorded for this party.
                    </div>
                ) : (
                    chatItems.map(item => {
                        const isUser = item.sender === 'user';
                        const isBot = item.sender === 'bot';
                        const isTemplate = item.sender === 'template';

                        return (
                            <div key={item.id} className={`flex flex-col ${isUser ? 'items-start' : 'items-end'} w-full`}>
                                <div
                                    className={`max-w-[88%] sm:max-w-[78%] rounded-2xl p-4 shadow-sm space-y-1.5 transition-all ${
                                        isUser
                                            ? 'bg-emerald-500/15 border border-emerald-500/25 rounded-tl-sm text-[var(--label-primary)]'
                                            : isTemplate
                                            ? 'bg-purple-500/10 border border-purple-500/20 rounded-tr-sm text-[var(--label-primary)]'
                                            : 'bg-blue-500/15 border border-blue-500/25 rounded-tr-sm text-[var(--label-primary)]'
                                    }`}
                                >
                                    {/* Header line inside bubble */}
                                    <div className="flex items-center justify-between gap-3 text-[10px] pb-1 border-b border-[var(--separator)]/40">
                                        <span className={`font-bold ${isUser ? 'text-emerald-600 dark:text-emerald-400' : isTemplate ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                            {item.senderName}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            {item.badge && (
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                    isUser ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' :
                                                    isTemplate ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300' :
                                                    'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                                                }`}>
                                                    {item.badge}
                                                </span>
                                            )}
                                            {item.timestamp && (
                                                <span className="text-[var(--label-tertiary)] font-mono">
                                                    {formatDateTime(item.timestamp)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Message Text */}
                                    <p className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
                                        {item.text}
                                    </p>

                                    {/* Footer Delivery Status */}
                                    {(isBot || isTemplate) && item.status && (
                                        <div className="flex items-center justify-end gap-1.5 text-[10px] pt-1 border-t border-[var(--separator)]/30">
                                            <span className="text-[9px] text-[var(--label-tertiary)] uppercase font-semibold">Status:</span>
                                            <StatusBadge value={item.status} variant={waStatusVariant(item.status)} />
                                            <CheckCheck className={`h-3.5 w-3.5 ${item.status.toLowerCase() === 'read' ? 'text-purple-500' : 'text-blue-500'}`} />
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
