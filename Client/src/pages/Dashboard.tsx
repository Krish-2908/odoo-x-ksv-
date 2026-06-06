import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ROLE_ROUTES: Record<string, string> = {
  Admin: "/admin",
  "Procurement Officer": "/procurement",
  Vendor: "/vendor",
  Manager: "/manager",
};

/**
 * RoleRouter — reads the authenticated user's role from localStorage
 * and redirects to the correct portal dashboard. Acts as the `/` route.
 */
export default function RoleRouter() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      const destination = ROLE_ROUTES[user.role];

      if (destination) {
        navigate(destination, { replace: true });
      } else {
        // Unknown role — log out
        localStorage.clear();
        navigate("/login", { replace: true });
      }
    } catch {
      localStorage.clear();
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <span className="text-sm text-gray-500">Redirecting to your portal…</span>
      </div>
    </div>
  );
}
