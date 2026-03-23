import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  country: text("country").notNull(),
  corridor: text("corridor").notNull(),
  status: text("status").notNull().default("active"), // active, inactive, suspended
  kybStatus: text("kyb_status").notNull().default("pending"), // pending, in_review, approved, rejected
  creditScore: integer("credit_score"),
  creditLimit: real("credit_limit"),
  riskTier: text("risk_tier"), // low, medium, high
});

export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  corridor: text("corridor").notNull(),
  status: text("status").notNull().default("draft"), // draft, sent, factored, settled
  settlementMethod: text("settlement_method"), // USDC, SWIFT
  factoringStatus: text("factoring_status"), // none, eligible, offered, accepted, funded
  dueDate: text("due_date").notNull(),
  createdAt: text("created_at").notNull(),
  description: text("description"),
});

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceId: integer("invoice_id"),
  type: text("type").notNull(), // inbound, outbound, conversion
  amount: real("amount").notNull(),
  currency: text("currency").notNull(),
  fromCurrency: text("from_currency"),
  toCurrency: text("to_currency"),
  status: text("status").notNull(), // completed, pending, processing, failed
  corridor: text("corridor").notNull(),
  settlementTime: integer("settlement_time"), // in hours
  createdAt: text("created_at").notNull(),
});

export const creditAssessments = sqliteTable("credit_assessments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").notNull(),
  score: integer("score").notNull(),
  revenueConsistency: integer("revenue_consistency").notNull(),
  paymentHistory: integer("payment_history").notNull(),
  corridorRisk: integer("corridor_risk").notNull(),
  erpHealth: integer("erp_health").notNull(),
  recommendedLimit: real("recommended_limit").notNull(),
  recommendation: text("recommendation").notNull(), // increase, maintain, flag_review, decrease
  assessedAt: text("assessed_at").notNull(),
});

export const complianceEntities = sqliteTable("compliance_entities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id"),
  entityName: text("entity_name").notNull(),
  jurisdiction: text("jurisdiction").notNull(),
  registrationNumber: text("registration_number").notNull(),
  kybStage: text("kyb_stage").notNull(), // application, document_review, verification, approved, rejected
  documentsJson: text("documents_json"), // JSON string of document checklist
  morStatus: text("mor_status").notNull().default("pending"), // pending, active, expired, suspended
  complianceScore: integer("compliance_score"),
});

export const complianceAlerts = sqliteTable("compliance_alerts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entityId: integer("entity_id").notNull(),
  type: text("type").notNull(), // document_expiry, regulatory_change, flagged_transaction, kyb_update
  severity: text("severity").notNull(), // low, medium, high, critical
  message: text("message").notNull(),
  resolved: integer("resolved", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const rbfFacilities = sqliteTable("rbf_facilities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").notNull(),
  facilityAmount: real("facility_amount").notNull(),
  drawnAmount: real("drawn_amount").notNull().default(0),
  repaidAmount: real("repaid_amount").notNull().default(0),
  revenueSharePct: real("revenue_share_pct").notNull(),
  termMonths: integer("term_months").notNull(),
  status: text("status").notNull(), // active, pending_approval, fully_repaid, defaulted
  monthlyRevenue: real("monthly_revenue"),
  repaymentCap: real("repayment_cap"),
  createdAt: text("created_at").notNull(),
});

export const treasuryPositions = sqliteTable("treasury_positions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  strategyName: text("strategy_name").notNull(),
  protocol: text("protocol").notNull(),
  allocatedAmount: real("allocated_amount").notNull(),
  currentValue: real("current_value").notNull(),
  apy: real("apy").notNull(),
  riskTier: text("risk_tier").notNull(), // conservative, moderate, aggressive
  maturityDate: text("maturity_date"),
  status: text("status").notNull(), // active, maturing, redeemed
  createdAt: text("created_at").notNull(),
});

export const treasurySweeps = sqliteTable("treasury_sweeps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fromAccount: text("from_account").notNull(),
  toStrategy: text("to_strategy").notNull(),
  amount: real("amount").notNull(),
  type: text("type").notNull(), // sweep_in, sweep_out, yield_harvest
  status: text("status").notNull(), // completed, pending, processing
  createdAt: text("created_at").notNull(),
});

export const cards = sqliteTable("cards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").notNull(),
  cardholderName: text("cardholder_name").notNull(),
  last4: text("last4").notNull(),
  cardType: text("card_type").notNull(),
  status: text("status").notNull().default("active"),
  spendLimit: real("spend_limit").notNull(),
  currentSpend: real("current_spend").notNull().default(0),
  currency: text("currency").notNull().default("USD"),
  corridor: text("corridor").notNull(),
  issuedAt: text("issued_at").notNull(),
});

export const cardTransactions = sqliteTable("card_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cardId: integer("card_id").notNull(),
  merchantName: text("merchant_name").notNull(),
  merchantCategory: text("merchant_category").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  localAmount: real("local_amount"),
  localCurrency: text("local_currency"),
  interchangeFee: real("interchange_fee").notNull(),
  status: text("status").notNull(),
  type: text("type").notNull(),
  corridor: text("corridor").notNull(),
  createdAt: text("created_at").notNull(),
});

export const fxTransactions = sqliteTable("fx_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  transactionId: integer("transaction_id"),
  corridor: text("corridor").notNull(),
  direction: text("direction").notNull(),
  fromCurrency: text("from_currency").notNull(),
  toCurrency: text("to_currency").notNull(),
  amount: real("amount").notNull(),
  midMarketRate: real("mid_market_rate").notNull(),
  atlasRate: real("atlas_rate").notNull(),
  spreadBps: real("spread_bps").notNull(),
  spreadRevenue: real("spread_revenue").notNull(),
  createdAt: text("created_at").notNull(),
});

export const reconciliations = sqliteTable("reconciliations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").notNull(),
  erpSystem: text("erp_system").notNull(),
  syncDirection: text("sync_direction").notNull(),
  recordType: text("record_type").notNull(),
  atlasRef: text("atlas_ref").notNull(),
  erpRef: text("erp_ref"),
  atlasAmount: real("atlas_amount").notNull(),
  erpAmount: real("erp_amount"),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull(),
  discrepancyAmount: real("discrepancy_amount"),
  resolvedAt: text("resolved_at"),
  createdAt: text("created_at").notNull(),
});

export const erpConnections = sqliteTable("erp_connections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").notNull(),
  erpSystem: text("erp_system").notNull(),
  status: text("status").notNull(),
  lastSyncAt: text("last_sync_at"),
  recordsSynced: integer("records_synced").notNull().default(0),
  matchRate: real("match_rate"),
  createdAt: text("created_at").notNull(),
});

// Insert schemas
export const insertClientSchema = createInsertSchema(clients).omit({ id: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true });
export const insertCreditAssessmentSchema = createInsertSchema(creditAssessments).omit({ id: true });
export const insertComplianceEntitySchema = createInsertSchema(complianceEntities).omit({ id: true });
export const insertComplianceAlertSchema = createInsertSchema(complianceAlerts).omit({ id: true });
export const insertRbfFacilitySchema = createInsertSchema(rbfFacilities).omit({ id: true });
export const insertTreasuryPositionSchema = createInsertSchema(treasuryPositions).omit({ id: true });
export const insertTreasurySweepSchema = createInsertSchema(treasurySweeps).omit({ id: true });
export const insertCardSchema = createInsertSchema(cards).omit({ id: true });
export const insertCardTransactionSchema = createInsertSchema(cardTransactions).omit({ id: true });
export const insertFxTransactionSchema = createInsertSchema(fxTransactions).omit({ id: true });
export const insertReconciliationSchema = createInsertSchema(reconciliations).omit({ id: true });
export const insertErpConnectionSchema = createInsertSchema(erpConnections).omit({ id: true });

// Types
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type CreditAssessment = typeof creditAssessments.$inferSelect;
export type InsertCreditAssessment = z.infer<typeof insertCreditAssessmentSchema>;
export type ComplianceEntity = typeof complianceEntities.$inferSelect;
export type InsertComplianceEntity = z.infer<typeof insertComplianceEntitySchema>;
export type ComplianceAlert = typeof complianceAlerts.$inferSelect;
export type InsertComplianceAlert = z.infer<typeof insertComplianceAlertSchema>;
export type RbfFacility = typeof rbfFacilities.$inferSelect;
export type InsertRbfFacility = z.infer<typeof insertRbfFacilitySchema>;
export type TreasuryPosition = typeof treasuryPositions.$inferSelect;
export type InsertTreasuryPosition = z.infer<typeof insertTreasuryPositionSchema>;
export type TreasurySweep = typeof treasurySweeps.$inferSelect;
export type InsertTreasurySweep = z.infer<typeof insertTreasurySweepSchema>;
export type Card = typeof cards.$inferSelect;
export type InsertCard = z.infer<typeof insertCardSchema>;
export type CardTransaction = typeof cardTransactions.$inferSelect;
export type InsertCardTransaction = z.infer<typeof insertCardTransactionSchema>;
export type FxTransaction = typeof fxTransactions.$inferSelect;
export type InsertFxTransaction = z.infer<typeof insertFxTransactionSchema>;
export type Reconciliation = typeof reconciliations.$inferSelect;
export type InsertReconciliation = z.infer<typeof insertReconciliationSchema>;
export type ErpConnection = typeof erpConnections.$inferSelect;
export type InsertErpConnection = z.infer<typeof insertErpConnectionSchema>;
