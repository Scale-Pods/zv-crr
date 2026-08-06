"use client";

import { Info } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

/** Column header with an info tooltip describing what the data means */
export function ColumnInfo({ label, description }: { label: string; description: string }) {
    return (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span>{label}</span>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-[var(--label-tertiary)] cursor-help hover:text-blue-500 transition-colors flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[220px] bg-slate-900 text-white border-none p-3 shadow-xl">
                        <p className="text-[11px] leading-relaxed">{description}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}

/** Status badge with contextual colors */
export function StatusBadge({ value, variant }: {
    value: string;
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
}) {
    const colorMap = {
        success: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
        warning: 'bg-amber-500/10 text-amber-600 border-amber-200',
        danger: 'bg-rose-500/10 text-rose-600 border-rose-200',
        info: 'bg-blue-500/10 text-blue-600 border-blue-200',
        neutral: 'bg-slate-500/10 text-slate-500 border-slate-200',
        purple: 'bg-purple-500/10 text-purple-600 border-purple-200',
    };
    const colors = colorMap[variant || 'neutral'];

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colors}`}>
            {value}
        </span>
    );
}

/** Confidence badge with auto-color */
export function ConfidenceBadge({ value }: { value: string | null }) {
    if (!value) return <span className="text-[var(--label-tertiary)]">—</span>;
    const v = value.toLowerCase();
    const variant = v === 'high' ? 'success' : v === 'medium' ? 'warning' : v === 'low' ? 'danger' : 'neutral';
    return <StatusBadge value={value} variant={variant} />;
}

/** Tier badge with auto-color */
export function TierBadge({ value }: { value: string | null }) {
    if (!value) return <span className="text-[var(--label-tertiary)]">—</span>;
    const v = value.toLowerCase();
    const variant =
        v === 'platinum' || v === 'a' ? 'purple' :
        v === 'gold' || v === 'b' ? 'info' :
        v === 'silver' || v === 'c' ? 'warning' :
        v === 'bronze' || v === 'd' ? 'neutral' : 'neutral';
    return <StatusBadge value={value} variant={variant} />;
}

/** Trend indicator with arrow */
export function TrendIndicator({ value }: { value: string | null }) {
    if (!value) return <span className="text-[var(--label-tertiary)]">—</span>;
    const v = value.toLowerCase();
    const isUp = v === 'increasing' || v === 'up' || v === 'rising' || v === 'strongly_rising';
    const isDown = v === 'decreasing' || v === 'down' || v === 'falling' || v === 'strongly_falling';
    const isVolatile = v === 'volatile';

    let color = 'text-amber-600';
    let arrow = '→';
    if (isUp) {
        color = 'text-emerald-600';
        arrow = '↑';
    } else if (isDown) {
        color = 'text-rose-600';
        arrow = '↓';
    } else if (isVolatile) {
        color = 'text-purple-600';
        arrow = '⇅';
    }

    return (
        <span className={`flex items-center gap-1 text-xs font-semibold ${color}`}>
            {arrow} {value}
        </span>
    );
}

export const CRR_SEQUENCE_TOUCHPOINTS = [
    { step: 1, day: 'Day 0', channel: 'AI Voice Call (VAPI) + WA', wf: 'WF-01', purpose: 'First contact, gauge interest' },
    { step: 2, day: 'Day 1', channel: 'AI Voice Call (VAPI) + WA', wf: 'WF-02', purpose: 'Follow up' },
    { step: 3, day: 'Day 2', channel: 'Email', wf: 'WF-03', purpose: 'Formal written outreach' },
    { step: 4, day: 'Day 4', channel: 'WhatsApp Follow-up', wf: 'WF-04', purpose: 'Re-engage if no response' },
    { step: 5, day: 'Day 5', channel: 'Email Follow-up', wf: 'WF-05', purpose: 'Final email reminder' },
    { step: 6, day: 'Day 6', channel: 'AI Voice Call (VAPI) + WA', wf: 'WF-06', purpose: 'Final call + WA before order date' },
];

/** Step progress bar for 6-touchpoint CRR outreach sequence */
export function StepProgress({ current, total = 6 }: { current: number; total?: number }) {
    const safeCurrent = Math.min(Math.max(current, 0), total);
    const pct = Math.min((safeCurrent / total) * 100, 100);

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 cursor-pointer group min-w-[120px]">
                        <div className="flex-1 h-2 rounded-full bg-[var(--fill-quaternary)] overflow-hidden border border-[var(--separator)]/50">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-bold text-[var(--label-secondary)] group-hover:text-blue-500 transition-colors whitespace-nowrap">
                            {safeCurrent}/{total}
                        </span>
                    </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-[320px] bg-slate-950/95 text-white border border-slate-800 p-3.5 shadow-2xl rounded-xl space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold text-blue-400">6-Touchpoint CRR Sequence</span>
                        <span className="text-[10px] font-semibold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                            {safeCurrent} of {total} Completed
                        </span>
                    </div>
                    <div className="space-y-1.5 pt-1">
                        {CRR_SEQUENCE_TOUCHPOINTS.map((tp) => {
                            const isCompleted = safeCurrent >= tp.step;
                            return (
                                <div key={tp.step} className="flex items-start justify-between gap-2 text-[11px]">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isCompleted ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                                        <span className={`font-semibold ${isCompleted ? 'text-slate-200' : 'text-slate-400'}`}>
                                            {tp.day}: {tp.channel}
                                        </span>
                                    </div>
                                    <span className="text-[9px] font-mono text-slate-400">{tp.wf}</span>
                                </div>
                            );
                        })}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
