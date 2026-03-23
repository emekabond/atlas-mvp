import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Landmark, DollarSign, TrendingUp, Percent, Wallet, RefreshCw, ArrowDownToLine } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { TreasuryPosition, TreasurySweep } from "@shared/schema";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function RiskTierBadge({ tier }: { tier: string }) {
  const map: Record<string, string> = {
    conservative: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30",
    moderate: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30",
    aggressive: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[tier] || map.moderate}`} data-testid={`badge-risk-tier-${tier}`}>
      {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </span>
  );
}

function PositionStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30",
    maturing: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30",
    redeemed: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || map.active}`} data-testid={`badge-position-status-${status}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function SweepTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; className: string }> = {
    sweep_in: { label: "Sweep In", className: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30" },
    sweep_out: { label: "Sweep Out", className: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30" },
    yield_harvest: { label: "Yield Harvest", className: "text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30" },
  };
  const item = map[type] || map.sweep_in;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.className}`}>
      {item.label}
    </span>
  );
}

function SweepStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30",
    pending: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30",
    processing: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || map.pending}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

const CHART_COLORS = [
  "hsl(199 89% 48%)", // primary blue
  "hsl(142 76% 36%)", // emerald
  "hsl(45 93% 47%)",  // amber
  "hsl(262 83% 58%)", // violet
  "hsl(346 77% 50%)", // rose
];

function PositionDetailDialog({ position }: { position: TreasuryPosition }) {
  const yieldEarned = position.currentValue - position.allocatedAmount;
  const yieldPct = ((yieldEarned / position.allocatedAmount) * 100);

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold">{position.strategyName}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Protocol</span>
            <p className="font-medium" data-testid="text-position-protocol">{position.protocol}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Risk Tier</span>
            <div className="mt-0.5"><RiskTierBadge tier={position.riskTier} /></div>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Allocated</span>
            <p className="font-bold tabular-nums">{formatCurrency(position.allocatedAmount)}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Current Value</span>
            <p className="font-bold tabular-nums">{formatCurrency(position.currentValue)}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">APY</span>
            <p className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{position.apy}%</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Yield Earned</span>
            <p className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCurrency(yieldEarned)} ({yieldPct.toFixed(2)}%)
            </p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Maturity</span>
            <p className="font-medium">{position.maturityDate || "Liquid (no maturity)"}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Status</span>
            <div className="mt-0.5"><PositionStatusBadge status={position.status} /></div>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

export default function TreasuryPage() {
  const [selectedPosition, setSelectedPosition] = useState<TreasuryPosition | null>(null);
  const { toast } = useToast();

  const { data: overview, isLoading: overviewLoading } = useQuery<{
    totalAum: number; weightedApy: number; yieldEarnedMtd: number; idleBalance: number;
  }>({ queryKey: ["/api/treasury/overview"] });

  const { data: positions, isLoading: positionsLoading } = useQuery<TreasuryPosition[]>({
    queryKey: ["/api/treasury/positions"],
  });

  const { data: sweeps, isLoading: sweepsLoading } = useQuery<TreasurySweep[]>({
    queryKey: ["/api/treasury/sweeps"],
  });

  const sweepMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/treasury/sweep", {
        fromAccount: "FBO Main",
        toStrategy: "Circle Yield",
        amount: 25000,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/treasury/sweeps"] });
      queryClient.invalidateQueries({ queryKey: ["/api/treasury/overview"] });
      toast({ title: "Sweep initiated", description: "$25,000 sweep to Circle Yield is processing." });
    },
  });

  const rebalanceMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/treasury/rebalance");
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/treasury/positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/treasury/overview"] });
      toast({
        title: "AI Rebalance complete",
        description: `${data.adjustments?.length || 0} adjustments executed successfully.`,
      });
    },
  });

  // Prepare donut chart data
  const chartData = (positions || [])
    .filter(p => p.status === "active" || p.status === "maturing")
    .map(p => ({
      name: p.strategyName,
      value: p.currentValue,
    }));

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }} data-testid="text-page-title">
            Treasury Yield Agent
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">AI-driven stablecoin yield optimization</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => sweepMutation.mutate()}
            disabled={sweepMutation.isPending}
            data-testid="button-sweep-idle"
          >
            <ArrowDownToLine className={`h-4 w-4 mr-2 ${sweepMutation.isPending ? "animate-pulse" : ""}`} />
            {sweepMutation.isPending ? "Sweeping..." : "Sweep Idle Balance"}
          </Button>
          <Button
            size="sm"
            onClick={() => rebalanceMutation.mutate()}
            disabled={rebalanceMutation.isPending}
            data-testid="button-ai-rebalance"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${rebalanceMutation.isPending ? "animate-spin" : ""}`} />
            {rebalanceMutation.isPending ? "Rebalancing..." : "AI Rebalance"}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            <Card data-testid="card-treasury-aum">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total AUM</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{formatCurrency(overview?.totalAum || 0)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-treasury-apy">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Weighted APY</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{overview?.weightedApy || 0}%</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Percent className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-treasury-yield">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Yield Earned (MTD)</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{formatCurrency(overview?.yieldEarnedMtd || 0)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-treasury-idle">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Idle Balance</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{formatCurrency(overview?.idleBalance || 0)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-violet-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Yield Allocation Donut Chart */}
        <Card data-testid="card-yield-allocation" className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Yield Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            {positionsLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(222 47% 9%)",
                      border: "1px solid hsl(217 33% 17%)",
                      borderRadius: "8px",
                      color: "hsl(210 40% 98%)",
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [formatCurrency(value), undefined]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            {/* Legend */}
            <div className="space-y-1.5 mt-2">
              {chartData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium tabular-nums">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Positions Table */}
        <Card data-testid="card-positions-table" className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Positions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {positionsLoading ? (
              <div className="p-4"><Skeleton className="h-[250px] w-full" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Strategy</TableHead>
                    <TableHead className="text-xs">Protocol</TableHead>
                    <TableHead className="text-xs text-right">Allocated</TableHead>
                    <TableHead className="text-xs text-right">Current</TableHead>
                    <TableHead className="text-xs text-center">APY</TableHead>
                    <TableHead className="text-xs">Risk</TableHead>
                    <TableHead className="text-xs">Maturity</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(positions || []).map((pos) => (
                    <TableRow
                      key={pos.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedPosition(pos)}
                      data-testid={`row-position-${pos.id}`}
                    >
                      <TableCell className="font-medium text-sm">{pos.strategyName}</TableCell>
                      <TableCell className="text-sm">{pos.protocol}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{formatCurrency(pos.allocatedAmount)}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums font-medium">{formatCurrency(pos.currentValue)}</TableCell>
                      <TableCell className="text-center text-sm tabular-nums font-medium text-emerald-600 dark:text-emerald-400">{pos.apy}%</TableCell>
                      <TableCell><RiskTierBadge tier={pos.riskTier} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{pos.maturityDate || "Liquid"}</TableCell>
                      <TableCell><PositionStatusBadge status={pos.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sweeps */}
      <Card data-testid="card-sweeps-table">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Recent Sweeps</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sweepsLoading ? (
            <div className="p-4"><Skeleton className="h-[200px] w-full" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">From</TableHead>
                  <TableHead className="text-xs">To Strategy</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(sweeps || []).slice(0, 15).map((sweep) => (
                  <TableRow key={sweep.id} data-testid={`row-sweep-${sweep.id}`}>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(sweep.createdAt)}</TableCell>
                    <TableCell className="text-sm">{sweep.fromAccount}</TableCell>
                    <TableCell className="text-sm font-medium">{sweep.toStrategy}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums font-medium">{formatCurrency(sweep.amount)}</TableCell>
                    <TableCell><SweepTypeBadge type={sweep.type} /></TableCell>
                    <TableCell><SweepStatusBadge status={sweep.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Position Detail Dialog */}
      <Dialog open={!!selectedPosition} onOpenChange={(open) => !open && setSelectedPosition(null)}>
        {selectedPosition && <PositionDetailDialog position={selectedPosition} />}
      </Dialog>

      <PerplexityAttribution />
    </div>
  );
}
