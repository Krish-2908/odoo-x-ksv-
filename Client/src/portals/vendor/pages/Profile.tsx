import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar, { type NavItem } from "@/components/shared/Navbar";
import ProfileStatus from "../components/ProfileStatus";
import ProfileMetrics from "../components/ProfileMetrics";
import ProfileForm from "../components/ProfileForm";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/vendor" },
  { label: "Open RFQs", path: "/vendor/rfqs" },
  { label: "My Quotations", path: "/vendor/quotations" },
  { label: "Purchase Orders", path: "/vendor/purchase-orders" },
  { label: "Invoices", path: "/vendor/invoices" },
  { label: "My Profile", path: "/vendor/profile", active: true },
];

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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
      fetchProfile(token);
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const fetchProfile = async (token: string) => {
    try {
      const res = await fetch("http://localhost:8000/api/vendors/my-profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.status === 200 && data.success) {
        setProfile(data.vendor);
      } else {
        setErrorMsg(data.message || "Failed to load company profile.");
      }
    } catch (err) {
      setErrorMsg("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (values: any) => {
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:8000/api/vendors/${profile._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (res.status === 200 && data.success) {
        setProfile(data.vendor);
        setSuccessMsg("Your business profile has been updated successfully.");
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMsg(""), 5000);
      } else {
        setErrorMsg(data.message || "Failed to update profile.");
      }
    } catch (err) {
      setErrorMsg("Network error. Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleNavbarNavigate = (item: NavItem) => {
    if (item.path) navigate(item.path);
  };

  if (!user) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Navbar user={user} navItems={NAV_ITEMS} onNavigate={handleNavbarNavigate} />

      <main className="flex-1 max-w-screen-md mx-auto w-full px-5 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vendor Profile Setup</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure your business profile, tax registration details, and contact coordinates.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Error:</span> {errorMsg}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 px-4 py-3 rounded-lg flex items-start gap-2 text-sm shadow-sm">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600" />
            <div>{successMsg}</div>
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-20 flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            <span className="text-sm text-gray-500">Loading profile data...</span>
          </div>
        ) : !profile ? (
          <div className="bg-white border border-gray-200 rounded-xl p-16 text-center text-gray-500">
            No profile information found.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Alert Banner */}
            <ProfileStatus status={profile.status} />

            {/* General Metrics Card */}
            <ProfileMetrics
              companyName={profile.companyName}
              category={profile.category}
              rating={profile.rating}
              status={profile.status}
            />

            {/* Profile Input Form */}
            <ProfileForm
              initialValues={{
                companyName: profile.companyName,
                category: profile.category,
                gstNumber: profile.gstNumber,
                contactEmail: profile.contactEmail,
                contactPhone: profile.contactPhone,
              }}
              onSubmit={handleProfileSubmit}
              saving={saving}
            />
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
        <span className="text-sm text-gray-500">Retrieving security context…</span>
      </div>
    </div>
  );
}
