import { useState } from "react";
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
    <div className="flex bg-white p-1 h-auto rounded-xl shadow-sm border border-slate-200/60 w-[400px]">
      <TabButton label="Staff" active={currentView === "STAFF"} onClick={() => onChange("STAFF")} />
      <TabButton label="Services" active={currentView === "SERVICES"} onClick={() => onChange("SERVICES")} />
      <TabButton label="Marketing" active={currentView === "MARKETING"} onClick={() => onChange("MARKETING")} />
      <TabButton label="Settings" active={currentView === "SETTINGS"} onClick={() => onChange("SETTINGS")} />
    </div>
  );
}

export function AdminDashboard({
  currentView,
  onViewChange
}: {
  currentView: AdminView;
  onViewChange: (v: AdminView) => void;
}) {
  // State for add buttons
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        {/* Left: Title */}
        <div className="w-[140px]">
          <h2 className="text-3xl font-bold text-slate-800">Settings</h2>
        </div>

        {/* Center: Tabs */}
        <div className="flex-1 flex flex-col items-center gap-4">
          <AdminTabBar currentView={currentView} onChange={onViewChange} />
        </div>

        {/* Right: Action Buttons */}
        <div className="w-[140px] flex justify-end">
          {currentView === "STAFF" && (
            <button
              onClick={() => setShowStaffForm(!showStaffForm)}
              className="inline-flex items-center justify-center gap-2 text-sm transition-colors min-h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20 font-semibold px-8 whitespace-nowrap active:translate-y-[1px]"
            >
              {showStaffForm ? "Cancel" : "+ Add Staff"}
            </button>
          )}
          {currentView === "SERVICES" && (
            <button
              onClick={() => setShowCategoryForm(!showCategoryForm)}
              className="inline-flex items-center justify-center gap-2 text-sm transition-colors min-h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20 font-semibold px-6 whitespace-nowrap active:translate-y-[1px]"
            >
              {showCategoryForm ? "Cancel" : "+ Add Category"}
            </button>
          )}
        </div>
      </div>

      {/* Content Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1">
        <div className="flex-1 overflow-auto p-6">
          {currentView === "STAFF" && (
            <StaffManager
              showForm={showStaffForm}
              onFormToggle={() => setShowStaffForm(!showStaffForm)}
            />
          )}
          {currentView === "SERVICES" && (
            <ServicesManager
              showCategoryForm={showCategoryForm}
              onCategoryFormToggle={() => setShowCategoryForm(!showCategoryForm)}
            />
          )}
          {currentView === "MARKETING" && <MarketingManager />}
          {currentView === "SETTINGS" && <SettingsManager />}
        </div>
      </div>
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
        "flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all",
        active
          ? "bg-blue-50 text-blue-700 shadow-none"
          : "text-slate-400 hover:text-slate-600",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
