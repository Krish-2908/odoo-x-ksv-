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

import VendorDashboard from "./portals/vendor/pages/VendorDashboard";
import VendorRFQList from "./portals/vendor/pages/RFQList";
import VendorRFQDetails from "./portals/vendor/pages/RFQDetails";

import ManagerDashboard from "./portals/manager/pages/ManagerDashboard";

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

          {/* Vendor Portal */}
          <Route path="/vendor" element={<VendorDashboard />} />
          <Route path="/vendor/rfqs" element={<VendorRFQList />} />
          <Route path="/vendor/rfqs/:id" element={<VendorRFQDetails />} />

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
