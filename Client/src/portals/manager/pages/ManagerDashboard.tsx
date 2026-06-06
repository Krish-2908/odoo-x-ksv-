import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/shared/Navbar";
import {
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Eye,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Gavel,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { label: "Dashboard", active: true },
  { label: "Pending Approvals" },
  { label: "Approval History" },
  { label: "Spend Analytics" },
  { label: "Reports" },
];

const KPI_CARDS = [
  {
    label: "Pending Approvals",
    value: "0",
    sub: "Awaiting your review",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  {
    label: "Approved This Month",
    value: "0",
    sub: "Approved purchase orders",
    icon: CheckCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    label: "Rejected This Month",
    value: "0",
    sub: "Sent back for revision",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-50",
    border: "border-red-100",
  },
  {
    label: "Total Spend Approved",
    value: "₹0",
    sub: "Cumulative this month",
    icon: BarChart3,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
];

const QUICK_ACTIONS = [
  { icon: Eye, label: "Review Queue", desc: "View all pending approval requests" },
  { icon: ThumbsUp, label: "Approve Request", desc: "Sign off on a procurement request" },
  { icon: ThumbsDown, label: "Reject Request", desc: "Return a request with remarks" },
  { icon: BarChart3, label: "Spend Report", desc: "Department-wise expenditure overview" },
];

export default function ManagerDashboard() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!token || !storedUser) { navigate("/login"); return; }
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed.role !== "Manager") { navigate("/"); return; }
      setUser(parsed);
    } catch { navigate("/login"); }
  }, [navigate]);

  if (!user) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Navbar user={user} navItems={NAV_ITEMS} />

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-5 py-8 space-y-7">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <Gavel size={11} /> Manager Portal
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Approval Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Review pending procurement requests, approve or reject with remarks.
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm h-8 px-3 gap-1.5 shadow-sm self-start sm:self-auto">
            <Eye size={14} /> Review Queue
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {KPI_CARDS.map(({ label, value, sub, icon: Icon, color, bg, border }) => (
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
            <span className="text-xs text-gray-400">Approval workflow shortcuts</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {QUICK_ACTIONS.map(({ label, icon: Icon, desc }) => (
              <button
                key={label}
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

        {/* Pending approvals empty state */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Pending Approvals</h2>
            <span className="text-xs text-amber-600 font-medium">0 items</span>
          </div>
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
              <AlertCircle size={22} className="text-gray-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">No pending approvals</div>
              <p className="text-xs text-gray-400 mt-0.5 max-w-xs">
                Procurement officers will submit purchase requests here for your review and sign-off.
              </p>
            </div>
          </div>
        </div>

        {/* Analytics placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EmptyState icon={Clock} title="No approval history" desc="All approved and rejected requests with timestamps and remarks will appear here." />
          <EmptyState icon={TrendingUp} title="No spend data" desc="Spend approved by category and department will be visualized here." />
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
        <span className="text-sm text-gray-500">Loading Manager Portal…</span>
      </div>
    </div>
  );
}

function AppFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white py-4">
      <div className="max-w-screen-xl mx-auto px-5 flex items-center justify-between">
        <span className="text-xs text-gray-400">© 2026 VendorBridge · Manager Portal</span>
        <div className="flex items-center gap-4">
          {["Privacy", "Terms", "Support"].map((link) => (
            <a key={link} href="#" className="text-xs text-gray-400 hover:text-gray-600">{link}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}
