// src/components/Sidebar.tsx
import { useEffect, useMemo, useState } from "react";
import { Calendar, Gift, LayoutDashboard, Menu, Settings, LogOut, LogIn, FileText } from "lucide-react";

interface SidebarProps {
  activeView: string; // "QUEUE" | "CALENDAR" | "GIFT" | "ADMIN" | "RECEIPT"
  onNavigate: (view: string) => void;
  onSettingsClick: () => void;
  onClockInClick: () => void;
  onClockOutClick: () => void;
}

export function Sidebar({ activeView, onNavigate, onSettingsClick, onClockInClick, onClockOutClick }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = useMemo(
    () => now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" }),
    [now]
  );

  const dateStr = useMemo(
    () => now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" }),
    [now]
  );

  return (
    <aside
      className={[
        "h-screen bg-white border-r border-slate-200 flex flex-col",
        "transition-[width] duration-300 ease-in-out",
        collapsed ? "w-[100px]" : "w-[240px]",
      ].join(" ")}
    >
      {/* Top */}
      <div className="h-20 px-5 border-b border-slate-100 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="h-14 w-14 rounded-2xl grid place-items-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition"
          aria-label="Toggle sidebar"
          title="Toggle"
        >
          <Menu className="h-8 w-8" />
        </button>

        {!collapsed && (
          <div className="min-w-0">
            <div className="text-sm uppercase tracking-wider text-slate-400 font-bold">Menu</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-3">
        <NavItem
          icon={<LayoutDashboard className="h-7 w-7" />}
          label="Queue"
          collapsed={collapsed}
          active={activeView === "QUEUE"}
          onClick={() => onNavigate("QUEUE")}
        />
        <NavItem
          icon={<Calendar className="h-7 w-7" />}
          label="Calendar"
          collapsed={collapsed}
          active={activeView === "CALENDAR"}
          onClick={() => onNavigate("CALENDAR")}
        />
        <NavItem
          icon={<Gift className="h-7 w-7 text-pink-500" />}
          label="Gift Card"
          collapsed={collapsed}
          active={activeView === "GIFT"}
          onClick={() => onNavigate("GIFT")}
        />
        <NavItem
          icon={<FileText className="h-7 w-7" />}
          label="Receipt"
          collapsed={collapsed}
          active={activeView === "RECEIPT"}
          onClick={() => onNavigate("RECEIPT")}
        />
      </nav>

      {/* Bottom */}
      <div className="border-t border-slate-100 p-5">
        {!collapsed && (
          <div className="px-3 mb-5">
            <div className="text-slate-900 tabular-nums text-2xl font-bold leading-none">{timeStr}</div>
            <div className="text-sm text-slate-400 font-medium mt-1">{dateStr}</div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <NavItem
            icon={<LogIn className="h-7 w-7 text-green-500" />}
            label="Clock-in"
            collapsed={collapsed}
            active={false}
            onClick={onClockInClick}
            className="hover:bg-green-50 hover:text-green-700"
          />
          <NavItem
            icon={<LogOut className="h-7 w-7 text-red-500" />}
            label="Clock-out"
            collapsed={collapsed}
            active={false}
            onClick={onClockOutClick}
            className="hover:bg-red-50 hover:text-red-700"
          />
          <NavItem
            icon={<Settings className="h-7 w-7" />}
            label="Settings"
            collapsed={collapsed}
            active={false}
            onClick={onSettingsClick}
          />
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  icon,
  label,
  collapsed,
  active,
  onClick,
  className = "",
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  active: boolean;
  onClick: () => void;
  className?: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full flex items-center gap-4 px-4 py-4 min-h-[64px] rounded-3xl transition",
        active
          ? "bg-blue-50 text-blue-700 border border-blue-100 shadow-[0_1px_0_rgba(0,0,0,0.03)]"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent",
        collapsed ? "justify-center" : "",
        className,
      ].join(" ")}
      title={collapsed ? label : undefined}
    >
      {/* Icon Wrapper */}
      <div className={active ? "text-blue-600" : "text-slate-400"}>{icon}</div>

      {!collapsed && (
        <div className="min-w-0 flex-1 text-left">
          <div className="text-lg font-semibold truncate leading-tight">{label}</div>
          {hint && <div className="text-sm text-slate-400 mt-0.5">{hint}</div>}
        </div>
      )}
    </button>
  );
}