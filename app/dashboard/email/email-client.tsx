"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Search, ChevronDown, ChevronUp, Reply, Send } from "lucide-react";
import { ColumnInfo, StatusBadge } from "@/components/crr/ui-atoms";
import type { CRROutreach } from "@/lib/crr-data";

export function EmailClient({ outreach }: { outreach: CRROutreach[] }) {
    const [search, setSearch] = useState("");
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const emailRecords = outreach.filter(o => o.email_1_ts || o.email_2_ts);

    const filtered = emailRecords.filter(o => {
        if (!search) return true;
        const q = search.toLowerCase();
        return o.party_name.toLowerCase().includes(q) || (o.email || '').toLowerCase().includes(q) || (o.contact_person || '').toLowerCase().includes(q);
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
    let totalSent = 0, totalReplied = 0;
    emailRecords.forEach(o => {
        if (o.email_1_ts) totalSent++;
        if (o.email_2_ts) totalSent++;
        if (o.email_1_replied_ts) totalReplied++;
        if (o.email_2_replied_ts) totalReplied++;
    });
    const replyRate = totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) : '0';

    const formatDateTime = (d: string | null) => {
        if (!d) return '—';
        return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--label-primary)]">Email Outreach</h1>
                    <p className="text-[var(--label-secondary)]">Email campaign tracking — {emailRecords.length} parties contacted</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--label-tertiary)]" />
                    <input type="text" placeholder="Search party, email..." value={search} onChange={e => handleSearchChange(e.target.value)}
                        className="pl-10 pr-4 py-2.5 w-[280px] rounded-xl bg-[var(--glass-fill)] border border-[var(--separator)] text-sm text-[var(--label-primary)] placeholder:text-[var(--label-tertiary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MiniCard title="Emails Sent" value={totalSent} icon={<Send className="h-5 w-5 text-blue-600" />} />
                <MiniCard title="Replies Received" value={totalReplied} icon={<Reply className="h-5 w-5 text-emerald-600" />} />
                <MiniCard title="Reply Rate" value={`${replyRate}%`} icon={<Mail className="h-5 w-5 text-purple-600" />} isString />
                <MiniCard title="Parties Reached" value={emailRecords.length} icon={<Mail className="h-5 w-5 text-amber-600" />} />
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
                                        <ColumnInfo label="Email" description="Email address used for outreach" />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <ColumnInfo label="Email 1" description="First email sent — timestamp" />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <ColumnInfo label="Reply 1" description="Reply timestamp for first email" />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <ColumnInfo label="Email 2" description="Second email sent — timestamp" />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <ColumnInfo label="Reply 2" description="Reply timestamp for second email" />
                                    </th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--separator)]">
                                {paginated.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-12 text-[var(--label-tertiary)]">No email records found</td></tr>
                                ) : paginated.map(o => (
                                    <EmailRow key={o.id} record={o} isExpanded={expandedId === o.id} onToggle={() => setExpandedId(expandedId === o.id ? null : o.id)} formatDateTime={formatDateTime} />
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

function EmailRow({ record: o, isExpanded, onToggle, formatDateTime }: {
    record: CRROutreach; isExpanded: boolean; onToggle: () => void; formatDateTime: (d: string | null) => string;
}) {
    return (
        <>
            <tr className="hover:bg-[var(--fill-quaternary)] transition-colors cursor-pointer" onClick={onToggle}>
                <td className="px-4 py-3.5"><span className="text-sm font-semibold text-[var(--label-primary)]">{o.party_name}</span></td>
                <td className="px-4 py-3.5"><span className="text-sm text-[var(--label-secondary)]">{o.email || '—'}</span></td>
                <td className="px-4 py-3.5"><TsCell ts={o.email_1_ts} formatDateTime={formatDateTime} /></td>
                <td className="px-4 py-3.5"><ReplyCell ts={o.email_1_replied_ts} formatDateTime={formatDateTime} /></td>
                <td className="px-4 py-3.5"><TsCell ts={o.email_2_ts} formatDateTime={formatDateTime} /></td>
                <td className="px-4 py-3.5"><ReplyCell ts={o.email_2_replied_ts} formatDateTime={formatDateTime} /></td>
                <td className="px-4 py-3.5 text-center">
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-[var(--label-tertiary)]" /> : <ChevronDown className="h-4 w-4 text-[var(--label-tertiary)]" />}
                </td>
            </tr>
            {isExpanded && (
                <tr>
                    <td colSpan={7} className="px-6 py-5 bg-[var(--fill-quaternary)]">
                        <EmailThreadWindow record={o} formatDateTime={formatDateTime} />
                    </td>
                </tr>
            )}
        </>
    );
}

function EmailThreadWindow({ record: o, formatDateTime }: {
    record: CRROutreach;
    formatDateTime: (d: string | null) => string;
}) {
    interface EmailItem {
        id: string;
        sender: 'bot' | 'user' | 'system';
        senderName: string;
        recipient: string;
        text: string;
        timestamp?: string | null;
        badge: string;
    }

    const emailItems: EmailItem[] = [];

    // 1. Initial Outgoing Email (First Template)
    if (o.email_1_content || o.email_1_ts) {
        emailItems.push({
            id: 'email-1-template',
            sender: 'bot',
            senderName: 'Z V STEELS (System)',
            recipient: o.email ? `${o.party_name} <${o.email}>` : o.party_name,
            text: o.email_1_content || 'Initial reorder reminder email template',
            timestamp: o.email_1_ts || o.outreach_start_date,
            badge: 'Initial Campaign Email',
        });
    }

    // 2. Interleaved Customer Replies & Bot Responses (Turns 1 through 5)
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
                senderName: 'Z V STEELS (Automated Bot)',
                recipient: o.email ? `${o.party_name} <${o.email}>` : o.party_name,
                text: botReply,
                badge: `Bot Reply #${i}`,
            });
        }
    }

    // 3. Subsequent Outgoing Emails (e.g. Email 2 / Invoice)
    if (o.email_2_content || o.email_2_ts) {
        emailItems.push({
            id: 'email-2-content',
            sender: 'system',
            senderName: 'Z V STEELS (System)',
            recipient: o.email ? `${o.party_name} <${o.email}>` : o.party_name,
            text: o.email_2_content || 'Email 2 content dispatched',
            timestamp: o.email_2_ts,
            badge: 'Follow-up / Invoice Email',
        });
    }

    return (
        <div className="rounded-2xl border border-[var(--separator)] bg-[var(--glass-fill)] overflow-hidden shadow-lg max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-[var(--fill-quaternary)] px-5 py-3.5 border-b border-[var(--separator)] flex items-center justify-between">
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
                        <p className="text-[11px] text-[var(--label-tertiary)] flex items-center gap-1.5">
                            <span>Email: {o.email || 'No email specified'}</span>
                            <span>•</span>
                            <span className="text-blue-600 font-medium">● Email Thread</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        {emailItems.length} Emails Logged
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
                                    {/* Email Card Header */}
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
                                            <span className="text-[10px] text-[var(--label-tertiary)]">
                                                {formatDateTime(item.timestamp)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Email Body Content */}
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

function TsCell({ ts, formatDateTime }: { ts: string | null; formatDateTime: (d: string | null) => string }) {
    if (!ts) return <span className="text-[var(--label-tertiary)] text-xs italic">—</span>;
    return <span className="text-[10px] text-[var(--label-secondary)]">{formatDateTime(ts)}</span>;
}

function ReplyCell({ ts, formatDateTime }: { ts: string | null; formatDateTime: (d: string | null) => string }) {
    if (!ts) return <span className="text-[var(--label-tertiary)] text-xs italic">—</span>;
    return (
        <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
            <Reply className="h-3 w-3" /> {formatDateTime(ts)}
        </span>
    );
}

function EmailContentBlock({ label, content, ts, replyTs, formatDateTime }: {
    label: string; content: string | null; ts: string | null; replyTs: string | null; formatDateTime: (d: string | null) => string;
}) {
    return (
        <div className="bg-[var(--glass-fill)] rounded-xl border border-[var(--separator)] p-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[var(--label-primary)]">{label}</span>
                <div className="flex items-center gap-2">
                    {ts && <span className="text-[10px] text-[var(--label-tertiary)]">Sent {formatDateTime(ts)}</span>}
                    {replyTs && <StatusBadge value="Replied" variant="success" />}
                </div>
            </div>
            {content ? (
                <p className="text-xs text-[var(--label-secondary)] leading-relaxed whitespace-pre-wrap max-h-[200px] overflow-y-auto">{content}</p>
            ) : (
                <p className="text-xs text-[var(--label-tertiary)] italic">{ts ? 'Content not stored' : 'Not sent yet'}</p>
            )}
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
