"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Mail, Send, CheckCircle, Loader2, Maximize2, Minimize2 } from "lucide-react";
import type { CRROutreach, CRRPrediction } from "@/lib/crr-data";
import { sendInvoiceEmailAction, sendInvoiceWhatsAppAction } from "@/app/actions/outreach-actions";

interface InvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    record: CRROutreach;
    prediction?: CRRPrediction;
    onSuccess?: (msg: string) => void;
}

export function InvoiceModal({ isOpen, onClose, record, prediction, onSuccess }: InvoiceModalProps) {
    const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);

    // Generate default invoice numbers & dates
    const initialInvNumber = `INV-2026-${String(record.id).padStart(4, "0")}`;
    const todayStr = new Date().toISOString().split("T")[0];
    const defaultDueStr = record.predicted_order_date
        ? new Date(record.predicted_order_date).toISOString().split("T")[0]
        : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Form states
    const [invoiceNo, setInvoiceNo] = useState(initialInvNumber);
    const [invoiceDate, setInvoiceDate] = useState(todayStr);
    const [dueDate, setDueDate] = useState(defaultDueStr);
    
    // Client states
    const [partyName, setPartyName] = useState(record.party_name);
    const [contactPerson, setContactPerson] = useState(record.contact_person || "");
    const [phone, setPhone] = useState(record.phone || "");
    const [email, setEmail] = useState(record.email || "");

    // Order states (Do not consider product lines, just use a generic editable description)
    const [itemDesc, setItemDesc] = useState("High-Grade Structural Steel / TMT Bars");
    const [quantity, setQuantity] = useState<number>(prediction?.predicted_order_qty_mt || 15);
    const [unitPrice, setUnitPrice] = useState<number>(55000); // Default ₹55,000 per MT
    const [taxRate, setTaxRate] = useState<number>(18); // Default 18% GST

    // Terms
    const [terms, setTerms] = useState(
        "1. Payments should be made to ZV Steels Ltd bank account.\n2. 50% advance payment required; balance upon delivery.\n3. Goods once sold cannot be returned."
    );

    // Calculated fields
    const subtotal = quantity * unitPrice;
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    // Loading states
    const [isEmailSending, setIsEmailSending] = useState(false);
    const [isWhatsAppSending, setIsWhatsAppSending] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    // Dynamic reset when record changes
    useEffect(() => {
        if (record) {
            setInvoiceNo(`INV-2026-${String(record.id).padStart(4, "0")}`);
            setPartyName(record.party_name);
            setContactPerson(record.contact_person || "");
            setPhone(record.phone || "");
            setEmail(record.email || "");
            setQuantity(prediction?.predicted_order_qty_mt || 15);
        }
    }, [record, prediction]);

    // Helper to get Base64 format of the ZV Logo to include in PDF
    const getLogoBase64 = (): Promise<string> => {
        return new Promise((resolve) => {
            const img = new window.Image();
            img.crossOrigin = "anonymous";
            img.src = "/zv_logo.webp";
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    // Create solid white background behind logo
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL("image/png"));
                } else {
                    resolve("");
                }
            };
            img.onerror = () => resolve("");
        });
    };

    // Main PDF Generation function
    const generatePdfInstance = async () => {
        const { default: jsPDF } = await import("jspdf");
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        // Add White Page background
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, 210, 297, "F");

        // Try adding ZV Logo
        const logoData = await getLogoBase64();
        if (logoData) {
            // Keep Aspect ratio (normally w-36 h-10 is approx 3.6:1 ratio)
            doc.addImage(logoData, "PNG", 15, 15, 45, 12.5);
        } else {
            // Text Fallback Logo
            doc.setFont("helvetica", "bold");
            doc.setFontSize(22);
            doc.setTextColor(30, 58, 138); // blue-900
            doc.text("ZV STEELS", 15, 22);
        }

        // Invoice Header Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(26);
        doc.setTextColor(30, 58, 138); // blue-900
        doc.text("INVOICE", 195, 24, { align: "right" });

        // Horizontal Line
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.5);
        doc.line(15, 33, 195, 33);

        // Metadata block (Invoice #, Dates)
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // slate-500

        doc.text(`Invoice No:`, 140, 42);
        doc.text(`Date:`, 140, 47);
        doc.text(`Due Date:`, 140, 52);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text(invoiceNo, 168, 42);
        doc.text(new Date(invoiceDate).toLocaleDateString("en-IN"), 168, 47);
        doc.text(new Date(dueDate).toLocaleDateString("en-IN"), 168, 52);

        // Company Details (From)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text("ZV Steels Limited", 15, 42);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text("Industrial Area, Plot 42-B", 15, 47);
        doc.text("Mumbai, MH, 400051", 15, 51);
        doc.text("Email: sales@zvsteels.com", 15, 55);

        // Client Details (Bill To)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text("Bill To:", 15, 68);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(partyName, 15, 73);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        if (contactPerson) doc.text(`Attn: ${contactPerson}`, 15, 78);
        doc.text(`Phone: ${phone}`, 15, 83);
        doc.text(`Email: ${email}`, 15, 87);

        // Draw Table Header
        const tableY = 96;
        doc.setFillColor(30, 58, 138); // blue-900
        doc.rect(15, tableY, 180, 8, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(255, 255, 255);
        doc.text("Item Description", 18, tableY + 5.5);
        doc.text("Qty (MT)", 105, tableY + 5.5, { align: "right" });
        doc.text("Unit Price", 145, tableY + 5.5, { align: "right" });
        doc.text("Amount", 192, tableY + 5.5, { align: "right" });

        // Draw Table Row
        const rowY = tableY + 8;
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(15, rowY, 180, 10, "F");

        // Row boundary line
        doc.setDrawColor(241, 245, 249); // slate-100
        doc.line(15, rowY + 10, 195, rowY + 10);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(itemDesc, 18, rowY + 6.5);
        doc.text(quantity.toString(), 105, rowY + 6.5, { align: "right" });
        doc.text(`INR ${unitPrice.toLocaleString("en-IN")}`, 145, rowY + 6.5, { align: "right" });
        doc.text(`INR ${subtotal.toLocaleString("en-IN")}`, 192, rowY + 6.5, { align: "right" });

        // Totals Section
        const totalsY = rowY + 22;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(100, 116, 139);

        doc.text("Subtotal:", 140, totalsY);
        doc.text(`GST (${taxRate}%):`, 140, totalsY + 6);
        
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(`INR ${subtotal.toLocaleString("en-IN")}`, 192, totalsY, { align: "right" });
        doc.text(`INR ${taxAmount.toLocaleString("en-IN")}`, 192, totalsY + 6, { align: "right" });

        // Total Line
        doc.setDrawColor(30, 58, 138);
        doc.setLineWidth(0.5);
        doc.line(135, totalsY + 10, 195, totalsY + 10);

        doc.setFontSize(11);
        doc.setTextColor(30, 58, 138);
        doc.text("Grand Total:", 140, totalsY + 16);
        doc.text(`INR ${totalAmount.toLocaleString("en-IN")}`, 192, totalsY + 16, { align: "right" });

        // Terms and Notes
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text("Terms & Conditions:", 15, totalsY + 30);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        const splitTerms = doc.splitTextToSize(terms, 110);
        doc.text(splitTerms, 15, totalsY + 35);

        // Signatures
        const sigY = totalsY + 65;
        doc.setDrawColor(203, 213, 225); // slate-300
        doc.setLineWidth(0.3);
        doc.line(140, sigY, 195, sigY);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text("Authorized Signatory", 168, sigY + 5, { align: "center" });

        return doc;
    };

    // Action: Local Download
    const handleDownload = async () => {
        setIsGeneratingPdf(true);
        try {
            const doc = await generatePdfInstance();
            doc.save(`Invoice_${invoiceNo}.pdf`);
        } catch (err) {
            console.error("PDF generation failed:", err);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    // Action: Send via Email
    const handleSendEmail = async () => {
        setIsEmailSending(true);
        try {
            const doc = await generatePdfInstance();
            // Get base64 representation of PDF
            const pdfBase64 = doc.output("datauristring");

            const res = await sendInvoiceEmailAction({
                outreachId: record.id,
                invoiceNumber: invoiceNo,
                invoiceDate,
                dueDate,
                partyName,
                contactPerson,
                contactEmail: email,
                contactPhone: phone,
                itemDesc,
                quantity,
                unitPrice,
                taxRate,
                subtotal,
                taxAmount,
                amount: totalAmount,
                terms,
                pdfBase64,
            });

            if (res.error) {
                alert(`Error: ${res.error}`);
            } else {
                if (onSuccess) onSuccess(res.message || "Email sent successfully!");
                onClose();
            }
        } catch (err) {
            console.error("Email send failed:", err);
            alert("An error occurred while preparing or sending the invoice.");
        } finally {
            setIsEmailSending(false);
        }
    };

    // Action: Send via WhatsApp
    const handleSendWhatsApp = async () => {
        setIsWhatsAppSending(true);
        try {
            const doc = await generatePdfInstance();
            const pdfBase64 = doc.output("datauristring");

            const res = await sendInvoiceWhatsAppAction({
                outreachId: record.id,
                invoiceNumber: invoiceNo,
                invoiceDate,
                dueDate,
                partyName,
                contactPerson,
                contactEmail: email,
                contactPhone: phone,
                itemDesc,
                quantity,
                unitPrice,
                taxRate,
                subtotal,
                taxAmount,
                amount: totalAmount,
                terms,
                pdfBase64,
            });

            if (res.error) {
                alert(`Error: ${res.error}`);
            } else {
                if (onSuccess) onSuccess(res.message || "WhatsApp message sent!");
                onClose();
            }
        } catch (err) {
            console.error("WhatsApp send failed:", err);
            alert("An error occurred while preparing or sending the WhatsApp invoice.");
        } finally {
            setIsWhatsAppSending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 bg-zinc-950 border-white/10 text-white overflow-hidden rounded-2xl shadow-2xl">
                <DialogHeader className="p-5 border-b border-white/10 flex-shrink-0">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-blue-400">
                        📄 Invoice Manager — {partyName}
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400 text-xs">
                        Edit order parameters and invoice metadata. Preview dynamically before sending the generated PDF.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden min-h-0">
                    {/* Left Panel: Invoice Editor Form */}
                    <div className={`w-1/2 p-6 overflow-y-auto border-r border-white/10 space-y-6 transition-all duration-300 ${
                        isPreviewExpanded ? "hidden opacity-0 w-0 p-0 border-r-0" : "opacity-100"
                    }`}>
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Invoice Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="invoiceNo" className="text-zinc-300 text-xs">Invoice Number</Label>
                                    <Input id="invoiceNo" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className="bg-zinc-900 border-white/10 text-white text-xs h-9 focus:ring-blue-500" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="taxRate" className="text-zinc-300 text-xs">GST Rate (%)</Label>
                                    <Input id="taxRate" type="number" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} className="bg-zinc-900 border-white/10 text-white text-xs h-9" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="invoiceDate" className="text-zinc-300 text-xs">Invoice Date</Label>
                                    <Input id="invoiceDate" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="bg-zinc-900 border-white/10 text-white text-xs h-9" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="dueDate" className="text-zinc-300 text-xs">Due Date</Label>
                                    <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-zinc-900 border-white/10 text-white text-xs h-9" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Bill To Customer</h3>
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="custName" className="text-zinc-300 text-xs">Customer/Party Name</Label>
                                    <Input id="custName" value={partyName} onChange={(e) => setPartyName(e.target.value)} className="bg-zinc-900 border-white/10 text-white text-xs h-9" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="contactPerson" className="text-zinc-300 text-xs">Contact Person</Label>
                                        <Input id="contactPerson" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="bg-zinc-900 border-white/10 text-white text-xs h-9" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="custPhone" className="text-zinc-300 text-xs">Phone Number</Label>
                                        <Input id="custPhone" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-zinc-900 border-white/10 text-white text-xs h-9" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="custEmail" className="text-zinc-300 text-xs">Email Address</Label>
                                    <Input id="custEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-zinc-900 border-white/10 text-white text-xs h-9" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Line Item</h3>
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="itemDesc" className="text-zinc-300 text-xs">Product Description</Label>
                                    <Input id="itemDesc" value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} className="bg-zinc-900 border-white/10 text-white text-xs h-9" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="qty" className="text-zinc-300 text-xs">Quantity (MT)</Label>
                                        <Input id="qty" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="bg-zinc-900 border-white/10 text-white text-xs h-9" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="price" className="text-zinc-300 text-xs">Unit Price (INR/MT)</Label>
                                        <Input id="price" type="number" value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value))} className="bg-zinc-900 border-white/10 text-white text-xs h-9" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Notes & Terms</h3>
                            <div className="space-y-1.5">
                                <textarea
                                    value={terms}
                                    onChange={(e) => setTerms(e.target.value)}
                                    rows={3}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Live Invoice Visual Preview */}
                    <div className={`p-6 bg-zinc-900 overflow-y-auto flex flex-col justify-start transition-all duration-300 ${
                        isPreviewExpanded ? "w-full" : "w-1/2"
                    }`}>
                        <div className="flex items-center justify-between mb-3 flex-shrink-0">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Live Invoice Preview</span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                                    className="h-6 text-[10px] text-zinc-400 hover:text-white hover:bg-white/10 px-2 py-0.5 rounded gap-1 flex items-center bg-zinc-800 border border-white/5"
                                >
                                    {isPreviewExpanded ? (
                                        <>
                                            <Minimize2 className="h-3 w-3 text-blue-400" />
                                            <span>Show Editor</span>
                                        </>
                                    ) : (
                                        <>
                                            <Maximize2 className="h-3 w-3 text-blue-400" />
                                            <span>Expand Preview</span>
                                        </>
                                    )}
                                </Button>
                                <span className="text-[10px] text-zinc-400 bg-zinc-800 border border-white/5 px-2 py-0.5 rounded">A4 PDF Aspect</span>
                            </div>
                        </div>

                        {/* Invoice A4 Sheet Mockup */}
                        <div className={`bg-white text-slate-800 rounded-lg shadow-2xl flex-1 flex flex-col justify-between border border-zinc-200 font-sans transition-all duration-300 ${
                            isPreviewExpanded 
                                ? "max-w-2xl w-full mx-auto p-10 text-xs min-h-[750px] my-4" 
                                : "p-6 text-[11px]"
                        }`}>
                            {/* Header Section */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className={`relative transition-all duration-300 ${isPreviewExpanded ? 'w-36 h-10' : 'w-28 h-8'}`}>
                                        <Image
                                            src="/zv_logo.webp"
                                            alt="ZV Steels Logo"
                                            fill
                                            className="object-contain object-left"
                                        />
                                    </div>
                                    <h1 className={`font-black text-blue-900 tracking-tight uppercase transition-all duration-300 ${isPreviewExpanded ? 'text-2xl' : 'text-xl'}`}>Invoice</h1>
                                </div>

                                <div className="h-[1px] bg-slate-200 w-full" />

                                <div className={`flex justify-between items-start text-slate-500 transition-all duration-300 ${isPreviewExpanded ? 'text-[11px]' : 'text-[9px]'}`}>
                                    <div>
                                        <h3 className={`font-bold text-slate-800 transition-all duration-300 ${isPreviewExpanded ? 'text-xs' : 'text-[10px]'}`}>ZV Steels Limited</h3>
                                        <p>Industrial Area, Plot 42-B</p>
                                        <p>Mumbai, MH, 400051</p>
                                        <p>sales@zvsteels.com</p>
                                    </div>
                                    <div className="text-right">
                                        <p><span className="font-semibold text-slate-800">Invoice No:</span> <span className="font-bold text-slate-900">{invoiceNo}</span></p>
                                        <p><span className="font-semibold text-slate-800">Date:</span> {new Date(invoiceDate).toLocaleDateString("en-IN")}</p>
                                        <p><span className="font-semibold text-slate-800">Due Date:</span> {new Date(dueDate).toLocaleDateString("en-IN")}</p>
                                    </div>
                                </div>

                                <div className={`flex flex-col gap-1 text-slate-500 transition-all duration-300 ${isPreviewExpanded ? 'text-[11px]' : 'text-[9px]'}`}>
                                    <h3 className={`font-bold text-slate-800 transition-all duration-300 ${isPreviewExpanded ? 'text-xs' : 'text-[10px]'}`}>Bill To:</h3>
                                    <p className="font-bold text-slate-800">{partyName}</p>
                                    {contactPerson && <p>Attn: {contactPerson}</p>}
                                    <p>Phone: {phone}</p>
                                    <p>Email: {email}</p>
                                </div>

                                {/* Table Mockup */}
                                <div className="mt-4 overflow-hidden rounded border border-slate-200">
                                    <table className={`w-full text-left border-collapse transition-all duration-300 ${isPreviewExpanded ? 'text-[11px]' : 'text-[9px]'}`}>
                                        <thead>
                                            <tr className="bg-blue-900 text-white font-bold">
                                                <th className={`w-1/2 transition-all duration-300 ${isPreviewExpanded ? 'px-4 py-2.5' : 'px-3 py-1.5'}`}>Description</th>
                                                <th className={`text-right transition-all duration-300 ${isPreviewExpanded ? 'px-4 py-2.5' : 'px-3 py-1.5'}`}>Qty (MT)</th>
                                                <th className={`text-right transition-all duration-300 ${isPreviewExpanded ? 'px-4 py-2.5' : 'px-3 py-1.5'}`}>Unit Price</th>
                                                <th className={`text-right transition-all duration-300 ${isPreviewExpanded ? 'px-4 py-2.5' : 'px-3 py-1.5'}`}>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="bg-slate-50 border-b border-slate-100">
                                                <td className={`font-medium transition-all duration-300 ${isPreviewExpanded ? 'px-4 py-3' : 'px-3 py-2'}`}>{itemDesc}</td>
                                                <td className={`text-right transition-all duration-300 ${isPreviewExpanded ? 'px-4 py-3' : 'px-3 py-2'}`}>{quantity}</td>
                                                <td className={`text-right transition-all duration-300 ${isPreviewExpanded ? 'px-4 py-3' : 'px-3 py-2'}`}>₹{unitPrice.toLocaleString("en-IN")}</td>
                                                <td className={`text-right font-bold transition-all duration-300 ${isPreviewExpanded ? 'px-4 py-3' : 'px-3 py-2'}`}>₹{subtotal.toLocaleString("en-IN")}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Calculations */}
                                <div className="flex justify-end mt-4">
                                    <div className={`w-48 text-right space-y-1 transition-all duration-300 ${isPreviewExpanded ? 'text-[11px]' : 'text-[9px]'}`}>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Subtotal:</span>
                                            <span className="font-medium">₹{subtotal.toLocaleString("en-IN")}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">GST ({taxRate}%):</span>
                                            <span className="font-medium">₹{taxAmount.toLocaleString("en-IN")}</span>
                                        </div>
                                        <div className="h-[1px] bg-slate-200 my-1" />
                                        <div className={`flex justify-between font-bold text-blue-900 transition-all duration-300 ${isPreviewExpanded ? 'text-[13px]' : 'text-[11px]'}`}>
                                            <span>Grand Total:</span>
                                            <span>₹{totalAmount.toLocaleString("en-IN")}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Terms and Signatures */}
                            <div className={`flex justify-between items-end mt-8 pt-4 border-t border-slate-100 text-slate-400 transition-all duration-300 ${isPreviewExpanded ? 'text-[10px]' : 'text-[8px]'}`}>
                                <div className="max-w-[200px]">
                                    <h4 className={`font-bold text-slate-600 mb-1 transition-all duration-300 ${isPreviewExpanded ? 'text-xs' : 'text-[9px]'}`}>Terms & Conditions:</h4>
                                    <p className="whitespace-pre-line leading-relaxed">{terms}</p>
                                </div>
                                <div className="text-center w-36">
                                    <div className="h-6" />
                                    <div className={`border-t border-slate-300 pt-1 transition-all duration-300 ${isPreviewExpanded ? 'text-xs' : 'text-[9px]'}`}>
                                        <p className="text-slate-600">Authorized Signatory</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Controls: Dispatch Options */}
                <div className="p-4 border-t border-white/10 bg-zinc-950 flex-shrink-0 flex items-center justify-between gap-4">
                    <Button
                        variant="outline"
                        onClick={handleDownload}
                        disabled={isGeneratingPdf}
                        className="bg-zinc-900 hover:bg-zinc-800 border-white/10 hover:text-white text-zinc-300 text-xs gap-2 rounded-xl h-10 px-4 transition-colors"
                    >
                        {isGeneratingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5 text-blue-400" />}
                        Download Local PDF
                    </Button>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="bg-transparent hover:bg-white/5 border-white/10 text-zinc-300 text-xs rounded-xl h-10 px-4 transition-colors"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSendWhatsApp}
                            disabled={isWhatsAppSending || !phone}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-2 rounded-xl h-10 px-4 transition-colors"
                        >
                            {isWhatsAppSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                            Send via WhatsApp
                        </Button>
                        <Button
                            onClick={handleSendEmail}
                            disabled={isEmailSending || !email}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs gap-2 rounded-xl h-10 px-4 transition-colors"
                        >
                            {isEmailSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                            Send via Email
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
