import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import { DollarSign, Users, TrendingUp, Clock, FileText, Brain, Shield } from "lucide-react";
import { Link } from "wouter";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { Transaction } from "@shared/schema";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    completed: "badge-completed",
    pending: "badge-pending",
    processing: "badge-processing",
    failed: "badge-failed",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[status] || "badge-draft"}`} data-testid={`status-badge-${status}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalVolume: number; activeClients: number; revenueMtd: number; avgSettlementSpeed: number;
  }>({ queryKey: ["/api/dashboard/stats"] });

  const { data: cashflow, isLoading: cashflowLoading } = useQuery<Array<{ date: string; inbound: number; outbound: number }>>({
    queryKey: ["/api/dashboard/cashflow"],
  });

  const { data: corridors, isLoading: corridorsLoading } = useQuery<Array<{
    corridor: string; volume: number; transactionCount: number; avgSettlementTime: number;
  }>>({ queryKey: ["/api/dashboard/corridors"] });

  const { data: recentTxns, isLoading: txnsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/dashboard/recent-transactions"],
  });

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }} data-testid="text-page-title">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time overview of Atlas operations</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            <Card data-testid="card-total-volume">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Volume</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{formatCurrency(stats?.totalVolume || 0)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-active-clients">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Active Clients</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{stats?.activeClients || 0}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-revenue-mtd">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Revenue (MTD)</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{formatCurrency(stats?.revenueMtd || 0)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-settlement-speed">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Avg Settlement</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{stats?.avgSettlementSpeed || 0}h</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-violet-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Cash Flow Chart */}
      <Card data-testid="card-cashflow-chart">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Cash Flow — Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          {cashflowLoading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={cashflow || []} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(199 89% 48%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(199 89% 48%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(45 93% 47%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(45 93% 47%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  tick={{ fontSize: 11, fill: "hsl(215 20% 65%)" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: "hsl(215 20% 65%)" }}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222 47% 9%)",
                    border: "1px solid hsl(217 33% 17%)",
                    borderRadius: "8px",
                    color: "hsl(210 40% 98%)",
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [formatCurrency(value), undefined]}
                  labelFormatter={(label) => new Date(label).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                />
                <Area type="monotone" dataKey="inbound" stroke="hsl(199 89% 48%)" fill="url(#colorInbound)" strokeWidth={2} name="Inbound" />
                <Area type="monotone" dataKey="outbound" stroke="hsl(45 93% 47%)" fill="url(#colorOutbound)" strokeWidth={2} name="Outbound" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Corridor Activity */}
        <Card data-testid="card-corridor-activity">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Corridor Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {corridorsLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Corridor</TableHead>
                    <TableHead className="text-xs text-right">Volume</TableHead>
                    <TableHead className="text-xs text-right">Txns</TableHead>
                    <TableHead className="text-xs text-right">Avg Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(corridors || []).map((c) => (
                    <TableRow key={c.corridor} data-testid={`row-corridor-${c.corridor}`}>
                      <TableCell className="font-medium text-sm">{c.corridor}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{formatCurrency(c.volume)}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{c.transactionCount}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{c.avgSettlementTime}h</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card data-testid="card-recent-transactions">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {txnsLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <div className="space-y-2">
                {(recentTxns || []).slice(0, 8).map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0"
                    data-testid={`row-transaction-${txn.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                        txn.type === "inbound" ? "bg-emerald-500" : txn.type === "outbound" ? "bg-amber-500" : "bg-primary"
                      }`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{txn.corridor}</p>
                        <p className="text-xs text-muted-foreground">{txn.type} · {formatDate(txn.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-medium tabular-nums">{formatCurrency(txn.amount)}</span>
                      <StatusBadge status={txn.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card data-testid="card-quick-actions">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/invoices">
              <Button variant="outline" size="sm" data-testid="button-new-invoice">
                <FileText className="h-4 w-4 mr-2" />
                New Invoice
              </Button>
            </Link>
            <Link href="/credit">
              <Button variant="outline" size="sm" data-testid="button-credit-assessment">
                <Brain className="h-4 w-4 mr-2" />
                Credit Assessment
              </Button>
            </Link>
            <Link href="/compliance">
              <Button variant="outline" size="sm" data-testid="button-compliance-check">
                <Shield className="h-4 w-4 mr-2" />
                Compliance Check
              </Button>
            </Link>
            <Link href="/credit">
              <Button variant="outline" size="sm" data-testid="button-new-rbf-request">
                <DollarSign className="h-4 w-4 mr-2" />
                New RBF Request
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <PerplexityAttribution />
    </div>
  );
}
