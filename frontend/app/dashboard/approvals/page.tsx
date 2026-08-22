"use client";

import { useEffect, useState, useCallback } from "react";
import api from "../../../lib/api";
import { CheckCircle2, XCircle, Loader2, Clock, Mail, AlertCircle } from "lucide-react";

interface Approval {
  id: string;
  from: string;
  subject: string;
  body: string;
  status: string;
  threadId: string | null;
  messageId: string | null;
  createdAt: string;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    approved: "bg-green-500/10 text-green-400 border-green-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${styles[status] ?? styles.pending}`}>
      {status}
    </span>
  );
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApprovals = async () => {
    try {
      const res = await api.get("/approvals/all");
      setApprovals(res.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch approvals", err);
      setError("Failed to load approvals.");
    } finally {
      setLoading(false);
    }
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

  useEffect(() => {
    fetchApprovals();
  }, []);

  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const pending = approvals.filter(a => a.status === "pending");
  const resolved = approvals.filter(a => a.status !== "pending");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-[var(--foreground-variant)]" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="section-number">Command</div>
          <h1 className="text-3xl font-bold tracking-tight">Approvals</h1>
          <p className="text-sm text-[var(--foreground-variant)] mt-1 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> {dateLabel}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-card px-4 py-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-sm font-medium">{pending.length} Pending</span>
          </div>
          <div className="glass-card px-4 py-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--foreground-variant)]" />
            <span className="text-sm font-medium">{resolved.length} Resolved</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Pending Approvals */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-[var(--foreground-variant)] tracking-[0.15em] uppercase mb-3">
            Awaiting Decision
          </h2>
          <div className="space-y-3">
            {pending.map((approval) => (
              <ApprovalCard key={approval.id} approval={approval} onAction={handleApprovalAction} />
            ))}
          </div>
        </div>
      )}

      {/* Resolved Approvals */}
      {resolved.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs font-semibold text-[var(--foreground-variant)] tracking-[0.15em] uppercase mb-3">
            Resolved
          </h2>
          <div className="space-y-3">
            {resolved.map((approval) => (
              <ApprovalCard key={approval.id} approval={approval} onAction={handleApprovalAction} dimmed />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {approvals.length === 0 && !error && (
        <div className="glass-card flex flex-col items-center justify-center py-20 text-[var(--foreground-variant)]">
          <CheckCircle2 className="h-10 w-10 mb-3 opacity-30" />
          <p className="font-medium opacity-60">All clear — no approvals today</p>
          <p className="text-sm opacity-40 mt-1">New approvals will appear here when they arrive.</p>
        </div>
      )}
    </div>
  );
}

function ApprovalCard({
  approval,
  onAction,
  dimmed = false,
}: {
  approval: Approval;
  onAction: (id: string, status: 'approved' | 'rejected') => void;
  dimmed?: boolean;
}) {
  const timeLabel = new Date(approval.createdAt).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`glass-card p-5 transition-all ${dimmed ? "opacity-60" : "hover:border-[var(--border-strong)]"}`}>
      {/* Card Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={approval.status} />
            <span className="text-[10px] text-[var(--foreground-variant)]">{timeLabel}</span>
          </div>
          <h3 className="text-base font-semibold leading-snug">{approval.subject}</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <Mail className="h-3 w-3 text-[var(--foreground-variant)]" />
            <span className="text-xs text-[var(--foreground-variant)]">{approval.from}</span>
          </div>
        </div>

        {/* Action Buttons */}
        {approval.status === "pending" && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              title="Approve"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-green-400 border border-green-500/20 bg-green-500/5 hover:bg-green-500/15 hover:border-green-500/40 transition-all"
              onClick={() => onAction(approval.id, 'approved')}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approve
            </button>
            <button
              title="Reject"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 hover:border-red-500/40 transition-all"
              onClick={() => onAction(approval.id, 'rejected')}
            >
              <XCircle className="h-3.5 w-3.5" />
              Reject
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="rounded-lg bg-[var(--surface-dim)]/60 p-4 border border-[var(--border-subtle)]">
        <p className="text-sm text-[var(--foreground-variant)] leading-relaxed whitespace-pre-wrap">
          {approval.body}
        </p>
      </div>

      {/* Thread/Message IDs if present */}
      {(approval.threadId || approval.messageId) && (
        <div className="flex items-center gap-4 mt-3">
          {approval.threadId && (
            <span className="text-[10px] text-[var(--foreground-variant)] opacity-50">
              Thread: <span className="font-mono">{approval.threadId}</span>
            </span>
          )}
          {approval.messageId && (
            <span className="text-[10px] text-[var(--foreground-variant)] opacity-50">
              Message: <span className="font-mono">{approval.messageId}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
