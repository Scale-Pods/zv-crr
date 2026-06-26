"use client";

import { Bell, TrendingUp, AlertTriangle, Package } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface PredictionAlert {
    party_name: string;
    predicted_next_order_date: string | null;
    predicted_order_qty_mt: number | null;
    tier: string | null;
    confidence: string | null;
    alert_type: string | null;
}

export function NotificationBell({ alerts }: { alerts: PredictionAlert[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const count = alerts.length;

    const getAlertIcon = (alertType: string | null) => {
        switch (alertType?.toLowerCase()) {
            case 'at_risk': return <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />;
            case 'upsell': return <TrendingUp className="h-3.5 w-3.5 text-purple-500" />;
            default: return <Package className="h-3.5 w-3.5 text-blue-500" />;
        }
    };

    const formatDate = (d: string | null) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const getDaysUntil = (d: string | null) => {
        if (!d) return null;
        const diff = Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 rounded-xl bg-[var(--glass-fill)] border border-[var(--separator)] hover:bg-[var(--glass-fill-hover)] transition-all duration-200 shadow-[var(--glass-shadow)]"
            >
                <Bell className="h-4.5 w-4.5 text-[var(--label-secondary)]" />
                {count > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold px-1.5 shadow-lg animate-pulse">
                        {count}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-[380px] max-h-[420px] overflow-y-auto bg-[var(--glass-fill)] backdrop-blur-[48px] border border-[var(--separator)] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.16)] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="sticky top-0 bg-[var(--glass-fill)] backdrop-blur-[48px] px-5 py-4 border-b border-[var(--separator)]">
                        <h3 className="text-sm font-bold text-[var(--label-primary)] flex items-center gap-2">
                            <Bell className="h-4 w-4 text-amber-500" />
                            Upcoming Order Predictions
                            <span className="ml-auto text-[10px] font-semibold text-[var(--label-tertiary)] uppercase tracking-wider">Next 7 Days</span>
                        </h3>
                    </div>

                    {count === 0 ? (
                        <div className="px-5 py-8 text-center text-sm text-[var(--label-tertiary)]">
                            No upcoming predictions in the next 7 days
                        </div>
                    ) : (
                        <div className="divide-y divide-[var(--separator)]">
                            {alerts.map((a, i) => {
                                const daysUntil = getDaysUntil(a.predicted_next_order_date);
                                return (
                                    <div key={i} className="px-5 py-3.5 hover:bg-[var(--fill-quaternary)] transition-colors">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 p-1.5 rounded-lg bg-[var(--fill-quaternary)]">
                                                {getAlertIcon(a.alert_type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-[var(--label-primary)] truncate">
                                                    {a.party_name}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-[var(--label-secondary)]">
                                                        {formatDate(a.predicted_next_order_date)}
                                                    </span>
                                                    {daysUntil !== null && (
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${daysUntil <= 2
                                                            ? 'bg-rose-500/10 text-rose-600'
                                                            : daysUntil <= 5
                                                                ? 'bg-amber-500/10 text-amber-600'
                                                                : 'bg-blue-500/10 text-blue-600'
                                                            }`}>
                                                            {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d`}
                                                        </span>
                                                    )}
                                                    {a.predicted_order_qty_mt && (
                                                        <span className="text-[10px] font-medium text-[var(--label-tertiary)] bg-[var(--fill-quaternary)] px-1.5 py-0.5 rounded-full">
                                                            ~{a.predicted_order_qty_mt} MT
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {a.tier && (
                                                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${a.tier.toLowerCase() === 'gold'
                                                    ? 'bg-amber-500/10 text-amber-600'
                                                    : a.tier.toLowerCase() === 'silver'
                                                        ? 'bg-slate-400/10 text-slate-500'
                                                        : a.tier.toLowerCase() === 'platinum'
                                                            ? 'bg-purple-500/10 text-purple-600'
                                                            : 'bg-orange-500/10 text-orange-600'
                                                    }`}>
                                                    {a.tier}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
