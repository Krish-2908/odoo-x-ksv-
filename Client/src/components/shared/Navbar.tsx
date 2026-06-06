import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut } from "lucide-react";

export interface NavItem {
  label: string;
  path?: string;
  active?: boolean;
}

interface NavbarProps {
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  } | null;
  navItems: NavItem[];
  onNavigate?: (item: NavItem) => void;
}

export default function Navbar({ user, navItems, onNavigate }: NavbarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <>
      <header className="bg-[#0f2544] sticky top-0 z-50 shrink-0">
        <div className="max-w-screen-xl mx-auto px-5 h-14 flex items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="9 22 9 12 15 12 15 22"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-white font-semibold text-base tracking-tight">
              VendorBridge
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 ml-2">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => onNavigate?.(item)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  item.active
                    ? "bg-white/10 text-white"
                    : "text-slate-300 hover:text-white hover:bg-white/8"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Side Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Notification Bell */}
            <button className="flex h-8 w-8 items-center justify-center rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors">
              <Bell size={16} />
            </button>

            {/* User Dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu((prev) => !prev)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-white/10 transition-colors"
                >
                  <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                    {user.firstName?.[0]}
                    {user.lastName?.[0]}
                  </div>
                  <span className="text-sm text-slate-200 hidden sm:block max-w-[120px] truncate">
                    {user.firstName} {user.lastName}
                  </span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg border border-gray-200 shadow-lg py-1 z-50">
                    <div className="px-3 py-2.5 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {user.email}
                      </div>
                      <div className="text-xs text-blue-600 font-medium mt-0.5">
                        {user.role}
                      </div>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={14} />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Backdrop for closing user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </>
  );
}
