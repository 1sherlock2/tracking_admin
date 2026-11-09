import { Bus, Cpu, LogOut, Menu, Phone, Users, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/users", label: "Пользователи", Icon: Users },
  { to: "/routes", label: "Маршруты", Icon: Bus },
  { to: "/devices", label: "Устройства", Icon: Cpu },
  { to: "/auth-phones", label: "Номера авторизации", Icon: Phone },
];

function NavItem({
  to,
  label,
  Icon,
  onClick,
}: {
  to: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? "bg-blue-600 text-white"
            : "text-gray-400 hover:bg-gray-800 hover:text-white"
        }`
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  );
}

export default function Layout() {
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      {/* ─── Sidebar desktop ─────────────────────────────────── */}
      <aside className="hidden w-56 flex-col border-r border-gray-800 bg-gray-900 md:flex">
        <div className="flex h-14 items-center px-4 font-bold text-white">
          Трекинг-Админ
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavItem key={to} to={to} label={label} Icon={Icon} />
          ))}
        </nav>

        <div className="border-t border-gray-800 p-3">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <LogOut size={18} />
            Выйти
          </button>
        </div>
      </aside>

      {/* ─── Mobile header ───────────────────────────────────── */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-gray-800 bg-gray-900 px-4 md:hidden">
          <span className="font-bold">Трекинг-Админ</span>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <Menu size={20} />
          </button>
        </header>

        {/* ─── Mobile drawer ──────────────────────────────────── */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-gray-900 shadow-xl">
              <div className="flex h-14 items-center justify-between px-4">
                <span className="font-bold">Трекинг-Админ</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-1 text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 space-y-1 px-3 py-2">
                {NAV_ITEMS.map(({ to, label, Icon }) => (
                  <NavItem
                    key={to}
                    to={to}
                    label={label}
                    Icon={Icon}
                    onClick={() => setMobileOpen(false)}
                  />
                ))}
              </nav>

              <div className="border-t border-gray-800 p-3">
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white"
                >
                  <LogOut size={18} />
                  Выйти
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* ─── Page content ───────────────────────────────────── */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
