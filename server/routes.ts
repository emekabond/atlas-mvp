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
    const recLimit = Math.round(newScore * 4000 + Math.random() * 50000);
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

    const drawAmount = req.body.amount || 10000;
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

    const repayAmount = req.body.amount || 5000;
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
      amount: req.body.amount || 25000,
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
        { strategy: "Circle Yield", action: "increase", amount: 15000 },
        { strategy: "Compound USDC", action: "decrease", amount: 10000 },
        { strategy: "Aave USDC", action: "increase", amount: 5000 },
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
    const amount = Math.round((500 + Math.random() * 2000) * 100) / 100;
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

  return httpServer;
}
