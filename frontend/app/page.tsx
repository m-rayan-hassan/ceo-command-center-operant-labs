"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckSquare,
  LayoutDashboard,
  Loader2,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const FEATURES = [
  {
    icon: Activity,
    title: "Live Revenue Intelligence",
    body: "Monthly revenue, ARR, outstanding balances and collection metrics surfaced the moment you open the dashboard.",
  },
  {
    icon: CheckSquare,
    title: "Decision Command",
    body: "Approvals queue consolidates pending decisions so nothing stalls waiting on executive attention.",
  },
  {
    icon: Zap,
    title: "Automated CEO Briefing",
    body: "A distilled daily briefing keeps you oriented without wading through raw operational noise.",
  },
  {
    icon: Sparkles,
    title: "Modules Ready to Scale",
    body: "Enterprise CRM, Finance & Billing, HRMS, and AI workforce slots reserved for your whole operating system.",
  },
];

const MODULES = [
  "Command Center",
  "Approvals",
  "Enterprise CRM",
  "Finance & Billing",
  "Enterprise HRMS",
  "Operations & Delivery",
  "Knowledge & AI Center",
  "AI Workforce",
];

export default function LandingPage() {
  const { user, loading } = useAuth();

  if (loading || user) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen bg-[var(--background)]">
        <Loader2 className="animate-spin h-8 w-8 text-[var(--color-electric-cyan)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] relative overflow-hidden">
      {/* Ambient background accents */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-[var(--color-electric-cyan)] opacity-5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500 opacity-5 rounded-full blur-[160px] pointer-events-none" />

      {/* ── Nav ── */}
      <header className="flex items-center justify-between px-6 py-5 relative z-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--surface-bright)] border border-[var(--border-subtle)] flex items-center justify-center">
            <Shield className="w-4 h-4 text-[var(--color-electric-cyan)]" />
          </div>
          <span className="font-bold tracking-tight text-lg">Operant OS</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="nav-link">
            Sign In
          </Link>
          <Link href="/register" className="btn-solid h-10 px-5">
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main className="relative z-5">
        {/* ── Hero ── */}
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="section-number">Executive OS</div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
            Command Your Company
            <br />
            <span className="text-[var(--color-electric-cyan)]">from One Screen</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-[var(--foreground-variant)] leading-relaxed">
            The CEO Command Center unifies revenue, decisions, and operations into a single executive
            overview — so you lead with clarity, not noise.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="btn-solid h-12 px-7 text-lg">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="btn-outline h-12 px-7 text-lg">
              Sign In to Dashboard
            </Link>
          </div>
        </section>

        {/* ── Module tags ── */}
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <div className="flex flex-wrap justify-center gap-2">
            {MODULES.map((m) => (
              <span
                key={m}
                className="tech-pill px-4 py-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface)]/60 text-sm text-[var(--foreground-variant)]"
              >
                {m}
              </span>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="max-w-5xl mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="glass-card p-6">
                <div className="w-11 h-11 rounded-xl bg-[var(--surface-bright)] border border-[var(--border-subtle)] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[var(--color-electric-cyan)]" />
                </div>
                <h3 className="text-lg font-bold tracking-tight mb-2">{title}</h3>
                <p className="text-sm text-[var(--foreground-variant)] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer CTA ── */}
      <footer className="relative z-5 px-6 pb-16">
        <div className="glass-panel max-w-3xl mx-auto p-10 text-center rounded-2xl border border-[var(--border-strong)]">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--surface-bright)] border border-[var(--border-subtle)] mb-5">
            <LayoutDashboard className="w-6 h-6 text-[var(--foreground)]" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-3">Ready to take command?</h2>
          <p className="text-[var(--foreground-variant)] max-w-xl mx-auto mb-6">
            Set up your executive workspace in under a minute and see your entire company at a glance.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="btn-solid h-12 px-7 text-lg">
              Get Started — It&apos;s Free
            </Link>
            <Link href="/login" className="btn-outline h-12 px-7 text-lg">
              Already have an account
            </Link>
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-[var(--foreground-variant)]">
          © {new Date().getFullYear()} Operant OS. Executive platform for modern leadership.
        </p>
      </footer>
    </div>
  );
}