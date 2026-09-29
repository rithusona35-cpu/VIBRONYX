import type { AppEvent } from '../utils/types';
import { History, Activity, Shield, Cpu, Bell, CheckCircle2 } from 'lucide-react';

interface EventTimelineProps {
  events: AppEvent[];
}

export default function EventTimeline({ events }: EventTimelineProps) {
  const getCategoryIcon = (category: AppEvent['category']) => {
    switch (category) {
      case 'AI_INSPECTION':
        return <Cpu size={13} className="text-[#087F5B]" />;
      case 'OPERATOR':
        return <Shield size={13} className="text-[#2563EB]" />;
      case 'ALARM':
        return <Bell size={13} className="text-[#D97706]" />;
      default:
        return <Activity size={13} className="text-[#087F5B]" />;
    }
  };

  return (
    <div className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-4 shadow-xs space-y-3">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <History size={16} className="text-[#7C3AED]" />
          <h2 className="text-xs font-black uppercase tracking-wider text-[#111827] tech-mono">
            LIVE EVENT TIMELINE // AUDIT LOG
          </h2>
        </div>
        <span className="text-[10px] tech-mono text-[#6B7280]">
          Station C-01 Sequence Log
        </span>
      </div>

      {/* Events List */}
      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
        {events.length === 0 ? (
          <div className="p-4 bg-[#F9FAFB] rounded-md border border-[#E5E7EB] text-center text-xs text-[#6B7280] flex items-center justify-center gap-2">
            <CheckCircle2 size={15} className="text-[#087F5B]" />
            <span>Event pipeline initialized. Listening for real-time edge triggers.</span>
          </div>
        ) : (
          events.map((evt) => (
            <div
              key={evt.id}
              className="p-2.5 rounded-md bg-[#F9FAFB] border border-[#E5E7EB] hover:border-[#087F5B] transition-colors flex items-start gap-2.5 text-xs"
            >
              <div className="mt-0.5 shrink-0 opacity-80">
                {getCategoryIcon(evt.category)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="tech-mono text-[10px] font-bold text-[#111827]">
                    {evt.time}
                  </span>
                  <span className="tech-mono text-[9px] px-1.5 py-0.5 rounded bg-[#FFFFFF] border border-[#E5E7EB] text-[#6B7280] font-semibold">
                    {evt.category}
                  </span>
                </div>
                <p className="text-[11px] text-[#4B5563] truncate">
                  {evt.message}
                </p>
              </div>

              <span className={`text-[9px] tech-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                evt.status === 'CRITICAL'
                  ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                  : evt.status === 'WARNING'
                  ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
                  : 'bg-[#ECFDF5] text-[#087F5B] border-[#A7F3D0]'
              }`}>
                {evt.status}
              </span>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
