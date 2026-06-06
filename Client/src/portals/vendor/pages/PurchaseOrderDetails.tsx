import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar, { type NavItem } from "@/components/shared/Navbar";
import {
  ArrowLeft,
  Printer,
  Calendar,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/vendor" },
  { label: "Open RFQs", path: "/vendor/rfqs" },
  { label: "My Quotations", path: "/vendor/quotations" },
  { label: "Purchase Orders", path: "/vendor/purchase-orders", active: true },
  { label: "Invoices", path: "/vendor/invoices" },
  { label: "My Profile", path: "/vendor/profile" },
];

export default function PurchaseOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [po, setPo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
      fetchPODetails(token);
    } catch {
      navigate("/login");
    }
  }, [navigate, id]);

  const fetchPODetails = async (token: string) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8000/api/purchase-orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.status === 200 && data.success) {
        setPo(data.purchaseOrder);
      } else {
        setServerError(data.message || "Failed to load purchase order details.");
      }
    } catch (err) {
      setServerError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNavbarNavigate = (item: NavItem) => {
    if (item.path) navigate(item.path);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col print:bg-white print:min-h-0">
      <div className="print:hidden">
        <Navbar user={user} navItems={NAV_ITEMS} onNavigate={handleNavbarNavigate} />
      </div>

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-5 py-8 space-y-6 print:px-0 print:py-0 print:space-y-0">
        {/* Actions bar */}
        <div className="flex items-center justify-between print:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/vendor/purchase-orders")}
            className="text-gray-500 hover:text-gray-905 gap-1.5 h-8 px-2"
          >
            <ArrowLeft size={15} /> Back to Directory
          </Button>

          {po && (
            <Button
              variant="outline"
              onClick={handlePrint}
              className="text-gray-700 hover:bg-gray-50 border-gray-200 text-xs h-8 px-3.5 gap-1.5 font-semibold"
            >
              <Printer size={14} /> Print Contract
            </Button>
          )}
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 text-sm print:hidden">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>{serverError}</div>
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-20 flex flex-col items-center justify-center gap-3 print:hidden">
            <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            <span className="text-sm text-gray-500">Loading purchase agreement details...</span>
          </div>
        ) : !po ? (
          <div className="bg-white border border-gray-200 rounded-xl p-16 text-center text-gray-500 print:hidden">
            Contract details are unavailable.
          </div>
        ) : (
          <div className="space-y-6 print:space-y-0">
            {/* Clear Banner if paid */}
            {po.status === "Paid" && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-emerald-800 shadow-sm print:hidden">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Contract Paid & Cleared:</span> The procurement team has completed the payment settlement for this purchase order.
                  <div className="mt-1 font-semibold text-[10px] text-emerald-700 font-mono">
                    Payment ID: {po.razorpayPaymentId}
                  </div>
                </div>
              </div>
            )}

            {/* Contract Sheet */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 max-w-4xl mx-auto space-y-8 print:border-0 print:shadow-none print:p-0 print:max-w-none print:w-full">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-gray-150 pb-6">
                <div>
                  <h2 className="text-base font-extrabold text-blue-600 uppercase tracking-widest">
                    VendorBridge Inc.
                  </h2>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">
                    Supply Contract / Purchase Agreement
                  </p>
                </div>
                <div className="sm:text-right text-xs">
                  <div className="text-lg font-black text-gray-900">{po.poNumber}</div>
                  <div className="text-[10px] text-gray-450 mt-0.5 uppercase tracking-wider font-semibold">
                    Purchase Order Copy
                  </div>
                  <div className="mt-2.5 flex items-center sm:justify-end gap-1.5">
                    <span className="text-gray-400 text-[10px]">Settlement:</span>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                        po.status === "Paid"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : po.status === "Issued"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      {po.status === "Paid" ? "Paid / Cleared" : po.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs border-b border-gray-100 pb-6">
                {/* Org */}
                <div className="space-y-2">
                  <span className="text-[10px] text-gray-405 uppercase tracking-wider font-bold">
                    Purchasing Client (Bill From)
                  </span>
                  <div className="bg-gray-50/50 border border-gray-100 rounded-lg p-4 space-y-1.5">
                    <div className="font-bold text-gray-850 font-sans">VendorBridge Inc.</div>
                    <div className="text-gray-650">Global Supply Center</div>
                    <div className="border-t border-gray-150/50 pt-1.5 mt-1 text-[10px] text-gray-400 space-y-0.5">
                      <div>Contact: {po.createdBy?.firstName} {po.createdBy?.lastName}</div>
                      <div>Email: {po.createdBy?.email}</div>
                    </div>
                  </div>
                </div>

                {/* Vendor profile details */}
                <div className="space-y-2">
                  <span className="text-[10px] text-gray-405 uppercase tracking-wider font-bold">
                    Supplier Partner (Bill To)
                  </span>
                  <div className="bg-gray-50/50 border border-gray-100 rounded-lg p-4 space-y-1.5">
                    <div className="font-bold text-gray-850">{po.vendorId?.companyName}</div>
                    <div className="text-gray-650">Category: {po.vendorId?.category}</div>
                    {po.vendorId?.gstNumber ? (
                      <div className="inline-flex px-1.5 py-0.2 rounded text-[10px] font-bold bg-gray-100 text-gray-650 border border-gray-200">
                        GSTIN: {po.vendorId.gstNumber}
                      </div>
                    ) : (
                      <div className="text-amber-600 text-[10px] font-bold flex items-center gap-0.5">
                        <AlertTriangle size={10} /> Tax Details Missing
                      </div>
                    )}
                    <div className="border-t border-gray-150/50 pt-1.5 mt-1 text-[10px] text-gray-400 space-y-0.5">
                      <div>Email: {po.vendorId?.contactEmail}</div>
                      <div>Phone: {po.vendorId?.contactPhone}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lifecycle Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] text-gray-500 bg-gray-50/40 p-4 rounded-lg border border-gray-100 print:hidden">
                <div className="flex gap-2">
                  <Calendar size={14} className="text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-gray-400 uppercase text-[9px] block">Issue Date</span>
                    <span className="font-medium text-gray-800">
                      {new Date(po.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <FileCheck2 size={14} className="text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-gray-400 uppercase text-[9px] block">Client Ref</span>
                    <span className="font-medium text-gray-800 font-mono">
                      RFQ-{po.rfqId?._id?.substring(18).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Summary Table */}
              <div className="space-y-2">
                <span className="text-[10px] text-gray-450 font-bold uppercase tracking-wider block">
                  Purchased Items & Deliverables
                </span>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-150 bg-gray-50 text-gray-500 font-bold">
                        <th className="py-2.5 px-4 font-semibold">Product Name</th>
                        <th className="py-2.5 px-4 font-semibold text-center w-[80px]">Quantity</th>
                        <th className="py-2.5 px-4 font-semibold text-right w-[120px]">Unit Price</th>
                         <th className="py-2.5 px-4 font-semibold text-right w-[140px]">Line Total (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {po.items.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50/20">
                          <td className="py-3 px-4 font-semibold text-gray-800">{item.productName}</td>
                          <td className="py-3 px-4 text-center text-gray-655 font-medium">{item.quantity}</td>
                          <td className="py-3 px-4 text-right text-gray-700">₹{item.unitPrice.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-bold text-gray-900">₹{item.totalPrice.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="flex justify-end pt-4">
                <div className="w-full sm:w-[320px] bg-gray-50/50 border border-gray-150/60 rounded-xl p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-gray-500">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-gray-800">₹{po.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500">
                    <span>Estimated GST ({po.taxRate}%):</span>
                    <span className="font-semibold text-gray-855">₹{po.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200/80 pt-2 flex justify-between items-center text-sm font-bold text-gray-900">
                    <span>Grand Total Value:</span>
                    <span>
                      ₹{po.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="text-[10px] text-center text-gray-400 border-t border-gray-100 pt-6 leading-relaxed">
                This document is a formal sequential purchase order generated inside the VendorBridge ERP system following manager authorization. Payment settlements via Razorpay are routed in standard conversion parameters. For support contact supply@vendorbridge.com.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
