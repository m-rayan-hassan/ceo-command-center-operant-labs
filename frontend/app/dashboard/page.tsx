"use client";

import { useEffect, useState } from "react";
import api from "../../lib/api";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { DollarSign, ArrowUpRight, ArrowDownRight, Clock, Activity, Loader2, CheckCircle2, XCircle, ChevronRight, Users, CreditCard, Briefcase, Cog, Lightbulb, Bot, ExternalLink, Calendar } from "lucide-react";
import { useCallback } from "react";

const MODULES = [
  {
    name: "Enterprise CRM",
    icon: Users,
    description: "Customer relationships, pipeline and sales activity across every deal.",
    status: "coming-soon",
    href: "#",
  },
  {
    name: "Finance & Billing",
    icon: CreditCard,
    description: "Invoicing, collections, recurring revenue and financial operations.",
    status: "available",
    href: "https://operant-labs-billing-platform.vercel.app/",
  },
  {
    name: "Enterprise HRMS",
    icon: Briefcase,
    description: "People, payroll, talent and workforce management tools.",
    status: "coming-soon",
    href: "#",
  },
  {
    name: "Operations & Delivery",
    icon: Cog,
    description: "Project execution, delivery pipelines and operational workflows.",
    status: "coming-soon",
    href: "#",
  },
  {
    name: "Knowledge & AI Center",
    icon: Lightbulb,
    description: "Company knowledge, insights and AI-assisted decision support.",
    status: "coming-soon",
    href: "#",
  },
  {
    name: "AI Workforce",
    icon: Bot,
    description: "Deploy and manage autonomous agents across your workflows.",
    status: "coming-soon",
    href: "#",
  },
];

interface Stats {
  monthlyRevenue: number;
  prevMonthRevenue: number;
  annualRecurring: number;
  prevYearRecurring: number;
  outstanding: number;
  collectedMTD: number;
  totalCollected: number;
  overdueCount: number;
  pendingCount: number;
  totalInvoices: number;
}

interface Approval {
  id: string;
  from: string;
  subject: string;
  body: string;
  status: string;
  threadId: string | null;
  messageId: string | null;
  messageId: string | null;
  createdAt: string;
}

interface Meeting {
  id: string;
  meetingDateAndTime: string;
  meetingDescription: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [briefing, setBriefing] = useState<{ briefing: string, createdAt: string } | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsRes = await api.get("/dashboard/stats");
        setStats(statsRes.data);

        try {
          const briefingRes = await api.get("/dashboard/briefing");
          setBriefing(briefingRes.data);
        } catch (bErr) {
          console.error("Failed to fetch briefing", bErr);
        }

        try {
          const approvalsRes = await api.get("/approvals");
          setApprovals(approvalsRes.data);
        } catch (aErr) {
          console.error("Failed to fetch approvals", aErr);
        }

        try {
          const meetingsRes = await api.get("/meetings/today");
          setMeetings(meetingsRes.data);
        } catch (mErr) {
          console.error("Failed to fetch meetings", mErr);
        }

        setError(null);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
        setError("Failed to load dashboard data. Ensure the billing platform backend is running.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    const REFRESH_INTERVAL = 30000;
    const intervalId = setInterval(fetchDashboardData, REFRESH_INTERVAL);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchDashboardData();
    };
    const handleFocus = () => fetchDashboardData();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return "$0.00";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  };

  const getChangePct = (current: number, previous: number): number | null => {
    if (previous <= 0) return current > 0 ? null : 0;
    return ((current - previous) / previous) * 100;
  };

  const pctMonthly = getChangePct(stats?.monthlyRevenue ?? 0, stats?.prevMonthRevenue ?? 0);
  const pctAnnual = getChangePct(stats?.annualRecurring ?? 0, stats?.prevYearRecurring ?? 0);

  const renderDelta = (pct: number | null, periodLabel: string) => {
    if (pct === null) {
      return (
        <span className="text-green-500 flex items-center gap-1">
          <ArrowUpRight className="h-3 w-3" /> New this {periodLabel}
        </span>
      );
    }
    const up = pct >= 0;
    return (
      <span className={`flex items-center gap-1 ${up ? "text-green-500" : "text-red-500"}`}>
        {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {up ? "+" : ""}{pct.toFixed(1)}% {periodLabel === "month" ? "from last month" : "from last year"}
      </span>
    );
  };

  const handleApprovalAction = useCallback(async (id: string, status: 'approved' | 'rejected') => {
    // Optimistic update
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    try {
      await api.patch(`/approvals/${id}`, { status });
    } catch (err) {
      console.error('Failed to update approval', err);
      // Revert on failure
      setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: 'pending' } : a));
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-[var(--foreground-variant)]" />
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  const latestPending = approvals.filter(a => a.status === 'pending').slice(0, 5);

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="section-number">Overview</div>
          <h1 className="text-3xl font-bold tracking-tight">Executive Command Center</h1>
        </div>
      </div>

      <div className="glass-card p-5 mb-6 bg-[var(--surface-dim)]/30 border-[var(--border-strong)]">
        <h2 className="text-lg font-bold mb-2">{greeting}, CEO</h2>
        <div className="text-[var(--foreground-variant)] text-sm leading-snug prose prose-sm prose-invert max-w-none prose-headings:font-semibold prose-headings:text-[var(--foreground)] prose-h3:text-base prose-h3:mt-3 prose-h3:mb-1 prose-p:mt-0 prose-p:mb-2 prose-ul:my-1 prose-li:my-0 prose-strong:font-medium prose-a:text-blue-400">
          {briefing ? (
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
              {briefing.briefing.replace(/\\n/g, '\n')}
            </ReactMarkdown>
          ) : (
            <p className="italic text-sm opacity-75 m-0">No new briefings at this time.</p>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-current" />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Revenue */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--foreground-variant)]">Monthly Revenue</h3>
            <div className="p-2 bg-[var(--surface-dim)] rounded-md">
              <DollarSign className="h-4 w-4 text-[var(--foreground)]" />
            </div>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(stats?.monthlyRevenue || 0)}</div>
          <div className="text-xs text-[var(--foreground-variant)] mt-2 flex items-center gap-1">
            {renderDelta(pctMonthly, "month")}
          </div>
        </div>

        {/* ARR */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--foreground-variant)]">Annual Recurring</h3>
            <div className="p-2 bg-[var(--surface-dim)] rounded-md">
              <Activity className="h-4 w-4 text-[var(--color-electric-cyan)]" />
            </div>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(stats?.annualRecurring || 0)}</div>
          <div className="text-xs text-[var(--foreground-variant)] mt-2 flex items-center gap-1">
            {renderDelta(pctAnnual, "year")}
          </div>
        </div>

        {/* Outstanding */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--foreground-variant)]">Outstanding</h3>
            <div className="p-2 bg-[var(--surface-dim)] rounded-md">
              <Clock className="h-4 w-4 text-orange-500" />
            </div>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(stats?.outstanding || 0)}</div>
          <div className="text-xs text-[var(--foreground-variant)] mt-2">
            {stats?.overdueCount ?? 0} overdue · {stats?.pendingCount ?? 0} pending
          </div>
        </div>

        {/* Collected MTD */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--foreground-variant)]">Collected (MTD)</h3>
            <div className="p-2 bg-[var(--surface-dim)] rounded-md">
              <DollarSign className="h-4 w-4 text-green-500" />
            </div>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(stats?.collectedMTD || 0)}</div>
          <div className="text-xs text-[var(--foreground-variant)] mt-2">
            {formatCurrency(stats?.totalCollected ?? 0)} collected all time
          </div>
        </div>
      </div>

      {/* Decisions Waiting & Today's Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* Decisions Waiting Card */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold">Decisions Waiting</h3>
              <p className="text-xs text-[var(--foreground-variant)] mt-0.5">
                {latestPending.length > 0 ? `Latest ${latestPending.length} pending approval${latestPending.length !== 1 ? 's' : ''}` : 'No pending approvals'}
              </p>
            </div>
            <Link
              href="/dashboard/approvals"
              className="flex items-center gap-1 text-xs text-[var(--foreground-variant)] hover:text-[var(--foreground)] transition-colors"
            >
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {latestPending.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-[var(--foreground-variant)]">
              <CheckCircle2 className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm opacity-60">No pending decisions</p>
            </div>
          ) : (
            <div className="space-y-2">
              {latestPending.map((approval) => (
                <div
                  key={approval.id}
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-[var(--surface-dim)]/50 hover:bg-[var(--surface-dim)] transition-colors group"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm font-medium truncate">{approval.subject}</p>
                    <p className="text-xs text-[var(--foreground-variant)] mt-0.5 truncate">{approval.from}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      title="Approve"
                      className="p-1.5 rounded-md text-green-500/60 hover:text-green-400 hover:bg-green-500/10 transition-all"
                      onClick={() => handleApprovalAction(approval.id, 'approved')}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </button>
                    <button
                      title="Reject"
                      className="p-1.5 rounded-md text-red-500/60 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      onClick={() => handleApprovalAction(approval.id, 'rejected')}
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Meetings Card */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold">Today's Meetings</h3>
              <p className="text-xs text-[var(--foreground-variant)] mt-0.5">
                {meetings.length > 0 ? `${meetings.length} meeting${meetings.length !== 1 ? 's' : ''} scheduled for today` : 'No meetings today'}
              </p>
            </div>
            <Calendar className="h-5 w-5 text-[var(--foreground-variant)]" />
          </div>

          {meetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-[var(--foreground-variant)]">
              <Calendar className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm opacity-60">Your schedule is clear</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {meetings.map((meeting) => {
                const meetingDate = new Date(meeting.meetingDateAndTime);
                return (
                  <div
                    key={meeting.id}
                    className="flex flex-col px-4 py-3 rounded-lg bg-[var(--surface-dim)]/50 hover:bg-[var(--surface-dim)] transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-[var(--foreground)] truncate pr-2">{meeting.meetingDescription}</p>
                      <span className="text-xs font-medium text-[var(--color-electric-cyan)] bg-[var(--color-electric-cyan)]/10 px-2 py-0.5 rounded-full shrink-0">
                        {meetingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--foreground-variant)] flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {meetingDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modules */}
      <div className="glass-card p-6 mt-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold">Modules</h3>
            <p className="text-xs text-[var(--foreground-variant)] mt-0.5">
              Quick access across your operating system
            </p>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-4">
          {MODULES.map(({ name, icon: Icon, description, status, href }) => {
            const available = status === "available";
            return (
              <div key={name} className="glass-card p-5 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--surface-dim)] flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[var(--foreground)]" />
                  </div>
                  {available ? (
                    <span className="text-[10px] uppercase tracking-wider bg-[var(--color-electric-cyan)]/10 text-[var(--color-electric-cyan)] px-2 py-0.5 rounded-full">Live</span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider bg-[var(--surface-dim)] px-2 py-0.5 rounded-full text-[var(--foreground-variant)]">Soon</span>
                  )}
                </div>
                <h4 className="text-sm font-semibold text-[var(--foreground)]">{name}</h4>
                <p className="text-xs text-[var(--foreground-variant)] mt-1.5 leading-snug mt-0.5">
                  {available ? description : "Under development — coming soon."}
                </p>
                <div className="mt-4">
                  {available ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline w-full h-9 text-xs flex items-center justify-center gap-1.5"
                    >
                      Open Module
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <button
                      disabled
                      className="btn-outline w-full h-9 text-xs cursor-not-allowed"
                    >
                      Coming Soon
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
