import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar, { type NavItem } from "@/components/shared/Navbar";
import QuotationForm from "../components/QuotationForm";
import QuotationReceipt from "../components/QuotationReceipt";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Clock,
  User,
  ShoppingBag,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/vendor" },
  { label: "Open RFQs", path: "/vendor/rfqs", active: true },
  { label: "My Quotations", path: "/vendor/quotations" },
  { label: "Purchase Orders", path: "/vendor/purchase-orders" },
  { label: "My Profile", path: "/vendor/profile" },
];

export default function RFQDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [rfq, setRfq] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState("");

  // Quotation states
  const [quotation, setQuotation] = useState<any>(null);
  const [quotationLoading, setQuotationLoading] = useState(true);
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [editMode, setEditMode] = useState(false);

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
      fetchRFQDetails(token);
      fetchQuotation(token);
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

  const fetchQuotation = async (token: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/quotations?rfqId=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.status === 200 && data.success && data.quotations.length > 0) {
        setQuotation(data.quotations[0]);
      }
    } catch (err) {
      console.error("Failed to load quotation:", err);
    } finally {
      setQuotationLoading(false);
    }
  };

  const handleQuoteSubmit = async (pricingDetails: any[], deliveryTimeline: string, notes: string) => {
    setSubmittingQuote(true);
    setServerError("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:8000/api/quotations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rfqId: id,
          pricingDetails,
          deliveryTimeline,
          notes,
        }),
      });

      const data = await res.json();
      if (res.status === 200 && data.success) {
        setQuotation(data.quotation);
        setEditMode(false);
      } else {
        setServerError(data.message || "Failed to submit quotation.");
      }
    } catch (err) {
      setServerError("Network error. Could not submit.");
    } finally {
      setSubmittingQuote(false);
    }
  };

  const handleNavbarNavigate = (item: NavItem) => {
    if (item.path) navigate(item.path);
  };

  const getDaysRemaining = (deadlineDate: string) => {
    const diff = new Date(deadlineDate).getTime() - Date.now();
    if (diff <= 0) return { label: "Submission Closed", color: "text-red-700 bg-red-50 border-red-200" };

    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) {
      return { label: `${hours}h remaining`, color: "text-amber-700 bg-amber-50 border-amber-200 font-semibold" };
    }

    const days = Math.floor(hours / 24);
    return { label: `${days} days remaining`, color: "text-blue-700 bg-blue-50 border-blue-200 font-semibold" };
  };

  if (!user) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Navbar user={user} navItems={NAV_ITEMS} onNavigate={handleNavbarNavigate} />

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-5 py-8 space-y-6">
        {/* Back button */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/vendor/rfqs")}
            className="text-gray-500 hover:text-gray-900 gap-1.5 h-8 px-2"
          >
            <ArrowLeft size={15} /> Back to Invitations
          </Button>
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>{serverError}</div>
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-20 flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            <span className="text-sm text-gray-500">Retrieving solicitation sheet...</span>
          </div>
        ) : !rfq ? (
          <div className="bg-white border border-gray-200 rounded-xl p-16 text-center text-gray-500">
            RFQ data is unavailable.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content (2 columns wide) */}
            <div className="lg:col-span-2 space-y-6">
              {/* RFQ Meta Info Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Solicitation Detail</div>
                    <h1 className="text-lg font-bold text-gray-900">{rfq.title}</h1>
                  </div>
                  <div className="self-start sm:self-auto">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
                      Open Invitation
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-100 p-3 rounded-lg">
                    <User size={16} className="text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-500">Procurement Issuer</div>
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
                            Quantity: {item.quantity}
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
            </div>

            {/* Sidebar (Quotation Submission info) */}
            <div className="space-y-6">
              {/* Countdown Tracker */}
              {(() => {
                const countdown = getDaysRemaining(rfq.deadline);
                return (
                  <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 shadow-sm">
                    <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5 border-b border-gray-100 pb-2">
                      <Clock size={14} className="text-gray-400" /> Submission Window
                    </h3>
                    <div className="flex flex-col gap-2 pt-1">
                      <div className={`text-center py-3 rounded-lg border text-sm ${countdown.color}`}>
                        {countdown.label}
                      </div>
                      <p className="text-[11px] text-gray-400 leading-normal text-center">
                        All quotations must be fully submitted before the window closes. Late pricing forms cannot be saved.
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Quotation Bid Submission Area */}
              {quotationLoading ? (
                <div className="bg-white border border-gray-200 rounded-xl p-8 flex items-center justify-center gap-2">
                  <div className="h-4 w-4 rounded-full border border-blue-600 border-t-transparent animate-spin" />
                  <span className="text-[10px] text-gray-400">Checking bid status...</span>
                </div>
              ) : quotation && !editMode ? (
                <QuotationReceipt
                  quotation={quotation}
                  onEdit={() => setEditMode(true)}
                  isExpired={new Date(rfq.deadline) <= new Date()}
                />
              ) : new Date(rfq.deadline) <= new Date() ? (
                <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 shadow-sm text-center">
                  <div className="h-10 w-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto text-red-500">
                    <AlertTriangle size={18} />
                  </div>
                  <h3 className="text-xs font-bold text-gray-955">Submission Period Expired</h3>
                  <p className="text-[10px] text-gray-450 leading-relaxed">
                    This RFQ solicitation has passed its closing deadline. New bid proposals cannot be accepted.
                  </p>
                </div>
              ) : (
                <QuotationForm
                  rfqItems={rfq.items}
                  initialValues={quotation}
                  onSubmit={handleQuoteSubmit}
                  submitting={submittingQuote}
                />
              )}
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
        <span className="text-sm text-gray-500">Loading invitation details…</span>
      </div>
    </div>
  );
}
