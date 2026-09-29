import { useState } from 'react';
import type { TelemetryData, SimulationScenario } from '../utils/types';
import { Shield, AlertOctagon, Play, Square, RotateCcw, ChevronRight, Info } from 'lucide-react';

interface SafetyControlProps {
  telemetry: TelemetryData;
  isDemoMode: boolean;
  setDemoMode: (val: boolean) => void;
  scenario: SimulationScenario;
  setScenario: (sc: SimulationScenario) => void;
  onOperatorAction?: (action: string) => void;
}

export default function SafetyControl({
  telemetry,
  setDemoMode,
  setScenario,
  onOperatorAction
}: SafetyControlProps) {
  const [operatorFeedback, setOperatorFeedback] = useState<string | null>(null);

  const getSafetyState = (): {
    state: 'SAFE IDLE' | 'RUNNING' | 'WARNING' | 'CRITICAL' | 'STOP LATCHED' | 'RESET REQUIRED';
    color: string;
    bg: string;
    border: string;
    description: string;
  } => {
    if (telemetry.status === 'STOP_LATCHED') {
      return {
        state: 'STOP LATCHED',
        color: 'text-[#DC2626]',
        bg: 'bg-[#FEF2F2]',
        border: 'border-[#FECACA]',
        description: 'Hardwired / supervisory interlock tripped. Motor de-energized. Authorized physical reset required.'
      };
    }
    if (telemetry.status === 'CRITICAL') {
      return {
        state: 'CRITICAL',
        color: 'text-[#DC2626]',
        bg: 'bg-[#FEF2F2]',
        border: 'border-[#FECACA]',
        description: 'Critical operating boundary exceeded. Conveyor shutdown requested.'
      };
    }
    if (telemetry.status === 'WARNING') {
      return {
        state: 'WARNING',
        color: 'text-[#D97706]',
        bg: 'bg-[#FFFBEB]',
        border: 'border-[#FDE68A]',
        description: 'Parameter elevated above nominal baseline. Supervisory observation active.'
      };
    }
    if ((telemetry.belt_speed ?? 0) > 0 || (telemetry.rpm1 ?? telemetry.rpm ?? 0) > 0 || telemetry.status === 'RUNNING') {
      return {
        state: 'RUNNING',
        color: 'text-[#087F5B]',
        bg: 'bg-[#ECFDF5]',
        border: 'border-[#A7F3D0]',
        description: 'Continuous haulage operational within monitored safety envelope.'
      };
    }
    return {
      state: 'SAFE IDLE',
      color: 'text-[#6B7280]',
      bg: 'bg-[#F9FAFB]',
      border: 'border-[#E5E7EB]',
      description: 'Conveyor standstill (0 RPM / 0 m/s). Motor contactor de-energized in safe standby.'
    };
  };

  const safety = getSafetyState();
  const isLatched = safety.state === 'STOP LATCHED' || safety.state === 'CRITICAL';
  const isPhysicalEstopActive = telemetry.status === 'STOP_LATCHED';

  const handleCommand = (cmd: 'START' | 'STOP' | 'RESET' | 'EMERGENCY STOP') => {
    if (cmd === 'EMERGENCY STOP') {
      setDemoMode(true);
      setScenario('ESTOP');
      setOperatorFeedback('SUPERVISORY EMERGENCY STOP INITIATED. Safety latch interlock engaged. Local physical E-stop remains priority.');
      if (onOperatorAction) onOperatorAction('EMERGENCY STOP (Supervisory)');
    } else if (cmd === 'RESET') {
      setDemoMode(true);
      setScenario('NORMAL');
      setOperatorFeedback('AUTHORIZED SAFETY RESET CLEARED. Safety latch restored to SAFE IDLE.');
      if (onOperatorAction) onOperatorAction('AUTHORIZED SAFETY RESET');
    } else if (cmd === 'START') {
      if (isLatched) {
        setOperatorFeedback('START BLOCKED: Critical safety latch active. Physical inspection and authorized reset required prior to restart.');
        return;
      }
      setDemoMode(true);
      setScenario('NORMAL');
      setOperatorFeedback('CONVEYOR START COMMAND TRANSMITTED. Telemetry streaming.');
      if (onOperatorAction) onOperatorAction('CONVEYOR START');
    } else if (cmd === 'STOP') {
      setDemoMode(true);
      setOperatorFeedback('CONVEYOR CONTROLLED HALT INITIATED.');
      if (onOperatorAction) onOperatorAction('CONVEYOR STOP');
    }
  };

  const workflowSteps = [
    { id: 1, label: 'NORMAL OPERATION', active: safety.state === 'RUNNING' },
    { id: 2, label: 'ANOMALY DETECTED', active: safety.state === 'WARNING' },
    { id: 3, label: 'WARNING', active: safety.state === 'WARNING' },
    { id: 4, label: 'CRITICAL', active: safety.state === 'CRITICAL' },
    { id: 5, label: 'MOTOR STOP', active: isLatched },
    { id: 6, label: 'SAFETY LATCH', active: safety.state === 'STOP LATCHED' },
    { id: 7, label: 'OPERATOR INSPECTION', active: safety.state === 'STOP LATCHED' },
    { id: 8, label: 'AUTHORIZED RESET', active: false },
    { id: 9, label: 'SAFE IDLE', active: safety.state === 'SAFE IDLE' },
    { id: 10, label: 'RESTART', active: false }
  ];

  return (
    <div className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-4 shadow-xs space-y-4">
      
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-[#087F5B]" />
          <h2 className="text-xs font-black uppercase tracking-wider text-[#111827] tech-mono">
            SAFETY CONTROL
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className={`tech-mono text-[10px] font-black px-2.5 py-0.5 rounded border ${
            isPhysicalEstopActive
              ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA] animate-pulse'
              : 'bg-[#ECFDF5] text-[#087F5B] border-[#A7F3D0]'
          }`}>
            PHYSICAL E-STOP: {isPhysicalEstopActive ? '● ACTIVE' : '● READY'}
          </span>
        </div>
      </div>

      {/* 2. Safety State & Controls (Section 21) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* State Banner */}
        <div className={`lg:col-span-6 p-4 rounded-lg border ${safety.bg} ${safety.border} flex flex-col justify-between`}>
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider text-[#6B7280] tech-mono block mb-1">
              SAFETY STATE:
            </span>
            <div className="flex items-center gap-2.5 my-1">
              <span className={`w-3 h-3 rounded-full shrink-0 ${isLatched ? 'bg-[#DC2626] animate-ping' : safety.state === 'WARNING' ? 'bg-[#D97706]' : 'bg-[#087F5B]'}`} />
              <span className={`text-2xl font-black tech-mono tracking-tight ${safety.color}`}>
                {safety.state}
              </span>
            </div>
            <p className="text-xs text-[#111827] font-medium leading-relaxed mt-2">
              {safety.description}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-[#E5E7EB] text-[10px] text-[#6B7280] flex items-center justify-between">
            <span>Interlock: <strong className="text-[#111827]">{isLatched ? 'LATCHED (RESET REQUIRED)' : 'CLEAR'}</strong></span>
            <span>Relay Status: <strong className="text-[#087F5B]">ENERGIZED</strong></span>
          </div>
        </div>

        {/* Prototype Supervisory Controls */}
        <div className="lg:col-span-6 p-4 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#6B7280] tech-mono">
                PROTOTYPE HMI CONTROLS
              </span>
              <span className="text-[9px] text-[#9CA3AF] tech-mono">Supervisory Interlock</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-2">
              <button
                onClick={() => handleCommand('START')}
                disabled={isLatched}
                className="p-2.5 rounded bg-[#ECFDF5] hover:bg-[#D1FAE5] border border-[#A7F3D0] text-[#087F5B] font-bold text-xs flex flex-col items-center gap-1 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-xs"
              >
                <Play size={16} /> START
              </button>

              <button
                onClick={() => handleCommand('STOP')}
                className="p-2.5 rounded bg-[#FFFFFF] hover:bg-[#E5E7EB] border border-[#D1D5DB] text-[#111827] font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer shadow-xs"
              >
                <Square size={16} /> STOP
              </button>

              <button
                onClick={() => handleCommand('EMERGENCY STOP')}
                className="p-2.5 rounded bg-[#DC2626] hover:bg-[#B91C1C] border border-[#B91C1C] text-white font-black text-xs flex flex-col items-center gap-1 transition-all cursor-pointer shadow-sm"
              >
                <AlertOctagon size={16} /> EMERGENCY STOP
              </button>

              <button
                onClick={() => handleCommand('RESET')}
                className="p-2.5 rounded bg-[#FFFBEB] hover:bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer shadow-xs"
              >
                <RotateCcw size={16} /> RESET
              </button>
            </div>
          </div>

          {operatorFeedback && (
            <div className="mt-2 p-2 rounded bg-[#FFFFFF] border border-[#E5E7EB] text-[11px] text-[#111827] font-mono leading-tight shadow-xs">
              {operatorFeedback}
            </div>
          )}

          <div className="mt-2 text-[9px] text-[#6B7280] flex items-center gap-1.5 leading-snug">
            <Info size={11} className="text-[#087F5B] shrink-0" />
            <span>
              <strong>Independence Note:</strong> Physical E-stop is independent of dashboard, Wi-Fi, cloud and AI. Prototype designed using established machinery-safety principles.
            </span>
          </div>
        </div>

      </div>

      {/* 3. Visual Safety Workflow Diagram */}
      <div className="p-3.5 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
        <div className="text-[10px] font-black uppercase tracking-wider text-[#6B7280] tech-mono mb-2 flex items-center justify-between">
          <span>SAFETY WORKFLOW ARCHITECTURE // DETERMINISTIC SEQUENCE</span>
          <span className="text-[9px] text-[#9CA3AF]">Critical ➔ Restart Blocked</span>
        </div>

        <div className="flex flex-wrap items-center gap-1 text-[10px] tech-mono font-bold">
          {workflowSteps.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-1">
              <span className={`px-2 py-1 rounded border transition-all ${
                step.active
                  ? 'bg-[#087F5B] text-white border-[#087F5B] font-black shadow-xs'
                  : 'bg-[#FFFFFF] text-[#6B7280] border-[#E5E7EB]'
              }`}>
                {step.id}. {step.label}
              </span>
              {idx < workflowSteps.length - 1 && (
                <ChevronRight size={12} className="text-[#9CA3AF] shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
