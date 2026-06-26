import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "ZV Steels | AI Automation",
    description: "AI-Powered Marketing & Operations managed by ScalePods",
    icons: {
        icon: '/zv_logo.webp',
        shortcut: '/zv_logo.webp',
        apple: '/zv_logo.webp',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning className="dark">
            <body className="font-sans antialiased">{children}</body>
        </html>
    );
}
