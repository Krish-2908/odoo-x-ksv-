import { Clock, CheckCircle2, ShieldAlert } from "lucide-react";

interface ProfileStatusProps {
  status: string;
}

export default function ProfileStatus({ status }: ProfileStatusProps) {
  const config = {
    "Pending Verification": {
      bg: "bg-amber-50/75 border-amber-250",
      text: "text-amber-800",
      iconColor: "text-amber-500",
      icon: Clock,
      title: "Profile Pending Verification",
      desc: "Your vendor profile is awaiting administrative review. Procurement officers can see your business and assign RFQs, but account activation is required before purchase orders can be generated.",
    },
    Active: {
      bg: "bg-emerald-50/75 border-emerald-250",
      text: "text-emerald-800",
      iconColor: "text-emerald-500",
      icon: CheckCircle2,
      title: "Vendor Account Active",
      desc: "Your profile is fully verified and active. You are authorized to receive RFQ invitations, submit competitive quotes, and receive purchase orders.",
    },
    Suspended: {
      bg: "bg-red-50/75 border-red-250",
      text: "text-red-800",
      iconColor: "text-red-500",
      icon: ShieldAlert,
      title: "Account Suspended",
      desc: "Your vendor access has been suspended. You cannot receive new RFQ invitations or bid on active solicitations. Contact system support for resolution.",
    },
  }[status] || {
    bg: "bg-gray-50 border-gray-200",
    text: "text-gray-800",
    iconColor: "text-gray-500",
    icon: Clock,
    title: "Unknown Status",
    desc: "Your account status is currently undefined. Please contact support.",
  };

  const IconComponent = config.icon;

  return (
    <div className={`p-4 rounded-xl border ${config.bg} ${config.text} flex items-start gap-3.5 shadow-sm transition-all`}>
      <div className={`h-9 w-9 rounded-lg bg-white border border-current/10 flex items-center justify-center shrink-0`}>
        <IconComponent size={18} className={config.iconColor} />
      </div>
      <div>
        <h3 className="text-sm font-bold leading-normal">{config.title}</h3>
        <p className="text-xs mt-1 leading-relaxed opacity-90">{config.desc}</p>
      </div>
    </div>
  );
}
