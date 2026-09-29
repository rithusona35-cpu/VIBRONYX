import type { TelemetryData } from '../utils/types';
import { HeartPulse, Info } from 'lucide-react';

interface EquipmentHealthProps {
  telemetry: TelemetryData;
}

export default function EquipmentHealth({ telemetry }: EquipmentHealthProps) {
  const score = telemetry.healthScore ?? 96;
  const breakdown = telemetry.healthBreakdown ?? {
    temperature: 95,
    vibration: 92,
    motor: 94,
    belt: 95,
    aiInspection: 96
  };

  const isCritical = score < 50 || telemetry.status === 'CRITICAL' || telemetry.status === 'STOP_LATCHED';
  const isWarning = (score >= 50 && score < 80) || telemetry.status === 'WARNING';

  const getScoreColor = () => {
    if (isCritical) return 'text-[#DC2626]';
    if (isWarning) return 'text-[#D97706]';
    return 'text-[#087F5B]';
  };

  const getBarColor = (val: number) => {
    if (val < 50) return 'bg-[#DC2626]';
    if (val < 80) return 'bg-[#D97706]';
    return 'bg-[#087F5B]';
  };

  const categories = [
    { label: 'Temperature', value: breakdown.temperature, desc: 'Bearing thermal envelope' },
    { label: 'Vibration', value: breakdown.vibration, desc: 'Drive velocity RMS stability' },
    { label: 'Motor Load', value: breakdown.motor, desc: 'Current & torque reserves' },
    { label: 'Belt Condition', value: breakdown.belt, desc: 'Cover thickness & alignment' },
    { label: 'AI Surface Vision', value: breakdown.aiInspection, desc: 'Optical carcass integrity' }
  ];

  return (
    <div className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-4 shadow-xs flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] mb-3.5">
          <div className="flex items-center gap-2">
            <HeartPulse size={16} className="text-[#087F5B]" />
            <h2 className="text-xs font-black uppercase tracking-wider text-[#111827] tech-mono">
              EQUIPMENT HEALTH
            </h2>
          </div>
          <span className={`tech-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
            isCritical
              ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
              : isWarning
              ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
              : 'bg-[#ECFDF5] text-[#087F5B] border-[#A7F3D0]'
          }`}>
            {isCritical ? 'CRITICAL RISK' : isWarning ? 'DEGRADED' : 'OPTIMAL'}
          </span>
        </div>

        {/* Primary Composite Score */}
        <div className="flex items-baseline justify-between mb-4 p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
          <div>
            <span className="text-[10px] font-black uppercase text-[#6B7280] tech-mono block mb-0.5">
              COMPOSITE EQUIPMENT HEALTH
            </span>
            <span className="text-xs text-[#9CA3AF] tech-mono">
              Station C-01 Prototype
            </span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-black tech-mono tracking-tight ${getScoreColor()}`}>
              {score}
            </span>
            <span className="text-xs font-bold text-[#6B7280] tech-mono">
              / 100
            </span>
          </div>
        </div>

        {/* Breakdown Progress Bars */}
        <div className="space-y-2.5 mb-4">
          {categories.map((cat, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#6B7280] text-[11px]">{cat.label}</span>
                <span className="tech-mono font-bold text-[#111827] text-[11px]">{cat.value}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden border border-[#E5E7EB]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getBarColor(cat.value)}`}
                  style={{ width: `${cat.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mandatory Engineering Limitation Note (Section 9) */}
      <div className="p-2.5 rounded bg-[#F9FAFB] border border-[#E5E7EB] flex items-start gap-2 text-[10px] text-[#6B7280] leading-relaxed">
        <Info size={13} className="text-[#087F5B] shrink-0 mt-0.5" />
        <span>
          Composite indicator based on monitored prototype parameters. Serves as supervisory condition index.
        </span>
      </div>
    </div>
  );
}
