"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
    Phone, Search, CheckCircle, DollarSign, Clock, Play, Pause, 
    Sparkles, User, Bot, ArrowUpRight, ArrowDownLeft, 
    Download, Volume2, Copy, Check, X, Calendar, RotateCcw, RotateCw, ExternalLink
} from "lucide-react";
import { ColumnInfo } from "@/components/crr/ui-atoms";
import type { CRROutreach, VapiCallLog } from "@/lib/crr-data";

// ── Status Parser & Professional Colors ─────────────────────────────────────
type StatusVariant = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

interface FormattedStatus {
    label: string;
    variant: StatusVariant;
    fullDetail: string;
}

function parseCallStatus(rawStatus: string | null): FormattedStatus {
    if (!rawStatus) {
        return { label: "UNKNOWN", variant: "neutral", fullDetail: "No status recorded" };
    }

    const s = rawStatus.trim();
    const upper = s.toUpperCase();

    // Provider / SIP Errors
    if (upper.includes("PROVIDERFAULT") || upper.includes("SIP-480") || upper.includes("TEMPORARILY-UNAVAILABLE")) {
        return { label: "PROVIDER ERROR 480", variant: "danger", fullDetail: rawStatus };
    }
    if (upper.includes("SIP") || upper.includes("ERROR") || upper.includes("FAILED")) {
        return { label: "FAILED", variant: "danger", fullDetail: rawStatus };
    }

    // Customer or Assistant Ended
    if (upper.includes("CUSTOMER-ENDED") || upper === "CUSTOMER-ENDED-CALL") {
        return { label: "ENDED", variant: "success", fullDetail: rawStatus };
    }
    if (upper.includes("ASSISTANT-ENDED") || upper === "ASSISTANT-ENDED-CALL") {
        return { label: "ENDED", variant: "success", fullDetail: rawStatus };
    }
    if (upper === "COMPLETED" || upper === "ENDED" || upper === "ANSWERED") {
        return { label: "ANSWERED", variant: "success", fullDetail: rawStatus };
    }

    // In Progress / Ringing / Queued
    if (upper.includes("IN-PROGRESS") || upper === "QUEUED" || upper === "RINGING") {
        return { label: "IN PROGRESS", variant: "info", fullDetail: rawStatus };
    }

    // No Answer / Busy
    if (upper.includes("NO-ANSWER") || upper === "NO_ANSWER") {
        return { label: "NO ANSWER", variant: "warning", fullDetail: rawStatus };
    }
    if (upper.includes("BUSY")) {
        return { label: "BUSY", variant: "warning", fullDetail: rawStatus };
    }

    // Fallback: Clean string
    const cleanLabel = s
        .replace(/^CALL\./i, '')
        .replace(/[-_.]/g, ' ')
        .toUpperCase();

    return { label: cleanLabel, variant: "neutral", fullDetail: rawStatus };
}

// ── Transcript Speaker Parser ───────────────────────────────────────────────
export interface ChatTurn {
    role: 'ai' | 'user';
    speakerName: string;
    text: string;
}

export function parseTranscriptToTurns(raw: any): ChatTurn[] {
    if (!raw) return [];

    let turns: ChatTurn[] = [];

    // Array format from Vapi
    if (Array.isArray(raw)) {
        turns = raw.map(item => {
            const roleStr = (item.role || item.speaker || '').toLowerCase();
            const isUser = roleStr.includes('user') || roleStr.includes('customer') || roleStr.includes('human');
            return {
                role: isUser ? 'user' : 'ai',
                speakerName: isUser ? 'Customer' : 'Vapi AI Agent',
                text: item.message || item.text || item.content || (typeof item === 'string' ? item : JSON.stringify(item)),
            };
        });
        return turns;
    }

    // Object format containing messages array
    if (typeof raw === 'object' && Array.isArray(raw.messages)) {
        return parseTranscriptToTurns(raw.messages);
    }

    const str = typeof raw === 'string' ? raw : (typeof raw === 'object' ? JSON.stringify(raw) : String(raw));

    // Regex matching speaker prefixes like "AI:", "User:", "Bot:", "Customer:", "Assistant:", "Human:"
    const regex = /(?:^|\s*)(AI|Bot|Assistant|User|Customer|Human):\s*/gi;
    const matches = Array.from(str.matchAll(regex));

    if (matches.length > 0) {
        for (let i = 0; i < matches.length; i++) {
            const currentMatch = matches[i];
            const speakerTag = currentMatch[1].toLowerCase();
            const isUser = speakerTag.includes('user') || speakerTag.includes('customer') || speakerTag.includes('human');
            const startIndex = currentMatch.index! + currentMatch[0].length;
            const endIndex = (i + 1 < matches.length) ? matches[i + 1].index! : str.length;
            const text = str.slice(startIndex, endIndex).trim();

            if (text) {
                turns.push({
                    role: isUser ? 'user' : 'ai',
                    speakerName: isUser ? 'Customer' : 'Vapi AI Agent',
                    text: text,
                });
            }
        }
    } else {
        // Fallback for string without speaker prefixes
        turns.push({ role: 'ai', speakerName: 'Vapi AI Agent', text: str });
    }

    return turns;
}

// ── Call Direction Badge ────────────────────────────────────────────────────
function CallDirectionBadge({ type }: { type: string | null }) {
    const isOutbound = !type || type.toLowerCase().includes("outbound");
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase ${
            isOutbound 
                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                : "bg-teal-500/10 text-teal-400 border border-teal-500/20"
        }`}>
            {isOutbound ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
            {isOutbound ? "OUTBOUND" : "INBOUND"}
        </span>
    );
}

// ── Polished Call Status Badge ──────────────────────────────────────────────
function PolishedStatusBadge({ rawStatus }: { rawStatus: string | null }) {
    const { label, variant, fullDetail } = parseCallStatus(rawStatus);

    const styleMap: Record<StatusVariant, { bg: string; text: string; border: string }> = {
        success: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
        danger: { bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/30" },
        warning: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" },
        info: { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30" },
        neutral: { bg: "bg-slate-500/15", text: "text-slate-300", border: "border-slate-500/30" },
    };

    const st = styleMap[variant];

    return (
        <span 
            className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${st.bg} ${st.text} ${st.border}`}
            title={fullDetail}
        >
            {label}
        </span>
    );
}

// ── Mini Table Audio Player ─────────────────────────────────────────────────
function MiniAudioPlayer({ url }: { url: string }) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(() => {});
        }
        setIsPlaying(!isPlaying);
    };

    const formatTime = (secs: number) => {
        if (isNaN(secs) || secs === 0) return "0:00";
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <audio
                ref={audioRef}
                src={url}
                onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
                onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
                onEnded={() => setIsPlaying(false)}
            />
            <button
                onClick={togglePlay}
                className={`p-1.5 rounded-full flex items-center justify-center transition-all ${
                    isPlaying 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                        : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20'
                }`}
                title={isPlaying ? "Pause" : "Play Recording"}
            >
                {isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current ml-0.5" />}
            </button>
            <div className="flex flex-col">
                <span className="text-[11px] font-mono text-[var(--label-primary)]">
                    {isPlaying ? formatTime(currentTime) : (duration ? formatTime(duration) : 'Audio')}
                </span>
            </div>
        </div>
    );
}

// ── Advanced Call Details Modal (AI Left, User Right Chat Dialogue) ─────────
function CallDetailsModal({
    log,
    onClose,
    formatDateTime,
    formatDuration,
}: {
    log: VapiCallLog;
    onClose: () => void;
    formatDateTime: (d: string | null) => string;
    formatDuration: (s: number | null) => string;
}) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [volume, setVolume] = useState(1);
    const [copiedTranscript, setCopiedTranscript] = useState(false);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(() => {});
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = val;
            setCurrentTime(val);
        }
    };

    const skipTime = (seconds: number) => {
        if (audioRef.current) {
            const next = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
            audioRef.current.currentTime = next;
            setCurrentTime(next);
        }
    };

    const changeSpeed = () => {
        const speeds = [1, 1.25, 1.5, 2];
        const nextSpeed = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
        setPlaybackRate(nextSpeed);
        if (audioRef.current) {
            audioRef.current.playbackRate = nextSpeed;
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (audioRef.current) {
            audioRef.current.volume = val;
        }
    };

    const formatTime = (secs: number) => {
        if (isNaN(secs)) return "0:00";
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Parse transcript lines into turns
    const transcriptTurns = parseTranscriptToTurns(log.transcript);

    const copyTranscriptText = () => {
        if (transcriptTurns.length === 0) return;
        const fullText = transcriptTurns.map(m => `${m.speakerName}: ${m.text}`).join("\n\n");
        navigator.clipboard.writeText(fullText);
        setCopiedTranscript(true);
        setTimeout(() => setCopiedTranscript(false), 2000);
    };

    const assistantName = log.assistantId ? `Agent: ${log.assistantId.slice(0, 10)}...` : 'Vapi Voice Agent';
    const assistantPhone = log.vapi_account ? `+${log.vapi_account}` : '+442080978341';
    const customerName = log.customer_name || 'SARFARAZ';
    const customerPhone = log.customer_phone || '+971508883590';
    const rawStatus = log.voice_call_status || log.status;

    return (
        <div 
            onClick={onClose} 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 cursor-pointer"
        >
            <div 
                onClick={e => e.stopPropagation()} 
                className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[var(--background)] rounded-2xl border border-[var(--separator)] shadow-2xl space-y-6 p-6 cursor-default"
            >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[var(--separator)]">
                    <h2 className="text-xl font-bold text-[var(--label-primary)]">Call Details</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg border border-[var(--separator)] text-[var(--label-tertiary)] hover:text-[var(--label-primary)] hover:bg-[var(--fill-quaternary)] transition-colors"
                        title="Close (Esc)"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Metadata Grid (3 Columns) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-5 gap-x-6 text-xs">
                    {/* Column 1 */}
                    <div className="space-y-4">
                        <div>
                            <span className="text-[10px] font-bold text-[var(--label-tertiary)] uppercase tracking-wider block mb-1">STATUS</span>
                            <PolishedStatusBadge rawStatus={rawStatus} />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-[var(--label-tertiary)] uppercase tracking-wider block mb-1">TYPE</span>
                            <CallDirectionBadge type={log.type} />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-[var(--label-tertiary)] uppercase tracking-wider block mb-1">AGENT / BOT</span>
                            <p className="font-bold text-sm text-[var(--label-primary)]">{assistantName}</p>
                            <p className="text-[11px] text-[var(--label-tertiary)] font-mono">{assistantPhone}</p>
                        </div>
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-4">
                        <div>
                            <span className="text-[10px] font-bold text-[var(--label-tertiary)] uppercase tracking-wider block mb-1">DURATION</span>
                            <div className="flex items-center gap-1.5 text-sm font-bold text-[var(--label-primary)]">
                                <Clock className="h-4 w-4 text-blue-400" />
                                <span>{formatDuration(log.duration_seconds)}</span>
                            </div>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-[var(--label-tertiary)] uppercase tracking-wider block mb-1">DATE & TIME</span>
                            <div className="flex items-center gap-1.5 text-xs text-[var(--label-primary)]">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                <span>{formatDateTime(log.started_at || log.created_at)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Column 3 */}
                    <div className="space-y-4">
                        <div>
                            <span className="text-[10px] font-bold text-[var(--label-tertiary)] uppercase tracking-wider block mb-1">GUEST NAME</span>
                            <div className="flex items-center gap-1.5 text-sm font-bold text-[var(--label-primary)]">
                                <User className="h-4 w-4 text-teal-400" />
                                <span>{customerName}</span>
                            </div>
                        </div>
                        {log.cost_usd !== null && log.cost_usd !== undefined && (
                            <div>
                                <span className="text-[10px] font-bold text-[var(--label-tertiary)] uppercase tracking-wider block mb-1">COST (USD)</span>
                                <span className="text-sm font-bold font-mono text-emerald-400">${Number(log.cost_usd).toFixed(4)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* CALL INFORMATION Flow Card */}
                <div className="space-y-2 pt-2">
                    <h3 className="text-xs font-bold text-[var(--label-tertiary)] uppercase tracking-wider">CALL INFORMATION</h3>
                    
                    <div className="p-4 rounded-xl bg-[var(--glass-fill)] border border-[var(--separator)] flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* From Assistant */}
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/30">
                                AI
                            </div>
                            <div className="p-3 rounded-xl bg-[var(--fill-quaternary)] border border-[var(--separator)] min-w-[170px]">
                                <p className="text-xs font-bold text-[var(--label-primary)] truncate">{assistantName}</p>
                                <p className="text-[11px] text-[var(--label-tertiary)] font-mono">{assistantPhone}</p>
                            </div>
                        </div>

                        {/* Flow Arrow */}
                        <div className="flex flex-col items-center justify-center px-2">
                            <span className="text-[10px] font-bold text-blue-400 tracking-widest uppercase">OUTBOUND</span>
                            <div className="flex items-center text-blue-400 font-mono text-xs">
                                <span>──────</span>
                                <ArrowUpRight className="h-4 w-4 rotate-45 -ml-1" />
                            </div>
                        </div>

                        {/* To Customer */}
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                            <div className="p-3 rounded-xl bg-[var(--fill-quaternary)] border border-[var(--separator)] text-right min-w-[170px]">
                                <p className="text-xs font-bold text-[var(--label-primary)] truncate">{customerName}</p>
                                <p className="text-[11px] text-[var(--label-tertiary)] font-mono">{customerPhone}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs border border-teal-500/30">
                                <Phone className="h-4 w-4" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* CALL RECORDING Section */}
                {log.recording_url ? (
                    <div className="p-4 rounded-xl bg-[var(--glass-fill)] border border-[var(--separator)] space-y-4">
                        <audio
                            ref={audioRef}
                            src={log.recording_url}
                            onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
                            onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
                            onEnded={() => setIsPlaying(false)}
                        />

                        {/* Recording Top Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-blue-500/15 text-blue-400 flex items-center justify-center">
                                    <Volume2 className="h-4 w-4" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-[var(--label-primary)]">Call Recording</h4>
                                    <p className="text-[9px] text-[var(--label-tertiary)] uppercase font-semibold">PLAY TO REVIEW CONVERSATION</p>
                                </div>
                            </div>

                            <a
                                href={log.recording_url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 rounded-lg bg-[var(--fill-quaternary)] hover:bg-[var(--separator)] text-xs font-bold text-[var(--label-primary)] flex items-center gap-1.5 transition-all"
                            >
                                <Download className="h-3.5 w-3.5" /> DOWNLOAD
                            </a>
                        </div>

                        {/* Scrub Bar */}
                        <div className="space-y-1">
                            <input
                                type="range"
                                min="0"
                                max={duration || 100}
                                value={currentTime}
                                onChange={handleSeek}
                                className="w-full h-1.5 bg-[var(--separator)] rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <div className="flex justify-between text-[10px] font-mono text-[var(--label-tertiary)]">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Player Controls Bar */}
                        <div className="flex items-center justify-between pt-1">
                            {/* Playback Buttons */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => skipTime(-10)}
                                    className="p-1.5 rounded-lg text-xs font-bold text-[var(--label-secondary)] hover:text-[var(--label-primary)] hover:bg-[var(--fill-quaternary)] flex items-center gap-0.5 transition-colors"
                                    title="Rewind 10 seconds"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" /> -10
                                </button>

                                <button
                                    onClick={togglePlay}
                                    className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 transition-all"
                                >
                                    {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
                                </button>

                                <button
                                    onClick={() => skipTime(10)}
                                    className="p-1.5 rounded-lg text-xs font-bold text-[var(--label-secondary)] hover:text-[var(--label-primary)] hover:bg-[var(--fill-quaternary)] flex items-center gap-0.5 transition-colors"
                                    title="Forward 10 seconds"
                                >
                                    +10 <RotateCw className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            {/* Right Speed & Volume */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={changeSpeed}
                                    className="px-2 py-1 rounded-md bg-[var(--fill-quaternary)] hover:bg-[var(--separator)] text-xs font-bold text-[var(--label-primary)] transition-colors"
                                >
                                    {playbackRate}x
                                </button>

                                <div className="flex items-center gap-1.5 text-[var(--label-tertiary)]">
                                    <Volume2 className="h-3.5 w-3.5" />
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={volume}
                                        onChange={handleVolumeChange}
                                        className="w-16 h-1 bg-[var(--separator)] rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 rounded-xl bg-[var(--glass-fill)] border border-[var(--separator)] text-center text-xs text-[var(--label-tertiary)] italic">
                        No audio recording file attached to this call log.
                    </div>
                )}

                {/* AI Call Summary if available */}
                {log.summary && (
                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-1">
                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-blue-400" /> CALL SUMMARY
                        </h4>
                        <p className="text-xs text-[var(--label-primary)] leading-relaxed font-sans">{log.summary}</p>
                    </div>
                )}

                {/* TRANSCRIPT Section - 2 Person Chat Dialogue Layout (AI Left, User Right) */}
                <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-[var(--label-tertiary)] uppercase tracking-wider">TRANSCRIPT</h3>
                        {transcriptTurns.length > 0 && (
                            <button
                                onClick={copyTranscriptText}
                                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors"
                            >
                                {copiedTranscript ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                                <span>{copiedTranscript ? "COPIED" : "COPY TRANSCRIPT"}</span>
                            </button>
                        )}
                    </div>

                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 p-1">
                        {transcriptTurns.length === 0 ? (
                            <div className="p-4 text-center text-xs text-[var(--label-tertiary)] italic">
                                No transcript text recorded for this call log.
                            </div>
                        ) : (
                            transcriptTurns.map((msg, idx) => {
                                const isAI = msg.role === 'ai';
                                return (
                                    <div 
                                        key={idx} 
                                        className={`flex items-start gap-2.5 ${isAI ? 'justify-start' : 'justify-end'}`}
                                    >
                                        {/* AI Avatar on Left */}
                                        {isAI && (
                                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                                                AI
                                            </div>
                                        )}

                                        {/* Speech Bubble */}
                                        <div className={`p-3.5 text-xs leading-relaxed max-w-[78%] shadow-sm space-y-1 ${
                                            isAI
                                                ? 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-2xl rounded-tl-sm'
                                                : 'bg-blue-600 border border-blue-500 text-white rounded-2xl rounded-tr-sm'
                                        }`}>
                                            <p className="whitespace-pre-wrap font-sans">{msg.text}</p>
                                        </div>

                                        {/* User Avatar on Right */}
                                        {!isAI && (
                                            <div className="w-8 h-8 rounded-full bg-teal-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                                                U
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

// ── Main VoiceClient Component ──────────────────────────────────────────────
export function VoiceClient({ outreach, vapiLogs = [] }: { outreach: CRROutreach[]; vapiLogs?: VapiCallLog[] }) {
    const [search, setSearch] = useState("");
    const [viewTab, setViewTab] = useState<"vapi" | "outreach">("vapi");
    const [selectedLog, setSelectedLog] = useState<VapiCallLog | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Filter Vapi Logs
    const filteredVapi = vapiLogs.filter(log => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            (log.customer_name || '').toLowerCase().includes(q) ||
            (log.customer_phone || '').toLowerCase().includes(q) ||
            (log.status || '').toLowerCase().includes(q) ||
            (log.voice_call_status || '').toLowerCase().includes(q) ||
            (log.summary || '').toLowerCase().includes(q) ||
            (log.vapi_account || '').toLowerCase().includes(q)
        );
    });

    // Filter Outreach Records
    const voiceRecords = outreach.filter(o => o.voice_1_ts || o.voice_2_ts || o.voice_3_ts);
    
    // Step count helper for sorting
    const getLeadStepCount = (o: CRROutreach): number => {
        let touchedCount = 0;
        if (o.voice_1_ts) touchedCount++;
        if (o.voice_2_ts) touchedCount++;
        if (o.voice_3_ts) touchedCount++;
        if (o.email_1_ts) touchedCount++;
        if (o.email_2_ts) touchedCount++;
        if (o.whatsapp_1_ts) touchedCount++;
        if (o.whatsapp_2_ts) touchedCount++;
        if (o.whatsapp_3_ts) touchedCount++;
        if (o.whatsapp_4_ts) touchedCount++;
        return Math.max(o.current_step || 0, touchedCount);
    };

    // Latest timestamp helper for sorting
    const getLeadLatestTimestamp = (o: CRROutreach): number => {
        const dates = [
            o.last_contacted,
            o.outreach_start_date,
            o.voice_1_ts,
            o.voice_2_ts,
            o.voice_3_ts,
            o.email_1_ts,
            o.email_2_ts,
            o.whatsapp_1_ts,
            o.whatsapp_2_ts,
            o.whatsapp_3_ts,
            o.whatsapp_4_ts,
            o.response_timestamp
        ].filter(Boolean) as string[];

        if (dates.length === 0) return 0;
        const timestamps = dates.map(d => new Date(d).getTime()).filter(t => !isNaN(t));
        return timestamps.length > 0 ? Math.max(...timestamps) : 0;
    };

    const filteredOutreach = voiceRecords.filter(o => {
        if (!search) return true;
        const q = search.toLowerCase();
        return o.party_name.toLowerCase().includes(q) || (o.phone || '').includes(q) || (o.contact_person || '').toLowerCase().includes(q);
    }).sort((a, b) => {
        const stepsA = getLeadStepCount(a);
        const stepsB = getLeadStepCount(b);
        if (stepsB !== stepsA) {
            return stepsB - stepsA; // Descending by step count
        }
        const dateA = getLeadLatestTimestamp(a);
        const dateB = getLeadLatestTimestamp(b);
        return dateB - dateA; // Descending by latest date
    });

    const handleSearchChange = (val: string) => {
        setSearch(val);
        setCurrentPage(1);
    };

    const handleTabChange = (tab: "vapi" | "outreach") => {
        setViewTab(tab);
        setSelectedLog(null);
        setCurrentPage(1);
    };

    const itemsPerPage = 10;
    const currentList = viewTab === "vapi" ? filteredVapi : filteredOutreach;
    const totalPages = Math.ceil(currentList.length / itemsPerPage);
    const activePage = Math.min(currentPage, Math.max(1, totalPages));
    const startIndex = (activePage - 1) * itemsPerPage;
    const paginatedVapi = filteredVapi.slice(startIndex, startIndex + itemsPerPage);
    const paginatedOutreach = filteredOutreach.slice(startIndex, startIndex + itemsPerPage);

    // Metrics
    let totalVapiDurationSeconds = 0;
    let totalVapiCostUsd = 0;
    let vapiCompletedCount = 0;
    let vapiRecordingsCount = 0;

    vapiLogs.forEach(log => {
        if (log.duration_seconds) totalVapiDurationSeconds += log.duration_seconds;
        if (log.cost_usd) totalVapiCostUsd += log.cost_usd;
        const st = (log.status || log.voice_call_status || '').toLowerCase();
        if (st === 'completed' || st === 'ended' || st.includes('customer-ended')) {
            vapiCompletedCount++;
        }
        if (log.recording_url) vapiRecordingsCount++;
    });

    const totalVapiMinutes = Math.round(totalVapiDurationSeconds / 60);

    const formatDateTime = (d: string | null) => {
        if (!d) return '—';
        return new Date(d).toLocaleString('en-US', { 
            month: 'numeric', 
            day: 'numeric', 
            year: 'numeric', 
            hour: 'numeric', 
            minute: '2-digit',
            second: '2-digit',
            hour12: true 
        });
    };

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return '0m 0s';
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--label-primary)] tracking-tight">Voice Outreach & Call Logs</h1>
                    <p className="text-xs text-[var(--label-secondary)] mt-0.5">
                        AI Telephony Monitoring — Call Recordings, Transcripts, Status & Duration Analytics
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* View Switcher Tabs */}
                    <div className="flex items-center rounded-xl bg-[var(--glass-fill)] border border-[var(--separator)] p-1 text-xs shadow-inner">
                        <button
                            onClick={() => handleTabChange("vapi")}
                            className={`px-3 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1.5 ${
                                viewTab === "vapi" ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30" : "text-[var(--label-secondary)] hover:text-[var(--label-primary)]"
                            }`}
                        >
                            <Phone className="h-3.5 w-3.5" /> Vapi Call Logs ({vapiLogs.length})
                        </button>
                        <button
                            onClick={() => handleTabChange("outreach")}
                            className={`px-3 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1.5 ${
                                viewTab === "outreach" ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30" : "text-[var(--label-secondary)] hover:text-[var(--label-primary)]"
                            }`}
                        >
                            Sequence Calls ({voiceRecords.length})
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--label-tertiary)]" />
                        <input
                            type="text"
                            placeholder="Search guest name, phone, status..."
                            value={search}
                            onChange={e => handleSearchChange(e.target.value)}
                            className="pl-9 pr-4 py-2 w-[240px] sm:w-[280px] rounded-xl bg-[var(--glass-fill)] border border-[var(--separator)] text-xs text-[var(--label-primary)] placeholder:text-[var(--label-tertiary)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* KPI Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                <MiniCard title="Total Calls" value={vapiLogs.length} icon={<Phone className="h-4 w-4 text-blue-400" />} />
                <MiniCard title="Total Duration" value={`${totalVapiMinutes} mins`} icon={<Clock className="h-4 w-4 text-cyan-400" />} isString />
                <MiniCard title="Total Spend" value={`$${totalVapiCostUsd.toFixed(2)}`} icon={<DollarSign className="h-4 w-4 text-emerald-400" />} isString />
                <MiniCard title="Answered Calls" value={vapiCompletedCount} icon={<CheckCircle className="h-4 w-4 text-teal-400" />} />
                <MiniCard title="Recordings" value={vapiRecordingsCount} icon={<Play className="h-4 w-4 text-amber-400" />} />
            </div>

            {/* Main Table Card */}
            <Card className="overflow-hidden border border-[var(--separator)] bg-[var(--glass-fill)]">
                <CardContent className="p-0">
                    {viewTab === "vapi" ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="border-b border-[var(--separator)] bg-[var(--fill-quaternary)]/60 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider">
                                        <th className="px-5 py-3.5">
                                            <ColumnInfo label="GUEST NAME & PHONE" description="Customer / Guest contact details" />
                                        </th>
                                        <th className="px-4 py-3.5">
                                            <ColumnInfo label="TYPE" description="Call direction (Outbound/Inbound)" />
                                        </th>
                                        <th className="px-4 py-3.5">
                                            <ColumnInfo label="DATE & TIME" description="Timestamp of call initialization" />
                                        </th>
                                        <th className="px-4 py-3.5">
                                            <ColumnInfo label="DURATION" description="Total call duration in minutes/seconds" />
                                        </th>
                                        <th className="px-4 py-3.5">
                                            <ColumnInfo label="AUDIO RECORDING" description="Playback audio player" />
                                        </th>
                                        <th className="px-4 py-3.5">
                                            <ColumnInfo label="STATUS" description="Telephony call outcome status" />
                                        </th>
                                        <th className="px-4 py-3.5 text-center">DETAILS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--separator)] text-xs">
                                    {paginatedVapi.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-12 text-[var(--label-tertiary)] font-medium">
                                                No Vapi call logs found matching search criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedVapi.map(log => (
                                            <tr 
                                                key={log.id} 
                                                onClick={() => setSelectedLog(log)}
                                                className="hover:bg-[var(--fill-quaternary)]/80 transition-colors cursor-pointer"
                                            >
                                                {/* Guest Name & Phone */}
                                                <td className="px-5 py-3.5">
                                                    <div>
                                                        <span className="text-xs font-bold text-[var(--label-primary)] block">
                                                            {log.customer_name || 'SARFARAZ'}
                                                        </span>
                                                        <span className="text-[11px] font-mono text-[var(--label-tertiary)]">
                                                            {log.customer_phone || '+971508883590'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Type */}
                                                <td className="px-4 py-3.5">
                                                    <CallDirectionBadge type={log.type} />
                                                </td>

                                                {/* Date & Time */}
                                                <td className="px-4 py-3.5 text-[11px] text-[var(--label-secondary)]">
                                                    {formatDateTime(log.started_at || log.created_at)}
                                                </td>

                                                {/* Duration */}
                                                <td className="px-4 py-3.5 font-mono font-bold text-xs text-[var(--label-primary)]">
                                                    {formatDuration(log.duration_seconds)}
                                                </td>

                                                {/* Audio Recording */}
                                                <td className="px-4 py-3.5">
                                                    {log.recording_url ? (
                                                        <MiniAudioPlayer url={log.recording_url} />
                                                    ) : (
                                                        <span className="text-[11px] text-[var(--label-tertiary)] italic">No recording</span>
                                                    )}
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-3.5">
                                                    <PolishedStatusBadge rawStatus={log.voice_call_status || log.status} />
                                                </td>

                                                {/* Details Action */}
                                                <td className="px-4 py-3.5 text-center">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedLog(log);
                                                        }}
                                                        className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold flex items-center gap-1 mx-auto transition-colors"
                                                    >
                                                        View <ExternalLink className="h-3 w-3" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* Sequence Calls Table */
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="border-b border-[var(--separator)] bg-[var(--fill-quaternary)]/60 text-[11px] font-bold text-[var(--label-secondary)] uppercase tracking-wider">
                                        <th className="px-5 py-3.5">Party Name</th>
                                        <th className="px-4 py-3.5">Phone</th>
                                        <th className="px-4 py-3.5">Call 1</th>
                                        <th className="px-4 py-3.5">Call 2</th>
                                        <th className="px-4 py-3.5">Call 3</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--separator)] text-xs">
                                    {paginatedOutreach.map(o => (
                                        <tr key={o.id} className="hover:bg-[var(--fill-quaternary)]/70">
                                            <td className="px-5 py-3.5 font-semibold text-[var(--label-primary)]">{o.party_name}</td>
                                            <td className="px-4 py-3.5 font-mono text-[var(--label-secondary)]">{o.phone || '—'}</td>
                                            <td className="px-4 py-3.5"><CallCell ts={o.voice_1_ts} status={o.voice_1_status} formatDateTime={formatDateTime} /></td>
                                            <td className="px-4 py-3.5"><CallCell ts={o.voice_2_ts} status={o.voice_2_status} formatDateTime={formatDateTime} /></td>
                                            <td className="px-4 py-3.5"><CallCell ts={o.voice_3_ts} status={o.voice_3_status} formatDateTime={formatDateTime} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[var(--separator)] bg-[var(--fill-quaternary)]/40 text-xs text-[var(--label-secondary)]">
                            <div>
                                Showing <span className="font-semibold text-[var(--label-primary)]">{startIndex + 1}</span> to{' '}
                                <span className="font-semibold text-[var(--label-primary)]">{Math.min(startIndex + itemsPerPage, currentList.length)}</span> of{' '}
                                <span className="font-semibold text-[var(--label-primary)]">{currentList.length}</span> records
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={activePage === 1}
                                    className="px-3 py-1 rounded-lg border border-[var(--separator)] disabled:opacity-40 hover:bg-[var(--fill-quaternary)]"
                                >
                                    Previous
                                </button>
                                <span className="font-semibold px-2">{activePage} / {totalPages}</span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={activePage === totalPages}
                                    className="px-3 py-1 rounded-lg border border-[var(--separator)] disabled:opacity-40 hover:bg-[var(--fill-quaternary)]"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal Dialog for Call Details */}
            {selectedLog && (
                <CallDetailsModal
                    log={selectedLog}
                    onClose={() => setSelectedLog(null)}
                    formatDateTime={formatDateTime}
                    formatDuration={formatDuration}
                />
            )}
        </div>
    );
}

function CallCell({ ts, status, formatDateTime }: { ts: string | null; status: string | null; formatDateTime: (d: string | null) => string }) {
    if (!ts) return <span className="text-[var(--label-tertiary)] italic">—</span>;
    return (
        <div className="space-y-1">
            <span className="text-[10px] text-[var(--label-tertiary)] block">{formatDateTime(ts)}</span>
            {status && <PolishedStatusBadge rawStatus={status} />}
        </div>
    );
}

function MiniCard({ title, value, icon, isString }: { title: string; value: number | string; icon: React.ReactNode; isString?: boolean }) {
    return (
        <Card className="border border-[var(--separator)] bg-[var(--glass-fill)]">
            <CardContent className="p-3.5 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">{icon}</div>
                <div>
                    <p className="text-[10px] font-bold text-[var(--label-tertiary)] uppercase tracking-wider">{title}</p>
                    <p className="text-lg font-bold text-[var(--label-primary)] mt-0.5">{isString ? value : (value as number).toLocaleString()}</p>
                </div>
            </CardContent>
        </Card>
    );
}
