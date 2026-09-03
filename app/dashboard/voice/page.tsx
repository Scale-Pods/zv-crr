import { fetchOutreach, fetchVapiCallLogs } from "@/lib/crr-data";
import { VoiceClient } from "./voice-client";

export default async function VoicePage() {
    const [outreach, vapiLogs] = await Promise.all([
        fetchOutreach(),
        fetchVapiCallLogs(),
    ]);
    return <VoiceClient outreach={outreach} vapiLogs={vapiLogs} />;
}
