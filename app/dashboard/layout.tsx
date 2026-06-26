"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Mail, MessageCircle, Mic, LogOut, ChevronDown, BarChart3, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/app/actions/auth";

const sidebarItems = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Predictions", href: "/dashboard/predictions", icon: BarChart3 },
    { title: "Outreach", href: "/dashboard/outreach", icon: Package },
    { title: "Voice", href: "/dashboard/voice", icon: Mic },
    { title: "Email", href: "/dashboard/email", icon: Mail },
    { title: "WhatsApp", href: "/dashboard/whatsapp", icon: MessageCircle },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    return (
        <div className="flex h-screen overflow-hidden bg-[var(--bg-app)] text-[var(--label-primary)]">
            {/* Sidebar */}
            <aside className="hidden w-64 flex-col bg-[var(--glass-fill)] backdrop-blur-[48px] shadow-[var(--glass-shadow)] border-r border-[var(--separator)] md:flex font-sans">
                {/* Logo */}
                <div className="p-6 pb-4 flex justify-center">
                    <Link href="/" className="relative w-48 h-16 block">
                        <Image
                            src="/zv_logo.webp"
                            alt="ZV Steels Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </Link>
                </div>

                <div className="px-4 pb-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                suppressHydrationWarning
                                variant="outline"
                                className="w-full justify-between bg-[var(--glass-fill)] backdrop-blur-[48px] border-[var(--separator)] text-[var(--label-primary)] hover:bg-[var(--glass-fill-hover)] h-10 shadow-[var(--glass-shadow)]"
                            >
                                <span className="flex items-center gap-2">
                                    <LayoutDashboard className="h-4 w-4 text-blue-600" />
                                    <span className="truncate">CRR Dashboard</span>
                                </span>
                                <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[220px]">
                            {sidebarItems.map((item) => (
                                <DropdownMenuItem key={item.href} onClick={() => router.push(item.href)}>
                                    <item.icon className="mr-2 h-4 w-4" /> {item.title}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="px-4 py-2">
                    <div className="h-[1px] w-full bg-[var(--separator)]" />
                </div>

                <nav className="flex-1 overflow-auto px-4 space-y-1">
                    {sidebarItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== "/dashboard" && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all ${isActive
                                    ? "bg-[var(--blue)] text-white shadow-[var(--glass-shadow)]"
                                    : "text-[var(--label-secondary)] hover:text-[var(--label-primary)] hover:bg-[var(--glass-fill-hover)]"
                                    }`}
                            >
                                <item.icon className={`h-5 w-5 ${isActive ? "text-white" : "text-[var(--label-tertiary)] group-hover:text-[var(--label-secondary)] transition-colors"}`} />
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto p-4 mb-4 space-y-3">
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 text-[var(--label-secondary)] hover:text-[var(--label-primary)] hover:bg-[var(--glass-fill-hover)]"
                        onClick={async () => {
                            await logout();
                            router.push('/');
                            router.refresh();
                        }}
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <header className="flex h-14 items-center gap-4 border-b border-[var(--separator)] bg-[var(--bg-layer1)]/80 backdrop-blur-[40px] px-6 lg:h-[60px]">
                    <div className="flex flex-1 items-center justify-between">
                        <h1 className="text-lg font-semibold text-[var(--label-primary)] flex items-center gap-2">
                            {sidebarItems.find(i => pathname === i.href || (i.href !== "/dashboard" && pathname.startsWith(i.href)))?.title || "Dashboard"}
                            <span style={{ fontSize: 10, background: "rgba(0, 122, 255, 0.08)", color: "var(--blue)", border: "1px solid rgba(0, 122, 255, 0.15)", padding: "2px 8px", borderRadius: 12, fontWeight: 600 }}>Powered by ScalePods</span>
                        </h1>
                    </div>
                </header>

                <main className="flex-1 overflow-auto bg-[var(--bg-app)] p-6 relative">
                    {children}
                </main>
            </div>
        </div>
    );
}
