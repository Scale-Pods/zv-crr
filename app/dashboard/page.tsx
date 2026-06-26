import { fetchDashboardMetrics, fetchPredictions } from "@/lib/crr-data";
import { MasterDashboardClient } from "./master-client";

export default async function DashboardPage() {
    const [metrics, predictions] = await Promise.all([
        fetchDashboardMetrics(),
        fetchPredictions(),
    ]);

    return (
        <MasterDashboardClient
            metrics={metrics}
            urgentPredictions={metrics.urgentPredictions}
        />
    );
}
