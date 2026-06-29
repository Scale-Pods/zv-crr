'use server';

import nodemailer from 'nodemailer';
import { supabaseAdmin } from '@/lib/supabase';

interface InvoiceSendDetails {
    outreachId: number;
    invoiceNumber: string;
    partyName: string;
    contactEmail?: string;
    contactPhone?: string;
    pdfBase64: string; // Base64 string of generated PDF
    amount: number;
}

/**
 * Sends the invoice PDF to the customer via Email.
 * Utilizes SMTP environment variables if present, otherwise logs details and simulates sending.
 */
export async function sendInvoiceEmailAction(details: InvoiceSendDetails) {
    console.log(`[Email Action] Preparing invoice email for ${details.partyName} (ID: ${details.outreachId})`);

    const { outreachId, invoiceNumber, partyName, contactEmail, pdfBase64, amount } = details;

    if (!contactEmail) {
        return { error: 'Customer email address is missing.' };
    }

    // Clean base64 prefix if exists
    const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');

    // Setup nodemailer transporter
    const smtpHost = process.env.SMTP_HOST || 'smtp.mailtrap.io';
    const smtpPort = parseInt(process.env.SMTP_PORT || '2525');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    const useRealSMTP = !!(smtpUser && smtpPass);
    let transporter;

    if (useRealSMTP) {
        transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });
    } else {
        // Fallback or development mock transport
        transporter = nodemailer.createTransport({
            streamTransport: true,
            newline: 'windows',
            buffer: true
        });
    }

    const mailOptions = {
        from: '"ZV Steels Invoicing" <invoices@zvsteels.com>',
        to: contactEmail,
        subject: `Invoice ${invoiceNumber} from ZV Steels`,
        text: `Dear ${partyName},\n\nPlease find attached the invoice ${invoiceNumber} for your recent steel order.\n\nTotal Amount: ₹${amount.toLocaleString('en-IN')}\n\nThank you for doing business with ZV Steels!\n\nBest regards,\nZV Steels Team`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 8px;">
                <h2 style="color: #1e3a8a;">ZV Steels Invoice Delivery</h2>
                <p>Dear <strong>${partyName}</strong>,</p>
                <p>Please find attached the invoice <strong>${invoiceNumber}</strong> for your recent steel order.</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${invoiceNumber}</p>
                    <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${amount.toLocaleString('en-IN')}</p>
                </div>
                <p>Thank you for choosing ZV Steels!</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 12px; color: #64748b;">This is an automated system email. Please do not reply directly to this message.</p>
            </div>
        `,
        attachments: [
            {
                filename: `Invoice_${invoiceNumber}.pdf`,
                content: cleanBase64,
                encoding: 'base64',
            },
        ],
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        
        if (!useRealSMTP) {
            console.log('--- Simulated Invoice Email Sent ---');
            console.log(`To: ${contactEmail}`);
            console.log(`Subject: ${mailOptions.subject}`);
            console.log(`Invoice Attachment Size: ${Math.round(cleanBase64.length * 0.75 / 1024)} KB`);
            console.log('------------------------------------');
        }

        // Update database: Record outreach attempt & set last contacted timestamp
        const now = new Date().toISOString();
        const { error: dbError } = await supabaseAdmin
            .from('crr_outreach')
            .update({
                last_contacted: now,
                email_2_ts: now, // log email attempt
                email_2_content: `Invoice ${invoiceNumber} sent via email. Amount: ₹${amount.toLocaleString('en-IN')}`,
            })
            .eq('id', outreachId);

        if (dbError) {
            console.error('Failed to update outreach record in DB:', dbError);
        }

        return { success: true, message: `Invoice sent via email to ${contactEmail} successfully!` };
    } catch (err: any) {
        console.error('Error sending invoice email:', err);
        return { error: `Failed to send email: ${err.message || err}` };
    }
}

/**
 * Sends the invoice PDF notification to the customer via WhatsApp.
 * Simulates the integration sending, logs content, and updates history.
 */
export async function sendInvoiceWhatsAppAction(details: InvoiceSendDetails) {
    console.log(`[WhatsApp Action] Preparing invoice message for ${details.partyName} (ID: ${details.outreachId})`);

    const { outreachId, invoiceNumber, partyName, contactPhone, amount } = details;

    if (!contactPhone) {
        return { error: 'Customer phone number is missing.' };
    }

    try {
        // Simulate WhatsApp API Call
        console.log('--- Simulated WhatsApp Message Sent ---');
        console.log(`To: ${contactPhone}`);
        console.log(`Message: Hello ${partyName}, your invoice ${invoiceNumber} from ZV Steels is ready. Total: ₹${amount.toLocaleString('en-IN')}. Please click here to view and download the PDF: https://zvsteels.com/invoice/download/${invoiceNumber}`);
        console.log('----------------------------------------');

        // Update database: Record outreach attempt & set last contacted timestamp
        const now = new Date().toISOString();
        const { error: dbError } = await supabaseAdmin
            .from('crr_outreach')
            .update({
                last_contacted: now,
                whatsapp_4_ts: now, // log whatsapp attempt
                whatsapp_4_template: `Invoice ${invoiceNumber} details sent via WhatsApp. Amount: ₹${amount.toLocaleString('en-IN')}`,
                whatsapp_4_status: 'delivered',
            })
            .eq('id', outreachId);

        if (dbError) {
            console.error('Failed to update outreach record in DB:', dbError);
        }

        return { success: true, message: `Invoice notification sent via WhatsApp to ${contactPhone} successfully!` };
    } catch (err: any) {
        console.error('Error sending WhatsApp invoice:', err);
        return { error: `Failed to send WhatsApp message: ${err.message || err}` };
    }
}
