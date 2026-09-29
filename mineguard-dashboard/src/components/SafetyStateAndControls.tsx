import { useState } from 'react';
import type { TelemetryData, SimulationScenario } from '../utils/types';
import { Shield, ShieldAlert, AlertOctagon, Play, Square, RotateCcw } from 'lucide-react';

interface SafetyStateAndControlsProps {
  telemetry: TelemetryData;
  isDemoMode: boolean;
  setDemoMode: (val: boolean) => void;
  scenario: SimulationScenario;
  setScenario: (sc: SimulationScenario) => void;
  onOperatorAction?: (action: string) => void;
}

export default function SafetyStateAndControls({
  telemetry,
  isDemoMode,
  setDemoMode,
  scenario,
  setScenario,
  onOperatorAction
}: SafetyStateAndControlsProps) {
  const [operatorFeedback, setOperatorFeedback] = useState<string | null>(null);

  // Determine current Safety State (Section 25)
  const getSafetyState = (): {
    state: 'SAFE IDLE' | 'RUNNING' | 'WARNING' | 'CRITICAL' | 'STOP LATCHED' | 'FAULT' | 'RESET REQUIRED';
    color: string;
    bg: string;
    border: string;
    description: string;
  } => {
    if (telemetry.status === 'STOP_LATCHED') {
      return {
        state: 'STOP LATCHED',
        color: 'text-[var(--color-mine-critical)]',
        bg: 'bg-[var(--color-mine-critical-bg)]',
        border: 'border-[var(--color-mine-critical-border)]',
        description: 'Conveyor interlock engaged. Manual reset required before restart.'
      };
    }
    if (telemetry.status === 'CRITICAL') {
      return {
        state: 'CRITICAL',
        color: 'text-[var(--color-mine-critical)]',
        bg: 'bg-[var(--color-mine-critical-bg)]',
        border: 'border-[var(--color-mine-critical-border)]',
        description: 'Critical operating boundary exceeded. Hardware de-energization advised.'
      };
    }
    if (telemetry.status === 'SENSOR FAULT') {
      return {
        state: 'FAULT',
        color: 'text-[var(--color-mine-warning)]',
        bg: 'bg-[var(--color-mine-warning-bg)]',
        border: 'border-[var(--color-mine-warning-border)]',
        description: 'Sensor packet telemetry timeout or diagnostic failure.'
      };
    }
    if (telemetry.status === 'WARNING') {
      return {
        state: 'WARNING',
        color: 'text-[var(--color-mine-warning)]',
        bg: 'bg-[var(--color-mine-warning-bg)]',
        border: 'border-[var(--color-mine-warning-border)]',
        description: 'Operating condition elevated above nominal baseline.'
      };
    }
    if ((telemetry.rpm1 || 0) > 0 || telemetry.status === 'RUNNING') {
      return {
        state: 'RUNNING',
        color: 'text-[var(--color-mine-accent)]',
        bg: 'bg-[#E2ECE7]',
        border: 'border-[#C2D8CD]',
        description: 'Continuous haulage operational within monitored safety envelope.'
      };
    }
    return {
      state: 'SAFE IDLE',
      color: 'text-[var(--color-mine-dark)]',
      bg: 'bg-[#E4E7E1]',
      border: 'border-[#C2D8CD]',
      description: 'Conveyor motor standstill (0 RPM). Machine safely parked.'
    };
  };

  const safety = getSafetyState();

  const handleCommand = (cmd: 'START' | 'STOP' | 'RESET' | 'E-STOP') => {
    if (cmd === 'E-STOP') {
      setScenario('NORMAL');
      setOperatorFeedback('SUPERVISORY STOP INITIATED (Demonstration). Physical E-Stop push button remains local to electrical MCC.');
      if (onOperatorAction) onOperatorAction('EMERGENCY STOP (Supervisory)');
    } else if (cmd === 'START') {
      setOperatorFeedback('CONVEYOR START COMMAND TRANSMITTED. Telemetry actively streaming.');
      if (onOperatorAction) onOperatorAction('CONVEYOR START');
    } else if (cmd === 'STOP') {
      setOperatorFeedback('CONVEYOR CONTROLLED HALT COMMAND TRANSMITTED.');
      if (onOperatorAction) onOperatorAction('CONVEYOR STOP');
    } else if (cmd === 'RESET') {
      setOperatorFeedback('SAFETY LATCH RESET CLEARED (Supervisory). Check physical perimeter.');
      if (onOperatorAction) onOperatorAction('SAFETY RESET');
    }

    setTimeout(() => {
      setOperatorFeedback(null);
    }, 4500);
  };

  return (
    <div className="bg-[#FFFFFF] border border-[var(--color-mine-border)] rounded-lg p-4 shadow-2xs space-y-4">
      
      {/* Top Banner: Safety State (Section 25) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-[var(--color-mine-border)]">
        <div>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-[var(--color-mine-accent)]" />
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--color-mine-dark)]">
              SAFETY STATE & OPERATOR CONTROLS
            </h2>
          </div>
          <span className="text-xs text-[var(--color-mine-secondary)] font-medium mt-0.5 block">
            Functional machine state evaluation & supervisory override interface
          </span>
        </div>

        {/* Dedicated Safety State Pill */}
        <div className={`px-4 py-1.5 rounded border flex items-center gap-2 ${safety.bg} ${safety.border}`}>
          <span className={`w-2.5 h-2.5 rounded-full ${
            safety.state === 'CRITICAL' || safety.state === 'STOP LATCHED' 
              ? 'bg-red-600 animate-ping' 
              : safety.state === 'WARNING' || safety.state === 'FAULT'
              ? 'bg-amber-500' 
              : safety.state === 'RUNNING'
              ? 'bg-emerald-600 animate-pulse'
              : 'bg-gray-600'
          }`} />
          <span className={`tech-mono text-xs font-black tracking-wider ${safety.color}`}>
            {safety.state}
          </span>
        </div>
      </div>

      {/* Grid: Operator Controls vs Safety Architecture Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left: Operator Controls (Section 26) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[var(--color-mine-dark)]">
              OPERATOR COMMAND CONSOLE
            </span>
            <span className="text-[10px] tech-mono text-[var(--color-mine-secondary)]">
              Supervisory Level
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            
            {/* START */}
            <button
              onClick={() => handleCommand('START')}
              className="px-3 py-2.5 rounded bg-[var(--color-mine-panel-sub)] hover:bg-[#D5DDD7] text-[var(--color-mine-dark)] border border-[var(--color-mine-border)] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <Play size={13} className="text-[var(--color-mine-accent)] fill-current" />
              <span>START</span>
            </button>

            {/* STOP */}
            <button
              onClick={() => handleCommand('STOP')}
              className="px-3 py-2.5 rounded bg-[var(--color-mine-panel-sub)] hover:bg-[#D5DDD7] text-[var(--color-mine-dark)] border border-[var(--color-mine-border)] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <Square size={13} className="text-gray-700 fill-current" />
              <span>STOP</span>
            </button>

            {/* RESET */}
            <button
              onClick={() => handleCommand('RESET')}
              className="px-3 py-2.5 rounded bg-[var(--color-mine-panel-sub)] hover:bg-[#D5DDD7] text-[var(--color-mine-dark)] border border-[var(--color-mine-border)] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <RotateCcw size={13} className="text-[var(--color-mine-info)]" />
              <span>RESET</span>
            </button>

            {/* EMERGENCY STOP */}
            <button
              onClick={() => handleCommand('E-STOP')}
              className="px-3 py-2.5 rounded bg-[var(--color-mine-critical-bg)] hover:bg-[#F7D5D2] text-[var(--color-mine-critical)] border border-[var(--color-mine-critical-border)] font-black text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <AlertOctagon size={14} className="fill-current" />
              <span>E-STOP</span>
            </button>

          </div>

          {operatorFeedback && (
            <div className="p-2 rounded bg-[#FAF8F2] border border-[var(--color-mine-border)] text-xs text-[var(--color-mine-dark)] tech-mono">
              {operatorFeedback}
            </div>
          )}

          {/* Section 26 Mandated Disclaimer */}
          <div className="p-2.5 rounded bg-[#FAF8F2] border border-[var(--color-mine-border)] flex items-start gap-2 text-[11px] text-[var(--color-mine-secondary)]">
            <ShieldAlert size={15} className="text-[var(--color-mine-warning)] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[var(--color-mine-dark)] block">
                PHYSICAL E-STOP REQUIRED FOR HARDWARE SAFETY
              </strong>
              Browser controls are for demonstration and supervisory monitoring only. Physical machinery shutdown is local to the hardware contactor.
            </div>
          </div>
        </div>

        {/* Right: Physical Safety Architecture Flow (Section 28) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[var(--color-mine-dark)]">
              SAFETY ARCHITECTURE SEGREGATION (IEC 62443)
            </span>
            <span className="text-[10px] tech-mono text-[var(--color-mine-secondary)]">
              Defense-in-Depth
            </span>
          </div>

          <div className="space-y-2 text-[11px] tech-mono">
            {/* Supervisory Telemetry Stream */}
            <div className="p-2 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)]">
              <span className="text-[9px] uppercase font-bold text-[var(--color-mine-secondary)] block mb-0.5">
                SUPERVISORY TELEMETRY PIPELINE:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap text-[var(--color-mine-dark)] font-bold">
                <span>SENSORS</span>
                <span>➔</span>
                <span>LOCAL MCU</span>
                <span>➔</span>
                <span>CLOUD DB</span>
                <span>➔</span>
                <span className="text-[var(--color-mine-accent)]">HMI DASHBOARD</span>
              </div>
            </div>

            {/* Hardwired Physical Safety Circuit */}
            <div className="p-2 rounded bg-white border border-[var(--color-mine-critical-border)]">
              <span className="text-[9px] uppercase font-bold text-[var(--color-mine-critical)] block mb-0.5">
                LOCAL HARDWIRED SAFETY INTERLOCK CIRCUIT:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap text-[var(--color-mine-dark)] font-bold">
                <span className="text-red-600">PHYSICAL E-STOP</span>
                <span>➔</span>
                <span>HARDWARE RELAY</span>
                <span>➔</span>
                <span className="text-red-700">MOTOR CONTACTOR SHUTDOWN</span>
              </div>
            </div>
          </div>

          {/* Demonstration Mode Scenario Picker (Section 27) */}
          <div className="p-2 rounded bg-[#FCFBF8] border border-[var(--color-mine-border)] flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tech-mono text-[var(--color-mine-secondary)]">
                SIMULATION SCENARIO:
              </span>
              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border tech-mono ${
                isDemoMode ? 'bg-[#FBF4E6] text-[var(--color-mine-amber)] border-[var(--color-mine-warning-border)]' : 'bg-gray-100 text-gray-600 border-gray-300'
              }`}>
                {isDemoMode ? 'DEMO MODE' : 'LIVE SENSORS'}
              </span>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              {(['NORMAL', 'TEMP_RISE', 'VIBRATION_INC', 'BELT_SLIP'] as SimulationScenario[]).map(sc => (
                <button
                  key={sc}
                  onClick={() => {
                    setScenario(sc);
                    setDemoMode(true);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] tech-mono font-bold transition-colors ${
                    isDemoMode && scenario === sc 
                      ? 'bg-[var(--color-mine-accent)] text-white' 
                      : 'bg-[var(--color-mine-panel-sub)] text-[var(--color-mine-secondary)] hover:text-[var(--color-mine-dark)]'
                  }`}
                >
                  {sc.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
