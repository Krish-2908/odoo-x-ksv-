import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar, { type NavItem } from "@/components/shared/Navbar";
import { FileText, Search, ArrowRight, ClipboardList, AlertCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/procurement" },
  { label: "Vendors", path: "/procurement/vendors" },
  { label: "RFQs", path: "/procurement/rfqs" },
  { label: "Quotations", path: "/procurement/quotations" },
  { label: "Purchase Orders", path: "/procurement/purchase-orders" },
  { label: "Invoices", path: "/procurement/invoices", active: true },
  { label: "Reports", path: "/procurement/reports" },
];

export default function InvoiceList() {
  const [user, setUser] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
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
      fetchInvoices(token);
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const fetchInvoices = async (token: string) => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/invoices", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.status === 200 && data.success) {
        setInvoices(data.invoices);
      } else {
        setServerError(data.message || "Failed to retrieve invoices.");
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

  const filteredInvoices = invoices.filter((inv) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(query) ||
      (inv.purchaseOrderId?.poNumber || "").toLowerCase().includes(query) ||
      (inv.vendorId?.companyName || "").toLowerCase().includes(query);

    const matchesStatus = statusFilter === "All" || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const style = {
      Unpaid: "bg-amber-50 text-amber-700 border-amber-200",
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
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="text-blue-600" size={22} /> Tax Invoices Directory
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Audit vendor invoices, check GST compliance rates, authorize Razorpay digital settlements, and email PDF logs.
          </p>
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
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by invoice number, PO number, or vendor name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs border-gray-200 bg-white"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <span className="text-xs text-gray-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 border border-gray-200 bg-white rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Invoices</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Paid">Paid</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-20 flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            <span className="text-sm text-gray-500">Retrieving tax invoices...</span>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-16 text-center text-gray-500 shadow-sm">
            <div className="h-12 w-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto text-gray-400 mb-3">
              <FileText size={20} />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">No Invoices Found</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              {searchTerm || statusFilter !== "All"
                ? "No invoices match your active filters."
                : "Tax invoices are auto-generated when a new Purchase Order is generated from an approved bid."}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-150 bg-gray-50/50 text-gray-500 font-bold">
                    <th className="py-3.5 px-4 font-semibold">Invoice Number</th>
                    <th className="py-3.5 px-4 font-semibold">PO Number</th>
                    <th className="py-3.5 px-4 font-semibold">Awarded Vendor</th>
                    <th className="py-3.5 px-4 font-semibold">Due Date</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Invoice Value (GST Inc.)</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-gray-50/30">
                      <td className="py-4 px-4 font-black text-gray-900">{inv.invoiceNumber}</td>
                      <td className="py-4 px-4 font-mono font-bold text-gray-650">
                        {inv.purchaseOrderId?.poNumber || "PO Deleted"}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-850">{inv.vendorId?.companyName}</div>
                        <div className="text-[10px] text-gray-450 mt-0.5 font-mono">
                          GSTIN: {inv.vendorId?.gstNumber || "Missing"}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-550 font-medium">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-gray-400" />
                          {new Date(inv.dueDate).toLocaleDateString([], { dateStyle: "medium" })}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-gray-900 text-sm">
                        ₹{inv.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 text-center">{getStatusBadge(inv.status)}</td>
                      <td className="py-4 px-4 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/procurement/invoices/${inv._id}`)}
                          className="h-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold text-xs gap-1"
                        >
                          Details <ArrowRight size={12} />
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
