import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar, { type NavItem } from "@/components/shared/Navbar";
import {
  FileText,
  Search,
  SlidersHorizontal,
  Calendar,
  Building2,
  Eye,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/procurement" },
  { label: "Vendors", path: "/procurement/vendors" },
  { label: "RFQs", path: "/procurement/rfqs" },
  { label: "Quotations", path: "/procurement/quotations", active: true },
  { label: "Purchase Orders", path: "/procurement/purchase-orders" },
  { label: "Invoices", path: "/procurement/invoices" },
  { label: "Reports", path: "/procurement/reports" },
];

export default function QuotationList() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
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
      if (parsed.role !== "Procurement Officer" && parsed.role !== "Admin") {
        navigate("/");
        return;
      }
      setCurrentUser(parsed);
      fetchQuotations(token);
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const fetchQuotations = async (token: string) => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/quotations/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setQuotations(data.quotations);
      } else {
        setServerError(data.message || "Failed to load quotations.");
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

  const getStatusBadge = (status: string) => {
    const style = {
      Submitted: "bg-blue-50 text-blue-700 border-blue-200",
      Selected: "bg-emerald-50 text-emerald-700 border-emerald-200",
      Revised: "bg-amber-50 text-amber-700 border-amber-200",
      Rejected: "bg-rose-50 text-rose-700 border-rose-200",
    }[status] || "bg-gray-100 text-gray-700 border-gray-200";

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${style}`}>
        {status}
      </span>
    );
  };

  const filteredQuotations = quotations.filter((q) => {
    const vendorName = q.vendorId?.companyName || "";
    const rfqTitle = q.rfqId?.title || "";
    
    const matchesSearch =
      vendorName.toLowerCase().includes(search.toLowerCase()) ||
      rfqTitle.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "All" || q.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Navbar user={currentUser} navItems={NAV_ITEMS} onNavigate={handleNavbarNavigate} />

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-5 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Quotations Registry</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Review and audit all bids submitted by verified suppliers across all active solicitations.
            </p>
          </div>
        </div>

        {serverError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg flex items-start gap-2 text-sm shadow-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-600" />
            <div>{serverError}</div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search by vendor name or RFQ title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 text-sm border-gray-200"
            />
          </div>

          {/* Status buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <SlidersHorizontal size={14} className="text-gray-400 shrink-0 hidden sm:block" />
            {["All", "Submitted", "Selected", "Revised", "Rejected"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-md text-xs font-semibold shrink-0 transition-colors border ${
                  statusFilter === status
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-gray-50 text-gray-655 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Main list */}
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-20 flex flex-col items-center justify-center gap-3 shadow-sm">
            <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            <span className="text-sm text-gray-500 font-medium">Retrieving submissions registry...</span>
          </div>
        ) : filteredQuotations.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-16 flex flex-col items-center justify-center text-center gap-4 shadow-sm">
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
              <FileText size={22} className="text-blue-500" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">No quotations found</div>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                {search || statusFilter !== "All"
                  ? "Try resetting filters or search criteria."
                  : "Bids submitted by vendors will populate here."}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold text-xs">
                    <th className="p-4">VENDOR</th>
                    <th className="p-4">RFQ SOLICITATION</th>
                    <th className="p-4">STATUS</th>
                    <th className="p-4">GRAND TOTAL</th>
                    <th className="p-4">SUBMITTED ON</th>
                    <th className="p-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {filteredQuotations.map((quote) => (
                    <tr key={quote._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-gray-400 shrink-0" />
                          <div>
                            <div className="font-semibold text-gray-900">{quote.vendorId?.companyName || "Unknown Vendor"}</div>
                            <div className="text-[10px] text-gray-400 font-semibold uppercase">{quote.vendorId?.category || "General"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-gray-900 truncate max-w-[250px]">
                          {quote.rfqId?.title || "Deleted/Archived RFQ"}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono truncate max-w-[250px]">
                          ID: {quote.rfqId?._id || "N/A"}
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(quote.status)}</td>
                      <td className="p-4 font-bold text-gray-900 font-mono">
                        ₹{(quote.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-gray-650 text-xs">
                          <Calendar size={13} className="text-gray-400" />
                          {new Date(quote.createdAt).toLocaleString([], {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        {quote.rfqId?._id ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/procurement/rfqs/${quote.rfqId._id}`)}
                            className="h-8 px-2.5 hover:bg-blue-50 hover:text-blue-700 gap-1 text-xs text-blue-600 transition-all"
                          >
                            <Eye size={13} /> View RFQ
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Unavailable</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-xs text-gray-400">
              Showing {filteredQuotations.length} of {quotations.length} total quotations
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
