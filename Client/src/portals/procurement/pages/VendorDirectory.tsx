import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar, { type NavItem } from "@/components/shared/Navbar";
import {
  Users,
  Search,
  SlidersHorizontal,
  Plus,
  Star,
  Mail,
  Phone,
  Building,
  ShieldCheck,
  Ban,
  Clock,
  AlertCircle,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/procurement" },
  { label: "Vendors", path: "/procurement/vendors", active: true },
  { label: "RFQs", path: "/procurement/rfqs" },
  { label: "Quotations", path: "/procurement/quotations" },
  { label: "Purchase Orders", path: "/procurement/purchase-orders" },
  { label: "Invoices", path: "/procurement/invoices" },
  { label: "Reports", path: "/procurement/reports" },
];

export default function VendorDirectory() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters and Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  
  // UI states
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  
  // Create Vendor Form state
  const [companyName, setCompanyName] = useState("");
  const [category, setCategory] = useState("General Supply");
  const [gstNumber, setGstNumber] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [formErrors, setFormErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!token || !storedUser) {
      navigate("/login");
      return;
    }
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed.role !== "Procurement Officer" && parsed.role !== "Admin") {
        navigate("/");
        return;
      }
      setCurrentUser(parsed);
      fetchVendors(token);
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const fetchVendors = async (token: string) => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/vendors", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVendors(data.vendors);
      } else {
        setServerError(data.message || "Failed to load vendors.");
      }
    } catch (err) {
      setServerError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleNavbarNavigate = (item: NavItem) => {
    if (item.path) navigate(item.path);
  };

  // Status badge style helper
  const getStatusBadge = (status: string) => {
    const style = {
      Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
      "Pending Verification": "bg-amber-50 text-amber-700 border-amber-200",
      Suspended: "bg-rose-50 text-rose-700 border-rose-200",
    }[status] || "bg-gray-100 text-gray-700 border-gray-200";

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${style}`}>
        {status === "Active" && <ShieldCheck size={12} />}
        {status === "Pending Verification" && <Clock size={12} />}
        {status === "Suspended" && <Ban size={12} />}
        {status}
      </span>
    );
  };

  // Handle status update
  const handleUpdateStatus = async (vendorId: string, newStatus: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:8000/api/vendors/${vendorId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(`Vendor status successfully updated to ${newStatus}.`);
        fetchVendors(token);
        if (selectedVendor && selectedVendor._id === vendorId) {
          setSelectedVendor({ ...selectedVendor, status: newStatus });
        }
        setTimeout(() => setSuccessMessage(""), 4000);
      } else {
        setServerError(data.message || "Failed to update vendor status.");
        setTimeout(() => setServerError(""), 4000);
      }
    } catch (err) {
      setServerError("Could not update vendor status due to server connection error.");
      setTimeout(() => setServerError(""), 4000);
    }
  };

  // Handle rating update
  const handleUpdateRating = async (vendorId: string, newRating: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:8000/api/vendors/${vendorId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: newRating }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(`Vendor rating updated to ${newRating.toFixed(1)}.`);
        fetchVendors(token);
        if (selectedVendor && selectedVendor._id === vendorId) {
          setSelectedVendor({ ...selectedVendor, rating: newRating });
        }
        setTimeout(() => setSuccessMessage(""), 4000);
      } else {
        setServerError(data.message || "Failed to update rating.");
        setTimeout(() => setServerError(""), 4000);
      }
    } catch (err) {
      setServerError("Could not update rating due to server connection error.");
      setTimeout(() => setServerError(""), 4000);
    }
  };

  // Validate form
  const validateForm = () => {
    const errors: any = {};
    if (!companyName.trim()) errors.companyName = "Company name is required.";
    if (!contactEmail.trim()) {
      errors.contactEmail = "Contact email is required.";
    } else if (!/\S+@\S+\.\S+/.test(contactEmail)) {
      errors.contactEmail = "Contact email is invalid.";
    }
    if (!contactPhone.trim()) errors.contactPhone = "Contact phone is required.";
    if (gstNumber.trim()) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(gstNumber.trim())) {
        errors.gstNumber = "Invalid GSTIN format (e.g. 22AAAAA1111A1Z1).";
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Create Vendor submission
  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    setIsSubmitting(true);
    setServerError("");

    try {
      const res = await fetch("http://localhost:8000/api/vendors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyName,
          category,
          gstNumber: gstNumber.toUpperCase(),
          contactEmail,
          contactPhone,
          firstName: firstName || "Vendor",
          lastName: lastName || "Contact",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(`Vendor profile for "${companyName}" created successfully.`);
        setIsCreateModalOpen(false);
        // Reset form
        setCompanyName("");
        setCategory("General Supply");
        setGstNumber("");
        setContactEmail("");
        setContactPhone("");
        setFirstName("");
        setLastName("");
        setFormErrors({});
        fetchVendors(token);
        setTimeout(() => setSuccessMessage(""), 4000);
      } else {
        setServerError(data.message || "Failed to create vendor profile.");
      }
    } catch (err) {
      setServerError("Could not connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter vendors
  const categoriesList = Array.from(new Set(vendors.map((v) => v.category || "General Supply")));
  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      v.companyName.toLowerCase().includes(search.toLowerCase()) ||
      v.contactEmail.toLowerCase().includes(search.toLowerCase()) ||
      (v.gstNumber && v.gstNumber.toLowerCase().includes(search.toLowerCase()));
    
    const matchesStatus = statusFilter === "All" || v.status === statusFilter;
    const matchesCategory = categoryFilter === "All" || v.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Navbar user={currentUser} navItems={NAV_ITEMS} onNavigate={handleNavbarNavigate} />

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-5 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Vendor Directory</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Browse, monitor statuses, update ratings, and onboard suppliers.
            </p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm h-9 px-4 gap-1.5 shadow-sm self-start sm:self-auto transition-all duration-150 active:scale-95"
          >
            <Plus size={15} /> Add Vendor
          </Button>
        </div>

        {/* Global Notifications */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center gap-2 text-sm shadow-sm animate-fade-in">
            <ShieldCheck size={18} className="shrink-0 text-emerald-600" />
            <div>{successMessage}</div>
          </div>
        )}
        {serverError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg flex items-start gap-2 text-sm shadow-sm animate-fade-in">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-600" />
            <div>{serverError}</div>
          </div>
        )}

        {/* Directory Controls */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4 shadow-sm">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search vendors by name, email, GSTIN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9 text-sm border-gray-200"
              />
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div>Total: <span className="font-semibold text-gray-900">{vendors.length}</span></div>
              <div className="h-3 w-px bg-gray-200" />
              <div>Active: <span className="font-semibold text-emerald-600">{vendors.filter(v => v.status === "Active").length}</span></div>
              <div className="h-3 w-px bg-gray-200" />
              <div>Pending: <span className="font-semibold text-amber-600">{vendors.filter(v => v.status === "Pending Verification").length}</span></div>
              <div className="h-3 w-px bg-gray-200" />
              <div>Suspended: <span className="font-semibold text-rose-600">{vendors.filter(v => v.status === "Suspended").length}</span></div>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 shrink-0">
                <SlidersHorizontal size={13} /> Status:
              </div>
              {["All", "Active", "Pending Verification", "Suspended"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    statusFilter === status
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor="category-select" className="text-xs font-semibold text-gray-500 shrink-0">Category:</label>
              <select
                id="category-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-8 rounded-md border border-gray-200 text-xs font-medium px-2.5 bg-gray-50 hover:bg-gray-100 focus:outline-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content Directory */}
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-20 flex flex-col items-center justify-center gap-3 shadow-sm">
            <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            <span className="text-sm text-gray-500 font-medium">Loading vendor list...</span>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-16 flex flex-col items-center justify-center text-center gap-4 shadow-sm">
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Users size={22} className="text-blue-500" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">No vendors found</div>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                {search || statusFilter !== "All" || categoryFilter !== "All"
                  ? "Try adjusting your filters or resetting the search text."
                  : "Onboard new partners by clicking the 'Add Vendor' button above."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map((vendor) => (
              <div
                key={vendor._id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-300 flex flex-col group"
              >
                {/* Banner Gradient */}
                <div className="h-2.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                
                {/* Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 truncate leading-tight group-hover:text-blue-600 transition-colors">
                          {vendor.companyName}
                        </h3>
                        <span className="inline-block mt-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-100 px-1.5 py-0.5 rounded">
                          {vendor.category || "General Supply"}
                        </span>
                      </div>
                      <div className="shrink-0">{getStatusBadge(vendor.status)}</div>
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <Building size={14} className="text-gray-400 shrink-0" />
                        <span>GSTIN: <span className="font-semibold text-gray-700">{vendor.gstNumber || "Not Provided"}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-gray-400 shrink-0" />
                        <span className="truncate">{vendor.contactEmail}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-gray-400 shrink-0" />
                        <span>{vendor.contactPhone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gray-100" />

                  {/* Footer Ratings & Actions */}
                  <div className="flex items-center justify-between">
                    {/* Star Rating Display */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleUpdateRating(vendor._id, star)}
                          className="text-amber-400 hover:scale-125 transition-transform"
                        >
                          <Star
                            size={14}
                            fill={star <= Math.round(vendor.rating || 5) ? "currentColor" : "none"}
                            className={star <= Math.round(vendor.rating || 5) ? "text-amber-400" : "text-gray-300"}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-gray-700 ml-1">{(vendor.rating || 5.0).toFixed(1)}</span>
                    </div>

                    {/* Quick status toggle dropdown */}
                    <div className="relative group/status">
                      <select
                        value={vendor.status}
                        onChange={(e) => handleUpdateStatus(vendor._id, e.target.value)}
                        className="text-xs font-semibold border rounded-lg px-2 py-1 bg-white hover:bg-gray-50 focus:outline-none cursor-pointer border-gray-200 text-gray-700"
                      >
                        <option value="Active">Activate</option>
                        <option value="Pending Verification">Verify Pending</option>
                        <option value="Suspended">Suspend</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* CREATE VENDOR DIALOG/MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 transform transition-all scale-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Building size={20} />
                <h3 className="font-bold text-base">Onboard New Supplier</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateVendor} className="p-6 space-y-4">
              {serverError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-rose-600" />
                  <div>{serverError}</div>
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="companyName" className="text-xs font-bold text-gray-700">Company Name *</Label>
                <Input
                  id="companyName"
                  placeholder="e.g. Paramount Global Pvt Ltd"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className={`h-9 text-xs border-gray-200 ${formErrors.companyName ? "border-rose-400 focus-visible:ring-rose-200" : ""}`}
                />
                {formErrors.companyName && (
                  <span className="text-[10px] font-semibold text-rose-500 block">{formErrors.companyName}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="firstName" className="text-xs font-bold text-gray-700">Contact First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="e.g. John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-9 text-xs border-gray-200"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName" className="text-xs font-bold text-gray-700">Contact Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="e.g. Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-9 text-xs border-gray-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="category" className="text-xs font-bold text-gray-700">Category *</Label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-9 w-full rounded-md border border-gray-200 text-xs px-2.5 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="General Supply">General Supply</option>
                    <option value="Electronics & IT">Electronics & IT</option>
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Logistics & Dispatch">Logistics & Dispatch</option>
                    <option value="Office Stationery">Office Stationery</option>
                    <option value="Construction & Safety">Construction & Safety</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="gstNumber" className="text-xs font-bold text-gray-700">GSTIN Number</Label>
                  <Input
                    id="gstNumber"
                    placeholder="e.g. 22AAAAA1111A1Z1"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    className={`h-9 text-xs border-gray-200 ${formErrors.gstNumber ? "border-rose-400 focus-visible:ring-rose-200" : ""}`}
                  />
                  {formErrors.gstNumber && (
                    <span className="text-[10px] font-semibold text-rose-500 block">{formErrors.gstNumber}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="contactEmail" className="text-xs font-bold text-gray-700">Contact Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="e.g. vendor@company.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className={`h-9 text-xs border-gray-200 ${formErrors.contactEmail ? "border-rose-400 focus-visible:ring-rose-200" : ""}`}
                  />
                  {formErrors.contactEmail && (
                    <span className="text-[10px] font-semibold text-rose-500 block">{formErrors.contactEmail}</span>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contactPhone" className="text-xs font-bold text-gray-700">Contact Phone *</Label>
                  <Input
                    id="contactPhone"
                    placeholder="e.g. +91 9999988888"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className={`h-9 text-xs border-gray-200 ${formErrors.contactPhone ? "border-rose-400 focus-visible:ring-rose-200" : ""}`}
                  />
                  {formErrors.formPhone && (
                    <span className="text-[10px] font-semibold text-rose-500 block">{formErrors.formPhone}</span>
                  )}
                </div>
              </div>

              <div className="h-px bg-gray-150 my-1" />

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="h-9 px-4 text-xs font-bold text-gray-500 border-gray-200 hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-9 px-5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Onboarding..." : "Onboard Partner"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
