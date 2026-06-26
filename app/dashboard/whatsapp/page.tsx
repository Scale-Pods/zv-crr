import { fetchOutreach } from "@/lib/crr-data";
import { WhatsAppClient } from "./whatsapp-client";

export default async function WhatsAppPage() {
    const outreach = await fetchOutreach();
    return <WhatsAppClient outreach={outreach} />;
}
