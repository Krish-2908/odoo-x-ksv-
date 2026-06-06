import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar, { type NavItem } from "@/components/shared/Navbar";
import { FileText, Plus, Search, Calendar, Users, Eye, SlidersHorizontal, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/procurement" },
  { label: "Vendors", path: "/procurement/vendors" },
  { label: "RFQs", path: "/procurement/rfqs", active: true },
  { label: "Quotations", path: "/procurement/quotations" },
  { label: "Purchase Orders", path: "/procurement/purchase-orders" },
  { label: "Invoices", path: "/procurement/invoices" },
  { label: "Reports", path: "/procurement/reports" },
];

export default function RFQList() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [rfqs, setRfqs] = useState<any[]>([]);
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
      if (parsed.role !== "Procurement Officer") {
        navigate("/");
        return;
      }
      setUser(parsed);
      fetchRFQs(token);
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const fetchRFQs = async (token: string) => {
    try {
      const res = await fetch("http://localhost:8000/api/rfqs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.status === 200 && data.success) {
        setRfqs(data.rfqs);
      } else {
        setServerError(data.message || "Failed to load RFQs.");
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
      Draft: "bg-gray-100 text-gray-700 border-gray-200",
      Open: "bg-blue-50 text-blue-700 border-blue-200",
      Closed: "bg-red-50 text-red-700 border-red-200",
      "Under Review": "bg-amber-50 text-amber-700 border-amber-200",
      Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    }[status] || "bg-gray-100 text-gray-700 border-gray-200";

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
        {status}
      </span>
    );
  };

  // Filter RFQs list
  const filteredRfqs = rfqs.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "All" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!user) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Navbar user={user} navItems={NAV_ITEMS} onNavigate={handleNavbarNavigate} />

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-5 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Request for Quotations (RFQs)</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Draft, schedule, and view open solicitations to suppliers.
            </p>
          </div>
          <Button
            onClick={() => navigate("/procurement/rfqs/new")}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm h-9 px-4 gap-1.5 shadow-sm self-start sm:self-auto"
          >
            <Plus size={15} /> Create RFQ
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
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search RFQs by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 text-sm border-gray-200"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <SlidersHorizontal size={14} className="text-gray-400 shrink-0 hidden sm:block" />
            {["All", "Draft", "Open", "Closed", "Under Review", "Completed"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-md text-xs font-semibold shrink-0 transition-colors border ${
                  statusFilter === status
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-gray-50 text-gray-650 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {status}
              </button>
            ))}
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
              <div className="text-sm font-semibold text-gray-900">No RFQs found</div>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                {search || statusFilter !== "All"
                  ? "Try resetting filters or changing your search criteria."
                  : "Start creating your first Request for Quotation to vendors."}
              </p>
            </div>
            {!(search || statusFilter !== "All") && (
              <Button
                onClick={() => navigate("/procurement/rfqs/new")}
                variant="outline"
                className="text-xs h-8 gap-1 text-blue-600 border-blue-200"
              >
                <Plus size={13} /> Create RFQ
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold text-xs">
                    <th className="p-4 w-1/3">RFQ TITLE</th>
                    <th className="p-4">STATUS</th>
                    <th className="p-4">ITEMS</th>
                    <th className="p-4">DEADLINE</th>
                    <th className="p-4">VENDORS</th>
                    <th className="p-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {filteredRfqs.map((rfq) => (
                    <tr key={rfq._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-gray-950 truncate max-w-[280px]">{rfq.title}</div>
                        <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[280px]">
                          {rfq.description || "No description provided."}
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(rfq.status)}</td>
                      <td className="p-4 text-gray-700">
                        {rfq.items.length} {rfq.items.length === 1 ? "item" : "items"}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                          <Calendar size={13} className="text-gray-400" />
                          {new Date(rfq.deadline).toLocaleString([], {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Users size={13} className="text-gray-400" />
                          {rfq.assignedVendors.length} assigned
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/procurement/rfqs/${rfq._id}`)}
                          className="h-8 px-2.5 hover:bg-gray-100 hover:text-gray-900 gap-1 text-xs text-blue-600"
                        >
                          <Eye size={13} /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-xs text-gray-400">
              Showing {filteredRfqs.length} of {rfqs.length} total RFQs
            </div>
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
        <span className="text-sm text-gray-500">Loading RFQ directory…</span>
      </div>
    </div>
  );
}
