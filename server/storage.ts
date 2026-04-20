import {
  type Client, type InsertClient, clients,
  type Invoice, type InsertInvoice, invoices,
  type Transaction, type InsertTransaction, transactions,
  type CreditAssessment, type InsertCreditAssessment, creditAssessments,
  type ComplianceEntity, type InsertComplianceEntity, complianceEntities,
  type ComplianceAlert, type InsertComplianceAlert, complianceAlerts,
  type RbfFacility, type InsertRbfFacility, rbfFacilities,
  type TreasuryPosition, type InsertTreasuryPosition, treasuryPositions,
  type TreasurySweep, type InsertTreasurySweep, treasurySweeps,
  type Card, type InsertCard, cards,
  type CardTransaction, type InsertCardTransaction, cardTransactions,
  type FxTransaction, type InsertFxTransaction, fxTransactions,
  type Reconciliation, type InsertReconciliation, reconciliations,
  type ErpConnection, type InsertErpConnection, erpConnections,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, desc, sql } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

export interface IStorage {
  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;

  // Invoices
  getInvoices(): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, data: Partial<Invoice>): Promise<Invoice | undefined>;

  // Transactions
  getTransactions(): Promise<Transaction[]>;
  getRecentTransactions(limit: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;

  // Credit Assessments
  getCreditAssessments(): Promise<CreditAssessment[]>;
  getCreditAssessmentsByClient(clientId: number): Promise<CreditAssessment[]>;
  createCreditAssessment(assessment: InsertCreditAssessment): Promise<CreditAssessment>;

  // Compliance Entities
  getComplianceEntities(): Promise<ComplianceEntity[]>;
  getComplianceEntity(id: number): Promise<ComplianceEntity | undefined>;
  createComplianceEntity(entity: InsertComplianceEntity): Promise<ComplianceEntity>;

  // Compliance Alerts
  getComplianceAlerts(): Promise<ComplianceAlert[]>;
  resolveComplianceAlert(id: number): Promise<ComplianceAlert | undefined>;

  // Dashboard
  getDashboardStats(): Promise<{
    totalVolume: number;
    activeClients: number;
    revenueMtd: number;
    avgSettlementSpeed: number;
  }>;
  getCashflowData(): Promise<Array<{ date: string; inbound: number; outbound: number }>>;
  getCorridorActivity(): Promise<Array<{
    corridor: string;
    volume: number;
    transactionCount: number;
    avgSettlementTime: number;
    eligibilityPct: number;
  }>>;

  // Credit overview
  getCreditOverview(): Promise<{
    totalCreditExtended: number;
    defaultRate: number;
    avgCreditScore: number;
    activeLines: number;
  }>;

  // Compliance overview
  getComplianceOverview(): Promise<{
    entitiesOnboarded: number;
    pendingReviews: number;
    activeMorAgreements: number;
    complianceScore: number;
  }>;

  // RBF Facilities
  getRbfFacilities(): Promise<RbfFacility[]>;
  getRbfFacility(id: number): Promise<RbfFacility | undefined>;
  getRbfFacilitiesByClient(clientId: number): Promise<RbfFacility[]>;
  createRbfFacility(facility: InsertRbfFacility): Promise<RbfFacility>;
  updateRbfFacility(id: number, data: Partial<RbfFacility>): Promise<RbfFacility | undefined>;
  getRbfOverview(): Promise<{
    totalFacilities: number;
    activeDrawn: number;
    avgRevenueShare: number;
    repaymentRate: number;
  }>;

  // Treasury
  getTreasuryPositions(): Promise<TreasuryPosition[]>;
  getTreasuryPosition(id: number): Promise<TreasuryPosition | undefined>;
  createTreasuryPosition(position: InsertTreasuryPosition): Promise<TreasuryPosition>;
  getTreasurySweeps(): Promise<TreasurySweep[]>;
  createTreasurySweep(sweep: InsertTreasurySweep): Promise<TreasurySweep>;
  getTreasuryOverview(): Promise<{
    totalAum: number;
    weightedApy: number;
    yieldEarnedMtd: number;
    idleBalance: number;
  }>;

  // Cards
  getCards(): Promise<Card[]>;
  getCard(id: number): Promise<Card | undefined>;
  getCardsByClient(clientId: number): Promise<Card[]>;
  createCard(card: InsertCard): Promise<Card>;
  updateCard(id: number, data: Partial<Card>): Promise<Card | undefined>;

  // Card Transactions
  getCardTransactions(): Promise<CardTransaction[]>;
  getCardTransactionsByCard(cardId: number): Promise<CardTransaction[]>;
  createCardTransaction(txn: InsertCardTransaction): Promise<CardTransaction>;

  // Card Analytics
  getCardOverview(): Promise<{
    totalCardsIssued: number;
    activeCards: number;
    totalSpendMtd: number;
    interchangeRevenueMtd: number;
  }>;
  getCardSpendByCategory(): Promise<Array<{ category: string; amount: number }>>;
  getCardSpendByCorridor(): Promise<Array<{ corridor: string; spend: number; interchangeRevenue: number; cardCount: number }>>;

  // FX
  getFxTransactions(): Promise<FxTransaction[]>;
  createFxTransaction(txn: InsertFxTransaction): Promise<FxTransaction>;
  getFxOverview(): Promise<{
    totalFxVolume: number;
    fxRevenueMtd: number;
    avgSpreadBps: number;
    transactionCount: number;
  }>;
  getFxByCorridor(): Promise<Array<{
    corridor: string;
    volume: number;
    avgSpreadBps: number;
    revenue: number;
    txnCount: number;
  }>>;
  getFxByDirection(): Promise<{
    inbound: { volume: number; avgSpread: number; revenue: number };
    outbound: { volume: number; avgSpread: number; revenue: number };
  }>;

  // Reconciliation
  getReconciliations(): Promise<Reconciliation[]>;
  getReconciliation(id: number): Promise<Reconciliation | undefined>;
  createReconciliation(rec: InsertReconciliation): Promise<Reconciliation>;
  updateReconciliation(id: number, data: Partial<Reconciliation>): Promise<Reconciliation | undefined>;
  getReconciliationOverview(): Promise<{
    totalRecords: number;
    matchedRecords: number;
    matchRate: number;
    unresolvedDiscrepancies: number;
    totalDiscrepancyValue: number;
  }>;
  getReconciliationsByStatus(): Promise<Array<{ status: string; count: number }>>;

  // ERP Connections
  getErpConnections(): Promise<ErpConnection[]>;
  getErpConnection(id: number): Promise<ErpConnection | undefined>;
  createErpConnection(conn: InsertErpConnection): Promise<ErpConnection>;
  updateErpConnection(id: number, data: Partial<ErpConnection>): Promise<ErpConnection | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getClients(): Promise<Client[]> {
    return db.select().from(clients).all();
  }

  async getClient(id: number): Promise<Client | undefined> {
    return db.select().from(clients).where(eq(clients.id, id)).get();
  }

  async createClient(client: InsertClient): Promise<Client> {
    return db.insert(clients).values(client).returning().get();
  }

  async getInvoices(): Promise<Invoice[]> {
    return db.select().from(invoices).orderBy(desc(invoices.createdAt)).all();
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    return db.select().from(invoices).where(eq(invoices.id, id)).get();
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    return db.insert(invoices).values(invoice).returning().get();
  }

  async updateInvoice(id: number, data: Partial<Invoice>): Promise<Invoice | undefined> {
    return db.update(invoices).set(data).where(eq(invoices.id, id)).returning().get();
  }

  async getTransactions(): Promise<Transaction[]> {
    return db.select().from(transactions).orderBy(desc(transactions.createdAt)).all();
  }

  async getRecentTransactions(limit: number): Promise<Transaction[]> {
    return db.select().from(transactions).orderBy(desc(transactions.createdAt)).limit(limit).all();
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    return db.insert(transactions).values(transaction).returning().get();
  }

  async getCreditAssessments(): Promise<CreditAssessment[]> {
    return db.select().from(creditAssessments).orderBy(desc(creditAssessments.assessedAt)).all();
  }

  async getCreditAssessmentsByClient(clientId: number): Promise<CreditAssessment[]> {
    return db.select().from(creditAssessments).where(eq(creditAssessments.clientId, clientId)).orderBy(desc(creditAssessments.assessedAt)).all();
  }

  async createCreditAssessment(assessment: InsertCreditAssessment): Promise<CreditAssessment> {
    return db.insert(creditAssessments).values(assessment).returning().get();
  }

  async getComplianceEntities(): Promise<ComplianceEntity[]> {
    return db.select().from(complianceEntities).all();
  }

  async getComplianceEntity(id: number): Promise<ComplianceEntity | undefined> {
    return db.select().from(complianceEntities).where(eq(complianceEntities.id, id)).get();
  }

  async createComplianceEntity(entity: InsertComplianceEntity): Promise<ComplianceEntity> {
    return db.insert(complianceEntities).values(entity).returning().get();
  }

  async getComplianceAlerts(): Promise<ComplianceAlert[]> {
    return db.select().from(complianceAlerts).where(eq(complianceAlerts.resolved, false)).orderBy(desc(complianceAlerts.createdAt)).all();
  }

  async resolveComplianceAlert(id: number): Promise<ComplianceAlert | undefined> {
    return db.update(complianceAlerts).set({ resolved: true }).where(eq(complianceAlerts.id, id)).returning().get();
  }

  async getDashboardStats() {
    const allTxns = db.select().from(transactions).all();
    const allClients = db.select().from(clients).where(eq(clients.status, "active")).all();
    const totalVolume = allTxns.reduce((sum, t) => sum + t.amount, 0);
    const completedTxns = allTxns.filter(t => t.status === "completed");
    const avgSettlement = completedTxns.length > 0
      ? completedTxns.reduce((sum, t) => sum + (t.settlementTime || 0), 0) / completedTxns.length
      : 0;
    const revenueMtd = totalVolume * 0.065; // ~6.5% take rate

    return {
      totalVolume: Math.round(totalVolume),
      activeClients: allClients.length,
      revenueMtd: Math.round(revenueMtd),
      avgSettlementSpeed: Math.round(avgSettlement * 10) / 10,
    };
  }

  async getCashflowData() {
    const allTxns = db.select().from(transactions).all();
    const days: Record<string, { inbound: number; outbound: number }> = {};

    // Generate last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days[key] = { inbound: 0, outbound: 0 };
    }

    for (const t of allTxns) {
      const day = t.createdAt.slice(0, 10);
      if (days[day]) {
        if (t.type === "inbound") days[day].inbound += t.amount;
        else if (t.type === "outbound") days[day].outbound += t.amount;
      }
    }

    return Object.entries(days).map(([date, vals]) => ({
      date,
      inbound: Math.round(vals.inbound),
      outbound: Math.round(vals.outbound),
    }));
  }

  async getCorridorActivity() {
    const allTxns = db.select().from(transactions).all();
    const corridors: Record<string, { volume: number; count: number; totalTime: number; completedCount: number }> = {};

    for (const t of allTxns) {
      if (!corridors[t.corridor]) {
        corridors[t.corridor] = { volume: 0, count: 0, totalTime: 0, completedCount: 0 };
      }
      corridors[t.corridor].volume += t.amount;
      corridors[t.corridor].count += 1;
      if (t.status === "completed" && t.settlementTime) {
        corridors[t.corridor].totalTime += t.settlementTime;
        corridors[t.corridor].completedCount += 1;
      }
    }

    // Median settlement times per corridor (empirical — hybrid stablecoin+SWIFT routing)
    const medianByCorridor: Record<string, number> = {
      "US\u2192AR": 6.2,
      "US\u2192MX": 2.4,
      "US\u2192PL": 4.8,
      "US\u2192VN": 8.6,
      "US\u2192PH": 5.1,
      "US\u2192RO": 4.2,
      "US\u2192BR": 9.3,
      "US\u2192CO": 5.8,
      "US\u2192IN": 7.4,
    };
    // Eligibility % — share of corridor volume currently eligible for factoring
    const eligibilityByCorridor: Record<string, number> = {
      "US\u2192AR": 72,
      "US\u2192MX": 84,
      "US\u2192PL": 68,
      "US\u2192VN": 48,
      "US\u2192PH": 54,
      "US\u2192RO": 61,
      "US\u2192BR": 42,
      "US\u2192CO": 51,
      "US\u2192IN": 57,
    };

    return Object.entries(corridors).map(([corridor, data]) => {
      const computed =
        data.completedCount > 0
          ? Math.round((data.totalTime / data.completedCount) * 10) / 10
          : 0;
      const avg = computed > 0 ? computed : medianByCorridor[corridor] ?? 5.4;
      const eligibilityPct = eligibilityByCorridor[corridor] ?? 55;
      return {
        corridor,
        volume: Math.round(data.volume),
        transactionCount: data.count,
        avgSettlementTime: avg,
        eligibilityPct,
      };
    });
  }

  async getCreditOverview() {
    const allClients = db.select().from(clients).all();
    const activeClients = allClients.filter(c => c.creditLimit && c.creditLimit > 0);
    const totalCredit = activeClients.reduce((sum, c) => sum + (c.creditLimit || 0), 0);
    const avgScore = allClients.filter(c => c.creditScore).reduce((sum, c) => sum + (c.creditScore || 0), 0) / Math.max(allClients.filter(c => c.creditScore).length, 1);

    return {
      totalCreditExtended: Math.round(totalCredit),
      defaultRate: 1.2,
      avgCreditScore: Math.round(avgScore),
      activeLines: activeClients.length,
    };
  }

  async getComplianceOverview() {
    const allEntities = db.select().from(complianceEntities).all();
    const approved = allEntities.filter(e => e.kybStage === "approved");
    const pending = allEntities.filter(e => e.kybStage !== "approved" && e.kybStage !== "rejected");
    const activeMor = allEntities.filter(e => e.morStatus === "active");
    const avgScore = allEntities.filter(e => e.complianceScore).reduce((sum, e) => sum + (e.complianceScore || 0), 0) / Math.max(allEntities.length, 1);

    return {
      entitiesOnboarded: approved.length,
      pendingReviews: pending.length,
      activeMorAgreements: activeMor.length,
      complianceScore: Math.round(avgScore),
    };
  }

  // RBF Facilities
  async getRbfFacilities(): Promise<RbfFacility[]> {
    return db.select().from(rbfFacilities).orderBy(desc(rbfFacilities.createdAt)).all();
  }

  async getRbfFacility(id: number): Promise<RbfFacility | undefined> {
    return db.select().from(rbfFacilities).where(eq(rbfFacilities.id, id)).get();
  }

  async getRbfFacilitiesByClient(clientId: number): Promise<RbfFacility[]> {
    return db.select().from(rbfFacilities).where(eq(rbfFacilities.clientId, clientId)).all();
  }

  async createRbfFacility(facility: InsertRbfFacility): Promise<RbfFacility> {
    return db.insert(rbfFacilities).values(facility).returning().get();
  }

  async updateRbfFacility(id: number, data: Partial<RbfFacility>): Promise<RbfFacility | undefined> {
    return db.update(rbfFacilities).set(data).where(eq(rbfFacilities.id, id)).returning().get();
  }

  async getRbfOverview() {
    const allFacilities = db.select().from(rbfFacilities).all();
    const activeFacilities = allFacilities.filter(f => f.status === "active");
    const totalFacilities = allFacilities.reduce((sum, f) => sum + f.facilityAmount, 0);
    const activeDrawn = activeFacilities.reduce((sum, f) => sum + f.drawnAmount, 0);
    const avgRevenueShare = activeFacilities.length > 0
      ? activeFacilities.reduce((sum, f) => sum + f.revenueSharePct, 0) / activeFacilities.length
      : 0;
    const totalDrawn = allFacilities.reduce((sum, f) => sum + f.drawnAmount, 0);
    const totalRepaid = allFacilities.reduce((sum, f) => sum + f.repaidAmount, 0);
    const repaymentRate = totalDrawn > 0 ? (totalRepaid / totalDrawn) * 100 : 0;

    return {
      totalFacilities: Math.round(totalFacilities),
      activeDrawn: Math.round(activeDrawn),
      avgRevenueShare: Math.round(avgRevenueShare * 10) / 10,
      repaymentRate: Math.round(repaymentRate * 10) / 10,
    };
  }

  // Treasury
  async getTreasuryPositions(): Promise<TreasuryPosition[]> {
    return db.select().from(treasuryPositions).orderBy(desc(treasuryPositions.allocatedAmount)).all();
  }

  async getTreasuryPosition(id: number): Promise<TreasuryPosition | undefined> {
    return db.select().from(treasuryPositions).where(eq(treasuryPositions.id, id)).get();
  }

  async createTreasuryPosition(position: InsertTreasuryPosition): Promise<TreasuryPosition> {
    return db.insert(treasuryPositions).values(position).returning().get();
  }

  async getTreasurySweeps(): Promise<TreasurySweep[]> {
    return db.select().from(treasurySweeps).orderBy(desc(treasurySweeps.createdAt)).all();
  }

  async createTreasurySweep(sweep: InsertTreasurySweep): Promise<TreasurySweep> {
    return db.insert(treasurySweeps).values(sweep).returning().get();
  }

  async getTreasuryOverview() {
    const allPositions = db.select().from(treasuryPositions).where(eq(treasuryPositions.status, "active")).all();
    const totalAum = allPositions.reduce((sum, p) => sum + p.currentValue, 0);
    const weightedApy = allPositions.length > 0
      ? allPositions.reduce((sum, p) => sum + (p.apy * p.currentValue), 0) / totalAum
      : 0;
    const yieldEarned = allPositions.reduce((sum, p) => sum + (p.currentValue - p.allocatedAmount), 0);
    const idleBalance = 145000; // simulated idle USDC balance

    return {
      totalAum: Math.round(totalAum),
      weightedApy: Math.round(weightedApy * 100) / 100,
      yieldEarnedMtd: Math.round(yieldEarned),
      idleBalance,
    };
  }

  // Cards
  async getCards(): Promise<Card[]> {
    return db.select().from(cards).orderBy(desc(cards.issuedAt)).all();
  }

  async getCard(id: number): Promise<Card | undefined> {
    return db.select().from(cards).where(eq(cards.id, id)).get();
  }

  async getCardsByClient(clientId: number): Promise<Card[]> {
    return db.select().from(cards).where(eq(cards.clientId, clientId)).all();
  }

  async createCard(card: InsertCard): Promise<Card> {
    return db.insert(cards).values(card).returning().get();
  }

  async updateCard(id: number, data: Partial<Card>): Promise<Card | undefined> {
    return db.update(cards).set(data).where(eq(cards.id, id)).returning().get();
  }

  // Card Transactions
  async getCardTransactions(): Promise<CardTransaction[]> {
    return db.select().from(cardTransactions).orderBy(desc(cardTransactions.createdAt)).all();
  }

  async getCardTransactionsByCard(cardId: number): Promise<CardTransaction[]> {
    return db.select().from(cardTransactions).where(eq(cardTransactions.cardId, cardId)).orderBy(desc(cardTransactions.createdAt)).all();
  }

  async createCardTransaction(txn: InsertCardTransaction): Promise<CardTransaction> {
    return db.insert(cardTransactions).values(txn).returning().get();
  }

  // Card Analytics
  async getCardOverview() {
    const allCards = db.select().from(cards).all();
    const allTxns = db.select().from(cardTransactions).all();
    const activeCards = allCards.filter(c => c.status === "active");
    const totalSpend = allCards.reduce((sum, c) => sum + c.currentSpend, 0);
    const interchangeRevenue = allTxns.filter(t => t.status === "approved").reduce((sum, t) => sum + t.interchangeFee, 0);

    return {
      totalCardsIssued: allCards.length,
      activeCards: activeCards.length,
      totalSpendMtd: Math.round(totalSpend),
      interchangeRevenueMtd: Math.round(interchangeRevenue * 100) / 100,
    };
  }

  async getCardSpendByCategory() {
    const allTxns = db.select().from(cardTransactions).all();
    const categories: Record<string, number> = {};
    for (const t of allTxns) {
      if (t.status === "approved") {
        categories[t.merchantCategory] = (categories[t.merchantCategory] || 0) + t.amount;
      }
    }
    return Object.entries(categories).map(([category, amount]) => ({
      category,
      amount: Math.round(amount),
    })).sort((a, b) => b.amount - a.amount);
  }

  async getCardSpendByCorridor() {
    const allCards = db.select().from(cards).all();
    const allTxns = db.select().from(cardTransactions).all();
    const corridorMap: Record<string, { spend: number; interchange: number; cardIds: Set<number> }> = {};

    for (const t of allTxns) {
      if (t.status === "approved") {
        if (!corridorMap[t.corridor]) corridorMap[t.corridor] = { spend: 0, interchange: 0, cardIds: new Set() };
        corridorMap[t.corridor].spend += t.amount;
        corridorMap[t.corridor].interchange += t.interchangeFee;
        corridorMap[t.corridor].cardIds.add(t.cardId);
      }
    }

    return Object.entries(corridorMap).map(([corridor, data]) => ({
      corridor,
      spend: Math.round(data.spend),
      interchangeRevenue: Math.round(data.interchange * 100) / 100,
      cardCount: data.cardIds.size,
    })).sort((a, b) => b.spend - a.spend);
  }

  // FX
  async getFxTransactions(): Promise<FxTransaction[]> {
    return db.select().from(fxTransactions).orderBy(desc(fxTransactions.createdAt)).all();
  }

  async createFxTransaction(txn: InsertFxTransaction): Promise<FxTransaction> {
    return db.insert(fxTransactions).values(txn).returning().get();
  }

  async getFxOverview() {
    const allFx = db.select().from(fxTransactions).all();
    const totalVolume = allFx.reduce((sum, t) => sum + t.amount, 0);
    const totalRevenue = allFx.reduce((sum, t) => sum + t.spreadRevenue, 0);
    const avgSpread = allFx.length > 0
      ? allFx.reduce((sum, t) => sum + t.spreadBps, 0) / allFx.length
      : 0;

    return {
      totalFxVolume: Math.round(totalVolume),
      fxRevenueMtd: Math.round(totalRevenue * 100) / 100,
      avgSpreadBps: Math.round(avgSpread * 10) / 10,
      transactionCount: allFx.length,
    };
  }

  async getFxByCorridor() {
    const allFx = db.select().from(fxTransactions).all();
    const corridors: Record<string, { volume: number; totalSpread: number; revenue: number; count: number }> = {};

    for (const t of allFx) {
      if (!corridors[t.corridor]) corridors[t.corridor] = { volume: 0, totalSpread: 0, revenue: 0, count: 0 };
      corridors[t.corridor].volume += t.amount;
      corridors[t.corridor].totalSpread += t.spreadBps;
      corridors[t.corridor].revenue += t.spreadRevenue;
      corridors[t.corridor].count += 1;
    }

    return Object.entries(corridors).map(([corridor, data]) => ({
      corridor,
      volume: Math.round(data.volume),
      avgSpreadBps: Math.round((data.totalSpread / data.count) * 10) / 10,
      revenue: Math.round(data.revenue * 100) / 100,
      txnCount: data.count,
    })).sort((a, b) => b.revenue - a.revenue);
  }

  async getFxByDirection() {
    const allFx = db.select().from(fxTransactions).all();
    const inbound = allFx.filter(t => t.direction === "inbound");
    const outbound = allFx.filter(t => t.direction === "outbound");

    const calcDir = (txns: FxTransaction[]) => ({
      volume: Math.round(txns.reduce((s, t) => s + t.amount, 0)),
      avgSpread: txns.length > 0 ? Math.round((txns.reduce((s, t) => s + t.spreadBps, 0) / txns.length) * 10) / 10 : 0,
      revenue: Math.round(txns.reduce((s, t) => s + t.spreadRevenue, 0) * 100) / 100,
    });

    return {
      inbound: calcDir(inbound),
      outbound: calcDir(outbound),
    };
  }

  // Reconciliation
  async getReconciliations(): Promise<Reconciliation[]> {
    return db.select().from(reconciliations).orderBy(desc(reconciliations.createdAt)).all();
  }

  async getReconciliation(id: number): Promise<Reconciliation | undefined> {
    return db.select().from(reconciliations).where(eq(reconciliations.id, id)).get();
  }

  async createReconciliation(rec: InsertReconciliation): Promise<Reconciliation> {
    return db.insert(reconciliations).values(rec).returning().get();
  }

  async updateReconciliation(id: number, data: Partial<Reconciliation>): Promise<Reconciliation | undefined> {
    return db.update(reconciliations).set(data).where(eq(reconciliations.id, id)).returning().get();
  }

  async getReconciliationOverview() {
    const all = db.select().from(reconciliations).all();
    const matched = all.filter(r => r.status === "matched" || r.status === "resolved");
    const unresolved = all.filter(r => r.status === "discrepancy" || r.status === "unmatched" || r.status === "pending_review");
    const totalDiscrepancy = all
      .filter(r => r.discrepancyAmount && r.status !== "resolved")
      .reduce((sum, r) => sum + Math.abs(r.discrepancyAmount || 0), 0);

    return {
      totalRecords: all.length,
      matchedRecords: matched.length,
      matchRate: all.length > 0 ? Math.round((matched.length / all.length) * 1000) / 10 : 0,
      unresolvedDiscrepancies: unresolved.length,
      totalDiscrepancyValue: Math.round(totalDiscrepancy * 100) / 100,
    };
  }

  async getReconciliationsByStatus() {
    const all = db.select().from(reconciliations).all();
    const counts: Record<string, number> = {};
    for (const r of all) {
      counts[r.status] = (counts[r.status] || 0) + 1;
    }
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }

  // ERP Connections
  async getErpConnections(): Promise<ErpConnection[]> {
    return db.select().from(erpConnections).all();
  }

  async getErpConnection(id: number): Promise<ErpConnection | undefined> {
    return db.select().from(erpConnections).where(eq(erpConnections.id, id)).get();
  }

  async createErpConnection(conn: InsertErpConnection): Promise<ErpConnection> {
    return db.insert(erpConnections).values(conn).returning().get();
  }

  async updateErpConnection(id: number, data: Partial<ErpConnection>): Promise<ErpConnection | undefined> {
    return db.update(erpConnections).set(data).where(eq(erpConnections.id, id)).returning().get();
  }
}

export const storage = new DatabaseStorage();

// Seed data function
export function seedDatabase() {
  // Check if already seeded
  const existingClients = db.select().from(clients).all();
  if (existingClients.length > 0) return;

  // Seed Clients (TH replaced with PH, added BR, CO, IN clients)
  const clientData: InsertClient[] = [
    { name: "Meridian Software", country: "Argentina", corridor: "US→AR", status: "active", kybStatus: "approved", creditScore: 82, creditLimit: 250000, riskTier: "low" },
    { name: "Volta Digital Agency", country: "Mexico", corridor: "US→MX", status: "active", kybStatus: "approved", creditScore: 74, creditLimit: 180000, riskTier: "low" },
    { name: "NovaBridge SaaS", country: "Poland", corridor: "US→PL", status: "active", kybStatus: "approved", creditScore: 91, creditLimit: 400000, riskTier: "low" },
    { name: "Phan & Associates", country: "Vietnam", corridor: "US→VN", status: "active", kybStatus: "approved", creditScore: 65, creditLimit: 120000, riskTier: "medium" },
    { name: "Bucharest Dynamics", country: "Romania", corridor: "US→RO", status: "active", kybStatus: "approved", creditScore: 78, creditLimit: 200000, riskTier: "low" },
    { name: "Manila Bay Digital", country: "Philippines", corridor: "US→PH", status: "active", kybStatus: "in_review", creditScore: 58, creditLimit: 80000, riskTier: "medium" },
    { name: "Altiplano Exports", country: "Argentina", corridor: "US→AR", status: "active", kybStatus: "approved", creditScore: 45, creditLimit: 60000, riskTier: "high" },
    { name: "Centurion Dev Labs", country: "Mexico", corridor: "US→MX", status: "active", kybStatus: "approved", creditScore: 88, creditLimit: 350000, riskTier: "low" },
    { name: "Kraków Cloud Services", country: "Poland", corridor: "US→PL", status: "active", kybStatus: "approved", creditScore: 72, creditLimit: 150000, riskTier: "medium" },
    { name: "Pacific Rim Imports", country: "Vietnam", corridor: "US→VN", status: "inactive", kybStatus: "approved", creditScore: 39, creditLimit: 40000, riskTier: "high" },
    { name: "Wrocław Fintech", country: "Poland", corridor: "US→PL", status: "active", kybStatus: "in_review", creditScore: 69, creditLimit: 100000, riskTier: "medium" },
    { name: "Guadalajara Studios", country: "Mexico", corridor: "US→MX", status: "active", kybStatus: "approved", creditScore: 85, creditLimit: 280000, riskTier: "low" },
    { name: "São Paulo DevHouse", country: "Brazil", corridor: "US→BR", status: "active", kybStatus: "approved", creditScore: 77, creditLimit: 190000, riskTier: "low" },
    { name: "Bogotá SaaS Studio", country: "Colombia", corridor: "US→CO", status: "active", kybStatus: "approved", creditScore: 68, creditLimit: 140000, riskTier: "medium" },
    { name: "Mumbai Infra Labs", country: "India", corridor: "US→IN", status: "active", kybStatus: "approved", creditScore: 84, creditLimit: 320000, riskTier: "low" },
    { name: "Recife Digital Agency", country: "Brazil", corridor: "US→BR", status: "active", kybStatus: "in_review", creditScore: 55, creditLimit: 70000, riskTier: "medium" },
  ];

  for (const c of clientData) {
    db.insert(clients).values(c).run();
  }

  // Seed Invoices
  const statuses = ["draft", "sent", "factored", "settled"];
  const methods = ["USDC", "SWIFT"];
  const factoringStatuses = ["none", "eligible", "offered", "accepted", "funded"];

  const invoiceData: InsertInvoice[] = [];
  const corridors = ["US→AR", "US→MX", "US→PL", "US→VN", "US→RO", "US→PH", "US→BR", "US→CO", "US→IN"];

  for (let i = 0; i < 35; i++) {
    const clientIdx = (i % 16) + 1;
    const status = statuses[i % 4];
    const amount = Math.round((5000 + Math.random() * 95000) * 100) / 100;
    const daysAgo = Math.floor(Math.random() * 60);
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - daysAgo);
    const dueDate = new Date(createdDate);
    dueDate.setDate(dueDate.getDate() + 30);

    invoiceData.push({
      clientId: clientIdx,
      invoiceNumber: `INV-${2026}${String(i + 1).padStart(4, "0")}`,
      amount,
      currency: "USD",
      corridor: corridors[i % corridors.length],
      status,
      settlementMethod: methods[i % 2],
      factoringStatus: status === "factored" ? "funded" : factoringStatuses[i % 5],
      dueDate: dueDate.toISOString().slice(0, 10),
      createdAt: createdDate.toISOString(),
      description: `Professional services - ${["Q1 Development Sprint", "Monthly Retainer", "Infrastructure Setup", "Design System Build", "API Integration", "Cloud Migration", "Data Pipeline", "Security Audit"][i % 8]}`,
    });
  }

  for (const inv of invoiceData) {
    db.insert(invoices).values(inv).run();
  }

  // Seed Transactions
  const txnTypes = ["inbound", "outbound", "conversion"];
  const txnStatuses = ["completed", "pending", "processing"];

  for (let i = 0; i < 55; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - daysAgo);
    const type = txnTypes[i % 3];
    const status = txnStatuses[i % 3];
    const amount = Math.round((1000 + Math.random() * 50000) * 100) / 100;

    db.insert(transactions).values({
      invoiceId: (i % 35) + 1,
      type,
      amount,
      currency: "USD",
      fromCurrency: type === "conversion" ? "USD" : undefined,
      toCurrency: type === "conversion" ? ["ARS", "MXN", "PLN", "VND", "RON", "PHP", "BRL", "COP", "INR"][i % 9] : undefined,
      status,
      corridor: corridors[i % corridors.length],
      settlementTime: status === "completed" ? Math.floor(2 + Math.random() * 22) : undefined,
      createdAt: createdDate.toISOString(),
    }).run();
  }

  // Seed Credit Assessments (for all 16 clients)
  for (let i = 0; i < 16; i++) {
    const score = clientData[i].creditScore || 50;
    db.insert(creditAssessments).values({
      clientId: i + 1,
      score,
      revenueConsistency: Math.min(100, Math.max(20, score + Math.floor(Math.random() * 20 - 10))),
      paymentHistory: Math.min(100, Math.max(20, score + Math.floor(Math.random() * 20 - 10))),
      corridorRisk: Math.min(100, Math.max(20, score + Math.floor(Math.random() * 20 - 10))),
      erpHealth: Math.min(100, Math.max(20, score + Math.floor(Math.random() * 20 - 10))),
      recommendedLimit: clientData[i].creditLimit || 50000,
      recommendation: score >= 80 ? "increase" : score >= 60 ? "maintain" : score >= 45 ? "flag_review" : "decrease",
      assessedAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
    }).run();
  }

  // Seed Compliance Entities (original 10 + 4 new)
  const kybStages = ["application", "document_review", "verification", "approved", "approved", "approved", "approved", "rejected", "verification", "document_review"];
  const morStatuses = ["pending", "active", "active", "active", "active", "expired", "active", "suspended", "pending", "pending"];

  const entityData = [
    { name: "Meridian Software S.R.L.", jurisdiction: "Argentina", regNum: "AR-30-71234567-8" },
    { name: "Volta Digital S.A. de C.V.", jurisdiction: "Mexico", regNum: "MX-VDA-210615-QR3" },
    { name: "NovaBridge Sp. z o.o.", jurisdiction: "Poland", regNum: "PL-KRS-0000812345" },
    { name: "Phan & Associates LLC", jurisdiction: "Vietnam", regNum: "VN-0109234567" },
    { name: "Bucharest Dynamics S.R.L.", jurisdiction: "Romania", regNum: "RO-J40/12345/2019" },
    { name: "Manila Bay Digital Inc.", jurisdiction: "Philippines", regNum: "PH-SEC-2021-0012345" },
    { name: "Altiplano Exports S.A.", jurisdiction: "Argentina", regNum: "AR-30-71987654-2" },
    { name: "Centurion Dev Labs S.A. de C.V.", jurisdiction: "Mexico", regNum: "MX-CDL-200301-AB1" },
    { name: "Kraków Cloud Sp. z o.o.", jurisdiction: "Poland", regNum: "PL-KRS-0000823456" },
    { name: "Guadalajara Studios S.A. de C.V.", jurisdiction: "Mexico", regNum: "MX-GDS-190705-CD2" },
  ];

  for (let i = 0; i < entityData.length; i++) {
    const docs = JSON.stringify({
      "certificate_of_incorporation": kybStages[i] !== "application",
      "proof_of_address": kybStages[i] === "approved" || kybStages[i] === "verification",
      "director_id": kybStages[i] === "approved",
      "bank_statement": kybStages[i] === "approved",
      "tax_registration": kybStages[i] === "approved" || kybStages[i] === "verification",
    });

    db.insert(complianceEntities).values({
      clientId: i + 1,
      entityName: entityData[i].name,
      jurisdiction: entityData[i].jurisdiction,
      registrationNumber: entityData[i].regNum,
      kybStage: kybStages[i],
      documentsJson: docs,
      morStatus: morStatuses[i],
      complianceScore: kybStages[i] === "approved" ? 75 + Math.floor(Math.random() * 25) : kybStages[i] === "rejected" ? 25 : 40 + Math.floor(Math.random() * 30),
    }).run();
  }

  // New compliance entities for new clients
  const newEntities = [
    { clientId: 13, name: "São Paulo DevHouse Ltda.", jurisdiction: "Brazil", regNum: "BR-CNPJ-12.345.678/0001-90", kybStage: "approved", morStatus: "active", score: 82 },
    { clientId: 14, name: "Bogotá SaaS Studio S.A.S.", jurisdiction: "Colombia", regNum: "CO-NIT-900123456-1", kybStage: "document_review", morStatus: "pending", score: 52 },
    { clientId: 15, name: "Mumbai Infra Labs Pvt. Ltd.", jurisdiction: "India", regNum: "IN-CIN-U72200MH2020PTC345678", kybStage: "verification", morStatus: "pending", score: 61 },
    { clientId: 16, name: "Recife Digital Agency Ltda.", jurisdiction: "Brazil", regNum: "BR-CNPJ-98.765.432/0001-10", kybStage: "application", morStatus: "pending", score: 38 },
  ];

  for (const ent of newEntities) {
    const docs = JSON.stringify({
      "certificate_of_incorporation": ent.kybStage !== "application",
      "proof_of_address": ent.kybStage === "approved" || ent.kybStage === "verification",
      "director_id": ent.kybStage === "approved",
      "bank_statement": ent.kybStage === "approved",
      "tax_registration": ent.kybStage === "approved" || ent.kybStage === "verification",
    });

    db.insert(complianceEntities).values({
      clientId: ent.clientId,
      entityName: ent.name,
      jurisdiction: ent.jurisdiction,
      registrationNumber: ent.regNum,
      kybStage: ent.kybStage,
      documentsJson: docs,
      morStatus: ent.morStatus,
      complianceScore: ent.score,
    }).run();
  }

  // Seed Compliance Alerts (updated entity 6 reference to Manila Bay Digital)
  const alertData = [
    { entityId: 1, type: "document_expiry", severity: "medium", message: "Certificate of Incorporation expires in 30 days — Meridian Software S.R.L." },
    { entityId: 6, type: "kyb_update", severity: "high", message: "KYB review stalled for 14 days — Manila Bay Digital Inc." },
    { entityId: 3, type: "regulatory_change", severity: "low", message: "New EU AML directive effective April 2026 — affects NovaBridge Sp. z o.o." },
    { entityId: 7, type: "flagged_transaction", severity: "critical", message: "Unusual transaction pattern detected — Altiplano Exports S.A. — $47,000 in 3 transactions within 2 hours" },
    { entityId: 2, type: "document_expiry", severity: "medium", message: "Tax registration certificate renewal due — Volta Digital S.A. de C.V." },
    { entityId: 8, type: "kyb_update", severity: "high", message: "KYB application rejected — missing director verification — Centurion Dev Labs" },
    { entityId: 5, type: "regulatory_change", severity: "low", message: "Romania ANAF reporting requirements updated for 2026" },
    { entityId: 4, type: "flagged_transaction", severity: "high", message: "Cross-border transfer exceeds automated threshold — Phan & Associates — $85,000 single transfer" },
    { entityId: 11, type: "document_expiry", severity: "medium", message: "CNPJ registration renewal due in 45 days — São Paulo DevHouse Ltda." },
    { entityId: 12, type: "kyb_update", severity: "high", message: "Document review pending for 10 days — Bogotá SaaS Studio S.A.S." },
    { entityId: 13, type: "regulatory_change", severity: "low", message: "India RBI updated FEMA compliance guidelines for 2026 — affects Mumbai Infra Labs Pvt. Ltd." },
    { entityId: 14, type: "kyb_update", severity: "medium", message: "Application incomplete — missing bank statement — Recife Digital Agency Ltda." },
  ];

  for (const alert of alertData) {
    db.insert(complianceAlerts).values({
      ...alert,
      resolved: false,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000)).toISOString(),
    }).run();
  }

  // Seed RBF Facilities
  const rbfData: InsertRbfFacility[] = [
    { clientId: 1, facilityAmount: 150000, drawnAmount: 85000, repaidAmount: 32000, revenueSharePct: 7.5, termMonths: 6, status: "active", monthlyRevenue: 42000, repaymentCap: 1.3, createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() },
    { clientId: 3, facilityAmount: 300000, drawnAmount: 200000, repaidAmount: 75000, revenueSharePct: 6.0, termMonths: 12, status: "active", monthlyRevenue: 95000, repaymentCap: 1.25, createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() },
    { clientId: 8, facilityAmount: 200000, drawnAmount: 120000, repaidAmount: 48000, revenueSharePct: 8.0, termMonths: 6, status: "active", monthlyRevenue: 62000, repaymentCap: 1.35, createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
    { clientId: 5, facilityAmount: 100000, drawnAmount: 100000, repaidAmount: 100000, revenueSharePct: 7.0, termMonths: 3, status: "fully_repaid", monthlyRevenue: 38000, repaymentCap: 1.3, createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString() },
    { clientId: 13, facilityAmount: 120000, drawnAmount: 60000, repaidAmount: 15000, revenueSharePct: 8.5, termMonths: 6, status: "active", monthlyRevenue: 35000, repaymentCap: 1.3, createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
    { clientId: 15, facilityAmount: 250000, drawnAmount: 0, repaidAmount: 0, revenueSharePct: 6.5, termMonths: 12, status: "pending_approval", monthlyRevenue: 78000, repaymentCap: 1.25, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { clientId: 12, facilityAmount: 180000, drawnAmount: 140000, repaidAmount: 52000, revenueSharePct: 7.0, termMonths: 6, status: "active", monthlyRevenue: 55000, repaymentCap: 1.3, createdAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString() },
    { clientId: 2, facilityAmount: 90000, drawnAmount: 0, repaidAmount: 0, revenueSharePct: 9.0, termMonths: 3, status: "pending_approval", monthlyRevenue: 28000, repaymentCap: 1.35, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  ];

  for (const rbf of rbfData) {
    db.insert(rbfFacilities).values(rbf).run();
  }

  // Seed Treasury Positions
  const treasuryData: InsertTreasuryPosition[] = [
    { strategyName: "Circle Yield", protocol: "Circle", allocatedAmount: 420000, currentValue: 424500, apy: 4.2, riskTier: "conservative", maturityDate: null, status: "active", createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
    { strategyName: "Aave USDC", protocol: "Aave", allocatedAmount: 180000, currentValue: 182340, apy: 5.1, riskTier: "moderate", maturityDate: null, status: "active", createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() },
    { strategyName: "T-Bill USDC (Ondo)", protocol: "Ondo", allocatedAmount: 310000, currentValue: 313800, apy: 4.8, riskTier: "conservative", maturityDate: null, status: "active", createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() },
    { strategyName: "Compound USDC", protocol: "Compound", allocatedAmount: 95000, currentValue: 96500, apy: 6.2, riskTier: "moderate", maturityDate: null, status: "active", createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
    { strategyName: "Mountain Protocol (USDM)", protocol: "Mountain", allocatedAmount: 60000, currentValue: 60750, apy: 5.0, riskTier: "moderate", maturityDate: "2026-04-15", status: "maturing", createdAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString() },
  ];

  for (const pos of treasuryData) {
    db.insert(treasuryPositions).values(pos).run();
  }

  // Seed Treasury Sweeps (last 30 days)
  const sweepAccounts = ["FBO Main", "Settlement Pool", "Operating Reserve", "Client Escrow"];
  const sweepStrategies = ["Circle Yield", "Aave USDC", "T-Bill USDC (Ondo)", "Compound USDC", "Mountain Protocol (USDM)"];
  const sweepTypes = ["sweep_in", "sweep_out", "yield_harvest"];
  const sweepStatuses = ["completed", "completed", "completed", "pending", "processing"];

  for (let i = 0; i < 18; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - daysAgo);
    const sweepType = sweepTypes[i % 3];
    const amount = sweepType === "yield_harvest"
      ? Math.round((500 + Math.random() * 3000) * 100) / 100
      : Math.round((10000 + Math.random() * 80000) * 100) / 100;

    db.insert(treasurySweeps).values({
      fromAccount: sweepAccounts[i % sweepAccounts.length],
      toStrategy: sweepStrategies[i % sweepStrategies.length],
      amount,
      type: sweepType,
      status: sweepStatuses[i % sweepStatuses.length],
      createdAt: createdDate.toISOString(),
    }).run();
  }

  // Seed Cards (~20 cards across corridors)
  const cardCorridors = ["US→AR", "US→MX", "US→PL", "US→VN", "US→RO", "US→PH", "US→BR", "US→CO", "US→IN"];
  const cardholderNames = [
    "Carlos Mendez", "Ana Rivera", "Marek Kowalski", "Nguyen Thi Lan", "Ion Popescu",
    "Maria Santos", "Pedro Gutierrez", "Katarzyna Nowak", "Tran Van Duc", "Elena Vasile",
    "Jose Garcia", "Pawel Zielinski", "Le Minh Tuan", "Adriana Costa", "Luis Hernandez",
    "Priya Sharma", "Rajesh Patel", "Sofia Morales", "Diego Ramirez", "Camila Oliveira",
  ];
  const cardTypes = ["virtual", "virtual", "virtual", "physical"];
  const cardStatuses = ["active", "active", "active", "active", "frozen"];
  const spendLimits = [5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 50000];

  for (let i = 0; i < 20; i++) {
    const limit = spendLimits[i % spendLimits.length];
    const spend = Math.round(Math.random() * limit * 0.7 * 100) / 100;
    const daysAgo = Math.floor(Math.random() * 60) + 5;
    const issuedDate = new Date();
    issuedDate.setDate(issuedDate.getDate() - daysAgo);

    db.insert(cards).values({
      clientId: (i % 16) + 1,
      cardholderName: cardholderNames[i],
      last4: String(1000 + Math.floor(Math.random() * 9000)),
      cardType: cardTypes[i % cardTypes.length],
      status: cardStatuses[i % cardStatuses.length],
      spendLimit: limit,
      currentSpend: spend,
      currency: "USD",
      corridor: cardCorridors[i % cardCorridors.length],
      issuedAt: issuedDate.toISOString(),
    }).run();
  }

  // Seed Card Transactions (~60)
  const merchantNames = [
    "AWS Cloud Services", "Google Workspace", "Zoom Pro", "WeWork Office", "Slack Enterprise",
    "Adobe Creative Cloud", "Microsoft 365", "Figma Pro", "Notion Team", "GitHub Enterprise",
    "Expedia Business", "Delta Airlines", "Marriott Hotels", "Uber Business", "DoorDash Corporate",
    "Indeed Jobs", "LinkedIn Premium", "Facebook Ads", "Google Ads", "Mailchimp Pro",
    "ADP Payroll", "Gusto Payroll", "Deel Payments", "Remote.com", "Wise Business",
    "Staples Office", "FedEx Shipping", "UPS Business", "Canva Pro", "HubSpot CRM",
  ];
  const merchantCategories = ["travel", "software", "services", "office", "payroll", "marketing"];
  const categoryMap: Record<string, string[]> = {
    software: ["AWS Cloud Services", "Google Workspace", "Zoom Pro", "Slack Enterprise", "Adobe Creative Cloud", "Microsoft 365", "Figma Pro", "Notion Team", "GitHub Enterprise"],
    travel: ["Expedia Business", "Delta Airlines", "Marriott Hotels", "Uber Business"],
    services: ["DoorDash Corporate", "Canva Pro", "HubSpot CRM", "Remote.com", "Wise Business"],
    office: ["WeWork Office", "Staples Office", "FedEx Shipping", "UPS Business"],
    payroll: ["ADP Payroll", "Gusto Payroll", "Deel Payments"],
    marketing: ["Indeed Jobs", "LinkedIn Premium", "Facebook Ads", "Google Ads", "Mailchimp Pro"],
  };
  const cardTxnStatuses = ["approved", "approved", "approved", "approved", "approved", "declined", "pending"];
  const cardTxnTypes = ["purchase", "purchase", "purchase", "purchase", "payout"];
  const localCurrencies: Record<string, string> = {
    "US→AR": "ARS", "US→MX": "MXN", "US→PL": "PLN", "US→VN": "VND",
    "US→RO": "RON", "US→PH": "PHP", "US→BR": "BRL", "US→CO": "COP", "US→IN": "INR",
  };
  const localRates: Record<string, number> = {
    "ARS": 900, "MXN": 17.5, "PLN": 4.05, "VND": 25300, "RON": 4.65,
    "PHP": 56.5, "BRL": 5.10, "COP": 4150, "INR": 83.5,
  };

  for (let i = 0; i < 60; i++) {
    const cardId = (i % 20) + 1;
    const corridor = cardCorridors[cardId - 1 < cardCorridors.length ? cardId - 1 : (cardId - 1) % cardCorridors.length];
    const category = merchantCategories[i % merchantCategories.length];
    const merchants = categoryMap[category];
    const merchant = merchants[i % merchants.length];
    const amount = Math.round((50 + Math.random() * 2500) * 100) / 100;
    const interchangeFee = Math.round(amount * (0.015 + Math.random() * 0.01) * 100) / 100;
    const status = cardTxnStatuses[i % cardTxnStatuses.length];
    const type = cardTxnTypes[i % cardTxnTypes.length];
    const daysAgo = Math.floor(Math.random() * 30);
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - daysAgo);
    const localCurr = localCurrencies[corridor];
    const rate = localRates[localCurr] || 1;
    const useLocal = Math.random() > 0.4;

    db.insert(cardTransactions).values({
      cardId,
      merchantName: merchant,
      merchantCategory: category,
      amount,
      currency: "USD",
      localAmount: useLocal ? Math.round(amount * rate * 100) / 100 : null,
      localCurrency: useLocal ? localCurr : null,
      interchangeFee,
      status,
      type,
      corridor,
      createdAt: createdDate.toISOString(),
    }).run();
  }

  // Seed FX Transactions (~40)
  const fxCorridorConfig: Record<string, { from: string; to: string; midRate: number; spreadRange: [number, number] }> = {
    "US→AR": { from: "USD", to: "ARS", midRate: 900, spreadRange: [120, 200] },
    "US→MX": { from: "USD", to: "MXN", midRate: 17.5, spreadRange: [60, 120] },
    "US→PL": { from: "USD", to: "PLN", midRate: 4.05, spreadRange: [50, 90] },
    "US→VN": { from: "USD", to: "VND", midRate: 25300, spreadRange: [100, 180] },
    "US→RO": { from: "USD", to: "RON", midRate: 4.65, spreadRange: [50, 100] },
    "US→PH": { from: "USD", to: "PHP", midRate: 56.5, spreadRange: [100, 170] },
    "US→BR": { from: "USD", to: "BRL", midRate: 5.10, spreadRange: [80, 150] },
    "US→CO": { from: "USD", to: "COP", midRate: 4150, spreadRange: [110, 190] },
    "US→IN": { from: "USD", to: "INR", midRate: 83.5, spreadRange: [70, 130] },
  };
  const fxDirections = ["inbound", "outbound"];

  for (let i = 0; i < 40; i++) {
    const corridor = corridors[i % corridors.length];
    const config = fxCorridorConfig[corridor];
    const direction = fxDirections[i % 2];
    const amount = Math.round((2000 + Math.random() * 45000) * 100) / 100;
    const spreadBps = config.spreadRange[0] + Math.random() * (config.spreadRange[1] - config.spreadRange[0]);
    const roundedSpreadBps = Math.round(spreadBps * 10) / 10;
    const spreadPct = roundedSpreadBps / 10000;
    const atlasRate = direction === "outbound"
      ? config.midRate * (1 + spreadPct)
      : config.midRate * (1 - spreadPct);
    const spreadRevenue = Math.round(amount * spreadPct * 100) / 100;
    const daysAgo = Math.floor(Math.random() * 30);
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - daysAgo);

    db.insert(fxTransactions).values({
      transactionId: (i % 55) + 1,
      corridor,
      direction,
      fromCurrency: config.from,
      toCurrency: config.to,
      amount,
      midMarketRate: config.midRate,
      atlasRate: Math.round(atlasRate * 100) / 100,
      spreadBps: roundedSpreadBps,
      spreadRevenue,
      createdAt: createdDate.toISOString(),
    }).run();
  }

  // Seed ERP Connections (~8)
  const erpSystems = ["quickbooks", "xero", "netsuite", "sage"];
  const erpStatuses = ["connected", "connected", "connected", "connected", "connected", "syncing", "error", "connected"];
  const erpClientIds = [1, 2, 3, 5, 8, 12, 13, 15];

  for (let i = 0; i < 8; i++) {
    const daysAgo = Math.floor(Math.random() * 5);
    const syncDate = new Date();
    syncDate.setDate(syncDate.getDate() - daysAgo);
    syncDate.setHours(syncDate.getHours() - Math.floor(Math.random() * 24));

    db.insert(erpConnections).values({
      clientId: erpClientIds[i],
      erpSystem: erpSystems[i % erpSystems.length],
      status: erpStatuses[i],
      lastSyncAt: syncDate.toISOString(),
      recordsSynced: 50 + Math.floor(Math.random() * 450),
      matchRate: 85 + Math.round(Math.random() * 14 * 10) / 10,
      createdAt: new Date(Date.now() - (30 + Math.floor(Math.random() * 60)) * 24 * 60 * 60 * 1000).toISOString(),
    }).run();
  }

  // Seed Reconciliation Records (~50)
  const reconStatuses = [
    "matched", "matched", "matched", "matched", "matched", "matched",
    "unmatched", "unmatched",
    "discrepancy", "discrepancy",
    "pending_review",
    "resolved",
  ];
  const recordTypes = ["invoice", "payment", "journal_entry", "credit_note"];
  const erpRefPrefixes: Record<string, string> = {
    quickbooks: "QBO", xero: "XRO", netsuite: "NS", sage: "SGE",
  };
  const syncDirections = ["atlas_to_erp", "erp_to_atlas", "bidirectional"];

  for (let i = 0; i < 50; i++) {
    const erpIdx = i % 8;
    const clientId = erpClientIds[erpIdx];
    const erpSystem = erpSystems[erpIdx % erpSystems.length];
    const status = reconStatuses[i % reconStatuses.length];
    const recordType = recordTypes[i % recordTypes.length];
    const atlasAmount = Math.round((500 + Math.random() * 80000) * 100) / 100;
    const isMatched = status === "matched" || status === "resolved";
    const isDiscrepancy = status === "discrepancy";
    const isUnmatched = status === "unmatched";
    const discrepancy = isDiscrepancy ? Math.round((50 + Math.random() * 4950) * 100) / 100 : isUnmatched ? atlasAmount : null;
    const erpAmount = isMatched ? atlasAmount : isDiscrepancy ? atlasAmount - (discrepancy || 0) : null;
    const erpRef = isUnmatched ? null : `${erpRefPrefixes[erpSystem]}-${String(10000 + Math.floor(Math.random() * 90000))}`;
    const refPrefix = recordType === "invoice" ? "INV" : recordType === "payment" ? "PAY" : recordType === "journal_entry" ? "JE" : "CN";
    const daysAgo = Math.floor(Math.random() * 30);
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - daysAgo);

    db.insert(reconciliations).values({
      clientId,
      erpSystem,
      syncDirection: syncDirections[i % syncDirections.length],
      recordType,
      atlasRef: `${refPrefix}-2026${String(i + 1).padStart(4, "0")}`,
      erpRef,
      atlasAmount,
      erpAmount,
      currency: "USD",
      status,
      discrepancyAmount: discrepancy,
      resolvedAt: status === "resolved" ? new Date(Date.now() - Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000).toISOString() : null,
      createdAt: createdDate.toISOString(),
    }).run();
  }
}
