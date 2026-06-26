import { fetchPredictions } from "@/lib/crr-data";
import { PredictionsClient } from "./predictions-client";

export default async function PredictionsPage() {
    const predictions = await fetchPredictions();
    return <PredictionsClient predictions={predictions} />;
}
