import { Activity, Database, Eye, Camera, CheckCircle2 } from 'lucide-react';
import type { TelemetryData } from '../utils/types';

interface BeltConditionAndHealthProps {
  telemetry: TelemetryData;
  connectionStatus: 'CONNECTED' | 'OFFLINE' | 'STALE';
  isMonitoring: boolean;
}

export default function BeltConditionAndHealth({
  telemetry,
  connectionStatus,
  isMonitoring
}: BeltConditionAndHealthProps) {
  const { healthScore, healthBreakdown } = telemetry;

  return (
    <div className="flex flex-col gap-4 h-full">
      
      {/* 1. Section 29: CONVEYOR HEALTH SCORE (92 / 100 - Healthy) */}
      <div className="bg-[#FFFFFF] border border-[var(--color-mine-border)] rounded-lg p-4 shadow-2xs">
        <div className="flex items-center justify-between pb-2.5 border-b border-[var(--color-mine-border)] mb-3">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wide text-[var(--color-mine-dark)]">
              CONVEYOR HEALTH SCORE
            </span>
            <span className="text-[10px] text-[var(--color-mine-secondary)] block">
              Overall operating health index
            </span>
          </div>
          <span className="tech-mono text-xs font-bold px-2 py-0.5 rounded bg-[#E3EDE8] text-[var(--color-mine-accent)] border border-[#C2D8CD]">
            HEALTHY
          </span>
        </div>

        {/* Circular / Large Score Display */}
        <div className="flex items-center gap-4 my-2 p-3 bg-[var(--color-mine-panel-sub)] rounded border border-[var(--color-mine-border)]">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-white border-4 border-[var(--color-mine-accent)] shadow-xs shrink-0">
            <span className="text-xl font-bold tech-mono text-[var(--color-mine-dark)]">
              {healthScore}
            </span>
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold text-[var(--color-mine-dark)]">
              Composite Equipment Health: {healthScore} / 100
            </div>
            <p className="text-[11px] text-[var(--color-mine-secondary)] leading-snug mt-0.5">
              Evaluated in real time across thermal, vibrational, and optical surface parameters.
            </p>
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="space-y-2 mt-3 text-xs">
          {[
            { label: 'Temperature Index', score: healthBreakdown.temperature, target: '< 45°C' },
            { label: 'Vibration Dynamics', score: healthBreakdown.vibration, target: 'ISO 10816' },
            { label: 'Drive Motor Load', score: healthBreakdown.motor, target: 'FLA 2.4 A' },
            { label: 'Belt Physical Wear', score: healthBreakdown.belt, target: '12.4 mm' },
            { label: 'AI Surface Vision', score: healthBreakdown.aiInspection, target: 'YOLO11s' }
          ].map((item, idx) => (
            <div key={idx}>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="font-semibold text-[var(--color-mine-dark)]">{item.label}</span>
                <span className="tech-mono font-bold text-[var(--color-mine-accent)]">{item.score}%</span>
              </div>
              <div className="w-full bg-[#E5E0D2] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[var(--color-mine-accent)] h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.score}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Section 9: BELT CONDITION PANEL */}
      <div className="bg-[#FFFFFF] border border-[var(--color-mine-border)] rounded-lg p-4 shadow-2xs">
        <div className="flex items-center justify-between pb-2.5 border-b border-[var(--color-mine-border)] mb-3">
          <span className="text-xs font-extrabold uppercase tracking-wide text-[var(--color-mine-dark)]">
            BELT CONDITION
          </span>
          <span className="tech-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#E3EDE8] text-[var(--color-mine-accent)] border border-[#C2D8CD] flex items-center gap-1">
            <CheckCircle2 size={11} /> INSPECTION PASSED
          </span>
        </div>

        {/* Belt Cross-Section Graphic */}
        <div className="p-3 bg-[var(--color-mine-panel-sub)] rounded border border-[var(--color-mine-border)] mb-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-mine-secondary)] mb-2 flex justify-between">
            <span>CARCASS CROSS-SECTION</span>
            <span className="tech-mono text-[var(--color-mine-dark)]">
              THICKNESS: {telemetry.belt_thickness !== null ? `${telemetry.belt_thickness.toFixed(1)} mm` : 'No Echo'}
            </span>
          </div>
          
          {/* Visual Layer Cake of Conveyor Rubber */}
          <div className="w-full space-y-1">
            {/* Top Cover */}
            <div className="h-3.5 bg-[#25302A] rounded-t-sm flex items-center justify-between px-2 text-[8px] text-[#A4B5AC] tech-mono font-bold">
              <span>TOP COVER (RUBBER)</span>
              <span>4.0 mm</span>
            </div>
            {/* Reinforced Textile Carcass Plies */}
            <div className="h-5 bg-[#D4CFBF] border-y border-[#9C9482] flex items-center justify-center text-[9px] text-[#17231F] tech-mono font-extrabold tracking-wider">
              EP 800/4 FABRIC REINFORCEMENT PLIES
            </div>
            {/* Bottom Pulley Cover */}
            <div className="h-2.5 bg-[#25302A] rounded-b-sm flex items-center justify-between px-2 text-[8px] text-[#A4B5AC] tech-mono font-bold">
              <span>BOTTOM COVER</span>
              <span>2.0 mm</span>
            </div>
          </div>
        </div>

        {/* Condition Parameters Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)]">
            <span className="text-[10px] text-[var(--color-mine-secondary)] font-bold uppercase block">Belt Thickness</span>
            <span className="text-base font-bold tech-mono text-[var(--color-mine-dark)]">
              {telemetry.belt_thickness !== null ? `${telemetry.belt_thickness.toFixed(1)} mm` : 'No Echo'}
            </span>
          </div>

          <div className="p-2 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)]">
            <span className="text-[10px] text-[var(--color-mine-secondary)] font-bold uppercase block">Belt Slip</span>
            <span className="text-base font-bold tech-mono text-[var(--color-mine-dark)]">
              {telemetry.belt_slip !== null ? `${telemetry.belt_slip.toFixed(1)} %` : '0.0 %'}
            </span>
          </div>

          <div className="p-2 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)]">
            <span className="text-[10px] text-[var(--color-mine-secondary)] font-bold uppercase block">Alignment</span>
            <span className="text-xs font-bold tech-mono text-[var(--color-mine-accent)] uppercase">{telemetry.belt_alignment}</span>
          </div>

          <div className="p-2 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)]">
            <span className="text-[10px] text-[var(--color-mine-secondary)] font-bold uppercase block">Surface Condition</span>
            <span className="text-xs font-bold tech-mono text-[var(--color-mine-accent)] uppercase">NORMAL</span>
          </div>
        </div>
      </div>

      {/* 3. Section 17: SYSTEM HEALTH */}
      <div className="bg-[#FFFFFF] border border-[var(--color-mine-border)] rounded-lg p-4 shadow-2xs">
        <div className="flex items-center justify-between pb-2.5 border-b border-[var(--color-mine-border)] mb-3">
          <span className="text-xs font-extrabold uppercase tracking-wide text-[var(--color-mine-dark)]">
            SYSTEM HEALTH
          </span>
          <span className="tech-mono text-[10px] font-bold text-[var(--color-mine-accent)]">
            ALL SUBSYSTEMS NOMINAL
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between p-2 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)]">
            <div className="flex items-center gap-1.5 font-medium text-[var(--color-mine-dark)]">
              <Activity size={13} className="text-[var(--color-mine-accent)]" /> Telemetry
            </div>
            <span className={`tech-mono font-bold flex items-center gap-1 ${connectionStatus === 'CONNECTED' ? 'text-[var(--color-mine-accent)]' : 'text-[var(--color-mine-warning)]'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'CONNECTED' ? 'bg-[var(--color-mine-accent)]' : 'bg-[var(--color-mine-warning)]'}`}></span> {connectionStatus === 'CONNECTED' ? 'LIVE' : connectionStatus}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)]">
            <div className="flex items-center gap-1.5 font-medium text-[var(--color-mine-dark)]">
              <Database size={13} className="text-[#3978A8]" /> Database
            </div>
            <span className="tech-mono font-bold text-[var(--color-mine-accent)] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-mine-accent)]"></span> CONNECTED
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)]">
            <div className="flex items-center gap-1.5 font-medium text-[var(--color-mine-dark)]">
              <Eye size={13} className="text-[#0B5C43]" /> AI Vision
            </div>
            <span className="tech-mono font-bold text-[var(--color-mine-accent)] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-mine-accent)]"></span> READY
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)]">
            <div className="flex items-center gap-1.5 font-medium text-[var(--color-mine-dark)]">
              <Camera size={13} className="text-[var(--color-mine-secondary)]" /> Camera
            </div>
            <span className="tech-mono font-bold text-[var(--color-mine-accent)] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-mine-accent)]"></span> {isMonitoring ? 'READY' : 'STANDBY'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Section 14: MINING ENVIRONMENT SECTION (FIELD CONTEXT) */}
      <div className="bg-[#FFFFFF] border border-[var(--color-mine-border)] rounded-lg p-4 shadow-2xs relative overflow-hidden">
        <div className="flex items-center justify-between pb-2.5 border-b border-[var(--color-mine-border)] mb-3">
          <span className="text-xs font-extrabold uppercase tracking-wide text-[var(--color-mine-dark)]">
            FIELD CONTEXT
          </span>
          <span className="tech-mono text-[10px] text-[var(--color-mine-secondary)] font-semibold">
            UNDERGROUND GALLERY 01
          </span>
        </div>

        {/* Realistic Conveyor Mining Photo Banner */}
        <div className="relative h-28 rounded overflow-hidden border border-[var(--color-mine-border)] bg-[#17231F] flex items-center justify-center">
          <img
            src="/demo_images/frame_00002_jpg.rf.5e28130cc2199a50e3b0fdc3d2e38885.jpg"
            alt="Mining Conveyor Gallery"
            className="w-full h-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
          
          <div className="absolute bottom-2 left-3 right-3 text-white">
            <div className="text-[11px] font-extrabold tracking-wider font-mono text-[#45D59E]">
              CONVEYOR C-01 MONITORED ZONE
            </div>
            <p className="text-[10px] text-gray-300 leading-tight mt-0.5">
              Live equipment condition is evaluated against the configured operating baseline.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
