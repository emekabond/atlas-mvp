import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  Brain,
  Landmark,
  CreditCard,
  ArrowLeftRight,
  BarChart3,
  Shield,
  GitCompareArrows,
  Settings,
  CogIcon,
  Wallet,
} from "lucide-react";
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

type NavItem = { title: string; url: string; icon: any };

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [{ title: "Financial OS", url: "/", icon: LayoutDashboard }],
  },
  {
    label: "Liquidity",
    items: [
      { title: "Balances", url: "/treasury", icon: Wallet },
      { title: "FX", url: "/fx", icon: ArrowLeftRight },
    ],
  },
  {
    label: "Receivables",
    items: [{ title: "Invoices & Factoring", url: "/invoices", icon: FileText }],
  },
  {
    label: "Credit",
    items: [{ title: "Facilities & RBF", url: "/credit", icon: Brain }],
  },
  {
    label: "Treasury",
    items: [{ title: "Positions & Sweeps", url: "/treasury", icon: Landmark }],
  },
  {
    label: "Spend",
    items: [{ title: "Cards", url: "/cards", icon: CreditCard }],
  },
  {
    label: "Operations",
    items: [
      { title: "Reconciliation", url: "/reconciliation", icon: GitCompareArrows },
      { title: "Compliance", url: "/compliance", icon: Shield },
      { title: "Analytics", url: "/analytics", icon: BarChart3 },
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
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
      <path
        d="M16 2L4 28h5.5l2.5-5.5h8l2.5 5.5H28L16 2z"
        fill="hsl(199 89% 48%)"
        opacity="0.9"
      />
      <path d="M13.5 18.5L16 8l2.5 10.5h-5z" fill="hsl(222 47% 11%)" />
      <rect
        x="11"
        y="24"
        width="10"
        height="2"
        rx="1"
        fill="hsl(199 89% 48%)"
        opacity="0.5"
      />
    </svg>
  );
}

function useHashPath() {
  const [path, setPath] = useState(
    () => window.location.hash.replace("#", "") || "/"
  );
  useEffect(() => {
    const handler = () =>
      setPath(window.location.hash.replace("#", "") || "/");
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
            <span
              className="text-lg font-bold tracking-tight"
              style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
            >
              Atlas
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-sidebar-foreground/50 leading-none mt-0.5">
              Financial OS · V3
            </span>
          </div>
        </Link>
        <div className="mt-3 rounded-md border border-sidebar-border bg-sidebar-accent/40 px-2.5 py-2">
          <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/40">
            Workspace
          </div>
          <div
            className="mt-0.5 text-[13px] font-medium text-sidebar-foreground"
            data-testid="tenant-chip-sidebar"
          >
            Meridian Software
          </div>
          <div className="text-[10px] text-sidebar-foreground/60">
            US → AR · Facility live · $18M
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    location === item.url ||
                    (item.url !== "/" && location.startsWith(item.url));
                  return (
                    <SidebarMenuItem key={item.title + item.url}>
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
        ))}
      </SidebarContent>
      <SidebarFooter className="p-3 pt-2">
        <Link
          href="/engine-room/"
          className="flex items-center justify-between rounded-md border border-sidebar-border/60 px-2.5 py-2 hover:border-sidebar-primary/50 hover:bg-sidebar-accent/40 transition"
          data-testid="nav-engine-room"
        >
          <div className="flex items-center gap-2">
            <CogIcon className="h-3.5 w-3.5 text-sidebar-primary" />
            <span className="text-[11px] font-medium text-sidebar-foreground">
              Engine Room
            </span>
          </div>
          <span className="text-[9px] uppercase tracking-widest text-sidebar-foreground/50">
            Internal
          </span>
        </Link>
        <div className="mt-2 text-[10px] text-sidebar-foreground/40 leading-relaxed">
          <div>Atlas V3 · AI Credit OS</div>
          <div>Invisible rails: Lead Bank · Bridge · Circle · Rain</div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
