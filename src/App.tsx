// src/App.tsx
import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { PinModal } from "./components/PinModal";
import { AdminDashboard, AdminTabBar, type AdminView } from "./views/Admin/AdminDashboard";
import { QueueView } from "./views/Queue/QueueView";
import { ClockInView } from "./views/ClockIn/ClockInView";
import { ClockOutView } from "./views/ClockOut/ClockOutView";
import { GiftCardView } from "./views/GiftCard/GiftCardView";

type RouteView = "QUEUE" | "CALENDAR" | "GIFT" | "ADMIN" | "CLOCKIN" | "CLOCKOUT";
type QueueTab = "LIST" | "BOXES";

export default function App() {
  const [route, setRoute] = useState<RouteView>("QUEUE");
  const [queueTab, setQueueTab] = useState<QueueTab>("LIST");

  const [adminView, setAdminView] = useState<AdminView>("STAFF");

  // Owner PIN modal (used => Settings -> Owner unlock)
  const [showOwnerPinModal, setShowOwnerPinModal] = useState(false);

  // Clock-in PIN modal
  const [showClockInPinModal, setShowClockInPinModal] = useState(false);

  const handleOwnerUnlock = async (pin: string): Promise<boolean> => {
    try {
      const ok = await window.api.verifyOwner(pin);
      if (!ok) return false;

      setRoute("ADMIN");
      setAdminView("STAFF");
      return true;
    } catch {
      return false;
    }
  };

  const handleClockInUnlock = async (pin: string): Promise<boolean> => {
    try {
      const staff = await window.api.verifyReceptionist(pin);
      if (!staff) return false;

      setShowClockInPinModal(false);
      setRoute("CLOCKIN");
      return true;
    } catch {
      return false;
    }
  };

  const title =
    route === "QUEUE"
      ? "Queue"
      : route === "CALENDAR"
        ? "Calendar"
        : route === "GIFT"
          ? "Gift Cards"
          : route === "CLOCKIN"
            ? "Clock-In"
            : route === "CLOCKOUT"
              ? "Clock-Out"
              : route === "ADMIN"
                ? "Settings"
                : "Owner Dashboard";

  return (
    <div className="h-screen w-screen bg-slate-50 flex overflow-hidden">
      <Sidebar
        activeView={route}
        onNavigate={(v) => {
          // keep your last queue tab when returning to queue
          setRoute(v as RouteView);
        }}
        onSettingsClick={() => setShowOwnerPinModal(true)}
        onClockInClick={() => setShowClockInPinModal(true)}
        onClockOutClick={() => setRoute("CLOCKOUT")}
      />


      <main className="flex-1 overflow-auto bg-slate-50 p-3">
        {route === "QUEUE" ? (
          // Queue view - full screen without wrapper
          <div className="h-full">
            <QueueView queueTab={queueTab} />
          </div>
        ) : route === "ADMIN" ? (
          // Admin view - full screen without wrapper
          <div className="h-full">
            <AdminDashboard currentView={adminView} onViewChange={setAdminView} />
          </div>
        ) : route === "CLOCKIN" ? (
          // Clock-In view - full screen without wrapper
          <div className="h-full">
            <ClockInView />
          </div>
        ) : route === "CLOCKOUT" ? (
          // Clock-Out view - full screen without wrapper
          <div className="h-full">
            <ClockOutView />
          </div>
        ) : route === "GIFT" ? (
          // Gift Card view - full screen without wrapper
          <div className="h-full">
            <GiftCardView />
          </div>
        ) : (
          // Calendar view - with card wrapper (legacy, will be updated later)
          <div className="h-full bg-white border border-slate-200 rounded-[28px] shadow-sm overflow-hidden flex flex-col">
            {/* Header row: title left, tabs centered, actions right */}
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="grid grid-cols-[auto,1fr,auto] items-center gap-4">
                <div className="min-w-0">
                  <div className="text-xl font-semibold text-slate-900 leading-tight">{title}</div>
                </div>

                {/* Center controls */}
                <div className="justify-self-center">
                  {/* Future: add view-specific controls here */}
                </div>

                {/* Right actions */}
                <div className="justify-self-end flex items-center gap-2">
                  {/* Future: add view-specific actions here */}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto bg-slate-50 p-6">
              {route === "CALENDAR" && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                  <div className="text-lg font-semibold mb-2">Calendar View</div>
                  <div className="text-sm text-slate-500">(Wire later.)</div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Owner PIN Modal for Settings */}
      <PinModal
        open={showOwnerPinModal}
        title="Enter Owner PIN"
        onClose={() => setShowOwnerPinModal(false)}
        onSubmit={handleOwnerUnlock}
      />

      {/* Clock-in PIN Modal */}
      <PinModal
        open={showClockInPinModal}
        title="Clock-In Authentication"
        subtitle="Enter receptionist PIN to access clock-in"
        onClose={() => setShowClockInPinModal(false)}
        onSubmit={handleClockInUnlock}
      />
    </div>
  );
}
