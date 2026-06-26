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

    return (
        <div style={{ height, minHeight: height }}>
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
                        contentStyle={{
                            backgroundColor: 'var(--glass-fill)',
                            borderRadius: '12px',
                            border: '1px solid var(--separator)',
                            backdropFilter: 'blur(24px)',
                            fontSize: 13,
                        }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value: string) => (
                            <span style={{ color: 'var(--label-secondary)', fontSize: 12 }}>{value}</span>
                        )}
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
                        cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                        contentStyle={{
                            backgroundColor: 'var(--glass-fill)',
                            borderRadius: '12px',
                            border: '1px solid var(--separator)',
                            backdropFilter: 'blur(24px)',
                            fontSize: 13,
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
                        contentStyle={{
                            backgroundColor: 'var(--glass-fill)',
                            borderRadius: '12px',
                            border: '1px solid var(--separator)',
                            backdropFilter: 'blur(24px)',
                            fontSize: 13,
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
