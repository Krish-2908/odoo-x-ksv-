import { Button } from "@/components/ui/button";
import { Clock, FileText, CheckCircle2, Edit2, AlertTriangle } from "lucide-react";

interface QuotationItem {
  productId: string;
  productName: string;
  unitPrice: number;
  totalPrice: number;
}

interface Quotation {
  _id: string;
  grandTotal: number;
  deliveryTimeline: string;
  notes: string;
  status: string;
  pricingDetails: QuotationItem[];
  updatedAt: string;
}

interface QuotationReceiptProps {
  quotation: Quotation;
  onEdit: () => void;
  isExpired: boolean;
}

export default function QuotationReceipt({
  quotation,
  onEdit,
  isExpired,
}: QuotationReceiptProps) {
  const getStatusBadge = (status: string) => {
    const style = {
      Submitted: "bg-blue-50 text-blue-700 border-blue-200",
      Revised: "bg-indigo-50 text-indigo-700 border-indigo-200",
      Selected: "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold",
      Rejected: "bg-red-50 text-red-700 border-red-200",
    }[status] || "bg-gray-100 text-gray-700 border-gray-200";

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${style}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <h3 className="text-sm font-bold text-gray-950 flex items-center gap-1.5">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> Quotation Receipt
        </h3>
        {getStatusBadge(quotation.status)}
      </div>

      <div className="text-[11px] text-gray-400">
        Submitted on: {new Date(quotation.updatedAt).toLocaleString()}
      </div>

      {/* Item summary */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold text-gray-500 block uppercase tracking-wider">Priced Lines</span>
        <div className="space-y-2">
          {quotation.pricingDetails.map((item) => (
            <div
              key={item.productId}
              className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between gap-3 text-xs"
            >
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-gray-800 truncate">{item.productName}</div>
                <div className="text-[10px] text-gray-450 mt-0.5">
                  Unit Price: ${item.unitPrice.toFixed(2)}
                </div>
              </div>
              <div className="text-right shrink-0 font-bold text-gray-800">
                ${item.totalPrice.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grand Total */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 flex items-center justify-between text-xs">
        <span className="font-semibold text-blue-800">Grand Total Bid</span>
        <span className="text-sm font-bold text-blue-900">${quotation.grandTotal.toFixed(2)}</span>
      </div>

      {/* Timeline and Notes details */}
      <div className="space-y-3 pt-1 text-xs">
        <div className="flex gap-2 bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
          <Clock size={14} className="text-gray-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-gray-450 text-[10px] uppercase">Delivery Timeline</div>
            <div className="font-semibold text-gray-800 mt-0.5">{quotation.deliveryTimeline}</div>
          </div>
        </div>

        {quotation.notes && (
          <div className="flex gap-2 bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
            <FileText size={14} className="text-gray-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="font-medium text-gray-450 text-[10px] uppercase">Notes / Terms</div>
              <p className="text-gray-700 mt-0.5 whitespace-pre-wrap leading-normal break-words">
                {quotation.notes}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-gray-100 pt-3">
        {isExpired ? (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-2.5 flex items-start gap-2 text-[10px] leading-relaxed">
            <AlertTriangle size={14} className="shrink-0 mt-0.5 text-red-600" />
            <div>
              <span className="font-semibold">RFQ Submission Expired:</span> Bidding is closed. You can no longer modify or revise this quotation.
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={onEdit}
            className="w-full text-xs h-8 border-blue-200 text-blue-600 hover:bg-blue-50 gap-1.5"
          >
            <Edit2 size={12} /> Revise Proposal
          </Button>
        )}
      </div>
    </div>
  );
}
