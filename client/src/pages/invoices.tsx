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
import { Progress } from "@/components/ui/progress";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Filter } from "lucide-react";
import type { Invoice, Client } from "@shared/schema";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "badge-draft", sent: "badge-sent", factored: "badge-factored", settled: "badge-settled",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || "badge-draft"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function SettlementProgressBar({ status }: { status: string }) {
  const stages = ["Received", "Converting", "Settling", "Complete"];
  const stageIndex = status === "settled" ? 3 : status === "factored" ? 2 : status === "sent" ? 1 : 0;
  const progress = ((stageIndex + 1) / stages.length) * 100;

  return (
    <div className="space-y-2" data-testid="settlement-progress">
      <Progress value={progress} className="h-2" />
      <div className="flex justify-between">
        {stages.map((stage, i) => (
          <div key={stage} className="flex flex-col items-center">
            <div className={`h-3 w-3 rounded-full border-2 mb-1 ${
              i <= stageIndex ? "bg-primary border-primary" : "bg-muted border-muted-foreground/30"
            }`} />
            <span className={`text-[10px] ${i <= stageIndex ? "text-primary font-medium" : "text-muted-foreground"}`}>
              {stage}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InvoiceDetailDialog({ invoice, clients }: { invoice: Invoice; clients: Client[] }) {
  const { toast } = useToast();
  const client = clients.find(c => c.id === invoice.clientId);

  const factorMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/invoices/${invoice.id}/factor`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "Invoice factored", description: `${invoice.invoiceNumber} has been submitted for factoring.` });
    },
  });

  const advanceRate = 0.92;
  const fee = invoice.amount * 0.035;
  const advanceAmount = invoice.amount * advanceRate - fee;

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold">{invoice.invoiceNumber}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Client</span>
            <p className="font-medium" data-testid="text-invoice-client">{client?.name || "Unknown"}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Amount</span>
            <p className="font-medium tabular-nums" data-testid="text-invoice-amount">{formatCurrency(invoice.amount)}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Corridor</span>
            <p className="font-medium">{invoice.corridor}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Method</span>
            <p className="font-medium">{invoice.settlementMethod || "—"}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Status</span>
            <StatusBadge status={invoice.status} />
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Due Date</span>
            <p className="font-medium">{invoice.dueDate}</p>
          </div>
        </div>

        {/* Settlement Progress */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Settlement Tracking</p>
          <SettlementProgressBar status={invoice.status} />
        </div>

        {/* Factoring Panel */}
        {(invoice.factoringStatus === "eligible" || invoice.factoringStatus === "none") && invoice.status !== "settled" && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Factoring Available</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-[10px] text-muted-foreground">Advance Rate</span>
                  <p className="font-bold tabular-nums">{(advanceRate * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Fee</span>
                  <p className="font-bold tabular-nums">{formatCurrency(fee)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">You Receive</span>
                  <p className="font-bold tabular-nums text-primary">{formatCurrency(advanceAmount)}</p>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full mt-2"
                onClick={() => factorMutation.mutate()}
                disabled={factorMutation.isPending}
                data-testid="button-factor-invoice"
              >
                {factorMutation.isPending ? "Processing..." : "Factor This Invoice"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DialogContent>
  );
}

function NewInvoiceDialog({ clients }: { clients: Client[] }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    amount: "",
    corridor: "",
    description: "",
    dueDate: "",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/invoices", {
        clientId: parseInt(formData.clientId),
        invoiceNumber: `INV-${Date.now().toString().slice(-8)}`,
        amount: parseFloat(formData.amount),
        currency: "USD",
        corridor: formData.corridor,
        status: "draft",
        settlementMethod: "USDC",
        factoringStatus: "none",
        dueDate: formData.dueDate,
        createdAt: new Date().toISOString(),
        description: formData.description,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "Invoice created", description: "New invoice has been created as draft." });
      setOpen(false);
      setFormData({ clientId: "", amount: "", corridor: "", description: "", dueDate: "" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-create-invoice">
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Client</Label>
            <Select value={formData.clientId} onValueChange={(v) => setFormData({ ...formData, clientId: v })}>
              <SelectTrigger data-testid="select-client">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Amount (USD)</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              data-testid="input-amount"
            />
          </div>
          <div>
            <Label className="text-xs">Corridor</Label>
            <Select value={formData.corridor} onValueChange={(v) => setFormData({ ...formData, corridor: v })}>
              <SelectTrigger data-testid="select-corridor">
                <SelectValue placeholder="Select corridor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US→AR">US → Argentina</SelectItem>
                <SelectItem value="US→MX">US → Mexico</SelectItem>
                <SelectItem value="US→PL">US → Poland</SelectItem>
                <SelectItem value="US→VN">US → Vietnam</SelectItem>
                <SelectItem value="US→RO">US → Romania</SelectItem>
                <SelectItem value="US→PH">US → Philippines</SelectItem>
                <SelectItem value="US→BR">US → Brazil</SelectItem>
                <SelectItem value="US→CO">US → Colombia</SelectItem>
                <SelectItem value="US→IN">US → India</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Input
              placeholder="Service description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              data-testid="input-description"
            />
          </div>
          <div>
            <Label className="text-xs">Due Date</Label>
            <Input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              data-testid="input-due-date"
            />
          </div>
          <Button
            className="w-full"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !formData.clientId || !formData.amount || !formData.corridor || !formData.dueDate}
            data-testid="button-submit-invoice"
          >
            {createMutation.isPending ? "Creating..." : "Create Invoice"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Invoices() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [corridorFilter, setCorridorFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const { data: invoiceList, isLoading } = useQuery<Invoice[]>({ queryKey: ["/api/invoices"] });
  const { data: clientList } = useQuery<Client[]>({ queryKey: ["/api/clients"] });

  const clients = clientList || [];
  const clientMap = new Map(clients.map(c => [c.id, c.name]));

  const filtered = (invoiceList || []).filter((inv) => {
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
    if (corridorFilter !== "all" && inv.corridor !== corridorFilter) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }} data-testid="text-page-title">
            Invoices & Payments
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage invoices, factoring, and settlements</p>
        </div>
        <NewInvoiceDialog clients={clients} />
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]" data-testid="filter-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="factored">Factored</SelectItem>
            <SelectItem value="settled">Settled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={corridorFilter} onValueChange={setCorridorFilter}>
          <SelectTrigger className="w-[160px]" data-testid="filter-corridor">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Corridors</SelectItem>
            <SelectItem value="US→AR">US → Argentina</SelectItem>
            <SelectItem value="US→MX">US → Mexico</SelectItem>
            <SelectItem value="US→PL">US → Poland</SelectItem>
            <SelectItem value="US→VN">US → Vietnam</SelectItem>
            <SelectItem value="US→RO">US → Romania</SelectItem>
            <SelectItem value="US→PH">US → Philippines</SelectItem>
            <SelectItem value="US→BR">US → Brazil</SelectItem>
            <SelectItem value="US→CO">US → Colombia</SelectItem>
            <SelectItem value="US→IN">US → India</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoice Table */}
      <Card data-testid="card-invoice-table">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4"><Skeleton className="h-[300px] w-full" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Invoice #</TableHead>
                  <TableHead className="text-xs">Client</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                  <TableHead className="text-xs">Corridor</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Method</TableHead>
                  <TableHead className="text-xs">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inv) => (
                  <TableRow
                    key={inv.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedInvoice(inv)}
                    data-testid={`row-invoice-${inv.id}`}
                  >
                    <TableCell className="font-medium text-sm">{inv.invoiceNumber}</TableCell>
                    <TableCell className="text-sm">{clientMap.get(inv.clientId) || "Unknown"}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums font-medium">{formatCurrency(inv.amount)}</TableCell>
                    <TableCell className="text-sm">{inv.corridor}</TableCell>
                    <TableCell><StatusBadge status={inv.status} /></TableCell>
                    <TableCell className="text-sm">{inv.settlementMethod || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        {selectedInvoice && <InvoiceDetailDialog invoice={selectedInvoice} clients={clients} />}
      </Dialog>

      <PerplexityAttribution />
    </div>
  );
}
