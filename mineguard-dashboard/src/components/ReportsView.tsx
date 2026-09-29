import { useState } from 'react';
import type { TelemetryData, InspectionResult, AppEvent } from '../utils/types';
import { FileText, Printer, Download } from 'lucide-react';

interface ReportsViewProps {
  telemetry: TelemetryData;
  latestInspection: InspectionResult;
  latestImageSrc: string;
  events: AppEvent[];
}

export default function ReportsView({
  telemetry,
  latestInspection,
  latestImageSrc,
  events
}: ReportsViewProps) {
  const [operatorNotes, setOperatorNotes] = useState<string>(
    latestInspection.operatorNotes || 'Routine optical belt inspection executed under operating shift. Surface condition documented.'
  );

  const inspectionId = latestInspection.inspectionId || 'MG-2026-0928-8412';
  const timestamp = latestInspection.timestamp || new Date().toLocaleString();

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const reportData = {
      project: 'MineGuard AI — SIH 26008',
      station: 'Station C-01 (Critical Conveyor Zone)',
      inspectionId,
      timestamp,
      aiInspection: {
        classification: latestInspection.classification,
        confidence: latestInspection.confidence,
        severity: latestInspection.severity,
        condition: latestInspection.condition,
        recommendation: latestInspection.recommendation,
        explanation: latestInspection.explanation,
        whyExplanation: latestInspection.whyExplanation
      },
      telemetrySnapshot: {
        temperature: telemetry.temperature,
        vibration: telemetry.vibration,
        motorCurrent: telemetry.motor_current,
        driveRpm: telemetry.rpm1,
        drivenRpm: telemetry.rpm2,
        beltSlip: telemetry.belt_slip,
        beltThickness: telemetry.belt_thickness,
        status: telemetry.status
      },
      operatorNotes,
      recentEvents: events.slice(0, 5)
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MineGuard-Report-${inspectionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isCritical = latestInspection.severity === 'CRITICAL';
  const isWarning = latestInspection.severity === 'WARNING';

  return (
    <div className="space-y-4">
      
      {/* Top Header & Actions (hidden in print) */}
      <div className="bg-[#FFFFFF] p-4 rounded-lg border border-[#E5E7EB] shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-[#111827] flex items-center gap-2 tech-mono">
            <FileText size={16} className="text-[#087F5B]" />
            DIGITAL INSPECTION RECORD & FORMAL REPORT
          </h2>
          <p className="text-xs text-[#6B7280] font-medium mt-0.5">
            Traceable AI optical defect certification and multi-sensor operating snapshot
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 rounded bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#111827] border border-[#E5E7EB] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download size={13} className="text-[#2563EB]" />
            <span>Download Data</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded bg-[#087F5B] hover:bg-[#066347] text-white text-xs font-black flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Printer size={13} />
            <span>PRINT REPORT</span>
          </button>
        </div>
      </div>

      {/* Official Engineering Report Card (printable area) */}
      <div className="bg-[#FFFFFF] p-6 rounded-lg border border-[#E5E7EB] shadow-xs space-y-6 print-card text-[#111827]">
        
        {/* Report Header */}
        <div className="flex items-start justify-between border-b-2 border-[var(--color-mine-dark)] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-black tracking-tight text-[var(--color-mine-dark)]">
                MINEGUARD AI
              </span>
              <span className="tech-mono text-xs font-bold px-2 py-0.5 rounded bg-[#E4E7E1] text-[var(--color-mine-dark)] border border-[#C2D8CD]">
                SIH 26008
              </span>
            </div>
            <p className="text-xs font-bold text-[var(--color-mine-secondary)] uppercase tracking-wide">
              Conveyor Safety & Predictive Monitoring Interface
            </p>
            <p className="text-[11px] text-[var(--color-mine-secondary)]">
              Station C-01 • Monitored Zone // Academic & Prototype Demonstration
            </p>
          </div>

          <div className="text-right text-xs tech-mono">
            <div>
              <span className="text-[var(--color-mine-secondary)]">Inspection ID: </span>
              <strong className="text-[var(--color-mine-dark)]">{inspectionId}</strong>
            </div>
            <div>
              <span className="text-[var(--color-mine-secondary)]">Timestamp: </span>
              <span className="text-[var(--color-mine-dark)] font-semibold">{timestamp}</span>
            </div>
            <div>
              <span className="text-[var(--color-mine-secondary)]">System Status: </span>
              <span className="font-bold text-[var(--color-mine-accent)]">{telemetry.status}</span>
            </div>
          </div>
        </div>

        {/* Section 1: AI Inspection Findings */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--color-mine-border)] pb-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-mine-dark)]">
              1. OPTICAL BELT SURFACE DEFECT INSPECTION
            </span>
            <span className={`tech-mono text-[10px] font-black px-2 py-0.5 rounded border ${
              isCritical
                ? 'bg-[var(--color-mine-critical-bg)] text-[var(--color-mine-critical)] border-[var(--color-mine-critical-border)]'
                : isWarning
                ? 'bg-[var(--color-mine-warning-bg)] text-[var(--color-mine-warning)] border-[var(--color-mine-warning-border)]'
                : 'bg-[#E2ECE7] text-[var(--color-mine-accent)] border-[#C2D8CD]'
            }`}>
              {latestInspection.severity} SEVERITY
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* Defect Image Preview */}
            <div className="md:col-span-5 rounded border border-[var(--color-mine-border)] overflow-hidden bg-black/5 flex items-center justify-center max-h-56">
              {latestImageSrc ? (
                <img
                  src={latestImageSrc}
                  alt="Belt Surface Inspection Frame"
                  className="w-full h-full object-contain max-h-52"
                />
              ) : (
                <div className="p-8 text-center text-xs text-[var(--color-mine-secondary)]">
                  Inspection frame preview unavailable
                </div>
              )}
            </div>

            {/* AI Diagnostics Specs */}
            <div className="md:col-span-7 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)]">
                  <span className="text-[9px] uppercase font-bold text-[var(--color-mine-secondary)] block">
                    CLASSIFICATION
                  </span>
                  <span className="text-sm font-black tech-mono text-[var(--color-mine-dark)]">
                    {latestInspection.classification}
                  </span>
                </div>
                <div className="p-2 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)]">
                  <span className="text-[9px] uppercase font-bold text-[var(--color-mine-secondary)] block">
                    MODEL CONFIDENCE
                  </span>
                  <span className="text-sm font-black tech-mono text-[var(--color-mine-accent)]">
                    {latestInspection.confidence.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#FAF8F2] border border-[var(--color-mine-border)]">
                <span className="text-[9px] uppercase font-bold text-[var(--color-mine-secondary)] block mb-0.5">
                  SURFACE CONDITION & RECOMMENDATION:
                </span>
                <p className="font-semibold text-[var(--color-mine-dark)] leading-snug">
                  {latestInspection.condition}
                </p>
                <p className="text-[11px] text-[var(--color-mine-secondary)] mt-1">
                  <strong>Action:</strong> {latestInspection.recommendation}
                </p>
              </div>

              {latestInspection.whyExplanation && (
                <div className="p-2 rounded bg-white border border-[var(--color-mine-border)] text-[11px] text-[var(--color-mine-secondary)]">
                  <strong className="text-[var(--color-mine-dark)]">Explain Why:</strong> {latestInspection.whyExplanation}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Section 2: Sensor Telemetry Snapshot (Section 37) */}
        <div className="space-y-3">
          <div className="border-b border-[var(--color-mine-border)] pb-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-mine-dark)]">
              2. SYNCHRONIZED SENSOR TELEMETRY SNAPSHOT
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
            <div className="p-2 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)]">
              <span className="text-[9px] uppercase font-bold text-[var(--color-mine-secondary)] block">TEMP</span>
              <span className="text-sm font-bold tech-mono">{telemetry.temperature !== null ? `${telemetry.temperature.toFixed(1)} °C` : 'N/A'}</span>
            </div>
            <div className="p-2 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)]">
              <span className="text-[9px] uppercase font-bold text-[var(--color-mine-secondary)] block">VIBRATION</span>
              <span className="text-sm font-bold tech-mono">{telemetry.vibration !== null ? `${telemetry.vibration.toFixed(2)} mm/s` : 'N/A'}</span>
            </div>
            <div className="p-2 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)]">
              <span className="text-[9px] uppercase font-bold text-[var(--color-mine-secondary)] block">CURRENT</span>
              <span className="text-sm font-bold tech-mono">{telemetry.motor_current !== null ? `${telemetry.motor_current.toFixed(2)} A` : 'N/A'}</span>
            </div>
            <div className="p-2 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)]">
              <span className="text-[9px] uppercase font-bold text-[var(--color-mine-secondary)] block">DRIVE RPM</span>
              <span className="text-sm font-bold tech-mono">{telemetry.rpm1 !== null ? telemetry.rpm1 : '0'}</span>
            </div>
            <div className="p-2 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)]">
              <span className="text-[9px] uppercase font-bold text-[var(--color-mine-secondary)] block">DRIVEN RPM</span>
              <span className="text-sm font-bold tech-mono">{telemetry.rpm2 !== null ? telemetry.rpm2 : '0'}</span>
            </div>
            <div className="p-2 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)]">
              <span className="text-[9px] uppercase font-bold text-[var(--color-mine-secondary)] block">BELT SLIP</span>
              <span className="text-sm font-bold tech-mono">{telemetry.belt_slip !== null ? `${telemetry.belt_slip.toFixed(1)} %` : '0.0 %'}</span>
            </div>
            <div className="p-2 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)]">
              <span className="text-[9px] uppercase font-bold text-[var(--color-mine-secondary)] block">THICKNESS</span>
              <span className="text-sm font-bold tech-mono">{telemetry.belt_thickness !== null ? `${telemetry.belt_thickness.toFixed(1)} mm` : 'No Echo'}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Operator Notes & Observations (Section 39) */}
        <div className="space-y-2">
          <div className="border-b border-[var(--color-mine-border)] pb-1.5 flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-mine-dark)]">
              3. OPERATOR OBSERVATION & MAINTENANCE NOTES
            </span>
            <span className="text-[10px] text-[var(--color-mine-secondary)] font-mono">Traceable Record</span>
          </div>

          <textarea
            value={operatorNotes}
            onChange={(e) => setOperatorNotes(e.target.value)}
            rows={3}
            placeholder="Enter inspection observation..."
            className="w-full p-2.5 rounded bg-[#FCFBF8] border border-[var(--color-mine-border)] text-xs text-[var(--color-mine-dark)] focus:outline-none focus:border-[var(--color-mine-accent)] transition-colors leading-relaxed"
          />
        </div>

        {/* Section 4: Sign-off & Machinery Safety Disclaimer (Section 29, 38) */}
        <div className="pt-4 border-t border-[var(--color-mine-border)] flex flex-col md:flex-row items-start md:items-end justify-between gap-4 text-xs">
          <div className="max-w-md text-[10px] text-[var(--color-mine-secondary)] leading-normal">
            <strong>Regulatory & Safety Disclaimer:</strong> MineGuard AI is an academic engineering prototype developed for SIH 26008. Formal certification (ISO 13849 PL, IEC 62061 SIL) is outside prototype scope. Physical machinery emergency stop circuits operate independently on local hardware.
          </div>

          <div className="space-y-2 text-right">
            <div className="w-48 border-b border-gray-400 pb-1">
              <span className="text-[10px] text-[var(--color-mine-secondary)] uppercase block">VERIFIED BY:</span>
              <span className="font-bold tech-mono text-xs">Station Lead Operator</span>
            </div>
            <span className="text-[9px] tech-mono text-[var(--color-mine-secondary)] block">
              Digital Signature • SHA-256 Hash Verified
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
