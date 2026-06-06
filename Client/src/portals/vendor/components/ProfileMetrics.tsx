import { Star, ShieldCheck, Building2 } from "lucide-react";

interface ProfileMetricsProps {
  companyName: string;
  category: string;
  rating: number;
  status: string;
}

export default function ProfileMetrics({
  companyName,
  category,
  rating,
  status,
}: ProfileMetricsProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-sm">
      <div className="flex items-center gap-4 min-w-0">
        <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
          <Building2 size={24} />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-gray-950 truncate max-w-[300px]">
            {companyName || "Configure Company Name"}
          </h2>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 border border-gray-250 text-gray-650">
              {category || "Unassigned"}
            </span>
            {status === "Active" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                <ShieldCheck size={12} /> Verified Supplier
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 border-t md:border-t-0 border-gray-100 pt-4 md:pt-0 w-full md:w-auto justify-between md:justify-end shrink-0">
        <div className="text-left md:text-right">
          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Vendor Rating</div>
          <div className="flex items-center gap-1.5 mt-1">
            <Star size={16} fill="#eab308" className="text-yellow-500" />
            <span className="text-lg font-bold text-gray-900">{rating.toFixed(1)}</span>
            <span className="text-xs text-gray-450 mt-0.5">/ 5.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
