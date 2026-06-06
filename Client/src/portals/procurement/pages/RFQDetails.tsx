import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar, { type NavItem } from "@/components/shared/Navbar";
import BidComparison from "../components/BidComparison";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Building2,
  AlertCircle,
  Play,
  Trash2,
  Clock,
  User,
  ShoppingBag,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/procurement" },
  { label: "Vendors", path: "/procurement/vendors" },
  { label: "RFQs", path: "/procurement/rfqs", active: true },
  { label: "Quotations", path: "/procurement/quotations" },
  { label: "Purchase Orders", path: "/procurement/purchase-orders" },
  { label: "Reports", path: "/procurement/reports" },
];

export default function RFQDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [rfq, setRfq] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "comparison">("overview");
  const [quotations, setQuotations] = useState<any[]>([]);
  const [quotationsLoading, setQuotationsLoading] = useState(true);

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
      fetchRFQDetails(token);
      fetchQuotations(token);
    } catch {
      navigate("/login");
    }
  }, [navigate, id]);

  const fetchRFQDetails = async (token: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/rfqs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.status === 200 && data.success) {
        setRfq(data.rfq);
      } else {
        setServerError(data.message || "Failed to load RFQ details.");
      }
    } catch (err) {
      setServerError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotations = async (token: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/quotations/rfq/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.status === 200 && data.success) {
        setQuotations(data.quotations);
      }
    } catch (err) {
      console.error("Failed to load quotations:", err);
    } finally {
      setQuotationsLoading(false);
    }
  };

  const handleSelectBid = async (quotationId: string, remarks?: string) => {
    setActionLoading(true);
    setServerError("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/api/rfqs/${id}/select-bid`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quotationId, remarks }),
      });
      const data = await res.json();
      if (res.status === 200 && data.success) {
        setRfq(data.rfq);
        if (token) {
          await fetchQuotations(token);
        }
      } else {
        setServerError(data.message || "Failed to submit bid selection.");
      }
    } catch (err) {
      setServerError("Network error. Could not submit selection.");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    setServerError("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:8000/api/rfqs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "Open" }),
      });

      const data = await res.json();
      if (res.status === 200 && data.success) {
        setRfq(data.rfq);
      } else {
        setServerError(data.message || "Failed to publish RFQ.");
      }
    } catch (err) {
      setServerError("Network error. Could not publish.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this draft RFQ?")) return;
    if (actionLoading) return;
    setActionLoading(true);
    setServerError("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:8000/api/rfqs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.status === 200 && data.success) {
        navigate("/procurement/rfqs");
      } else {
        setServerError(data.message || "Failed to delete RFQ.");
      }
    } catch (err) {
      setServerError("Network error. Could not delete.");
    } finally {
      setActionLoading(false);
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
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold border ${style}`}>
        {status}
      </span>
    );
  };

  if (!user) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Navbar user={user} navItems={NAV_ITEMS} onNavigate={handleNavbarNavigate} />

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-5 py-8 space-y-6">
        {/* Breadcrumb / Actions Row */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/procurement/rfqs")}
            className="text-gray-500 hover:text-gray-900 gap-1.5 h-8 px-2"
          >
            <ArrowLeft size={15} /> Back to RFQs
          </Button>

          {rfq && rfq.status === "Draft" && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePublish}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3 gap-1 shadow-sm font-semibold"
              >
                <Play size={13} fill="white" /> Publish RFQ
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={actionLoading}
                className="text-red-600 hover:bg-red-50 hover:text-red-700 text-xs h-8 px-3 gap-1 border-red-200"
              >
                <Trash2 size={13} /> Delete Draft
              </Button>
            </div>
          )}
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>{serverError}</div>
          </div>
        )}

        {/* Action Banners */}
        {rfq && rfq.status === "Under Review" && rfq.approvalStatus === "Pending Approval" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-amber-800 shadow-sm">
            <Clock size={16} className="text-amber-600 shrink-0 mt-0.5 animate-spin" style={{ animationDuration: '4s' }} />
            <div>
              <span className="font-bold">Pending Manager Review:</span> This solicitation has been submitted for approval. Purchase Order generation is locked until manager sign-off is completed.
            </div>
          </div>
        )}

        {rfq && rfq.approvalStatus === "Rejected" && (
          <div className="bg-red-50 border border-red-205 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-red-800 shadow-sm">
            <AlertCircle size={16} className="text-red-650 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Procurement Proposal Rejected:</span> The manager rejected the submitted bid proposal. Rejection remarks:
              <p className="mt-1 font-semibold italic">
                "{rfq.approvalTimeline.filter((t: any) => t.action === 'Reject').slice(-1)[0]?.remarks || 'No remarks provided.'}"
              </p>
              Please review competing vendor offers in the comparison matrix and award a different bid.
            </div>
          </div>
        )}

        {rfq && rfq.approvalStatus === "Approved" && (
          <div className="bg-emerald-50 border border-emerald-250 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-emerald-800 shadow-sm">
            <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Proposal Approved:</span> The manager approved the selected bid. You are now cleared to generate the Purchase Order.
            </div>
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-20 flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            <span className="text-sm text-gray-500">Retrieving solicitation details...</span>
          </div>
        ) : !rfq ? (
          <div className="bg-white border border-gray-200 rounded-xl p-16 text-center text-gray-500">
            RFQ data is unavailable.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content (2 columns wide) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tab Selector */}
              {rfq.status !== "Draft" && (
                <div className="flex border-b border-gray-200 gap-4 mb-2">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`pb-2.5 text-xs font-bold transition-all relative ${
                      activeTab === "overview"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-400 hover:text-gray-800"
                    }`}
                  >
                    RFQ Overview
                  </button>
                  <button
                    onClick={() => setActiveTab("comparison")}
                    className={`pb-2.5 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
                      activeTab === "comparison"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-400 hover:text-gray-800"
                    }`}
                  >
                    Bid Comparison
                    {quotations.length > 0 && (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-100 text-blue-800">
                        {quotations.length}
                      </span>
                    )}
                  </button>
                </div>
              )}

              {activeTab === "overview" ? (
                <>
                  {/* RFQ Meta Info Card */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                      <div>
                        <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-0.5">RFQ Detail Sheet</div>
                        <h1 className="text-lg font-bold text-gray-900">{rfq.title}</h1>
                      </div>
                      <div className="self-start sm:self-auto">{getStatusBadge(rfq.status)}</div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-100 p-3 rounded-lg">
                        <User size={16} className="text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-500">Created By</div>
                          <div className="font-semibold text-gray-900 mt-0.5">
                            {rfq.createdBy.firstName} {rfq.createdBy.lastName}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-100 p-3 rounded-lg">
                        <Calendar size={16} className="text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-500">Submission Deadline</div>
                          <div className="font-semibold text-gray-900 mt-0.5">
                            {new Date(rfq.deadline).toLocaleString([], {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <h3 className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                        <FileText size={13} /> Detailed Description
                      </h3>
                      <div className="text-sm text-gray-700 bg-gray-50/50 border border-gray-100 p-4 rounded-lg leading-relaxed whitespace-pre-wrap">
                        {rfq.description || "No description provided."}
                      </div>
                    </div>
                  </div>

                  {/* Items Card List */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
                    <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                      <ShoppingBag size={16} className="text-blue-600" /> Requested Items ({rfq.items.length})
                    </h2>

                    <div className="divide-y divide-gray-150">
                      {rfq.items.map((item: any, index: number) => (
                        <div key={item._id || index} className={`py-4 flex items-start gap-4 ${index === 0 ? "pt-1" : ""}`}>
                          <div className="h-8 w-8 rounded bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-gray-950 flex flex-wrap items-center gap-x-2 gap-y-1">
                              {item.productName}
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-gray-100 border border-gray-200 text-gray-650">
                                Qty: {item.quantity}
                              </span>
                            </div>
                            {item.specs && (
                              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed bg-gray-50 border border-gray-150 p-2.5 rounded-lg">
                                <span className="font-semibold text-gray-600">Specs:</span> {item.specs}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  {quotationsLoading ? (
                    <div className="bg-white border border-gray-200 rounded-xl p-20 flex flex-col items-center justify-center gap-3">
                      <div className="h-6 w-6 rounded-full border border-blue-600 border-t-transparent animate-spin" />
                      <span className="text-xs text-gray-400">Comparing proposal lines...</span>
                    </div>
                  ) : (
                    <BidComparison
                      rfq={rfq}
                      quotations={quotations}
                      onSelect={handleSelectBid}
                      actionLoading={actionLoading}
                    />
                  )}
                </div>
              )}
            </div>


            {/* Sidebar (1 column wide) */}
            <div className="space-y-6">
              {/* Assigned Vendors Profile List */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                    <Building2 size={16} className="text-blue-600" /> Assigned Vendors
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    {rfq.assignedVendors.length} supplier(s) invited to bid.
                  </p>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {rfq.assignedVendors.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-400">No vendors assigned.</div>
                  ) : (
                    rfq.assignedVendors.map((vendor: any) => (
                      <div
                        key={vendor._id}
                        className="p-3 rounded-lg border border-gray-100 bg-gray-50/50 flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-800 truncate max-w-[170px]">
                            {vendor.companyName}
                          </span>
                          <span className="text-[10px] font-medium text-gray-500">
                            ⭐ {vendor.rating.toFixed(1)}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium">
                          Category: {vendor.category || "Unassigned"}
                        </div>
                        <div className="border-t border-gray-150/50 pt-1.5 mt-0.5 flex flex-col gap-1 text-[10px] text-gray-500">
                          <div>📧 {vendor.contactEmail}</div>
                          <div>📞 {vendor.contactPhone}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Status / Log Info */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 shadow-sm text-xs">
                <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5 border-b border-gray-100 pb-2">
                  <Clock size={14} className="text-gray-400" /> Lifecycle Auditing
                </h3>
                <div className="space-y-3 pt-1.5">
                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-800">Draft Created</span>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(rfq.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {rfq.status !== "Draft" && (
                    <div className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                      <div>
                        <span className="font-semibold text-gray-800">Published (Open for Bids)</span>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(rfq.updatedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
        <span className="text-sm text-gray-500">Loading solicitation sheet…</span>
      </div>
    </div>
  );
}
