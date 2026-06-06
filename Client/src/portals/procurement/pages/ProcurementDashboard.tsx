import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar, { type NavItem } from "@/components/shared/Navbar";
import {
  FileText,
  Users,
  CheckCircle,
  ShoppingCart,
  Plus,
  Building2,
  ArrowLeftRight,
  TrendingUp,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/procurement", active: true },
  { label: "Vendors", path: "/procurement/vendors" },
  { label: "RFQs", path: "/procurement/rfqs" },
  { label: "Quotations", path: "/procurement/quotations" },
  { label: "Purchase Orders", path: "/procurement/purchase-orders" },
  { label: "Invoices", path: "/procurement/invoices" },
  { label: "Reports", path: "/procurement/reports" },
];

const QUICK_ACTIONS = [
  { icon: Plus, label: "Create RFQ", desc: "Request quotations from registered vendors" },
  { icon: Building2, label: "Browse Vendors", desc: "View and filter the vendor directory" },
  { icon: ArrowLeftRight, label: "Compare Quotes", desc: "Side-by-side quotation comparison" },
  { icon: ShoppingCart, label: "Generate PO", desc: "Create a purchase order from an approved quote" },
  { icon: FileText, label: "View Invoices", desc: "Track billing and Razorpay payment history" },
  { icon: CheckCircle, label: "Approval Status", desc: "Track submitted approvals and outcomes" },
];

export default function ProcurementDashboard() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  // Metrics
  const [activeRfqsCount, setActiveRfqsCount] = useState(0);
  const [totalVendorsCount, setTotalVendorsCount] = useState(0);
  const [awaitingApprovalCount, setAwaitingApprovalCount] = useState(0);
  const [totalPOsCount, setTotalPOsCount] = useState(0);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!token || !storedUser) {
      navigate("/login");
      return;
    }
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed.role !== "Procurement Officer") {
        navigate("/");
        return;
      }
      setUser(parsed);
      fetchDashboardMetrics(token);
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const fetchDashboardMetrics = async (token: string) => {
    try {
      // Fetch Analytics
      const analyticsRes = await fetch("http://localhost:8000/api/analytics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const analyticsData = await analyticsRes.json();
      if (analyticsData.success) {
        setAnalytics(analyticsData);
        setActiveRfqsCount(analyticsData.metrics.openRFQs);
        setTotalVendorsCount(analyticsData.metrics.totalVendors);
        setAwaitingApprovalCount(analyticsData.metrics.reviewRFQs);
      }

      // Fetch POs
      const poRes = await fetch("http://localhost:8000/api/purchase-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const poData = await poRes.json();
      if (poRes.ok && poData.success) {
        setTotalPOsCount(poData.purchaseOrders.length);
      }
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    }
  };

  const handleNavbarNavigate = (item: NavItem) => {
    if (item.path) navigate(item.path);
  };

  const handleQuickAction = (label: string) => {
    if (label === "Create RFQ") {
      navigate("/procurement/rfqs/new");
    } else if (
      label === "Browse RFQs" ||
      label === "View RFQs" ||
      label === "Compare Quotes" ||
      label === "Generate PO" ||
      label === "Approval Status"
    ) {
      navigate("/procurement/rfqs");
    } else if (label === "Browse Vendors") {
      navigate("/procurement/vendors");
    } else if (label === "View Invoices") {
      navigate("/procurement/invoices");
    } else {
      alert(`The "${label}" feature will be wired in the upcoming workflow stages.`);
    }
  };

  if (!user) return <LoadingScreen />;

  const kpiCards = [
    {
      label: "Active RFQs",
      value: activeRfqsCount.toString(),
      sub: `${activeRfqsCount} open requests for bids`,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      label: "Vendors Registered",
      value: totalVendorsCount.toString(),
      sub: "Active in system directory",
      icon: Users,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      label: "Awaiting Approval",
      value: awaitingApprovalCount.toString(),
      sub: `${awaitingApprovalCount} RFQs under review`,
      icon: CheckCircle,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
    {
      label: "Purchase Orders",
      value: totalPOsCount.toString(),
      sub: `${totalPOsCount} POs processed`,
      icon: ShoppingCart,
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-100",
    },
  ];

  const spendByMonth = analytics?.spendByMonth || [];
  const spendByCategory = analytics?.spendByCategory || [];
  const maxMonthAmount = spendByMonth.length > 0 ? Math.max(...spendByMonth.map((d: any) => d.amount)) : 1000;
  const totalCategorySpend = spendByCategory.reduce((sum: number, c: any) => sum + c.value, 0) || 1;

  const CATEGORY_COLORS = ["#3b82f6", "#10b981", "#f97316", "#8b5cf6", "#ec4899", "#f59e0b"];

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Navbar user={user} navItems={NAV_ITEMS} onNavigate={handleNavbarNavigate} />

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-5 py-8 space-y-7">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <Briefcase size={11} /> Procurement Portal
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Welcome back, {user.firstName} 👋
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage your RFQs, quotations, and purchase orders.
            </p>
          </div>
          <Button
            onClick={() => navigate("/procurement/rfqs/new")}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm h-8 px-3 gap-1.5 shadow-sm self-start sm:self-auto"
          >
            <Plus size={14} /> New RFQ
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map(({ label, value, sub, icon: Icon, color, bg, border }) => (
            <div key={label} className={`bg-white border ${border} rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">{label}</span>
                <div className={`h-9 w-9 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon size={18} className={color} />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Quick Actions</h2>
            <span className="text-xs text-gray-400">Procurement workflow shortcuts</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {QUICK_ACTIONS.map(({ label, icon: Icon, desc }) => (
              <button
                key={label}
                onClick={() => handleQuickAction(label)}
                className="group flex items-start gap-3 p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left"
              >
                <div className="h-9 w-9 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors shrink-0">
                  <Icon size={17} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{label}</div>
                  <div className="text-xs text-gray-400 mt-0.5 leading-snug">{desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spend Trend Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Expenditure Trend Overview</h3>
                <p className="text-xs text-gray-400">Monthly cleared purchase settlements</p>
              </div>
              <button
                onClick={() => navigate("/procurement/reports")}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
              >
                Full Analytics Report &rarr;
              </button>
            </div>

            {spendByMonth.length === 0 ? (
              <EmptyState icon={TrendingUp} title="No spend data" desc="Spend trend will show once purchase orders are settled." />
            ) : (
              <div className="h-44 flex items-end justify-between gap-1.5 border-b border-gray-100 pb-2 pt-4">
                {spendByMonth.slice(-6).map((item: any) => {
                  const pct = (item.amount / maxMonthAmount) * 100;
                  return (
                    <div key={item.month} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                      <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[9px] py-0.5 px-1.5 rounded pointer-events-none whitespace-nowrap z-10 shadow">
                        ${item.amount.toLocaleString()}
                      </div>
                      <div
                        style={{ height: `${pct || 5}%` }}
                        className="w-full max-w-[28px] rounded-t bg-gradient-to-t from-blue-600 to-indigo-400 group-hover:from-blue-700 group-hover:to-indigo-500 transition-all"
                      />
                      <span className="text-[9px] text-gray-400 mt-1 font-mono">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Spend By Category Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Top Categories Allocation</h3>
                <p className="text-xs text-gray-400">Spend breakdown by supplier sector</p>
              </div>
              <button
                onClick={() => navigate("/procurement/reports")}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
              >
                Full Analytics Report &rarr;
              </button>
            </div>

            {spendByCategory.length === 0 ? (
              <EmptyState icon={Users} title="No category data" desc="Category metrics will build as suppliers receive payments." />
            ) : (
              <div className="space-y-2.5 pt-2">
                {spendByCategory.slice(0, 3).map((item: any, idx: number) => {
                  const pct = (item.value / totalCategorySpend) * 100;
                  const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium text-gray-700">
                        <span className="truncate max-w-[150px]">{item.name}</span>
                        <span>{pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-150 rounded-full overflow-hidden">
                        <div style={{ width: `${pct}%`, backgroundColor: color }} className="h-full rounded-full" />
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">${item.value.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
          <Icon size={22} className="text-gray-400" />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-700">{title}</div>
          <p className="text-xs text-gray-400 mt-0.5 max-w-xs">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <span className="text-sm text-gray-500">Loading Procurement Portal…</span>
      </div>
    </div>
  );
}

function AppFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white py-4">
      <div className="max-w-screen-xl mx-auto px-5 flex items-center justify-between">
        <span className="text-xs text-gray-400">© 2026 VendorBridge · Procurement Portal</span>
        <div className="flex items-center gap-4">
          {["Privacy", "Terms", "Support"].map((link) => (
            <a key={link} href="#" className="text-xs text-gray-400 hover:text-gray-600">{link}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}
