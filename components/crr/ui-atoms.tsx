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

/** Step progress bar */
export function StepProgress({ current, total = 9 }: { current: number; total?: number }) {
    const pct = Math.min((current / total) * 100, 100);
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-[var(--fill-quaternary)] overflow-hidden">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-[10px] font-bold text-[var(--label-secondary)] whitespace-nowrap">
                {current}/{total}
            </span>
        </div>
    );
}
