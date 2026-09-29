import { useState } from 'react';
import type { AppAlarm } from '../utils/types';
import { AlertOctagon, AlertTriangle, ShieldCheck, Check, CheckCircle2, Bell } from 'lucide-react';

interface AlarmCenterProps {
  alarms: AppAlarm[];
  onAcknowledge: (alarmId: string) => void;
  compact?: boolean;
}

export default function AlarmCenter({
  alarms,
  onAcknowledge,
  compact = false
}: AlarmCenterProps) {
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  const handleResolve = (id: string) => {
    setResolvedIds(prev => new Set(prev).add(id));
  };

  const activeAlarms = alarms.filter(a => !resolvedIds.has(a.id));
  const unacknowledged = activeAlarms.filter(a => !a.acknowledged);

  return (
    <div className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-4 shadow-xs space-y-3.5">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-[#D97706]" />
          <h2 className="text-xs font-black uppercase tracking-wider text-[#111827] tech-mono">
            ALARM CENTER
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] tech-mono text-[#6B7280] hidden sm:inline">
            Active unacknowledged:
          </span>
          <span className={`tech-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
            unacknowledged.length > 0 
              ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]' 
              : 'bg-[#ECFDF5] text-[#087F5B] border-[#A7F3D0]'
          }`}>
            {unacknowledged.length} ALARMS
          </span>
        </div>
      </div>

      {/* Alarm List */}
      <div className="space-y-2">
        {activeAlarms.length === 0 ? (
          <div className="p-4 bg-[#F9FAFB] rounded-md border border-[#E5E7EB] text-center text-xs text-[#6B7280] flex items-center justify-center gap-2">
            <ShieldCheck size={16} className="text-[#087F5B]" />
            <span>All operating envelopes nominal. No active unacknowledged alarms.</span>
          </div>
        ) : (
          activeAlarms.slice(0, compact ? 4 : 10).map(alarm => {
            const isCritical = alarm.category === 'CRITICAL';
            const isWarning = alarm.category === 'WARNING';

            const badgeBg = isCritical
              ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
              : isWarning
              ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
              : 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]';

            return (
              <div
                key={alarm.id}
                className={`p-3 rounded-md border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                  alarm.acknowledged
                    ? 'bg-[#F9FAFB] border-[#E5E7EB] opacity-75'
                    : isCritical
                    ? 'bg-[#FEF2F2]/60 border-[#FECACA]'
                    : 'bg-[#FFFBEB]/60 border-[#FDE68A]'
                }`}
              >
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {isCritical ? (
                      <AlertOctagon size={16} className="text-[#DC2626]" />
                    ) : isWarning ? (
                      <AlertTriangle size={16} className="text-[#D97706]" />
                    ) : (
                      <CheckCircle2 size={16} className="text-[#2563EB]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`tech-mono text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeBg}`}>
                        {alarm.category}
                      </span>
                      <span className="tech-mono text-xs font-bold text-[#111827]">
                        {alarm.time}
                      </span>
                      <span className="text-[#9CA3AF]">•</span>
                      <span className="tech-mono text-[10px] text-[#6B7280]">
                        SOURCE: {alarm.source}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-[#111827] leading-snug">
                      {alarm.condition}
                    </p>

                    <div className="text-[10px] text-[#4B5563] mt-1 flex items-center gap-2">
                      <span>Value: <strong className="text-[#111827]">{alarm.currentValue}</strong></span>
                      <span className="text-[#9CA3AF]">|</span>
                      <span>Threshold: <strong className="text-[#6B7280]">{alarm.threshold}</strong></span>
                      <span className="text-[#9CA3AF]">|</span>
                      <span className="text-[#087F5B] font-semibold">{alarm.action}</span>
                    </div>
                  </div>
                </div>

                {/* Alarm Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                  {!alarm.acknowledged && (
                    <button
                      onClick={() => onAcknowledge(alarm.id)}
                      className="px-2.5 py-1 rounded bg-[#ECFDF5] hover:bg-[#D1FAE5] border border-[#A7F3D0] text-[#087F5B] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Check size={12} /> ACKNOWLEDGE
                    </button>
                  )}
                  <button
                    onClick={() => handleResolve(alarm.id)}
                    className="px-2.5 py-1 rounded bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#D1D5DB] text-[#4B5563] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    RESOLVED
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
