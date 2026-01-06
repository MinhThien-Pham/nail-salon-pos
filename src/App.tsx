// src/App.tsx
import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { PinModal } from './components/PinModal';
import { AdminDashboard, AdminTabBar, type AdminView } from './views/Admin/AdminDashboard';

function App() {
  const [view, setView] = useState('LIST'); // 'LIST' | 'BOXES' | 'ADMIN'
  const [showPinModal, setShowPinModal] = useState(false);

  // Admin tabs state lives here now so we can render tabs in the header
  const [adminView, setAdminView] = useState<AdminView>('STAFF');

  const handlePinSubmit = async (pin: string) => {
    try {
      const isValid = await window.api.verifyOwner(pin);
      if (isValid) {
        setView('ADMIN');
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const getTitle = () => {
    switch (view) {
      case 'LIST': return 'Queue Management';
      case 'BOXES': return 'Technician Boxes';
      case 'ADMIN': return 'Owner Dashboard';
      default: return 'Salon POS';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      <Sidebar
        activeView={view}
        onNavigate={setView}
        onSettingsClick={() => setShowPinModal(true)}
      />

      <main className="flex-1 overflow-hidden relative flex flex-col">
        {/* Universal Header */}
        <div className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shadow-sm z-10 shrink-0">
          <h1 className="text-xl font-bold text-slate-800 shrink-0">
            {getTitle()}
          </h1>

          {/* Admin tabs inline with Owner Dashboard (right side) */}
          {view === 'ADMIN' && (
            <div className="ml-4 flex-1 min-w-0 flex justify-end">
              <AdminTabBar currentView={adminView} onChange={setAdminView} />
            </div>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto bg-slate-50">
          {view === 'LIST' && (
            <div className="p-6 flex items-center justify-center h-full text-slate-400">
              Turn List View (Coming Next)
            </div>
          )}

          {view === 'BOXES' && (
            <div className="p-6 flex items-center justify-center h-full text-slate-400">
              Boxes View (Coming Next)
            </div>
          )}

          {view === 'ADMIN' && (
            <div className="p-6 h-full">
              <AdminDashboard currentView={adminView} />
            </div>
          )}
        </div>
      </main>

      <PinModal
        open={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSubmit={handlePinSubmit}
        title="Admin Access"
      />
    </div>
  );
}

export default App;
