import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar, { type NavItem } from "@/components/shared/Navbar";
import {
  FileText,
  SendHorizontal,
  ShoppingCart,
  CheckCircle,
  Plus,
  Eye,
  Clock,
  TrendingUp,
  Store,
  Edit,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/vendor", active: true },
  { label: "Open RFQs", path: "/vendor/rfqs" },
  { label: "My Quotations", path: "/vendor/quotations" },
  { label: "Purchase Orders", path: "/vendor/purchase-orders" },
  { label: "Invoices", path: "/vendor/invoices" },
  { label: "My Profile", path: "/vendor/profile" },
];

const QUICK_ACTIONS = [
  { icon: Eye, label: "Browse RFQs", desc: "View all open requests for quotation" },
  { icon: Plus, label: "Submit Quotation", desc: "Respond to an RFQ with pricing & timeline" },
  { icon: Edit, label: "Edit Quotation", desc: "Update a previously submitted quotation" },
  { icon: ShoppingCart, label: "View POs", desc: "Track purchase orders received" },
  { icon: FileText, label: "View Invoices", desc: "Track billing statements and payments" },
];

export default function VendorDashboard() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  // Metrics
  const [openRfqsCount, setOpenRfqsCount] = useState(0);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!token || !storedUser) {
      navigate("/login");
      return;
    }
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed.role !== "Vendor") {
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
      // Fetch open RFQs
      const res = await fetch("http://localhost:8000/api/rfqs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.status === 200 && data.success) {
        // Vendor gets only assigned RFQs which are not drafts
        const openCount = data.rfqs.filter((r: any) => r.status === "Open").length;
        setOpenRfqsCount(openCount);
      }

      // Fetch vendor profile
      const profileRes = await fetch("http://localhost:8000/api/vendors/my-profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profileData = await profileRes.json();
      if (profileRes.status === 200 && profileData.success) {
        setProfile(profileData.vendor);
      }
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    }
  };

  const handleNavbarNavigate = (item: NavItem) => {
    if (item.path) navigate(item.path);
  };

  const handleQuickAction = (label: string) => {
    if (label === "Browse RFQs" || label === "Submit Quotation" || label === "Edit Quotation") {
      navigate("/vendor/rfqs");
    } else if (label === "View POs") {
      navigate("/vendor/purchase-orders");
    } else if (label === "View Invoices") {
      navigate("/vendor/invoices");
    } else {
      alert(`The "${label}" feature will be wired in the upcoming workflow stages.`);
    }
  };

  if (!user) return <LoadingScreen />;

  const kpiCards = [
    {
      label: "Open RFQ Invitations",
      value: openRfqsCount.toString(),
      sub: "Awaiting your response",
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      label: "Quotations Submitted",
      value: "0",
      sub: "Across all RFQs",
      icon: SendHorizontal,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      label: "Quotations Selected",
      value: "0",
      sub: "Won bids",
      icon: CheckCircle,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
    {
      label: "Active Purchase Orders",
      value: "0",
      sub: "To be fulfilled",
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
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Store size={11} /> Vendor Portal
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Welcome, {user.firstName} 👋
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Browse open RFQs, submit quotations, and track your purchase orders.
            </p>
          </div>
          <Button
            onClick={() => navigate("/vendor/rfqs")}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm h-8 px-3 gap-1.5 shadow-sm self-start sm:self-auto"
          >
            <Eye size={14} /> Browse RFQs
          </Button>
        </div>

        {/* GSTIN Missing Banner */}
        {profile && !profile.gstNumber && (
          <div className="bg-amber-50/75 border border-amber-250 text-amber-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm text-xs">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-white border border-amber-200 flex items-center justify-center shrink-0">
                <ShieldAlert size={16} className="text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-950">Tax Details Required</h3>
                <p className="text-gray-500 mt-0.5 leading-relaxed">
                  Your business profile has not been assigned a valid GSTIN number yet. Please update your tax profile details to be cleared for purchase order generation.
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/vendor/profile")}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 font-semibold text-xs h-8"
            >
              Update Profile
            </Button>
          </div>
        )}

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
            <span className="text-xs text-gray-400">Vendor workflow shortcuts</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
          <EmptyState icon={Clock} title="No open invitations" desc="When procurement officers send you RFQs, they will appear here for you to respond." />
          <EmptyState icon={TrendingUp} title="No submitted quotations" desc="Your submitted quotes and their selection status will be tracked here." />
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
        <span className="text-sm text-gray-500">Loading Vendor Portal…</span>
      </div>
    </div>
  );
}

function AppFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white py-4">
      <div className="max-w-screen-xl mx-auto px-5 flex items-center justify-between">
        <span className="text-xs text-gray-400">© 2026 VendorBridge · Vendor Portal</span>
        <div className="flex items-center gap-4">
          {["Privacy", "Terms", "Support"].map((link) => (
            <a key={link} href="#" className="text-xs text-gray-400 hover:text-gray-600">{link}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}
