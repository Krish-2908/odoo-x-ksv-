import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar, { type NavItem } from "@/components/shared/Navbar";
import { ArrowLeft, Plus, Trash2, Search, Building2, Calendar, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/procurement" },
  { label: "Vendors", path: "/procurement/vendors" },
  { label: "RFQs", path: "/procurement/rfqs", active: true },
  { label: "Quotations", path: "/procurement/quotations" },
  { label: "Purchase Orders", path: "/procurement/purchase-orders" },
  { label: "Reports", path: "/procurement/reports" },
];

interface RFQItemInput {
  productName: string;
  quantity: number;
  specs: string;
}

export default function RFQCreate() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [items, setItems] = useState<RFQItemInput[]>([{ productName: "", quantity: 1, specs: "" }]);
  const [assignedVendors, setAssignedVendors] = useState<string[]>([]);
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorCategoryFilter, setVendorCategoryFilter] = useState("All");

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<any>({});
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!token || !storedUser) {
      navigate("/login");
      return;
    }
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed.role !== "Procurement Officer") {
        navigate("/");
        return;
      }
      setUser(parsed);
      fetchVendors(token);
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const fetchVendors = async (token: string) => {
    try {
      const res = await fetch("http://localhost:8000/api/vendors", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.status === 200 && data.success) {
        // List all vendors except suspended ones
        setVendors(data.vendors.filter((v: any) => v.status !== "Suspended"));
      } else {
        setServerError("Failed to load vendor directory.");
      }
    } catch (err: any) {
      setServerError("Could not connect to the server.");
    } finally {
      setVendorsLoading(false);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { productName: "", quantity: 1, specs: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return; // Must have at least one item
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof RFQItemInput, value: any) => {
    const updated = [...items];
    if (field === "quantity") {
      updated[index][field] = parseInt(value) || 0;
    } else {
      updated[index][field] = value;
    }
    setItems(updated);
  };

  const toggleVendorSelection = (vendorId: string) => {
    setAssignedVendors((prev) =>
      prev.includes(vendorId) ? prev.filter((id) => id !== vendorId) : [...prev, vendorId]
    );
  };

  // Basic validation rules
  const validateForm = () => {
    const errors: any = {};
    if (!title.trim()) errors.title = "RFQ title is required.";
    if (!deadline) {
      errors.deadline = "Deadline date is required.";
    } else {
      const deadlineDate = new Date(deadline);
      if (deadlineDate <= new Date()) {
        errors.deadline = "Deadline must be a future date.";
      }
    }

    const itemErrors: any[] = [];
    items.forEach((item, index) => {
      const singleItemError: any = {};
      if (!item.productName.trim()) singleItemError.productName = "Product name is required.";
      if (item.quantity <= 0) singleItemError.quantity = "Quantity must be at least 1.";
      if (Object.keys(singleItemError).length > 0) {
        singleItemError.index = index;
        itemErrors.push(singleItemError);
      }
    });
    if (itemErrors.length > 0) errors.items = itemErrors;

    if (assignedVendors.length === 0) {
      errors.vendors = "Please assign at least one vendor.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (status: "Draft" | "Open") => {
    if (!validateForm()) return;

    setSubmitting(true);
    setServerError("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:8000/api/rfqs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          deadline,
          items,
          assignedVendors,
          status,
        }),
      });

      const data = await res.json();
      if (res.status === 201 && data.success) {
        navigate("/procurement/rfqs");
      } else {
        setServerError(data.message || "Failed to create RFQ.");
      }
    } catch (err) {
      setServerError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNavbarNavigate = (item: NavItem) => {
    if (item.path) navigate(item.path);
  };

  // Get distinct vendor categories
  const categories = ["All", ...Array.from(new Set(vendors.map((v) => v.category).filter(Boolean)))];

  // Filter vendors list
  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      v.companyName.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      v.category.toLowerCase().includes(vendorSearch.toLowerCase());
    const matchesCategory =
      vendorCategoryFilter === "All" || v.category === vendorCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (!user) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Navbar user={user} navItems={NAV_ITEMS} onNavigate={handleNavbarNavigate} />

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-5 py-8 space-y-6">
        {/* Breadcrumb / Back button */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/procurement/rfqs")}
            className="text-gray-500 hover:text-gray-900 gap-1.5 h-8 px-2"
          >
            <ArrowLeft size={15} /> Back to RFQs
          </Button>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">Create Request for Quotation (RFQ)</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Fill in requirements, specify item lines, and invite verified suppliers to bid.
          </p>
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Error:</span> {serverError}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form (2 columns wide on large screen) */}
          <div className="lg:col-span-2 space-y-6">
            {/* General Info */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                <FileText size={16} className="text-blue-600" /> General Information
              </h2>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="title" className="text-xs font-medium text-gray-600">RFQ Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Office IT Equipment Procurement Q3"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`h-9 text-sm mt-1 ${validationErrors.title ? "border-red-400" : "border-gray-200"}`}
                  />
                  {validationErrors.title && (
                    <span className="text-xs text-red-500 mt-1 block">{validationErrors.title}</span>
                  )}
                </div>

                <div>
                  <Label htmlFor="description" className="text-xs font-medium text-gray-600">Detailed Description</Label>
                  <textarea
                    id="description"
                    rows={4}
                    placeholder="Provide background, terms, instructions for delivery, and any conditions..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1 resize-none bg-transparent"
                  />
                </div>

                <div>
                  <Label htmlFor="deadline" className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                    <Calendar size={13} className="text-gray-400" /> Bid Submission Deadline
                  </Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className={`h-9 text-sm mt-1 w-full sm:w-64 ${validationErrors.deadline ? "border-red-400" : "border-gray-200"}`}
                  />
                  {validationErrors.deadline && (
                    <span className="text-xs text-red-500 mt-1 block">{validationErrors.deadline}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Requested Items */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Plus size={16} className="text-blue-600" /> Requested Items & Specifications
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="h-7 text-xs border-blue-200 text-blue-600 hover:bg-blue-50 gap-1"
                >
                  <Plus size={13} /> Add Product
                </Button>
              </div>

              {validationErrors.items && (
                <span className="text-xs text-red-500 block">
                  Please correct errors in the product rows below.
                </span>
              )}

              <div className="space-y-4">
                {items.map((item, index) => {
                  const rowError = validationErrors.items?.find((e: any) => e.index === index) || {};
                  return (
                    <div
                      key={index}
                      className="p-4 rounded-lg bg-gray-50 border border-gray-150 flex flex-col md:flex-row gap-3 items-start md:items-end relative group"
                    >
                      <div className="flex-1 w-full space-y-1.5">
                        <Label className="text-[11px] font-medium text-gray-500">Product/Item Name</Label>
                        <Input
                          placeholder="e.g., Lenovo ThinkPad L14"
                          value={item.productName}
                          onChange={(e) => handleItemChange(index, "productName", e.target.value)}
                          className={`h-9 text-sm bg-white ${rowError.productName ? "border-red-400" : "border-gray-200"}`}
                        />
                      </div>

                      <div className="w-full md:w-28 space-y-1.5">
                        <Label className="text-[11px] font-medium text-gray-500">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity === 0 ? "" : item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                          className={`h-9 text-sm bg-white ${rowError.quantity ? "border-red-400" : "border-gray-200"}`}
                        />
                      </div>

                      <div className="flex-1 w-full space-y-1.5">
                        <Label className="text-[11px] font-medium text-gray-500">Specifications (Optional)</Label>
                        <Input
                          placeholder="e.g., i7 Processor, 16GB RAM, 512GB SSD"
                          value={item.specs}
                          onChange={(e) => handleItemChange(index, "specs", e.target.value)}
                          className="h-9 text-sm bg-white border-gray-200"
                        />
                      </div>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="absolute md:relative top-2 right-2 md:top-auto md:right-auto text-gray-400 hover:text-red-500 p-1.5 transition-colors self-end md:mb-1.5"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Assigned Vendors Sidebar */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm flex flex-col max-h-[500px]">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 size={16} className="text-blue-600" /> Assign Vendors
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Invite suppliers to submit bids.</p>
              </div>

              {/* Filters */}
              <div className="space-y-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                  <Input
                    placeholder="Search company or type..."
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                    className="h-8 pl-8 text-xs border-gray-200"
                  />
                </div>

                <div className="flex flex-wrap gap-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setVendorCategoryFilter(cat)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors border ${
                        vendorCategoryFilter === cat
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vendors List Checkbox Group */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 border border-gray-100 rounded-md p-1.5 min-h-[150px]">
                {vendorsLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <div className="h-5 w-5 rounded-full border border-blue-600 border-t-transparent animate-spin" />
                    <span className="text-[10px] text-gray-400">Loading vendors...</span>
                  </div>
                ) : filteredVendors.length === 0 ? (
                  <div className="text-center py-10 text-xs text-gray-400">No active vendors found.</div>
                ) : (
                  filteredVendors.map((v) => (
                    <label
                      key={v._id}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all hover:bg-gray-50 ${
                        assignedVendors.includes(v._id)
                          ? "bg-blue-50/50 border-blue-200"
                          : "bg-white border-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={assignedVendors.includes(v._id)}
                          onChange={() => toggleVendorSelection(v._id)}
                          className="h-3.5 w-3.5 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-800 truncate max-w-[150px]">{v.companyName}</div>
                          <div className="text-[10px] text-gray-400 truncate max-w-[130px]">{v.category}</div>
                        </div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-gray-100 border border-gray-200 text-gray-500">
                        ⭐ {v.rating.toFixed(1)}
                      </span>
                    </label>
                  ))
                )}
              </div>

              {validationErrors.vendors && (
                <span className="text-xs text-red-500 block">{validationErrors.vendors}</span>
              )}

              <div className="text-xs text-gray-400 font-medium">
                {assignedVendors.length} vendor(s) selected
              </div>
            </div>

            {/* Submission Actions */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-900 border-b border-gray-100 pb-1.5">Actions</h3>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => handleSubmit("Open")}
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full text-xs h-9 font-semibold"
                >
                  {submitting ? "Submitting..." : "Publish & Invite Vendors"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSubmit("Draft")}
                  disabled={submitting}
                  className="w-full text-xs h-9 border-gray-250 text-gray-700 hover:bg-gray-50"
                >
                  Save as Draft
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <span className="text-sm text-gray-500">Loading form context…</span>
      </div>
    </div>
  );
}
