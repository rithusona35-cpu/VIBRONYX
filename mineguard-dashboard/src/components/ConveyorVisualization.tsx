import type { TelemetryData } from '../utils/types';
import { Activity } from 'lucide-react';

interface ConveyorVisualizationProps {
  telemetry: TelemetryData;
}

export default function ConveyorVisualization({
  telemetry
}: ConveyorVisualizationProps) {
  const isRunning = (telemetry.rpm1 || 0) > 0 || telemetry.status === 'RUNNING';
  const isCritical = telemetry.status === 'CRITICAL' || telemetry.status === 'STOP_LATCHED';
  const isWarning = telemetry.status === 'WARNING';

  // Mechanical status badge
  const statusBadge = isCritical 
    ? { label: 'CRITICAL LATCHED', bg: 'bg-[var(--color-mine-critical-bg)] text-[var(--color-mine-critical)] border-[var(--color-mine-critical-border)]' }
    : isWarning 
    ? { label: 'ELEVATED SLIP / WEAR', bg: 'bg-[var(--color-mine-warning-bg)] text-[var(--color-mine-warning)] border-[var(--color-mine-warning-border)]' }
    : isRunning 
    ? { label: 'OPERATIONAL ROTATION', bg: 'bg-[#E2ECE7] text-[var(--color-mine-accent)] border-[#C2D8CD]' }
    : { label: 'CONVEYOR STANDSTILL', bg: 'bg-gray-100 text-gray-700 border-gray-300' };

  return (
    <div className="bg-[#FFFFFF] border border-[var(--color-mine-border)] rounded-lg p-4 shadow-2xs space-y-3">
      
      {/* Schematic Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[var(--color-mine-border)]">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-[var(--color-mine-accent)]" />
          <h2 className="text-xs font-extrabold uppercase tracking-wide text-[var(--color-mine-dark)]">
            CONVEYOR SCHEMATIC & MECHANICAL TRACK
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] tech-mono text-[var(--color-mine-secondary)]">Station C-01 // Longitudinal Layout</span>
          <span className={`tech-mono text-[10px] font-bold px-2 py-0.5 rounded border ${statusBadge.bg}`}>
            {statusBadge.label}
          </span>
        </div>
      </div>

      {/* Mechanical Schematic Stage (Section 21) */}
      <div className={`relative pt-6 pb-6 px-4 bg-[#F8F6F0] rounded border transition-colors overflow-hidden ${
        isCritical 
          ? 'border-red-300 shadow-[inset_0_0_15px_rgba(201,71,61,0.06)]' 
          : isWarning 
          ? 'border-amber-300 shadow-[inset_0_0_15px_rgba(224,165,42,0.06)]' 
          : 'border-[var(--color-mine-border)]'
      }`}>
        
        {/* Subtle engineering grid background */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(var(--color-mine-border-strong) 1px, transparent 1px)`,
            backgroundSize: '16px 16px'
          }}
        />

        {/* Top Belt Strand (Carrying Strand) */}
        <div className="relative px-3 sm:px-8 z-10">
          <div className="h-7 w-full rounded-xs relative overflow-hidden shadow-xs conveyor-rubber-track border-y-2 border-[#24312A] flex items-center">
            {/* Belt motion animation (stops when stopped) */}
            <div className={`w-full h-full opacity-80 ${isRunning ? 'animate-conveyor-slow' : ''}`} />
            
            <div className="absolute inset-0 flex items-center justify-around pointer-events-none select-none">
              <span className="text-[9px] tech-mono font-extrabold text-[#45D59E] tracking-widest uppercase">
                HEAD DRIVE ◀ ◀ CARRYING STRAND ◀ ◀ TRANSFER CHUTE ◀ ◀ TAIL PULLEY
              </span>
            </div>
          </div>

          {/* Rollers Framework & Zones (Head Drive, Idlers, Transfer Zone, Tail Pulley) */}
          <div className="relative h-12 w-full flex items-center justify-between px-3 sm:px-6 -my-1">
            
            {/* Head Drive (Left Pulley) */}
            <div className="flex flex-col items-center">
              <div className={`w-11 h-11 rounded-full border-4 border-[#1E2923] bg-[#141C18] flex items-center justify-center shadow-md relative ${isCritical ? 'border-red-500' : ''}`}>
                <div className={`w-3.5 h-3.5 rounded-full bg-[#486355] border-2 border-white ${isRunning ? 'animate-spin' : ''}`} />
                {isRunning && (
                  <div className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-[var(--color-mine-accent)] animate-ping opacity-75" />
                )}
              </div>
              <span className="text-[9px] font-black text-[var(--color-mine-dark)] uppercase tech-mono mt-1">
                HEAD DRIVE
              </span>
              <span className="text-[8px] text-[var(--color-mine-secondary)] tech-mono">12V Geared DC</span>
            </div>

            {/* Carrying Idler 1 */}
            <div className="flex flex-col items-center">
              <div className="w-3.5 h-3.5 rounded-full bg-[#42574C] border border-[#678274]" />
              <div className="w-0.5 h-2 bg-[#9AA9A1]" />
              <span className="text-[8px] text-[var(--color-mine-secondary)] font-mono mt-0.5">Idler #1</span>
            </div>

            {/* Transfer Zone (Loading point) */}
            <div className="flex flex-col items-center px-3 py-1 bg-white/90 rounded border border-[#C2D8CD] shadow-2xs">
              <div className="w-2 h-2 rounded-full bg-[var(--color-mine-accent)] mb-0.5" />
              <span className="text-[9px] font-extrabold tech-mono text-[var(--color-mine-dark)] uppercase">
                TRANSFER ZONE
              </span>
              <span className="text-[8px] text-[var(--color-mine-secondary)] font-mono">Impact Bed</span>
            </div>

            {/* Optical AI Inspection Zone */}
            <div className="flex flex-col items-center px-3 py-1 bg-white/90 rounded border border-[#C2D8CD] shadow-2xs">
              <div className="w-2 h-2 rounded-full bg-[var(--color-mine-info)] mb-0.5" />
              <span className="text-[9px] font-extrabold tech-mono text-[var(--color-mine-dark)] uppercase">
                AI SCAN ZONE
              </span>
              <span className="text-[8px] text-[var(--color-mine-secondary)] font-mono">Camera & Sonar</span>
            </div>

            {/* Carrying Idler 2 */}
            <div className="flex flex-col items-center">
              <div className="w-3.5 h-3.5 rounded-full bg-[#42574C] border border-[#678274]" />
              <div className="w-0.5 h-2 bg-[#9AA9A1]" />
              <span className="text-[8px] text-[var(--color-mine-secondary)] font-mono mt-0.5">Idler #2</span>
            </div>

            {/* Tail Pulley (Right Pulley) */}
            <div className="flex flex-col items-center">
              <div className="w-11 h-11 rounded-full border-4 border-[#1E2923] bg-[#141C18] flex items-center justify-center shadow-md relative">
                <div className={`w-3.5 h-3.5 rounded-full bg-[#486355] border-2 border-white ${isRunning ? 'animate-spin' : ''}`} />
              </div>
              <span className="text-[9px] font-black text-[var(--color-mine-dark)] uppercase tech-mono mt-1">
                TAIL PULLEY
              </span>
              <span className="text-[8px] text-[var(--color-mine-secondary)] tech-mono">Take-Up Unit</span>
            </div>

          </div>

          {/* Bottom Belt Strand (Return Strand) */}
          <div className="h-4 w-full rounded-xs relative overflow-hidden conveyor-rubber-track border-y border-[#34443C] flex items-center opacity-70 mt-1">
            <div className={`w-full h-full ${isRunning ? 'animate-conveyor-slow' : ''}`} style={{ animationDirection: 'reverse' }} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[8px] tech-mono font-bold text-gray-300 tracking-wider">
                RETURN STRAND ➔ ➔ ➔
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
