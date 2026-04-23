import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Activity,
  Database,
  GitBranch,
  Gauge,
  FileText,
  ShieldCheck,
  Cpu,
  Radio,
  Lock,
  Layers,
  ExternalLink,
  ChevronRight,
  X,
  CheckCircle2,
  CircleAlert,
} from "lucide-react";

// Scroll to an in-page section by id WITHOUT mutating location.hash.
// Plain <a href="#id"> would overwrite wouter's route hash (e.g. #/engine-room/)
// and trigger a 404. This handler avoids that.
function scrollToSection(id: string) {
  const el = typeof document !== "undefined" ? document.getElementById(id) : null;
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------- Types ----------
interface EngineStatus {
  policyVersion: string;
  deployedAt: string;
  casesToday: number;
  autoDecisionedPct: number;
  medianTimeToDecisionMin: number;
  agents: Array<{ name: string; status: string }>;
  queueDepth: number;
  slaBreachRate: number;
}
interface Fabric {
  sources: Array<{ name: string; coverage: string; freshnessMin: number; status: string }>;
  pipeline: Array<{ stage: string; detail: string }>;
  anomaliesLast24h: number;
}
interface QueueData {
  gates: Array<{ gate: number; name: string; passRate: number; medianMs: number }>;
  cases: Array<{ id: string; tenant: string; product: string; gate: number; waitMin: number; status: string }>;
}
interface Memo {
  caseId: string;
  tenant: string;
  product: string;
  corridor: string;
  requestedLimit: number;
  recommendedLimit: number;
  score: number;
  decision: string;
  policyVersion: string;
  factors: Array<{ factor: string; signal: string; value: string; direction: string; weight: string }>;
  guardrails: string[];
  redactedNote: string;
}
interface Policy {
  current: string;
  previous: string;
  deployedAt: string;
  diff: Array<{ path: string; from: string; to: string; reason: string }>;
  replayable: boolean;
  replaySampleSize: number;
  replayImpact: { decisionsChanged: number; approvalDelta: string; lossProxyDelta: string };
}
interface Monitoring {
  covenants: Array<{ tenant: string; metric: string; value: number; threshold: number; status: string }>;
  earlyWarnings: Array<{ tenant: string; signal: string; severity: string }>;
}
interface AgentRow {
  name: string;
  role: string;
  status: string;
  actionsToday: number;
  escalationRate: number;
}
interface EngineEvent {
  ts: string;
  domain: string;
  event: string;
  subject: string;
  detail: string;
}
interface Lender {
  reportingPeriod: string;
  borrowingBase: number;
  eligiblePool: number;
  reserves: { dilution: number; concentration: number; aging: number };
  yieldNetBps: number;
  lossProxyBps: number;
  sampleCases: number;
  watermark: string;
}

// ---------- Primitives ----------
function Section({
  id,
  icon: Icon,
  title,
  kicker,
  children,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  kicker: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-slate-800 pt-10">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">
            <Icon className="h-3.5 w-3.5 text-slate-400" />
            <span>{kicker}</span>
          </div>
          <h2 className="mt-1 text-xl font-semibold text-white tracking-tight">
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => scrollToSection(id)}
          className="text-[11px] text-slate-500 hover:text-slate-300"
        >
          #{id}
        </button>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Pill({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "emerald" | "amber" | "sky" | "violet" | "rose";
}) {
  const map: Record<string, string> = {
    slate: "bg-slate-500/10 text-slate-300 border-slate-500/30",
    emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    sky: "bg-sky-500/10 text-sky-300 border-sky-500/30",
    violet: "bg-violet-500/10 text-violet-300 border-violet-500/30",
    rose: "bg-rose-500/10 text-rose-300 border-rose-500/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${map[tone]}`}
    >
      <span className="h-1 w-1 rounded-full bg-current opacity-80" />
      {children}
    </span>
  );
}

function StageTone(stage: string): "emerald" | "amber" | "sky" | "violet" | "slate" {
  if (stage === "live" || stage === "healthy") return "emerald";
  if (stage === "pilot" || stage === "degraded" || stage === "watch") return "amber";
  if (stage === "preview") return "sky";
  if (stage === "scaffold") return "violet";
  return "slate";
}

function Stat({ label, value, foot }: { label: string; value: string; foot?: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-white tabular-nums">
        {value}
      </div>
      {foot && <div className="mt-1 text-[11px] text-slate-500">{foot}</div>}
    </div>
  );
}

function formatTimeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 1) return "just now";
  if (diff < 60) return `${Math.round(diff)}m ago`;
  return `${Math.round(diff / 60)}h ago`;
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

// ---------- Sections ----------
function StatusSection({ data }: { data?: EngineStatus }) {
  if (!data) return <div className="text-sm text-slate-500">Loading…</div>;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Stat
        label="Policy version"
        value={data.policyVersion}
        foot={`Deployed ${formatTimeAgo(data.deployedAt)}`}
      />
      <Stat
        label="Cases today"
        value={String(data.casesToday)}
        foot={`${data.autoDecisionedPct}% auto-decisioned`}
      />
      <Stat
        label="Median time-to-decision"
        value={`~${data.medianTimeToDecisionMin} min`}
        foot={`SLA breach ${(data.slaBreachRate * 100).toFixed(2)}%`}
      />
      <Stat
        label="Queue depth"
        value={String(data.queueDepth)}
        foot="Escalations awaiting Gate 4"
      />
      <div className="col-span-2 md:col-span-4 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-3">
          Agent mesh health
        </div>
        <div className="flex flex-wrap gap-2">
          {data.agents.map((a) => (
            <Pill key={a.name} tone={StageTone(a.status)}>
              {a.name} · {a.status}
            </Pill>
          ))}
        </div>
      </div>
    </div>
  );
}

function FabricSection({ data }: { data?: Fabric }) {
  if (!data) return null;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
        {data.pipeline.map((p, i) => (
          <div key={p.stage} className="flex items-center gap-2">
            <div className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">
                Stage {i + 1}
              </div>
              <div className="text-sm text-slate-100">{p.stage}</div>
              <div className="text-[11px] text-slate-500 max-w-[220px]">
                {p.detail}
              </div>
            </div>
            {i < data.pipeline.length - 1 && (
              <ChevronRight className="h-4 w-4 text-slate-600" />
            )}
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 text-left text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-2">Source</th>
              <th className="px-4 py-2">Coverage</th>
              <th className="px-4 py-2">Freshness</th>
              <th className="px-4 py-2">Stage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.sources.map((s) => (
              <tr key={s.name} className="text-slate-200">
                <td className="px-4 py-2">{s.name}</td>
                <td className="px-4 py-2 text-slate-400">{s.coverage}</td>
                <td className="px-4 py-2 tabular-nums text-slate-400">
                  {s.freshnessMin < 60
                    ? `${s.freshnessMin}m`
                    : `${Math.round(s.freshnessMin / 60)}h`}
                </td>
                <td className="px-4 py-2">
                  <Pill tone={StageTone(s.status)}>{s.status}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-[11px] text-slate-500">
        {data.anomaliesLast24h} anomalies detected in the last 24h — routed to
        Reconciliation + Compliance Agents.
      </div>
    </div>
  );
}

function QueueSection({ data, onOpenMemo }: { data?: QueueData; onOpenMemo: (id: string) => void }) {
  if (!data) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {data.gates.map((g) => (
          <div
            key={g.gate}
            className="rounded-lg border border-slate-800 bg-slate-950/60 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">
                Gate {g.gate}
              </div>
              <Pill tone={g.passRate > 0.9 ? "emerald" : "amber"}>
                {(g.passRate * 100).toFixed(0)}% pass
              </Pill>
            </div>
            <div className="mt-2 text-sm font-medium text-white">{g.name}</div>
            <div className="mt-1 text-[11px] text-slate-500">
              Median{" "}
              {g.medianMs > 60000
                ? `${Math.round(g.medianMs / 60000)}m`
                : `${g.medianMs}ms`}
            </div>
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 text-left text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-2">Case</th>
              <th className="px-4 py-2">Tenant</th>
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2">Gate</th>
              <th className="px-4 py-2">Wait</th>
              <th className="px-4 py-2">Status</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.cases.map((c) => (
              <tr key={c.id} className="text-slate-200">
                <td className="px-4 py-2 font-mono text-xs">{c.id}</td>
                <td className="px-4 py-2">{c.tenant}</td>
                <td className="px-4 py-2 text-slate-400">{c.product}</td>
                <td className="px-4 py-2 tabular-nums">{c.gate}</td>
                <td className="px-4 py-2 tabular-nums text-slate-400">
                  {c.waitMin}m
                </td>
                <td className="px-4 py-2">
                  <Pill
                    tone={c.status === "human-review" ? "amber" : "emerald"}
                  >
                    {c.status}
                  </Pill>
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => onOpenMemo(c.id)}
                    className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300"
                  >
                    Memo <ChevronRight className="h-3 w-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MemoSection({ data }: { data?: Memo }) {
  if (!data) return null;
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">
              Case {data.caseId} · {data.product}
            </div>
            <div className="mt-1 text-lg font-semibold text-white">
              {data.tenant}
            </div>
            <div className="text-[11px] text-slate-500">
              {data.corridor} · Policy {data.policyVersion}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Pill tone="sky">Score {data.score}</Pill>
            <Pill tone="amber">{data.decision}</Pill>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Requested" value={formatMoney(data.requestedLimit)} />
          <Stat label="Recommended" value={formatMoney(data.recommendedLimit)} />
          <Stat
            label="Advance rate"
            value="85%"
            foot="Factoring default"
          />
          <Stat label="Corridor cap" value="$30M" foot="US→MX tenant cap" />
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 text-left text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-2">Factor</th>
              <th className="px-4 py-2">Signal</th>
              <th className="px-4 py-2">Value</th>
              <th className="px-4 py-2 text-center">Dir</th>
              <th className="px-4 py-2 text-right">Weight</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.factors.map((f) => (
              <tr key={f.factor} className="text-slate-200">
                <td className="px-4 py-2 font-medium">{f.factor}</td>
                <td className="px-4 py-2 text-slate-400">{f.signal}</td>
                <td className="px-4 py-2 tabular-nums text-slate-300">
                  {f.value}
                </td>
                <td className="px-4 py-2 text-center">
                  <span
                    className={
                      f.direction === "+"
                        ? "text-emerald-400"
                        : f.direction === "-"
                          ? "text-rose-400"
                          : "text-slate-500"
                    }
                  >
                    {f.direction}
                  </span>
                </td>
                <td className="px-4 py-2 text-right text-slate-500 tabular-nums">
                  {f.weight}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        {data.guardrails.map((g) => (
          <Pill key={g} tone="slate">
            {g}
          </Pill>
        ))}
      </div>
      <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-300">
        <Lock className="h-3.5 w-3.5" />
        {data.redactedNote}
      </div>
    </div>
  );
}

function PolicySection({
  data,
  onReplay,
}: {
  data?: Policy;
  onReplay: () => void;
}) {
  if (!data) return null;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
        <div className="flex items-center gap-3">
          <Pill tone="slate">{data.previous}</Pill>
          <ChevronRight className="h-4 w-4 text-slate-600" />
          <Pill tone="emerald">{data.current}</Pill>
          <span className="text-[11px] text-slate-500">
            Deployed {formatTimeAgo(data.deployedAt)}
          </span>
        </div>
        <button
          onClick={onReplay}
          className="inline-flex items-center gap-1.5 rounded-md border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-300 hover:bg-sky-500/20"
        >
          <GitBranch className="h-3.5 w-3.5" />
          Replay on sample (N={data.replaySampleSize})
        </button>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 text-left text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-2">Policy path</th>
              <th className="px-4 py-2">From</th>
              <th className="px-4 py-2">To</th>
              <th className="px-4 py-2">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.diff.map((d) => (
              <tr key={d.path} className="text-slate-200">
                <td className="px-4 py-2 font-mono text-xs text-slate-300">
                  {d.path}
                </td>
                <td className="px-4 py-2 text-rose-300">{d.from}</td>
                <td className="px-4 py-2 text-emerald-300">{d.to}</td>
                <td className="px-4 py-2 text-slate-400">{d.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MonitoringSection({ data }: { data?: Monitoring }) {
  if (!data) return null;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-lg border border-slate-800 bg-slate-950/60">
        <div className="border-b border-slate-800 px-4 py-2 text-[10px] uppercase tracking-wider text-slate-500">
          Covenant monitoring
        </div>
        <div className="divide-y divide-slate-800">
          {data.covenants.map((c, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-sm text-slate-100">{c.tenant}</div>
                <div className="text-[11px] text-slate-500">{c.metric}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm tabular-nums text-slate-300">
                  {c.value}
                </span>
                <span className="text-[11px] text-slate-500">
                  / {c.threshold}
                </span>
                <Pill tone={c.status === "ok" ? "emerald" : "amber"}>
                  {c.status}
                </Pill>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-slate-800 bg-slate-950/60">
        <div className="border-b border-slate-800 px-4 py-2 text-[10px] uppercase tracking-wider text-slate-500">
          Early warning signals (scaffold)
        </div>
        <div className="divide-y divide-slate-800">
          {data.earlyWarnings.map((w, i) => (
            <div key={i} className="flex items-start justify-between gap-3 px-4 py-3">
              <div>
                <div className="text-sm text-slate-100">{w.tenant}</div>
                <div className="text-[11px] text-slate-400">{w.signal}</div>
              </div>
              <Pill tone="amber">{w.severity}</Pill>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-800 px-4 py-2 text-[10px] text-slate-600">
          EWS is a scaffolded capability — rules engine in production,
          ML-ranked severities are not yet live.
        </div>
      </div>
    </div>
  );
}

function AgentsSection({ data }: { data?: AgentRow[] }) {
  if (!data) return null;
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {data.map((a) => (
        <div
          key={a.name}
          className="rounded-lg border border-slate-800 bg-slate-950/60 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-white">{a.name}</div>
            <Pill tone={StageTone(a.status)}>{a.status}</Pill>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-slate-400">
            {a.role}
          </p>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span className="tabular-nums">{a.actionsToday} actions today</span>
            <span className="tabular-nums">
              {(a.escalationRate * 100).toFixed(1)}% escalations
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function EventsSection({ data }: { data?: EngineEvent[] }) {
  if (!data) return null;
  const domainTone: Record<string, "emerald" | "amber" | "sky" | "violet" | "slate" | "rose"> = {
    credit: "emerald",
    compliance: "sky",
    treasury: "amber",
    recon: "violet",
    policy: "rose",
  };
  return (
    <div className="overflow-hidden rounded-lg border border-slate-800">
      <table className="w-full text-sm">
        <thead className="bg-slate-900/60 text-left text-[10px] uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-2">When</th>
            <th className="px-4 py-2">Domain</th>
            <th className="px-4 py-2">Event</th>
            <th className="px-4 py-2">Subject</th>
            <th className="px-4 py-2">Detail</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {data.map((e, i) => (
            <tr key={i} className="text-slate-200">
              <td className="px-4 py-2 text-[11px] text-slate-400">
                {formatTimeAgo(e.ts)}
              </td>
              <td className="px-4 py-2">
                <Pill tone={domainTone[e.domain] || "slate"}>{e.domain}</Pill>
              </td>
              <td className="px-4 py-2 font-mono text-xs text-slate-300">
                {e.event}
              </td>
              <td className="px-4 py-2 text-slate-300">{e.subject}</td>
              <td className="px-4 py-2 text-[12px] text-slate-400">
                {e.detail}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LenderSection({ data }: { data?: Lender }) {
  if (!data) return null;
  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-800 bg-slate-950/60 p-5">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="rotate-[-12deg] text-4xl font-bold text-slate-800/40 tracking-widest">
          PREVIEW
        </div>
      </div>
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">
              Lender view · Borrowing base preview
            </div>
            <div className="mt-1 text-lg font-semibold text-white">
              Reporting period: {data.reportingPeriod}
            </div>
          </div>
          <Pill tone="sky">Permissioned</Pill>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Borrowing base" value={formatMoney(data.borrowingBase)} />
          <Stat label="Eligible pool" value={formatMoney(data.eligiblePool)} />
          <Stat label="Net yield" value={`${(data.yieldNetBps / 100).toFixed(2)}%`} />
          <Stat label="Loss proxy" value={`${(data.lossProxyBps / 100).toFixed(2)}%`} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Stat label="Reserve · dilution" value={formatMoney(data.reserves.dilution)} />
          <Stat label="Reserve · concentration" value={formatMoney(data.reserves.concentration)} />
          <Stat label="Reserve · aging" value={formatMoney(data.reserves.aging)} />
        </div>
        <div className="mt-4 text-[10px] uppercase tracking-[0.2em] text-slate-500">
          {data.watermark}
        </div>
      </div>
    </div>
  );
}

function ProductScopeSection() {
  const items = [
    { name: "Invoice Factoring", stage: "live", note: "Live with Lead Bank rails, US→9 corridors" },
    { name: "Revenue-Based Financing", stage: "live", note: "Live for SaaS / services ICP, 12–24mo terms" },
    { name: "Working Capital Lines", stage: "pilot", note: "Pilot with two tenants; collateralised by receivables" },
    { name: "Supply Chain Finance", stage: "pilot", note: "Pilot: buyer-led programs on US→MX" },
    { name: "Trade Finance / LCs", stage: "scaffold", note: "Scaffolded — document extraction live, issuance roadmap" },
    { name: "Treasury Sweeps", stage: "pilot", note: "Circle Yield pilot; reversible, reserve-aware" },
    { name: "FX Hedging", stage: "scaffold", note: "Mid-market pricing live; programmatic hedges scaffolded" },
    { name: "Covenants & EWS", stage: "scaffold", note: "Rules engine live; ML-ranked signals in scaffold" },
    { name: "Collections", stage: "scaffold", note: "Notification + dunning cadence scaffolded" },
    { name: "Merchant Acquiring / MTL", stage: "roadmap", note: "Roadmap — dependent on regulatory expansion" },
  ];
  return (
    <div className="overflow-hidden rounded-lg border border-slate-800">
      <table className="w-full text-sm">
        <thead className="bg-slate-900/60 text-left text-[10px] uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-2">Capability</th>
            <th className="px-4 py-2">Stage</th>
            <th className="px-4 py-2">Scope</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {items.map((i) => (
            <tr key={i.name} className="text-slate-200">
              <td className="px-4 py-2 font-medium">{i.name}</td>
              <td className="px-4 py-2">
                <Pill tone={StageTone(i.stage)}>{i.stage}</Pill>
              </td>
              <td className="px-4 py-2 text-slate-400">{i.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-slate-800 bg-slate-900/30 px-4 py-2 text-[11px] text-slate-500">
        We do not pretend that everything in the Atlas catalogue is equally
        deep. Factoring and RBF are productized. Treasury and SCF are pilots.
        Trade finance, covenants, and EWS are scaffolded. MTL is on the
        roadmap.
      </div>
    </div>
  );
}

// ---------- Replay Modal ----------
function ReplayModal({
  policy,
  onClose,
}: {
  policy?: Policy;
  onClose: () => void;
}) {
  if (!policy) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-lg rounded-lg border border-slate-800 bg-slate-950 p-6">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-slate-500 hover:text-slate-200"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500">
          <GitBranch className="h-3.5 w-3.5" />
          Policy replay
        </div>
        <h3 className="mt-1 text-lg font-semibold text-white">
          {policy.previous} → {policy.current}
        </h3>
        <p className="mt-1 text-[12px] text-slate-400">
          We replay the new policy on a held-out sample of recent cases to
          quantify expected decision drift before rollout.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat
            label="Sample"
            value={`N=${policy.replaySampleSize}`}
            foot="last 30 days"
          />
          <Stat
            label="Decisions changed"
            value={String(policy.replayImpact.decisionsChanged)}
          />
          <Stat
            label="Approval Δ"
            value={policy.replayImpact.approvalDelta}
            foot={`Loss proxy ${policy.replayImpact.lossProxyDelta}`}
          />
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-[11px] text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Replay-validated rollouts only. Lender-confidential weights are never
          exposed in the replay surface.
        </div>
      </div>
    </div>
  );
}

// ---------- Main ----------
export default function EngineRoom() {
  const [memoCaseId, setMemoCaseId] = useState<string>("CS-2041");
  const [replayOpen, setReplayOpen] = useState(false);

  const { data: status } = useQuery<EngineStatus>({ queryKey: ["/api/engine/status"] });
  const { data: fabric } = useQuery<Fabric>({ queryKey: ["/api/engine/fabric"] });
  const { data: queue } = useQuery<QueueData>({ queryKey: ["/api/engine/queue"] });
  const { data: memo } = useQuery<Memo>({ queryKey: [`/api/engine/memo/${memoCaseId}`] });
  const { data: policy } = useQuery<Policy>({ queryKey: ["/api/engine/policy"] });
  const { data: monitoring } = useQuery<Monitoring>({ queryKey: ["/api/engine/monitoring"] });
  const { data: agents } = useQuery<AgentRow[]>({ queryKey: ["/api/engine/agents"] });
  const { data: events } = useQuery<EngineEvent[]>({ queryKey: ["/api/engine/events"] });
  const { data: lender } = useQuery<Lender>({ queryKey: ["/api/engine/lender"] });

  // Deep-link support: respect ?section=<id> so external callers (e.g. the
  // access gateway's "Lender & Capital" card) can scroll into a specific
  // section on load. We check location.search first, then the inner hash
  // portion after the route (e.g. /#/engine-room/?section=lender).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const readSection = (): string | null => {
      try {
        // 1) Query string on the window URL itself (non-hash routers or direct links)
        const direct = new URLSearchParams(window.location.search).get("section");
        if (direct) return direct;
        // 2) Query string embedded inside the hash route, e.g. #/engine-room/?section=lender
        const hash = window.location.hash || "";
        const qIdx = hash.indexOf("?");
        if (qIdx >= 0) {
          const inner = new URLSearchParams(hash.slice(qIdx + 1)).get("section");
          if (inner) return inner;
        }
      } catch {}
      return null;
    };
    const section = readSection();
    if (!section) return;
    // Wait for the page to paint (sections render after useQuery settles).
    // Up to 8s of retries handles slow cold-start API responses on first load.
    const tryScroll = (attempt = 0) => {
      const el = document.getElementById(section);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (attempt < 80) {
        setTimeout(() => tryScroll(attempt + 1), 100);
      }
    };
    tryScroll();
  }, []);

  const nav: Array<{ id: string; label: string }> = [
    { id: "status", label: "Status" },
    { id: "fabric", label: "Data Fabric" },
    { id: "queue", label: "Underwriting Queue" },
    { id: "memo", label: "Credit Memo" },
    { id: "policy", label: "Policy (ACB)" },
    { id: "monitoring", label: "Monitoring" },
    { id: "agents", label: "Agent Layer" },
    { id: "events", label: "Event Stream" },
    { id: "lender", label: "Lender View" },
    { id: "products", label: "Scope Map" },
  ];

  return (
    <div className="min-h-screen bg-[#07090c] text-slate-100">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-slate-800 bg-[#07090c]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-white text-[11px] font-bold text-black">
              A
            </div>
            <div className="text-sm font-medium tracking-tight text-slate-100">
              Atlas · Engine Room
            </div>
            <Pill tone="emerald">AI Credit OS</Pill>
            <Pill tone="slate">ACB v4.12</Pill>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <Link
              href="/"
              className="inline-flex items-center gap-1 hover:text-slate-100"
            >
              Customer workspace <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl items-center gap-4 overflow-x-auto px-6 pb-2 text-[11px] text-slate-500">
          {nav.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => scrollToSection(n.id)}
              className="whitespace-nowrap hover:text-slate-200"
            >
              {n.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Header */}
      <header className="mx-auto max-w-6xl px-6 pt-10 pb-6">
        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
          Atlas Technologies · Internal Ops Surface · V3 Preview
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white max-w-3xl">
          The AI Credit OS behind the Atlas Financial OS.
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-400">
          Atlas owns the customer interface, the underwriting logic, and the
          risk controls. Lead Bank, Bridge, Circle, and Rain are invisible
          infrastructure. This surface is how operators and risk see what the
          system is actually doing.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Pill tone="emerald">Factoring · Live</Pill>
          <Pill tone="emerald">RBF · Live</Pill>
          <Pill tone="amber">Treasury · Pilot</Pill>
          <Pill tone="amber">SCF · Pilot</Pill>
          <Pill tone="violet">Trade finance · Scaffold</Pill>
          <Pill tone="slate">MTL · Roadmap</Pill>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-6 pb-20">
        <Section id="status" icon={Gauge} kicker="System" title="Engine status">
          <StatusSection data={status} />
        </Section>

        <Section id="fabric" icon={Database} kicker="Data" title="Data fabric">
          <FabricSection data={fabric} />
        </Section>

        <Section
          id="queue"
          icon={Layers}
          kicker="Underwriting"
          title="4-Gate underwriting queue"
        >
          <QueueSection data={queue} onOpenMemo={setMemoCaseId} />
        </Section>

        <Section
          id="memo"
          icon={FileText}
          kicker="Explainability"
          title="7-Factor credit memo"
        >
          <MemoSection data={memo} />
        </Section>

        <Section
          id="policy"
          icon={GitBranch}
          kicker="Policy"
          title="ACB versioning & replay"
        >
          <PolicySection data={policy} onReplay={() => setReplayOpen(true)} />
        </Section>

        <Section
          id="monitoring"
          icon={CircleAlert}
          kicker="Risk"
          title="Covenants & early-warning signals"
        >
          <MonitoringSection data={monitoring} />
        </Section>

        <Section
          id="agents"
          icon={Cpu}
          kicker="Autonomy"
          title="Autonomous agent layer"
        >
          <AgentsSection data={agents} />
        </Section>

        <Section
          id="events"
          icon={Radio}
          kicker="Telemetry"
          title="Domain event stream"
        >
          <EventsSection data={events} />
        </Section>

        <Section
          id="lender"
          icon={ShieldCheck}
          kicker="Capital"
          title="Lender view (preview)"
        >
          <LenderSection data={lender} />
        </Section>

        <Section
          id="products"
          icon={Activity}
          kicker="Scope"
          title="What's live, pilot, scaffold, roadmap"
        >
          <ProductScopeSection />
        </Section>

        <footer className="pt-10 text-[10px] uppercase tracking-[0.2em] text-slate-600 text-center">
          Strictly private & confidential · Atlas Technologies · V3 preview ·
          April 2026
        </footer>
      </main>

      {replayOpen && (
        <ReplayModal policy={policy} onClose={() => setReplayOpen(false)} />
      )}
    </div>
  );
}
