"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Users, Package, MessageCircle, TrendingUp,
    Phone, Mail, BarChart3, Activity, AlertCircle
} from "lucide-react";
import { CRRPieChart, CRRBarChart } from "@/components/crr/charts-client";
import { NotificationBell } from "@/components/crr/notification-bell";
import type { DashboardMetrics, CRRPrediction } from "@/lib/crr-data";

interface Props {
    metrics: DashboardMetrics;
    urgentPredictions: CRRPrediction[];
}

export function MasterDashboardClient({ metrics, urgentPredictions }: Props) {
    const m = metrics;

    const channelData = [
        { name: 'Voice', value: m.voiceAttempts, color: '#8b5cf6' },
        { name: 'Email', value: m.emailAttempts, color: '#3b82f6' },
        { name: 'WhatsApp', value: m.whatsappAttempts, color: '#10b981' },
    ];

    const upcomingChartData = m.upcomingOrders.map(o => ({
        date: new Date(o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        orders: o.count,
        quantity: Math.round(o.totalQty),
    }));

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--label-primary)]">Master Overview</h1>
                    <p className="text-[var(--label-secondary)]">CRR prediction analytics & outreach performance at a glance.</p>
                </div>
                <NotificationBell alerts={urgentPredictions} />
            </div>

            {/* KPI Cards */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <MetricCard
                    title="Total Parties"
                    value={m.totalParties.toLocaleString()}
                    subtitle="Active predictions"
                    icon={<Users className="h-6 w-6" />}
                    color="text-blue-600"
                    bg="bg-[rgba(0,122,255,0.08)]"
                    border="border-blue-100"
                />
                <MetricCard
                    title="Active Outreach"
                    value={m.activeOutreach.toLocaleString()}
                    subtitle="Currently being contacted"
                    icon={<Package className="h-6 w-6" />}
                    color="text-emerald-600"
                    bg="bg-[rgba(52,199,89,0.08)]"
                    border="border-emerald-100"
                />
                <MetricCard
                    title="Responded"
                    value={m.totalResponded.toLocaleString()}
                    subtitle={`${m.responseRate.toFixed(1)}% response rate`}
                    icon={<MessageCircle className="h-6 w-6" />}
                    color="text-purple-600"
                    bg="bg-[rgba(175,82,222,0.08)]"
                    border="border-purple-100"
                />
                <MetricCard
                    title="Orders Due Soon"
                    value={m.ordersDueSoon.toLocaleString()}
                    subtitle="Next 7 days"
                    icon={<AlertCircle className="h-6 w-6" />}
                    color="text-amber-600"
                    bg="bg-[rgba(255,149,0,0.08)]"
                    border="border-amber-100"
                />
                <MetricCard
                    title="Avg Step"
                    value={m.avgCurrentStep.toString()}
                    subtitle="Outreach progress"
                    icon={<Activity className="h-6 w-6" />}
                    color="text-indigo-600"
                    bg="bg-indigo-50"
                    border="border-indigo-100"
                />
            </div>

            {/* Prediction Analytics */}
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="border-[var(--separator)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)] bg-[var(--glass-fill)] overflow-hidden">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-[rgba(245,158,11,0.08)] text-amber-600 rounded-lg">
                                <BarChart3 className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg">Tier Distribution</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <CRRPieChart data={m.tierDistribution} />
                    </CardContent>
                </Card>

                <Card className="border-[var(--separator)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)] bg-[var(--glass-fill)] overflow-hidden">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-[rgba(16,185,129,0.08)] text-emerald-600 rounded-lg">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg">Confidence Levels</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <CRRPieChart data={m.confidenceDistribution} />
                    </CardContent>
                </Card>

                <Card className="border-[var(--separator)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)] bg-[var(--glass-fill)] overflow-hidden">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-[rgba(139,92,246,0.08)] text-purple-600 rounded-lg">
                                <Activity className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg">Order Trends</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <CRRPieChart data={m.trendDistribution} />
                    </CardContent>
                </Card>
            </div>

            {/* Outreach Analytics */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-[var(--separator)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)] bg-[var(--glass-fill)] overflow-hidden">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-[rgba(0,122,255,0.08)] text-blue-600 rounded-lg">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg">Upcoming Predicted Orders</CardTitle>
                        </div>
                        <p className="text-xs text-[var(--label-tertiary)] mt-1">Next 30 days — predicted reorder dates</p>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <CRRBarChart
                            data={upcomingChartData}
                            xKey="date"
                            yKey="orders"
                            color="#3b82f6"
                            height={300}
                            yLabel="Parties"
                        />
                    </CardContent>
                </Card>

                <Card className="border-[var(--separator)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)] bg-[var(--glass-fill)] overflow-hidden">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-[rgba(175,82,222,0.08)] text-purple-600 rounded-lg">
                                <Phone className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg">Channel Effectiveness</CardTitle>
                        </div>
                        <p className="text-xs text-[var(--label-tertiary)] mt-1">Total outreach attempts by channel</p>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <CRRPieChart data={channelData} height={300} />
                    </CardContent>
                </Card>
            </div>

            {/* Quick Stats Row */}
            <div className="grid gap-4 md:grid-cols-3">
                <QuickStat icon={<Phone className="h-5 w-5 text-purple-600" />} label="Voice Calls" value={m.voiceAttempts} color="purple" />
                <QuickStat icon={<Mail className="h-5 w-5 text-blue-600" />} label="Emails Sent" value={m.emailAttempts} color="blue" />
                <QuickStat icon={<MessageCircle className="h-5 w-5 text-emerald-600" />} label="WhatsApp Messages" value={m.whatsappAttempts} color="emerald" />
            </div>
        </div>
    );
}

function MetricCard({ title, value, subtitle, icon, color, bg, border }: {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
    border: string;
}) {
    return (
        <Card className={`bg-[var(--glass-fill)] border ${border} shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)] overflow-hidden relative group hover:shadow-[var(--glass-shadow-hover)] transition-all duration-300`}>
            <CardContent className="p-6">
                <div className="flex items-start justify-between relative z-10">
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-[var(--label-secondary)] mb-1">{title}</p>
                        <h3 className="text-3xl font-bold text-[var(--label-primary)]">{value}</h3>
                        <p className="text-xs font-medium text-[var(--label-tertiary)] mt-2">{subtitle}</p>
                    </div>
                    <div className={`p-4 rounded-2xl ${bg} ${color} shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)]`}>
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function QuickStat({ icon, label, value, color }: {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: string;
}) {
    return (
        <div className="flex items-center gap-4 bg-[var(--glass-fill)] border border-[var(--separator)] rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.06)]">
            <div className={`p-3 rounded-xl bg-${color}-500/10`}>
                {icon}
            </div>
            <div>
                <p className="text-xs font-medium text-[var(--label-tertiary)]">{label}</p>
                <p className="text-xl font-bold text-[var(--label-primary)]">{value.toLocaleString()}</p>
            </div>
        </div>
    );
}
