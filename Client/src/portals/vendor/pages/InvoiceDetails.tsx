import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar, { type NavItem } from "@/components/shared/Navbar";
import {
  ArrowLeft,
  Printer,
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
  { label: "Dashboard", path: "/vendor" },
  { label: "Open RFQs", path: "/vendor/rfqs" },
  { label: "My Quotations", path: "/vendor/quotations" },
  { label: "Purchase Orders", path: "/vendor/purchase-orders" },
  { label: "Invoices", path: "/vendor/invoices", active: true },
  { label: "My Profile", path: "/vendor/profile" },
];

export default function InvoiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
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

  const generatePDF = () => {
    if (!invoice) return;

    const doc = new jsPDF();
    let y = 20;

    // Brand Header
    doc.setFillColor(15, 37, 68);
    doc.rect(0, 0, 210, 8, "F");

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
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

    // Billing boxes
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    
    // Org
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

    // Vendor
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
    
    // Rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(15, 37, 68);

    invoice.items.forEach((item: any) => {
      doc.setDrawColor(241, 245, 249);
      doc.line(15, y + 8, 195, y + 8);

      doc.text(item.productName, 20, y + 5.5);
      doc.text(item.quantity.toString(), 110, y + 5.5, { align: "center" });
      doc.text(`Rs. ${item.unitPrice.toFixed(2)}`, 145, y + 5.5, { align: "right" });
      doc.text(`Rs. ${item.totalPrice.toFixed(2)}`, 190, y + 5.5, { align: "right" });
      
      y += 8;
    });

    y += 10;

    // Totals
    doc.setDrawColor(226, 232, 240);
    doc.line(120, y, 195, y);

    y += 5;
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

    if (invoice.status === "Paid") {
      y += 15;
      doc.setFillColor(240, 253, 244);
      doc.rect(15, y, 180, 15, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(21, 128, 61);
      doc.text(`Payment Settlement Cleared & Verified`, 20, y + 6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`Razorpay Payment ID: ${invoice.razorpayPaymentId}`, 20, y + 11);
    }

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
            onClick={() => navigate("/vendor/invoices")}
            className="text-gray-500 hover:text-gray-900 gap-1.5 h-8 px-2"
          >
            <ArrowLeft size={15} /> Back to Directory
          </Button>

          {invoice && (
            <div className="flex items-center gap-2">
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
                <Printer size={14} /> Print Invoice
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

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-20 flex flex-col items-center justify-center gap-3 print:hidden">
            <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            <span className="text-sm text-gray-500">Loading invoice details...</span>
          </div>
        ) : !invoice ? (
          <div className="bg-white border border-gray-200 rounded-xl p-16 text-center text-gray-500 print:hidden">
            Invoice copy is unavailable.
          </div>
        ) : (
          <div className="space-y-6 print:space-y-0">
            {/* Status alerts */}
            {invoice.status === "Paid" && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-emerald-800 shadow-sm print:hidden">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Settled / Paid:</span> The client has successfully completed the settlement payment for this invoice.
                  <div className="mt-1 font-semibold text-[10px] text-emerald-700 font-mono">
                    Payment ID: {invoice.razorpayPaymentId}
                  </div>
                </div>
              </div>
            )}

            {/* Document sheet */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 max-w-4xl mx-auto space-y-8 print:border-0 print:shadow-none print:p-0 print:max-w-none print:w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-gray-150 pb-6">
                <div>
                  <h2 className="text-base font-extrabold text-blue-600 uppercase tracking-widest">
                    VendorBridge Inc.
                  </h2>
                  <p className="text-[10px] text-gray-450 mt-1 uppercase font-semibold">
                    Supply Contract / Tax Invoice Copy
                  </p>
                </div>
                <div className="sm:text-right text-xs">
                  <div className="text-lg font-black text-gray-900">{invoice.invoiceNumber}</div>
                  <div className="text-[10px] text-gray-450 mt-0.5 uppercase tracking-wider font-semibold">
                    Invoice Receipt
                  </div>
                  <div className="mt-2.5 flex items-center sm:justify-end gap-1.5">
                    <span className="text-gray-400 text-[10px]">Settlement:</span>
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
                      <div>Email: supply@vendorbridge.com</div>
                      <div>Ref PO: {invoice.purchaseOrderId?.poNumber}</div>
                    </div>
                  </div>
                </div>

                {/* Vendor profile */}
                <div className="space-y-2">
                  <span className="text-[10px] text-gray-405 uppercase tracking-wider font-bold">
                    Supplier Partner (Bill To)
                  </span>
                  <div className="bg-gray-50/50 border border-gray-100 rounded-lg p-4 space-y-1.5">
                    <div className="font-bold text-gray-850">{invoice.vendorId?.companyName}</div>
                    <div className="text-gray-650">Category: {invoice.vendorId?.category}</div>
                    {invoice.vendorId?.gstNumber ? (
                      <div className="inline-flex px-1.5 py-0.2 rounded text-[10px] font-bold bg-gray-100 text-gray-650 border border-gray-200">
                        GSTIN: {invoice.vendorId.gstNumber}
                      </div>
                    ) : (
                      <div className="text-amber-600 text-[10px] font-bold flex items-center gap-0.5">
                        <AlertTriangle size={10} /> Tax Details Missing
                      </div>
                    )}
                    <div className="border-t border-gray-150/50 pt-1.5 mt-1 text-[10px] text-gray-400 space-y-0.5">
                      <div>Email: {invoice.vendorId?.contactEmail}</div>
                      <div>Phone: {invoice.vendorId?.contactPhone}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timelines */}
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
                    <span className="font-medium text-gray-800">
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

              {/* Calculations */}
              <div className="flex justify-end pt-4">
                <div className="w-full sm:w-[320px] bg-gray-50/50 border border-gray-150/60 rounded-xl p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-gray-500">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-gray-850">₹{invoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500">
                    <span>Estimated GST ({invoice.taxRate}%):</span>
                    <span className="font-semibold text-gray-805">₹{invoice.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200/80 pt-2 flex justify-between items-center text-sm font-bold text-gray-900">
                    <span>Grand Total Value:</span>
                    <span>
                      ₹{invoice.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="text-[10px] text-center text-gray-400 border-t border-gray-100 pt-6 leading-relaxed">
                This document is a formal system-generated Tax Invoice. Settlement is completed digitally by the client organization.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
