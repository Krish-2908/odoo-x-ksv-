import { Button } from "@/components/ui/button";
import { Check, AlertTriangle, Star, Clock, FileText } from "lucide-react";
import { useState } from "react";

interface RFQ {
  _id: string;
  title: string;
  status: string;
  items: Array<{
    _id: string;
    productName: string;
    quantity: number;
    specs?: string;
  }>;
}

interface Vendor {
  _id: string;
  companyName: string;
  category: string;
  gstNumber: string;
  contactEmail: string;
  contactPhone: string;
  rating: number;
}

interface QuotationItem {
  productId: string;
  productName: string;
  unitPrice: number;
  totalPrice: number;
}

interface Quotation {
  _id: string;
  rfqId: string;
  vendorId: Vendor;
  pricingDetails: QuotationItem[];
  grandTotal: number;
  deliveryTimeline: string;
  notes: string;
  status: string;
  updatedAt: string;
}

interface BidComparisonProps {
  rfq: RFQ;
  quotations: Quotation[];
  onSelect: (quotationId: string, remarks?: string) => Promise<void>;
  actionLoading: boolean;
}

export default function BidComparison({
  rfq,
  quotations,
  onSelect,
  actionLoading,
}: BidComparisonProps) {
  const [remarks, setRemarks] = useState("");
  const [confirmingSelection, setConfirmingSelection] = useState<string | null>(null);

  if (!quotations || quotations.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-16 text-center shadow-sm">
        <div className="h-12 w-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600 mb-3">
          <Clock size={20} className="animate-pulse" />
        </div>
        <h3 className="text-sm font-bold text-gray-950">Awaiting Bid Submissions</h3>
        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
          No proposals have been received yet. Once assigned vendors submit their unit pricing and schedules, they will populate here side-by-side.
        </p>
      </div>
    );
  }

  // Parse timeline to compare duration (in days)
  const parseTimelineToDays = (timeline: string): number => {
    const match = timeline.match(/\d+/);
    if (!match) return 99999;
    const num = parseInt(match[0], 10);
    const lower = timeline.toLowerCase();
    if (lower.includes("week")) return num * 7;
    if (lower.includes("month")) return num * 30;
    return num;
  };

  // Find lowest price bid (bids are pre-sorted by backend, but let's confirm)
  const lowestPriceBid = [...quotations].sort((a, b) => a.grandTotal - b.grandTotal)[0];

  // Find fastest delivery bid
  const fastestDeliveryBid = [...quotations].sort((a, b) => {
    return parseTimelineToDays(a.deliveryTimeline) - parseTimelineToDays(b.deliveryTimeline);
  })[0];

  const handleSelectClick = (qId: string) => {
    setConfirmingSelection(qId);
  };

  const handleConfirmSubmit = async () => {
    if (!confirmingSelection) return;
    await onSelect(confirmingSelection, remarks.trim());
    setConfirmingSelection(null);
    setRemarks("");
  };

  return (
    <div className="space-y-6">
      {/* Cards comparison grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quotations.map((quote) => {
          const isLowest = quote._id === lowestPriceBid._id;
          const isFastest = quote._id === fastestDeliveryBid._id;
          const isSelected = quote.status === "Selected";

          const cardBorders = isSelected
            ? "border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/10"
            : isLowest
            ? "border-emerald-300 shadow-sm shadow-emerald-50"
            : isFastest
            ? "border-blue-300 shadow-sm shadow-blue-50"
            : "border-gray-200";

          return (
            <div
              key={quote._id}
              className={`bg-white border rounded-xl p-5 flex flex-col justify-between transition-all relative ${cardBorders}`}
            >
              {/* Highlights badges */}
              <div className="absolute top-4 right-4 flex flex-wrap gap-1 justify-end max-w-[50%]">
                {isSelected && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Award Winner
                  </span>
                )}
                {isLowest && !isSelected && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Lowest Price
                  </span>
                )}
                {isFastest && !isSelected && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Fastest Delivery
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {/* Vendor Header */}
                <div>
                  <h4 className="text-sm font-bold text-gray-950 truncate max-w-[65%]">
                    {quote.vendorId.companyName}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-gray-500 font-medium">
                      Category: {quote.vendorId.category || "General"}
                    </span>
                    <span className="text-gray-300 text-[10px]">•</span>
                    <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                      <Star size={10} fill="currentColor" /> {quote.vendorId.rating.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Scorecard Pricing */}
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-medium uppercase">Bid Total</span>
                    <span className="text-base font-black text-gray-900">
                      ₹{quote.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-medium uppercase">Delivery</span>
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1 mt-1">
                      <Clock size={12} className="text-gray-400" /> {quote.deliveryTimeline}
                    </span>
                  </div>
                </div>

                {/* Notes if any */}
                {quote.notes && (
                  <div className="text-[11px] text-gray-600 bg-gray-50/50 p-2.5 rounded border border-gray-150 leading-relaxed max-h-[80px] overflow-y-auto">
                    <span className="font-semibold text-gray-700 flex items-center gap-1 mb-0.5">
                      <FileText size={10} /> Remarks:
                    </span>
                    {quote.notes}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-gray-100">
                {rfq.status === "Open" || rfq.status === "Closed" ? (
                  confirmingSelection === quote._id ? (
                    <div className="space-y-3 pt-1">
                      <div className="space-y-1">
                        <textarea
                          placeholder="Add approval request remarks (optional)..."
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          className="w-full text-xs border border-gray-250 rounded p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none bg-white"
                          rows={2}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={actionLoading}
                          onClick={handleConfirmSubmit}
                          className="flex-1 text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                        >
                          Confirm Selection
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmingSelection(null)}
                          className="text-xs h-8 text-gray-500 hover:text-gray-800"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleSelectClick(quote._id)}
                      className="w-full text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm gap-1"
                    >
                      <Check size={12} /> Award Bid & Submit
                    </Button>
                  )
                ) : (
                  <div className="text-[10px] text-center text-gray-400 font-medium py-1.5 bg-gray-50 border border-gray-100 rounded-lg">
                    {isSelected ? "🏆 Selected Proposal" : "Bidding Phase Closed"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Item-by-item price matrix table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h4 className="text-xs font-bold text-gray-905 uppercase tracking-wider">
            Itemized Line Comparison Matrix
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-semibold">
                <th className="py-3 px-4 font-semibold min-w-[200px]">Product / Requirement</th>
                <th className="py-3 px-4 font-semibold text-center w-[80px]">Quantity</th>
                {quotations.map((quote) => (
                  <th key={quote._id} className="py-3 px-4 font-semibold text-right">
                    <span className="block truncate max-w-[150px] font-bold text-gray-800">
                      {quote.vendorId.companyName}
                    </span>
                    <span className="text-[9px] text-gray-400 block font-normal">
                      GSTIN: {quote.vendorId.gstNumber || "Missing"}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rfq.items.map((rfqItem) => (
                <tr key={rfqItem._id} className="hover:bg-gray-50/30">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-gray-850">{rfqItem.productName}</div>
                    {rfqItem.specs && (
                      <div className="text-[10px] text-gray-400 mt-0.5 italic">
                        Specs: {rfqItem.specs}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium text-gray-650">
                    {rfqItem.quantity}
                  </td>
                  {quotations.map((quote) => {
                    const lineBid = quote.pricingDetails.find(
                      (p) => p.productId && p.productId.toString() === rfqItem._id.toString()
                    );
                    const isLowestLine =
                      lineBid &&
                      quotations.every(
                        (other) =>
                          (other.pricingDetails.find(
                            (p) => p.productId && p.productId.toString() === rfqItem._id.toString()
                          )?.unitPrice || 999999) >= lineBid.unitPrice
                      );

                    return (
                      <td key={quote._id} className="py-3.5 px-4 text-right">
                        {lineBid ? (
                          <div>
                            <span
                              className={`font-semibold ${
                                isLowestLine ? "text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-150" : "text-gray-800"
                              }`}
                            >
                              ₹{lineBid.unitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                            <span className="block text-[10px] text-gray-450 mt-1">
                              Total: ₹{lineBid.totalPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-red-500 font-medium italic">Unquoted</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="bg-gray-50/60 font-bold border-t border-gray-200">
                <td className="py-4 px-4 text-sm text-gray-850" colSpan={2}>
                  Grand Total Summary (INR)
                </td>
                {quotations.map((quote) => {
                  const isLowest = quote._id === lowestPriceBid._id;
                  return (
                    <td key={quote._id} className="py-4 px-4 text-right text-sm">
                      <span
                        className={`${
                          isLowest ? "text-emerald-700 font-extrabold" : "text-gray-900"
                        }`}
                      >
                        ₹{quote.grandTotal.toFixed(2)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Disclaimer */}
      {quotations.some((q) => !q.vendorId.gstNumber) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-amber-800 shadow-sm">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Missing Supplier Tax Details:</span> One or more competing vendors do not have a registered GST number on their business profile. While you can submit selections for review, valid tax details must be configured by the winning vendor before formal purchase order templates can compile.
          </div>
        </div>
      )}
    </div>
  );
}
