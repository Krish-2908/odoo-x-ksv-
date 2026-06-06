import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Mail, AlertCircle, CheckCircle2, Copy, Check } from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [resetData, setResetData] = useState<{ resetUrl: string; note: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const validateEmail = (val: string) => {
    if (!val.trim()) { setEmailError("Email address is required."); return false; }
    if (!EMAIL_RE.test(val.trim())) { setEmailError("Enter a valid email address."); return false; }
    setEmailError(""); return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validateEmail(email)) return;
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong.");
      setResetData({ resetUrl: data.resetUrl, note: data.note });
    } catch (err: any) {
      setServerError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!resetData?.resetUrl) return;
    await navigator.clipboard.writeText(resetData.resetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex font-sans bg-white">
      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between bg-[#0f2544] p-12 relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-20 w-[420px] h-[420px] rounded-full bg-blue-400/8 blur-3xl pointer-events-none" />

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

        {/* Center content */}
        <div className="relative z-10 space-y-6 max-w-sm">
          <div className="h-14 w-14 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
            <Mail size={26} className="text-blue-400" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-white leading-tight">
              Forgot your password?
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              No worries. Enter your registered email address and we'll send you a link to reset your password.
            </p>
          </div>
          <div className="space-y-2.5">
            {[
              "Link expires after 1 hour",
              "Check spam/junk if not received",
              "Contact support if you still can't access your account",
            ].map((tip) => (
              <div key={tip} className="flex items-start gap-2.5">
                <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                  <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-slate-400 text-sm">{tip}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="h-px w-full bg-white/5 mb-4" />
          <p className="text-slate-500 text-xs">© 2026 VendorBridge · Enterprise Procurement Platform</p>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-[400px] space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f2544]">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="font-semibold text-gray-900 text-base">VendorBridge</span>
          </div>

          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft size={15} />
            Back to sign in
          </Link>

          {!resetData ? (
            <>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Reset your password</h2>
                <p className="text-sm text-gray-500">
                  Enter your work email and we'll send a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {serverError && (
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    {serverError}
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Work email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (emailError) validateEmail(e.target.value); }}
                    onBlur={(e) => validateEmail(e.target.value)}
                    className={`h-10 bg-white text-gray-900 placeholder:text-gray-400 focus:ring-blue-500 rounded-lg text-sm ${
                      emailError ? "border-red-400 focus:border-red-400" : "border-gray-300 focus:border-blue-500"
                    }`}
                  />
                  {emailError && (
                    <p className="flex items-center gap-1 text-xs text-red-600 mt-1">
                      <AlertCircle size={12} />{emailError}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-sm active:scale-[0.99] transition-all duration-150"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" /> Sending link…
                    </div>
                  ) : "Send reset link"}
                </Button>
              </form>
            </>
          ) : (
            /* ── Success State ── */
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <CheckCircle2 size={24} className="text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
                <p className="text-sm text-gray-500">
                  We sent a password reset link to <span className="font-medium text-gray-700">{email}</span>.
                  The link expires in 1 hour.
                </p>
              </div>

              {/* Demo callout */}
              {resetData.resetUrl && (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={15} className="text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-amber-800">Demo Mode</div>
                      <p className="text-xs text-amber-700 mt-0.5">{resetData.note}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0 bg-white border border-amber-200 rounded px-2 py-1.5">
                      <p className="text-xs text-gray-700 truncate font-mono">{resetData.resetUrl}</p>
                    </div>
                    <button
                      onClick={handleCopy}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-amber-200 bg-white hover:bg-amber-50 transition-colors"
                      title="Copy link"
                    >
                      {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} className="text-amber-600" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Link to={resetData.resetUrl?.replace("http://localhost:5173", "") ?? "/login"}>
                  <Button className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                    Open reset link →
                  </Button>
                </Link>
                <Link to="/login" className="text-center text-sm text-gray-500 hover:text-gray-700">
                  Return to sign in
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
