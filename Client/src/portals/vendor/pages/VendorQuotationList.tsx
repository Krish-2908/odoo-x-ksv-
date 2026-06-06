import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar, { type NavItem } from "@/components/shared/Navbar";
import {
  SendHorizontal,
  Search,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/vendor" },
  { label: "Open RFQs", path: "/vendor/rfqs" },
  { label: "My Quotations", path: "/vendor/quotations", active: true },
  { label: "Purchase Orders", path: "/vendor/purchase-orders" },
  { label: "Invoices", path: "/vendor/invoices" },
  { label: "My Profile", path: "/vendor/profile" },
];

const STATUS_FILTERS = ["All", "Submitted", "Revised", "Selected", "Rejected"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export default function VendorQuotationList() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!token || !storedUser) { navigate("/login"); return; }
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed.role !== "Vendor") { navigate("/"); return; }
      setUser(parsed);
      fetchQuotations(token);
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const fetchQuotations = async (token: string) => {
    try {
      const res = await fetch("http://localhost:8000/api/quotations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setQuotations(data.quotations);
      } else {
        setServerError(data.message || "Failed to load your quotations.");
      }
    } catch {
      setServerError("Network error. Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleNavbarNavigate = (item: NavItem) => {
    if (item.path) navigate(item.path);
  };

  // Filtered list
  const filtered = quotations.filter((q) => {
    const matchSearch =
      (q.rfqId?.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (q.deliveryTimeline || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStatusStyle = (status: string) => ({
    Submitted: "bg-blue-50 text-blue-700 border-blue-200",
    Revised:   "bg-amber-50 text-amber-700 border-amber-200",
    Selected:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    Rejected:  "bg-red-50 text-red-700 border-red-200",
  }[status] || "bg-gray-100 text-gray-600 border-gray-200");

  const getStatusIcon = (status: string) => {
    if (status === "Selected") return <CheckCircle2 size={13} className="text-emerald-600" />;
    if (status === "Rejected") return <AlertTriangle size={13} className="text-red-600" />;
    if (status === "Revised") return <Clock size={13} className="text-amber-600" />;
    return <SendHorizontal size={13} className="text-blue-600" />;
  };

  // Summary counts
  const counts = STATUS_FILTERS.slice(1).reduce((acc, s) => {
    acc[s] = quotations.filter((q) => q.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  const winRate = quotations.length > 0
    ? Math.round((counts["Selected"] / quotations.length) * 100)
    : 0;

  if (!user) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Navbar user={user} navItems={NAV_ITEMS} onNavigate={handleNavbarNavigate} />

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-5 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <SendHorizontal className="text-blue-600" size={20} /> My Quotations
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Track all your submitted bids, selection status, and associated purchase orders.
            </p>
          </div>
          <Button
            onClick={() => navigate("/vendor/rfqs")}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm h-8 px-3 gap-1.5 self-start sm:self-auto"
          >
            <Eye size={14} /> Browse Open RFQs
          </Button>
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>{serverError}</div>
          </div>
        )}

        {/* Summary KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Bids", value: quotations.length, color: "bg-white border-gray-200 text-gray-900" },
            { label: "Active / Revised", value: (counts["Submitted"] || 0) + (counts["Revised"] || 0), color: "bg-blue-50 border-blue-100 text-blue-900" },
            { label: "Bids Won", value: counts["Selected"] || 0, color: "bg-emerald-50 border-emerald-200 text-emerald-900" },
            { label: "Win Rate", value: `${winRate}%`, color: "bg-violet-50 border-violet-200 text-violet-900" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl border p-3 text-center ${color}`}>
              <div className="text-xl font-bold">{value}</div>
              <div className="text-xs font-medium opacity-70 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by RFQ title or delivery timeline..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg w-full text-sm outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  statusFilter === s
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300"
                }`}
              >
                {s}
                {s !== "All" && (
                  <span className={`ml-1.5 ${statusFilter === s ? "text-blue-200" : "text-gray-400"}`}>
                    ({counts[s] || 0})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-20 flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            <span className="text-sm text-gray-500">Fetching your bid history...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-16 flex flex-col items-center justify-center text-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
              <TrendingUp size={22} className="text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">No Quotations Found</div>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                {search || statusFilter !== "All"
                  ? "Try changing filters or clearing your search."
                  : "Browse open RFQs and submit your first quotation to get started."}
              </p>
            </div>
            <Button
              onClick={() => navigate("/vendor/rfqs")}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
            >
              Browse Open RFQs
            </Button>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 font-semibold uppercase tracking-wide">
                    <th className="py-3.5 px-4">RFQ Solicitation</th>
                    <th className="py-3.5 px-4">Delivery Timeline</th>
                    <th className="py-3.5 px-4 text-right">Grand Total</th>
                    <th className="py-3.5 px-4 text-center">Bid Status</th>
                    <th className="py-3.5 px-4 text-center">Last Updated</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((q) => (
                    <tr key={q._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                            q.status === "Selected" ? "bg-emerald-50" :
                            q.status === "Rejected" ? "bg-red-50" :
                            q.status === "Revised" ? "bg-amber-50" : "bg-blue-50"
                          }`}>
                            {getStatusIcon(q.status)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-xs max-w-[220px] truncate">
                              {q.rfqId?.title || "—"}
                            </div>
                            {q.notes && (
                              <div className="text-[10px] text-gray-400 truncate max-w-[200px]">
                                Note: {q.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{q.deliveryTimeline || "—"}</td>
                      <td className="py-4 px-4 text-right font-bold text-gray-900 text-sm">
                        ₹{(q.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold border text-[10px] ${getStatusStyle(q.status)}`}>
                          {getStatusIcon(q.status)}
                          {q.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center text-gray-400">
                        {new Date(q.updatedAt || q.createdAt).toLocaleDateString([], { dateStyle: "medium" })}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {q.rfqId?._id ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/vendor/rfqs/${q.rfqId._id}`)}
                            className="h-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold text-[10px] gap-1"
                          >
                            View RFQ <Eye size={11} />
                          </Button>
                        ) : (
                          <span className="text-gray-300 text-[10px]">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table footer with win rate summary */}
            {filtered.length > 0 && (
              <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Showing {filtered.length} of {quotations.length} bids
                </span>
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <Trophy size={12} />
                  {winRate}% overall win rate
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <span className="text-sm text-gray-500">Loading your quotations…</span>
      </div>
    </div>
  );
}
