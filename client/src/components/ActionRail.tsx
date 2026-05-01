import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useHashLocation } from "wouter/use-hash-location";
import {
  Brain,
  Landmark,
  Shield,
  GitCompareArrows,
  Info,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export type AgentKey =
  | "credit"
  | "treasury"
  | "compliance"
  | "recon"
  | "orchestrator";

interface Action {
  id: string;
  agent: string; // display label from API, normalized below
  severity: string;
  title: string;
  body: string;
  amount?: number;
  currency?: string;
  rationale: string[];
  ctaLabel: string;
  ctaHref?: string;
}

function normalizeAgent(label: string): AgentKey {
  const l = label.toLowerCase();
  if (l.includes("orchestrator")) return "orchestrator";
  if (l.includes("treasury")) return "treasury";
  if (l.includes("compliance")) return "compliance";
  if (l.includes("recon")) return "recon";
  return "credit";
}

function normalizeSeverity(s: string): "info" | "opportunity" | "watch" | "action" {
  if (s === "warning") return "watch";
  if (s === "opportunity") return "opportunity";
  if (s === "action") return "action";
  return "info";
}

const AGENT_META: Record<
  AgentKey,
  { label: string; Icon: typeof Brain; tone: string }
> = {
  credit: { label: "Credit Agent", Icon: Brain, tone: "text-primary" },
  treasury: { label: "Treasury Agent", Icon: Landmark, tone: "text-amber-400" },
  compliance: { label: "Compliance Agent", Icon: Shield, tone: "text-sky-400" },
  recon: {
    label: "Recon Agent",
    Icon: GitCompareArrows,
    tone: "text-violet-400",
  },
  orchestrator: { label: "Orchestrator", Icon: Sparkles, tone: "text-primary" },
};

const SEVERITY_BORDER: Record<Action["severity"], string> = {
  info: "border-l-slate-500",
  opportunity: "border-l-emerald-500",
  watch: "border-l-amber-500",
  action: "border-l-primary",
};

function formatCurrency(n?: number) {
  if (n == null) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function ActionRail({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { data: actions = [], isLoading } = useQuery<Action[]>({
    queryKey: ["/api/action-rail"],
  });
  const [, setLocation] = useHashLocation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-3 top-20 z-30 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm hover-elevate"
        data-testid="action-rail-open"
        aria-label="Open AI Action Rail"
      >
        <Sparkles className="h-4 w-4" />
      </button>
    );
  }

  return (
    <>
      {/* Mobile backdrop: tap to close. Hidden on lg+ where the rail docks
          alongside the main content as a regular column. */}
      <button
        type="button"
        aria-label="Close Action Rail"
        onClick={onToggle}
        className="fixed inset-0 z-20 bg-black/40 backdrop-blur-[1px] lg:hidden"
        data-testid="action-rail-backdrop"
      />
      <aside
        className="fixed right-0 top-0 z-30 flex h-screen w-[88vw] max-w-[340px] flex-col border-l border-border bg-background lg:static lg:h-auto lg:w-[340px] lg:max-w-none lg:shrink-0"
        data-testid="action-rail"
      >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Atlas Action Rail
          </span>
        </div>
        <button
          onClick={onToggle}
          className="text-xs text-muted-foreground hover:text-foreground"
          data-testid="action-rail-close"
        >
          Hide
        </button>
      </div>

      <div className="border-b border-border px-4 py-2 text-[11px] text-muted-foreground">
        Recommendations from the Atlas Agent Layer. Every action is explainable
        and reversible.
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="p-4 text-xs text-muted-foreground">Loading…</div>
        )}
        {!isLoading && actions.length === 0 && (
          <div className="p-4 text-xs text-muted-foreground">
            No pending recommendations. Agents are idle.
          </div>
        )}
        {actions.map((a) => {
          const agentKey = normalizeAgent(a.agent);
          const sevKey = normalizeSeverity(a.severity);
          const meta = AGENT_META[agentKey];
          const AgentIcon = meta.Icon;
          const isOpen = expandedId === a.id;
          return (
            <div
              key={a.id}
              className={`border-b border-border px-4 py-3 border-l-2 ${SEVERITY_BORDER[sevKey]} hover-elevate`}
              data-testid={`action-${a.id}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  <AgentIcon className={`h-3 w-3 ${meta.tone}`} />
                  <span>{meta.label}</span>
                </div>
                <button
                  onClick={() => setExpandedId(isOpen ? null : a.id)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Why this"
                  data-testid={`action-why-${a.id}`}
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-1.5 text-sm font-medium leading-snug">
                {a.title}
              </div>
              <div className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {a.body}
              </div>
              {a.amount != null && (
                <div className="mt-2 text-sm font-semibold tabular-nums">
                  {formatCurrency(a.amount)}
                </div>
              )}
              {isOpen && (
                <div className="mt-2 rounded-md border border-border bg-muted/40 p-2">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Why this
                  </div>
                  <ul className="mt-1 space-y-1 text-[11px] text-muted-foreground">
                    {a.rationale.map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {a.ctaLabel && (
                <button
                  onClick={() => a.ctaHref && setLocation(a.ctaHref)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
                  data-testid={`action-cta-${a.id}`}
                >
                  {a.ctaLabel}
                  <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
        Agents stay in the loop. Operators stay in control.
      </div>
      </aside>
    </>
  );
}
