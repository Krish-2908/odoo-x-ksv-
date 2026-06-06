import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar, { type NavItem } from "@/components/shared/Navbar";
import {
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Gavel,
  AlertCircle,
  Building2,
  FileText,
  ShoppingBag,
  Star,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", active: true },
  { label: "My Profile", path: "/manager/profile" }
];

export default function ManagerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();

  // Modal / Review state
  const [selectedRfq, setSelectedRfq] = useState<any>(null);
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [alternativesLoading, setAlternativesLoading] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!token || !storedUser) {
      navigate("/login");
      return;
    }
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed.role !== "Manager") {
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
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/rfqs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.status === 200 && data.success) {
        setRfqs(data.rfqs);
      } else {
        setServerError(data.message || "Failed to load requests.");
      }
    } catch (err) {
      setServerError("Network error. Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAlternatives = async (rfqId: string) => {
    const token = localStorage.getItem("token");
    setAlternativesLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/quotations/rfq/${rfqId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.status === 200 && data.success) {
        setAlternatives(data.quotations);
      }
    } catch (err) {
      console.error("Failed to load alternatives:", err);
    } finally {
      setAlternativesLoading(false);
    }
  };

  const handleReviewClick = (rfq: any) => {
    setSelectedRfq(rfq);
    setRemarks("");
    setShowModal(true);
    fetchAlternatives(rfq._id);
  };

  const handleApprove = async () => {
    if (!selectedRfq) return;
    setActionLoading(true);
    setServerError("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/api/rfqs/${selectedRfq._id}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ remarks: remarks.trim() || "Approved." }),
      });
      const data = await res.json();
      if (res.status === 200 && data.success) {
        setShowModal(false);
        setSelectedRfq(null);
        if (token) fetchRFQs(token);
      } else {
        setServerError(data.message || "Approval action failed.");
      }
    } catch (err) {
      setServerError("Network error. Action aborted.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRfq) return;
    if (!remarks.trim()) {
      alert("Please provide rejection remarks/reasons before rejecting.");
      return;
    }
    setActionLoading(true);
    setServerError("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/api/rfqs/${selectedRfq._id}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ remarks: remarks.trim() }),
      });
      const data = await res.json();
      if (res.status === 200 && data.success) {
        setShowModal(false);
        setSelectedRfq(null);
        if (token) fetchRFQs(token);
      } else {
        setServerError(data.message || "Rejection action failed.");
      }
    } catch (err) {
      setServerError("Network error. Action aborted.");
    } finally {
      setActionLoading(false);
    }
  };

  // Compute stats
  const pendingList = rfqs.filter((r) => r.status === "Under Review" && r.approvalStatus === "Pending Approval");
  const approvedList = rfqs.filter((r) => r.approvalStatus === "Approved");
  const rejectedList = rfqs.filter((r) => r.approvalStatus === "Rejected");
  const totalSpend = approvedList.reduce((sum, r) => sum + (r.selectedQuotation?.grandTotal || 0), 0);

  const KPI_CARDS = [
    {
      label: "Pending Approvals",
      value: pendingList.length.toString(),
      sub: "Awaiting your review",
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
    {
      label: "Approved Requests",
      value: approvedList.length.toString(),
      sub: "Cleared purchase orders",
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      label: "Rejected Requests",
      value: rejectedList.length.toString(),
      sub: "Sent back for revision",
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-50",
      border: "border-red-100",
    },
    {
      label: "Total Spend Approved",
      value: `$${totalSpend.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      sub: "Cumulative approved value",
      icon: BarChart3,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
  ];

  if (!user) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Navbar user={user} navItems={NAV_ITEMS} />

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-5 py-8 space-y-7">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <Gavel size={11} /> Manager Portal
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Approval Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Review pending procurement requests, verify item details and competing bids, and sign off.
            </p>
          </div>
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>{serverError}</div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {KPI_CARDS.map(({ label, value, sub, icon: Icon, color, bg, border }) => (
            <div
              key={label}
              className={`bg-white border ${border} rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">{label}</span>
                <div className={`h-9 w-9 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon size={18} className={color} />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-gray-900">{value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Pending approvals section */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900">Pending Review Queue</h2>
            <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
              {pendingList.length} request(s) awaiting approval
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
              <span className="text-sm text-gray-400">Loading queue...</span>
            </div>
          ) : pendingList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                <AlertCircle size={22} className="text-gray-450" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-700">All caught up!</div>
                <p className="text-xs text-gray-400 mt-0.5 max-w-xs">
                  There are no pending procurement requests requiring your authorization at this time.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-150 bg-gray-50/50 text-gray-500 font-bold">
                    <th className="py-3 px-4 font-semibold">RFQ Title / Description</th>
                    <th className="py-3 px-4 font-semibold">Procurement Officer</th>
                    <th className="py-3 px-4 font-semibold">Selected Vendor</th>
                    <th className="py-3 px-4 font-semibold text-right">Selected Bid Total</th>
                    <th className="py-3 px-4 font-semibold text-center">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingList.map((rfq) => {
                    const quote = rfq.selectedQuotation;
                    return (
                      <tr key={rfq._id} className="hover:bg-gray-50/40">
                        <td className="py-4 px-4">
                          <div className="font-semibold text-gray-850">{rfq.title}</div>
                          <div className="text-[10px] text-gray-400 truncate max-w-[200px] mt-0.5">
                            {rfq.description}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-650 font-medium">
                          {rfq.createdBy?.firstName} {rfq.createdBy?.lastName}
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-semibold text-gray-850">
                            {quote?.vendorId?.companyName || "Unconfigured Corp"}
                          </div>
                          <div className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5 mt-0.5">
                            <Star size={10} fill="currentColor" />{" "}
                            {quote?.vendorId?.rating?.toFixed(1) || "5.0"}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-gray-900 text-sm">
                          ${quote?.grandTotal?.toFixed(2) || "0.00"}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Button
                            size="sm"
                            onClick={() => handleReviewClick(rfq)}
                            className="text-xs h-7 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm gap-1"
                          >
                            <Eye size={12} /> Review Bid
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* History / Audit Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Approved Log</h3>
            {approvedList.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">No approved requests yet.</div>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {approvedList.map((r) => (
                  <div key={r._id} className="p-3 border border-emerald-100 bg-emerald-50/10 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-gray-800">{r.title}</span>
                      <span className="block text-[10px] text-gray-400 mt-0.5">
                        Vendor: {r.selectedQuotation?.vendorId?.companyName}
                      </span>
                    </div>
                    <div className="text-right shrink-0 font-bold text-emerald-700">
                      ${r.selectedQuotation?.grandTotal?.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Rejected Log</h3>
            {rejectedList.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">No rejected requests yet.</div>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {rejectedList.map((r) => {
                  const rejectEntry = r.approvalTimeline.filter((t: any) => t.action === "Reject").slice(-1)[0];
                  return (
                    <div key={r._id} className="p-3 border border-red-100 bg-red-50/10 rounded-lg text-xs space-y-1.5">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-gray-800">{r.title}</span>
                        <span className="text-red-600 bg-red-50 px-1.5 py-0.2 rounded border border-red-200 text-[9px]">Rejected</span>
                      </div>
                      {rejectEntry && (
                        <p className="text-[10px] text-gray-500 italic leading-relaxed pl-1.5 border-l border-gray-200 bg-gray-50/50 p-1.5 rounded">
                          Reason: {rejectEntry.remarks}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Review Dialog Modal Overlay */}
      {showModal && selectedRfq && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5 flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] text-gray-450 font-bold uppercase tracking-wider">
                  RFQ Procurement evaluation
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-0.5">{selectedRfq.title}</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-450 hover:text-gray-800 h-8 w-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-5 flex-1">
              {/* Product list */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag size={12} /> Requested Line Items
                </span>
                <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-100 space-y-2 text-xs">
                  {selectedRfq.items.map((item: any, idx: number) => (
                    <div key={item._id || idx} className="flex justify-between items-start border-b border-gray-150/40 pb-2 last:border-0 last:pb-0">
                      <div>
                        <span className="font-semibold text-gray-800">{item.productName}</span>
                        {item.specs && <p className="text-[10px] text-gray-400 mt-0.5">Specs: {item.specs}</p>}
                      </div>
                      <span className="font-bold text-gray-650 shrink-0">Qty: {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected proposal receipt details */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ThumbsUp size={12} className="text-emerald-600" /> Winning Proposal Award Details
                </span>
                <div className="border border-emerald-200 bg-emerald-50/10 rounded-xl p-4 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-2.5">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                        {selectedRfq.selectedQuotation?.vendorId?.companyName || "Vendor Corp"}
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ⭐ {selectedRfq.selectedQuotation?.vendorId?.rating?.toFixed(1) || "5.0"}
                        </span>
                      </h4>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        GSTIN: {selectedRfq.selectedQuotation?.vendorId?.gstNumber || "Missing"} · Category: {selectedRfq.selectedQuotation?.vendorId?.category || "General"}
                      </div>
                    </div>
                    <div className="text-right sm:text-right shrink-0">
                      <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Proposed Bid</span>
                      <span className="text-lg font-black text-gray-900">
                        ${selectedRfq.selectedQuotation?.grandTotal?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="flex gap-2">
                      <Clock size={14} className="text-gray-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold uppercase">Schedule Delivery</span>
                        <span className="font-semibold text-gray-800">{selectedRfq.selectedQuotation?.deliveryTimeline}</span>
                      </div>
                    </div>
                    {selectedRfq.selectedQuotation?.notes && (
                      <div className="flex gap-2">
                        <FileText size={14} className="text-gray-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-gray-400 block font-semibold uppercase">Remarks / Notes</span>
                          <p className="text-gray-700 font-medium leading-relaxed">{selectedRfq.selectedQuotation?.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Alternatives compared list */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={12} /> Competing Proposals Comparison
                </span>
                {alternativesLoading ? (
                  <div className="py-6 text-center text-xs text-gray-400">Loading compared options...</div>
                ) : alternatives.length <= 1 ? (
                  <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-400 text-center">
                    No alternative bids were submitted.
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-bold">
                          <th className="py-2 px-3">Vendor / Supplier Name</th>
                          <th className="py-2 px-3 text-center">Rating</th>
                          <th className="py-2 px-3">Timeline</th>
                          <th className="py-2 px-3 text-right">Grand Total Bid</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {alternatives.map((alt) => {
                          const isSelectedBid = alt._id === selectedRfq.selectedQuotation?._id;
                          return (
                            <tr key={alt._id} className={isSelectedBid ? "bg-emerald-50/20 font-semibold" : "hover:bg-gray-50/30"}>
                              <td className="py-2.5 px-3 flex items-center gap-1.5">
                                {alt.vendorId?.companyName}
                                {isSelectedBid && (
                                  <span className="px-1 rounded text-[8px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold">Selected</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center text-amber-600 font-bold">⭐ {alt.vendorId?.rating?.toFixed(1)}</td>
                              <td className="py-2.5 px-3 text-gray-600">{alt.deliveryTimeline}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-gray-900">${alt.grandTotal?.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Action input remarks */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label htmlFor="remarks" className="text-xs font-semibold text-gray-700 block">
                  Remarks / Review Comments
                </label>
                <textarea
                  id="remarks"
                  placeholder="Enter approval details or rejection reasons here..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none bg-white"
                  rows={3}
                />
                <span className="text-[10px] text-gray-400 leading-normal block">
                  * Note: Review remarks are mandatory when executing a procurement rejection.
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-3 border-t border-gray-100">
              <Button
                disabled={actionLoading}
                onClick={handleApprove}
                className="flex-1 text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-sm"
              >
                <ThumbsUp size={14} /> Approve Request
              </Button>
              <Button
                variant="outline"
                disabled={actionLoading}
                onClick={handleReject}
                className="flex-1 text-xs h-9 border-red-200 text-red-650 hover:bg-red-50 font-semibold gap-1.5"
              >
                <ThumbsDown size={14} /> Reject Request
              </Button>
            </div>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <span className="text-sm text-gray-500">Loading Manager Portal…</span>
      </div>
    </div>
  );
}

function AppFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white py-4 mt-auto">
      <div className="max-w-screen-xl mx-auto px-5 flex items-center justify-between">
        <span className="text-xs text-gray-400">© 2026 VendorBridge · Manager Portal</span>
        <div className="flex items-center gap-4">
          {["Privacy", "Terms", "Support"].map((link) => (
            <a key={link} href="#" className="text-xs text-gray-400 hover:text-gray-600">
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
