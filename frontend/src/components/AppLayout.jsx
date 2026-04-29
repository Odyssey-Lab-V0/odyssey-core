import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ChartPieSlice,
  Vault,
  ArrowsLeftRight,
  ChartLineUp,
  Target,
  SignOut,
  List,
  X,
  CaretDown,
} from "@phosphor-icons/react";
import { useAuth } from "../lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Toaster } from "./ui/sonner";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: ChartPieSlice, testid: "nav-dashboard-link" },
  { to: "/assets", label: "Assets", icon: Vault, testid: "nav-assets-link" },
  { to: "/transactions", label: "Transactions", icon: ArrowsLeftRight, testid: "nav-transactions-link" },
  { to: "/analytics", label: "Analytics", icon: ChartLineUp, testid: "nav-analytics-link" },
  { to: "/goals", label: "Goals", icon: Target, testid: "nav-goals-link" },
];

const SidebarContent = ({ onClose }) => {
  return (
    <nav className="flex h-full flex-col" data-testid="app-sidebar">
      <div className="flex items-center gap-2 px-6 pt-7 pb-8">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-[#1A362D] text-[#F9F9F8] font-heading font-medium">
          K
        </div>
        <div className="leading-tight">
          <div className="font-heading text-base">Kindred</div>
          <div className="overline" style={{ fontSize: 9 }}>
            Wealth Studio
          </div>
        </div>
      </div>
      <div className="px-3 flex-1">
        <div className="overline px-3 mb-2">Navigation</div>
        <div className="flex flex-col gap-0.5">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={l.testid}
              onClick={onClose}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-[#E6E5E1] text-[#1C1C19]"
                    : "text-[#6B6A65] hover:text-[#1C1C19] hover:bg-[#ECEBE7]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r bg-[#1A362D]" />
                  )}
                  <l.icon size={18} weight={isActive ? "fill" : "regular"} />
                  <span>{l.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
      <div className="px-6 py-6 text-[11px] text-[#9D9C96] font-mono-data">
        v1.0 · demo data
      </div>
    </nav>
  );
};

const AppLayout = () => {
  const { session, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const initials = (session?.user?.fullName || session?.user?.email || "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="min-h-screen flex bg-[#F9F9F8]">
      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[#F3F3F1] border-r border-[#E6E5E1]">
            <SidebarContent onClose={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-[#F3F3F1] border-r border-[#E6E5E1] sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-[#F9F9F8]/80 backdrop-blur border-b border-[#E6E5E1]">
          <div className="flex items-center justify-between px-5 lg:px-10 py-4">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 rounded-md hover:bg-[#ECEBE7]"
                onClick={() => setOpen(!open)}
                data-testid="mobile-menu-toggle"
                aria-label="Toggle menu"
              >
                {open ? <X size={20} /> : <List size={20} />}
              </button>
              <div className="overline">Private Wealth · Confidential</div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-2.5 rounded-full pl-1 pr-3 py-1 hover:bg-[#ECEBE7] transition"
                data-testid="user-menu-trigger"
              >
                <div className="grid h-8 w-8 place-items-center rounded-full bg-[#1A362D] text-[#F9F9F8] text-xs font-heading">
                  {initials.toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm">
                  {session?.user?.fullName || session?.user?.email}
                </span>
                <CaretDown size={14} className="text-[#6B6A65]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="text-[11px] text-[#9D9C96] font-mono-data uppercase">
                    Signed in as
                  </div>
                  <div className="truncate">{session?.user?.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    nav("/login");
                  }}
                  data-testid="logout-button"
                  className="text-[#B94A48] focus:text-[#B94A48]"
                >
                  <SignOut size={16} className="mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-5 lg:px-10 py-8" data-testid="app-main">
          <Outlet />
        </main>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
};

export default AppLayout;
