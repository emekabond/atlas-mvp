import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, seedDatabase, db } from "./storage";
import { insertInvoiceSchema, insertComplianceEntitySchema, insertCardSchema } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Create tables and seed on startup
  db.run(sql`CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    corridor TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    kyb_status TEXT NOT NULL DEFAULT 'pending',
    credit_score INTEGER,
    credit_limit REAL,
    risk_tier TEXT
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    invoice_number TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    corridor TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    settlement_method TEXT,
    factoring_status TEXT,
    due_date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    description TEXT
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    from_currency TEXT,
    to_currency TEXT,
    status TEXT NOT NULL,
    corridor TEXT NOT NULL,
    settlement_time INTEGER,
    created_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS credit_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    revenue_consistency INTEGER NOT NULL,
    payment_history INTEGER NOT NULL,
    corridor_risk INTEGER NOT NULL,
    erp_health INTEGER NOT NULL,
    recommended_limit REAL NOT NULL,
    recommendation TEXT NOT NULL,
    assessed_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS compliance_entities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    entity_name TEXT NOT NULL,
    jurisdiction TEXT NOT NULL,
    registration_number TEXT NOT NULL,
    kyb_stage TEXT NOT NULL,
    documents_json TEXT,
    mor_status TEXT NOT NULL DEFAULT 'pending',
    compliance_score INTEGER
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS compliance_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    severity TEXT NOT NULL,
    message TEXT NOT NULL,
    resolved INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS rbf_facilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    facility_amount REAL NOT NULL,
    drawn_amount REAL NOT NULL DEFAULT 0,
    repaid_amount REAL NOT NULL DEFAULT 0,
    revenue_share_pct REAL NOT NULL,
    term_months INTEGER NOT NULL,
    status TEXT NOT NULL,
    monthly_revenue REAL,
    repayment_cap REAL,
    created_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS treasury_positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    strategy_name TEXT NOT NULL,
    protocol TEXT NOT NULL,
    allocated_amount REAL NOT NULL,
    current_value REAL NOT NULL,
    apy REAL NOT NULL,
    risk_tier TEXT NOT NULL,
    maturity_date TEXT,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS treasury_sweeps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_account TEXT NOT NULL,
    to_strategy TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    cardholder_name TEXT NOT NULL,
    last4 TEXT NOT NULL,
    card_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    spend_limit REAL NOT NULL,
    current_spend REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    corridor TEXT NOT NULL,
    issued_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS card_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER NOT NULL,
    merchant_name TEXT NOT NULL,
    merchant_category TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    local_amount REAL,
    local_currency TEXT,
    interchange_fee REAL NOT NULL,
    status TEXT NOT NULL,
    type TEXT NOT NULL,
    corridor TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS fx_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER,
    corridor TEXT NOT NULL,
    direction TEXT NOT NULL,
    from_currency TEXT NOT NULL,
    to_currency TEXT NOT NULL,
    amount REAL NOT NULL,
    mid_market_rate REAL NOT NULL,
    atlas_rate REAL NOT NULL,
    spread_bps REAL NOT NULL,
    spread_revenue REAL NOT NULL,
    created_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS reconciliations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    erp_system TEXT NOT NULL,
    sync_direction TEXT NOT NULL,
    record_type TEXT NOT NULL,
    atlas_ref TEXT NOT NULL,
    erp_ref TEXT,
    atlas_amount REAL NOT NULL,
    erp_amount REAL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL,
    discrepancy_amount REAL,
    resolved_at TEXT,
    created_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS erp_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    erp_system TEXT NOT NULL,
    status TEXT NOT NULL,
    last_sync_at TEXT,
    records_synced INTEGER NOT NULL DEFAULT 0,
    match_rate REAL,
    created_at TEXT NOT NULL
  )`);

  seedDatabase();

  // ---- Dashboard Routes ----
  app.get("/api/dashboard/stats", async (_req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  app.get("/api/dashboard/cashflow", async (_req, res) => {
    const data = await storage.getCashflowData();
    res.json(data);
  });

  app.get("/api/dashboard/corridors", async (_req, res) => {
    const data = await storage.getCorridorActivity();
    res.json(data);
  });

  app.get("/api/dashboard/recent-transactions", async (_req, res) => {
    const data = await storage.getRecentTransactions(10);
    res.json(data);
  });

  // ---- Client Routes ----
  app.get("/api/clients", async (_req, res) => {
    const data = await storage.getClients();
    res.json(data);
  });

  app.get("/api/clients/:id", async (req, res) => {
    const client = await storage.getClient(parseInt(req.params.id));
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json(client);
  });

  // ---- Invoice Routes ----
  app.get("/api/invoices", async (_req, res) => {
    const data = await storage.getInvoices();
    res.json(data);
  });

  app.get("/api/invoices/:id", async (req, res) => {
    const invoice = await storage.getInvoice(parseInt(req.params.id));
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json(invoice);
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const parsed = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(parsed);
      res.status(201).json(invoice);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Invalid invoice data" });
    }
  });

  app.post("/api/invoices/:id/factor", async (req, res) => {
    const invoice = await storage.getInvoice(parseInt(req.params.id));
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const updated = await storage.updateInvoice(invoice.id, {
      status: "factored",
      factoringStatus: "funded",
    });
    res.json(updated);
  });

  // ---- Credit Routes ----
  app.get("/api/credit/overview", async (_req, res) => {
    const data = await storage.getCreditOverview();
    res.json(data);
  });

  app.get("/api/credit/assessments", async (_req, res) => {
    const data = await storage.getCreditAssessments();
    res.json(data);
  });

  app.post("/api/credit/assess/:clientId", async (req, res) => {
    const clientId = parseInt(req.params.clientId);
    const client = await storage.getClient(clientId);
    if (!client) return res.status(404).json({ message: "Client not found" });

    // Simulate AI assessment with slight randomization
    const baseScore = client.creditScore || 50;
    const newScore = Math.min(100, Math.max(10, baseScore + Math.floor(Math.random() * 20 - 10)));
    const revConsistency = Math.min(100, Math.max(20, newScore + Math.floor(Math.random() * 15 - 7)));
    const payHistory = Math.min(100, Math.max(20, newScore + Math.floor(Math.random() * 15 - 7)));
    const corrRisk = Math.min(100, Math.max(20, newScore + Math.floor(Math.random() * 15 - 7)));
    const erpH = Math.min(100, Math.max(20, newScore + Math.floor(Math.random() * 15 - 7)));
    const recLimit = Math.round(newScore * 220000 + Math.random() * 3500000);
    const recommendation = newScore >= 80 ? "increase" : newScore >= 60 ? "maintain" : newScore >= 45 ? "flag_review" : "decrease";

    const assessment = await storage.createCreditAssessment({
      clientId,
      score: newScore,
      revenueConsistency: revConsistency,
      paymentHistory: payHistory,
      corridorRisk: corrRisk,
      erpHealth: erpH,
      recommendedLimit: recLimit,
      recommendation,
      assessedAt: new Date().toISOString(),
    });

    res.json(assessment);
  });

  // ---- Compliance Routes ----
  app.get("/api/compliance/overview", async (_req, res) => {
    const data = await storage.getComplianceOverview();
    res.json(data);
  });

  app.get("/api/compliance/entities", async (_req, res) => {
    const data = await storage.getComplianceEntities();
    res.json(data);
  });

  app.post("/api/compliance/entities", async (req, res) => {
    try {
      const parsed = insertComplianceEntitySchema.parse(req.body);
      const entity = await storage.createComplianceEntity(parsed);
      res.status(201).json(entity);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Invalid entity data" });
    }
  });

  app.get("/api/compliance/alerts", async (_req, res) => {
    const data = await storage.getComplianceAlerts();
    res.json(data);
  });

  app.patch("/api/compliance/alerts/:id/resolve", async (req, res) => {
    const alert = await storage.resolveComplianceAlert(parseInt(req.params.id));
    if (!alert) return res.status(404).json({ message: "Alert not found" });
    res.json(alert);
  });

  // ---- RBF Routes ----
  app.get("/api/rbf/overview", async (_req, res) => {
    const data = await storage.getRbfOverview();
    res.json(data);
  });

  app.get("/api/rbf/facilities", async (_req, res) => {
    const data = await storage.getRbfFacilities();
    res.json(data);
  });

  app.post("/api/rbf/:clientId/draw", async (req, res) => {
    const clientId = parseInt(req.params.clientId);
    const facilities = await storage.getRbfFacilitiesByClient(clientId);
    const activeFacility = facilities.find(f => f.status === "active");
    if (!activeFacility) return res.status(404).json({ message: "No active RBF facility found" });

    const drawAmount = req.body.amount || 500000;
    const available = activeFacility.facilityAmount - activeFacility.drawnAmount;
    if (drawAmount > available) return res.status(400).json({ message: "Draw exceeds available amount" });

    const updated = await storage.updateRbfFacility(activeFacility.id, {
      drawnAmount: activeFacility.drawnAmount + drawAmount,
    });
    res.json(updated);
  });

  app.post("/api/rbf/:clientId/repay", async (req, res) => {
    const clientId = parseInt(req.params.clientId);
    const facilities = await storage.getRbfFacilitiesByClient(clientId);
    const activeFacility = facilities.find(f => f.status === "active");
    if (!activeFacility) return res.status(404).json({ message: "No active RBF facility found" });

    const repayAmount = req.body.amount || 250000;
    const outstanding = activeFacility.drawnAmount - activeFacility.repaidAmount;
    const actualRepay = Math.min(repayAmount, outstanding);

    const updated = await storage.updateRbfFacility(activeFacility.id, {
      repaidAmount: activeFacility.repaidAmount + actualRepay,
    });
    res.json(updated);
  });

  // ---- Treasury Routes ----
  app.get("/api/treasury/overview", async (_req, res) => {
    const data = await storage.getTreasuryOverview();
    res.json(data);
  });

  app.get("/api/treasury/positions", async (_req, res) => {
    const data = await storage.getTreasuryPositions();
    res.json(data);
  });

  app.get("/api/treasury/sweeps", async (_req, res) => {
    const data = await storage.getTreasurySweeps();
    res.json(data);
  });

  app.post("/api/treasury/sweep", async (req, res) => {
    const sweep = await storage.createTreasurySweep({
      fromAccount: req.body.fromAccount || "FBO Main",
      toStrategy: req.body.toStrategy || "Circle Yield",
      amount: req.body.amount || 1200000,
      type: "sweep_in",
      status: "processing",
      createdAt: new Date().toISOString(),
    });
    res.status(201).json(sweep);
  });

  app.post("/api/treasury/rebalance", async (_req, res) => {
    // Simulated AI rebalance — returns a result after a brief delay
    res.json({
      status: "completed",
      message: "AI rebalance executed successfully",
      adjustments: [
        { strategy: "Circle Yield", action: "increase", amount: 850000 },
        { strategy: "Compound USDC", action: "decrease", amount: 620000 },
        { strategy: "Aave USDC", action: "increase", amount: 340000 },
      ],
    });
  });

  // ---- Cards Routes ----
  app.get("/api/cards/overview", async (_req, res) => {
    const data = await storage.getCardOverview();
    res.json(data);
  });

  app.get("/api/cards/spend-by-category", async (_req, res) => {
    const data = await storage.getCardSpendByCategory();
    res.json(data);
  });

  app.get("/api/cards/spend-by-corridor", async (_req, res) => {
    const data = await storage.getCardSpendByCorridor();
    res.json(data);
  });

  app.get("/api/cards/transactions", async (_req, res) => {
    const data = await storage.getCardTransactions();
    res.json(data);
  });

  app.get("/api/cards/:id", async (req, res) => {
    const card = await storage.getCard(parseInt(req.params.id));
    if (!card) return res.status(404).json({ message: "Card not found" });
    res.json(card);
  });

  app.get("/api/cards", async (_req, res) => {
    const data = await storage.getCards();
    res.json(data);
  });

  app.post("/api/cards", async (req, res) => {
    try {
      const parsed = insertCardSchema.parse(req.body);
      const card = await storage.createCard(parsed);
      res.status(201).json(card);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Invalid card data" });
    }
  });

  app.patch("/api/cards/:id/freeze", async (req, res) => {
    const card = await storage.getCard(parseInt(req.params.id));
    if (!card) return res.status(404).json({ message: "Card not found" });
    const updated = await storage.updateCard(card.id, { status: "frozen" });
    res.json(updated);
  });

  app.patch("/api/cards/:id/activate", async (req, res) => {
    const card = await storage.getCard(parseInt(req.params.id));
    if (!card) return res.status(404).json({ message: "Card not found" });
    const updated = await storage.updateCard(card.id, { status: "active" });
    res.json(updated);
  });

  app.post("/api/cards/:id/payout", async (req, res) => {
    const card = await storage.getCard(parseInt(req.params.id));
    if (!card) return res.status(404).json({ message: "Card not found" });
    const amount = Math.round((18000 + Math.random() * 45000) * 100) / 100;
    const interchangeFee = Math.round(amount * 0.02 * 100) / 100;
    const txn = await storage.createCardTransaction({
      cardId: card.id,
      merchantName: "Atlas Payout",
      merchantCategory: "services",
      amount,
      currency: "USD",
      localAmount: null,
      localCurrency: null,
      interchangeFee,
      status: "approved",
      type: "payout",
      corridor: card.corridor,
      createdAt: new Date().toISOString(),
    });
    res.status(201).json(txn);
  });

  // ---- FX Routes ----
  app.get("/api/fx/overview", async (_req, res) => {
    const data = await storage.getFxOverview();
    res.json(data);
  });

  app.get("/api/fx/transactions", async (_req, res) => {
    const data = await storage.getFxTransactions();
    res.json(data);
  });

  app.get("/api/fx/by-corridor", async (_req, res) => {
    const data = await storage.getFxByCorridor();
    res.json(data);
  });

  app.get("/api/fx/by-direction", async (_req, res) => {
    const data = await storage.getFxByDirection();
    res.json(data);
  });

  // ---- Reconciliation Routes ----
  app.get("/api/reconciliation/overview", async (_req, res) => {
    const data = await storage.getReconciliationOverview();
    res.json(data);
  });

  app.get("/api/reconciliation/records", async (_req, res) => {
    const data = await storage.getReconciliations();
    res.json(data);
  });

  app.get("/api/reconciliation/by-status", async (_req, res) => {
    const data = await storage.getReconciliationsByStatus();
    res.json(data);
  });

  app.post("/api/reconciliation/:id/resolve", async (req, res) => {
    const rec = await storage.getReconciliation(parseInt(req.params.id));
    if (!rec) return res.status(404).json({ message: "Record not found" });
    const updated = await storage.updateReconciliation(rec.id, {
      status: "resolved",
      resolvedAt: new Date().toISOString(),
    });
    res.json(updated);
  });

  app.post("/api/reconciliation/sync", async (_req, res) => {
    res.json({
      status: "completed",
      message: "ERP sync completed successfully",
      recordsSynced: 12,
      newMatches: 8,
      newDiscrepancies: 2,
    });
  });

  // ---- ERP Routes ----
  app.get("/api/erp/connections", async (_req, res) => {
    const data = await storage.getErpConnections();
    res.json(data);
  });

  app.post("/api/erp/:id/sync", async (req, res) => {
    const conn = await storage.getErpConnection(parseInt(req.params.id));
    if (!conn) return res.status(404).json({ message: "ERP connection not found" });
    const updated = await storage.updateErpConnection(conn.id, {
      status: "syncing",
      lastSyncAt: new Date().toISOString(),
    });
    res.json(updated);
  });

  // ---- Analytics Routes ----
  app.get("/api/analytics/product-utilization", async (_req, res) => {
    const allClients = await storage.getClients();
    const allInvoices = (await storage.getInvoices());
    const allRbf = (await storage.getRbfFacilities());
    const allCards = (await storage.getCards());
    const allTxns = (await storage.getTransactions());
    const allEntities = (await storage.getComplianceEntities());
    const allErp = (await storage.getErpConnections());

    const activeClients = allClients.filter(c => c.status === "active");

    const result = activeClients.map(client => {
      const hasInvoicing = allInvoices.some(i => i.clientId === client.id);
      const hasFactoring = allInvoices.some(i => i.clientId === client.id && i.factoringStatus && i.factoringStatus !== "none");
      const hasRbf = allRbf.some(r => r.clientId === client.id);
      const hasCards = allCards.some(c => c.clientId === client.id);
      const hasFx = allTxns.some(t => t.type === "conversion");
      const hasTreasury = true; // Atlas manages treasury centrally
      const hasCompliance = allEntities.some(e => e.clientId === client.id);
      const hasErpSync = allErp.some(e => e.clientId === client.id);

      const products = {
        invoicing: hasInvoicing,
        factoring: hasFactoring,
        rbf: hasRbf,
        cards: hasCards,
        fx: hasFx,
        treasury: hasTreasury,
        compliance: hasCompliance,
        erpSync: hasErpSync,
      };

      const productCount = Object.values(products).filter(Boolean).length;

      const upsellOpportunities: string[] = [];
      if (!products.invoicing) upsellOpportunities.push("Invoicing");
      if (!products.factoring) upsellOpportunities.push("Invoice Factoring");
      if (!products.rbf) upsellOpportunities.push("RBF");
      if (!products.cards) upsellOpportunities.push("Cards");
      if (!products.fx) upsellOpportunities.push("FX");
      if (!products.compliance) upsellOpportunities.push("Compliance/KYB");
      if (!products.erpSync) upsellOpportunities.push("ERP Sync");

      const totalVolume = allTxns
        .filter(t => {
          const inv = allInvoices.find(i => i.id === t.invoiceId);
          return inv && inv.clientId === client.id;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        clientId: client.id,
        clientName: client.name,
        corridor: client.corridor,
        products,
        productCount,
        totalVolume: Math.round(totalVolume),
        upsellOpportunities,
      };
    });

    res.json(result);
  });

  // ---- Settings Routes ----
  app.get("/api/settings/integrations", async (_req, res) => {
    res.json([
      { name: "Bridge", status: "connected", description: "Cross-border payment rails", lastSync: "2 min ago" },
      { name: "Circle", status: "connected", description: "USDC stablecoin infrastructure", lastSync: "5 min ago" },
      { name: "Rain", status: "connected", description: "Corporate Visa card issuing", lastSync: "1 hr ago" },
      { name: "Codat", status: "connected", description: "ERP & accounting sync", lastSync: "15 min ago" },
      { name: "Lead Bank", status: "connected", description: "FBO account & banking", lastSync: "30 min ago" },
    ]);
  });

  // =====================================================================
  // Atlas V3 — Tenant / Liquidity / Action Rail / Engine Room endpoints
  // =====================================================================

  app.get("/api/tenant", (_req, res) => {
    res.json({
      id: "meridian-software",
      name: "Meridian Software",
      domicile: "US",
      corridor: "US\u2192AR",
      primaryBuyerGeo: "AR",
      industry: "B2B Software / Services",
      facility: {
        product: "Invoice Factoring",
        status: "live",
        limit: 18000000,
        utilized: 11200000,
        advanceRateBps: 8500,
        currency: "USD",
      },
      policyVersion: "ACB v4.12",
      environment: "V3 \u00b7 Demo",
    });
  });

  app.get("/api/dashboard/liquidity", async (_req, res) => {
    const invs = await storage.getInvoices();
    const facilities = await storage.getRbfFacilities();
    const eligible = invs
      // Invoices that could be factored *now*: not yet drawn against, not
      // already settled, and the credit agent has either flagged them as
      // eligible or hasn't reviewed them yet.
      .filter(
        (i) =>
          (i.status === "draft" || i.status === "sent") &&
          (!i.factoringStatus ||
            i.factoringStatus === "none" ||
            i.factoringStatus === "eligible" ||
            i.factoringStatus === "offered")
      )
      .reduce((s, i) => s + (i.amount || 0), 0);
    const factored = invs
      .filter((i) => i.factoringStatus === "funded")
      .reduce((s, i) => s + (i.amount || 0) * 0.85, 0);
    const rbfDrawn = facilities
      .filter((f) => f.status === "active")
      .reduce((s, f) => s + (f.drawnAmount - f.repaidAmount), 0);
    const rbfUndrawn = facilities
      .filter((f) => f.status === "active")
      .reduce((s, f) => s + Math.max(0, f.facilityAmount - f.drawnAmount), 0);
    res.json({
      availableLiquidity: Math.round(2750000 + rbfUndrawn * 0.6),
      eligibleReceivables: Math.round(eligible),
      activeAdvances: Math.round(factored + rbfDrawn),
      nextSettlementHours: 4.2,
      undrawnFacility: Math.round(rbfUndrawn + 2750000),
      advanceRateBps: 8500,
    });
  });

  app.get("/api/action-rail", async (_req, res) => {
    res.json([
      {
        id: "advance-mx-001",
        agent: "Credit Agent",
        severity: "info",
        title: "Advance eligible: Volta Digital invoice INV-2041",
        body: "US\u2192MX corridor, 30-day net, clean ERP match. Advance at 85% = $2,380,000 today.",
        amount: 2380000,
        rationale: [
          "Buyer concentration within policy (18%)",
          "Recon status: matched on Codat",
          "Corridor eligibility: 84% (US\u2192MX)",
          "ACB v4.12 Gate 3 pass",
        ],
        ctaLabel: "Open advance",
        ctaHref: "/invoices",
      },
      {
        id: "covenant-burn-002",
        agent: "Credit Agent",
        severity: "warning",
        title: "Covenant watch: burn rate approaching 1.2x threshold",
        body: "Meridian 60d burn trending 1.14x. Review drawdown pacing before next RBF installment.",
        rationale: [
          "Rolling 60d opex up 9.2%",
          "Receivables aging 35d (policy: <40d)",
          "No breach \u2014 watch only",
        ],
        ctaLabel: "Review covenants",
        ctaHref: "/credit",
      },
      {
        id: "sweep-idle-003",
        agent: "Treasury Agent",
        severity: "info",
        title: "Idle USDC suggestion: sweep $1.25M to Circle Yield",
        body: "FBO balance has held $1.25M idle for 3 days. Pilot sweep available at 4.6% APY.",
        amount: 1250000,
        rationale: [
          "Reserve minimums satisfied",
          "Pilot window: Circle Yield (4.6% APY)",
          "Reversible within 24h",
        ],
        ctaLabel: "Preview sweep",
        ctaHref: "/treasury",
      },
      {
        id: "kyb-refresh-004",
        agent: "Compliance Agent",
        severity: "info",
        title: "KYB refresh due: Bucharest Dynamics S.R.L.",
        body: "Annual refresh window opens in 12 days. Pre-fill available from existing filings.",
        rationale: [
          "Last refresh: 353 days ago",
          "No new sanctions hits",
          "UBO unchanged",
        ],
        ctaLabel: "Start refresh",
        ctaHref: "/compliance",
      },
      {
        id: "recon-gap-005",
        agent: "Recon Agent",
        severity: "warning",
        title: "2 ERP mismatches on NovaBridge (QuickBooks)",
        body: "$14,820 and $6,430 variance detected \u2014 likely FX timing. Auto-reconcile candidate.",
        rationale: [
          "Variance <1% of invoice value",
          "Timing pattern: end-of-day FX mark",
          "Auto-resolve policy: eligible",
        ],
        ctaLabel: "Reconcile",
        ctaHref: "/reconciliation",
      },
      {
        id: "orchestrator-006",
        agent: "Orchestrator",
        severity: "info",
        title: "Queue: 3 underwriting cases awaiting Gate 4 human review",
        body: "Orchestrator has packaged memos for Volta, Guadalajara Studios, Centurion.",
        rationale: [
          "Gates 1\u20133 auto-passed",
          "Avg time-to-decision: ~4 min",
          "SLA: <24h from submission",
        ],
        ctaLabel: "Open engine room",
        ctaHref: "/engine-room/#queue",
      },
    ]);
  });

  // ---- Engine Room: AI Credit OS internal view ----
  app.get("/api/engine/status", (_req, res) => {
    res.json({
      policyVersion: "ACB v4.12",
      deployedAt: "2026-04-14T11:24:00Z",
      casesToday: 47,
      autoDecisionedPct: 82,
      medianTimeToDecisionMin: 4,
      agents: [
        { name: "Orchestrator", status: "healthy" },
        { name: "Compliance Agent", status: "healthy" },
        { name: "Underwriting Agent", status: "healthy" },
        { name: "Treasury Agent", status: "healthy" },
        { name: "Reconciliation Agent", status: "degraded" },
      ],
      queueDepth: 11,
      slaBreachRate: 0.004,
    });
  });

  app.get("/api/engine/fabric", (_req, res) => {
    res.json({
      sources: [
        { name: "ERP (Codat)", coverage: "15/15 tenants", freshnessMin: 6, status: "live" },
        { name: "Bank (Plaid / FBO)", coverage: "14/15", freshnessMin: 3, status: "live" },
        { name: "Invoice (Atlas native)", coverage: "15/15", freshnessMin: 1, status: "live" },
        { name: "Payment rails (Bridge / Circle)", coverage: "9 corridors", freshnessMin: 1, status: "live" },
        { name: "KYB / Sanctions (3P)", coverage: "15/15", freshnessMin: 240, status: "live" },
        { name: "Card network (Rain)", coverage: "Live issuing", freshnessMin: 2, status: "pilot" },
      ],
      pipeline: [
        { stage: "Ingest", detail: "Normalize ERP / bank / invoice payloads" },
        { stage: "Extract", detail: "IDP parses statements, contracts, shipping docs" },
        { stage: "Score", detail: "ML scoring over unified tenant graph" },
        { stage: "Explain", detail: "SHAP-style attribution per 7-factor memo" },
        { stage: "Orchestrate", detail: "Gate routing + agent delegation" },
      ],
      anomaliesLast24h: 3,
    });
  });

  app.get("/api/engine/queue", (_req, res) => {
    res.json({
      gates: [
        { gate: 1, name: "Identity & KYB", passRate: 0.97, medianMs: 1200 },
        { gate: 2, name: "Data Coverage & Quality", passRate: 0.94, medianMs: 800 },
        { gate: 3, name: "Policy Fit (ACB v4.12)", passRate: 0.81, medianMs: 1600 },
        { gate: 4, name: "Human Review (escalations only)", passRate: 0.92, medianMs: 14400000 },
      ],
      cases: [
        { id: "CS-2041", tenant: "Volta Digital Agency", product: "Factoring", gate: 4, waitMin: 18, status: "human-review" },
        { id: "CS-2042", tenant: "Guadalajara Studios", product: "Factoring", gate: 4, waitMin: 9, status: "human-review" },
        { id: "CS-2043", tenant: "Centurion Dev Labs", product: "RBF", gate: 4, waitMin: 4, status: "human-review" },
        { id: "CS-2044", tenant: "Mumbai Infra Labs", product: "Factoring", gate: 3, waitMin: 1, status: "auto" },
        { id: "CS-2045", tenant: "NovaBridge SaaS", product: "RBF", gate: 3, waitMin: 1, status: "auto" },
        { id: "CS-2046", tenant: "Bucharest Dynamics", product: "Factoring", gate: 2, waitMin: 0, status: "auto" },
      ],
    });
  });

  app.get("/api/engine/memo/:caseId", (req, res) => {
    // 7-factor credit memo — weights REDACTED for public demo
    res.json({
      caseId: req.params.caseId,
      tenant: "Volta Digital Agency",
      product: "Invoice Factoring",
      corridor: "US\u2192MX",
      requestedLimit: 14500000,
      recommendedLimit: 12500000,
      score: 78,
      decision: "Recommend \u2014 Human Gate 4 Review",
      policyVersion: "ACB v4.12",
      factors: [
        { factor: "Cash-flow durability", signal: "12-mo operating cash inflow stability", value: "0.84", direction: "+", weight: "\u2014" },
        { factor: "Revenue quality", signal: "Buyer concentration + contract tenor", value: "Top buyer 18%", direction: "+", weight: "\u2014" },
        { factor: "Receivables health", signal: "DSO, aging, dilution", value: "DSO 31d", direction: "+", weight: "\u2014" },
        { factor: "Operator behaviour", signal: "Spend discipline, cash runway actions", value: "8.2/10", direction: "+", weight: "\u2014" },
        { factor: "Corridor risk", signal: "Jurisdiction + rail + buyer geo", value: "US\u2192MX", direction: "neutral", weight: "\u2014" },
        { factor: "Compliance posture", signal: "KYB freshness, sanctions, adverse media", value: "Clean", direction: "+", weight: "\u2014" },
        { factor: "Counterparty signals", signal: "Buyer trade history on Atlas", value: "3 repeat buyers", direction: "+", weight: "\u2014" },
      ],
      guardrails: [
        "Max advance rate: 85%",
        "Buyer concentration cap: 25%",
        "Corridor cap (US\u2192MX): $30M per tenant",
      ],
      redactedNote: "Factor weights are lender-confidential and not exposed in public demo.",
    });
  });

  app.get("/api/engine/policy", (_req, res) => {
    res.json({
      current: "ACB v4.12",
      previous: "ACB v4.11",
      deployedAt: "2026-04-14T11:24:00Z",
      diff: [
        { path: "corridor.US\u2192VN.eligibilityFloor", from: "45%", to: "48%", reason: "FX volatility widened; tighten" },
        { path: "buyerConcentrationCap.factoring", from: "22%", to: "25%", reason: "Expand for mid-market multi-buyer tenants" },
        { path: "advanceRate.factoring.default", from: "83%", to: "85%", reason: "Loss-adjusted yield target met" },
        { path: "rbf.termCapMonths", from: "18", to: "24", reason: "SaaS ICP expansion" },
      ],
      replayable: true,
      replaySampleSize: 142,
      replayImpact: { decisionsChanged: 9, approvalDelta: "+1.8%", lossProxyDelta: "\u22120.3%" },
    });
  });

  app.get("/api/engine/monitoring", (_req, res) => {
    res.json({
      covenants: [
        { tenant: "Meridian Software", metric: "Burn multiple (60d)", value: 1.14, threshold: 1.2, status: "watch" },
        { tenant: "NovaBridge SaaS", metric: "Buyer concentration", value: 0.21, threshold: 0.25, status: "ok" },
        { tenant: "Bucharest Dynamics", metric: "DSO", value: 38, threshold: 45, status: "ok" },
        { tenant: "Centurion Dev Labs", metric: "Advance rate utilization", value: 0.91, threshold: 0.95, status: "watch" },
      ],
      earlyWarnings: [
        {
          tenant: "Guadalajara Studios",
          signal: "Cash inflow variance up 22% WoW",
          severity: "yellow",
          sla: "Respond within 5 business days",
        },
        {
          tenant: "Mumbai Infra Labs",
          signal: "Buyer payment delay trend (>5d drift)",
          severity: "orange",
          sla: "Respond within 48 hours",
        },
        {
          tenant: "Centurion Dev Labs",
          signal: "Advance utilization 91% \u2014 trending toward cap",
          severity: "yellow",
          sla: "Respond within 5 business days",
        },
        {
          tenant: "Bucharest Dynamics",
          signal: "Buyer payment failure cluster (3 buyers, single corridor)",
          severity: "red",
          sla: "Respond within 24 hours",
        },
      ],
    });
  });

  app.get("/api/engine/agents", (_req, res) => {
    res.json([
      {
        name: "Orchestrator",
        role: "Routes cases across gates and agents. Owns SLAs.",
        status: "live",
        actionsToday: 312,
        escalationRate: 0.08,
      },
      {
        name: "Compliance Agent",
        role: "KYB, sanctions, UBO, adverse media, refresh cadence.",
        status: "live",
        actionsToday: 64,
        escalationRate: 0.03,
      },
      {
        name: "Underwriting Agent",
        role: "Runs 7-factor scoring, assembles memo, proposes limits.",
        status: "live",
        actionsToday: 41,
        escalationRate: 0.18,
      },
      {
        name: "Treasury Agent",
        role: "Sweeps, FX routing, rail selection, reserve maintenance.",
        status: "pilot",
        actionsToday: 19,
        escalationRate: 0.05,
      },
      {
        name: "Reconciliation Agent",
        role: "ERP\u2194Atlas match, variance triage, auto-resolve.",
        status: "live",
        actionsToday: 128,
        escalationRate: 0.02,
      },
    ]);
  });

  app.get("/api/engine/events", (_req, res) => {
    const now = Date.now();
    res.json([
      { ts: new Date(now - 1000 * 60 * 2).toISOString(), domain: "credit", event: "advance.proposed", subject: "INV-2041", detail: "Factoring advance proposed, $2.38M" },
      { ts: new Date(now - 1000 * 60 * 6).toISOString(), domain: "compliance", event: "kyb.refresh.queued", subject: "Bucharest Dynamics", detail: "Annual refresh window opens" },
      { ts: new Date(now - 1000 * 60 * 11).toISOString(), domain: "treasury", event: "sweep.suggested", subject: "FBO-USDC", detail: "Idle $1.25M \u2192 Circle Yield pilot" },
      { ts: new Date(now - 1000 * 60 * 18).toISOString(), domain: "recon", event: "variance.auto_resolved", subject: "QB-8820", detail: "FX timing variance $6,430" },
      { ts: new Date(now - 1000 * 60 * 27).toISOString(), domain: "policy", event: "acb.deployed", subject: "v4.12", detail: "Replay sample 142 cases; approval +1.8%" },
      { ts: new Date(now - 1000 * 60 * 41).toISOString(), domain: "credit", event: "case.gate3.pass", subject: "CS-2045", detail: "NovaBridge RBF \u2014 auto-routed to Gate 4" },
      { ts: new Date(now - 1000 * 60 * 58).toISOString(), domain: "credit", event: "decision.issued", subject: "CS-2038", detail: "Approved $9.5M factoring \u2014 time-to-decision 3.8 min" },
    ]);
  });

  app.get("/api/engine/lender", (_req, res) => {
    // Borrowing base preview — permissioned view, redacted in public demo
    res.json({
      reportingPeriod: "2026-03-01 \u2192 2026-03-31",
      borrowingBase: 148500000,
      eligiblePool: 128200000,
      reserves: { dilution: 7450000, concentration: 5180000, aging: 5950000 },
      yieldNetBps: 1820,
      lossProxyBps: 28,
      sampleCases: 142,
      concentrationLimits: [
        { label: "Single client", current: 8.4, capPct: 10, note: "Top tenant: NovaBridge SaaS" },
        { label: "Single corridor", current: 27, capPct: 40, note: "US \u2192 MX corridor" },
        { label: "Single tenor bucket", current: 62, capPct: 70, note: "30\u201360 day invoices" },
        { label: "Single buyer", current: 14.2, capPct: 18, note: "Aggregate across all tenants" },
      ],
      registry: {
        seriesId: "atlas-bb-2026-03",
        url: "https://arc-explorer.atlas/registry/atlas-bb-2026-03",
        chain: "Arc (preview)",
      },
      watermark: "PREVIEW \u00b7 LENDER-PERMISSIONED \u00b7 NOT FOR DISTRIBUTION",
    });
  });

  return httpServer;
}
