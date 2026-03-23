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
import { GitCompareArrows, CheckCircle2, AlertTriangle, XCircle, Clock, RefreshCw, Database } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { Reconciliation, ErpConnection } from "@shared/schema";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatCurrencyPrecise(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ReconciliationStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    matched: { label: "Matched", className: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30" },
    unmatched: { label: "Unmatched", className: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30" },
    discrepancy: { label: "Discrepancy", className: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30" },
    pending_review: { label: "Pending Review", className: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30" },
    resolved: { label: "Resolved", className: "text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/30" },
  };
  const item = map[status] || map.matched;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.className}`} data-testid={`badge-recon-status-${status}`}>
      {item.label}
    </span>
  );
}

function RecordTypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    invoice: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
    payment: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30",
    journal_entry: "text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30",
    credit_note: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[type] || map.invoice}`} data-testid={`badge-record-type-${type}`}>
      {type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  );
}

function ErpStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    connected: { label: "Connected", className: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30" },
    syncing: { label: "Syncing", className: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30" },
    disconnected: { label: "Disconnected", className: "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30" },
    error: { label: "Error", className: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30" },
  };
  const item = map[status] || map.connected;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.className}`} data-testid={`badge-erp-status-${status}`}>
      {item.label}
    </span>
  );
}

const erpColors: Record<string, string> = {
  quickbooks: "border-emerald-500/30 bg-emerald-500/5",
  xero: "border-blue-500/30 bg-blue-500/5",
  netsuite: "border-orange-500/30 bg-orange-500/5",
  sage: "border-green-500/30 bg-green-500/5",
};

const statusChartColors: Record<string, string> = {
  matched: "#10b981",
  unmatched: "#ef4444",
  discrepancy: "#f59e0b",
  pending_review: "#3b82f6",
  resolved: "#14b8a6",
};

function RecordDetailDialog({ record, onResolve, isResolving }: {
  record: Reconciliation;
  onResolve: () => void;
  isResolving: boolean;
}) {
  return (
    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold" data-testid="text-recon-detail-title">
          {record.atlasRef}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Record Type</span>
            <div className="mt-1"><RecordTypeBadge type={record.recordType} /></div>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Status</span>
            <div className="mt-1"><ReconciliationStatusBadge status={record.status} /></div>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">ERP System</span>
            <p className="font-medium capitalize">{record.erpSystem}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Sync Direction</span>
            <p className="font-medium">{record.syncDirection.replace(/_/g, " → ").replace("atlas", "Atlas").replace("erp", "ERP")}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Atlas Ref</span>
            <p className="font-medium font-mono text-xs">{record.atlasRef}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">ERP Ref</span>
            <p className="font-medium font-mono text-xs">{record.erpRef || "—"}</p>
          </div>
        </div>

        {record.status === "discrepancy" && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="text-xs font-medium text-amber-500 mb-2">Amount Discrepancy</p>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">Atlas</span>
                <p className="font-bold">{formatCurrencyPrecise(record.atlasAmount)}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">ERP</span>
                <p className="font-bold">{formatCurrencyPrecise(record.erpAmount || 0)}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Delta</span>
                <p className="font-bold text-red-500">{formatCurrencyPrecise(record.discrepancyAmount || 0)}</p>
              </div>
            </div>
          </div>
        )}

        {record.status === "unmatched" && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
            <p className="text-xs font-medium text-red-500 mb-1">Unmatched Record</p>
            <p className="text-sm text-muted-foreground">No matching ERP record found for Atlas amount {formatCurrencyPrecise(record.atlasAmount)}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Atlas Amount</span>
            <p className="font-bold">{formatCurrencyPrecise(record.atlasAmount)}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">ERP Amount</span>
            <p className="font-bold">{record.erpAmount != null ? formatCurrencyPrecise(record.erpAmount) : "—"}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Currency</span>
            <p className="font-medium">{record.currency}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Created</span>
            <p className="font-medium">{formatDate(record.createdAt)}</p>
          </div>
        </div>

        {(record.status === "unmatched" || record.status === "discrepancy") && (
          <Button
            onClick={onResolve}
            disabled={isResolving}
            className="w-full"
            data-testid="button-resolve-record"
          >
            {isResolving ? "Resolving..." : "Resolve"}
          </Button>
        )}
      </div>
    </DialogContent>
  );
}

export default function ReconciliationPage() {
  const [selectedRecord, setSelectedRecord] = useState<Reconciliation | null>(null);
  const { toast } = useToast();

  const { data: overview, isLoading: overviewLoading } = useQuery<{
    totalRecords: number; matchedRecords: number; matchRate: number;
    unresolvedDiscrepancies: number; totalDiscrepancyValue: number;
  }>({ queryKey: ["/api/reconciliation/overview"] });

  const { data: records, isLoading: recordsLoading } = useQuery<Reconciliation[]>({
    queryKey: ["/api/reconciliation/records"],
  });

  const { data: byStatus, isLoading: statusLoading } = useQuery<Array<{ status: string; count: number }>>({
    queryKey: ["/api/reconciliation/by-status"],
  });

  const { data: erpConnections, isLoading: erpLoading } = useQuery<ErpConnection[]>({
    queryKey: ["/api/erp/connections"],
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/reconciliation/${id}/resolve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reconciliation/records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reconciliation/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reconciliation/by-status"] });
      setSelectedRecord(null);
      toast({ title: "Record resolved", description: "Reconciliation record has been marked as resolved." });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/reconciliation/sync");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reconciliation/records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reconciliation/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reconciliation/by-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/erp/connections"] });
      toast({ title: "Sync complete", description: "ERP synchronization completed successfully." });
    },
  });

  const erpSyncMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/erp/${id}/sync`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp/connections"] });
      toast({ title: "Sync started", description: "ERP connection sync initiated." });
    },
  });

  const chartData = byStatus?.map(s => ({ name: s.status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()), value: s.count, status: s.status })) || [];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }} data-testid="text-page-title">
            Reconciliation Agent
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Autonomous ERP sync, matching, and discrepancy resolution</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} data-testid="button-run-sync">
            <RefreshCw className={`h-4 w-4 mr-1 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            Run Sync
          </Button>
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
            <Card data-testid="card-total-records">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Records</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{overview?.totalRecords || 0}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-match-rate">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Match Rate</p>
                    <p className={`text-xl font-bold tabular-nums mt-1 ${(overview?.matchRate || 0) >= 95 ? "text-emerald-500" : "text-amber-500"}`}>
                      {(overview?.matchRate || 0).toFixed(1)}%
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-unresolved-discrepancies">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Unresolved</p>
                    <p className={`text-xl font-bold tabular-nums mt-1 ${(overview?.unresolvedDiscrepancies || 0) > 5 ? "text-red-500" : "text-amber-500"}`}>
                      {overview?.unresolvedDiscrepancies || 0}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-discrepancy-value">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Discrepancy Value</p>
                    <p className="text-xl font-bold tabular-nums mt-1 text-red-500">{formatCurrency(overview?.totalDiscrepancyValue || 0)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ERP Connection Status */}
      <div>
        <h2 className="text-sm font-semibold mb-3 uppercase tracking-wide text-muted-foreground" data-testid="text-erp-connections-title">ERP Connections</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {erpLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
            ))
          ) : (
            erpConnections?.map(conn => (
              <Card key={conn.id} className={`border ${erpColors[conn.erpSystem] || ""}`} data-testid={`card-erp-${conn.erpSystem}-${conn.id}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold capitalize text-sm">{conn.erpSystem}</span>
                    <ErpStatusBadge status={conn.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Last Sync</span>
                      <p className="font-medium">{conn.lastSyncAt ? formatDate(conn.lastSyncAt) : "—"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Records</span>
                      <p className="font-medium">{conn.recordsSynced}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Match Rate</span>
                      <p className="font-medium">{conn.matchRate != null ? `${conn.matchRate}%` : "—"}</p>
                    </div>
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => erpSyncMutation.mutate(conn.id)}
                        disabled={erpSyncMutation.isPending}
                        data-testid={`button-sync-erp-${conn.id}`}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Sync
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Reconciliation Status Breakdown */}
      <Card data-testid="card-recon-status-chart">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={statusChartColors[entry.status] || "#6b7280"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Reconciliation Records Table */}
      <Card data-testid="card-recon-records-table">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Reconciliation Records</CardTitle>
        </CardHeader>
        <CardContent>
          {recordsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Record Type</TableHead>
                    <TableHead className="text-xs">Atlas Ref</TableHead>
                    <TableHead className="text-xs">ERP Ref</TableHead>
                    <TableHead className="text-xs text-right">Atlas Amount</TableHead>
                    <TableHead className="text-xs text-right">ERP Amount</TableHead>
                    <TableHead className="text-xs text-right">Discrepancy</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records?.map(rec => (
                    <TableRow
                      key={rec.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedRecord(rec)}
                      data-testid={`row-recon-${rec.id}`}
                    >
                      <TableCell className="text-sm">{formatDate(rec.createdAt)}</TableCell>
                      <TableCell><RecordTypeBadge type={rec.recordType} /></TableCell>
                      <TableCell className="text-sm font-mono">{rec.atlasRef}</TableCell>
                      <TableCell className="text-sm font-mono">{rec.erpRef || "—"}</TableCell>
                      <TableCell className="text-sm text-right tabular-nums">{formatCurrencyPrecise(rec.atlasAmount)}</TableCell>
                      <TableCell className="text-sm text-right tabular-nums">{rec.erpAmount != null ? formatCurrencyPrecise(rec.erpAmount) : "—"}</TableCell>
                      <TableCell className="text-sm text-right tabular-nums">
                        {rec.discrepancyAmount != null && rec.discrepancyAmount > 0 ? (
                          <span className="text-red-500 font-medium">{formatCurrencyPrecise(rec.discrepancyAmount)}</span>
                        ) : "—"}
                      </TableCell>
                      <TableCell><ReconciliationStatusBadge status={rec.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Detail Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={(open) => { if (!open) setSelectedRecord(null); }}>
        {selectedRecord && (
          <RecordDetailDialog
            record={selectedRecord}
            onResolve={() => resolveMutation.mutate(selectedRecord.id)}
            isResolving={resolveMutation.isPending}
          />
        )}
      </Dialog>

      <PerplexityAttribution />
    </div>
  );
}
