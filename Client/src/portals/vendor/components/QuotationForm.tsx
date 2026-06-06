import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Clock, FileText, Check } from "lucide-react";

interface RFQItem {
  _id: string;
  productName: string;
  quantity: number;
  specs?: string;
}

interface QuotationFormProps {
  rfqItems: RFQItem[];
  initialValues?: {
    pricingDetails: Array<{ productId: string; unitPrice: number }>;
    deliveryTimeline: string;
    notes: string;
  };
  onSubmit: (pricingDetails: any[], deliveryTimeline: string, notes: string) => Promise<void>;
  submitting: boolean;
}

export default function QuotationForm({
  rfqItems,
  initialValues,
  onSubmit,
  submitting,
}: QuotationFormProps) {
  // Initialize prices mapping (productId -> unitPrice)
  const [prices, setPrices] = useState<Record<string, string>>(() => {
    const initialMap: Record<string, string> = {};
    if (initialValues?.pricingDetails) {
      initialValues.pricingDetails.forEach((item) => {
        initialMap[item.productId] = item.unitPrice.toString();
      });
    } else {
      rfqItems.forEach((item) => {
        initialMap[item._id] = "";
      });
    }
    return initialMap;
  });

  const [deliveryTimeline, setDeliveryTimeline] = useState(
    initialValues?.deliveryTimeline || ""
  );
  const [notes, setNotes] = useState(initialValues?.notes || "");
  const [errors, setErrors] = useState<any>({});

  const handlePriceChange = (productId: string, val: string) => {
    // Basic number format validation (allows empty or decimals)
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      setPrices((prev) => ({ ...prev, [productId]: val }));
    }
  };

  const getLineTotal = (productId: string, quantity: number) => {
    const priceVal = parseFloat(prices[productId]) || 0;
    return Number((priceVal * quantity).toFixed(2));
  };

  const getGrandTotal = () => {
    const total = rfqItems.reduce(
      (sum, item) => sum + getLineTotal(item._id, item.quantity),
      0
    );
    return Number(total.toFixed(2));
  };

  const validate = () => {
    const newErrors: any = {};
    const itemErrors: Record<string, string> = {};

    rfqItems.forEach((item) => {
      const priceStr = prices[item._id];
      if (!priceStr || !priceStr.trim()) {
        itemErrors[item._id] = "Required";
      } else {
        const priceNum = parseFloat(priceStr);
        if (isNaN(priceNum) || priceNum < 0.01) {
          itemErrors[item._id] = "Must be > 0";
        }
      }
    });

    if (Object.keys(itemErrors).length > 0) {
      newErrors.prices = itemErrors;
    }

    if (!deliveryTimeline.trim()) {
      newErrors.deliveryTimeline = "Delivery timeline is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const formattedPricing = rfqItems.map((item) => ({
      productId: item._id,
      unitPrice: parseFloat(prices[item._id]),
    }));

    onSubmit(formattedPricing, deliveryTimeline.trim(), notes.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-250 border-dashed rounded-xl p-5 space-y-5 shadow-sm"
    >
      <div>
        <h3 className="text-sm font-bold text-gray-950 flex items-center gap-2 border-b border-gray-150 pb-2">
          <DollarSign size={16} className="text-blue-600 shrink-0" /> Submit Bid Proposal
        </h3>
        <p className="text-[11px] text-gray-400 mt-1">
          Input your unit pricing and estimated schedule below.
        </p>
      </div>

      {/* Pricing Lines */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold text-gray-700">Line Pricing (INR)</Label>
        <div className="space-y-2.5">
          {rfqItems.map((item) => {
            const hasError = errors.prices && errors.prices[item._id];
            const lineTotal = getLineTotal(item._id, item.quantity);

            return (
              <div
                key={item._id}
                className="p-3 border border-gray-100 rounded-lg bg-gray-50/50 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-800 truncate">{item.productName}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">Quantity: {item.quantity}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-1">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-2 text-xs text-gray-400 font-medium">₹</span>
                    <Input
                      placeholder="Unit Price"
                      value={prices[item._id]}
                      onChange={(e) => handlePriceChange(item._id, e.target.value)}
                      className={`h-8 text-xs pl-6 pr-2 bg-white ${
                        hasError ? "border-red-400 focus-visible:ring-red-400" : "border-gray-200"
                      }`}
                    />
                  </div>
                  <div className="text-right min-w-[70px] shrink-0 text-xs">
                    <span className="text-[10px] text-gray-400 block font-medium">Line Total</span>
                    <span className="font-bold text-gray-800">₹{lineTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grand Total Summary */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 flex items-center justify-between text-xs">
        <span className="font-semibold text-blue-800">Proposal Grand Total</span>
        <span className="text-sm font-bold text-blue-900">₹{getGrandTotal().toFixed(2)}</span>
      </div>

      {/* Timeline details */}
      <div className="space-y-3 pt-1">
        <div className="space-y-1.5">
          <Label
            htmlFor="deliveryTimeline"
            className="text-xs font-semibold text-gray-700 flex items-center gap-1.5"
          >
            <Clock size={13} className="text-gray-400" /> Delivery Timeline
          </Label>
          <Input
            id="deliveryTimeline"
            placeholder="e.g., 5 business days, 2 weeks"
            value={deliveryTimeline}
            onChange={(e) => setDeliveryTimeline(e.target.value)}
            className={`h-9 text-xs ${
              errors.deliveryTimeline
                ? "border-red-400 focus-visible:ring-red-400"
                : "border-gray-200"
            }`}
          />
          {errors.deliveryTimeline && (
            <span className="text-[10px] text-red-500 mt-1 block">
              {errors.deliveryTimeline}
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="notes"
            className="text-xs font-semibold text-gray-700 flex items-center gap-1.5"
          >
            <FileText size={13} className="text-gray-400" /> Additional Notes
          </Label>
          <textarea
            id="notes"
            rows={3}
            placeholder="Provide warranty information, specifications validation, or delivery terms..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-transparent resize-none"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="w-full text-xs h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm gap-1"
      >
        <Check size={14} />
        {submitting ? "Submitting bid proposal..." : initialValues ? "Resubmit Bid Proposal" : "Submit Bid Proposal"}
      </Button>
    </form>
  );
}
