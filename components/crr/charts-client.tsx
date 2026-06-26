"use client";

import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ─── Pie Chart ──────────────────────────────────────────────────────────────

interface PieChartData {
    name: string;
    value: number;
    color: string;
}

export function CRRPieChart({ data, height = 280 }: { data: PieChartData[]; height?: number }) {
    const hasData = data.some(d => d.value > 0);
    if (!hasData) {
        return (
            <div className="flex items-center justify-center text-[var(--label-tertiary)] text-sm" style={{ height }}>
                No data available
            </div>
        );
    }

    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="relative" style={{ height, minHeight: height }}>
            {/* Centered Total Counter for Premium Look */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-500" style={{ transform: 'translateY(-16px)' }}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--label-tertiary)]">Total</span>
                <span className="text-xl font-extrabold text-[var(--label-primary)] mt-0.5">{total}</span>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const item = payload[0];
                                const percentage = total > 0 ? ((item.value as number) / total * 100).toFixed(1) : '0';
                                return (
                                    <div className="bg-[var(--glass-fill)] backdrop-blur-md rounded-xl p-3 border border-[var(--separator)] shadow-[var(--glass-shadow)] text-xs">
                                        <div className="flex items-center gap-2 font-semibold text-[var(--label-primary)]">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.payload.color }} />
                                            <span>{item.name}</span>
                                        </div>
                                        <div className="mt-1.5 text-[var(--label-secondary)] pl-4 space-y-0.5">
                                            <div>Count: <span className="font-bold text-[var(--label-primary)]">{item.value}</span></div>
                                            <div>Share: <span className="font-bold text-[var(--label-primary)]">{percentage}%</span></div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        iconSize={8}
                        formatter={(value: string, entry: any) => {
                            const payload = entry.payload;
                            const count = payload ? payload.value : null;
                            return (
                                <span className="text-xs font-semibold text-[var(--label-secondary)] hover:text-[var(--label-primary)] transition-colors">
                                    {value} {count != null && <span className="text-[10px] text-[var(--label-tertiary)] font-normal ml-0.5">({count})</span>}
                                </span>
                            );
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

// ─── Bar Chart ──────────────────────────────────────────────────────────────

interface BarChartData {
    [key: string]: string | number;
}

export function CRRBarChart({
    data,
    xKey,
    yKey,
    color = '#3b82f6',
    height = 280,
    yLabel,
}: {
    data: BarChartData[];
    xKey: string;
    yKey: string;
    color?: string;
    height?: number;
    yLabel?: string;
}) {
    const displayData = data.length > 0 ? data : [{ [xKey]: 'No data', [yKey]: 0 }];
    return (
        <div style={{ height, minHeight: height }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--separator)" />
                    <XAxis
                        dataKey={xKey}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: 'var(--label-tertiary)' }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: 'var(--label-tertiary)' }}
                        allowDecimals={false}
                        label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: 'var(--label-tertiary)' } } : undefined}
                    />
                    <Tooltip
                        cursor={{ fill: 'var(--fill-quaternary)', opacity: 0.15 }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const item = payload[0];
                                return (
                                    <div className="bg-[var(--glass-fill)] backdrop-blur-md rounded-xl p-3 border border-[var(--separator)] shadow-[var(--glass-shadow)] text-xs">
                                        <div className="font-semibold text-[var(--label-primary)]">
                                            {item.payload[xKey]}
                                        </div>
                                        <div className="mt-1 text-[var(--label-secondary)]">
                                            {yLabel || 'Value'}: <span className="font-bold text-[var(--label-primary)]">{item.value}</span>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Bar dataKey={yKey} fill={color} radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// ─── Area Chart ─────────────────────────────────────────────────────────────

export function CRRAreaChart({
    data,
    xKey,
    yKey,
    color = '#10b981',
    height = 280,
}: {
    data: BarChartData[];
    xKey: string;
    yKey: string;
    color?: string;
    height?: number;
}) {
    const gradientId = `gradient-${yKey}-${color.replace('#', '')}`;
    const displayData = data.length > 0 ? data : [{ [xKey]: 'No data', [yKey]: 0 }];

    return (
        <div style={{ height, minHeight: height }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayData}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--separator)" />
                    <XAxis
                        dataKey={xKey}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: 'var(--label-tertiary)' }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: 'var(--label-tertiary)' }}
                        allowDecimals={false}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const item = payload[0];
                                return (
                                    <div className="bg-[var(--glass-fill)] backdrop-blur-md rounded-xl p-3 border border-[var(--separator)] shadow-[var(--glass-shadow)] text-xs">
                                        <div className="font-semibold text-[var(--label-primary)]">
                                            {item.payload[xKey]}
                                        </div>
                                        <div className="mt-1 text-[var(--label-secondary)]">
                                            Quantity: <span className="font-bold text-[var(--label-primary)]">{item.value} MT</span>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey={yKey}
                        stroke={color}
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill={`url(#${gradientId})`}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
