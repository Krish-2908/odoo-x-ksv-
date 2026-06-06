import { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Lock } from "lucide-react";

// ── Password strength helpers ────────────────────────────────────────────────

function calcStrength(pwd: string): { score: number; label: string; color: string; bg: string } {
  if (!pwd) return { score: 0, label: "", color: "", bg: "bg-gray-200" };
  let score = 0;
  if (pwd.length >= 8)   score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 2) return { score, label: "Weak",   color: "text-red-600",   bg: "bg-red-500" };
  if (score === 3) return { score, label: "Fair",   color: "text-amber-600", bg: "bg-amber-400" };
  if (score === 4) return { score, label: "Good",   color: "text-blue-600",  bg: "bg-blue-500" };
  return             { score, label: "Strong", color: "text-emerald-600",bg: "bg-emerald-500" };
}

const RULES = [
  { id: "len",   test: (p: string) => p.length >= 8,   label: "At least 8 characters" },
  { id: "upper", test: (p: string) => /[A-Z]/.test(p), label: "One uppercase letter" },
  { id: "lower", test: (p: string) => /[a-z]/.test(p), label: "One lowercase letter" },
  { id: "num",   test: (p: string) => /[0-9]/.test(p), label: "One number" },
];

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-red-600 mt-1">
      <AlertCircle size={12} />{msg}
    </p>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword]         = useState("");
  const [confirm, setConfirm]           = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [errors, setErrors]             = useState<Record<string, string>>({});
  const [serverError, setServerError]   = useState("");
  const [isLoading, setIsLoading]       = useState(false);
  const [success, setSuccess]           = useState(false);

  const strength = useMemo(() => calcStrength(password), [password]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!password)          errs.password = "New password is required.";
    else if (password.length < 8)  errs.password = "Password must be at least 8 characters.";
    else if (!/[A-Z]/.test(password)) errs.password = "Password must include at least one uppercase letter.";
    else if (!/[a-z]/.test(password)) errs.password = "Password must include at least one lowercase letter.";
    else if (!/[0-9]/.test(password)) errs.password = "Password must include at least one number.";
    if (!confirm)            errs.confirm = "Please confirm your new password.";
    else if (password !== confirm) errs.confirm = "Passwords do not match.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!token) { setServerError("Reset token is missing. Please use the link from your email."); return; }
    if (!validate()) return;
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Reset failed.");
      setSuccess(true);
    } catch (err: any) {
      setServerError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
        <div className="max-w-sm w-full bg-white border border-gray-200 rounded-xl p-8 text-center space-y-4">
          <AlertCircle size={40} className="text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-gray-900">Invalid reset link</h2>
          <p className="text-sm text-gray-500">This link is missing a valid reset token. Please request a new one.</p>
          <Link to="/forgot-password">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm h-9 mt-2">
              Request new link
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex font-sans bg-white">
      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between bg-[#0f2544] p-12 relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-20 w-[420px] h-[420px] rounded-full bg-blue-400/8 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 shadow-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="9 22 9 12 15 12 15 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">VendorBridge</span>
        </div>

        <div className="relative z-10 space-y-6 max-w-sm">
          <div className="h-14 w-14 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
            <Lock size={26} className="text-blue-400" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-white leading-tight">
              Set a new password
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              Create a strong password for your VendorBridge account. Your new password must meet the requirements shown.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password requirements</p>
            {RULES.map((rule) => (
              <div key={rule.id} className="flex items-center gap-2">
                <div className={`h-4 w-4 rounded-full flex items-center justify-center ${rule.test(password) ? "bg-emerald-500/20 border border-emerald-400/40" : "bg-white/5 border border-white/10"}`}>
                  {rule.test(password) && (
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className={`text-sm ${rule.test(password) ? "text-emerald-400" : "text-slate-400"}`}>{rule.label}</span>
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

          {success ? (
            <div className="space-y-5">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 size={24} className="text-emerald-600" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-gray-900">Password reset!</h2>
                <p className="text-sm text-gray-500">Your password has been updated. You can now sign in with your new password.</p>
              </div>
              <Button
                onClick={() => navigate("/login")}
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
              >
                Sign in now
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Set new password</h2>
                <p className="text-sm text-gray-500">Your new password must be different from your previous one.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {serverError && (
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <div>
                      {serverError}{" "}
                      {serverError.toLowerCase().includes("expired") && (
                        <Link to="/forgot-password" className="underline font-medium">Request a new link.</Link>
                      )}
                    </div>
                  </div>
                )}

                {/* New Password */}
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    New password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 8 characters"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: "" })); }}
                      className={`h-10 bg-white text-gray-900 placeholder:text-gray-400 pr-10 focus:ring-blue-500 rounded-lg text-sm ${
                        errors.password ? "border-red-400 focus:border-red-400" : "border-gray-300 focus:border-blue-500"
                      }`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= strength.score ? strength.bg : "bg-gray-200"}`} />
                        ))}
                      </div>
                      <p className={`text-xs font-medium ${strength.color}`}>{strength.label} password</p>
                    </div>
                  )}
                  <FieldError msg={errors.password} />
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <Label htmlFor="confirm" className="text-sm font-medium text-gray-700">
                    Confirm new password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repeat your password"
                      value={confirm}
                      onChange={(e) => { setConfirm(e.target.value); if (errors.confirm) setErrors((p) => ({ ...p, confirm: "" })); }}
                      className={`h-10 bg-white text-gray-900 placeholder:text-gray-400 pr-10 focus:ring-blue-500 rounded-lg text-sm ${
                        errors.confirm ? "border-red-400 focus:border-red-400" : confirm && confirm === password ? "border-emerald-400" : "border-gray-300 focus:border-blue-500"
                      }`}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirm && confirm === password && !errors.confirm && (
                    <p className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
                      <CheckCircle2 size={12} />Passwords match
                    </p>
                  )}
                  <FieldError msg={errors.confirm} />
                </div>

                <Button type="submit" disabled={isLoading}
                  className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-sm active:scale-[0.99] transition-all duration-150">
                  {isLoading ? (
                    <div className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" />Resetting password…</div>
                  ) : "Reset password"}
                </Button>

                <div className="text-center">
                  <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700">
                    Back to sign in
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
