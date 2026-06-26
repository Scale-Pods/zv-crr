import { supabaseAdmin } from './supabase';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CRRPrediction {
    id: number;
    party_name: string;
    alert_type: string | null;
    tier: string | null;
    cadence: string | null;
    trend: string | null;
    last_order_month: string | null;
    last_order_qty_mt: number | null;
    avg_monthly_order_mt: number | null;
    predicted_next_order_date: string | null;
    predicted_order_qty_mt: number | null;
    confidence: string | null;
    reasoning: string | null;
    action_message: string | null;
    processed_at: string | null;
    product_lines: string | null;
    updated_at: string | null;
    _skip: boolean | null;
}

export interface CRROutreach {
    id: number;
    prediction_id: number | null;
    party_name: string;
    phone: string | null;
    email: string | null;
    contact_person: string | null;
    predicted_order_date: string;
    outreach_start_date: string;
    outreach_status: string | null;
    stop_outreach: boolean | null;
    responded: boolean | null;
    response_channel: string | null;
    response_timestamp: string | null;
    response_message: string | null;
    last_contacted: string | null;
    replied: string | null;
    current_step: number | null;
    // Voice
    voice_1_ts: string | null;
    voice_1_status: string | null;
    voice_1_sentiment: string | null;
    voice_1_note: string | null;
    voice_2_ts: string | null;
    voice_2_status: string | null;
    voice_2_sentiment: string | null;
    voice_2_note: string | null;
    voice_3_ts: string | null;
    voice_3_status: string | null;
    voice_3_sentiment: string | null;
    voice_3_note: string | null;
    // Email
    email_1_ts: string | null;
    email_1_replied_ts: string | null;
    email_1_content: string | null;
    email_2_ts: string | null;
    email_2_replied_ts: string | null;
    email_2_content: string | null;
    // WhatsApp
    whatsapp_1_ts: string | null;
    whatsapp_1_status: string | null;
    whatsapp_1_template: string | null;
    whatsapp_2_ts: string | null;
    whatsapp_2_status: string | null;
    whatsapp_2_template: string | null;
    whatsapp_3_ts: string | null;
    whatsapp_3_status: string | null;
    whatsapp_3_template: string | null;
    whatsapp_4_ts: string | null;
    whatsapp_4_status: string | null;
    whatsapp_4_template: string | null;
    // Meta
    created_at: string | null;
    updated_at: string | null;
}

// ─── Data Fetchers ──────────────────────────────────────────────────────────

export async function fetchPredictions(): Promise<CRRPrediction[]> {
    let allData: CRRPrediction[] = [];
    let from = 0;
    let limit = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabaseAdmin
            .from('crr_predictions')
            .select('*')
            .order('predicted_next_order_date', { ascending: true })
            .range(from, from + limit - 1);
        if (error) {
            console.error('fetchPredictions error:', error);
            return allData;
        }
        if (data && data.length > 0) {
            allData = [...allData, ...data];
            if (data.length < limit) {
                hasMore = false;
            } else {
                from += limit;
            }
        } else {
            hasMore = false;
        }
    }
    return allData;
}

export async function fetchOutreach(): Promise<CRROutreach[]> {
    let allData: CRROutreach[] = [];
    let from = 0;
    let limit = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabaseAdmin
            .from('crr_outreach')
            .select('*')
            .order('created_at', { ascending: false })
            .range(from, from + limit - 1);
        if (error) {
            console.error('fetchOutreach error:', error);
            return allData;
        }
        if (data && data.length > 0) {
            allData = [...allData, ...data];
            if (data.length < limit) {
                hasMore = false;
            } else {
                from += limit;
            }
        } else {
            hasMore = false;
        }
    }
    return allData;
}

// ─── Computed Metrics ───────────────────────────────────────────────────────

export interface DashboardMetrics {
    totalParties: number;
    activeOutreach: number;
    totalResponded: number;
    responseRate: number;
    ordersDueSoon: number; // next 7 days
    avgCurrentStep: number;
    // Channel counts
    voiceAttempts: number;
    emailAttempts: number;
    whatsappAttempts: number;
    // Prediction analytics
    tierDistribution: { name: string; value: number; color: string }[];
    confidenceDistribution: { name: string; value: number; color: string }[];
    trendDistribution: { name: string; value: number; color: string }[];
    upcomingOrders: { date: string; count: number; totalQty: number }[];
    // Alerts
    urgentPredictions: CRRPrediction[];
}

const TIER_COLORS: Record<string, string> = {
    platinum: '#a78bfa',
    gold: '#f59e0b',
    silver: '#94a3b8',
    bronze: '#f97316',
    default: '#6b7280',
};

const CONFIDENCE_COLORS: Record<string, string> = {
    high: '#10b981',
    medium: '#f59e0b',
    low: '#ef4444',
    default: '#6b7280',
};

const TREND_COLORS: Record<string, string> = {
    increasing: '#10b981',
    up: '#10b981',
    stable: '#f59e0b',
    decreasing: '#ef4444',
    down: '#ef4444',
    default: '#6b7280',
};

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
    const [predictions, outreach] = await Promise.all([
        fetchPredictions(),
        fetchOutreach(),
    ]);

    const now = new Date();
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const activePredictions = predictions.filter(p => !p._skip);
    const activeOutreach = outreach.filter(o => o.outreach_status === 'active');
    const responded = outreach.filter(o => o.responded === true);

    // Channel attempt counts
    let voiceAttempts = 0, emailAttempts = 0, whatsappAttempts = 0;
    outreach.forEach(o => {
        if (o.voice_1_ts) voiceAttempts++;
        if (o.voice_2_ts) voiceAttempts++;
        if (o.voice_3_ts) voiceAttempts++;
        if (o.email_1_ts) emailAttempts++;
        if (o.email_2_ts) emailAttempts++;
        if (o.whatsapp_1_ts) whatsappAttempts++;
        if (o.whatsapp_2_ts) whatsappAttempts++;
        if (o.whatsapp_3_ts) whatsappAttempts++;
        if (o.whatsapp_4_ts) whatsappAttempts++;
    });

    // Average step
    const stepsSum = outreach.reduce((acc, o) => acc + (o.current_step ?? 0), 0);
    const avgStep = outreach.length > 0 ? stepsSum / outreach.length : 0;

    // Tier distribution
    const tierCounts: Record<string, number> = {};
    activePredictions.forEach(p => {
        const tier = (p.tier || 'unknown').toLowerCase();
        tierCounts[tier] = (tierCounts[tier] || 0) + 1;
    });
    const tierDistribution = Object.entries(tierCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: TIER_COLORS[name] || TIER_COLORS.default,
    }));

    // Confidence distribution
    const confCounts: Record<string, number> = {};
    activePredictions.forEach(p => {
        const conf = (p.confidence || 'unknown').toLowerCase();
        confCounts[conf] = (confCounts[conf] || 0) + 1;
    });
    const confidenceDistribution = Object.entries(confCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: CONFIDENCE_COLORS[name] || CONFIDENCE_COLORS.default,
    }));

    // Trend distribution
    const trendCounts: Record<string, number> = {};
    activePredictions.forEach(p => {
        const trend = (p.trend || 'unknown').toLowerCase();
        trendCounts[trend] = (trendCounts[trend] || 0) + 1;
    });
    const trendDistribution = Object.entries(trendCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: TREND_COLORS[name] || TREND_COLORS.default,
    }));

    // Upcoming orders (next 30 days, grouped by date)
    const thirtyDaysLater = new Date(now);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const ordersByDate: Record<string, { count: number; totalQty: number }> = {};
    activePredictions.forEach(p => {
        if (!p.predicted_next_order_date) return;
        const d = new Date(p.predicted_next_order_date);
        if (d >= now && d <= thirtyDaysLater) {
            const key = p.predicted_next_order_date;
            if (!ordersByDate[key]) ordersByDate[key] = { count: 0, totalQty: 0 };
            ordersByDate[key].count++;
            ordersByDate[key].totalQty += p.predicted_order_qty_mt ?? 0;
        }
    });
    const upcomingOrders = Object.entries(ordersByDate)
        .map(([date, v]) => ({ date, ...v }))
        .sort((a, b) => a.date.localeCompare(b.date));

    // Urgent predictions (next 7 days)
    const urgentPredictions = activePredictions.filter(p => {
        if (!p.predicted_next_order_date) return false;
        const d = new Date(p.predicted_next_order_date);
        return d >= now && d <= sevenDaysLater;
    });

    const ordersDueSoon = urgentPredictions.length;

    return {
        totalParties: activePredictions.length,
        activeOutreach: activeOutreach.length,
        totalResponded: responded.length,
        responseRate: outreach.length > 0 ? (responded.length / outreach.length) * 100 : 0,
        ordersDueSoon,
        avgCurrentStep: Math.round(avgStep * 10) / 10,
        voiceAttempts,
        emailAttempts,
        whatsappAttempts,
        tierDistribution,
        confidenceDistribution,
        trendDistribution,
        upcomingOrders,
        urgentPredictions,
    };
}
