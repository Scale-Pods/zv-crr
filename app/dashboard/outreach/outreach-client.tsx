"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Search, ChevronDown, ChevronUp, ArrowUpDown, Phone, Mail, MessageCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import { ColumnInfo, StatusBadge, StepProgress } from "@/components/crr/ui-atoms";
import type { CRROutreach } from "@/lib/crr-data";

const columnDescriptions: Record<string, string> = {
    party_name: "Customer/party name being contacted for reorder",
    contact_person: "Contact person at the customer's organization",
    phone: "Phone number used for voice and WhatsApp outreach",
    outreach_status: "Current status — Active (in progress), Completed (all steps done), or Stopped",
    current_step: "Current step in the outreach sequence (0-9). Shows overall progress through voice, email, and WhatsApp touchpoints",
    responded: "Whether the customer has responded through any channel",
    last_contacted: "Timestamp of the most recent outreach attempt",
    predicted_order_date: "AI-predicted next order date. Standard: last order + avg_gap + trend shift. Overdue: today + half of avg_gap. Date is strictly in the future.",
};

type FilterStatus = 'all' | 'active' | 'completed' | 'stopped';
type FilterResponded = 'all' | 'yes' | 'no';

export function OutreachClient({ outreach }: { outreach: CRROutreach[] }) {
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [filterResponded, setFilterResponded] = useState<FilterResponded>('all');
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const filtered = outreach.filter(o => {
        if (filterStatus !== 'all') {
            const status = (o.outreach_status || '').toLowerCase();
            if (filterStatus === 'stopped' && !o.stop_outreach && status !== 'stopped') return false;
            if (filterStatus !== 'stopped' && status !== filterStatus) return false;
        }
        if (filterResponded === 'yes' && !o.responded) return false;
        if (filterResponded === 'no' && o.responded) return false;

        if (!search) return true;
        const q = search.toLowerCase();
        return (
            o.party_name.toLowerCase().includes(q) ||
            (o.contact_person || '').toLowerCase().includes(q) ||
            (o.phone || '').toLowerCase().includes(q) ||
            (o.email || '').toLowerCase().includes(q)
        );
    });

    const handleSearchChange = (val: string) => {
        setSearch(val);
        setCurrentPage(1);
    };

    const handleStatusFilterChange = (val: FilterStatus) => {
        setFilterStatus(val);
        setCurrentPage(1);
    };

    const handleRespondedFilterChange = (val: FilterResponded) => {
        setFilterResponded(val);
        setCurrentPage(1);
    };

    const itemsPerPage = 10;
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const activePage = Math.min(currentPage, Math.max(1, totalPages));
    const startIndex = (activePage - 1) * itemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

    const formatDate = (d: string | null) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatDateTime = (d: string | null) => {
        if (!d) return '—';
        return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const statusVariant = (s: string | null, stopped?: boolean | null): 'success' | 'danger' | 'info' | 'neutral' => {
        if (stopped) return 'danger';
        switch (s?.toLowerCase()) {
            case 'active': return 'success';
            case 'completed': return 'info';
            case 'stopped': return 'danger';
            default: return 'neutral';
        }
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--label-primary)]">Outreach</h1>
                    <p className="text-[var(--label-secondary)]">Multi-channel outreach tracking — {outreach.length} parties</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filterStatus}
                        onChange={e => handleStatusFilterChange(e.target.value as FilterStatus)}
                        className="px-3 py-2.5 rounded-xl bg-[var(--glass-fill)] border border-[var(--separator)] text-sm text-[var(--label-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="stopped">Stopped</option>
                    </select>
                    <select
                        value={filterResponded}
                        onChange={e => handleRespondedFilterChange(e.target.value as FilterResponded)}
                        className="px-3 py-2.5 rounded-xl bg-[var(--glass-fill)] border border-[var(--separator)] text-sm text-[var(--label-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                        <option value="all">All Responses</option>
                        <option value="yes">Responded</option>
                        <option value="no">Not Responded</option>
                    </select>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--label-tertiary)]" />
                        <input
                            type="text"
                            placeholder="Search name, phone, email..."
                            value={search}
                            onChange={e => handleSearchChange(e.target.value)}
                            className="pl-10 pr-4 py-2.5 w-[260px] rounded-xl bg-[var(--glass-fill)] border border-[var(--separator)] text-sm text-[var(--label-primary)] placeholder:text-[var(--label-tertiary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                        />
                    </div>
                </div>
            </div>

            <Card className="border-[var(--separator)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)] bg-[var(--glass-fill)] overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--separator)] bg-[var(--fill-quaternary)]">
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <ColumnInfo label="Party" description={columnDescriptions.party_name} />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <ColumnInfo label="Contact" description={columnDescriptions.contact_person} />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <ColumnInfo label="Predicted Date" description={columnDescriptions.predicted_order_date} />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <ColumnInfo label="Status" description={columnDescriptions.outreach_status} />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider min-w-[140px] whitespace-nowrap">
                                        <ColumnInfo label="Progress" description={columnDescriptions.current_step} />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <ColumnInfo label="Responded" description={columnDescriptions.responded} />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <ColumnInfo label="Last Contact" description={columnDescriptions.last_contacted} />
                                    </th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--separator)]">
                                {paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-12 text-[var(--label-tertiary)]">
                                            {search || filterStatus !== 'all' || filterResponded !== 'all' ? 'No outreach records match your filters' : 'No outreach records found'}
                                        </td>
                                    </tr>
                                ) : paginated.map(o => (
                                    <OutreachRow
                                        key={o.id}
                                        record={o}
                                        isExpanded={expandedId === o.id}
                                        onToggle={() => setExpandedId(expandedId === o.id ? null : o.id)}
                                        formatDate={formatDate}
                                        formatDateTime={formatDateTime}
                                        statusVariant={statusVariant}
                                    />
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

function OutreachRow({ record: o, isExpanded, onToggle, formatDate, formatDateTime, statusVariant }: {
    record: CRROutreach;
    isExpanded: boolean;
    onToggle: () => void;
    formatDate: (d: string | null) => string;
    formatDateTime: (d: string | null) => string;
    statusVariant: (s: string | null, stopped?: boolean | null) => 'success' | 'danger' | 'info' | 'neutral';
}) {
    return (
        <>
            <tr className="hover:bg-[var(--fill-quaternary)] transition-colors cursor-pointer" onClick={onToggle}>
                <td className="px-4 py-3.5">
                    <span className="text-sm font-semibold text-[var(--label-primary)]">{o.party_name}</span>
                </td>
                <td className="px-4 py-3.5">
                    <span className="text-sm text-[var(--label-secondary)]">{o.contact_person || '—'}</span>
                </td>
                <td className="px-4 py-3.5">
                    <span className="text-sm font-medium text-[var(--label-primary)]">{formatDate(o.predicted_order_date)}</span>
                </td>
                <td className="px-4 py-3.5">
                    <StatusBadge value={o.stop_outreach ? 'Stopped' : (o.outreach_status || '—')} variant={statusVariant(o.outreach_status, o.stop_outreach)} />
                </td>
                <td className="px-4 py-3.5">
                    <StepProgress current={o.current_step ?? 0} />
                </td>
                <td className="px-4 py-3.5">
                    {o.responded ? (
                        <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                            <CheckCircle className="h-4 w-4" /> Yes
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 text-[var(--label-tertiary)] text-xs">
                            <XCircle className="h-4 w-4" /> No
                        </span>
                    )}
                </td>
                <td className="px-4 py-3.5">
                    <span className="text-xs text-[var(--label-secondary)]">{formatDateTime(o.last_contacted)}</span>
                </td>
                <td className="px-4 py-3.5 text-center">
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-[var(--label-tertiary)]" /> : <ChevronDown className="h-4 w-4 text-[var(--label-tertiary)]" />}
                </td>
            </tr>
            {isExpanded && (
                <tr>
                    <td colSpan={8} className="px-6 py-5 bg-[var(--fill-quaternary)]">
                        <div className="space-y-6">
                            {/* Contact Info */}
                            <div className="flex flex-wrap gap-4">
                                {o.phone && (
                                    <div className="flex items-center gap-2 bg-[var(--glass-fill)] rounded-lg px-3 py-2 border border-[var(--separator)]">
                                        <Phone className="h-3.5 w-3.5 text-purple-500" />
                                        <span className="text-sm text-[var(--label-primary)]">{o.phone}</span>
                                    </div>
                                )}
                                {o.email && (
                                    <div className="flex items-center gap-2 bg-[var(--glass-fill)] rounded-lg px-3 py-2 border border-[var(--separator)]">
                                        <Mail className="h-3.5 w-3.5 text-blue-500" />
                                        <span className="text-sm text-[var(--label-primary)]">{o.email}</span>
                                    </div>
                                )}
                                {o.response_message && (
                                    <div className="flex items-center gap-2 bg-emerald-500/10 rounded-lg px-3 py-2 border border-emerald-200">
                                        <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                                        <span className="text-sm text-emerald-700">{o.response_message}</span>
                                    </div>
                                )}
                            </div>

                            {/* Channel Timeline */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Voice */}
                                <ChannelTimeline
                                    title="Voice Calls"
                                    icon={<Phone className="h-4 w-4 text-purple-500" />}
                                    color="purple"
                                    steps={[
                                        { label: 'Call 1', ts: o.voice_1_ts, status: o.voice_1_status, detail: o.voice_1_note, sentiment: o.voice_1_sentiment },
                                        { label: 'Call 2', ts: o.voice_2_ts, status: o.voice_2_status, detail: o.voice_2_note, sentiment: o.voice_2_sentiment },
                                        { label: 'Call 3', ts: o.voice_3_ts, status: o.voice_3_status, detail: o.voice_3_note, sentiment: o.voice_3_sentiment },
                                    ]}
                                    formatDateTime={formatDateTime}
                                />

                                {/* Email */}
                                <ChannelTimeline
                                    title="Emails"
                                    icon={<Mail className="h-4 w-4 text-blue-500" />}
                                    color="blue"
                                    steps={[
                                        { label: 'Email 1', ts: o.email_1_ts, detail: o.email_1_content, replyTs: o.email_1_replied_ts },
                                        { label: 'Email 2', ts: o.email_2_ts, detail: o.email_2_content, replyTs: o.email_2_replied_ts },
                                    ]}
                                    formatDateTime={formatDateTime}
                                />

                                {/* WhatsApp */}
                                <ChannelTimeline
                                    title="WhatsApp"
                                    icon={<MessageCircle className="h-4 w-4 text-emerald-500" />}
                                    color="emerald"
                                    steps={[
                                        { label: 'Message 1', ts: o.whatsapp_1_ts, status: o.whatsapp_1_status, detail: o.whatsapp_1_template },
                                        { label: 'Message 2', ts: o.whatsapp_2_ts, status: o.whatsapp_2_status, detail: o.whatsapp_2_template },
                                        { label: 'Message 3', ts: o.whatsapp_3_ts, status: o.whatsapp_3_status, detail: o.whatsapp_3_template },
                                        { label: 'Message 4', ts: o.whatsapp_4_ts, status: o.whatsapp_4_status, detail: o.whatsapp_4_template },
                                    ]}
                                    formatDateTime={formatDateTime}
                                />
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

interface TimelineStep {
    label: string;
    ts: string | null;
    status?: string | null;
    detail?: string | null;
    sentiment?: string | null;
    replyTs?: string | null;
}

function ChannelTimeline({ title, icon, color, steps, formatDateTime }: {
    title: string;
    icon: React.ReactNode;
    color: string;
    steps: TimelineStep[];
    formatDateTime: (d: string | null) => string;
}) {
    return (
        <div className="bg-[var(--glass-fill)] rounded-xl border border-[var(--separator)] p-4">
            <div className="flex items-center gap-2 mb-3">
                {icon}
                <h4 className="text-xs font-bold text-[var(--label-secondary)] uppercase tracking-wider">{title}</h4>
            </div>
            <div className="space-y-2.5">
                {steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${step.ts ? `bg-${color}-500` : 'bg-[var(--fill-quaternary)]'}`} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-[var(--label-primary)]">{step.label}</span>
                                {step.ts ? (
                                    <span className="text-[10px] text-[var(--label-tertiary)]">{formatDateTime(step.ts)}</span>
                                ) : (
                                    <span className="text-[10px] text-[var(--label-tertiary)] italic">Pending</span>
                                )}
                            </div>
                            {step.status && (
                                <span className="text-[10px] font-medium text-[var(--label-secondary)]">{step.status}</span>
                            )}
                            {step.sentiment && (
                                <span className={`text-[10px] font-bold ml-2 ${step.sentiment.toLowerCase() === 'positive' ? 'text-emerald-600' :
                                    step.sentiment.toLowerCase() === 'negative' ? 'text-rose-600' : 'text-amber-600'
                                    }`}>
                                    {step.sentiment}
                                </span>
                            )}
                            {step.replyTs && (
                                <div className="text-[10px] text-emerald-600 font-medium">↩ Replied {formatDateTime(step.replyTs)}</div>
                            )}
                            {step.detail && (
                                <p className="text-[11px] text-[var(--label-tertiary)] mt-0.5 truncate">{step.detail}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
