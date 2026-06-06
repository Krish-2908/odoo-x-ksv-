import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, Loader2, ShieldCheck, Lock, Users, FileCheck } from "lucide-react";

const PLATFORM_FEATURES = [
  {
    icon: Users,
    title: "Vendor Collaboration",
    desc: "Centralize all vendor communications, RFQs, and quotations.",
  },
  {
    icon: FileCheck,
    title: "Approval Governance",
    desc: "Multi-level, audit-ready approval workflows for every purchase.",
  },
  {
    icon: Lock,
    title: "Secure & Compliant",
    desc: "Role-based access control with full activity audit trails.",
  },
];

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    country: "",
    additionalInfo: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const { firstName, lastName, email, phone, role, country, password } = formData;
    if (!firstName || !lastName || !email || !phone || !role || !country || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Registration failed.");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-white">
      {/* ── Left Branding Panel ── */}
      <div className="hidden lg:flex lg:w-[42%] flex-col justify-between bg-[#0f2544] p-12 relative overflow-hidden shrink-0">
        <div className="absolute -top-32 -left-32 w-[440px] h-[440px] rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[380px] h-[380px] rounded-full bg-blue-400/8 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 shadow-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="9 22 9 12 15 12 15 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">VendorBridge</span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/20">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-blue-300 text-xs font-medium">Trusted by procurement teams</span>
            </div>
            <h1 className="text-3xl font-bold text-white leading-tight">
              Your procurement<br />
              <span className="text-blue-400">command center</span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Join thousands of procurement professionals who manage vendors and spending with VendorBridge.
            </p>
          </div>

          {/* Feature cards */}
          <div className="space-y-3">
            {PLATFORM_FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-3 p-4 rounded-xl bg-white/4 border border-white/8 backdrop-blur-sm"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 border border-blue-400/20">
                  <Icon size={16} className="text-blue-400" />
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{title}</div>
                  <div className="text-slate-400 text-xs leading-relaxed mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer trust */}
        <div className="relative z-10">
          <div className="h-px w-full bg-white/5 mb-4" />
          <p className="text-slate-500 text-xs">
            © 2026 VendorBridge · Enterprise Procurement Platform
          </p>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="min-h-full flex flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-[580px] space-y-7">
            {/* Mobile logo */}
            <div className="flex items-center gap-2.5 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f2544]">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <span className="font-semibold text-gray-900 text-base">VendorBridge</span>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
              <p className="text-sm text-gray-500">
                Already registered?{" "}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign in instead
                </Link>
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {error}
                  </div>
                )}

                {/* Section: Personal Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Personal Information</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                        First name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="h-10 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 rounded-lg text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                        Last name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="h-10 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 rounded-lg text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Work email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@company.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="h-10 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 rounded-lg text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        Phone number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={handleChange}
                        className="h-10 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 rounded-lg text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Account Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account Details</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                        System role <span className="text-red-500">*</span>
                      </Label>
                      <Select onValueChange={handleRoleChange} value={formData.role}>
                        <SelectTrigger
                          id="role"
                          className="h-10 w-full border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500 rounded-lg text-sm data-placeholder:text-gray-400"
                        >
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200 text-gray-900 text-sm">
                          <SelectItem value="Procurement Officer">Procurement Officer</SelectItem>
                          <SelectItem value="Vendor">Vendor</SelectItem>
                          <SelectItem value="Manager">Manager / Approver</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="country" className="text-sm font-medium text-gray-700">
                        Country <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="country"
                        type="text"
                        placeholder="India"
                        value={formData.country}
                        onChange={handleChange}
                        className="h-10 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 rounded-lg text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                        Password <span className="text-red-500">*</span>
                      </Label>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimum 8 characters"
                        value={formData.password}
                        onChange={handleChange}
                        className="h-10 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 pr-10 focus:border-blue-500 focus:ring-blue-500 rounded-lg text-sm"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section: Optional */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Additional Information</span>
                    <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="additionalInfo" className="text-sm font-medium text-gray-700">
                      Notes
                    </Label>
                    <textarea
                      id="additionalInfo"
                      rows={3}
                      placeholder="Add any relevant business information, department, or notes for the admin..."
                      value={formData.additionalInfo}
                      onChange={handleChange}
                      className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-sm active:scale-[0.99] transition-all duration-150"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Creating account…
                    </div>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </form>
            </div>

            {/* Trust */}
            <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
              <ShieldCheck size={14} />
              <span>Your data is secured and encrypted end-to-end</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
