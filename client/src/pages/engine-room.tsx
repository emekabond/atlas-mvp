import React from "react";


function EngineRoom() {
  return (
    <div className="min-h-screen bg-black text-slate-100">
      {/* Debug banner to confirm routing works */}
      <div className="w-full bg-black text-lime-400 px-4 py-3 text-sm">
        <strong>Engine Room loaded</strong> – if you see this, the route is wired correctly.
      </div>

      {/* Page shell */}
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-white">
                Atlas Engine Room
              </h1>
              <p className="mt-1 text-sm text-slate-300 max-w-xl">
                The underlying rails and autonomous agents that actually move
                dollars, data, and decisions across the Atlas OS – safely,
                programmatically, and at scale.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/40">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Engine Room online</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              <span>Hybrid rails: cards, accounts, ledgers, messaging, custody</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span>Autonomous agents: credit, compliance, fraud, treasury, reconciliation </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
              <span>Revenue flywheel: credit, margin, float, interchange, SaaS</span>
            </div>
          </div>
        </header>

        {/* Three-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Hybrid Rails */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
              Hybrid rails
            </h2>
            <p className="text-xs text-slate-300">
              Atlas abstracts messy, multi‑party infrastructure into clean,
              programmable rails you can compose like Lego: fiat, stablecoins,
              stored‑value, and messaging all live in one coherent surface.
            </p>

            <div className="space-y-3">
              {/* Card program */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-100">
                    Card + account program
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30">
                    Onboarded
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  BIN sponsorship, issuing, and accounts unified behind a single
                  Atlas API so engineers never think in “processors,” only in
                  customers, balances, and entitlements.
                </p>
                <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                  <li>Issue cards and accounts per workspace and sub‑entity</li>
                  <li>Program fees, limits, and controls at the rail level</li>
                  <li>Expose only safe, productized operations to the OS</li>
                </ul>
              </div>

              {/* Ledger & balances */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-100">
                    Unified ledger & balances
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    Strongly typed
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  A single source of truth for money in motion – every rail,
                  every counterparty, every edge case reconciled back to the
                  same ledger primitives.
                </p>
                <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                  <li>Multi‑currency, multi‑entity, multi‑rail balances</li>
                  <li>Explicit states, not stringly‑typed status fields</li>
                  <li>Designed for financial correctness from day one</li>
                </ul>
              </div>

              {/* Messaging & workflows */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-100">
                    Messaging & workflow bus
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    Orchestrated
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  A deterministic event bus that turns raw bank files, card
                  auths, ledger updates, and third‑party signals into clean
                  events the OS and agents can reason about.
                </p>
                <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                  <li>Normalizes bank, card, and crypto semantics</li>
                  <li>Guaranteed ordering for flows that must never race</li>
                  <li>Replayable for audits, debugging, and forensics</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Column 2: Autonomous Agents */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
              Autonomous agents
            </h2>
            <p className="text-xs text-slate-300">
              On top of those rails, Atlas runs a fleet of narrow, aligned
              agents that each own a small, critical responsibility – from KYC
              to credit to treasury – with humans firmly in the loop.
            </p>

                      <div className="space-y-3">
            {/* Credit Agent */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-slate-100">
        Credit Agent
      </span>
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
        Revenue engine
      </span>
    </div>
    <p className="text-[11px] text-slate-300">
      Orchestrates invoice factoring, revenue-based financing, working
      capital lines, and bridge loans on top of Atlas rails and data.
      It prices risk using closed-loop cash flow and behavior data
      across all corridors and products.
    </p>
    <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
      <li>Underwrites off real-time invoices, receivables, and flows</li>
      <li>Structures credit terms and limits per customer and corridor</li>
      <li>Feeds live performance back into pricing and eligibility</li>
    </ul>
  </div>

  {/* Onboarding Agent */}
  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-slate-100">
        Onboarding Agent
      </span>
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30">
        Speed focused
      </span>
    </div>
    <p className="text-[11px] text-slate-300">
      Primary interface with customers, driving them from “hello” to
      “account active” as fast as possible while collecting the data
      the Engine Room needs.
    </p>
    <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
      <li>Coordinates applications, docs, and required checks</li>
      <li>Optimizes for completion rate and time-to-first-transaction</li>
      <li>Hands off clean profiles to Compliance and Credit agents</li>
    </ul>
  </div>

              {/* Compliance Agent */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-100">
                    Compliance Agent
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    Guardrailed
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Automates most KYC / KYB decisions and ongoing monitoring decisions while escalating edge
                  cases, keeping operators in control and regulators
                  comfortable.
                </p>
                <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                  <li>Pulls from multiple KYC/KYB providers</li>
                  <li>Writes back structured risk decisions to the OS</li>
                  <li>Surfaces only the exceptions to humans</li>
                </ul>
              </div>

              {/* Fraud / Risk Agent */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-100">
                    Fraud and Risk Agent
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30">
                    Protective
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Monitors transactions, behaviors, and counterparties in
                  real‑time, and suggests interventions instead of quietly
                  blocking good customers.
                </p>
                <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                  <li>Continuous scoring from ledger + network data</li>
                  <li>Configurable risk appetites per workspace</li>
                  <li>Explains “why” for every suggested action</li>
                </ul>
              </div>

              {/* Treasury / Liquidity Agent */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-100">
                    Treasury & Liquidity Agent
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30">
                    Capital aware
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Keeps float safe and productive: moving funds between partners,
                  accounts, and instruments in line with policy and constraints.
                </p>
                <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                  <li>Understands operational, regulatory, and economic limits</li>
                  <li>Targets utilization, not just “max yield”</li>
                  <li>Surfaces playbook‑grade recommendations to finance teams</li>
                </ul>
              </div>

              {/* Reconciliation Agent */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-100">
                    Reconciliation & Reporting Agent
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/30">
                    Audit ready
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Continuously ties Atlas’s internal view back to bank, card,
                  and custodial records so CFOs, auditors, and regulators can
                  trust every number.
                </p>
                <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                  <li>Automated variance detection and explanations</li>
                  <li>Drill‑downs from OS screens to source events</li>
                  <li>Exportable evidence for audits and board packs</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Column 3: Revenue Flywheel */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
              Revenue Flywheel
            </h2>
            <p className="text-xs text-slate-300">
              The Engine Room doesn’t just keep the machine running – it drives
              margin. Atlas is built so every useful workflow, especially credit and financing, can attach to one
              of a few durable monetization primitives.
            </p>

            <div className="space-y-3">
                {/* Origination & financing fees */}
<div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-2">
  <div className="flex items-center justify-between">
    <span className="text-xs font-medium text-slate-100">
      Origination & financing fees
    </span>
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
      Credit revenue
    </span>
  </div>
  <p className="text-[11px] text-slate-300">
    Atlas earns upfront origination fees and ongoing yield or
    revenue-share on invoice factoring, revenue-based financing,
    working capital, and bridge facilities originated through the OS.
  </p>
  <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
    <li>Tied directly to closed-loop data from the Engine Room</li>
    <li>Improves with each cohort of borrowers and performance data</li>
    <li>Stacks on top of existing payments and FX economics</li>
  </ul>
</div>

              {/* Margin on flows */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-100">
                    Margin on money in motion
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    Core flywheel
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Interchange, FX spread, payment fees, and yield on safe
                  instruments – concentrated into a clean, auditable engine
                  rather than one‑off deals per customer.
                </p>
                <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                  <li>Standardized economics across use cases</li>
                  <li>Portfolio‑level optimization, not account by account</li>
                  <li>Clear unit economics from day one</li>
                </ul>
              </div>

              {/* SaaS + usage */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-100">
                    SaaS + usage layers
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30">
                    Durable
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Workspaces pay for the OS, not just the rails – giving Atlas
                  a software‑like multiple on top of financial infrastructure
                  economics.
                </p>
                <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                  <li>Per‑workspace and per‑seat plans</li>
                  <li>Usage‑based pricing for high‑value workflows</li>
                  <li>Room for premium “agent packs” over time</li>
                </ul>
              </div>

              {/* Partner leverage */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-100">
                    Partner leverage
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    Distribution
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  By abstracting partners behind the Engine Room, Atlas can add
                  new rails and geographies without re‑architecting the product
                  or confusing customers.
                </p>
                <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                  <li>Swap or add partners without UI churn</li>
                  <li>Negotiate from a portfolio, not single‑customer, view</li>
                  <li>Share upside where it enhances distribution</li>
                </ul>
              </div>

              {/* Strategic metrics */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-100">
                    Strategic metrics
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/30">
                    Board‑grade
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  The same plumbing that powers customers also powers Atlas’s
                  own brain: LTV/CAC, payback, contribution margin by rail and
                  by segment.
                </p>
                <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                  <li>Financial and product metrics from the same source</li>
                  <li>Supports credible venture‑scale underwriting</li>
                  <li>Makes “Engine Room” legible to investors and regulators</li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Footer back link */}
        <div className="pt-2 border-t border-slate-800 mt-4">
          <a
            href="/"
            className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white underline underline-offset-4"
          >
            <span>← Back to Atlas Operator OS</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default EngineRoom;
