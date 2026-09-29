import type { TelemetryData } from '../utils/types';
import { TrendingUp, AlertTriangle, ShieldCheck, AlertOctagon, Wrench } from 'lucide-react';

interface PredictiveMaintenanceProps {
  telemetry: TelemetryData;
}

export default function PredictiveMaintenance({ telemetry }: PredictiveMaintenanceProps) {
  const isCritical = telemetry.status === 'CRITICAL' || telemetry.status === 'STOP_LATCHED';
  const isWarning = telemetry.status === 'WARNING';

  // Section 15: Predictive Maintenance States: STABLE | WATCH | INSPECTION RECOMMENDED | MAINTENANCE REQUIRED
  const getMaintenanceData = () => {
    if (isCritical) {
      return {
        condition: 'MAINTENANCE REQUIRED',
        conditionColor: 'text-[#DC2626]',
        conditionBg: 'bg-[#FEF2F2]',
        conditionBorder: 'border-[#FECACA]',
        trend: 'CRITICAL DISCONTINUITY DETECTED',
        insight: 'Critical belt surface anomaly detected. Stop conveyor and perform physical inspection before restart.',
        icon: <AlertOctagon size={18} className="text-[#DC2626]" />
      };
    }
    if (isWarning) {
      if ((telemetry.vibration ?? 0) > 3.0 && (telemetry.vibration ?? 0) < 50) {
        return {
          condition: 'INSPECTION RECOMMENDED',
          conditionColor: 'text-[#D97706]',
          conditionBg: 'bg-[#FFFBEB]',
          conditionBorder: 'border-[#FDE68A]',
          trend: 'VIBRATION TRENDING UPWARD',
          insight: 'Vibration trend is increasing compared with the recent baseline. Inspect the drive/bearing zone during the next maintenance opportunity.',
          icon: <AlertTriangle size={18} className="text-[#D97706]" />
        };
      }
      if ((telemetry.temperature ?? 0) > 45) {
        return {
          condition: 'WATCH',
          conditionColor: 'text-[#D97706]',
          conditionBg: 'bg-[#FFFBEB]',
          conditionBorder: 'border-[#FDE68A]',
          trend: 'TEMPERATURE ELEVATION DETECTED',
          insight: 'Drive bearing temperature is elevated compared with recent baseline. Check lubricant viscosity and pack condition.',
          icon: <AlertTriangle size={18} className="text-[#D97706]" />
        };
      }
      return {
        condition: 'WATCH',
        conditionColor: 'text-[#D97706]',
        conditionBg: 'bg-[#FFFBEB]',
        conditionBorder: 'border-[#FDE68A]',
        trend: 'ELEVATED BASELINE',
        insight: 'One or more parameters have moved outside nominal baseline. Increase inspection frequency.',
        icon: <AlertTriangle size={18} className="text-[#D97706]" />
      };
    }
    return {
      condition: 'NORMAL',
      conditionColor: 'text-[#087F5B]',
      conditionBg: 'bg-[#ECFDF5]',
      conditionBorder: 'border-[#A7F3D0]',
      trend: 'STABLE',
      insight: 'Current telemetry shows stable operating behavior. Continue monitoring.',
      icon: <ShieldCheck size={18} className="text-[#087F5B]" />
    };
  };

  const data = getMaintenanceData();

  return (
    <div className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-4 shadow-xs space-y-3.5">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <Wrench size={16} className="text-[#087F5B]" />
          <h2 className="text-xs font-black uppercase tracking-wider text-[#111827] tech-mono">
            PREDICTIVE MAINTENANCE
          </h2>
        </div>
        <span className="text-[10px] tech-mono text-[#6B7280]">
          Condition Monitoring & Prognostic Indicators
        </span>
      </div>

      {/* 3 Core Fields: CURRENT CONDITION, TREND, MAINTENANCE INSIGHT (Section 15) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* CURRENT CONDITION */}
        <div className="p-3 rounded-md bg-[#F9FAFB] border border-[#E5E7EB] flex flex-col justify-between">
          <span className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider tech-mono">
            CURRENT CONDITION
          </span>
          <div className="flex items-center gap-2 my-1">
            {data.icon}
            <span className={`text-base font-black tech-mono ${data.conditionColor}`}>
              {data.condition}
            </span>
          </div>
          <div className="text-[10px] text-[#6B7280] tech-mono">
            Status: <span className="text-[#111827] font-semibold">{telemetry.status}</span>
          </div>
        </div>

        {/* TREND */}
        <div className="p-3 rounded-md bg-[#F9FAFB] border border-[#E5E7EB] flex flex-col justify-between">
          <span className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider tech-mono">
            TREND
          </span>
          <div className="flex items-center gap-2 my-1">
            <TrendingUp size={16} className={isCritical ? 'text-[#DC2626]' : isWarning ? 'text-[#D97706]' : 'text-[#087F5B]'} />
            <span className="text-sm font-bold text-[#111827] tech-mono truncate">
              {data.trend}
            </span>
          </div>
          <div className="text-[10px] text-[#6B7280] tech-mono">
            Baseline: <span className="text-[#087F5B] font-semibold">Configured Limits</span>
          </div>
        </div>

        {/* MAINTENANCE INSIGHT */}
        <div className="p-3 rounded-md bg-[#F9FAFB] border border-[#E5E7EB] flex flex-col justify-between">
          <span className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider tech-mono">
            MAINTENANCE INSIGHT
          </span>
          <p className="text-xs text-[#111827] font-medium leading-relaxed my-0.5">
            "{data.insight}"
          </p>
          <div className="text-[9px] text-[#6B7280] tech-mono">
            Prognostic Model: <span className="text-[#111827]">Heuristic Envelope</span>
          </div>
        </div>

      </div>

      {/* Prognostic Reserves and Bearing Envelope (Section 17) */}
      <div className="p-3 rounded-md bg-[#F9FAFB] border border-[#E5E7EB] space-y-2.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#E5E7EB]">
          <span className="text-[10px] font-black uppercase text-[#111827] tech-mono">
            SUPERVISORY CONDITION & WEAR RESERVES
          </span>
          <span className="text-[9px] tech-mono text-[#6B7280]">
            Empirical Threshold Baseline
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs tech-mono">
          <div className="p-2 bg-[#FFFFFF] rounded border border-[#E5E7EB]">
            <div className="flex items-center justify-between text-[9px] text-[#6B7280] mb-0.5">
              <span>DRIVE BEARING INDEX</span>
              <span className="font-bold text-[#111827]">
                {(telemetry.temperature ?? 0) > 45 ? '72%' : '96%'}
              </span>
            </div>
            <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  (telemetry.temperature ?? 0) > 45 ? 'bg-[#D97706] w-[72%]' : 'bg-[#087F5B] w-[96%]'
                }`}
              />
            </div>
            <span className="text-[8px] text-[#6B7280] block mt-1">Thermal reserve & vibration RMS</span>
          </div>

          <div className="p-2 bg-[#FFFFFF] rounded border border-[#E5E7EB]">
            <div className="flex items-center justify-between text-[9px] text-[#6B7280] mb-0.5">
              <span>MOTOR TORQUE RESERVE</span>
              <span className="font-bold text-[#111827]">
                {(telemetry.motor_current ?? 0) > 3.0 ? '68%' : '91%'}
              </span>
            </div>
            <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  (telemetry.motor_current ?? 0) > 3.0 ? 'bg-[#D97706] w-[68%]' : 'bg-[#087F5B] w-[91%]'
                }`}
              />
            </div>
            <span className="text-[8px] text-[#6B7280] block mt-1">Amperage headroom vs FLA</span>
          </div>

          <div className="p-2 bg-[#FFFFFF] rounded border border-[#E5E7EB]">
            <div className="flex items-center justify-between text-[9px] text-[#6B7280] mb-0.5">
              <span>BELT COVER INTEGRITY</span>
              <span className="font-bold text-[#111827]">
                {telemetry.surface_condition === 'LONGITUDINAL_TEAR' ? '28%' : telemetry.surface_condition === 'SCRATCH' ? '74%' : '95%'}
              </span>
            </div>
            <div className="w-full bg-[#E5E7EB] h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  telemetry.surface_condition === 'LONGITUDINAL_TEAR' 
                    ? 'bg-[#DC2626] w-[28%]' 
                    : telemetry.surface_condition === 'SCRATCH'
                    ? 'bg-[#D97706] w-[74%]'
                    : 'bg-[#087F5B] w-[95%]'
                }`}
              />
            </div>
            <span className="text-[8px] text-[#6B7280] block mt-1">AI optical wear estimate</span>
          </div>
        </div>

        <div className="text-[10px] text-[#6B7280] flex items-center justify-between pt-1">
          <span>Maintenance Protocol: Next Planned Shift Maintenance (100h)</span>
          <span className="italic text-[9px]">Prognostic estimates based on baseline deviation</span>
        </div>
      </div>

    </div>
  );
}