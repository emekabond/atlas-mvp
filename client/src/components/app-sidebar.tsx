import { useState, useEffect } from "react";
import { LayoutDashboard, FileText, Brain, Landmark, CreditCard, ArrowLeftRight, BarChart3, Shield, GitCompareArrows, Settings } from "lucide-react";
import { Link } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Invoices", url: "/invoices", icon: FileText },
  { title: "Credit Agent", url: "/credit", icon: Brain },
  { title: "Treasury Agent", url: "/treasury", icon: Landmark },
  { title: "Cards", url: "/cards", icon: CreditCard },
  { title: "FX", url: "/fx", icon: ArrowLeftRight },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Compliance Agent", url: "/compliance", icon: Shield },
  { title: "Recon Agent", url: "/reconciliation", icon: GitCompareArrows },
  { title: "Settings", url: "/settings", icon: Settings },
];

function AtlasLogo() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Atlas Logo"
    >
      {/* Geometric "A" shape - teal accent, Rand-inspired minimal */}
      <path
        d="M16 2L4 28h5.5l2.5-5.5h8l2.5 5.5H28L16 2z"
        fill="hsl(199 89% 48%)"
        opacity="0.9"
      />
      <path
        d="M13.5 18.5L16 8l2.5 10.5h-5z"
        fill="hsl(222 47% 11%)"
      />
      {/* Small accent bar */}
      <rect x="11" y="24" width="10" height="2" rx="1" fill="hsl(199 89% 48%)" opacity="0.5" />
    </svg>
  );
}

function useHashPath() {
  const [path, setPath] = useState(() => window.location.hash.replace("#", "") || "/");
  useEffect(() => {
    const handler = () => setPath(window.location.hash.replace("#", "") || "/");
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  return path;
}

export function AppSidebar() {
  const location = useHashPath();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 pb-2">
        <Link href="/" className="flex items-center gap-3" data-testid="link-logo">
          <AtlasLogo />
          <div>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              Atlas
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-sidebar-foreground/50 leading-none mt-0.5">
              Financial OS
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 pt-2">
        <div className="text-[10px] text-sidebar-foreground/40 leading-relaxed">
          <div>Atlas v0.1.0 MVP</div>
          <div>Bridge + Circle + Lead Bank</div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
