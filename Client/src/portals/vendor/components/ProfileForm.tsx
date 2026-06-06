import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileFormProps {
  initialValues: {
    companyName: string;
    category: string;
    gstNumber: string;
    contactEmail: string;
    contactPhone: string;
  };
  onSubmit: (values: any) => Promise<void>;
  saving: boolean;
}

const CATEGORY_OPTIONS = [
  "IT Equipment",
  "Raw Materials",
  "Logistics",
  "Office Supplies",
  "Construction & Maintenance",
  "Professional Services",
  "Other",
];

export default function ProfileForm({ initialValues, onSubmit, saving }: ProfileFormProps) {
  const [companyName, setCompanyName] = useState(initialValues.companyName || "");
  const [category, setCategory] = useState(initialValues.category || "IT Equipment");
  const [gstNumber, setGstNumber] = useState(initialValues.gstNumber || "");
  const [contactEmail, setContactEmail] = useState(initialValues.contactEmail || "");
  const [contactPhone, setContactPhone] = useState(initialValues.contactPhone || "");

  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    const newErrors: any = {};

    if (!companyName.trim()) {
      newErrors.companyName = "Company name is required.";
    }

    if (!contactEmail.trim()) {
      newErrors.contactEmail = "Contact email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      newErrors.contactEmail = "Please enter a valid email address.";
    }

    if (!contactPhone.trim()) {
      newErrors.contactPhone = "Contact phone is required.";
    }

    if (gstNumber.trim()) {
      // GSTIN Regex Check
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(gstNumber.trim().toUpperCase())) {
        newErrors.gstNumber = "Invalid GSTIN format. Expected: 15-character alphanumeric (e.g. 22AAAAA1111A1Z1).";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    onSubmit({
      companyName: companyName.trim(),
      category,
      gstNumber: gstNumber.trim().toUpperCase(),
      contactEmail: contactEmail.trim().toLowerCase(),
      contactPhone: contactPhone.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 shadow-sm">
      <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
        Business details
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Company Name */}
        <div className="space-y-1.5">
          <Label htmlFor="companyName" className="text-xs font-semibold text-gray-600">Company Name</Label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className={`h-9 text-sm ${errors.companyName ? "border-red-400 focus-visible:ring-red-400" : "border-gray-200"}`}
            placeholder="e.g. ACME Systems Inc"
          />
          {errors.companyName && <span className="text-xs text-red-500">{errors.companyName}</span>}
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label htmlFor="category" className="text-xs font-semibold text-gray-600">Industry Category</Label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* GSTIN */}
        <div className="space-y-1.5">
          <Label htmlFor="gstNumber" className="text-xs font-semibold text-gray-600">GSTIN / Tax ID Number</Label>
          <Input
            id="gstNumber"
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value)}
            className={`h-9 text-sm ${errors.gstNumber ? "border-red-400 focus-visible:ring-red-400" : "border-gray-200"}`}
            placeholder="e.g. 22AAAAA1111A1Z1"
          />
          {errors.gstNumber ? (
            <span className="text-xs text-red-500">{errors.gstNumber}</span>
          ) : (
            <span className="text-[10px] text-gray-400">Optional 15-character Indian GSTIN format.</span>
          )}
        </div>

        {/* Contact Email */}
        <div className="space-y-1.5">
          <Label htmlFor="contactEmail" className="text-xs font-semibold text-gray-600">Contact Email</Label>
          <Input
            id="contactEmail"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className={`h-9 text-sm ${errors.contactEmail ? "border-red-400 focus-visible:ring-red-400" : "border-gray-200"}`}
            placeholder="e.g. sales@company.com"
          />
          {errors.contactEmail && <span className="text-xs text-red-500">{errors.contactEmail}</span>}
        </div>

        {/* Contact Phone */}
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="contactPhone" className="text-xs font-semibold text-gray-600">Contact Phone</Label>
          <Input
            id="contactPhone"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className={`h-9 text-sm ${errors.contactPhone ? "border-red-400 focus-visible:ring-red-400" : "border-gray-200"}`}
            placeholder="e.g. +91 98765 43210"
          />
          {errors.contactPhone && <span className="text-xs text-red-500">{errors.contactPhone}</span>}
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <Button
          type="submit"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 px-5"
        >
          {saving ? "Saving changes..." : "Save profile details"}
        </Button>
      </div>
    </form>
  );
}
