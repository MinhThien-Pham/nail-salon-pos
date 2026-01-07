// src/App.tsx
import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { PinModal } from "./components/PinModal";
import { AdminDashboard, AdminTabBar, type AdminView } from "./views/Admin/AdminDashboard";

type RouteView = "QUEUE" | "CALENDAR" | "GIFT" | "ADMIN";
type QueueTab = "LIST" | "BOXES";

export default function App() {
  const [route, setRoute] = useState<RouteView>("QUEUE");
  const [queueTab, setQueueTab] = useState<QueueTab>("LIST");

  const [adminView, setAdminView] = useState<AdminView>("STAFF");

  // Owner PIN modal (used for Settings -> Owner unlock)
  const [showPinModal, setShowPinModal] = useState(false);

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

  const title =
    route === "QUEUE"
      ? "Queue"
      : route === "CALENDAR"
      ? "Calendar"
      : route === "GIFT"
      ? "Gift Cards"
      : "Owner Dashboard";

  return (
    <div className="h-screen w-screen bg-slate-50 flex overflow-hidden">
      <Sidebar
        activeView={route}
        onNavigate={(v) => {
          // keep your last queue tab when returning to queue
          setRoute(v as RouteView);
        }}
        onSettingsClick={() => setShowPinModal(true)}
      />

      <main className="flex-1 min-w-0 p-6">
        {/* Main “card” shell (matches Replit style) */}
        <div className="h-full bg-white border border-slate-200 rounded-[28px] shadow-sm overflow-hidden flex flex-col">
          {/* Header row: title left, tabs centered, actions right */}
          <div className="px-6 py-4 border-b border-slate-100">
            <div className="grid grid-cols-[auto,1fr,auto] items-center gap-4">
              <div className="min-w-0">
                <div className="text-xl font-semibold text-slate-900 leading-tight">{title}</div>
                {route === "QUEUE" && (
                  <div className="text-xs text-slate-500 mt-1">Turn List + Boxes</div>
                )}
                {route === "ADMIN" && (
                  <div className="text-xs text-slate-500 mt-1">Manage staff, services, marketing, settings</div>
                )}
              </div>

              {/* Center controls */}
              <div className="justify-self-center">
                {route === "QUEUE" && (
                  <div className="bg-slate-100 border border-slate-200 rounded-2xl p-1 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setQueueTab("LIST")}
                      className={[
                        "px-4 h-9 rounded-xl text-sm font-semibold transition",
                        queueTab === "LIST"
                          ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                          : "text-slate-600 hover:text-slate-900",
                      ].join(" ")}
                    >
                      Turn List
                    </button>
                    <button
                      type="button"
                      onClick={() => setQueueTab("BOXES")}
                      className={[
                        "px-4 h-9 rounded-xl text-sm font-semibold transition",
                        queueTab === "BOXES"
                          ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                          : "text-slate-600 hover:text-slate-900",
                      ].join(" ")}
                    >
                      Boxes
                    </button>
                  </div>
                )}

                {route === "ADMIN" && (
                  <AdminTabBar currentView={adminView} onChange={setAdminView} />
                )}
              </div>

              {/* Right actions */}
              <div className="justify-self-end flex items-center gap-2">
                {route === "QUEUE" && (
                  <button
                    type="button"
                    className="h-10 px-4 rounded-2xl bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 active:translate-y-[1px] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled
                    title="Wire checkout later"
                  >
                    Checkout
                  </button>
                )}

                {route === "ADMIN" && (
                  <button
                    type="button"
                    className="h-10 px-4 rounded-2xl bg-slate-900 text-white font-semibold shadow-sm hover:bg-slate-800 active:translate-y-[1px] transition"
                    onClick={() => setRoute("QUEUE")}
                    title="Back to queue"
                  >
                    Back
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto bg-slate-50 p-6">
            {route === "QUEUE" && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                {queueTab === "LIST" ? (
                  <div className="text-slate-700">
                    <div className="text-lg font-semibold mb-2">Turn List</div>
                    <div className="text-sm text-slate-500">
                      (Keep your existing Turn List UI here — this is just the shell.)
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-700">
                    <div className="text-lg font-semibold mb-2">Boxes</div>
                    <div className="text-sm text-slate-500">
                      (Keep your existing Boxes UI here — this is just the shell.)
                    </div>
                  </div>
                )}
              </div>
            )}

            {route === "CALENDAR" && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <div className="text-lg font-semibold mb-2">Calendar View</div>
                <div className="text-sm text-slate-500">(Wire later.)</div>
              </div>
            )}

            {route === "GIFT" && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <div className="text-lg font-semibold mb-2">Gift Cards</div>
                <div className="text-sm text-slate-500">(Wire later.)</div>
              </div>
            )}

            {route === "ADMIN" && <AdminDashboard currentView={adminView} />}
          </div>
        </div>
      </main>

      <PinModal
        open={showPinModal}
        title="Enter Owner PIN"
        onClose={() => setShowPinModal(false)}
        onSubmit={handleOwnerUnlock}
      />
    </div>
  );
}
