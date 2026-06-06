import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar, { type NavItem } from "@/components/shared/Navbar";
import { FileText, Search, Eye, Clock, AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/vendor" },
  { label: "Open RFQs", path: "/vendor/rfqs", active: true },
  { label: "My Quotations", path: "/vendor/quotations" },
  { label: "Purchase Orders", path: "/vendor/purchase-orders" },
  { label: "Invoices", path: "/vendor/invoices" },
  { label: "My Profile", path: "/vendor/profile" },
];

export default function RFQList() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Open" | "Closed">("All");
  const [serverError, setServerError] = useState("");

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
      fetchData(token);
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const fetchData = async (token: string) => {
    try {
      setLoading(true);
      const [rfqRes, quoteRes] = await Promise.all([
        fetch("http://localhost:8000/api/rfqs", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:8000/api/quotations", {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      const rfqData = await rfqRes.json();
      const quoteData = await quoteRes.json();

      if (rfqRes.ok && rfqData.success) {
        setRfqs(rfqData.rfqs);
      } else {
        setServerError(rfqData.message || "Failed to load RFQ invitations.");
      }

      if (quoteRes.ok && quoteData.success) {
        setQuotations(quoteData.quotations);
      }
    } catch (err) {
      setServerError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleNavbarNavigate = (item: NavItem) => {
    if (item.path) navigate(item.path);
  };

  const getDaysRemaining = (deadlineDate: string) => {
    const diff = new Date(deadlineDate).getTime() - Date.now();
    if (diff <= 0) return { label: "Expired", color: "text-red-650 bg-red-50 border-red-200" };

    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) {
      return { label: `${hours}h left`, color: "text-amber-700 bg-amber-50 border-amber-200 font-semibold" };
    }

    const days = Math.floor(hours / 24);
    return { label: `${days}d left`, color: "text-blue-700 bg-blue-50 border-blue-150" };
  };

  // Filter RFQs list
  const filteredRfqs = rfqs.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Open" && r.status === "Open") ||
      (statusFilter === "Closed" && (r.status === "Closed" || r.status === "Under Review" || r.status === "Completed"));

    return matchesSearch && matchesStatus;
  });

  const getBidStatus = (rfqId: string) => {
    return quotations.some((q) => {
      const qRfqId = q.rfqId?._id || q.rfqId;
      return qRfqId === rfqId;
    });
  };

  const getRFQStatusStyle = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-emerald-50 text-emerald-700 border-emerald-250";
      case "Under Review":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Closed":
        return "bg-gray-100 text-gray-700 border-gray-250";
      case "Completed":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  if (!user) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Navbar user={user} navItems={NAV_ITEMS} onNavigate={handleNavbarNavigate} />

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-5 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="text-blue-600" size={20} /> RFQ Invitations
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Active and past Request for Quotations you have been invited to quote for.
            </p>
          </div>
          <Button
            onClick={() => navigate("/vendor/quotations")}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm h-8 px-3 gap-1.5 self-start sm:self-auto"
          >
            View My Bids
          </Button>
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>{serverError}</div>
          </div>
        )}

        {/* Directory Controls */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <Input
              placeholder="Search invitations by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 text-sm border-gray-200 focus-visible:ring-blue-500"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex border border-gray-200 rounded-lg p-0.5 bg-gray-50 self-start md:self-auto">
            {(["All", "Open", "Closed"] as const).map((tab) => {
              const count = rfqs.filter((r) => {
                if (tab === "All") return true;
                if (tab === "Open") return r.status === "Open";
                return r.status === "Closed" || r.status === "Under Review" || r.status === "Completed";
              }).length;

              return (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    statusFilter === tab
                      ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {tab} <span className="opacity-60 ml-0.5">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Listing */}
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-20 flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            <span className="text-sm text-gray-500">Retrieving solicitations list...</span>
          </div>
        ) : filteredRfqs.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-16 flex flex-col items-center justify-center text-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
              <FileText size={22} className="text-blue-500" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">No Invitations Found</div>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                {search
                  ? "Try resetting filters or changing your search criteria."
                  : "When procurement officers invite you to participate in RFQs, they will appear here."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRfqs.map((rfq) => {
              const countdown = getDaysRemaining(rfq.deadline);
              const hasQuoted = getBidStatus(rfq._id);
              const creatorName = rfq.createdBy ? `${rfq.createdBy.firstName} ${rfq.createdBy.lastName}` : "Procurement Dept";

              return (
                <div
                  key={rfq._id}
                  className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4 hover:shadow-md transition-shadow relative shadow-sm"
                >
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${getRFQStatusStyle(rfq.status)}`}>
                        {rfq.status}
                      </span>
                      {rfq.status === "Open" && (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${countdown.color}`}>
                          <Clock size={10} />
                          {countdown.label}
                        </span>
                      )}
                    </div>

                    <div>
                      <h2 className="text-sm font-bold text-gray-950 line-clamp-1">{rfq.title}</h2>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Issued by: <span className="font-medium text-gray-600">{creatorName}</span>
                      </p>
                    </div>

                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {rfq.description || "No description provided."}
                    </p>

                    {/* Quotation status badge */}
                    <div className="pt-1">
                      {hasQuoted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-250">
                          <CheckCircle2 size={11} className="text-emerald-600" /> Quoted
                        </span>
                      ) : rfq.status === "Open" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-50 text-gray-500 border border-gray-200">
                          <HelpCircle size={11} className="text-gray-400" /> Not Quoted Yet
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-650 border border-red-200">
                          Not Quoted (Closed)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                    <div className="text-xs text-gray-500 font-medium">
                      Items requested: <span className="font-semibold text-gray-800">{rfq.items?.length || 0}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/vendor/rfqs/${rfq._id}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 px-3 gap-1 shadow-sm font-semibold"
                    >
                      <Eye size={12} /> View RFQ
                    </Button>
                  </div>
                </div>
              );
            })}
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
        <span className="text-sm text-gray-500">Loading invitations…</span>
      </div>
    </div>
  );
}
