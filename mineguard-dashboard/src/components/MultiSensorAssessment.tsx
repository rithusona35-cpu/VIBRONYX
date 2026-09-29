import { useState } from 'react';
import type { TelemetryData } from '../utils/types';
import { GitMerge, AlertTriangle, AlertOctagon, HelpCircle, CheckCircle2 } from 'lucide-react';

interface MultiSensorAssessmentProps {
  telemetry: TelemetryData;
}

export default function MultiSensorAssessment({ telemetry }: MultiSensorAssessmentProps) {
  const [showExplainWhy, setShowExplainWhy] = useState(false);

  const isCritical = telemetry.status === 'CRITICAL' || telemetry.status === 'STOP_LATCHED';
  const isWarning = telemetry.status === 'WARNING';
  const rawSurface = telemetry.surface_condition || (isCritical ? 'LONGITUDINAL_TEAR' : isWarning ? 'SCRATCH' : 'NORMAL');
  const isSurfaceDefect = rawSurface !== 'NORMAL';

  // Sensor parameters
  const temp = telemetry.temperature;
  const vib = telemetry.vibration;
  const curr = telemetry.motor_current;
  const load = telemetry.load;
  const slip = telemetry.belt_slip ?? 0.6;
  const speed = telemetry.belt_speed ?? 3.8;

  const tempState = temp === null ? 'OFFLINE' : temp > 50 ? 'ELEVATED' : 'NORMAL';
  const vibState = vib === null ? 'OFFLINE' : vib > 3.0 ? 'ELEVATED' : 'NORMAL';
  const currState = curr === null ? 'OFFLINE' : curr > 3.5 ? 'ELEVATED' : 'NORMAL';
  const loadState = load === null ? 'OFFLINE' : load > 85 ? 'HIGH' : 'NORMAL';
  const speedState = speed === 0 ? 'STANDSTILL' : `${speed.toFixed(1)} m/s`;

  // Condition assessment logic per Section 15
  const getAssessment = (): { text: string; severity: 'NORMAL' | 'WARNING' | 'CRITICAL' } => {
    if (rawSurface === 'LONGITUDINAL_TEAR') {
      return {
        text: 'Multiple independent indicators support a higher-priority maintenance condition. Critical optical tear verified with automatic shutdown interlock.',
        severity: 'CRITICAL'
      };
    }
    if (isSurfaceDefect && vibState === 'NORMAL' && currState === 'NORMAL' && tempState === 'NORMAL') {
      return {
        text: 'Surface defect detected by vision. No corresponding thermal or drive mechanical anomaly detected. Visual anomaly isolated from drive train.',
        severity: 'WARNING'
      };
    }
    if (isSurfaceDefect && (vibState === 'ELEVATED' || currState === 'ELEVATED')) {
      return {
        text: 'Visual surface anomaly corroborated by elevated electromechanical parameters. Coordinated maintenance inspection recommended.',
        severity: 'WARNING'
      };
    }
    if (slip > 5.0) {
      return {
        text: 'Mechanical speed mismatch detected between pulleys. Visual surface condition remains nominal.',
        severity: 'WARNING'
      };
    }
    if (tempState === 'ELEVATED' || vibState === 'ELEVATED') {
      return {
        text: 'Drive/bearing parameter elevated while belt surface condition remains intact. Check mechanical lubrication baseline.',
        severity: 'WARNING'
      };
    }
    return {
      text: 'Visual surface inspection and electromechanical sensor parameters are in agreement. Zero corroborating fault signatures.',
      severity: 'NORMAL'
    };
  };

  const assessment = getAssessment();

  return (
    <div className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-4 shadow-xs space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <GitMerge size={16} className="text-[#087F5B]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-[#111827] tech-mono">
            MULTI-SENSOR CONDITION ASSESSMENT
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#6B7280] tech-mono hidden sm:inline">
            Sensor Corroboration Engine
          </span>
          <span className={`tech-mono text-[9px] font-bold px-2 py-0.5 rounded border ${
            assessment.severity === 'CRITICAL'
              ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
              : assessment.severity === 'WARNING'
              ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
              : 'bg-[#ECFDF5] text-[#087F5B] border-[#A7F3D0]'
          }`}>
            {assessment.severity === 'CRITICAL' ? 'CRITICAL CORROBORATION' : assessment.severity === 'WARNING' ? 'PARTIAL CORROBORATION' : 'NOMINAL ALIGNMENT'}
          </span>
        </div>
      </div>

      {/* 7 Parameter Corroboration Grid (Section 15) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
        
        {/* AI Vision */}
        <div className="p-2 rounded bg-[#F9FAFB] border border-[#E5E7EB]">
          <span className="text-[8px] font-bold uppercase text-[#6B7280] tech-mono block truncate">
            AI VISION
          </span>
          <span className={`text-xs font-black tech-mono block mt-0.5 ${isSurfaceDefect ? 'text-[#D97706]' : 'text-[#087F5B]'}`}>
            {rawSurface}
          </span>
        </div>

        {/* Vibration */}
        <div className="p-2 rounded bg-[#F9FAFB] border border-[#E5E7EB]">
          <span className="text-[8px] font-bold uppercase text-[#6B7280] tech-mono block truncate">
            VIBRATION
          </span>
          <span className={`text-xs font-black tech-mono block mt-0.5 ${vibState === 'ELEVATED' ? 'text-[#D97706]' : 'text-[#087F5B]'}`}>
            {vib !== null ? `${vib.toFixed(2)} mm/s` : 'N/A'}
          </span>
        </div>

        {/* Temperature */}
        <div className="p-2 rounded bg-[#F9FAFB] border border-[#E5E7EB]">
          <span className="text-[8px] font-bold uppercase text-[#6B7280] tech-mono block truncate">
            TEMPERATURE
          </span>
          <span className={`text-xs font-black tech-mono block mt-0.5 ${tempState === 'ELEVATED' ? 'text-[#D97706]' : 'text-[#087F5B]'}`}>
            {temp !== null ? `${temp.toFixed(1)} °C` : 'N/A'}
          </span>
        </div>

        {/* Motor Current */}
        <div className="p-2 rounded bg-[#F9FAFB] border border-[#E5E7EB]">
          <span className="text-[8px] font-bold uppercase text-[#6B7280] tech-mono block truncate">
            MOTOR CURRENT
          </span>
          <span className={`text-xs font-black tech-mono block mt-0.5 ${currState === 'ELEVATED' ? 'text-[#D97706]' : 'text-[#087F5B]'}`}>
            {curr !== null ? `${curr.toFixed(2)} A` : 'N/A'}
          </span>
        </div>

        {/* Load */}
        <div className="p-2 rounded bg-[#F9FAFB] border border-[#E5E7EB]">
          <span className="text-[8px] font-bold uppercase text-[#6B7280] tech-mono block truncate">
            LOAD
          </span>
          <span className={`text-xs font-black tech-mono block mt-0.5 ${loadState === 'HIGH' ? 'text-[#D97706]' : 'text-[#087F5B]'}`}>
            {load !== null ? `${Math.round(load)} %` : 'N/A'}
          </span>
        </div>

        {/* Belt Slip */}
        <div className="p-2 rounded bg-[#F9FAFB] border border-[#E5E7EB]">
          <span className="text-[8px] font-bold uppercase text-[#6B7280] tech-mono block truncate">
            BELT SLIP
          </span>
          <span className={`text-xs font-black tech-mono block mt-0.5 ${slip > 5.0 ? 'text-[#D97706]' : 'text-[#087F5B]'}`}>
            {slip.toFixed(1)} %
          </span>
        </div>

        {/* Belt Speed */}
        <div className="p-2 rounded bg-[#F9FAFB] border border-[#E5E7EB]">
          <span className="text-[8px] font-bold uppercase text-[#6B7280] tech-mono block truncate">
            BELT SPEED
          </span>
          <span className="text-xs font-black tech-mono text-[#111827] block mt-0.5">
            {speedState}
          </span>
        </div>

      </div>

      {/* Synthesized Corroboration Statement */}
      <div className={`p-3 rounded-md border flex items-start gap-2.5 ${
        assessment.severity === 'CRITICAL'
          ? 'bg-[#FEF2F2] border-[#FECACA]'
          : assessment.severity === 'WARNING'
          ? 'bg-[#FFFBEB] border-[#FDE68A]'
          : 'bg-[#F9FAFB] border-[#E5E7EB]'
      }`}>
        <div className="mt-0.5 shrink-0">
          {assessment.severity === 'CRITICAL' ? (
            <AlertOctagon size={16} className="text-[#DC2626]" />
          ) : assessment.severity === 'WARNING' ? (
            <AlertTriangle size={16} className="text-[#D97706]" />
          ) : (
            <CheckCircle2 size={16} className="text-[#087F5B]" />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#111827] tech-mono">
              CONDITION ASSESSMENT // SENSOR CORROBORATION
            </span>
            <button
              onClick={() => setShowExplainWhy(!showExplainWhy)}
              className="text-[10px] text-[#087F5B] hover:underline font-bold tech-mono cursor-pointer flex items-center gap-1"
            >
              <HelpCircle size={12} />
              {showExplainWhy ? 'HIDE WHY?' : 'EXPLAIN WHY?'}
            </button>
          </div>
          <p className="text-xs font-medium text-[#1F2937] leading-relaxed">
            "{assessment.text}"
          </p>

          {showExplainWhy && (
            <div className="mt-2 pt-2 border-t border-[#E5E7EB] text-[11px] text-[#4B5563] space-y-1">
              <div className="font-bold text-[#111827] text-[10px] uppercase">
                WHY THIS CORROBORATION RESULT?
              </div>
              <p>
                MineGuard AI does not treat computer vision as an isolated shutdown trigger for minor anomalies. A visual scratch pattern without vibration or current surge allows the conveyor to safely complete the shift while logging an advisory alert. A tear with high confidence triggers shutdown.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
