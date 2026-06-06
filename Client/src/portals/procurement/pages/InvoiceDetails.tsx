import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar, { type NavItem } from "@/components/shared/Navbar";
import {
  ArrowLeft,
  Printer,
  CreditCard,
  Mail,
  Download,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/procurement" },
  { label: "Vendors", path: "/procurement/vendors" },
  { label: "RFQs", path: "/procurement/rfqs" },
  { label: "Quotations", path: "/procurement/quotations" },
  { label: "Purchase Orders", path: "/procurement/purchase-orders" },
  { label: "Invoices", path: "/procurement/invoices", active: true },
  { label: "Reports", path: "/procurement/reports" },
];

export default function InvoiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");

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
      fetchInvoiceDetails(token);
    } catch {
      navigate("/login");
    }
  }, [navigate, id]);

  const fetchInvoiceDetails = async (token: string) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:8000/api/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.status === 200 && data.success) {
        setInvoice(data.invoice);
      } else {
        setServerError(data.message || "Failed to load invoice details.");
      }
    } catch (err) {
      setServerError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async () => {
    setActionLoading(true);
    setServerError("");
    const token = localStorage.getItem("token");

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setServerError("Failed to load Razorpay SDK. Check connection.");
        setActionLoading(false);
        return;
      }

      const orderRes = await fetch(`http://localhost:8000/api/invoices/${id}/razorpay-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const orderData = await orderRes.json();
      if (orderRes.status !== 200 || !orderData.success) {
        setServerError(orderData.message || "Could not generate Razorpay order.");
        setActionLoading(false);
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "VendorBridge ERP",
        description: orderData.description,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            setActionLoading(true);
            const verifyRes = await fetch(`http://localhost:8000/api/invoices/${id}/verify-payment`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.status === 200 && verifyData.success) {
              setInvoice(verifyData.invoice);
              alert("Invoice transaction cleared and paid successfully!");
            } else {
              setServerError(verifyData.message || "Signature validation failed.");
            }
          } catch {
            setServerError("Confirmation check failed.");
          } finally {
            setActionLoading(false);
          }
        },
        prefill: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
        },
        theme: {
          color: "#2563EB",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      setServerError("Transaction process crashed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendEmail = async () => {
    setActionLoading(true);
    setServerError("");
    setEmailSuccess("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:8000/api/invoices/${id}/send-email`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.status === 200 && data.success) {
        setInvoice(data.invoice);
        setEmailSuccess(data.message);
      } else {
        setServerError(data.message || "Failed to dispatch email.");
      }
    } catch (err) {
      setServerError("Email trigger failed due to network errors.");
    } finally {
      setActionLoading(false);
    }
  };

  const generatePDF = () => {
    if (!invoice) return;

    const doc = new jsPDF();

    // Layout Helpers
    let y = 20;

    // Brand Header
    doc.setFillColor(15, 37, 68); // #0f2544
    doc.rect(0, 0, 210, 8, "F");

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235); // #2563eb
    doc.text("VendorBridge Inc.", 15, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Procurement & Contract Center", 15, y + 5);

    // Document Identifier
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(15, 37, 68);
    doc.text(invoice.invoiceNumber, 195, y, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`PO Ref: ${invoice.purchaseOrderId?.poNumber || "N/A"}`, 195, y + 5, { align: "right" });
    doc.text(`Status: ${invoice.status}`, 195, y + 10, { align: "right" });

    y += 25;

    // Billing details boxes
    doc.setDrawColor(226, 232, 240); // borderGray
    doc.setFillColor(248, 250, 252); // lightGray
    
    // Org box
    doc.rect(15, y, 85, 40, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text("Bill From / Buyer:", 20, y + 7);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 37, 68);
    doc.text("VendorBridge Inc.", 20, y + 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text("Global Supply Center", 20, y + 21);
    doc.text(`Email: supply@vendorbridge.com`, 20, y + 33);

    // Vendor box
    doc.rect(110, y, 85, 40, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text("Bill To / Supplier Partner:", 115, y + 7);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 37, 68);
    doc.text(invoice.vendorId?.companyName || "N/A", 115, y + 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Category: ${invoice.vendorId?.category || "General"}`, 115, y + 21);
    doc.text(`GSTIN: ${invoice.vendorId?.gstNumber || "Unregistered"}`, 115, y + 27);
    doc.text(`Phone: ${invoice.vendorId?.contactPhone || "N/A"}`, 115, y + 33);

    y += 50;

    // Timeline row
    doc.setFillColor(248, 250, 252);
    doc.rect(15, y, 180, 10, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Billed Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 20, y + 6.5);
    doc.text(`Payment Due: ${new Date(invoice.dueDate).toLocaleDateString()}`, 115, y + 6.5);

    y += 20;

    // Table Header
    doc.setFillColor(15, 37, 68);
    doc.rect(15, y, 180, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("Product Description", 20, y + 5.5);
    doc.text("Qty", 110, y + 5.5, { align: "center" });
    doc.text("Unit Price", 145, y + 5.5, { align: "right" });
    doc.text("Total (INR)", 190, y + 5.5, { align: "right" });

    y += 8;
    
    // Table Rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(15, 37, 68);

    invoice.items.forEach((item: any) => {
      // Draw grid bottom border
      doc.setDrawColor(241, 245, 249);
      doc.line(15, y + 8, 195, y + 8);

      doc.text(item.productName, 20, y + 5.5);
      doc.text(item.quantity.toString(), 110, y + 5.5, { align: "center" });
      doc.text(`Rs. ${item.unitPrice.toFixed(2)}`, 145, y + 5.5, { align: "right" });
      doc.text(`Rs. ${item.totalPrice.toFixed(2)}`, 190, y + 5.5, { align: "right" });
      
      y += 8;
    });

    y += 10;

    // Totals grid
    doc.setDrawColor(226, 232, 240);
    doc.line(120, y, 195, y);

    y += 5;
    doc.setFont("helvetica", "normal");
    doc.text("Subtotal:", 145, y, { align: "right" });
    doc.text(`Rs. ${invoice.subtotal.toFixed(2)}`, 190, y, { align: "right" });

    y += 6;
    doc.text(`Estimated GST (${invoice.taxRate}%):`, 145, y, { align: "right" });
    doc.text(`Rs. ${invoice.taxAmount.toFixed(2)}`, 190, y, { align: "right" });

    y += 8;
    doc.setDrawColor(15, 37, 68);
    doc.line(120, y, 195, y);

    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Grand Total:", 145, y, { align: "right" });
    doc.text(`Rs. ${invoice.grandTotal.toFixed(2)}`, 190, y, { align: "right" });

    // Payment details if paid
    if (invoice.status === "Paid") {
      y += 15;
      doc.setFillColor(240, 253, 244); // light green
      doc.rect(15, y, 180, 15, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(21, 128, 61); // emerald green
      doc.text(`Payment Settlement Cleared & Verified`, 20, y + 6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`Razorpay Payment ID: ${invoice.razorpayPaymentId}`, 20, y + 11);
    }

    // Disclaimer
    y = 275;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "This document is a formal system-generated Tax Invoice. Settlement is completed digitally.",
      105,
      y,
      { align: "center" }
    );

    doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
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
            onClick={() => navigate("/procurement/invoices")}
            className="text-gray-500 hover:text-gray-900 gap-1.5 h-8 px-2"
          >
            <ArrowLeft size={15} /> Back to Directory
          </Button>

          {invoice && (
            <div className="flex items-center gap-2">
              {invoice.status === "Unpaid" && (
                <Button
                  onClick={handleRazorpayPayment}
                  disabled={actionLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3.5 gap-1.5 shadow-sm font-semibold"
                >
                  <CreditCard size={14} /> Pay with Razorpay (INR)
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleSendEmail}
                disabled={actionLoading}
                className="text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-gray-200 text-xs h-8 px-3.5 gap-1.5 font-semibold"
              >
                <Mail size={14} /> Email Vendor
              </Button>
              <Button
                variant="outline"
                onClick={generatePDF}
                className="text-gray-700 hover:bg-gray-50 border-gray-200 text-xs h-8 px-3.5 gap-1.5 font-semibold"
              >
                <Download size={14} /> Download PDF
              </Button>
              <Button
                variant="outline"
                onClick={handlePrint}
                className="text-gray-700 hover:bg-gray-50 border-gray-200 text-xs h-8 px-3.5 gap-1.5 font-semibold"
              >
                <Printer size={14} /> Print layout
              </Button>
            </div>
          )}
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 text-sm print:hidden">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>{serverError}</div>
          </div>
        )}

        {emailSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-start gap-2 text-sm print:hidden">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600" />
            <div>{emailSuccess}</div>
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-20 flex flex-col items-center justify-center gap-3 print:hidden">
            <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            <span className="text-sm text-gray-500">Compiling invoice parameters...</span>
          </div>
        ) : !invoice ? (
          <div className="bg-white border border-gray-200 rounded-xl p-16 text-center text-gray-500 print:hidden">
            Invoice record is unavailable.
          </div>
        ) : (
          <div className="space-y-6 print:space-y-0">
            {/* Status alerts */}
            {invoice.status === "Paid" && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-emerald-800 shadow-sm print:hidden">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Transaction Paid & Cleared:</span> The invoice has been successfully verified via the Razorpay payment gateway.
                  <div className="mt-1 font-semibold text-[10px] text-emerald-700 font-mono">
                    Payment ID: {invoice.razorpayPaymentId}
                  </div>
                </div>
              </div>
            )}

            {invoice.emailSent && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-blue-800 shadow-sm print:hidden">
                <Mail size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Invoice Dispatched:</span> A copy of this tax invoice was emailed to the vendor contact on <span className="font-semibold">{new Date(invoice.emailSentAt).toLocaleString()}</span>.
                </div>
              </div>
            )}

            {/* Document sheet container */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 max-w-4xl mx-auto space-y-8 print:border-0 print:shadow-none print:p-0 print:max-w-none print:w-full">
              {/* Document Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-gray-150 pb-6">
                <div>
                  <h2 className="text-base font-extrabold text-blue-600 uppercase tracking-widest">
                    VendorBridge Inc.
                  </h2>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">
                    Procurement & Contract Center
                  </p>
                </div>
                <div className="sm:text-right text-xs">
                  <div className="text-lg font-black text-gray-900">{invoice.invoiceNumber}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider font-semibold">
                    Tax Invoice Receipt
                  </div>
                  <div className="mt-2.5 flex items-center sm:justify-end gap-1.5">
                    <span className="text-gray-450 text-[10px]">Status:</span>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                        invoice.status === "Paid"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : invoice.status === "Unpaid"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Addresses section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs border-b border-gray-100 pb-6">
                {/* Purchaser info */}
                <div className="space-y-2">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                    Purchasing Client (Bill From)
                  </span>
                  <div className="bg-gray-50/50 border border-gray-100 rounded-lg p-4 space-y-1.5">
                    <div className="font-bold text-gray-850">VendorBridge Inc.</div>
                    <div className="text-gray-650">Global Supply Center</div>
                    <div className="border-t border-gray-150/50 pt-1.5 mt-1 text-[10px] text-gray-450 space-y-0.5">
                      <div>Support: supply@vendorbridge.com</div>
                      <div>Ref PO: {invoice.purchaseOrderId?.poNumber}</div>
                    </div>
                  </div>
                </div>

                {/* Vendor info */}
                <div className="space-y-2">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                    Awarded Vendor (Bill To)
                  </span>
                  <div className="bg-gray-50/50 border border-gray-100 rounded-lg p-4 space-y-1.5">
                    <div className="font-bold text-gray-850">{invoice.vendorId?.companyName}</div>
                    <div className="text-gray-650">Category: {invoice.vendorId?.category || "General Supply"}</div>
                    {invoice.vendorId?.gstNumber ? (
                      <div className="inline-flex px-1.5 py-0.2 rounded text-[10px] font-bold bg-gray-100 text-gray-650 border border-gray-200">
                        GSTIN: {invoice.vendorId.gstNumber}
                      </div>
                    ) : (
                      <div className="text-red-500 text-[10px] font-bold flex items-center gap-0.5">
                        <AlertTriangle size={10} /> GSTIN Not Registered
                      </div>
                    )}
                    <div className="border-t border-gray-150/50 pt-1.5 mt-1 text-[10px] text-gray-450 space-y-0.5">
                      <div>Email: {invoice.vendorId?.contactEmail}</div>
                      <div>Phone: {invoice.vendorId?.contactPhone}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit timelines */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] text-gray-500 bg-gray-50/40 p-4 rounded-lg border border-gray-100 print:hidden">
                <div className="flex gap-2">
                  <Calendar size={14} className="text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-gray-400 uppercase text-[9px] block">Invoice Date</span>
                    <span className="font-medium text-gray-800">
                      {new Date(invoice.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <FileCheck2 size={14} className="text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-gray-400 uppercase text-[9px] block">Payment Due Date</span>
                    <span className="font-medium text-red-600 font-semibold">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <span className="text-[10px] text-gray-450 font-bold uppercase tracking-wider block">
                  Billed Items Grid
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
                      {invoice.items.map((item: any, idx: number) => (
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

              {/* Summary Calculations */}
              <div className="flex justify-end pt-4">
                <div className="w-full sm:w-[320px] bg-gray-50/50 border border-gray-150/60 rounded-xl p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-gray-500">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-gray-800">₹{invoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500">
                    <span>Estimated GST ({invoice.taxRate}%):</span>
                    <span className="font-semibold text-gray-800">₹{invoice.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200/80 pt-2 flex justify-between items-center text-sm font-bold text-gray-900">
                    <span>Grand Total:</span>
                    <span>
                      ₹{invoice.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Print Disclaimer */}
              <div className="text-[10px] text-center text-gray-400 border-t border-gray-100 pt-6 leading-relaxed">
                This document is a formal sequential tax invoice generated inside the VendorBridge ERP system following manager authorization. Payment settlements via Razorpay are routed in standard conversion parameters.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
