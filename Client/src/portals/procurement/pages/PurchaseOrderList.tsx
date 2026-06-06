import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar, { type NavItem } from "@/components/shared/Navbar";
import { FileText, Plus, Search, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/procurement" },
  { label: "Vendors", path: "/procurement/vendors" },
  { label: "RFQs", path: "/procurement/rfqs" },
  { label: "Purchase Orders", path: "/procurement/purchase-orders", active: true },
  { label: "Invoices", path: "/procurement/invoices" },
  { label: "Reports", path: "/procurement/reports" },
];

export default function PurchaseOrderList() {
  const [user, setUser] = useState<any>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();

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
      fetchPOs(token);
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const fetchPOs = async (token: string) => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/purchase-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.status === 200 && data.success) {
        setPurchaseOrders(data.purchaseOrders);
      } else {
        setServerError(data.message || "Failed to retrieve purchase orders.");
      }
    } catch (err) {
      setServerError("Network error. Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleNavbarNavigate = (item: NavItem) => {
    if (item.path) navigate(item.path);
  };

  const filteredPOs = purchaseOrders.filter((po) => {
    const query = searchTerm.toLowerCase();
    return (
      po.poNumber.toLowerCase().includes(query) ||
      (po.rfqId?.title || "").toLowerCase().includes(query) ||
      (po.vendorId?.companyName || "").toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string) => {
    const style = {
      Issued: "bg-blue-50 text-blue-700 border-blue-200",
      Paid: "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold",
      Cancelled: "bg-red-50 text-red-700 border-red-200",
    }[status] || "bg-gray-100 text-gray-700 border-gray-200";

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold border ${style}`}>
        {status}
      </span>
    );
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Navbar user={user} navItems={NAV_ITEMS} onNavigate={handleNavbarNavigate} />

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-5 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-905 flex items-center gap-2">
              <ShieldCheck className="text-blue-600" size={22} /> Purchase Orders Directory
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Access generated sequential contracts, trace vendor compliance, check payment milestones, and print invoices.
            </p>
          </div>
          <Button
            onClick={() => navigate("/procurement/rfqs")}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 px-3.5 gap-1.5 shadow-sm self-start sm:self-auto font-semibold"
          >
            <Plus size={14} /> New Contract (from RFQ)
          </Button>
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 text-sm shadow-sm animate-in fade-in duration-200">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>{serverError}</div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-450" />
            <Input
              placeholder="Search by PO number, title, or vendor name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs border-gray-200 bg-white"
            />
          </div>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-20 flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            <span className="text-sm text-gray-500">Retrieving purchase order directory...</span>
          </div>
        ) : filteredPOs.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-16 text-center text-gray-500 shadow-sm">
            <div className="h-12 w-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto text-gray-400 mb-3">
              <FileText size={20} />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">No Purchase Orders Found</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              {searchTerm ? "No orders match your active search terms." : "Generated PO records and associated tax invoices will appear here once bid proposals are approved and generated."}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-150 bg-gray-50/50 text-gray-500 font-bold">
                    <th className="py-3.5 px-4 font-semibold">PO Number</th>
                    <th className="py-3.5 px-4 font-semibold">Associated RFQ Title</th>
                    <th className="py-3.5 px-4 font-semibold">Awarded Vendor</th>
                    <th className="py-3.5 px-4 font-semibold">Date Generated</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Grand Total (GST Inc.)</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Milestone</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPOs.map((po) => (
                    <tr key={po._id} className="hover:bg-gray-50/30">
                      <td className="py-4 px-4 font-black text-gray-900">{po.poNumber}</td>
                      <td className="py-4 px-4 font-semibold text-gray-800 truncate max-w-[200px]">
                        {po.rfqId?.title || "Solicitation Deleted"}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-850">{po.vendorId?.companyName}</div>
                        <div className="text-[10px] text-gray-450 mt-0.5">Category: {po.vendorId?.category}</div>
                      </td>
                      <td className="py-4 px-4 text-gray-550 font-medium">
                        {new Date(po.createdAt).toLocaleDateString([], { dateStyle: "medium" })}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-gray-900 text-sm">
                        ₹{po.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 text-center">{getStatusBadge(po.status)}</td>
                      <td className="py-4 px-4 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/procurement/purchase-orders/${po._id}`)}
                          className="h-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold text-xs gap-1"
                        >
                          View Details <ArrowRight size={12} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
