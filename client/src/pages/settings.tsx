import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plug, Globe, Key, Bell, Copy, CheckCircle, XCircle } from "lucide-react";

function IntegrationCard({ integration }: { integration: { name: string; status: string; description: string; lastSync: string } }) {
  const isConnected = integration.status === "connected";
  return (
    <Card data-testid={`card-integration-${integration.name.toLowerCase()}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
              isConnected ? "bg-emerald-500/10" : "bg-red-500/10"
            }`}>
              <Plug className={`h-5 w-5 ${isConnected ? "text-emerald-500" : "text-red-500"}`} />
            </div>
            <div>
              <p className="font-semibold text-sm">{integration.name}</p>
              <p className="text-xs text-muted-foreground">{integration.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {isConnected ? (
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-xs font-medium ${isConnected ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-muted-foreground">Last sync: {integration.lastSync}</span>
          <Button variant="outline" size="sm" data-testid={`button-configure-${integration.name.toLowerCase()}`}>
            Configure
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ApiKeyRow({ label, value }: { label: string; value: string }) {
  const { toast } = useToast();
  const masked = value.slice(0, 8) + "•".repeat(24) + value.slice(-4);

  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground font-mono">{masked}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-8"
        onClick={() => {
          toast({ title: "Copied to clipboard", description: `${label} has been copied.` });
        }}
        data-testid={`button-copy-${label.toLowerCase().replace(/\s+/g, "-")}`}
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();

  const { data: integrations, isLoading } = useQuery<Array<{
    name: string; status: string; description: string; lastSync: string;
  }>>({ queryKey: ["/api/settings/integrations"] });

  const [notifications, setNotifications] = useState({
    invoiceUpdates: true,
    creditAlerts: true,
    complianceAlerts: true,
    settlementConfirmations: true,
    weeklyDigest: false,
  });

  const corridors = [
    { name: "US → Argentina", code: "US→AR", enabled: true, fee: "6.5%" },
    { name: "US → Mexico", code: "US→MX", enabled: true, fee: "5.8%" },
    { name: "US → Poland", code: "US→PL", enabled: true, fee: "4.2%" },
    { name: "US → Vietnam", code: "US→VN", enabled: true, fee: "7.1%" },
    { name: "US → Romania", code: "US→RO", enabled: true, fee: "4.8%" },
    { name: "US → Philippines", code: "US→PH", enabled: true, fee: "6.5%" },
    { name: "US → Brazil", code: "US→BR", enabled: true, fee: "5.9%" },
    { name: "US → Colombia", code: "US→CO", enabled: true, fee: "6.2%" },
    { name: "US → India", code: "US→IN", enabled: true, fee: "5.5%" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1000px] mx-auto">
      <div>
        <h1 className="text-xl font-bold" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }} data-testid="text-page-title">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configuration, integrations, and preferences</p>
      </div>

      {/* Profile Section */}
      <Card data-testid="card-profile">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Company Profile</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Company Name</Label>
              <Input defaultValue="Atlas Financial Technologies" data-testid="input-company-name" />
            </div>
            <div>
              <Label className="text-xs">Admin Email</Label>
              <Input defaultValue="admin@atlasfintech.io" data-testid="input-admin-email" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Business Type</Label>
              <Input defaultValue="Financial Operating System" disabled />
            </div>
            <div>
              <Label className="text-xs">License</Label>
              <Input defaultValue="MSB / MTA (Pending)" disabled />
            </div>
          </div>
          <Button size="sm" data-testid="button-save-profile" onClick={() => toast({ title: "Profile saved" })}>
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Integration Status */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Plug className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Integration Status</h2>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(integrations || []).map((i) => (
              <IntegrationCard key={i.name} integration={i} />
            ))}
          </div>
        )}
      </div>

      {/* Corridor Configuration */}
      <Card data-testid="card-corridors">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Corridor Configuration</CardTitle>
          </div>
          <CardDescription className="text-xs">Enable or disable payment corridors and set fee rates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {corridors.map((c) => (
            <div key={c.code} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0" data-testid={`corridor-${c.code}`}>
              <div className="flex items-center gap-3">
                <Switch defaultChecked={c.enabled} data-testid={`switch-corridor-${c.code}`} />
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.code}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold tabular-nums">{c.fee}</p>
                <p className="text-xs text-muted-foreground">take rate</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card data-testid="card-api-keys">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">API Keys</CardTitle>
          </div>
          <CardDescription className="text-xs">Manage API access credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <ApiKeyRow label="Live API Key" value="sk_live_atlas_8f3k2j1h5g6d9a7b4c0e" />
          <Separator />
          <ApiKeyRow label="Test API Key" value="sk_test_atlas_2m7n4p8q1r6s3t0u5v9w" />
          <Separator />
          <ApiKeyRow label="Webhook Secret" value="whsec_atlas_k9j8h7g6f5d4s3a2p1o0" />
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card data-testid="card-notifications">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Notification Preferences</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: "invoiceUpdates", label: "Invoice Updates", desc: "Notifications when invoices are paid or factored" },
            { key: "creditAlerts", label: "Credit Alerts", desc: "Alerts when credit scores change significantly" },
            { key: "complianceAlerts", label: "Compliance Alerts", desc: "KYB updates and regulatory notifications" },
            { key: "settlementConfirmations", label: "Settlement Confirmations", desc: "Confirmation when settlements complete" },
            { key: "weeklyDigest", label: "Weekly Digest", desc: "Summary of all activity each week" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={notifications[item.key as keyof typeof notifications]}
                onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                data-testid={`switch-${item.key}`}
              />
            </div>
          ))}
        </CardContent>
      </Card>
</div>
  );
}
