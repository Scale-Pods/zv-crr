"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Search, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { ColumnInfo, ConfidenceBadge, TierBadge, TrendIndicator, StatusBadge } from "@/components/crr/ui-atoms";
import type { CRRPrediction } from "@/lib/crr-data";

const columnDescriptions: Record<string, string> = {
    party_name: "Name of the customer/party in the system",
    alert_type: "Outreach class: reactivation (dormant/overdue), reminder (due in ≤ 14 days), restock (rising trend + Tier A/B), liquidation (declining trend), or monitor (normal cycle)",
    tier: "Volume tier based on cumulative ordered quantity: A (>3000 MT), B (1000–3000 MT), C (200–999 MT), or D (<200 MT)",
    trend: "Order volume trend: strongly_rising (>1.2x), rising (1.05x-1.2x), stable, falling, strongly_falling (<0.8x), or volatile (>60% std dev of last 6 orders)",
    last_order_month: "The calendar month of the customer's most recent non-zero MT order",
    predicted_next_order_date: "AI-predicted next order date. Standard: last order + avg_gap + trend shift. Overdue: today + half of avg_gap. Date is strictly in the future.",
    predicted_order_qty_mt: "Predicted next order quantity in metric tonnes (MT), calculated using trend-adjusted average size of past orders.",
    confidence: "AI confidence (High, Medium, Low). Determined by order recency, data volume, and volatility.",
};

type SortKey = keyof CRRPrediction;

export function PredictionsClient({ predictions }: { predictions: CRRPrediction[] }) {
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("predicted_next_order_date");
    const [sortAsc, setSortAsc] = useState(true);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const filtered = predictions.filter(p => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            p.party_name.toLowerCase().includes(q) ||
            (p.tier || '').toLowerCase().includes(q) ||
            (p.alert_type || '').toLowerCase().includes(q) ||
            (p.confidence || '').toLowerCase().includes(q) ||
            (p.product_lines || '').toLowerCase().includes(q)
        );
    });

    const sorted = [...filtered].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === 'string' && typeof bv === 'string') {
            return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
        }
        if (typeof av === 'number' && typeof bv === 'number') {
            return sortAsc ? av - bv : bv - av;
        }
        return 0;
    });

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortAsc(!sortAsc);
        else { setSortKey(key); setSortAsc(true); }
        setCurrentPage(1);
    };

    const handleSearchChange = (val: string) => {
        setSearch(val);
        setCurrentPage(1);
    };

    const itemsPerPage = 10;
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const activePage = Math.min(currentPage, Math.max(1, totalPages));
    const startIndex = (activePage - 1) * itemsPerPage;
    const paginated = sorted.slice(startIndex, startIndex + itemsPerPage);

    const SortHeader = ({ col, label }: { col: SortKey; label: string }) => (
        <button onClick={() => toggleSort(col)} className="flex items-center gap-1 hover:text-[var(--label-primary)] transition-colors group whitespace-nowrap">
            <ColumnInfo label={label} description={columnDescriptions[col] || label} />
            <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </button>
    );

    const alertVariant = (t: string | null): 'info' | 'danger' | 'purple' | 'success' => {
        switch (t?.toLowerCase()) {
            case 'at_risk': return 'danger';
            case 'upsell': return 'purple';
            case 'reorder': return 'info';
            default: return 'success';
        }
    };

    const formatDate = (d: string | null) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--label-primary)]">Predictions</h1>
                    <p className="text-[var(--label-secondary)]">AI-powered order predictions for all parties — {predictions.length} total</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--label-tertiary)]" />
                    <input
                        type="text"
                        placeholder="Search by name, tier, alert..."
                        value={search}
                        onChange={e => handleSearchChange(e.target.value)}
                        className="pl-10 pr-4 py-2.5 w-[300px] rounded-xl bg-[var(--glass-fill)] border border-[var(--separator)] text-sm text-[var(--label-primary)] placeholder:text-[var(--label-tertiary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                    />
                </div>
            </div>

            <Card className="border-[var(--separator)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)] bg-[var(--glass-fill)] overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--separator)] bg-[var(--fill-quaternary)]">
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <SortHeader col="party_name" label="Party" />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <SortHeader col="alert_type" label="Alert" />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <SortHeader col="tier" label="Tier" />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <SortHeader col="trend" label="Trend" />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <SortHeader col="last_order_month" label="Last Order" />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <SortHeader col="predicted_next_order_date" label="Predicted Date" />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <SortHeader col="predicted_order_qty_mt" label="Qty (MT)" />
                                    </th>
                                    <th className="text-left px-4 py-3 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider whitespace-nowrap">
                                        <SortHeader col="confidence" label="Confidence" />
                                    </th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--separator)]">
                                {paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center py-12 text-[var(--label-tertiary)]">
                                            {search ? 'No predictions match your search' : 'No predictions found'}
                                        </td>
                                    </tr>
                                ) : paginated.map(p => (
                                    <PredictionRow
                                        key={p.id}
                                        prediction={p}
                                        isExpanded={expandedId === p.id}
                                        onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)}
                                        alertVariant={alertVariant}
                                        formatDate={formatDate}
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

function PredictionRow({ prediction: p, isExpanded, onToggle, alertVariant, formatDate }: {
    prediction: CRRPrediction;
    isExpanded: boolean;
    onToggle: () => void;
    alertVariant: (t: string | null) => 'info' | 'danger' | 'purple' | 'success';
    formatDate: (d: string | null) => string;
}) {
    return (
        <>
            <tr className="hover:bg-[var(--fill-quaternary)] transition-colors cursor-pointer" onClick={onToggle}>
                <td className="px-4 py-3.5">
                    <span className="text-sm font-semibold text-[var(--label-primary)]">{p.party_name}</span>
                </td>
                <td className="px-4 py-3.5">
                    {p.alert_type ? <StatusBadge value={p.alert_type} variant={alertVariant(p.alert_type)} /> : <span className="text-[var(--label-tertiary)]">—</span>}
                </td>
                <td className="px-4 py-3.5"><TierBadge value={p.tier} /></td>
                <td className="px-4 py-3.5"><TrendIndicator value={p.trend} /></td>
                <td className="px-4 py-3.5">
                    <span className="text-sm text-[var(--label-secondary)]">{p.last_order_month || '—'}</span>
                </td>
                <td className="px-4 py-3.5">
                    <span className="text-sm font-medium text-[var(--label-primary)]">{formatDate(p.predicted_next_order_date)}</span>
                </td>
                <td className="px-4 py-3.5">
                    <span className="text-sm font-bold text-[var(--label-primary)]">
                        {p.predicted_order_qty_mt != null ? `${p.predicted_order_qty_mt} MT` : '—'}
                    </span>
                </td>
                <td className="px-4 py-3.5"><ConfidenceBadge value={p.confidence} /></td>
                <td className="px-4 py-3.5 text-center">
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-[var(--label-tertiary)]" /> : <ChevronDown className="h-4 w-4 text-[var(--label-tertiary)]" />}
                </td>
            </tr>
            {isExpanded && (
                <tr>
                    <td colSpan={9} className="px-6 py-5 bg-[var(--fill-quaternary)]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-xs font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-2">AI Reasoning</h4>
                                <p className="text-sm text-[var(--label-primary)] leading-relaxed bg-[var(--glass-fill)] rounded-lg p-4 border border-[var(--separator)]">
                                    {p.reasoning || 'No reasoning available'}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-[var(--label-secondary)] uppercase tracking-wider mb-2">Recommended Action</h4>
                                <p className="text-sm text-[var(--label-primary)] leading-relaxed bg-[var(--glass-fill)] rounded-lg p-4 border border-[var(--separator)]">
                                    {p.action_message || 'No action message'}
                                </p>
                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    <InfoBlock label="Cadence" value={p.cadence || '—'} />
                                    <InfoBlock label="Avg Monthly" value={p.avg_monthly_order_mt != null ? `${p.avg_monthly_order_mt} MT` : '—'} />
                                    <InfoBlock label="Last Order Qty" value={p.last_order_qty_mt != null ? `${p.last_order_qty_mt} MT` : '—'} />
                                    <InfoBlock label="Product Lines" value={p.product_lines || '—'} />
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-[var(--glass-fill)] rounded-lg p-3 border border-[var(--separator)]">
            <p className="text-[10px] font-bold text-[var(--label-tertiary)] uppercase tracking-wider">{label}</p>
            <p className="text-sm font-semibold text-[var(--label-primary)] mt-0.5">{value}</p>
        </div>
    );
}
