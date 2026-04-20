import type { ReactNode } from "react";

export type Stage = "live" | "pilot" | "preview" | "scaffold" | "roadmap";

const STAGE_STYLES: Record<Stage, { label: string; cls: string }> = {
  live: {
    label: "Live",
    cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  pilot: {
    label: "Pilot",
    cls: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  preview: {
    label: "Preview",
    cls: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  },
  scaffold: {
    label: "Scaffold",
    cls: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  },
  roadmap: {
    label: "Roadmap",
    cls: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  },
};

interface Props {
  stage: Stage;
  children?: ReactNode;
  className?: string;
}

export function StatusPill({ stage, children, className = "" }: Props) {
  const s = STAGE_STYLES[stage];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${s.cls} ${className}`}
      data-testid={`status-pill-${stage}`}
    >
      <span className="h-1 w-1 rounded-full bg-current opacity-80" />
      {children ?? s.label}
    </span>
  );
}
