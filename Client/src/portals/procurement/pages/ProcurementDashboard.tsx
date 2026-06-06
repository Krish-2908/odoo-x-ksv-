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
  BarChart3,
  Clock,
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
  { label: "Reports", path: "/procurement/reports" },
];

const QUICK_ACTIONS = [
  { icon: Plus, label: "Create RFQ", desc: "Request quotations from registered vendors" },
  { icon: Building2, label: "Browse Vendors", desc: "View and filter the vendor directory" },
  { icon: ArrowLeftRight, label: "Compare Quotes", desc: "Side-by-side quotation comparison" },
  { icon: ShoppingCart, label: "Generate PO", desc: "Create a purchase order from an approved quote" },
  { icon: BarChart3, label: "Spend Analytics", desc: "Category-wise spend reports and trends" },
  { icon: CheckCircle, label: "Approval Status", desc: "Track submitted approvals and outcomes" },
];

export default function ProcurementDashboard() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  // Metrics
  const [activeRfqsCount, setActiveRfqsCount] = useState(0);
  const [totalVendorsCount, setTotalVendorsCount] = useState(0);

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
      // Fetch RFQs
      const rfqRes = await fetch("http://localhost:8000/api/rfqs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rfqData = await rfqRes.json();
      if (rfqRes.status === 200 && rfqData.success) {
        const openCount = rfqData.rfqs.filter((r: any) => r.status === "Open").length;
        setActiveRfqsCount(openCount);
      }

      // Fetch Vendors
      const vendorRes = await fetch("http://localhost:8000/api/vendors", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const vendorData = await vendorRes.json();
      if (vendorRes.status === 200 && vendorData.success) {
        setTotalVendorsCount(vendorData.vendors.length);
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
    } else if (label === "Browse RFQs" || label === "View RFQs") {
      navigate("/procurement/rfqs");
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
      value: "0",
      sub: "Submitted for review",
      icon: CheckCircle,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
    {
      label: "Purchase Orders",
      value: "0",
      sub: "Generated this month",
      icon: ShoppingCart,
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-100",
    },
  ];

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
          <EmptyState icon={Clock} title="No recent activity" desc="Created RFQs, submitted approvals, and generated POs will appear here." />
          <EmptyState icon={TrendingUp} title="No spend data" desc="Spend summaries and category breakdowns will appear once POs are created." />
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
