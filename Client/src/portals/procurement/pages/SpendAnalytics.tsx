import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar, { type NavItem } from "@/components/shared/Navbar";
import {
  TrendingUp,
  BarChart3,
  Building2,
  PieChart,
  Award,
  ArrowLeft,
  IndianRupee,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/procurement" },
  { label: "Vendors", path: "/procurement/vendors" },
  { label: "RFQs", path: "/procurement/rfqs" },
  { label: "Quotations", path: "/procurement/quotations" },
  { label: "Purchase Orders", path: "/procurement/purchase-orders" },
  { label: "Invoices", path: "/procurement/invoices" },
  { label: "Reports", path: "/procurement/reports", active: true },
];

export default function SpendAnalytics() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  // Data
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!token || !storedUser) {
      navigate("/login");
      return;
    }
    try {
      const parsed = JSON.parse(storedUser);
      // Accessible by Procurement Officer, Admin, or Manager
      if (!["Procurement Officer", "Admin", "Manager"].includes(parsed.role)) {
        navigate("/");
        return;
      }
      setUser(parsed);
      fetchAnalyticsData(token);
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const fetchAnalyticsData = async (token: string) => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/analytics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAnalytics(data);
      }
    } catch (err) {
      console.error("Failed to load spend analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch("http://localhost:8000/api/analytics/export", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        alert("Failed to export analytics CSV.");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vendorbridge_spend_analytics_${new Date().toISOString().substring(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Error exporting CSV: " + err.message);
    }
  };

  if (loading) return <LoadingScreen />;

  // Destructure metrics
  const metrics = analytics?.metrics || {
    totalUsers: 0,
    totalVendors: 0,
    totalRFQs: 0,
    openRFQs: 0,
    reviewRFQs: 0,
    completedRFQs: 0,
    paidInvoicesCount: 0,
    unpaidInvoicesCount: 0,
    totalSpendINR: 0,
    totalSpendUSD: 0,
  };
  const spendByMonth = analytics?.spendByMonth || [];
  const spendByCategory = analytics?.spendByCategory || [];
  const vendorPerformance = analytics?.vendorPerformance || [];

  // 1. Calculate Monthly stats
  const maxMonthAmount = spendByMonth.length > 0 ? Math.max(...spendByMonth.map((d: any) => d.amount)) : 1000;

  // 2. Calculate Category percentages
  const totalCategorySpend = spendByCategory.reduce((sum: number, c: any) => sum + c.value, 0) || 1;

  // Color mapping for category charts
  const CATEGORY_COLORS = [
    "#3b82f6", // Blue
    "#10b981", // Emerald
    "#f97316", // Orange
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#f59e0b", // Amber
    "#06b6d4", // Cyan
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Navbar
        user={user}
        navItems={NAV_ITEMS}
        onNavigate={(item) => item.path && navigate(item.path)}
      />

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-5 py-8 space-y-7">
        {/* Breadcrumb + Back Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors font-medium mb-1"
            >
              <ArrowLeft size={13} /> Back to dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp size={22} className="text-blue-600" /> Spend & Performance Analytics
            </h1>
            <p className="text-sm text-gray-500">
              Aggregated dashboard visualising system procurement spend, vendor win rates, and category indices.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportCSV}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm h-9 px-4 gap-1.5 shadow-sm font-semibold"
            >
              <FileSpreadsheet size={15} /> Export CSV
            </Button>
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm h-9 px-4 gap-1.5 shadow-sm font-semibold"
            >
              Print Report
            </Button>
          </div>
        </div>

        {/* High-level KPI Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Amount Spent</span>
              <IndianRupee size={18} className="text-blue-600" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-gray-900">
                ₹{(metrics.totalSpendINR || metrics.totalSpendUSD).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-gray-400 mt-1">Sum of all paid invoice settlements</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Paid Invoices Ratio</span>
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-gray-900">
                {metrics.paidInvoicesCount} <span className="text-sm font-medium text-gray-500">Paid</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {metrics.unpaidInvoicesCount} invoices currently pending settlement
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-semibold uppercase tracking-wider">RFQ Activity Index</span>
              <BarChart3 size={18} className="text-purple-600" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-gray-900">{metrics.totalRFQs}</div>
              <p className="text-xs text-gray-400 mt-1">
                {metrics.openRFQs} open requests · {metrics.completedRFQs} closed
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Suppliers Enrolled</span>
              <Building2 size={18} className="text-orange-600" />
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-gray-900">{metrics.totalVendors}</div>
              <p className="text-xs text-gray-400 mt-1">Suppliers verified and active inside system</p>
            </div>
          </div>
        </div>

        {/* Spend Visualisation Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Spend Bar Graph */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Monthly Expenditure Trend</h3>
                <p className="text-xs text-gray-400">Paid procurement spend over calendar months</p>
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">INR (₹)</span>
            </div>

            {/* Pure SVG Bar Chart */}
            <div className="h-64 flex items-end justify-between gap-2 border-b border-gray-200 pb-3 pt-6">
              {spendByMonth.length === 0 ? (
                <div className="flex flex-col items-center justify-center w-full h-full text-gray-400 text-xs">
                  <AlertCircle size={20} className="mb-1.5" /> No monthly expenditure data logged yet.
                </div>
              ) : (
                spendByMonth.map((item: any) => {
                  const pct = (item.amount / maxMonthAmount) * 100;
                  return (
                    <div key={item.month} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10 shadow-lg">
                        ₹{item.amount.toLocaleString("en-IN")}
                      </div>
                      {/* Bar fill */}
                      <div
                        style={{ height: `${pct || 5}%` }}
                        className="w-full max-w-[40px] rounded-t bg-gradient-to-t from-blue-600 to-indigo-400 group-hover:from-blue-700 group-hover:to-indigo-500 transition-all shadow-sm"
                      />
                      {/* Label */}
                      <span className="text-[10px] text-gray-500 mt-2 font-mono">{item.month}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Spend By Vendor Category Graph */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Category Allocation Matrix</h3>
                <p className="text-xs text-gray-400">Total procurement spend breakdown by supplier category</p>
              </div>
              <PieChart size={17} className="text-emerald-600" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center pt-2">
              {/* SVG Donut Chart */}
              <div className="flex justify-center">
                <svg className="w-40 h-40" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f3f4f6" strokeWidth="3.5" />
                  {spendByCategory.length === 0 ? (
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#cbd5e1" strokeWidth="3.5" />
                  ) : (() => {
                    let cumulativePct = 0;
                    return spendByCategory.map((item: any, idx: number) => {
                      const pct = (item.value / totalCategorySpend) * 100;
                      const offset = 100 - cumulativePct + 25;
                      cumulativePct += pct;
                      const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                      return (
                        <circle
                          key={item.name}
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke={color}
                          strokeWidth="3.8"
                          strokeDasharray={`${pct} ${100 - pct}`}
                          strokeDashoffset={offset}
                          className="transition-all duration-300"
                        />
                      );
                    });
                  })()}
                </svg>
              </div>

              {/* Category Legends with horizontal bars */}
              <div className="space-y-3">
                {spendByCategory.length === 0 ? (
                  <div className="text-xs text-gray-400">No category allocation available.</div>
                ) : (
                  spendByCategory.map((item: any, idx: number) => {
                    const pct = (item.value / totalCategorySpend) * 100;
                    const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                    return (
                      <div key={item.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                          <div className="flex items-center gap-1.5 truncate max-w-[120px]">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <span className="truncate">{item.name}</span>
                          </div>
                          <span>{pct.toFixed(0)}%</span>
                        </div>
                        {/* Custom progress bar */}
                        <div className="h-1.5 w-full bg-gray-150 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pct}%`, backgroundColor: color }}
                            className="h-full rounded-full"
                          />
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono pl-3">
                          ₹{item.value.toLocaleString("en-IN")}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Vendor Win Rates & Performance Leaderboard */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Supplier Performance Index</h3>
              <p className="text-xs text-gray-400">
                Quotes win rates, contract yields, and customer satisfaction ratings
              </p>
            </div>
            <Award size={18} className="text-purple-600" />
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-lg">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-semibold uppercase">
                  <th className="p-3">Supplier Company</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Bids Submitted</th>
                  <th className="p-3">Bids Selected</th>
                  <th className="p-3">Selection Success Rate</th>
                  <th className="p-3">POs Received</th>
                  <th className="p-3">Satisfaction Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vendorPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400 text-xs">
                      No supplier win rates computed yet. Bids must be submitted and selected.
                    </td>
                  </tr>
                ) : (
                  vendorPerformance
                    .sort((a: any, b: any) => b.winRate - a.winRate)
                    .map((vendor: any) => (
                      <tr key={vendor.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-3 font-semibold text-gray-900">{vendor.companyName}</td>
                        <td className="p-3">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-semibold text-gray-500">
                            {vendor.category}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600 font-mono text-xs">{vendor.totalQuotes}</td>
                        <td className="p-3 text-emerald-600 font-mono text-xs">{vendor.wonQuotes}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-gray-800 font-mono">
                              {vendor.winRate}%
                            </span>
                            <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                              <div
                                style={{ width: `${vendor.winRate}%` }}
                                className={`h-full rounded-full ${
                                  vendor.winRate >= 60
                                    ? "bg-emerald-500"
                                    : vendor.winRate >= 30
                                    ? "bg-blue-500"
                                    : "bg-gray-400"
                                }`}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-gray-600 font-mono text-xs">{vendor.totalPOs}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                            <Star size={12} fill="currentColor" />
                            <span>{vendor.rating.toFixed(1)}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <span className="text-sm text-gray-500">Aggregating Spend Analytics…</span>
      </div>
    </div>
  );
}

function AppFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white py-4 mt-auto">
      <div className="max-w-screen-xl mx-auto px-5 flex items-center justify-between">
        <span className="text-xs text-gray-400">© 2026 VendorBridge · Procurement Reports</span>
        <div className="flex items-center gap-4">
          {["Privacy", "Terms", "Support"].map((link) => (
            <a key={link} href="#" className="text-xs text-gray-400 hover:text-gray-600">
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
