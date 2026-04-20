import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Brain, TrendingUp, AlertTriangle, CreditCard, RefreshCw, DollarSign, Percent, Clock, ArrowDownToLine, ArrowUpFromLine, ExternalLink } from "lucide-react";
import { StatusPill } from "@/components/StatusPill";
import type { Client, CreditAssessment, RbfFacility } from "@shared/schema";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function RiskBadge({ tier }: { tier: string | null }) {
  const map: Record<string, string> = {
    low: "badge-risk-low", medium: "badge-risk-medium", high: "badge-risk-high",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[tier || "medium"]}`} data-testid={`badge-risk-${tier}`}>
      {(tier || "unknown").charAt(0).toUpperCase() + (tier || "unknown").slice(1)}
    </span>
  );
}

function RecommendationBadge({ rec }: { rec: string }) {
  const map: Record<string, { label: string; className: string }> = {
    increase: { label: "↑ Increase Limit", className: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30" },
    maintain: { label: "→ Maintain", className: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30" },
    flag_review: { label: "⚠ Flag for Review", className: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30" },
    decrease: { label: "↓ Decrease Limit", className: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30" },
  };
  const item = map[rec] || map.maintain;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.className}`}>
      {item.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30",
    pending_approval: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30",
    fully_repaid: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
    defaulted: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || map.active}`} data-testid={`badge-rbf-status-${status}`}>
      {status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? "bg-emerald-500" : value >= 60 ? "bg-primary" : value >= 40 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-bold tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function CreditDetailDialog({ client, assessment, onRunAssessment, isRunning }: {
  client: Client;
  assessment: CreditAssessment | undefined;
  onRunAssessment: () => void;
  isRunning: boolean;
}) {
  return (
    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold">{client.name}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        {/* Score Overview */}
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-xl font-bold text-primary tabular-nums">{client.creditScore || "—"}</span>
          </div>
          <div>
            <p className="text-sm font-medium">AI Credit Score</p>
            <div className="flex items-center gap-2 mt-0.5">
              <RiskBadge tier={client.riskTier} />
              {assessment && <RecommendationBadge rec={assessment.recommendation} />}
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        {assessment && (
          <Card>
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide">Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 space-y-2.5">
              <ScoreBar label="Revenue Consistency" value={assessment.revenueConsistency} />
              <ScoreBar label="Payment History" value={assessment.paymentHistory} />
              <ScoreBar label="Corridor Risk" value={assessment.corridorRisk} />
              <ScoreBar label="ERP Health" value={assessment.erpHealth} />
            </CardContent>
          </Card>
        )}

        {/* Credit Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Credit Limit</span>
            <p className="font-bold tabular-nums">{formatCurrency(client.creditLimit || 0)}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Recommended Limit</span>
            <p className="font-bold tabular-nums">{formatCurrency(assessment?.recommendedLimit || 0)}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Corridor</span>
            <p className="font-medium">{client.corridor}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Last Assessment</span>
            <p className="font-medium">{assessment ? new Date(assessment.assessedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Never"}</p>
          </div>
        </div>

        {/* Run Assessment */}
        <Button
          className="w-full"
          onClick={onRunAssessment}
          disabled={isRunning}
          data-testid="button-run-assessment"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? "animate-spin" : ""}`} />
          {isRunning ? "Running Assessment..." : "Run AI Assessment"}
        </Button>
      </div>
    </DialogContent>
  );
}

function RbfDetailDialog({ facility, client, onDraw, onRepay, isDrawing, isRepaying }: {
  facility: RbfFacility;
  client: Client | undefined;
  onDraw: () => void;
  onRepay: () => void;
  isDrawing: boolean;
  isRepaying: boolean;
}) {
  const available = facility.facilityAmount - facility.drawnAmount;
  const outstanding = facility.drawnAmount - facility.repaidAmount;
  const drawnPct = (facility.drawnAmount / facility.facilityAmount) * 100;
  const repaidPct = (facility.repaidAmount / facility.facilityAmount) * 100;

  return (
    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold">{client?.name || "Unknown Client"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        {/* Facility Overview */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Facility Amount</span>
            <p className="font-bold tabular-nums" data-testid="text-rbf-facility-amount">{formatCurrency(facility.facilityAmount)}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Drawn</span>
            <p className="font-bold tabular-nums" data-testid="text-rbf-drawn">{formatCurrency(facility.drawnAmount)}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Available</span>
            <p className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(available)}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Repaid</span>
            <p className="font-bold tabular-nums" data-testid="text-rbf-repaid">{formatCurrency(facility.repaidAmount)}</p>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <Card>
          <CardContent className="p-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Facility Utilization</p>
            <div className="h-4 bg-muted rounded-full overflow-hidden flex">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${repaidPct}%` }}
                title={`Repaid: ${formatCurrency(facility.repaidAmount)}`}
              />
              <div
                className="h-full bg-amber-500 transition-all"
                style={{ width: `${drawnPct - repaidPct}%` }}
                title={`Outstanding: ${formatCurrency(outstanding)}`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Repaid ({repaidPct.toFixed(0)}%)</span>
              <span>Outstanding ({(drawnPct - repaidPct).toFixed(0)}%)</span>
              <span>Available ({(100 - drawnPct).toFixed(0)}%)</span>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Share Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Revenue Share</span>
            <p className="font-bold tabular-nums">{facility.revenueSharePct}%</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Repayment Cap</span>
            <p className="font-bold tabular-nums">{facility.repaymentCap}x</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Term</span>
            <p className="font-bold">{facility.termMonths} months</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Monthly Revenue</span>
            <p className="font-bold tabular-nums">{formatCurrency(facility.monthlyRevenue || 0)}</p>
          </div>
        </div>

        {/* Actions */}
        {facility.status === "active" && (
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={onDraw}
              disabled={isDrawing || available <= 0}
              data-testid="button-rbf-draw"
            >
              <ArrowDownToLine className="h-4 w-4 mr-2" />
              {isDrawing ? "Processing..." : "Draw $500,000"}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={onRepay}
              disabled={isRepaying || outstanding <= 0}
              data-testid="button-rbf-repay"
            >
              <ArrowUpFromLine className="h-4 w-4 mr-2" />
              {isRepaying ? "Processing..." : "Repay $250,000"}
            </Button>
          </div>
        )}
      </div>
    </DialogContent>
  );
}

// ---- Invoice Factoring Tab ----
function InvoiceFactoringTab() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { toast } = useToast();

  const { data: overview, isLoading: overviewLoading } = useQuery<{
    totalCreditExtended: number; defaultRate: number; avgCreditScore: number; activeLines: number;
  }>({ queryKey: ["/api/credit/overview"] });

  const { data: assessments, isLoading: assessmentsLoading } = useQuery<CreditAssessment[]>({
    queryKey: ["/api/credit/assessments"],
  });

  const { data: clientList } = useQuery<Client[]>({ queryKey: ["/api/clients"] });
  const clients = clientList || [];

  const assessmentMap = new Map((assessments || []).map(a => [a.clientId, a]));

  const runAssessmentMutation = useMutation({
    mutationFn: async (clientId: number) => {
      const res = await apiRequest("POST", `/api/credit/assess/${clientId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit/assessments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credit/overview"] });
      toast({ title: "Assessment complete", description: "AI credit assessment has been updated." });
    },
  });

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            <Card data-testid="card-total-credit">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Credit</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{formatCurrency(overview?.totalCreditExtended || 0)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-default-rate">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Default Rate</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{overview?.defaultRate || 0}%</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-avg-score">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Avg Score</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{overview?.avgCreditScore || 0}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Brain className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-active-lines">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Active Lines</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{overview?.activeLines || 0}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-violet-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Client Credit Table */}
      <Card data-testid="card-credit-table">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Client Credit Assessments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {assessmentsLoading ? (
            <div className="p-4"><Skeleton className="h-[300px] w-full" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Client</TableHead>
                  <TableHead className="text-xs">Corridor</TableHead>
                  <TableHead className="text-xs text-center">AI Score</TableHead>
                  <TableHead className="text-xs text-right">Credit Limit</TableHead>
                  <TableHead className="text-xs">Risk Tier</TableHead>
                  <TableHead className="text-xs">Recommendation</TableHead>
                  <TableHead className="text-xs">Last Assessed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.filter(c => c.status === "active").map((client) => {
                  const assessment = assessmentMap.get(client.id);
                  return (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedClient(client)}
                      data-testid={`row-credit-${client.id}`}
                    >
                      <TableCell className="font-medium text-sm">{client.name}</TableCell>
                      <TableCell className="text-sm">{client.corridor}</TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center justify-center h-7 w-7 rounded-md text-xs font-bold tabular-nums ${
                          (client.creditScore || 0) >= 80 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : (client.creditScore || 0) >= 60 ? "bg-primary/10 text-primary"
                          : (client.creditScore || 0) >= 40 ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          {client.creditScore || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums font-medium">{formatCurrency(client.creditLimit || 0)}</TableCell>
                      <TableCell><RiskBadge tier={client.riskTier} /></TableCell>
                      <TableCell>{assessment ? <RecommendationBadge rec={assessment.recommendation} /> : "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {assessment ? new Date(assessment.assessedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Credit Detail Dialog */}
      <Dialog open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
        {selectedClient && (
          <CreditDetailDialog
            client={selectedClient}
            assessment={assessmentMap.get(selectedClient.id)}
            onRunAssessment={() => runAssessmentMutation.mutate(selectedClient.id)}
            isRunning={runAssessmentMutation.isPending}
          />
        )}
      </Dialog>
    </div>
  );
}

// ---- Revenue-Based Financing Tab ----
function RbfTab() {
  const [selectedFacility, setSelectedFacility] = useState<RbfFacility | null>(null);
  const { toast } = useToast();

  const { data: rbfOverview, isLoading: rbfOverviewLoading } = useQuery<{
    totalFacilities: number; activeDrawn: number; avgRevenueShare: number; repaymentRate: number;
  }>({ queryKey: ["/api/rbf/overview"] });

  const { data: facilities, isLoading: facilitiesLoading } = useQuery<RbfFacility[]>({
    queryKey: ["/api/rbf/facilities"],
  });

  const { data: clientList } = useQuery<Client[]>({ queryKey: ["/api/clients"] });
  const clientMap = new Map((clientList || []).map(c => [c.id, c]));

  const drawMutation = useMutation({
    mutationFn: async (clientId: number) => {
      const res = await apiRequest("POST", `/api/rbf/${clientId}/draw`, { amount: 10000 });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rbf/facilities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rbf/overview"] });
      toast({ title: "Draw processed", description: "$500,000 has been drawn from the facility." });
    },
  });

  const repayMutation = useMutation({
    mutationFn: async (clientId: number) => {
      const res = await apiRequest("POST", `/api/rbf/${clientId}/repay`, { amount: 5000 });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rbf/facilities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rbf/overview"] });
      toast({ title: "Repayment processed", description: "$250,000 repayment has been recorded." });
    },
  });

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {rbfOverviewLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            <Card data-testid="card-rbf-total-facilities">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Facilities</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{formatCurrency(rbfOverview?.totalFacilities || 0)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-rbf-active-drawn">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Active Drawn</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{formatCurrency(rbfOverview?.activeDrawn || 0)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <ArrowDownToLine className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-rbf-avg-share">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Avg Revenue Share</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{rbfOverview?.avgRevenueShare || 0}%</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Percent className="h-5 w-5 text-violet-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-rbf-repayment-rate">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Repayment Rate</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{rbfOverview?.repaymentRate || 0}%</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* RBF Facilities Table */}
      <Card data-testid="card-rbf-table">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">RBF Facilities</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {facilitiesLoading ? (
            <div className="p-4"><Skeleton className="h-[300px] w-full" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Client</TableHead>
                  <TableHead className="text-xs">Corridor</TableHead>
                  <TableHead className="text-xs text-right">Facility</TableHead>
                  <TableHead className="text-xs text-right">Drawn</TableHead>
                  <TableHead className="text-xs text-right">Repaid</TableHead>
                  <TableHead className="text-xs text-center">Rev Share %</TableHead>
                  <TableHead className="text-xs text-center">Term</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(facilities || []).map((facility) => {
                  const client = clientMap.get(facility.clientId);
                  return (
                    <TableRow
                      key={facility.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedFacility(facility)}
                      data-testid={`row-rbf-${facility.id}`}
                    >
                      <TableCell className="font-medium text-sm">{client?.name || "Unknown"}</TableCell>
                      <TableCell className="text-sm">{client?.corridor || "—"}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums font-medium">{formatCurrency(facility.facilityAmount)}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{formatCurrency(facility.drawnAmount)}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{formatCurrency(facility.repaidAmount)}</TableCell>
                      <TableCell className="text-center text-sm tabular-nums">{facility.revenueSharePct}%</TableCell>
                      <TableCell className="text-center text-sm">{facility.termMonths}mo</TableCell>
                      <TableCell><StatusBadge status={facility.status} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* RBF Detail Dialog */}
      <Dialog open={!!selectedFacility} onOpenChange={(open) => !open && setSelectedFacility(null)}>
        {selectedFacility && (
          <RbfDetailDialog
            facility={selectedFacility}
            client={clientMap.get(selectedFacility.clientId)}
            onDraw={() => drawMutation.mutate(selectedFacility.clientId)}
            onRepay={() => repayMutation.mutate(selectedFacility.clientId)}
            isDrawing={drawMutation.isPending}
            isRepaying={repayMutation.isPending}
          />
        )}
      </Dialog>
    </div>
  );
}

// ---- Facility Header (Meridian) ----
function FacilityHeader() {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Facility</div>
          <div className="mt-1 text-sm font-medium">Invoice Factoring</div>
          <StatusPill stage="live" className="mt-1" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Limit</div>
          <div className="mt-1 text-sm font-semibold tabular-nums">$18,000,000</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Utilized</div>
          <div className="mt-1 text-sm font-semibold tabular-nums">$11,200,000</div>
          <div className="text-[11px] text-muted-foreground">62% of limit</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Advance rate</div>
          <div className="mt-1 text-sm font-semibold tabular-nums">85%</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Policy</div>
          <div className="mt-1 text-sm font-semibold">ACB v4.12</div>
          <a
            href="/#/engine-room/#memo"
            className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80"
          >
            Why this limit? <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

// ---- Main Credit Page ----
export default function CreditAgent() {
  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Credit</div>
          <h1 className="text-2xl font-bold mt-1" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }} data-testid="text-page-title">
            Facilities & Credit
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">
            Your working-capital facilities, drawdowns, and repayments — underwritten continuously by the Atlas Credit OS.
          </p>
        </div>
      </div>

      <FacilityHeader />

      <Tabs defaultValue="factoring" data-testid="tabs-credit-agent">
        <TabsList data-testid="tabslist-credit-agent">
          <TabsTrigger value="factoring" data-testid="tab-invoice-factoring">Facilities</TabsTrigger>
          <TabsTrigger value="rbf" data-testid="tab-rbf">RBF</TabsTrigger>
          <TabsTrigger value="drawdowns" data-testid="tab-drawdowns">Drawdowns & Repayments</TabsTrigger>
        </TabsList>
        <TabsContent value="factoring" className="mt-4">
          <InvoiceFactoringTab />
        </TabsContent>
        <TabsContent value="rbf" className="mt-4">
          <RbfTab />
        </TabsContent>
        <TabsContent value="drawdowns" className="mt-4">
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <div className="text-sm font-medium">Drawdowns & repayments</div>
            <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
              Unified drawdown timeline across factoring and RBF. RBF draws and repayments are live in the RBF tab; factoring advances flow through the Invoices page.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
