'use server';

/**
 * Outreach Server Actions
 */

export async function logOutreachAction(outreachId: number, details: any) {
    console.log(`[Outreach Action] Logging outreach action for ID: ${outreachId}`, details);
    return { success: true };
}

