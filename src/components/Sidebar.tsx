import { useState } from 'react';
import { LayoutList, LayoutGrid, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  onSettingsClick: () => void;
}

export function Sidebar({ activeView, onNavigate, onSettingsClick }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
        {!collapsed && <span className="font-bold text-slate-800 text-lg">Salon POS</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 py-4 flex flex-col gap-2 px-2">
        <NavButton icon={<LayoutList size={22} />} label="Turn List" collapsed={collapsed} active={activeView === 'LIST'} onClick={() => onNavigate('LIST')} />
        <NavButton icon={<LayoutGrid size={22} />} label="Boxes View" collapsed={collapsed} active={activeView === 'BOXES'} onClick={() => onNavigate('BOXES')} />
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-slate-100">
        <NavButton icon={<Settings size={22} />} label="Settings" collapsed={collapsed} active={false} onClick={onSettingsClick} />
      </div>
    </div>
  );
}

function NavButton({ icon, label, collapsed, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 p-3 rounded-xl transition-colors w-full ${active ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'} ${collapsed ? 'justify-center' : ''}`}>
      {icon}
      {!collapsed && <span>{label}</span>}
    </button>
  );
}