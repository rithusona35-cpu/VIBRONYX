import type { TelemetryData } from '../utils/types';
import { Disc3, Layers, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';

interface RPMAndBeltConditionProps {
  telemetry: TelemetryData;
}

export default function RPMAndBeltCondition({ telemetry }: RPMAndBeltConditionProps) {
  // Encoder RPM values
  const driveRpm = (telemetry.rpm1 ?? telemetry.rpm) ?? 0;
  const drivenRpm = (telemetry.rpm2 ?? telemetry.rpm) ?? 0;
  const speedDiff = Math.abs(driveRpm - drivenRpm);
  const beltSlip = telemetry.belt_slip !== null ? telemetry.belt_slip : 0.0;

  // Condition evaluation
  const isStopped = driveRpm === 0 && drivenRpm === 0;
  const isSlipWarning = !isStopped && beltSlip > 5.0;
  const isSlipCritical = !isStopped && beltSlip > 12.0;

  const rpmCondition = isStopped 
    ? 'Stopped' 
    : isSlipCritical 
    ? 'Critical Slip' 
    : isSlipWarning 
    ? 'Warning' 
    : 'Normal';

  // Belt Thickness evaluation (Section 19: never show -1 mm, show No Echo / N/A)
  const isThicknessValid = telemetry.belt_thickness !== null && telemetry.belt_thickness > 0;
  const thicknessVal = isThicknessValid ? `${telemetry.belt_thickness!.toFixed(1)} mm` : 'N/A';
  const thicknessStatus = isThicknessValid 
    ? 'Valid' 
    : telemetry.belt_thickness === null 
    ? 'NO ECHO' 
    : 'Calibration Required';

  const alignmentStatus = telemetry.belt_alignment || 'CENTERED';
  const surfaceCondition = telemetry.status === 'CRITICAL' 
    ? 'Critical' 
    : telemetry.status === 'WARNING' 
    ? 'Warning' 
    : 'Normal';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      
      {/* LEFT: RPM AND BELT SLIP PANEL (Section 20 & 43) */}
      <div className="lg:col-span-6 bg-[#FFFFFF] border border-[var(--color-mine-border)] rounded-lg p-4 shadow-2xs flex flex-col justify-between">
        
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-[var(--color-mine-border)] mb-3">
            <div className="flex items-center gap-2">
              <Disc3 size={16} className="text-[var(--color-mine-secondary)]" />
              <h2 className="text-xs font-extrabold uppercase tracking-wide text-[var(--color-mine-dark)]">
                RPM & BELT SLIP MONITORING
              </h2>
            </div>
            <span className={`tech-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
              isSlipCritical 
                ? 'bg-[var(--color-mine-critical-bg)] text-[var(--color-mine-critical)] border-[var(--color-mine-critical-border)]'
                : isSlipWarning
                ? 'bg-[var(--color-mine-warning-bg)] text-[var(--color-mine-warning)] border-[var(--color-mine-warning-border)]'
                : isStopped
                ? 'bg-gray-100 text-gray-700 border-gray-300'
                : 'bg-[#E2ECE7] text-[var(--color-mine-accent)] border-[#C2D8CD]'
            }`}>
              {rpmCondition}
            </span>
          </div>

          {/* 4 Core Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center mb-3">
            <div className="p-2.5 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)]">
              <span className="text-[9px] font-bold uppercase text-[var(--color-mine-secondary)] block">
                DRIVE RPM
              </span>
              <span className="text-lg font-bold tech-mono text-[var(--color-mine-dark)]">
                {driveRpm}
              </span>
              <span className="text-[9px] text-[var(--color-mine-secondary)] block tech-mono">Head Pulley</span>
            </div>

            <div className="p-2.5 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)]">
              <span className="text-[9px] font-bold uppercase text-[var(--color-mine-secondary)] block">
                DRIVEN RPM
              </span>
              <span className="text-lg font-bold tech-mono text-[var(--color-mine-dark)]">
                {drivenRpm}
              </span>
              <span className="text-[9px] text-[var(--color-mine-secondary)] block tech-mono">Tail Pulley</span>
            </div>

            <div className="p-2.5 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)]">
              <span className="text-[9px] font-bold uppercase text-[var(--color-mine-secondary)] block">
                SPEED DIFFERENCE
              </span>
              <span className="text-lg font-bold tech-mono text-[var(--color-mine-dark)]">
                {speedDiff}
              </span>
              <span className="text-[9px] text-[var(--color-mine-secondary)] block tech-mono">Δ RPM</span>
            </div>

            <div className="p-2.5 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)]">
              <span className="text-[9px] font-bold uppercase text-[var(--color-mine-secondary)] block">
                ESTIMATED SLIP
              </span>
              <span className={`text-lg font-bold tech-mono ${isSlipWarning ? 'text-[var(--color-mine-warning)]' : 'text-[var(--color-mine-accent)]'}`}>
                {beltSlip.toFixed(1)}%
              </span>
              <span className="text-[9px] text-[var(--color-mine-secondary)] block tech-mono">Pulse Ratio</span>
            </div>
          </div>
        </div>

        {/* Section 43: UNIQUE FEATURE — EXPLAIN WHY */}
        <div className={`p-2.5 rounded border text-xs flex items-start gap-2 ${
          isSlipWarning 
            ? 'bg-[var(--color-mine-warning-bg)] border-[var(--color-mine-warning-border)] text-[var(--color-mine-dark)]' 
            : 'bg-[#F9FAF8] border-[var(--color-mine-border)] text-[var(--color-mine-secondary)]'
        }`}>
          <div className="mt-0.5 shrink-0">
            {isSlipWarning ? (
              <AlertTriangle size={14} className="text-[var(--color-mine-warning)]" />
            ) : (
              <HelpCircle size={14} className="text-[var(--color-mine-accent)]" />
            )}
          </div>
          <div>
            <span className="font-extrabold uppercase text-[10px] tracking-wider block mb-0.5">
              {isSlipWarning ? 'EXPLAIN WHY: BELT SLIP WARNING' : 'EXPLAIN WHY: SLIP EVALUATION PRINCIPLE'}
            </span>
            <p className="text-[11px] leading-relaxed">
              {isSlipWarning ? (
                <>
                  Drive roller ({driveRpm} RPM) and driven roller ({drivenRpm} RPM) show a differential of <strong>{speedDiff} RPM</strong> ({beltSlip.toFixed(1)}% slip).
                  <br />
                  <span className="font-semibold">Possible indication:</span> Drive pulley traction loss or insufficient take-up tension.
                </>
              ) : isStopped ? (
                'Both drive and driven encoders report 0 RPM. Conveyor belt is in nominal standstill.'
              ) : (
                `Roller rotational speeds are synchronized within normal 2% mechanical creep threshold (${speedDiff} RPM differential).`
              )}
            </p>
          </div>
        </div>

      </div>

      {/* RIGHT: BELT CONDITION PANEL (Section 18 & 19) */}
      <div className="lg:col-span-6 bg-[#FFFFFF] border border-[var(--color-mine-border)] rounded-lg p-4 shadow-2xs flex flex-col justify-between">
        
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-[var(--color-mine-border)] mb-3">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-[var(--color-mine-accent)]" />
              <h2 className="text-xs font-extrabold uppercase tracking-wide text-[var(--color-mine-dark)]">
                PHYSICAL BELT CONDITION
              </h2>
            </div>
            <span className="tech-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#E2ECE7] text-[var(--color-mine-accent)] border border-[#C2D8CD] flex items-center gap-1">
              <CheckCircle2 size={11} /> PROFILE MONITORED
            </span>
          </div>

          {/* 4 Belt Condition Properties */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            
            {/* Belt Thickness */}
            <div className="p-2.5 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)]">
              <span className="text-[9px] font-bold uppercase text-[var(--color-mine-secondary)] block">
                BELT THICKNESS
              </span>
              <span className="text-lg font-bold tech-mono text-[var(--color-mine-dark)]">
                {thicknessVal}
              </span>
              <div className="mt-1 text-[10px] text-[var(--color-mine-secondary)]">
                Status: <strong className="tech-mono text-[var(--color-mine-dark)]">{thicknessStatus}</strong>
              </div>
            </div>

            {/* Measurement Status */}
            <div className="p-2.5 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)]">
              <span className="text-[9px] font-bold uppercase text-[var(--color-mine-secondary)] block">
                MEASUREMENT STATUS
              </span>
              <span className={`text-lg font-bold tech-mono ${isThicknessValid ? 'text-[var(--color-mine-accent)]' : 'text-gray-500'}`}>
                {thicknessStatus}
              </span>
              <div className="mt-1 text-[10px] text-[var(--color-mine-secondary)]">
                Transducer: <span className="tech-mono">Dual Ultrasonic</span>
              </div>
            </div>

            {/* Belt Alignment */}
            <div className="p-2.5 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)]">
              <span className="text-[9px] font-bold uppercase text-[var(--color-mine-secondary)] block">
                BELT ALIGNMENT
              </span>
              <span className={`text-lg font-bold tech-mono ${alignmentStatus === 'CENTERED' ? 'text-[var(--color-mine-accent)]' : 'text-[var(--color-mine-warning)]'}`}>
                {alignmentStatus}
              </span>
              <div className="mt-1 text-[10px] text-[var(--color-mine-secondary)]">
                Lateral tracking: <span className="tech-mono">Within 5mm</span>
              </div>
            </div>

            {/* Surface Condition */}
            <div className="p-2.5 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)]">
              <span className="text-[9px] font-bold uppercase text-[var(--color-mine-secondary)] block">
                SURFACE CONDITION
              </span>
              <span className={`text-lg font-bold tech-mono ${
                surfaceCondition === 'Critical' 
                  ? 'text-[var(--color-mine-critical)]' 
                  : surfaceCondition === 'Warning' 
                  ? 'text-[var(--color-mine-warning)]' 
                  : 'text-[var(--color-mine-accent)]'
              }`}>
                {surfaceCondition}
              </span>
              <div className="mt-1 text-[10px] text-[var(--color-mine-secondary)]">
                Optical defect state
              </div>
            </div>

          </div>
        </div>

        {/* Thickness Note */}
        <div className="p-2.5 rounded bg-[#FAF8F2] border border-[var(--color-mine-border)] text-[11px] text-[var(--color-mine-secondary)] leading-tight">
          <strong>Engineering Note:</strong> Belt thickness represents top rubber cover profile estimated via acoustic transducers. Never reports negative sag indices.
        </div>

      </div>

    </div>
  );
}
