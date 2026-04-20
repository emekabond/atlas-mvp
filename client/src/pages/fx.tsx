import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeftRight, DollarSign, TrendingUp, Activity, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { FxTransaction } from "@shared/schema";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatCurrencyPrecise(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatRate(value: number) {
  if (value >= 100) return value.toFixed(0);
  if (value >= 10) return value.toFixed(2);
  return value.toFixed(4);
}

function DirectionBadge({ direction }: { direction: string }) {
  const map: Record<string, { label: string; className: string }> = {
    inbound: { label: "Inbound", className: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30" },
    outbound: { label: "Outbound", className: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30" },
  };
  const item = map[direction] || map.inbound;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.className}`} data-testid={`badge-fx-direction-${direction}`}>
      {item.label}
    </span>
  );
}

export default function FxPage() {
  const { data: overview, isLoading: overviewLoading } = useQuery<{
    totalFxVolume: number; fxRevenueMtd: number; avgSpreadBps: number; transactionCount: number;
  }>({ queryKey: ["/api/fx/overview"] });

  const { data: fxTransactions, isLoading: txnLoading } = useQuery<FxTransaction[]>({
    queryKey: ["/api/fx/transactions"],
  });

  const { data: byCorridor, isLoading: corridorLoading } = useQuery<Array<{
    corridor: string; volume: number; avgSpreadBps: number; revenue: number; txnCount: number;
  }>>({ queryKey: ["/api/fx/by-corridor"] });

  const { data: byDirection, isLoading: directionLoading } = useQuery<{
    inbound: { volume: number; avgSpread: number; revenue: number };
    outbound: { volume: number; avgSpread: number; revenue: number };
  }>({ queryKey: ["/api/fx/by-direction"] });

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>FX</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[10px] font-medium">
              <span className="h-1 w-1 rounded-full bg-current opacity-80" />Live
            </span>
          </div>
          <h1 className="text-2xl font-bold mt-1" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }} data-testid="text-page-title">
            FX & Settlement
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">
            Routed through Circle USDC / StableFX and Arc rails with mid-market pricing. Programmatic hedging is scaffolded.
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            <Card data-testid="card-total-fx-volume">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total FX Volume</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{formatCurrency(overview?.totalFxVolume || 0)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-fx-revenue-mtd">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">FX Revenue (MTD)</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{formatCurrencyPrecise(overview?.fxRevenueMtd || 0)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-avg-spread-bps">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Avg Spread (bps)</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{overview?.avgSpreadBps || 0}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <ArrowLeftRight className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-fx-transactions-count">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">FX Transactions</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{overview?.transactionCount || 0}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-violet-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* FX Revenue by Corridor - Horizontal Bar Chart */}
        <Card data-testid="card-fx-revenue-by-corridor">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">FX Revenue by Corridor</CardTitle>
          </CardHeader>
          <CardContent>
            {corridorLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  layout="vertical"
                  data={(byCorridor || []).sort((a, b) => b.revenue - a.revenue)}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" opacity={0.3} />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => `$${(v / 1).toFixed(0)}`}
                    tick={{ fontSize: 11, fill: "hsl(215 20% 65%)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="corridor"
                    tick={{ fontSize: 11, fill: "hsl(215 20% 65%)" }}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(222 47% 9%)",
                      border: "1px solid hsl(217 33% 17%)",
                      borderRadius: "8px",
                      color: "hsl(210 40% 98%)",
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [formatCurrencyPrecise(value), "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="hsl(142 76% 36%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Inbound vs Outbound Summary */}
        <div className="space-y-4">
          {directionLoading ? (
            <>
              <Card><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
              <Card><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
            </>
          ) : (
            <>
              <Card data-testid="card-fx-inbound-summary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
                    Inbound
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Volume</p>
                      <p className="text-lg font-bold tabular-nums mt-1" data-testid="text-fx-inbound-volume">{formatCurrency(byDirection?.inbound.volume || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Avg Spread</p>
                      <p className="text-lg font-bold tabular-nums mt-1" data-testid="text-fx-inbound-spread">{byDirection?.inbound.avgSpread || 0} bps</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Revenue</p>
                      <p className="text-lg font-bold tabular-nums mt-1 text-emerald-600 dark:text-emerald-400" data-testid="text-fx-inbound-revenue">{formatCurrencyPrecise(byDirection?.inbound.revenue || 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card data-testid="card-fx-outbound-summary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-amber-500" />
                    Outbound
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Volume</p>
                      <p className="text-lg font-bold tabular-nums mt-1" data-testid="text-fx-outbound-volume">{formatCurrency(byDirection?.outbound.volume || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Avg Spread</p>
                      <p className="text-lg font-bold tabular-nums mt-1" data-testid="text-fx-outbound-spread">{byDirection?.outbound.avgSpread || 0} bps</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Revenue</p>
                      <p className="text-lg font-bold tabular-nums mt-1 text-emerald-600 dark:text-emerald-400" data-testid="text-fx-outbound-revenue">{formatCurrencyPrecise(byDirection?.outbound.revenue || 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* FX Transaction Log */}
      <Card data-testid="card-fx-transaction-log">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">FX Transaction Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {txnLoading ? (
            <div className="p-4"><Skeleton className="h-[300px] w-full" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Corridor</TableHead>
                  <TableHead className="text-xs">Direction</TableHead>
                  <TableHead className="text-xs">Currency Pair</TableHead>
                  <TableHead className="text-xs text-right">Amount (USD)</TableHead>
                  <TableHead className="text-xs text-right">Mid-Market Rate</TableHead>
                  <TableHead className="text-xs text-right">Atlas Rate</TableHead>
                  <TableHead className="text-xs text-right">Spread (bps)</TableHead>
                  <TableHead className="text-xs text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(fxTransactions || []).map((txn) => (
                  <TableRow key={txn.id} data-testid={`row-fx-${txn.id}`}>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(txn.createdAt)}</TableCell>
                    <TableCell className="text-sm font-medium">{txn.corridor}</TableCell>
                    <TableCell><DirectionBadge direction={txn.direction} /></TableCell>
                    <TableCell className="text-sm">{txn.fromCurrency}/{txn.toCurrency}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums font-medium">{formatCurrency(txn.amount)}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums">{formatRate(txn.midMarketRate)}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums">{formatRate(txn.atlasRate)}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums">{txn.spreadBps}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums font-medium text-emerald-600 dark:text-emerald-400">{formatCurrencyPrecise(txn.spreadRevenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
</div>
  );
}
