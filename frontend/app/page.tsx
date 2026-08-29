"use client";

import { Loader2 } from "lucide-react";
import { redirect } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen bg-[var(--background)]">
        <Loader2 className="animate-spin h-8 w-8 text-[var(--color-electric-cyan)]" />
      </div>
    );
  }

  redirect(user ? "/dashboard" : "/login");
}