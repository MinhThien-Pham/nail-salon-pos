// src/views/Admin/AdminDashboard.tsx
import { StaffManager } from './StaffManager';
import { MarketingManager } from './MarketingManager';
import { SettingsManager } from './SettingsManager';
import { ServicesManager } from './ServicesManager';

export type AdminView = 'STAFF' | 'SERVICES' | 'MARKETING' | 'SETTINGS';

export function AdminTabBar({
  currentView,
  onChange,
}: {
  currentView: AdminView;
  onChange: (v: AdminView) => void;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
      <TabButton
        label="Staff"
        active={currentView === 'STAFF'}
        onClick={() => onChange('STAFF')}
      />
      <TabButton
        label="Services"
        active={currentView === 'SERVICES'}
        onClick={() => onChange('SERVICES')}
      />
      <TabButton
        label="Marketing"
        active={currentView === 'MARKETING'}
        onClick={() => onChange('MARKETING')}
      />
      <TabButton
        label="Settings"
        active={currentView === 'SETTINGS'}
        onClick={() => onChange('SETTINGS')}
      />
    </div>
  );
}

export function AdminDashboard({ currentView }: { currentView: AdminView }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-full">
      {currentView === 'STAFF' && <StaffManager />}
      {currentView === 'SERVICES' && <ServicesManager />}
      {currentView === 'MARKETING' && <MarketingManager />}
      {currentView === 'SETTINGS' && <SettingsManager />}
    </div>
  );
}

// Styled Tab Button
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
      onClick={onClick}
      className={`
        px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${active
          ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
          : 'bg-slate-600 text-slate-100 hover:bg-slate-700'
        }
      `}
    >
      {label}
    </button>
  );
}
