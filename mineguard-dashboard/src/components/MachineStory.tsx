import type { TelemetryData, SimulationScenario } from '../utils/types';
import { Sparkles, ShieldCheck, AlertTriangle, AlertOctagon, Radio } from 'lucide-react';

interface MachineStoryProps {
  telemetry: TelemetryData;
  connectionStatus: 'CONNECTED' | 'OFFLINE' | 'STALE';
  isDemoMode: boolean;
  setDemoMode?: (val: boolean) => void;
  scenario?: SimulationScenario;
  setScenario?: (sc: SimulationScenario) => void;
}

export default function MachineStory({
  telemetry,
  connectionStatus,
  isDemoMode,
  setDemoMode,
  scenario,
  setScenario
}: MachineStoryProps) {
  const isCritical = telemetry.status === 'CRITICAL' || telemetry.status === 'STOP_LATCHED';
  const isWarning = telemetry.status === 'WARNING';
  const isFault = telemetry.status === 'SENSOR FAULT' || connectionStatus === 'OFFLINE';

  const getDynamicStory = () => {
    if (telemetry.status === 'STOP_LATCHED') {
      return 'Critical belt condition detected. Conveyor shutdown requested. Operator inspection required.';
    }
    if (telemetry.status === 'CRITICAL') {
      return 'Critical operating condition detected. Parameter excursion or surface tear exceeds mechanical threshold. Conveyor shutdown requested.';
    }
    if (telemetry.status === 'SENSOR FAULT' || connectionStatus === 'OFFLINE') {
      return 'A monitored sensor is currently unavailable. The affected measurement is excluded from live assessment.';
    }
    if (telemetry.status === 'WARNING') {
      if ((telemetry.belt_slip ?? 0) > 5) {
        return `Conveyor C-01 is operating under warning condition. Speed mismatch detected between drive and driven pulleys (${(telemetry.belt_slip ?? 0).toFixed(1)}% slip).`;
      }
      if ((telemetry.temperature ?? 0) > 45) {
        return `Conveyor C-01 is operating under warning condition. Drive bearing temperature has risen to ${(telemetry.temperature ?? 0).toFixed(1)}°C above baseline.`;
      }
      if ((telemetry.vibration ?? 0) > 3.0 && (telemetry.vibration ?? 0) < 50) {
        return `Conveyor C-01 is operating under warning condition. Drive vibration velocity has reached ${(telemetry.vibration ?? 0).toFixed(2)} mm/s.`;
      }
      if ((telemetry.motor_current ?? 0) > 3.0) {
        return 'Conveyor C-01 is operating under warning condition. Motor current has exceeded the configured baseline.';
      }
      if (telemetry.surface_condition === 'SCRATCH' || telemetry.surface_condition === 'DEEP_SCRATCH') {
        return 'Conveyor operating under warning condition. Surface defect detected by AI inspection.';
      }
      return 'Conveyor C-01 is operating under warning condition. A monitored parameter has moved outside its configured baseline.';
    }
    if ((telemetry.belt_speed ?? 0) === 0 && (telemetry.rpm1 ?? telemetry.rpm ?? 0) === 0) {
      return 'Conveyor C-01 is in a safe standby state (0 RPM). Monitored parameters remain within the configured baseline and AI vision is active.';
    }
    return 'Conveyor C-01 is operating normally. All monitored parameters remain within the configured operating baseline.';
  };

  const getStatusBadge = () => {
    if (isCritical) {
      return {
        label: 'CRITICAL',
        bg: 'bg-[#FEF2F2]',
        text: 'text-[#DC2626]',
        border: 'border-[#FECACA]',
        icon: <AlertOctagon size={13} className="text-[#DC2626]" />
      };
    }
    if (isWarning) {
      return {
        label: 'WARNING',
        bg: 'bg-[#FFFBEB]',
        text: 'text-[#D97706]',
        border: 'border-[#FDE68A]',
        icon: <AlertTriangle size={13} className="text-[#D97706]" />
      };
    }
    if (isFault) {
      return {
        label: 'FAULT',
        bg: 'bg-[#FFFBEB]',
        text: 'text-[#D97706]',
        border: 'border-[#FDE68A]',
        icon: <AlertTriangle size={13} className="text-[#D97706]" />
      };
    }
    return {
      label: 'NORMAL',
      bg: 'bg-[#ECFDF5]',
      text: 'text-[#087F5B]',
      border: 'border-[#A7F3D0]',
      icon: <ShieldCheck size={13} className="text-[#087F5B]" />
    };
  };

  const badge = getStatusBadge();

  const scenarios: { key: SimulationScenario; label: string }[] = [
    { key: 'NORMAL', label: 'NORMAL OPERATION' },
    { key: 'LOAD_INC', label: 'LOAD INCREASE' },
    { key: 'TEMP_RISE', label: 'TEMPERATURE RISE' },
    { key: 'VIBRATION_INC', label: 'VIBRATION INCREASE' },
    { key: 'BELT_SLIP', label: 'BELT SLIP' },
    { key: 'SLIGHT_SCRATCH', label: 'AI SCRATCH' },
    { key: 'LONGITUDINAL_TEAR', label: 'AI TEAR' },
    { key: 'SENSOR_DISCONNECT', label: 'SENSOR DISCONNECT' }
  ];

  const handleSelectScenario = (key: SimulationScenario) => {
    if (setDemoMode) setDemoMode(true);
    if (setScenario) setScenario(key);
  };

  return (
    <div className={`w-full bg-[#FFFFFF] border rounded-lg p-3.5 lg:p-4 shadow-xs transition-colors space-y-3 ${
      isCritical 
        ? 'border-[#FECACA] bg-[#FEF2F2]/30' 
        : isWarning 
        ? 'border-[#FDE68A] bg-[#FFFBEB]/30' 
        : 'border-[#E5E7EB]'
    }`}>
      {/* Top: Story content + Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Story content */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
            isCritical ? 'bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626]' :
            isWarning ? 'bg-[#FFFBEB] border border-[#FDE68A] text-[#D97706]' :
            'bg-[#ECFDF5] border border-[#A7F3D0] text-[#087F5B]'
          }`}>
            <Sparkles size={16} />
          </div>

          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] tech-mono">
                CURRENT MACHINE STORY
              </span>
              <span className="text-[10px] text-[#9CA3AF] tech-mono hidden sm:inline">
                // Real-Time Synthesizer
              </span>
            </div>
            <p className="text-sm font-semibold text-[#111827] leading-snug">
              "{getDynamicStory()}"
            </p>
          </div>
        </div>

        {/* Right Status Badge */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          <span className={`tech-mono text-[10px] font-bold px-3 py-1 rounded border flex items-center gap-1.5 shadow-xs ${badge.bg} ${badge.border} ${badge.text}`}>
            {badge.icon}
            {badge.label}
          </span>
          {isDemoMode && (
            <span className="tech-mono text-[9px] font-bold px-2 py-0.5 rounded bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] flex items-center gap-1">
              <Radio size={10} /> DEMO ACTIVE
            </span>
          )}
        </div>

      </div>

      {/* Section 6: Demo Scenarios Strip */}
      <div className="pt-2 border-t border-[#E5E7EB] flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase text-[#6B7280] tech-mono mr-1">
          DEMO SCENARIOS:
        </span>
        {scenarios.map(s => {
          const isActive = isDemoMode && scenario === s.key;
          return (
            <button
              key={s.key}
              onClick={() => handleSelectScenario(s.key)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold tech-mono transition-colors cursor-pointer border ${
                isActive
                  ? 'bg-[#087F5B] text-white border-[#087F5B] shadow-xs'
                  : 'bg-[#F9FAFB] text-[#4B5563] border-[#E5E7EB] hover:border-[#087F5B] hover:text-[#111827]'
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

    </div>
  );
}
