import { useEffect, useState } from "react";
import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ActionRail } from "@/components/ActionRail";
import Dashboard from "@/pages/dashboard";
import Invoices from "@/pages/invoices";
import CreditAgent from "@/pages/credit-agent";
import TreasuryPage from "@/pages/treasury";
import CardsPage from "@/pages/cards";
import FxPage from "@/pages/fx";
import AnalyticsPage from "@/pages/analytics";
import Compliance from "@/pages/compliance";
import ReconciliationPage from "@/pages/reconciliation";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";
import EngineRoom from "@/pages/engine-room";


function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/invoices" component={Invoices} />
      <Route path="/credit" component={CreditAgent} />
      <Route path="/treasury" component={TreasuryPage} />
      <Route path="/cards" component={CardsPage} />
      <Route path="/fx" component={FxPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/compliance" component={Compliance} />
      <Route path="/reconciliation" component={ReconciliationPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/engine-room/" component={EngineRoom} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppShell() {
  const [location] = useHashLocation();
  // Default the Action Rail to collapsed on small screens (matching Tailwind's
  // lg breakpoint at 1024px). On desktop the rail is open by default for the
  // "recommendations on entry" experience; on mobile we keep the dashboard
  // unobstructed and let users tap the floating Sparkles button to open it.
  const [railCollapsed, setRailCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 1023px)").matches;
  });
  // If the user resizes across the breakpoint, collapse on mobile to avoid
  // a permanently-open drawer covering the page after a rotation.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setRailCollapsed(true);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const isEngineRoom = location.startsWith("/engine-room");

  if (isEngineRoom) {
    // Engine Room is an internal/ops surface — full-bleed, no sidebar/rail.
    return (
      <main className="min-h-screen w-full overflow-y-auto">
        <AppRouter />
      </main>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center gap-2 p-2 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <span className="text-xs text-muted-foreground">
              Atlas · Financial OS · V3 Preview
            </span>
          </header>
          <div className="flex flex-1 min-h-0">
            <main className="flex-1 overflow-y-auto">
              <AppRouter />
            </main>
            <ActionRail
              collapsed={railCollapsed}
              onToggle={() => setRailCollapsed((v) => !v)}
            />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router hook={useHashLocation}>
          <AppShell />
        </Router>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
