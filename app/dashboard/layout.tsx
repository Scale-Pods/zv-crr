"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { 
    LayoutDashboard, Mail, MessageCircle, Mic, LogOut, ChevronDown, 
    BarChart3, Package, PanelLeftClose, PanelLeftOpen 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
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
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Persist sidebar state using localStorage
    useEffect(() => {
        setIsMounted(true);
        const stored = localStorage.getItem("sidebar-collapsed");
        if (stored === "true") {
            setIsCollapsed(true);
        }
    }, []);

    const toggleCollapse = () => {
        const next = !isCollapsed;
        setIsCollapsed(next);
        localStorage.setItem("sidebar-collapsed", String(next));
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[var(--bg-app)] text-[var(--label-primary)]">
            {/* Sidebar */}
            <aside 
                className={`hidden flex-col bg-[var(--glass-fill)] backdrop-blur-[30px] shadow-[var(--glass-shadow)] border-r border-[var(--separator)] md:flex font-sans transition-all duration-300 ease-in-out ${
                    isCollapsed ? 'w-[72px]' : 'w-64'
                }`}
            >
                {/* Header (Logo + Toggle Button) */}
                <div className={`p-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    {!isCollapsed && (
                        <Link href="/" className="relative w-36 h-10 block animate-in fade-in duration-300">
                            <Image
                                src="/zv_logo.webp"
                                alt="ZV Steels Logo"
                                fill
                                sizes="144px"
                                className="object-contain"
                                priority
                            />
                        </Link>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleCollapse}
                        className="h-8 w-8 text-[var(--label-secondary)] hover:text-[var(--label-primary)] hover:bg-[var(--glass-fill-hover)] rounded-lg transition-colors"
                        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                    </Button>
                </div>

                {/* Dashboard Switcher Dropdown */}
                <div className={`pb-2 ${isCollapsed ? 'px-2' : 'px-4'}`}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                suppressHydrationWarning
                                variant="outline"
                                className={`w-full bg-[var(--glass-fill)] backdrop-blur-[30px] border-[var(--separator)] text-[var(--label-primary)] hover:bg-[var(--glass-fill-hover)] h-10 shadow-[var(--glass-shadow)] transition-all duration-200 ${
                                    isCollapsed ? 'px-0 justify-center' : 'px-3 justify-between'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <LayoutDashboard className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                    {!isCollapsed && <span className="truncate">CRR Dashboard</span>}
                                </span>
                                {!isCollapsed && <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />}
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

                <div className={`py-2 ${isCollapsed ? 'px-2' : 'px-4'}`}>
                    <div className="h-[1px] w-full bg-[var(--separator)]" />
                </div>

                {/* Navigation Items */}
                <nav className={`flex-1 overflow-auto space-y-1.5 ${isCollapsed ? 'px-2' : 'px-4'}`}>
                    {sidebarItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== "/dashboard" && pathname.startsWith(item.href));
                        
                        const linkContent = (
                            <Link
                                href={item.href}
                                className={`group flex items-center transition-all duration-200 ${
                                    isCollapsed 
                                        ? "justify-center w-10 h-10 p-0 mx-auto" 
                                        : "gap-4 px-4 py-3 text-sm font-medium w-full"
                                } rounded-xl ${isActive
                                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-[var(--glass-shadow)] border border-blue-400/20"
                                    : "text-[var(--label-secondary)] hover:text-[var(--label-primary)] hover:bg-[var(--glass-fill-hover)]"
                                }`}
                            >
                                <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-white" : "text-[var(--label-tertiary)] group-hover:text-[var(--label-secondary)] transition-colors"}`} />
                                {!isCollapsed && <span>{item.title}</span>}
                            </Link>
                        );

                        if (isCollapsed && isMounted) {
                            return (
                                <TooltipProvider key={item.href} delayDuration={50}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            {linkContent}
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="bg-slate-900 text-white border-none px-3 py-1.5 text-xs font-semibold shadow-lg">
                                            {item.title}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        }

                        return <div key={item.href}>{linkContent}</div>;
                    })}
                </nav>

                {/* Logout Button */}
                <div className={`mt-auto mb-4 space-y-3 ${isCollapsed ? 'p-2' : 'p-4'}`}>
                    {(() => {
                        const logoutBtn = (
                            <Button
                                variant="ghost"
                                className={`text-[var(--label-secondary)] hover:text-red-500 hover:bg-rose-500/10 transition-colors duration-200 ${
                                    isCollapsed 
                                        ? "w-10 h-10 p-0 mx-auto justify-center rounded-xl" 
                                        : "w-full justify-start gap-2 rounded-xl"
                                }`}
                                onClick={async () => {
                                    await logout();
                                    router.push('/');
                                    router.refresh();
                                }}
                            >
                                <LogOut className="h-4 w-4 text-[var(--label-tertiary)] group-hover:text-red-500 transition-colors flex-shrink-0" />
                                {!isCollapsed && <span>Logout</span>}
                            </Button>
                        );

                        if (isCollapsed && isMounted) {
                            return (
                                <TooltipProvider delayDuration={50}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            {logoutBtn}
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="bg-rose-950 text-rose-200 border-none px-3 py-1.5 text-xs font-semibold shadow-lg">
                                            Logout
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        }

                        return logoutBtn;
                    })()}
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <header className="flex h-14 items-center gap-4 border-b border-[var(--separator)] bg-[var(--bg-layer1)]/80 backdrop-blur-[30px] px-6 lg:h-[60px]">
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
