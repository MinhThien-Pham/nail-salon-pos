import { StaffManager } from "./StaffManager";
import { MarketingManager } from "./MarketingManager";
import { SettingsManager } from "./SettingsManager";
import { ServicesManager } from "./ServicesManager";

export type AdminView = "STAFF" | "SERVICES" | "MARKETING" | "SETTINGS";

export function AdminTabBar({
  currentView,
  onChange,
}: {
  currentView: AdminView;
  onChange: (v: AdminView) => void;
}) {
  return (
    <div className="bg-slate-100 border border-slate-200 rounded-2xl p-1 flex items-center gap-1 overflow-x-auto whitespace-nowrap">
      <TabButton label="Staff" active={currentView === "STAFF"} onClick={() => onChange("STAFF")} />
      <TabButton label="Services" active={currentView === "SERVICES"} onClick={() => onChange("SERVICES")} />
      <TabButton label="Marketing" active={currentView === "MARKETING"} onClick={() => onChange("MARKETING")} />
      <TabButton label="Settings" active={currentView === "SETTINGS"} onClick={() => onChange("SETTINGS")} />
    </div>
  );
}

export function AdminDashboard({ currentView }: { currentView: AdminView }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
      {currentView === "STAFF" && <StaffManager />}
      {currentView === "SERVICES" && <ServicesManager />}
      {currentView === "MARKETING" && <MarketingManager />}
      {currentView === "SETTINGS" && <SettingsManager />}
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-4 h-9 rounded-xl text-sm font-semibold transition",
        active
          ? "bg-white text-slate-900 shadow-sm border border-slate-200"
          : "text-slate-600 hover:text-slate-900",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
