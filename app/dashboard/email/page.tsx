import { fetchOutreach } from "@/lib/crr-data";
import { EmailClient } from "./email-client";

export default async function EmailPage() {
    const outreach = await fetchOutreach();
    return <EmailClient outreach={outreach} />;
}
