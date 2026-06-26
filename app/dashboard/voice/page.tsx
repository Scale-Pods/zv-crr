import { fetchOutreach } from "@/lib/crr-data";
import { VoiceClient } from "./voice-client";

export default async function VoicePage() {
    const outreach = await fetchOutreach();
    return <VoiceClient outreach={outreach} />;
}
