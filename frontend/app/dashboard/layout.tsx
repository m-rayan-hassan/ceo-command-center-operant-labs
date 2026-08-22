"use client";

import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Bell, 
  Users, 
  CreditCard, 
  Briefcase, 
  Cog, 
  Lightbulb, 
  Bot,
  Shield,
  Settings,
  LogOut,
} from "lucide-react";

const SIDEBAR_SECTIONS = [
  {
    title: "1. COMMAND",
    items: [
      { name: "Command Center", href: "/dashboard", icon: LayoutDashboard },
      { name: "Approvals", href: "/dashboard/approvals", icon: CheckSquare },
      { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
    ],
  },
  {
    title: "2. MODULES",
    items: [
      { name: "Enterprise CRM", href: "#", icon: Users, comingSoon: true },
      { name: "Finance & Billing", href: "https://operant-labs-billing-platform.vercel.app/", icon: CreditCard },
      { name: "Enterprise HRMS", href: "#", icon: Briefcase, comingSoon: true },
      { name: "Operations & Delivery", href: "#", icon: Cog, comingSoon: true },
      { name: "Knowledge & AI Center", href: "#", icon: Lightbulb, comingSoon: true },
      { name: "AI Workforce", href: "#", icon: Bot, comingSoon: true },
    ],
  },
  {
    title: "3. SYSTEM",
    items: [
      { name: "Access & roles", href: "#", icon: Shield, comingSoon: true },
      { name: "Settings", href: "#", icon: Settings, comingSoon: true },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();

  if (loading || !user) return null; // handled by AuthContext redirect

  return (
    <div className="flex h-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col bg-[var(--surface)] border-r border-[var(--border-subtle)] shrink-0">
        <div className="p-6 border-b border-[var(--border-subtle)]">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-14 h-14">
              <Image src="/logo.png" alt="Operant OS" width={56} height={56} className="object-contain" />
            </div>
            <div>
              <h1 className="font-bold tracking-tight text-lg leading-tight">Operant OS</h1>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-electric-cyan)] bg-[var(--color-electric-cyan)]/10 px-2 py-0.5 rounded-full inline-block mt-1">
                Executive OS
              </span>
            </div>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar py-6 px-4 space-y-8">
          {SIDEBAR_SECTIONS.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-[11px] font-semibold text-[var(--foreground-variant)] tracking-[0.2em] mb-3 px-2">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item, itemIdx) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={itemIdx}>
                      {item.comingSoon ? (
                        <div className="flex items-center justify-between px-2 py-2 text-sm text-[var(--foreground-variant)] opacity-60 cursor-not-allowed">
                          <div className="flex items-center gap-3">
                            <item.icon className="w-4 h-4" />
                            <span>{item.name}</span>
                          </div>
                          <span className="text-[9px] uppercase tracking-wider bg-[var(--surface-dim)] px-1.5 py-0.5 rounded">Soon</span>
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          className={`flex items-center gap-3 px-2 py-2 text-sm rounded-lg transition-all ${
                            isActive
                              ? "bg-[var(--card-hover)] text-[var(--foreground)] font-medium"
                              : "text-[var(--foreground-variant)] hover:bg-[var(--card-hover)] hover:text-[var(--foreground)]"
                          }`}
                        >
                          <item.icon className={`w-4 h-4 ${isActive ? "text-[var(--foreground)]" : ""}`} />
                          <span>{item.name}</span>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[var(--foreground-variant)]/20 flex items-center justify-center text-xs font-medium text-[var(--foreground)]">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate text-[var(--foreground)]">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-2 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[var(--background)]">
        {children}
      </main>
    </div>
  );
}
