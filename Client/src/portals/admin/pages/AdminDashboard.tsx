import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar, { type NavItem } from "@/components/shared/Navbar";
import {
  Users,
  Building2,
  ShieldCheck,
  Activity,
  Plus,
  UserCog,
  Clock,
  TrendingUp,
  Edit2,
  Trash2,
  ShieldAlert,
  Search,
  X,
  Star,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard" },
  { label: "User Management" },
  { label: "Vendor Management" },
  { label: "Activity Logs" },
  { label: "Settings" },
];

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState("Dashboard");
  const navigate = useNavigate();

  // Data States
  const [users, setUsers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search/Filters
  const [userSearch, setUserSearch] = useState("");
  const [vendorSearch, setVendorSearch] = useState("");
  const [logSearch, setLogSearch] = useState("");
  const [vendorStatusFilter, setVendorStatusFilter] = useState("All");

  // Modals
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [showEditVendorModal, setShowEditVendorModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);

  // Form States
  const [createUserForm, setCreateUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "Procurement Officer",
    country: "India",
    password: "",
  });

  const [editUserForm, setEditUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "Procurement Officer",
    country: "India",
    password: "",
  });

  const [editVendorForm, setEditVendorForm] = useState({
    companyName: "",
    category: "General Supply",
    gstNumber: "",
    contactEmail: "",
    contactPhone: "",
    status: "Pending Verification",
    rating: 5,
  });

  const [formErrors, setFormErrors] = useState<any>({});
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Settings mock states
  const [systemMaintenance, setSystemMaintenance] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [allowRegistration, setAllowRegistration] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!token || !storedUser) {
      navigate("/login");
      return;
    }
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed.role !== "Admin") {
        navigate("/");
        return;
      }
      setUser(parsed);
      loadAllData(token);
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const loadAllData = async (tokenString?: string | null) => {
    const token = tokenString || localStorage.getItem("token");
    if (!token) return;
    try {
      setRefreshing(true);
      
      // 1. Fetch Users
      const usersRes = await fetch("http://localhost:8000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const usersData = await usersRes.json();
      if (usersData.success) {
        setUsers(usersData.users);
      }

      // 2. Fetch Vendors
      const vendorsRes = await fetch("http://localhost:8000/api/vendors", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const vendorsData = await vendorsRes.json();
      if (vendorsData.success) {
        setVendors(vendorsData.vendors);
      }

      // 3. Fetch Activity Logs
      const logsRes = await fetch("http://localhost:8000/api/activity-logs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const logsData = await logsRes.json();
      if (logsData.success) {
        setLogs(logsData.logs);
      }

      // 4. Fetch Analytics Metrics
      const analyticsRes = await fetch("http://localhost:8000/api/analytics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const analyticsData = await analyticsRes.json();
      if (analyticsData.success) {
        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error("Error loading Admin Dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});
    setFormSuccess("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:8000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(createUserForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormErrors(data.errors || { general: data.message || "Failed to create user" });
      } else {
        setFormSuccess("User created successfully!");
        setCreateUserForm({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          role: "Procurement Officer",
          country: "India",
          password: "",
        });
        setTimeout(() => setShowCreateUserModal(false), 1200);
        loadAllData(token);
      }
    } catch (err: any) {
      setFormErrors({ general: err.message || "Failed to create user due to server error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});
    setFormSuccess("");
    const token = localStorage.getItem("token");
    
    // Build update object, only include password if it has been filled in
    const body: any = {
      firstName: editUserForm.firstName,
      lastName: editUserForm.lastName,
      email: editUserForm.email,
      phone: editUserForm.phone,
      role: editUserForm.role,
      country: editUserForm.country,
    };
    if (editUserForm.password) {
      body.password = editUserForm.password;
    }

    try {
      const res = await fetch(`http://localhost:8000/api/users/${selectedUser._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormErrors(data.errors || { general: data.message || "Failed to update user" });
      } else {
        setFormSuccess("User updated successfully!");
        setTimeout(() => setShowEditUserModal(false), 1200);
        loadAllData(token);
      }
    } catch (err: any) {
      setFormErrors({ general: err.message || "Failed to update user" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to permanently delete this user account? This will also remove any linked vendor profile.")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/api/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "User deleted.");
        loadAllData(token);
      } else {
        alert(data.message || "Could not delete user.");
      }
    } catch (err) {
      alert("Error deleting user.");
    }
  };

  const handleResetUserPassword = async (usr: any) => {
    if (!confirm(`Are you sure you want to reset the password for ${usr.firstName} ${usr.lastName} to the default "User@123"?`)) {
      return;
    }
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/api/users/${usr._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: "User@123" }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Password for ${usr.firstName} has been reset to "User@123" successfully.`);
        loadAllData(token);
      } else {
        alert(data.message || "Failed to reset password.");
      }
    } catch (err: any) {
      alert("Error resetting password: " + err.message);
    }
  };

  const handleEditVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});
    setFormSuccess("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/api/vendors/${selectedVendor._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editVendorForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormErrors(data.errors || { general: data.message || "Failed to update vendor" });
      } else {
        setFormSuccess("Vendor profile updated successfully!");
        setTimeout(() => setShowEditVendorModal(false), 1200);
        loadAllData(token);
      }
    } catch (err: any) {
      setFormErrors({ general: err.message || "Failed to update vendor" });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleVendorStatusDirect = async (vendorId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Active" ? "Suspended" : "Active";
    if (!confirm(`Are you sure you want to set this vendor profile to ${nextStatus}?`)) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/api/vendors/${vendorId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        loadAllData(token);
      } else {
        alert("Failed to update status.");
      }
    } catch (err) {
      alert("Error updating status.");
    }
  };

  const openCreateModal = () => {
    setCreateUserForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "Procurement Officer",
      country: "India",
      password: "",
    });
    setFormErrors({});
    setFormSuccess("");
    setShowCreateUserModal(true);
  };

  const openEditUserModal = (usr: any) => {
    setSelectedUser(usr);
    setEditUserForm({
      firstName: usr.firstName,
      lastName: usr.lastName,
      email: usr.email,
      phone: usr.phone || "",
      role: usr.role,
      country: usr.country || "",
      password: "", // Leave empty unless modifying
    });
    setFormErrors({});
    setFormSuccess("");
    setShowEditUserModal(true);
  };

  const openEditVendorModal = (vendor: any) => {
    setSelectedVendor(vendor);
    setEditVendorForm({
      companyName: vendor.companyName || "",
      category: vendor.category || "General Supply",
      gstNumber: vendor.gstNumber || "",
      contactEmail: vendor.contactEmail || "",
      contactPhone: vendor.contactPhone || "",
      status: vendor.status || "Pending Verification",
      rating: vendor.rating || 5,
    });
    setFormErrors({});
    setFormSuccess("");
    setShowEditVendorModal(true);
  };

  if (loading) return <LoadingScreen />;

  // Mapped items for Navbar
  const navItems = NAV_ITEMS.map((item) => ({
    ...item,
    active: item.label === currentTab,
  }));

  // Filter lists
  const filteredUsers = users.filter((u) => {
    const text = `${u.firstName} ${u.lastName} ${u.email} ${u.role}`.toLowerCase();
    return text.includes(userSearch.toLowerCase());
  });

  const filteredVendors = vendors.filter((v) => {
    const text = `${v.companyName} ${v.contactEmail} ${v.category} ${v.gstNumber}`.toLowerCase();
    const matchesSearch = text.includes(vendorSearch.toLowerCase());
    const matchesStatus = vendorStatusFilter === "All" || v.status === vendorStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredLogs = logs.filter((l) => {
    const text = `${l.action} ${l.details} ${
      l.userId ? `${l.userId.firstName} ${l.userId.lastName} ${l.userId.email}` : "Public"
    }`.toLowerCase();
    return text.includes(logSearch.toLowerCase());
  });

  // Calculate high-level metrics
  const activeVendors = vendors.filter((v) => v.status === "Active").length;
  const pendingVendors = vendors.filter((v) => v.status === "Pending Verification").length;
  const suspendedVendors = vendors.filter((v) => v.status === "Suspended").length;

  // Precalculate advanced metrics
  const avgCycleDays = analytics?.metrics?.avgCycleDays || 0;
  const totalSavingsINR = analytics?.metrics?.totalSavingsINR || 0;
  
  const unpaidWeek = analytics?.agingAnalysis?.underWeek || 0;
  const unpaidMonth = analytics?.agingAnalysis?.underMonth || 0;
  const unpaidOver = analytics?.agingAnalysis?.overMonth || 0;
  const totalUnpaid = unpaidWeek + unpaidMonth + unpaidOver;

  // For category spend progress bars
  const spendByCategory = analytics?.spendByCategory || [];
  const totalSpendByCategory = spendByCategory.reduce((sum: number, item: any) => sum + item.value, 0);

  // For monthly spend trend chart
  const spendByMonth = analytics?.spendByMonth || [];

  // For vendor performance leaderboard
  const vendorPerformance = analytics?.vendorPerformance || [];
  // Sort vendor performance by rating, then by winRate descending
  const sortedPerformance = [...vendorPerformance].sort((a: any, b: any) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return b.winRate - a.winRate;
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Navbar
        user={user}
        navItems={navItems}
        onNavigate={(item) => setCurrentTab(item.label)}
      />

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-5 py-8 space-y-7">
        {/* Header with Title and Quick Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                <ShieldCheck size={11} /> Admin Control Panel
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentTab === "Dashboard" && "System Overview"}
              {currentTab === "User Management" && "User Administration"}
              {currentTab === "Vendor Management" && "Vendor Verification & Ratings"}
              {currentTab === "Activity Logs" && "System Audit Trail"}
              {currentTab === "Settings" && "System Configuration"}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {currentTab === "Dashboard" && "Real-time system health, activities, and analytical summaries."}
              {currentTab === "User Management" && "Manage user accounts, modify roles, onboard new staff, and manage access."}
              {currentTab === "Vendor Management" && "Verify supplier credentials, manage verification status, and set ratings."}
              {currentTab === "Activity Logs" && "Immutable log records detailing critical database events and administrative changes."}
              {currentTab === "Settings" && "Configure email dispatch toggles, system maintenance modes, and portal rules."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadAllData()}
              className={`p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors ${
                refreshing ? "animate-spin" : ""
              }`}
              title="Refresh Data"
            >
              <RefreshCw size={16} />
            </button>
            {currentTab === "User Management" && (
              <Button
                onClick={openCreateModal}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm h-9 px-4 gap-1.5 shadow-sm"
              >
                <Plus size={16} /> Add User
              </Button>
            )}
          </div>
        </div>

        {/* Dashboard Tab */}
        {currentTab === "Dashboard" && (
          <div className="space-y-7 animate-in fade-in duration-300">

            {/* KPI Cards Row 1 – Core System Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-blue-100 rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Total Users</span>
                  <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Users size={18} className="text-blue-600" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{users.length}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Across all portal roles</div>
                </div>
              </div>

              <div className="bg-white border border-emerald-100 rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Active Vendors</span>
                  <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Building2 size={18} className="text-emerald-600" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{activeVendors}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {pendingVendors} pending · {suspendedVendors} suspended
                  </div>
                </div>
              </div>

              <div className="bg-white border border-violet-100 rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Total Spend</span>
                  <div className="h-9 w-9 rounded-lg bg-violet-50 flex items-center justify-center">
                    <TrendingUp size={18} className="text-violet-600" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    ₹{(analytics?.metrics?.totalSpendINR || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Paid invoices cumulative</div>
                </div>
              </div>

              <div className="bg-white border border-amber-100 rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Audit Events</span>
                  <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Activity size={18} className="text-amber-600" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{logs.length}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Immutable log entries</div>
                </div>
              </div>
            </div>

            {/* KPI Cards Row 2 – Advanced Operational Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Procurement Velocity */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white flex flex-col gap-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-100">Procurement Velocity</span>
                  <div className="h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center">
                    <Clock size={18} className="text-white" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    {avgCycleDays > 0 ? `${avgCycleDays}d` : "—"}
                  </div>
                  <div className="text-xs text-blue-200 mt-1">Avg. RFQ-to-payment cycle</div>
                </div>
                <div className="mt-auto">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    avgCycleDays === 0
                      ? "bg-white/20 text-white"
                      : avgCycleDays <= 14
                      ? "bg-emerald-400/30 text-emerald-100"
                      : avgCycleDays <= 30
                      ? "bg-amber-400/30 text-amber-100"
                      : "bg-red-400/30 text-red-100"
                  }`}>
                    {avgCycleDays === 0
                      ? "No completed POs"
                      : avgCycleDays <= 14
                      ? "⚡ Fast"
                      : avgCycleDays <= 30
                      ? "⏱ Average"
                      : "⚠ Slow"}
                  </span>
                </div>
              </div>

              {/* Negotiated Cost Savings */}
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-5 text-white flex flex-col gap-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-emerald-100">Negotiated Savings</span>
                  <div className="h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center">
                    <ShieldCheck size={18} className="text-white" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    ₹{totalSavingsINR.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-emerald-200 mt-1">Savings vs avg competitor quote</div>
                </div>
                <div className="mt-auto">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white">
                    {totalSavingsINR > 0 ? "✓ Active savings achieved" : "No comparative bids yet"}
                  </span>
                </div>
              </div>

              {/* Outstanding Payables */}
              <div className="bg-gradient-to-br from-rose-600 to-rose-700 rounded-xl p-5 text-white flex flex-col gap-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-rose-100">Outstanding Payables</span>
                  <div className="h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center">
                    <AlertTriangle size={18} className="text-white" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    ₹{totalUnpaid.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-rose-200 mt-1">Total unpaid invoices outstanding</div>
                </div>
                <div className="mt-auto">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    unpaidOver > 0 ? "bg-white/20 text-white" : "bg-emerald-400/30 text-emerald-100"
                  }`}>
                    {unpaidOver > 0 ? `⚠ ₹${unpaidOver.toLocaleString("en-IN")} overdue >30d` : "✓ No critically overdue"}
                  </span>
                </div>
              </div>
            </div>

            {/* Analytics Row 1 – Monthly Spend Chart + Aged Payables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Spend SVG Bar Chart */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Monthly Spend Trend</h3>
                  <span className="text-xs text-gray-400">Paid invoices by month (₹)</span>
                </div>
                {spendByMonth.length === 0 ? (
                  <div className="flex items-center justify-center h-36 text-gray-300 text-xs">
                    No spend data available yet
                  </div>
                ) : (() => {
                  const maxVal = Math.max(...spendByMonth.map((m: any) => m.amount), 1);
                  const chartH = 120;
                  const barW = Math.max(16, Math.floor((300 - (spendByMonth.length - 1) * 8) / Math.max(spendByMonth.length, 1)));
                  const gap = 8;
                  const totalW = spendByMonth.length * barW + (spendByMonth.length - 1) * gap;

                  return (
                    <div className="overflow-x-auto">
                      <svg
                        width={Math.max(totalW + 8, 300)}
                        height={chartH + 36}
                        viewBox={`0 0 ${Math.max(totalW + 8, 300)} ${chartH + 36}`}
                        className="block"
                      >
                        {spendByMonth.map((m: any, i: number) => {
                          const bh = Math.max(4, (m.amount / maxVal) * chartH);
                          const x = i * (barW + gap) + 4;
                          const y = chartH - bh;
                          const label = m.month?.slice(5) || "";
                          return (
                            <g key={m.month}>
                              <rect
                                x={x}
                                y={y}
                                width={barW}
                                height={bh}
                                rx={3}
                                fill="#6366f1"
                                opacity={0.8}
                              />
                              <text
                                x={x + barW / 2}
                                y={chartH + 14}
                                textAnchor="middle"
                                fontSize="9"
                                fill="#9ca3af"
                              >
                                {label}
                              </text>
                            </g>
                          );
                        })}
                        {/* Zero baseline */}
                        <line x1={0} y1={chartH} x2={Math.max(totalW + 8, 300)} y2={chartH} stroke="#f3f4f6" strokeWidth={1} />
                      </svg>
                    </div>
                  );
                })()}
              </div>

              {/* Invoice Aging Analysis – Stacked Horizontal Bars */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Invoice Aging Analysis</h3>
                  <span className="text-xs text-gray-400">Outstanding payables breakdown</span>
                </div>

                {totalUnpaid === 0 ? (
                  <div className="flex items-center justify-center h-24 gap-2 text-emerald-600 text-xs font-medium">
                    <CheckCircle2 size={16} /> All invoices cleared — no outstanding payables
                  </div>
                ) : (
                  <div className="space-y-4 pt-2">
                    {/* Total combined bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span className="font-medium">Total Unpaid</span>
                        <span className="font-bold text-gray-900">₹{totalUnpaid.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden flex">
                        <div
                          className="h-full bg-emerald-400 transition-all"
                          style={{ width: `${totalUnpaid > 0 ? (unpaidWeek / totalUnpaid) * 100 : 0}%` }}
                        />
                        <div
                          className="h-full bg-amber-400 transition-all"
                          style={{ width: `${totalUnpaid > 0 ? (unpaidMonth / totalUnpaid) * 100 : 0}%` }}
                        />
                        <div
                          className="h-full bg-red-500 transition-all"
                          style={{ width: `${totalUnpaid > 0 ? (unpaidOver / totalUnpaid) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Individual age bands */}
                    {[
                      { label: "0–7 Days (Recent)", value: unpaidWeek, color: "bg-emerald-400", textColor: "text-emerald-700", bgColor: "bg-emerald-50" },
                      { label: "8–30 Days (Due)", value: unpaidMonth, color: "bg-amber-400", textColor: "text-amber-700", bgColor: "bg-amber-50" },
                      { label: "30+ Days (Overdue)", value: unpaidOver, color: "bg-red-500", textColor: "text-red-700", bgColor: "bg-red-50" },
                    ].map((band) => (
                      <div key={band.label} className={`rounded-lg p-3 ${band.bgColor} space-y-1.5`}>
                        <div className="flex justify-between items-center text-xs">
                          <span className={`font-semibold ${band.textColor}`}>{band.label}</span>
                          <span className={`font-bold ${band.textColor}`}>₹{band.value.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/60 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${band.color} rounded-full transition-all`}
                            style={{ width: `${totalUnpaid > 0 ? Math.min((band.value / totalUnpaid) * 100, 100) : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Analytics Row 2 – Category Breakdown + Vendor Compliance Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Spend by Category Breakdown */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Spend by Category</h3>
                  <span className="text-xs text-gray-400">Distribution of paid invoices</span>
                </div>
                {spendByCategory.length === 0 ? (
                  <div className="flex items-center justify-center h-28 text-gray-300 text-xs">
                    No category spend data yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...spendByCategory]
                      .sort((a: any, b: any) => b.value - a.value)
                      .map((cat: any, idx: number) => {
                        const pct = totalSpendByCategory > 0 ? Math.round((cat.value / totalSpendByCategory) * 100) : 0;
                        const colors = ["bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-indigo-500"];
                        const col = colors[idx % colors.length];
                        return (
                          <div key={cat.name} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${col}`} />
                                <span className="font-medium text-gray-700">{cat.name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-500">
                                <span>₹{cat.value.toLocaleString("en-IN")}</span>
                                <span className="font-bold text-gray-900">{pct}%</span>
                              </div>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${col} rounded-full transition-all`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Vendor Compliance Leaderboard */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Vendor Compliance Leaderboard</h3>
                  <button
                    onClick={() => setCurrentTab("Vendor Management")}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View All
                  </button>
                </div>
                {sortedPerformance.length === 0 ? (
                  <div className="flex items-center justify-center h-28 text-gray-300 text-xs">
                    No vendor performance data yet
                  </div>
                ) : (
                  <div className="space-y-2 overflow-y-auto max-h-64">
                    {sortedPerformance.slice(0, 8).map((vp: any, idx: number) => (
                      <div key={vp.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          idx === 0 ? "bg-amber-100 text-amber-700" :
                          idx === 1 ? "bg-gray-100 text-gray-600" :
                          idx === 2 ? "bg-orange-100 text-orange-700" :
                          "bg-gray-50 text-gray-400"
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-gray-900 truncate">{vp.companyName}</div>
                          <div className="text-[10px] text-gray-400">{vp.category} · {vp.totalPOs} POs</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-0.5 text-amber-500 text-xs font-semibold">
                            <Star size={10} fill="currentColor" />
                            {vp.rating?.toFixed(1)}
                          </div>
                          <div className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                            vp.winRate >= 50 ? "bg-emerald-50 text-emerald-700" :
                            vp.winRate > 0 ? "bg-blue-50 text-blue-700" :
                            "bg-gray-50 text-gray-500"
                          }`}>
                            {vp.winRate}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Administrative Actions</h2>
                <span className="text-xs text-gray-400">Shortcuts to portal tabs</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <button
                  onClick={() => openCreateModal()}
                  className="group flex items-start gap-3 p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left"
                >
                  <div className="h-9 w-9 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors shrink-0">
                    <Plus size={17} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">Onboard User</div>
                    <div className="text-xs text-gray-400 mt-0.5 leading-snug">Register admins, officers, and suppliers.</div>
                  </div>
                </button>

                <button
                  onClick={() => setCurrentTab("User Management")}
                  className="group flex items-start gap-3 p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left"
                >
                  <div className="h-9 w-9 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors shrink-0">
                    <UserCog size={17} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">Manage Roles</div>
                    <div className="text-xs text-gray-400 mt-0.5 leading-snug">Switch authorization scopes and credentials.</div>
                  </div>
                </button>

                <button
                  onClick={() => setCurrentTab("Vendor Management")}
                  className="group flex items-start gap-3 p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left"
                >
                  <div className="h-9 w-9 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors shrink-0">
                    <Building2 size={17} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">Verify Suppliers</div>
                    <div className="text-xs text-gray-400 mt-0.5 leading-snug">Verify company GST and activate vendor bids.</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Bottom Row: Recent Logs Stream + SVG User Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent System Activity Stream */}
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Recent System Events</h3>
                  <button
                    onClick={() => setCurrentTab("Activity Logs")}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View All Logs
                  </button>
                </div>
                <div className="divide-y divide-gray-100 overflow-y-auto max-h-[300px]">
                  {logs.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-xs">No events logged yet.</div>
                  ) : (
                    logs.slice(0, 7).map((log) => (
                      <div key={log._id} className="py-3 flex gap-3 text-xs">
                        <Clock size={14} className="text-gray-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-700 font-medium break-words">{log.details}</p>
                          <span className="text-gray-400">
                            {new Date(log.timestamp).toLocaleString()} · {log.userId?.email || "System"}
                          </span>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 h-fit rounded text-[10px] font-bold ${
                            log.action?.includes("DELETE") || log.action?.includes("SUSPEND")
                              ? "bg-red-50 text-red-600 border border-red-100"
                              : log.action?.includes("CREATE") || log.action?.includes("APPROVED")
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              : "bg-blue-50 text-blue-600 border border-blue-100"
                          }`}
                        >
                          {log.action}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* User Role Distribution Donut Chart */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">User Roles Breakdown</h3>
                  <div className="flex items-center justify-center py-3">
                    <svg className="w-36 h-36" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                      {users.length > 0 && (() => {
                        const admins = users.filter((u) => u.role === "Admin").length;
                        const pos = users.filter((u) => u.role === "Procurement Officer").length;
                        const managers = users.filter((u) => u.role === "Manager").length;
                        const vendorsCount = users.filter((u) => u.role === "Vendor").length;
                        const total = users.length;
                        const adminPct = (admins / total) * 100;
                        const poPct = (pos / total) * 100;
                        const managerPct = (managers / total) * 100;
                        const vendorPct = (vendorsCount / total) * 100;
                        return (
                          <>
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#a855f7" strokeWidth="3.2"
                              strokeDasharray={`${adminPct} ${100 - adminPct}`} strokeDashoffset="25" />
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="3.2"
                              strokeDasharray={`${poPct} ${100 - poPct}`} strokeDashoffset={25 - adminPct} />
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3.2"
                              strokeDasharray={`${managerPct} ${100 - managerPct}`} strokeDashoffset={25 - adminPct - poPct} />
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f97316" strokeWidth="3.2"
                              strokeDasharray={`${vendorPct} ${100 - vendorPct}`} strokeDashoffset={25 - adminPct - poPct - managerPct} />
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-purple-500" />
                    <span>Admin ({users.filter((u) => u.role === "Admin").length})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    <span>Officer ({users.filter((u) => u.role === "Procurement Officer").length})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Manager ({users.filter((u) => u.role === "Manager").length})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    <span>Vendor ({users.filter((u) => u.role === "Vendor").length})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* User Management Tab */}
        {currentTab === "User Management" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Role Distribution Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { role: "Admin", color: "bg-purple-100 text-purple-800 border-purple-200", dot: "bg-purple-500" },
                { role: "Procurement Officer", color: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500" },
                { role: "Manager", color: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
                { role: "Vendor", color: "bg-orange-100 text-orange-800 border-orange-200", dot: "bg-orange-500" },
              ].map(({ role, color, dot }) => {
                const count = users.filter((u) => u.role === role).length;
                return (
                  <div key={role} className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${color}`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                    <div>
                      <div className="text-lg font-bold">{count}</div>
                      <div className="text-xs font-medium opacity-75">{role === "Procurement Officer" ? "PO Officers" : role + "s"}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Search */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search user registry by name, email, or role..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg w-full text-sm outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto border border-gray-100 rounded-lg">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-semibold uppercase">
                      <th className="p-3">User Details</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Country</th>
                      <th className="p-3">Joined Date</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-gray-400 text-xs">
                          No user records found matching the search filters.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((usr) => (
                        <tr key={usr._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                                usr.role === "Admin" ? "bg-purple-500" :
                                usr.role === "Procurement Officer" ? "bg-blue-500" :
                                usr.role === "Manager" ? "bg-emerald-500" : "bg-orange-400"
                              }`}>
                                {usr.firstName[0]}{usr.lastName[0]}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{usr.firstName} {usr.lastName}</div>
                                <div className="text-xs text-gray-400">{usr.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 text-xs rounded-full font-semibold border ${
                              usr.role === "Admin" ? "bg-purple-50 text-purple-700 border-purple-200" :
                              usr.role === "Procurement Officer" ? "bg-blue-50 text-blue-700 border-blue-200" :
                              usr.role === "Manager" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              "bg-orange-50 text-orange-700 border-orange-200"
                            }`}>
                              {usr.role}
                            </span>
                          </td>
                          <td className="p-3 text-gray-600 text-xs">{usr.phone || "—"}</td>
                          <td className="p-3 text-gray-600 text-xs">{usr.country || "—"}</td>
                          <td className="p-3 text-gray-400 text-xs">
                            {new Date(usr.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => openEditUserModal(usr)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit User Details"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleResetUserPassword(usr)}
                                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                title="Reset Password to Default"
                              >
                                <Key size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(usr._id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete Account"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Vendor Management Tab */}
        {currentTab === "Vendor Management" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Vendor Status Summary Banner */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xl font-bold text-emerald-800">{activeVendors}</div>
                  <div className="text-xs text-emerald-600 font-medium">Active & Verified</div>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <Clock size={20} className="text-amber-600 shrink-0" />
                <div>
                  <div className="text-xl font-bold text-amber-800">{pendingVendors}</div>
                  <div className="text-xs text-amber-600 font-medium">Pending Verification</div>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <ShieldAlert size={20} className="text-red-600 shrink-0" />
                <div>
                  <div className="text-xl font-bold text-red-800">{suspendedVendors}</div>
                  <div className="text-xs text-red-600 font-medium">Suspended</div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search vendor registry by name, category, email..."
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg w-full text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={vendorStatusFilter}
                    onChange={(e) => setVendorStatusFilter(e.target.value)}
                    className="border border-gray-200 rounded-lg py-1.5 px-3 text-sm bg-white outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="All">All Verification Statuses</option>
                    <option value="Active">Active / Verified</option>
                    <option value="Pending Verification">Pending Verification</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
            </div>

            {/* Vendor Cards/List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVendors.length === 0 ? (
                <div className="col-span-full text-center py-10 text-gray-400 text-xs">
                  No suppliers found matching the filters.
                </div>
              ) : (
                filteredVendors.map((vendor) => (
                  <div
                    key={vendor._id}
                    className="bg-white border border-gray-150 rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
                  >
                    {/* Verification ribbon indicator */}
                    <div
                      className={`absolute top-0 right-0 h-1.5 w-16 ${
                        vendor.status === "Active"
                          ? "bg-emerald-500"
                          : vendor.status === "Suspended"
                          ? "bg-red-500"
                          : "bg-amber-500"
                      }`}
                    />

                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm leading-tight">
                            {vendor.companyName}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-semibold text-gray-500">
                              {vendor.category || "General Supply"}
                            </span>
                            {(vendor.rating || 5) < 3.0 && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-100 text-[10px] font-bold text-red-700 border border-red-200">
                                <AlertTriangle size={9} /> Low Rating
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: (vendor.rating || 5) < 3 ? '#dc2626' : (vendor.rating || 5) < 4 ? '#d97706' : '#f59e0b' }}>
                          <Star size={12} fill="currentColor" />
                          <span>{vendor.rating?.toFixed(1) || "5.0"}</span>
                        </div>
                      </div>

                      <div className="mt-4 space-y-1.5 text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Email:</span>
                          <span className="truncate max-w-[170px]">{vendor.contactEmail}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Phone:</span>
                          <span>{vendor.contactPhone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">GSTIN:</span>
                          <span className="font-mono text-gray-700">
                            {vendor.gstNumber || "Not Provided"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status:</span>
                          <span
                            className={`font-semibold ${
                              vendor.status === "Active"
                                ? "text-emerald-600"
                                : vendor.status === "Suspended"
                                ? "text-red-600"
                                : "text-amber-600"
                            }`}
                          >
                            {vendor.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <Button
                        variant="outline"
                        onClick={() => openEditVendorModal(vendor)}
                        className="text-xs h-7 px-2.5 border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        <Edit2 size={10} className="mr-1" /> Edit Profile
                      </Button>

                      <div className="flex items-center gap-1">
                        <Button
                          onClick={() => toggleVendorStatusDirect(vendor._id, vendor.status)}
                          className={`text-xs h-7 px-2.5 font-medium ${
                            vendor.status === "Active"
                              ? "bg-red-50 hover:bg-red-100 border border-red-200 text-red-700"
                              : "bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700"
                          }`}
                        >
                          {vendor.status === "Active" ? (
                            <>
                              <ShieldAlert size={10} className="mr-1" /> Suspend
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={10} className="mr-1" /> Activate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          </div>
        )}

        {/* Activity Logs Tab */}
        {currentTab === "Activity Logs" && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 animate-in fade-in duration-300">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search audit trail logs by action, details description, or user..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg w-full text-sm outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Logs Trail list */}
            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-semibold uppercase">
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">User (Triggered By)</th>
                    <th className="p-3">Action Type</th>
                    <th className="p-3">Details / Event Log Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-gray-400 text-xs">
                        No activity records found.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-3 text-gray-500 text-xs whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3">
                          {log.userId ? (
                            <div>
                              <div className="font-semibold text-gray-800 text-xs">
                                {log.userId.firstName} {log.userId.lastName}
                              </div>
                              <div className="text-[10px] text-gray-400">{log.userId.email}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs italic">Public / System</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-1.5 py-0.5 text-[10px] rounded font-bold border whitespace-nowrap ${
                              log.action?.includes("DELETE") || log.action?.includes("SUSPEND")
                                ? "bg-red-50 text-red-600 border-red-200"
                                : log.action?.includes("CREATE") || log.action?.includes("APPROVED")
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                : "bg-blue-50 text-blue-600 border-blue-200"
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3 text-gray-700 text-xs font-medium max-w-md break-words">
                          {log.details}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {currentTab === "Settings" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6 animate-in fade-in duration-300 max-w-2xl">
            <h3 className="text-base font-semibold text-gray-900">Platform Settings</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-gray-150 rounded-lg">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Email Dispatcher Toggle</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Allow the server to fire invitation and payment alerts.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-gray-150 rounded-lg">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Public Vendor Signups</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Enable unregistered vendor access to signup screen.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={allowRegistration}
                  onChange={(e) => setAllowRegistration(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-gray-150 rounded-lg bg-red-50/20 border-red-100">
                <div>
                  <div className="text-sm font-semibold text-red-800">System Maintenance Mode</div>
                  <div className="text-xs text-red-600/70 mt-0.5">
                    Block non-admin users from using the portal features.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={systemMaintenance}
                  onChange={(e) => setSystemMaintenance(e.target.checked)}
                  className="h-4 w-4 text-red-600 border-red-300 rounded focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => alert("Platform rules saved successfully.")}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
              >
                Save Configuration
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* CREATE USER MODAL */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full overflow-hidden my-8">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-base">Onboard New User</h3>
              <button
                onClick={() => setShowCreateUserModal(false)}
                className="p-1 hover:bg-gray-150 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4">
              {formSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs rounded-lg flex items-center gap-2">
                  <CheckCircle2 size={16} /> {formSuccess}
                </div>
              )}
              {formErrors.general && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-100 text-xs rounded-lg flex items-center gap-2">
                  <AlertTriangle size={16} /> {formErrors.general}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={createUserForm.firstName}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, firstName: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {formErrors.firstName && <span className="text-[10px] text-red-600 font-medium mt-0.5">{formErrors.firstName}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={createUserForm.lastName}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, lastName: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {formErrors.lastName && <span className="text-[10px] text-red-600 font-medium mt-0.5">{formErrors.lastName}</span>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={createUserForm.email}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {formErrors.email && <span className="text-[10px] text-red-600 font-medium mt-0.5">{formErrors.email}</span>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={createUserForm.phone}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, phone: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {formErrors.phone && <span className="text-[10px] text-red-600 font-medium mt-0.5">{formErrors.phone}</span>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Country</label>
                  <input
                    type="text"
                    required
                    value={createUserForm.country}
                    onChange={(e) => setCreateUserForm({ ...createUserForm, country: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {formErrors.country && <span className="text-[10px] text-red-600 font-medium mt-0.5">{formErrors.country}</span>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Assigned Role</label>
                <select
                  value={createUserForm.role}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, role: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Admin">Admin</option>
                  <option value="Procurement Officer">Procurement Officer</option>
                  <option value="Manager">Manager</option>
                  <option value="Vendor">Vendor (Supplies bidder)</option>
                </select>
                {formErrors.role && <span className="text-[10px] text-red-600 font-medium mt-0.5">{formErrors.role}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Default Password</label>
                <input
                  type="password"
                  required
                  value={createUserForm.password}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {formErrors.password && <span className="text-[10px] text-red-600 font-medium mt-0.5">{formErrors.password}</span>}
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateUserModal(false)}
                  className="text-xs h-8 text-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-4"
                >
                  {submitting ? "Onboarding..." : "Register User"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {showEditUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full overflow-hidden my-8">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-base">Edit User Account</h3>
              <button
                onClick={() => setShowEditUserModal(false)}
                className="p-1 hover:bg-gray-150 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="p-5 space-y-4">
              {formSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs rounded-lg flex items-center gap-2">
                  <CheckCircle2 size={16} /> {formSuccess}
                </div>
              )}
              {formErrors.general && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-100 text-xs rounded-lg flex items-center gap-2">
                  <AlertTriangle size={16} /> {formErrors.general}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={editUserForm.firstName}
                    onChange={(e) => setEditUserForm({ ...editUserForm, firstName: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={editUserForm.lastName}
                    onChange={(e) => setEditUserForm({ ...editUserForm, lastName: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={editUserForm.phone}
                    onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Country</label>
                  <input
                    type="text"
                    required
                    value={editUserForm.country}
                    onChange={(e) => setEditUserForm({ ...editUserForm, country: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">System Role</label>
                <select
                  value={editUserForm.role}
                  onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Admin">Admin</option>
                  <option value="Procurement Officer">Procurement Officer</option>
                  <option value="Manager">Manager</option>
                  <option value="Vendor">Vendor (Supplies bidder)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Modify Password (Optional)</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep unchanged"
                  value={editUserForm.password}
                  onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditUserModal(false)}
                  className="text-xs h-8 text-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-4"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT VENDOR PROFILE MODAL */}
      {showEditVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full overflow-hidden my-8">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-base">Edit Vendor Credentials</h3>
              <button
                onClick={() => setShowEditVendorModal(false)}
                className="p-1 hover:bg-gray-150 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditVendor} className="p-5 space-y-4">
              {formSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs rounded-lg flex items-center gap-2">
                  <CheckCircle2 size={16} /> {formSuccess}
                </div>
              )}
              {formErrors.general && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-100 text-xs rounded-lg flex items-center gap-2">
                  <AlertTriangle size={16} /> {formErrors.general}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={editVendorForm.companyName}
                  onChange={(e) => setEditVendorForm({ ...editVendorForm, companyName: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={editVendorForm.gstNumber}
                    onChange={(e) => setEditVendorForm({ ...editVendorForm, gstNumber: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                  <input
                    type="text"
                    value={editVendorForm.category}
                    onChange={(e) => setEditVendorForm({ ...editVendorForm, category: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Contact Email</label>
                  <input
                    type="email"
                    required
                    value={editVendorForm.contactEmail}
                    onChange={(e) => setEditVendorForm({ ...editVendorForm, contactEmail: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={editVendorForm.contactPhone}
                    onChange={(e) => setEditVendorForm({ ...editVendorForm, contactPhone: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Verification Status</label>
                  <select
                    value={editVendorForm.status}
                    onChange={(e) => setEditVendorForm({ ...editVendorForm, status: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending Verification">Pending Verification</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Compliance Rating (0-5)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    required
                    value={editVendorForm.rating}
                    onChange={(e) => setEditVendorForm({ ...editVendorForm, rating: parseFloat(e.target.value) })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditVendorModal(false)}
                  className="text-xs h-8 text-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-4"
                >
                  {submitting ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <span className="text-sm text-gray-500">Loading Admin Control Panel…</span>
      </div>
    </div>
  );
}

function AppFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white py-4 mt-auto">
      <div className="max-w-screen-xl mx-auto px-5 flex items-center justify-between">
        <span className="text-xs text-gray-400">© 2026 VendorBridge · Admin Control Portal</span>
        <div className="flex items-center gap-4">
          {["Privacy", "Terms", "Support"].map((link) => (
            <a key={link} href="#" className="text-xs text-gray-400 hover:text-gray-600">
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
