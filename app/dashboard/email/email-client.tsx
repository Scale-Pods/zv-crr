"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Search, ChevronDown, ChevronUp, Reply, Send, UserCheck, Bot, FileText } from "lucide-react";
import { ColumnInfo, StatusBadge } from "@/components/crr/ui-atoms";
import type { CRROutreach } from "@/lib/crr-data";

export function EmailClient({ outreach }: { outreach: CRROutreach[] }) {
    const [search, setSearch] = useState("");
    const [channelFilter, setChannelFilter] = useState<string>("all");
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Filter outreach records relevant to Email
    const emailRecords = outreach.filter(o => {
        const hasEmailTs = !!(o.email_1_ts || o.email_2_ts);
        const hasEmailContent = !!(o.email_1_content || o.email_2_content);
        const isEmailChannel = o.response_channel?.toLowerCase() === 'email';

        let hasUserReply = false;
        let hasBotReply = false;
        for (let i = 1; i <= 5; i++) {
            if ((o as any)[`email_reply${i}`]) hasUserReply = true;
            if ((o as any)[`email_bot_reply${i}`]) hasBotReply = true;
        }

        return hasEmailTs || hasEmailContent || isEmailChannel || hasUserReply || hasBotReply;
    });

    const filtered = emailRecords.filter(o => {
        // Channel Filter
        if (channelFilter !== "all") {
            const chan = (o.response_channel || 'none').toLowerCase();
            if (channelFilter === 'email' && chan !== 'email') return false;
            if (channelFilter === 'other' && chan === 'email') return false;
            if (channelFilter === 'none' && o.response_channel) return false;
        }

        // Search Filter
        if (!search) return true;
        const q = search.toLowerCase();
        const partyMatch = o.party_name.toLowerCase().includes(q) ||
                           (o.email || '').toLowerCase().includes(q) ||
                           (o.contact_person || '').toLowerCase().includes(q) ||
                           (o.response_channel || '').toLowerCase().includes(q);

        if (partyMatch) return true;

        // Search within content, customer replies, bot replies
        for (let i = 1; i <= 5; i++) {
            const er = (o as any)[`email_reply${i}`];
            const ebr = (o as any)[`email_bot_reply${i}`];
            if (er && String(er).toLowerCase().includes(q)) return true;
            if (ebr && String(ebr).toLowerCase().includes(q)) return true;
        }

        if (o.email_1_content && o.email_1_content.toLowerCase().includes(q)) return true;
        if (o.email_2_content && o.email_2_content.toLowerCase().includes(q)) return true;

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
    let totalEmailsSent = 0;
    let totalCustomerReplies = 0;
    let totalBotReplies = 0;

    emailRecords.forEach(o => {
        if (o.email_1_ts || o.email_1_content) totalEmailsSent++;
        if (o.email_2_ts || o.email_2_content) totalEmailsSent++;

        for (let i = 1; i <= 5; i++) {
            if ((o as any)[`email_reply${i}`]) totalCustomerReplies++;
            if ((o as any)[`email_bot_reply${i}`]) {
                totalBotReplies++;
                totalEmailsSent++;
            }
        }
    });

    const formatDateTime = (d: string | null) => {
        if (!d) return '—';
        return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const channelVariant = (ch: string | null): 'info' | 'success' | 'purple' | 'neutral' => {
        switch (ch?.toLowerCase()) {
            case 'email': return 'info';
            case 'whatsapp': return 'success';
            case 'voice': return 'purple';
            default: return 'neutral';
        }
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--label-primary)]">Email Outreach & Thread Log</h1>
                    <p className="text-[var(--label-secondary)]">Email CRM — tracking email content, customer replies & bot responses across {emailRecords.length} parties</p>
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
                            onClick={() => handleChannelFilterChange("email")}
                            className={`px-3 py-1.5 rounded-lg transition-all font-medium ${channelFilter === "email" ? "bg-blue-600 text-white shadow-sm" : "text-[var(--label-secondary)] hover:text-[var(--label-primary)]"}`}
                        >
                            Email Channel
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
                            placeholder="Search party, email, content..."
                            value={search}
                            onChange={e => handleSearchChange(e.target.value)}
                            className="pl-10 pr-4 py-2 w-[260px] sm:w-[300px] rounded-xl bg-[var(--glass-fill)] border border-[var(--separator)] text-sm text-[var(--label-primary)] placeholder:text-[var(--label-tertiary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MiniCard title="Parties Contacted" value={emailRecords.length} icon={<Mail className="h-5 w-5 text-blue-600" />} />
                <MiniCard title="Emails Dispatched" value={totalEmailsSent} icon={<Send className="h-5 w-5 text-indigo-600" />} />
                <MiniCard title="Customer Replies" value={totalCustomerReplies} icon={<UserCheck className="h-5 w-5 text-emerald-600" />} />
                <MiniCard title="Bot Email Replies" value={totalBotReplies} icon={<Bot className="h-5 w-5 text-purple-600" />} />
            </div>

            {/* Main Email CRM Data Table */}
            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--separator)] bg-[var(--fill-quaternary)]">
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <ColumnInfo label="Party & Email" description="Customer name, contact person & email address" />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <ColumnInfo label="Response Channel" description="Primary response channel detected for this lead" />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <ColumnInfo label="Campaign Content" description="Outreach email content (email_1_content & email_2_content)" />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <ColumnInfo label="Customer Replies" description="Direct email replies from customer (email_reply1..5)" />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <ColumnInfo label="Bot Email Replies" description="Automated bot email responses (email_bot_reply1..5)" />
                                    </th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--separator)]">
                                {paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-[var(--label-tertiary)]">
                                            No email records matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map(o => (
                                        <EmailRow
                                            key={o.id}
                                            record={o}
                                            isExpanded={expandedId === o.id}
                                            onToggle={() => setExpandedId(expandedId === o.id ? null : o.id)}
                                            formatDateTime={formatDateTime}
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

function EmailRow({
    record: o,
    isExpanded,
    onToggle,
    formatDateTime,
    channelVariant,
}: {
    record: CRROutreach;
    isExpanded: boolean;
    onToggle: () => void;
    formatDateTime: (d: string | null) => string;
    channelVariant: (ch: string | null) => 'info' | 'success' | 'purple' | 'neutral';
}) {
    // Collect customer email replies (email_reply1..5)
    const customerReplies: { step: number; text: string }[] = [];
    for (let i = 1; i <= 5; i++) {
        const text = (o as any)[`email_reply${i}`];
        if (text) customerReplies.push({ step: i, text });
    }

    // Collect bot email replies (email_bot_reply1..5)
    const botReplies: { step: number; text: string }[] = [];
    for (let i = 1; i <= 5; i++) {
        const text = (o as any)[`email_bot_reply${i}`];
        if (text) botReplies.push({ step: i, text });
    }

    const latestCustomerReply = customerReplies.length > 0 ? customerReplies[customerReplies.length - 1] : null;
    const latestBotReply = botReplies.length > 0 ? botReplies[botReplies.length - 1] : null;

    return (
        <>
            <tr className="hover:bg-[var(--fill-quaternary)] transition-colors cursor-pointer" onClick={onToggle}>
                {/* Party & Email */}
                <td className="px-4 py-3.5">
                    <div className="space-y-0.5">
                        <span className="text-sm font-semibold text-[var(--label-primary)] block">{o.party_name}</span>
                        {o.contact_person && (
                            <span className="text-xs text-[var(--label-secondary)] block font-normal">{o.contact_person}</span>
                        )}
                        <span className="text-[11px] text-blue-600 dark:text-blue-400 font-mono block">{o.email || '—'}</span>
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

                {/* Campaign Email Content Column */}
                <td className="px-4 py-3.5">
                    <div className="space-y-1 max-w-[220px]">
                        <div className="flex flex-wrap gap-1">
                            {o.email_1_content && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20 whitespace-nowrap">
                                    Email 1
                                </span>
                            )}
                            {o.email_2_content && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-600 border border-purple-500/20 whitespace-nowrap">
                                    Email 2
                                </span>
                            )}
                        </div>
                        {o.email_1_content ? (
                            <p className="text-[11px] text-[var(--label-secondary)] truncate font-normal" title={o.email_1_content}>
                                {o.email_1_content}
                            </p>
                        ) : o.email_2_content ? (
                            <p className="text-[11px] text-[var(--label-secondary)] truncate font-normal" title={o.email_2_content}>
                                {o.email_2_content}
                            </p>
                        ) : (
                            <span className="text-xs text-[var(--label-tertiary)] italic">—</span>
                        )}
                    </div>
                </td>

                {/* Customer Replies Column */}
                <td className="px-4 py-3.5">
                    {customerReplies.length === 0 ? (
                        <span className="text-xs text-[var(--label-tertiary)] italic">—</span>
                    ) : (
                        <div className="space-y-1 max-w-[220px]">
                            <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/25">
                                    {customerReplies.length} {customerReplies.length === 1 ? 'Reply' : 'Replies'}
                                </span>
                            </div>
                            {latestCustomerReply && (
                                <p className="text-[11px] text-[var(--label-primary)] truncate font-normal" title={latestCustomerReply.text}>
                                    <span className="font-semibold text-emerald-600">#{latestCustomerReply.step}:</span> {latestCustomerReply.text}
                                </p>
                            )}
                        </div>
                    )}
                </td>

                {/* Bot Email Replies Column */}
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
                            {latestBotReply && (
                                <p className="text-[11px] text-[var(--label-secondary)] truncate font-normal" title={latestBotReply.text}>
                                    <span className="font-semibold text-purple-600">#{latestBotReply.step}:</span> {latestBotReply.text}
                                </p>
                            )}
                        </div>
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

            {/* Expanded Email Interactive Thread Window */}
            {isExpanded && (
                <tr>
                    <td colSpan={6} className="px-6 py-5 bg-[var(--fill-quaternary)]">
                        <EmailThreadWindow record={o} formatDateTime={formatDateTime} channelVariant={channelVariant} />
                    </td>
                </tr>
            )}
        </>
    );
}

function EmailThreadWindow({
    record: o,
    formatDateTime,
    channelVariant,
}: {
    record: CRROutreach;
    formatDateTime: (d: string | null) => string;
    channelVariant: (ch: string | null) => 'info' | 'success' | 'purple' | 'neutral';
}) {
    interface EmailItem {
        id: string;
        sender: 'user' | 'bot' | 'system';
        senderName: string;
        recipient: string;
        text: string;
        timestamp?: string | null;
        badge: string;
    }

    const emailItems: EmailItem[] = [];

    // 1. Outgoing Campaign Email 1 (email_1_content)
    if (o.email_1_content || o.email_1_ts) {
        emailItems.push({
            id: 'email-1-content',
            sender: 'system',
            senderName: 'Z V STEELS (Campaign System)',
            recipient: o.email ? `${o.party_name} <${o.email}>` : o.party_name,
            text: o.email_1_content || 'Initial reorder campaign email content dispatched',
            timestamp: o.email_1_ts || o.outreach_start_date,
            badge: 'Email 1 Campaign Content',
        });
    }

    // 2. Interleaved Customer Replies (email_reply1..5) & Bot Replies (email_bot_reply1..5)
    for (let i = 1; i <= 5; i++) {
        const customerReply = (o as any)[`email_reply${i}`];
        const botReply = (o as any)[`email_bot_reply${i}`];

        if (customerReply) {
            emailItems.push({
                id: `customer-email-reply-${i}`,
                sender: 'user',
                senderName: o.contact_person ? `${o.contact_person.trim()} (${o.party_name})` : o.party_name,
                recipient: 'Z V STEELS <outreach@zvsteels.com>',
                text: customerReply,
                badge: `Customer Reply #${i}`,
            });
        }

        if (botReply) {
            emailItems.push({
                id: `bot-email-reply-${i}`,
                sender: 'bot',
                senderName: 'ZV Assistant Bot',
                recipient: o.email ? `${o.party_name} <${o.email}>` : o.party_name,
                text: botReply,
                badge: `Bot Email Reply #${i}`,
            });
        }
    }

    // 3. Outgoing Campaign Email 2 (email_2_content)
    if (o.email_2_content || o.email_2_ts) {
        emailItems.push({
            id: 'email-2-content',
            sender: 'system',
            senderName: 'Z V STEELS (Campaign System)',
            recipient: o.email ? `${o.party_name} <${o.email}>` : o.party_name,
            text: o.email_2_content || 'Follow-up campaign email content dispatched',
            timestamp: o.email_2_ts,
            badge: 'Email 2 Campaign Content',
        });
    }

    return (
        <div className="rounded-2xl border border-[var(--separator)] bg-[var(--glass-fill)] overflow-hidden shadow-lg max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-[var(--fill-quaternary)] px-5 py-3.5 border-b border-[var(--separator)] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                        <Mail className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-[var(--label-primary)]">{o.party_name}</h3>
                            {o.contact_person && (
                                <span className="text-xs text-[var(--label-secondary)]">({o.contact_person.trim()})</span>
                            )}
                        </div>
                        <p className="text-[11px] text-[var(--label-tertiary)] flex items-center gap-2">
                            <span>Email: {o.email || 'No email specified'}</span>
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
                    <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 font-semibold">
                        {emailItems.length} Email Logs
                    </span>
                </div>
            </div>

            {/* Conversation Timeline Body */}
            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto bg-[var(--glass-fill)]/50">
                {/* System Banner */}
                <div className="flex justify-center my-1">
                    <span className="text-[10px] font-bold text-[var(--label-tertiary)] uppercase tracking-wider bg-[var(--fill-quaternary)] px-3 py-1 rounded-full border border-[var(--separator)]">
                        Campaign Initiated {formatDateTime(o.email_1_ts || o.outreach_start_date || o.created_at)}
                    </span>
                </div>

                {emailItems.length === 0 ? (
                    <div className="text-center py-8 text-xs text-[var(--label-tertiary)] italic">
                        No email history logged for this party.
                    </div>
                ) : (
                    emailItems.map((item) => {
                        const isUser = item.sender === 'user';
                        const isBot = item.sender === 'bot';
                        const isSystem = item.sender === 'system';

                        return (
                            <div key={item.id} className="w-full">
                                <div
                                    className={`rounded-xl p-4 border shadow-sm space-y-2 transition-all ${
                                        isUser
                                            ? 'bg-emerald-500/10 border-emerald-500/25 ml-4 sm:ml-8'
                                            : isSystem
                                            ? 'bg-purple-500/10 border-purple-500/20 mr-4 sm:mr-8'
                                            : 'bg-blue-500/10 border-blue-500/25 mr-4 sm:mr-8'
                                    }`}
                                >
                                    {/* Email Header line inside card */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--separator)]/40">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-bold ${
                                                    isUser ? 'text-emerald-600 dark:text-emerald-400' :
                                                    isSystem ? 'text-purple-600 dark:text-purple-400' :
                                                    'text-blue-600 dark:text-blue-400'
                                                }`}>
                                                    {item.senderName}
                                                </span>
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--fill-quaternary)] text-[var(--label-secondary)]">
                                                    {item.badge}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-[var(--label-tertiary)]">To: {item.recipient}</p>
                                        </div>
                                        {item.timestamp && (
                                            <span className="text-[10px] text-[var(--label-tertiary)] font-mono">
                                                {formatDateTime(item.timestamp)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="text-xs leading-relaxed text-[var(--label-primary)] whitespace-pre-wrap font-sans p-1">
                                        {item.text}
                                    </div>
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
