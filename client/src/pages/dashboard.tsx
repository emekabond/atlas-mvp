import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusPill } from "@/components/StatusPill";
import {
  Wallet,
  ReceiptText,
  CircleDollarSign,
  Timer,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "wouter";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Transaction } from "@shared/schema";

function formatCurrency(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
  }).format(value);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    completed: "badge-completed",
    pending: "badge-pending",
    processing: "badge-processing",
    failed: "badge-failed",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[status] || "badge-draft"}`}
      data-testid={`status-badge-${status}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

interface LiquiditySummary {
  availableLiquidity: number;
  eligibleReceivables: number;
  activeAdvances: number;
  nextSettlementHours: number;
  undrawnFacility: number;
  advanceRateBps: number;
}

interface CorridorRow {
  corridor: string;
  volume: number;
  transactionCount: number;
  avgSettlementTime: number;
  eligibilityPct: number;
}

interface AgentHint {
  id: string;
  agent: string;
  severity: string;
  title: string;
  body: string;
  amount?: number;
  ctaLabel: string;
  ctaHref?: string;
}

export default function Dashboard() {
  const { data: liquidity, isLoading: liqLoading } = useQuery<LiquiditySummary>(
    { queryKey: ["/api/dashboard/liquidity"] }
  );
  const { data: cashflow } = useQuery<
    Array<{ date: string; inbound: number; outbound: number }>
  >({ queryKey: ["/api/dashboard/cashflow"] });
  const { data: corridors } = useQuery<CorridorRow[]>({
    queryKey: ["/api/dashboard/corridors"],
  });
  const { data: recentTxns } = useQuery<Transaction[]>({
    queryKey: ["/api/dashboard/recent-transactions"],
  });
  const { data: topHints = [] } = useQuery<AgentHint[]>({
    queryKey: ["/api/action-rail"],
  });

  const hints = topHints.slice(0, 3);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Tenant header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
            <span>Meridian Software</span>
            <span className="text-muted-foreground/50">·</span>
            <span>US → AR</span>
            <StatusPill stage="live">Facility Live</StatusPill>
          </div>
          <h1
            className="text-2xl font-bold mt-1"
            style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
            data-testid="text-page-title"
          >
            Financial OS
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">
            Real-time view of your cross-border liquidity, receivables, and
            credit. Underwriting runs continuously on your live operating data —
            not stale statements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-border bg-card px-3 py-1.5 text-xs">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Policy
            </div>
            <div className="tabular-nums">ACB v4.12</div>
          </div>
          <div className="rounded-md border border-border bg-card px-3 py-1.5 text-xs">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Environment
            </div>
            <div>V3 · Demo</div>
          </div>
        </div>
      </div>

      {/* KPI Cards - tenant-facing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {liqLoading || !liquidity ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card data-testid="card-available-liquidity">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        Available Liquidity
                      </p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground"
                            aria-label="How available liquidity is calculated"
                            data-testid="tooltip-available-liquidity"
                          >
                            <Info className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs text-xs">
                          Cash on hand plus undrawn capacity on the Atlas
                          warehouse facility (Meridian SCP, $25M, SOFR+425bps).
                          Active advances are funded directly from this
                          facility — they don't reduce available liquidity
                          until the facility is fully drawn.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-2xl font-bold tabular-nums mt-1">
                      {formatCurrency(liquidity.availableLiquidity)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Cash + undrawn facility{" "}
                      <span className="tabular-nums">
                        ({formatCurrency(liquidity.undrawnFacility)})
                      </span>
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-eligible-receivables">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      Eligible Receivables
                    </p>
                    <p className="text-2xl font-bold tabular-nums mt-1">
                      {formatCurrency(liquidity.eligibleReceivables)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Factorable now at{" "}
                      <span className="tabular-nums">
                        {(liquidity.advanceRateBps / 100).toFixed(1)}%
                      </span>{" "}
                      advance rate
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <ReceiptText className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-active-advances">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        Active Advances
                      </p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground"
                            aria-label="How active advances are funded"
                            data-testid="tooltip-active-advances"
                          >
                            <Info className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs text-xs">
                          Outstanding factoring advances and RBF draws funded
                          from the Atlas warehouse facility. These do not
                          reduce "Available Liquidity" — the warehouse extends
                          drawing capacity beyond on-balance-sheet cash.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-2xl font-bold tabular-nums mt-1">
                      {formatCurrency(liquidity.activeAdvances)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Funded from warehouse facility
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <CircleDollarSign className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-next-settlement">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      Next Settlement
                    </p>
                    <p className="text-2xl font-bold tabular-nums mt-1">
                      {liquidity.nextSettlementHours.toFixed(1)}h
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Hybrid rails · stablecoin + SWIFT
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Timer className="h-5 w-5 text-violet-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* AI Suggested Actions strip */}
      {hints.length > 0 && (
        <Card data-testid="card-ai-actions">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                AI-Suggested Actions
              </CardTitle>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Explainable · reversible · human-in-loop
            </span>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {hints.map((h) => (
                <Link
                  key={h.id}
                  href={h.ctaHref || "/credit"}
                  className="group rounded-lg border border-border bg-card p-3 hover-elevate"
                  data-testid={`dash-action-${h.id}`}
                >
                  <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {h.agent}
                  </div>
                  <div className="mt-1 text-sm font-medium leading-snug">
                    {h.title}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {h.body}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    {h.amount != null ? (
                      <span className="text-sm font-semibold tabular-nums">
                        {formatCurrency(h.amount)}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary group-hover:translate-x-0.5 transition">
                      {h.ctaLabel}
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cashflow chart */}
      <Card data-testid="card-cashflow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider">
              Cross-Border Cash Flow · Last 30 Days
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-1">
              Inbound receivables vs. outbound payouts across corridors
            </p>
          </div>
          <StatusPill stage="live" />
        </CardHeader>
        <CardContent>
          <div className="h-56 sm:h-64 md:h-72">
            {cashflow && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashflow}>
                  <defs>
                    <linearGradient id="in" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(199 89% 48%)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(199 89% 48%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="out" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(45 93% 47%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(45 93% 47%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => formatCurrency(v)}
                  />
                  <Area type="monotone" dataKey="inbound" stroke="hsl(199 89% 48%)" fill="url(#in)" strokeWidth={2} />
                  <Area type="monotone" dataKey="outbound" stroke="hsl(45 93% 47%)" fill="url(#out)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Corridor + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" data-testid="card-corridors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                Corridor Activity
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-1">
                Volume, settlement speed, and factoring eligibility per corridor
              </p>
            </div>
            <StatusPill stage="live" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] uppercase tracking-wider">Corridor</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-right">Volume (30d)</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-right">Txns</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-right">Avg Settle</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-right">Eligible</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(corridors || []).slice(0, 7).map((c) => (
                  <TableRow key={c.corridor} data-testid={`corridor-row-${c.corridor}`}>
                    <TableCell className="font-medium">{c.corridor}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(c.volume)}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.transactionCount}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.avgSettlementTime > 0 ? `${c.avgSettlementTime.toFixed(1)}h` : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.eligibilityPct ? `${c.eligibilityPct.toFixed(0)}%` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card data-testid="card-recent-transactions">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider">
              Recent Activity
            </CardTitle>
            <Link
              href="/invoices"
              className="text-xs text-primary hover:text-primary/80 inline-flex items-center gap-1"
            >
              All <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {(recentTxns || []).slice(0, 6).map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between text-xs"
                data-testid={`txn-row-${t.id}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{t.corridor}</span>
                  <StatusBadge status={t.status} />
                </div>
                <span className="font-medium tabular-nums">
                  {formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
