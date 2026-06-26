import { fetchOutreach } from "@/lib/crr-data";
import { OutreachClient } from "./outreach-client";

export default async function OutreachPage() {
    const outreach = await fetchOutreach();
    return <OutreachClient outreach={outreach} />;
}
