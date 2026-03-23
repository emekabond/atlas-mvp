import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CreditCard, DollarSign, TrendingUp, Wallet, Plus, Snowflake, Zap, Banknote } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { Card as CardRecord, Client } from "@shared/schema";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CardTypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    virtual: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
    physical: "text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[type] || map.virtual}`} data-testid={`badge-card-type-${type}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
}

function CardStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30",
    frozen: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
    cancelled: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || map.active}`} data-testid={`badge-card-status-${status}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function CardDetailDialog({
  card,
  client,
  onFreeze,
  onActivate,
  onPayout,
  isFreezing,
  isActivating,
  isPayout,
}: {
  card: CardRecord;
  client: Client | undefined;
  onFreeze: () => void;
  onActivate: () => void;
  onPayout: () => void;
  isFreezing: boolean;
  isActivating: boolean;
  isPayout: boolean;
}) {
  const utilPct = card.spendLimit > 0 ? (card.currentSpend / card.spendLimit) * 100 : 0;

  return (
    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold" data-testid="text-card-detail-title">{card.cardholderName}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Client</span>
            <p className="font-medium">{client?.name || "Unknown"}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Card Number</span>
            <p className="font-medium">•••• {card.last4}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Type</span>
            <div className="mt-0.5"><CardTypeBadge type={card.cardType} /></div>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Status</span>
            <div className="mt-0.5"><CardStatusBadge status={card.status} /></div>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Corridor</span>
            <p className="font-medium">{card.corridor}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Issued</span>
            <p className="font-medium">{formatDate(card.issuedAt)}</p>
          </div>
        </div>

        {/* Utilization Bar */}
        <Card>
          <CardContent className="p-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Spend Utilization</p>
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${utilPct > 80 ? "bg-red-500" : utilPct > 50 ? "bg-amber-500" : "bg-primary"}`}
                style={{ width: `${Math.min(utilPct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{formatCurrency(card.currentSpend)} spent</span>
              <span>{formatCurrency(card.spendLimit)} limit</span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          {card.status === "active" ? (
            <Button
              variant="outline"
              className="flex-1"
              onClick={onFreeze}
              disabled={isFreezing}
              data-testid="button-freeze-card"
            >
              <Snowflake className="h-4 w-4 mr-2" />
              {isFreezing ? "Freezing..." : "Freeze Card"}
            </Button>
          ) : card.status === "frozen" ? (
            <Button
              variant="outline"
              className="flex-1"
              onClick={onActivate}
              disabled={isActivating}
              data-testid="button-activate-card"
            >
              <Zap className="h-4 w-4 mr-2" />
              {isActivating ? "Activating..." : "Activate Card"}
            </Button>
          ) : null}
          <Button
            className="flex-1"
            onClick={onPayout}
            disabled={isPayout || card.status === "cancelled"}
            data-testid="button-execute-payout"
          >
            <Banknote className="h-4 w-4 mr-2" />
            {isPayout ? "Processing..." : "Execute Payout"}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

function IssueCardDialog({
  open,
  onOpenChange,
  clients,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
}) {
  const { toast } = useToast();
  const [clientId, setClientId] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [cardType, setCardType] = useState("virtual");
  const [spendLimit, setSpendLimit] = useState("10000");
  const [corridor, setCorridor] = useState("US→MX");

  const corridors = ["US→AR", "US→MX", "US→PL", "US→VN", "US→RO", "US→PH", "US→BR", "US→CO", "US→IN"];

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/cards", {
        clientId: parseInt(clientId),
        cardholderName,
        last4: String(1000 + Math.floor(Math.random() * 9000)),
        cardType,
        status: "active",
        spendLimit: parseFloat(spendLimit),
        currentSpend: 0,
        currency: "USD",
        corridor,
        issuedAt: new Date().toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cards/overview"] });
      toast({ title: "Card issued", description: `New ${cardType} card issued for ${cardholderName}.` });
      onOpenChange(false);
      setCardholderName("");
      setClientId("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle data-testid="text-issue-card-title">Issue New Card</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger data-testid="select-card-client">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.filter(c => c.status === "active").map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Cardholder Name</Label>
            <Input
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="Full name on card"
              data-testid="input-cardholder-name"
            />
          </div>
          <div className="space-y-2">
            <Label>Card Type</Label>
            <Select value={cardType} onValueChange={setCardType}>
              <SelectTrigger data-testid="select-card-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="virtual">Virtual</SelectItem>
                <SelectItem value="physical">Physical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Spend Limit (USD)</Label>
            <Input
              type="number"
              value={spendLimit}
              onChange={(e) => setSpendLimit(e.target.value)}
              data-testid="input-spend-limit"
            />
          </div>
          <div className="space-y-2">
            <Label>Corridor</Label>
            <Select value={corridor} onValueChange={setCorridor}>
              <SelectTrigger data-testid="select-card-corridor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {corridors.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !clientId || !cardholderName}
            data-testid="button-submit-issue-card"
          >
            {createMutation.isPending ? "Issuing..." : "Issue Card"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CardsPage() {
  const [selectedCard, setSelectedCard] = useState<CardRecord | null>(null);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: overview, isLoading: overviewLoading } = useQuery<{
    totalCardsIssued: number; activeCards: number; totalSpendMtd: number; interchangeRevenueMtd: number;
  }>({ queryKey: ["/api/cards/overview"] });

  const { data: cardsData, isLoading: cardsLoading } = useQuery<CardRecord[]>({
    queryKey: ["/api/cards"],
  });

  const { data: spendByCategory, isLoading: categoryLoading } = useQuery<Array<{ category: string; amount: number }>>({
    queryKey: ["/api/cards/spend-by-category"],
  });

  const { data: spendByCorridor, isLoading: corridorLoading } = useQuery<Array<{ corridor: string; spend: number; interchangeRevenue: number; cardCount: number }>>({
    queryKey: ["/api/cards/spend-by-corridor"],
  });

  const { data: clientList } = useQuery<Client[]>({ queryKey: ["/api/clients"] });
  const clientMap = new Map((clientList || []).map(c => [c.id, c]));

  const freezeMutation = useMutation({
    mutationFn: async (cardId: number) => {
      const res = await apiRequest("PATCH", `/api/cards/${cardId}/freeze`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cards/overview"] });
      toast({ title: "Card frozen", description: "Card has been frozen." });
      setSelectedCard(null);
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (cardId: number) => {
      const res = await apiRequest("PATCH", `/api/cards/${cardId}/activate`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cards/overview"] });
      toast({ title: "Card activated", description: "Card has been activated." });
      setSelectedCard(null);
    },
  });

  const payoutMutation = useMutation({
    mutationFn: async (cardId: number) => {
      const res = await apiRequest("POST", `/api/cards/${cardId}/payout`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cards/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cards/transactions"] });
      toast({ title: "Payout executed", description: "Payout transaction has been created." });
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }} data-testid="text-page-title">
            Cards
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Global Rain Visa card issuance and spend management</p>
        </div>
        <Button size="sm" onClick={() => setIssueDialogOpen(true)} data-testid="button-issue-new-card">
          <Plus className="h-4 w-4 mr-2" />
          Issue New Card
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            <Card data-testid="card-total-cards-issued">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Cards Issued</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{overview?.totalCardsIssued || 0}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-active-cards">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Active Cards</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{overview?.activeCards || 0}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-total-spend-mtd">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Spend (MTD)</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{formatCurrency(overview?.totalSpendMtd || 0)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-interchange-revenue">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Interchange Revenue</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{formatCurrency(overview?.interchangeRevenueMtd || 0)}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card Spend by Category - Horizontal Bar Chart */}
        <Card data-testid="card-spend-by-category">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Card Spend by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  layout="vertical"
                  data={spendByCategory || []}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" opacity={0.3} />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11, fill: "hsl(215 20% 65%)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    tick={{ fontSize: 11, fill: "hsl(215 20% 65%)" }}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(222 47% 9%)",
                      border: "1px solid hsl(217 33% 17%)",
                      borderRadius: "8px",
                      color: "hsl(210 40% 98%)",
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Spend"]}
                  />
                  <Bar dataKey="amount" fill="hsl(199 89% 48%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Card Spend & Interchange by Corridor */}
        <Card data-testid="card-spend-by-corridor">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Card Spend & Interchange by Corridor</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {corridorLoading ? (
              <div className="p-4"><Skeleton className="h-[250px] w-full" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Corridor</TableHead>
                    <TableHead className="text-xs text-right">Total Spend</TableHead>
                    <TableHead className="text-xs text-right">Interchange</TableHead>
                    <TableHead className="text-xs text-right">Cards</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(spendByCorridor || []).map((row) => (
                    <TableRow key={row.corridor} data-testid={`row-card-corridor-${row.corridor}`}>
                      <TableCell className="font-medium text-sm">{row.corridor}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{formatCurrency(row.spend)}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{formatCurrency(row.interchangeRevenue)}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{row.cardCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Issued Cards Table */}
      <Card data-testid="card-issued-cards-table">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Issued Cards</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {cardsLoading ? (
            <div className="p-4"><Skeleton className="h-[300px] w-full" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Cardholder</TableHead>
                  <TableHead className="text-xs">Client</TableHead>
                  <TableHead className="text-xs">Corridor</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Last 4</TableHead>
                  <TableHead className="text-xs text-right">Spend Limit</TableHead>
                  <TableHead className="text-xs text-right">Current Spend</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Issued</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(cardsData || []).map((card) => {
                  const client = clientMap.get(card.clientId);
                  return (
                    <TableRow
                      key={card.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedCard(card)}
                      data-testid={`row-card-${card.id}`}
                    >
                      <TableCell className="font-medium text-sm">{card.cardholderName}</TableCell>
                      <TableCell className="text-sm">{client?.name || "Unknown"}</TableCell>
                      <TableCell className="text-sm">{card.corridor}</TableCell>
                      <TableCell><CardTypeBadge type={card.cardType} /></TableCell>
                      <TableCell className="text-sm tabular-nums">•••• {card.last4}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{formatCurrency(card.spendLimit)}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{formatCurrency(card.currentSpend)}</TableCell>
                      <TableCell><CardStatusBadge status={card.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(card.issuedAt)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Card Detail Dialog */}
      <Dialog open={!!selectedCard} onOpenChange={(open) => !open && setSelectedCard(null)}>
        {selectedCard && (
          <CardDetailDialog
            card={selectedCard}
            client={clientMap.get(selectedCard.clientId)}
            onFreeze={() => freezeMutation.mutate(selectedCard.id)}
            onActivate={() => activateMutation.mutate(selectedCard.id)}
            onPayout={() => payoutMutation.mutate(selectedCard.id)}
            isFreezing={freezeMutation.isPending}
            isActivating={activateMutation.isPending}
            isPayout={payoutMutation.isPending}
          />
        )}
      </Dialog>

      {/* Issue Card Dialog */}
      <IssueCardDialog
        open={issueDialogOpen}
        onOpenChange={setIssueDialogOpen}
        clients={clientList || []}
      />

      <PerplexityAttribution />
    </div>
  );
}
