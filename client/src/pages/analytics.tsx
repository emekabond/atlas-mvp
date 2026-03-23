import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import { BarChart3, Users, Package, TrendingUp, Lightbulb, Check, Minus } from "lucide-react";

type ProductUtilization = {
  clientId: number;
  clientName: string;
  corridor: string;
  products: {
    invoicing: boolean;
    factoring: boolean;
    rbf: boolean;
    cards: boolean;
    fx: boolean;
    treasury: boolean;
    compliance: boolean;
    erpSync: boolean;
  };
  productCount: number;
  totalVolume: number;
  upsellOpportunities: string[];
};

const productLabels: Record<string, string> = {
  invoicing: "Invoicing",
  factoring: "Factoring",
  rbf: "RBF",
  cards: "Cards",
  fx: "FX",
  treasury: "Treasury",
  compliance: "Compliance",
  erpSync: "ERP Sync",
};

const TOTAL_PRODUCTS = 8;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default function AnalyticsPage() {
  const { data: utilization, isLoading } = useQuery<ProductUtilization[]>({
    queryKey: ["/api/analytics/product-utilization"],
  });

  const totalClients = utilization?.length || 0;
  const avgProducts = totalClients > 0
    ? (utilization!.reduce((sum, c) => sum + c.productCount, 0) / totalClients).toFixed(1)
    : "0";
  const fullSuiteCount = utilization?.filter(c => c.productCount >= 6).length || 0;
  const totalUpsellOps = utilization?.reduce((sum, c) => sum + c.upsellOpportunities.length, 0) || 0;

  // Compute upsell by product
  const upsellByProduct: Record<string, string[]> = {};
  utilization?.forEach(c => {
    c.upsellOpportunities.forEach(product => {
      if (!upsellByProduct[product]) upsellByProduct[product] = [];
      upsellByProduct[product].push(c.clientName);
    });
  });
  const upsellSorted = Object.entries(upsellByProduct).sort((a, b) => b[1].length - a[1].length);

  // Sort by productCount ascending
  const sortedClients = utilization ? [...utilization].sort((a, b) => a.productCount - b.productCount) : [];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }} data-testid="text-page-title">
            Product Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Customer utilization and upsell opportunities</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            <Card data-testid="card-total-active-clients">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Active Clients</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{totalClients}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-avg-products">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Avg Products/Client</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{avgProducts}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-full-suite-adoption">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Full Suite (6+)</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{fullSuiteCount}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-violet-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-upsell-opportunities">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Upsell Opportunities</p>
                    <p className="text-xl font-bold tabular-nums mt-1">{totalUpsellOps}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Product Utilization Matrix */}
      <Card data-testid="card-utilization-matrix">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Product Utilization Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Client</TableHead>
                    <TableHead className="text-xs">Corridor</TableHead>
                    <TableHead className="text-xs text-center">Invoicing</TableHead>
                    <TableHead className="text-xs text-center">Factoring</TableHead>
                    <TableHead className="text-xs text-center">RBF</TableHead>
                    <TableHead className="text-xs text-center">Cards</TableHead>
                    <TableHead className="text-xs text-center">FX</TableHead>
                    <TableHead className="text-xs text-center">ERP Sync</TableHead>
                    <TableHead className="text-xs text-center">Products</TableHead>
                    <TableHead className="text-xs text-right">Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedClients.map(client => (
                    <TableRow key={client.clientId} data-testid={`row-client-${client.clientId}`}>
                      <TableCell className="text-sm font-medium">{client.clientName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{client.corridor}</TableCell>
                      {(["invoicing", "factoring", "rbf", "cards", "fx", "erpSync"] as const).map(product => (
                        <TableCell key={product} className="text-center">
                          {client.products[product] ? (
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500/10" data-testid={`check-${client.clientId}-${product}`}>
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-500/5" data-testid={`miss-${client.clientId}-${product}`}>
                              <Minus className="h-3.5 w-3.5 text-muted-foreground/40" />
                            </span>
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <span className="text-sm font-medium tabular-nums">{client.productCount}/{TOTAL_PRODUCTS}</span>
                          <Progress value={(client.productCount / TOTAL_PRODUCTS) * 100} className="w-16 h-1.5" />
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-right tabular-nums">{formatCurrency(client.totalVolume)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upsell Opportunities Summary */}
      <Card data-testid="card-upsell-summary">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Upsell Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="space-y-4">
              {upsellSorted.map(([product, clients]) => (
                <div key={product} className="flex items-start gap-3" data-testid={`upsell-${product}`}>
                  <div className="flex items-center gap-2 min-w-[180px]">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{productLabels[product] || product}</p>
                      <p className="text-xs text-muted-foreground">{clients.length} clients not using</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {clients.map(name => (
                      <span key={name} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {upsellSorted.length === 0 && (
                <p className="text-sm text-muted-foreground">All clients are using all available products.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <PerplexityAttribution />
    </div>
  );
}
