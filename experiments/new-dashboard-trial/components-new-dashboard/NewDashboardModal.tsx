"use client";

import type { ReactNode } from "react";

export function NewDashboardModal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-sm font-bold text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            ✕
          </button>
        </div>
        <div className="space-y-2">{children}</div>
      </div>
    </div>
  );
}
