import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Shield, Users, Clock, FileCheck, AlertCircle, Plus, CheckCircle, X } from "lucide-react";
import type { ComplianceEntity, ComplianceAlert } from "@shared/schema";

const KYB_STAGES = ["application", "document_review", "verification", "approved", "rejected"];
const KYB_STAGE_LABELS: Record<string, string> = {
  application: "Application",
  document_review: "Document Review",
  verification: "Verification",
  approved: "Approved",
  rejected: "Rejected",
};

function KybStageBadge({ stage }: { stage: string }) {
  const map: Record<string, string> = {
    application: "badge-application",
    document_review: "badge-document-review",
    verification: "badge-verification",
    approved: "badge-approved",
    rejected: "badge-rejected",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[stage] || "badge-application"}`} data-testid={`badge-kyb-${stage}`}>
      {KYB_STAGE_LABELS[stage] || stage}
    </span>
  );
}

function KybProgressIndicator({ stage }: { stage: string }) {
  const stageOrder = ["application", "document_review", "verification", "approved"];
  const currentIdx = stageOrder.indexOf(stage);
  const isRejected = stage === "rejected";

  return (
    <div className="flex items-center gap-1" data-testid="kyb-progress">
      {stageOrder.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div className={`h-2 w-2 rounded-full transition-all ${
            isRejected ? "bg-red-500/30"
            : i <= currentIdx ? "bg-primary" : "bg-muted-foreground/20"
          }`} />
          {i < stageOrder.length - 1 && (
            <div className={`h-0.5 w-3 transition-all ${
              isRejected ? "bg-red-500/20"
              : i < currentIdx ? "bg-primary" : "bg-muted-foreground/20"
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    low: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[severity] || map.low}`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}

function EntityDetailDialog({ entity }: { entity: ComplianceEntity }) {
  let documents: Record<string, boolean> = {};
  try {
    documents = JSON.parse(entity.documentsJson || "{}");
  } catch {}

  return (
    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold">{entity.entityName}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Jurisdiction</span>
            <p className="font-medium">{entity.jurisdiction}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Registration</span>
            <p className="font-medium font-mono text-xs">{entity.registrationNumber}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">KYB Stage</span>
            <KybStageBadge stage={entity.kybStage} />
          </div>
          <div>
            <span className="text-muted-foreground text-xs">MoR Status</span>
            <p className="font-medium capitalize">{entity.morStatus}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Compliance Score</span>
            <p className="font-bold tabular-nums">{entity.complianceScore || "—"}</p>
          </div>
        </div>

        {/* KYB Progress */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">KYB Progress</p>
          <div className="flex items-center gap-2">
            {["Application", "Document Review", "Verification", "Approved"].map((label, i) => {
              const stageOrder = ["application", "document_review", "verification", "approved"];
              const currentIdx = stageOrder.indexOf(entity.kybStage);
              const isActive = i <= currentIdx && entity.kybStage !== "rejected";
              return (
                <div key={label} className="flex items-center gap-2 flex-1">
                  <div className={`flex flex-col items-center flex-1 ${isActive ? "" : "opacity-40"}`}>
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </div>
                    <span className="text-[9px] mt-1 text-center leading-tight">{label}</span>
                  </div>
                  {i < 3 && <div className={`h-0.5 w-full mt-[-12px] ${isActive && i < currentIdx ? "bg-primary" : "bg-muted"}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Document Checklist */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide">Document Checklist</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-1.5">
            {Object.entries(documents).map(([doc, completed]) => (
              <div key={doc} className="flex items-center gap-2 text-sm">
                {completed ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                )}
                <span className={completed ? "text-foreground" : "text-muted-foreground"}>
                  {doc.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DialogContent>
  );
}

function AddEntityDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    entityName: "",
    jurisdiction: "",
    registrationNumber: "",
    corridor: "",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/compliance/entities", {
        entityName: formData.entityName,
        jurisdiction: formData.jurisdiction,
        registrationNumber: formData.registrationNumber,
        kybStage: "application",
        morStatus: "pending",
        complianceScore: 0,
        documentsJson: JSON.stringify({
          certificate_of_incorporation: false,
          proof_of_address: false,
          director_id: false,
          bank_statement: false,
          tax_registration: false,
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance/entities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/compliance/overview"] });
      toast({ title: "Entity added", description: "New entity has been submitted for KYB review." });
      setOpen(false);
      setFormData({ entityName: "", jurisdiction: "", registrationNumber: "", corridor: "" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-entity">
          <Plus className="h-4 w-4 mr-2" />
          Add Entity
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Compliance Entity</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Company Name</Label>
            <Input
              placeholder="Company name"
              value={formData.entityName}
              onChange={(e) => setFormData({ ...formData, entityName: e.target.value })}
              data-testid="input-entity-name"
            />
          </div>
          <div>
            <Label className="text-xs">Jurisdiction</Label>
            <Select value={formData.jurisdiction} onValueChange={(v) => setFormData({ ...formData, jurisdiction: v })}>
              <SelectTrigger data-testid="select-jurisdiction">
                <SelectValue placeholder="Select jurisdiction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Argentina">Argentina</SelectItem>
                <SelectItem value="Mexico">Mexico</SelectItem>
                <SelectItem value="Poland">Poland</SelectItem>
                <SelectItem value="Vietnam">Vietnam</SelectItem>
                <SelectItem value="Romania">Romania</SelectItem>
                <SelectItem value="Thailand">Thailand</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Registration Number</Label>
            <Input
              placeholder="Registration number"
              value={formData.registrationNumber}
              onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
              data-testid="input-registration"
            />
          </div>
          <Button
            className="w-full"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !formData.entityName || !formData.jurisdiction || !formData.registrationNumber}
            data-testid="button-submit-entity"
          >
            {createMutation.isPending ? "Adding..." : "Add Entity"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Compliance() {
  const [selectedEntity, setSelectedEntity] = useState<ComplianceEntity | null>(null);
  const { toast } = useToast();

  const { data: overview, isLoading: overviewLoading } = useQuery<{
    entitiesOnboarded: number; pendingReviews: number; activeMorAgreements: number; complianceScore: number;
  }>({ queryKey: ["/api/compliance/overview"] });

  const { data: entities, isLoading: entitiesLoading } = useQuery<ComplianceEntity[]>({
    queryKey: ["/api/compliance/entities"],
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery<ComplianceAlert[]>({
    queryKey: ["/api/compliance/alerts"],
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/compliance/alerts/${id}/resolve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance/alerts"] });
      toast({ title: "Alert resolved" });
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }} data-testid="text-page-title">
            Compliance Agent
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">KYB pipeline, entity management, and compliance monitoring</p>
        </div>
        <AddEntityDialog />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            <Card data-testid="card-entities-onboarded">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Onboarded</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{overview?.entitiesOnboarded || 0}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-pending-reviews">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Pending Reviews</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{overview?.pendingReviews || 0}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-mor-agreements">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Active MoR</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{overview?.activeMorAgreements || 0}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileCheck className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-compliance-score">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Compliance Score</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{overview?.complianceScore || 0}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-violet-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* KYB Pipeline Table */}
      <Card data-testid="card-kyb-pipeline">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">KYB Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {entitiesLoading ? (
            <div className="p-4"><Skeleton className="h-[250px] w-full" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Entity</TableHead>
                  <TableHead className="text-xs">Jurisdiction</TableHead>
                  <TableHead className="text-xs">Stage</TableHead>
                  <TableHead className="text-xs">Progress</TableHead>
                  <TableHead className="text-xs">MoR</TableHead>
                  <TableHead className="text-xs text-center">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(entities || []).map((entity) => (
                  <TableRow
                    key={entity.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedEntity(entity)}
                    data-testid={`row-entity-${entity.id}`}
                  >
                    <TableCell className="font-medium text-sm">{entity.entityName}</TableCell>
                    <TableCell className="text-sm">{entity.jurisdiction}</TableCell>
                    <TableCell><KybStageBadge stage={entity.kybStage} /></TableCell>
                    <TableCell><KybProgressIndicator stage={entity.kybStage} /></TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium capitalize ${
                        entity.morStatus === "active" ? "text-emerald-600 dark:text-emerald-400"
                        : entity.morStatus === "expired" ? "text-red-600 dark:text-red-400"
                        : entity.morStatus === "suspended" ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground"
                      }`}>
                        {entity.morStatus}
                      </span>
                    </TableCell>
                    <TableCell className="text-center tabular-nums font-medium text-sm">{entity.complianceScore || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Compliance Alerts */}
      <Card data-testid="card-compliance-alerts">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Compliance Alerts</CardTitle>
            {alerts && <span className="text-xs text-muted-foreground">{alerts.length} active</span>}
          </div>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <div className="space-y-2">
              {(alerts || []).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0"
                  data-testid={`alert-${alert.id}`}
                >
                  <AlertCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                    alert.severity === "critical" ? "text-red-500" : alert.severity === "high" ? "text-orange-500" : alert.severity === "medium" ? "text-amber-500" : "text-blue-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <SeverityBadge severity={alert.severity} />
                      <span className="text-xs text-muted-foreground capitalize">{alert.type.replace(/_/g, " ")}</span>
                    </div>
                    <p className="text-sm">{alert.message}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 flex-shrink-0"
                    onClick={() => resolveMutation.mutate(alert.id)}
                    disabled={resolveMutation.isPending}
                    data-testid={`button-resolve-${alert.id}`}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entity Detail Dialog */}
      <Dialog open={!!selectedEntity} onOpenChange={(open) => !open && setSelectedEntity(null)}>
        {selectedEntity && <EntityDetailDialog entity={selectedEntity} />}
      </Dialog>

      <PerplexityAttribution />
    </div>
  );
}
