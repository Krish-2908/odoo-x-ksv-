import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar, { type NavItem } from "@/components/shared/Navbar";
import {
  FileText,
  SendHorizontal,
  ShoppingCart,
  CheckCircle2,
  Eye,
  Clock,
  TrendingUp,
  Store,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ReceiptText,
  Trophy,
  Activity,
  ArrowRight,
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

export default function VendorDashboard() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!token || !storedUser) { navigate("/login"); return; }
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed.role !== "Vendor") { navigate("/"); return; }
      setUser(parsed);
      fetchAnalytics(token);
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const fetchAnalytics = async (token: string) => {
    try {
      const res = await fetch("http://localhost:8000/api/analytics/vendor-self", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAnalytics(data);
      }
    } catch (err) {
      console.error("Failed to load vendor analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNavbarNavigate = (item: NavItem) => {
    if (item.path) navigate(item.path);
  };

  // Profile completeness score
  const getProfileCompletion = (profile: any) => {
    if (!profile) return 0;
    const fields = [
      profile.companyName,
      profile.category,
      profile.gstNumber,
      profile.contactEmail,
      profile.status === "Active",
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  // Days remaining helper
  const getDaysRemaining = (deadlineDate: string) => {
    const diff = new Date(deadlineDate).getTime() - Date.now();
    if (diff <= 0) return { label: "Expired", color: "text-red-600 bg-red-50 border-red-200" };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return { label: `${hours}h left`, color: "text-amber-700 bg-amber-50 border-amber-200" };
    const days = Math.floor(hours / 24);
    return { label: `${days}d left`, color: "text-blue-700 bg-blue-50 border-blue-200" };
  };

  // Quote status badge
  const getQuoteStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      Submitted: "bg-blue-50 text-blue-700 border-blue-200",
      Revised:   "bg-amber-50 text-amber-700 border-amber-200",
      Selected:  "bg-emerald-50 text-emerald-700 border-emerald-200",
      Rejected:  "bg-red-50 text-red-700 border-red-200",
    };
    return map[status] || "bg-gray-100 text-gray-600 border-gray-200";
  };

  if (!user) return <LoadingScreen />;

  const m = analytics?.metrics;
  const profile = analytics?.vendorProfile;
  const completionPct = getProfileCompletion(profile);

  // SVG Win Rate Donut
  const winRate = m?.winRate || 0;

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
              {profile?.status === "Active" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                  <ShieldCheck size={11} /> Verified
                </span>
              )}
              {profile?.status === "Pending Verification" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                  <Clock size={11} /> Pending Verification
                </span>
              )}
              {profile?.status === "Suspended" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600">
                  <ShieldAlert size={11} /> Suspended
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Welcome back, {user.firstName} 👋
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {profile?.companyName
                ? `${profile.companyName} · ${profile.category || "General"}`
                : "Configure your vendor profile to start submitting quotations."}
            </p>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            <Button
              onClick={() => navigate("/vendor/rfqs")}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm h-8 px-3 gap-1.5 shadow-sm"
            >
              <Eye size={14} /> Browse RFQs
            </Button>
            <Button
              onClick={() => navigate("/vendor/quotations")}
              variant="outline"
              className="text-sm h-8 px-3 gap-1.5 border-gray-200 text-gray-700"
            >
              <SendHorizontal size={14} /> My Bids
            </Button>
          </div>
        </div>

        {/* GSTIN Missing Warning Banner */}
        {profile && !profile.gstNumber && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm text-xs">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-white border border-amber-200 flex items-center justify-center shrink-0">
                <AlertTriangle size={16} className="text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-950">Tax Details Required</h3>
                <p className="text-gray-500 mt-0.5 leading-relaxed">
                  Your business profile is missing a valid GSTIN. Update your tax profile to be cleared for purchase order generation.
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

        {/* Profile Completeness Bar */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-700">Profile Completeness</span>
              <span className={`font-bold ${completionPct === 100 ? "text-emerald-600" : completionPct >= 60 ? "text-amber-600" : "text-red-600"}`}>
                {completionPct}%
              </span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  completionPct === 100 ? "bg-emerald-500" : completionPct >= 60 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400">
              {completionPct === 100
                ? "✓ Your profile is complete."
                : "Complete your profile: add GSTIN, contact details, and ensure your account is verified."}
            </p>
          </div>
          {completionPct < 100 && (
            <Button
              onClick={() => navigate("/vendor/profile")}
              size="sm"
              variant="outline"
              className="shrink-0 h-8 text-xs border-gray-200 text-gray-600"
            >
              Complete Profile
            </Button>
          )}
        </div>

        {/* KPI Cards Row */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Open RFQ Invitations",
                value: m?.openRFQCount ?? 0,
                sub: "Awaiting your bid",
                icon: FileText,
                color: "text-blue-600",
                bg: "bg-blue-50",
                border: "border-blue-100",
                onClick: () => navigate("/vendor/rfqs"),
              },
              {
                label: "Quotations Submitted",
                value: m?.totalQuotations ?? 0,
                sub: `${m?.submittedQuotations ?? 0} active · ${m?.revisedQuotations ?? 0} revised`,
                icon: SendHorizontal,
                color: "text-violet-600",
                bg: "bg-violet-50",
                border: "border-violet-100",
                onClick: () => navigate("/vendor/quotations"),
              },
              {
                label: "Bids Won (Selected)",
                value: m?.selectedQuotations ?? 0,
                sub: `${m?.winRate ?? 0}% win rate`,
                icon: Trophy,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
                border: "border-emerald-100",
                onClick: () => navigate("/vendor/quotations"),
              },
              {
                label: "Active Purchase Orders",
                value: m?.activePOs ?? 0,
                sub: `${m?.paidPOs ?? 0} fulfilled · ${m?.totalPOs ?? 0} total`,
                icon: ShoppingCart,
                color: "text-amber-600",
                bg: "bg-amber-50",
                border: "border-amber-100",
                onClick: () => navigate("/vendor/purchase-orders"),
              },
            ].map(({ label, value, sub, icon: Icon, color, bg, border, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className={`bg-white border ${border} rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition-all text-left group`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600 leading-snug">{label}</span>
                  <div className={`h-9 w-9 rounded-lg ${bg} flex items-center justify-center`}>
                    <Icon size={18} className={color} />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{value}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Revenue Card + Performance Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Earned Card */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-5 text-white flex flex-col gap-4 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-emerald-100">Total Revenue Earned</span>
              <div className="h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center">
                <ReceiptText size={18} className="text-white" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                ₹{(m?.totalRevenueINR || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-emerald-200 mt-1">From {m?.paidPOs || 0} paid purchase orders</div>
            </div>
            <button
              onClick={() => navigate("/vendor/invoices")}
              className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-white/80 hover:text-white transition-colors"
            >
              View Invoices <ArrowRight size={12} />
            </button>
          </div>

          {/* Win Rate Donut Panel */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center gap-3">
            <h3 className="text-sm font-semibold text-gray-900 self-start">Bid Win Rate</h3>
            <div className="relative">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f3f4f6" strokeWidth="3.5" />
                <circle
                  cx="18" cy="18" r="15.915" fill="none"
                  stroke={winRate >= 60 ? "#10b981" : winRate >= 30 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="3.5"
                  strokeDasharray={`${(winRate / 100) * 100} ${100 - (winRate / 100) * 100}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{winRate}%</span>
                <span className="text-[10px] text-gray-400">win rate</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full text-xs text-center">
              <div className="bg-emerald-50 rounded-lg p-2">
                <div className="font-bold text-emerald-700">{m?.selectedQuotations || 0}</div>
                <div className="text-emerald-600 text-[10px]">Won</div>
              </div>
              <div className="bg-red-50 rounded-lg p-2">
                <div className="font-bold text-red-700">{m?.rejectedQuotations || 0}</div>
                <div className="text-red-600 text-[10px]">Lost</div>
              </div>
            </div>
          </div>

          {/* Monthly Revenue SVG Bar Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Monthly Revenue</h3>
              <span className="text-xs text-gray-400">Paid invoices (₹)</span>
            </div>
            {!analytics?.monthlyRevenue?.length ? (
              <div className="flex items-center justify-center h-28 text-gray-300 text-xs">
                No revenue data yet
              </div>
            ) : (() => {
              const data = analytics.monthlyRevenue;
              const maxVal = Math.max(...data.map((d: any) => d.amount), 1);
              const chartH = 80;
              const barW = Math.max(14, Math.floor((240 - (data.length - 1) * 6) / Math.max(data.length, 1)));
              const gap = 6;
              const totalW = data.length * barW + (data.length - 1) * gap;
              return (
                <div className="overflow-x-auto">
                  <svg width={Math.max(totalW + 8, 240)} height={chartH + 28} viewBox={`0 0 ${Math.max(totalW + 8, 240)} ${chartH + 28}`} className="block">
                    {data.map((m: any, i: number) => {
                      const bh = Math.max(4, (m.amount / maxVal) * chartH);
                      const x = i * (barW + gap) + 4;
                      const y = chartH - bh;
                      return (
                        <g key={m.month}>
                          <rect x={x} y={y} width={barW} height={bh} rx={3} fill="#10b981" opacity={0.8} />
                          <text x={x + barW / 2} y={chartH + 14} textAnchor="middle" fontSize="8" fill="#9ca3af">
                            {m.month?.slice(5) || ""}
                          </text>
                        </g>
                      );
                    })}
                    <line x1={0} y1={chartH} x2={Math.max(totalW + 8, 240)} y2={chartH} stroke="#f3f4f6" strokeWidth={1} />
                  </svg>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Bottom Row: Recent RFQs + Recent Quotations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent RFQ Invitations Feed */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                <Activity size={15} className="text-blue-500" /> Recent RFQ Invitations
              </h3>
              <button
                onClick={() => navigate("/vendor/rfqs")}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-28 gap-2 text-gray-400">
                <div className="h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                <span className="text-xs">Loading...</span>
              </div>
            ) : !analytics?.recentRFQs?.length ? (
              <div className="flex flex-col items-center justify-center h-28 gap-2 text-center">
                <FileText size={24} className="text-gray-300" />
                <p className="text-xs text-gray-400">No RFQ invitations yet.<br />You will be notified when procurement teams invite you.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {analytics.recentRFQs.map((rfq: any) => {
                  const countdown = getDaysRemaining(rfq.deadline);
                  return (
                    <div
                      key={rfq._id}
                      onClick={() => navigate(`/vendor/rfqs/${rfq._id}`)}
                      className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all cursor-pointer"
                    >
                      <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <FileText size={15} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-900 truncate">{rfq.title}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          Issued by {rfq.createdBy?.firstName} {rfq.createdBy?.lastName}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${countdown.color}`}>
                          {countdown.label}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          rfq.status === "Open" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          rfq.status === "Completed" ? "bg-gray-100 text-gray-600 border-gray-200" :
                          "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                          {rfq.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Bid Status Feed */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                <TrendingUp size={15} className="text-emerald-500" /> My Recent Bids
              </h3>
              <button
                onClick={() => navigate("/vendor/quotations")}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-28 gap-2 text-gray-400">
                <div className="h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                <span className="text-xs">Loading...</span>
              </div>
            ) : !analytics?.recentQuotations?.length ? (
              <div className="flex flex-col items-center justify-center h-28 gap-2 text-center">
                <SendHorizontal size={24} className="text-gray-300" />
                <p className="text-xs text-gray-400">No quotations submitted yet.<br />Browse open RFQs and submit your first bid.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {analytics.recentQuotations.map((q: any) => (
                  <div
                    key={q._id}
                    onClick={() => q.rfqId?._id && navigate(`/vendor/rfqs/${q.rfqId._id}`)}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer"
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      q.status === "Selected" ? "bg-emerald-50" :
                      q.status === "Rejected" ? "bg-red-50" :
                      q.status === "Revised" ? "bg-amber-50" : "bg-blue-50"
                    }`}>
                      {q.status === "Selected" ? <CheckCircle2 size={15} className="text-emerald-600" /> :
                       q.status === "Rejected" ? <AlertTriangle size={15} className="text-red-600" /> :
                       <SendHorizontal size={15} className="text-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-900 truncate">
                        {q.rfqId?.title || "RFQ Reference"}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        ₹{q.grandTotal?.toLocaleString("en-IN", { minimumFractionDigits: 2 })} · {q.deliveryTimeline || "—"}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getQuoteStatusBadge(q.status)}`}>
                      {q.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
