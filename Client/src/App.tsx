import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";

// Auth pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import RoleRouter from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Portal pages
import AdminDashboard from "./portals/admin/pages/AdminDashboard";
import ProcurementDashboard from "./portals/procurement/pages/ProcurementDashboard";
import ProcurementRFQList from "./portals/procurement/pages/RFQList";
import ProcurementRFQCreate from "./portals/procurement/pages/RFQCreate";
import ProcurementRFQDetails from "./portals/procurement/pages/RFQDetails";
import SpendAnalytics from "./portals/procurement/pages/SpendAnalytics";

import VendorDashboard from "./portals/vendor/pages/VendorDashboard";
import VendorRFQList from "./portals/vendor/pages/RFQList";
import VendorRFQDetails from "./portals/vendor/pages/RFQDetails";
import VendorProfile from "./portals/vendor/pages/Profile";

import ManagerDashboard from "./portals/manager/pages/ManagerDashboard";

// PO Pages
import ProcurementPOList from "./portals/procurement/pages/PurchaseOrderList";
import ProcurementPODetails from "./portals/procurement/pages/PurchaseOrderDetails";
import VendorPOList from "./portals/vendor/pages/PurchaseOrderList";
import VendorPODetails from "./portals/vendor/pages/PurchaseOrderDetails";

// Invoice Pages
import ProcurementInvoiceList from "./portals/procurement/pages/InvoiceList";
import ProcurementInvoiceDetails from "./portals/procurement/pages/InvoiceDetails";
import VendorInvoiceList from "./portals/vendor/pages/InvoiceList";
import VendorInvoiceDetails from "./portals/vendor/pages/InvoiceDetails";

import "./App.css";

/** Redirect authenticated users away from public routes (Login / Register) */
const PublicRoute = () => {
  const token = localStorage.getItem("token");
  return token ? <Navigate to="/" replace /> : <Outlet />;
};

/** Redirect unauthenticated users from protected routes to Login */
const PrivateRoute = () => {
  const token = localStorage.getItem("token");
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public auth routes ── */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* ── Protected routes ── */}
        <Route element={<PrivateRoute />}>
          {/* Role router — reads role and redirects to the correct portal */}
          <Route path="/" element={<RoleRouter />} />

          {/* Admin Portal */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Procurement Officer Portal */}
          <Route path="/procurement" element={<ProcurementDashboard />} />
          <Route path="/procurement/rfqs" element={<ProcurementRFQList />} />
          <Route path="/procurement/rfqs/new" element={<ProcurementRFQCreate />} />
          <Route path="/procurement/rfqs/:id" element={<ProcurementRFQDetails />} />
          <Route path="/procurement/purchase-orders" element={<ProcurementPOList />} />
          <Route path="/procurement/purchase-orders/:id" element={<ProcurementPODetails />} />
          <Route path="/procurement/invoices" element={<ProcurementInvoiceList />} />
          <Route path="/procurement/invoices/:id" element={<ProcurementInvoiceDetails />} />
          <Route path="/procurement/reports" element={<SpendAnalytics />} />

          {/* Vendor Portal */}
          <Route path="/vendor" element={<VendorDashboard />} />
          <Route path="/vendor/rfqs" element={<VendorRFQList />} />
          <Route path="/vendor/rfqs/:id" element={<VendorRFQDetails />} />
          <Route path="/vendor/profile" element={<VendorProfile />} />
          <Route path="/vendor/purchase-orders" element={<VendorPOList />} />
          <Route path="/vendor/purchase-orders/:id" element={<VendorPODetails />} />
          <Route path="/vendor/invoices" element={<VendorInvoiceList />} />
          <Route path="/vendor/invoices/:id" element={<VendorInvoiceDetails />} />

          {/* Manager / Approver Portal */}
          <Route path="/manager" element={<ManagerDashboard />} />
        </Route>

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
