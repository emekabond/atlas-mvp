import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router hook={useHashLocation}>
          <SidebarProvider>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 min-w-0">
                <header className="flex items-center gap-2 p-2 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <span className="text-xs text-muted-foreground">Atlas Financial OS</span>
                </header>
                <main className="flex-1 overflow-y-auto">
                  <AppRouter />
                </main>
              </div>
            </div>
          </SidebarProvider>
        </Router>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
