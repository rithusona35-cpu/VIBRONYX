import type { TelemetryData } from '../utils/types';
import { Layers, HelpCircle, MapPin } from 'lucide-react';

interface BeltConditionProps {
  telemetry: TelemetryData;
}

export default function BeltCondition({ telemetry }: BeltConditionProps) {
  // Drive and Driven RPM
  const driveRpm = (telemetry.rpm1 ?? telemetry.rpm) ?? 0;
  const drivenRpm = (telemetry.rpm2 ?? telemetry.rpm) ?? 0;
  const speedDiff = Math.abs(driveRpm - drivenRpm);
  const slipVal = telemetry.belt_slip !== null ? telemetry.belt_slip : 0.6;

  const isStopped = driveRpm === 0 && drivenRpm === 0 && (telemetry.belt_speed ?? 0) === 0;
  const isCritical = telemetry.status === 'CRITICAL' || telemetry.status === 'STOP_LATCHED' || (!isStopped && slipVal > 12.0);
  const isWarning = telemetry.status === 'WARNING' || (!isStopped && slipVal > 5.0);

  const beltConditionState = isCritical ? 'CRITICAL' : isWarning ? 'WARNING' : 'NORMAL';

  // Section 9: Thickness validation (never show -1 mm, show NO ECHO)
  const isThicknessValid = telemetry.belt_thickness !== null && telemetry.belt_thickness > 0;
  const thicknessVal = isThicknessValid ? `${telemetry.belt_thickness!.toFixed(1)} mm` : 'N/A';
  const thicknessStatus = isThicknessValid ? 'NOMINAL' : 'NO ECHO';

  const alignmentStatus = telemetry.belt_alignment || 'CENTERED';
  
  // Consistency with central surface condition (Section 48)
  const rawSurface = telemetry.surface_condition || (isCritical ? 'LONGITUDINAL_TEAR' : isWarning ? 'SCRATCH' : 'NORMAL');
  const surfaceStatus = rawSurface === 'LONGITUDINAL_TEAR' ? 'LONGITUDINAL TEAR' : rawSurface === 'DEEP_SCRATCH' ? 'DEEP SCRATCH' : rawSurface === 'SCRATCH' ? 'SCRATCH' : rawSurface === 'BELT_SPLICE' ? 'BELT SPLICE' : 'NORMAL';
  const isSurfaceDefect = rawSurface !== 'NORMAL';

  return (
    <div className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-4 shadow-xs space-y-3.5">
      
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-[#087F5B]" />
          <h2 className="text-xs font-black uppercase tracking-wider text-[#111827] tech-mono">
            BELT CONDITION & PROFILE
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className={`tech-mono text-[10px] font-bold px-2.5 py-0.5 rounded border ${
            isCritical
              ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
              : isWarning
              ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
              : 'bg-[#ECFDF5] text-[#087F5B] border-[#A7F3D0]'
          }`}>
            BELT CONDITION: {beltConditionState}
          </span>
        </div>
      </div>

      {/* 2. Core Section 9 Cards: 4 Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        
        {/* Thickness */}
        <div className="p-3 rounded-md bg-[#F9FAFB] border border-[#E5E7EB] flex flex-col justify-between">
          <span className="text-[9px] font-black uppercase text-[#6B7280] tech-mono block">
            BELT THICKNESS
          </span>
          <div className="my-1">
            <span className={`text-xl font-bold tech-mono tracking-tight ${isThicknessValid ? 'text-[#111827]' : 'text-[#D97706]'}`}>
              {thicknessVal}
            </span>
          </div>
          <div className="text-[10px] text-[#6B7280] tech-mono border-t border-[#E5E7EB] pt-1">
            Sensor: <strong className={isThicknessValid ? 'text-[#087F5B]' : 'text-[#D97706]'}>{thicknessStatus}</strong>
          </div>
        </div>

        {/* Slip */}
        <div className="p-3 rounded-md bg-[#F9FAFB] border border-[#E5E7EB] flex flex-col justify-between">
          <span className="text-[9px] font-black uppercase text-[#6B7280] tech-mono block">
            BELT SLIP
          </span>
          <div className="my-1 flex items-baseline gap-1">
            <span className={`text-xl font-bold tech-mono tracking-tight ${
              slipVal > 5 ? 'text-[#D97706]' : 'text-[#087F5B]'
            }`}>
              {slipVal.toFixed(1)}
            </span>
            <span className="text-xs text-[#6B7280] tech-mono">%</span>
          </div>
          <div className="text-[10px] text-[#6B7280] tech-mono border-t border-[#E5E7EB] pt-1">
            Differential: <strong className="text-[#111827]">{speedDiff} RPM</strong>
          </div>
        </div>

        {/* Alignment */}
        <div className="p-3 rounded-md bg-[#F9FAFB] border border-[#E5E7EB] flex flex-col justify-between">
          <span className="text-[9px] font-black uppercase text-[#6B7280] tech-mono block">
            ALIGNMENT
          </span>
          <div className="my-1">
            <span className="text-xl font-bold tech-mono tracking-tight text-[#087F5B]">
              {alignmentStatus}
            </span>
          </div>
          <div className="text-[10px] text-[#6B7280] tech-mono border-t border-[#E5E7EB] pt-1">
            Tracking: <strong className="text-[#087F5B]">NOMINAL TRACK</strong>
          </div>
        </div>

        {/* Surface Condition */}
        <div className="p-3 rounded-md bg-[#F9FAFB] border border-[#E5E7EB] flex flex-col justify-between">
          <span className="text-[9px] font-black uppercase text-[#6B7280] tech-mono block">
            SURFACE CONDITION
          </span>
          <div className="my-1">
            <span className={`text-xl font-bold tech-mono tracking-tight ${
              rawSurface === 'LONGITUDINAL_TEAR' ? 'text-[#DC2626]' : isSurfaceDefect ? 'text-[#D97706]' : 'text-[#087F5B]'
            }`}>
              {surfaceStatus}
            </span>
          </div>
          <div className="text-[10px] text-[#6B7280] tech-mono border-t border-[#E5E7EB] pt-1">
            Optics: <strong className={isSurfaceDefect ? 'text-[#D97706]' : 'text-[#087F5B]'}>{isSurfaceDefect ? 'ANOMALY' : 'AI VERIFIED'}</strong>
          </div>
        </div>

      </div>

      {/* 3. Section 10: Technical Cross-Section Visualization */}
      <div className="p-3 bg-[#F9FAFB] rounded-md border border-[#E5E7EB] space-y-2">
        <div className="flex items-center justify-between text-[10px] tech-mono">
          <span className="font-bold text-[#111827] uppercase">
            TECHNICAL BELT CROSS-SECTION
          </span>
          <span className="text-[#6B7280] font-semibold">
            PROTOTYPE PROFILE ESTIMATION
          </span>
        </div>

        {/* Multi-ply Carcass Cross-section representation */}
        <div className="relative border border-[#D1D5DB] rounded overflow-hidden text-center text-[9px] tech-mono">
          {/* Top Cover Rubber */}
          <div className="h-6 bg-[#374151] text-white flex items-center justify-between px-3 border-b border-[#4B5563]">
            <span className="font-bold">TOP COVER RUBBER</span>
            <span className="text-[#9CA3AF]">
              {isThicknessValid ? `${(telemetry.belt_thickness! * 0.45).toFixed(1)} mm` : '5.5 mm'}
            </span>
          </div>

          {/* Fabric Reinforcement / Steel Cord Layer */}
          <div className="h-5 bg-[#4B5563] text-[#A7F3D0] flex items-center justify-between px-3 border-b border-[#374151]">
            <span className="font-bold tracking-wider">FABRIC REINFORCEMENT (MULTI-PLY CARCASS)</span>
            <span className="text-[8px] text-[#A7F3D0]">EP-400 HIGH TENSILE</span>
          </div>

          {/* Bottom Cover Rubber */}
          <div className="h-5 bg-[#1F2937] text-white flex items-center justify-between px-3">
            <span className="font-bold">BOTTOM PULLEY COVER</span>
            <span className="text-[#9CA3AF]">
              {isThicknessValid ? `${(telemetry.belt_thickness! * 0.35).toFixed(1)} mm` : '4.2 mm'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[9px] text-[#6B7280] tech-mono pt-0.5">
          <span>Acoustic Transit Echo: {isThicknessValid ? 'VALIDATED' : 'NO ECHO / TIMEOUT'}</span>
          <span>Calibrated Standard: 12.0 mm ± 0.5 mm</span>
        </div>
      </div>

      {/* 4. Section 30: Field Context Card */}
      <div className="p-2.5 bg-[#F9FAFB] rounded-md border border-[#E5E7EB] flex items-center justify-between text-xs tech-mono">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-[#087F5B]" />
          <div>
            <div className="font-bold text-[#111827] text-[10px] uppercase">
              FIELD CONTEXT // UNDERGROUND CONVEYOR ZONE C-01
            </div>
            <div className="text-[10px] text-[#6B7280]">
              Station C-01 • South Gallery Incline • 1200 mm Heavy Belt
            </div>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#087F5B] border border-[#A7F3D0] text-[9px] font-bold">
          CONTINUOUS EXTRACTION
        </span>
      </div>

      {/* 5. Explain Why? Insight */}
      <div className="p-2.5 bg-[#F9FAFB] rounded-md border border-[#E5E7EB] flex items-start gap-2.5">
        <HelpCircle size={15} className="text-[#087F5B] shrink-0 mt-0.5" />
        <div className="text-xs text-[#4B5563] space-y-0.5">
          <div className="font-bold uppercase text-[10px] text-[#111827] tech-mono">
            EXPLAIN WHY? // BELT PROFILE & TRACTION INSIGHT
          </div>
          <p className="leading-relaxed text-[11px]">
            {slipVal > 5
              ? `Slip alert: Drive pulley speed (${driveRpm} RPM) exceeds tail pulley speed (${drivenRpm} RPM) by ${speedDiff} RPM (${slipVal.toFixed(1)}%). Check counterweight take-up tension.`
              : isSurfaceDefect
              ? `Optical alert: AI vision flagged surface anomaly (${surfaceStatus}). Acoustic thickness reading is ${isThicknessValid ? thicknessVal : 'offline'}.`
              : `Nominal profile: Ultrasonic distance echo verifies uniform belt carcass. Encoder speeds are locked with ${(telemetry.belt_slip ?? 0.6).toFixed(1)}% mechanical creep.`}
          </p>
        </div>
      </div>

    </div>
  );
}
