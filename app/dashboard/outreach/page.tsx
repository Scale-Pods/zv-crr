import { fetchOutreach, fetchPredictions } from "@/lib/crr-data";
import { OutreachClient } from "./outreach-client";

export default async function OutreachPage() {
    const [outreach, predictions] = await Promise.all([
        fetchOutreach(),
        fetchPredictions(),
    ]);
    return <OutreachClient outreach={outreach} predictions={predictions} />;
}
