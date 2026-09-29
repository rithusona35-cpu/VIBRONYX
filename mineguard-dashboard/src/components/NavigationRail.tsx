import type { NavSection } from '../utils/types';
import { Radio, Scan, LineChart, Bell, History, Server, FileText, Scale, ShieldAlert } from 'lucide-react';

interface NavigationRailProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  unreadAlarmsCount: number;
}

export default function NavigationRail({
  currentSection,
  onSelectSection,
  unreadAlarmsCount
}: NavigationRailProps) {
  const navItems: { id: NavSection; label: string; icon: any }[] = [
    { id: 'OVERVIEW', label: 'MONITORING', icon: Radio },
    { id: 'BELT_INSPECTION', label: 'INSPECTION', icon: Scan },
    { id: 'MODEL_VALIDATION', label: 'AI AUDIT', icon: Scale },
    { id: 'TRENDS', label: 'TRENDS', icon: LineChart },
    { id: 'ALARMS', label: 'ALARMS', icon: Bell },
    { id: 'EVENTS', label: 'EVENTS', icon: History },
    { id: 'SYSTEM', label: 'SYSTEM', icon: Server },
    { id: 'REPORTS', label: 'REPORTS', icon: FileText }
  ];

  return (
    <nav className="w-16 lg:w-20 bg-[#FFFFFF] border-r border-[#E5E7EB] flex flex-col justify-between items-center py-3 select-none shrink-0 z-40 shadow-xs h-full">
      
      {/* Navigation Icons Group (Section 3) */}
      <div className="w-full flex flex-col items-center gap-1.5">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          const isAlarm = item.id === 'ALARMS' && unreadAlarmsCount > 0;

          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              title={item.label}
              className={`w-12 lg:w-16 h-12 lg:h-13 rounded-md flex flex-col items-center justify-center transition-all relative group cursor-pointer ${
                isActive
                  ? 'bg-[#ECFDF5] text-[#087F5B] font-bold border border-[#A7F3D0] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
              }`}
            >
              {/* Left active border indicator with emerald accent */}
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#087F5B] rounded-r"></div>
              )}

              <Icon size={18} className={isActive ? 'stroke-[2.5] text-[#087F5B]' : 'stroke-[1.8]'} />
              <span className="text-[8px] uppercase tracking-wider font-bold mt-1 truncate tech-mono">
                {item.label}
              </span>

              {/* Alarm notification badge */}
              {isAlarm && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#DC2626] text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {unreadAlarmsCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Industrial Station Label */}
      <div className="w-full px-1 text-center flex flex-col items-center">
        <div 
          title="MineGuard Station C-01"
          className="p-1.5 rounded-md bg-[#F9FAFB] border border-[#E5E7EB] text-[#087F5B]"
        >
          <ShieldAlert size={14} />
        </div>
        <span className="text-[8px] tech-mono font-bold text-[#6B7280] mt-1 hidden lg:block leading-none">
          STATION<br/>C-01
        </span>
      </div>

    </nav>
  );
}
