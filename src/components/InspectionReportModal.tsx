import { Printer, X, Shield, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import type { InspectionResult } from '../utils/types';

interface InspectionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: InspectionResult;
  imageSrc: string;
}

export default function InspectionReportModal({
  isOpen,
  onClose,
  result,
  imageSrc
}: InspectionReportModalProps) {
  if (!isOpen) return null;

  const reportId = 'MG-RPT-' + Math.floor(100000 + Math.random() * 900000);
  const now = new Date().toLocaleString();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FFFFFF] rounded-lg border border-[var(--color-mine-border-strong)] shadow-2xl max-w-2xl w-full p-6 text-[var(--color-mine-dark)] relative">
        
        {/* Modal Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded hover:bg-[var(--color-mine-panel-sub)] text-[var(--color-mine-secondary)]"
        >
          <X size={18} />
        </button>

        {/* Report Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-[var(--color-mine-dark)] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-[#E5E7EB] bg-[#FFFFFF] shadow-xs">
              <img src="/logo.png" alt="MineGuard AI Logo" className="w-full h-full object-contain p-0.5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">MINEGUARD AI — OPTICAL INSPECTION REPORT</h2>
              <div className="text-xs text-[var(--color-mine-secondary)] font-mono">
                SIH 26008 // Conveyor C-01 (Head Drive Monitored Zone)
              </div>
            </div>
          </div>

          <div className="text-right text-xs tech-mono">
            <div className="font-bold">REPORT: {reportId}</div>
            <div className="text-[10px] text-[var(--color-mine-secondary)]">{now}</div>
          </div>
        </div>

        {/* Report Body */}
        <div className="space-y-4 text-xs">
          
          {/* Metadata Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-[var(--color-mine-panel-sub)] rounded border border-[var(--color-mine-border)]">
            <div>
              <span className="text-[10px] uppercase font-bold text-[var(--color-mine-secondary)] block">Target Asset</span>
              <span className="font-bold tech-mono">Conveyor C-01</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[var(--color-mine-secondary)] block">Inspection Time</span>
              <span className="font-bold tech-mono">{now.split(',')[1] || now}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[var(--color-mine-secondary)] block">Inspection Source</span>
              <span className="font-bold tech-mono">{result.source}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[var(--color-mine-secondary)] block">Vision Model</span>
              <span className="font-bold tech-mono">YOLO11s (800px)</span>
            </div>
          </div>

          {/* Captured / Evaluated Image Frame */}
          <div className="flex flex-col sm:flex-row gap-4 items-center p-3 border border-[var(--color-mine-border)] rounded bg-[#FAF8F2]">
            <div className="w-48 h-32 bg-[#17221D] rounded overflow-hidden shrink-0 flex items-center justify-center">
              <img
                src={imageSrc}
                alt="Inspected Surface"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex-1 space-y-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--color-mine-secondary)] block">Detected Classification</span>
                <span className={`text-lg font-extrabold ${
                  result.severity === 'CRITICAL' 
                    ? 'text-[var(--color-mine-critical)]' 
                    : result.severity === 'WARNING' 
                    ? 'text-[var(--color-mine-warning)]' 
                    : 'text-[var(--color-mine-accent)]'
                }`}>
                  {result.classification}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs tech-mono">
                <div>
                  <span className="text-[10px] text-[var(--color-mine-secondary)] uppercase block">Model Confidence</span>
                  <span className="font-bold text-base">{result.confidence.toFixed(1)} %</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--color-mine-secondary)] uppercase block">Severity Envelope</span>
                  <span className={`font-bold text-sm ${
                    result.severity === 'CRITICAL' ? 'text-[var(--color-mine-critical)]' : result.severity === 'WARNING' ? 'text-[var(--color-mine-warning)]' : 'text-[var(--color-mine-accent)]'
                  }`}>{result.severity}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Condition Details */}
          <div className="p-3 rounded border border-[var(--color-mine-border)] bg-white">
            <span className="text-[10px] uppercase font-bold text-[var(--color-mine-secondary)] tracking-wider block mb-1">
              Observed Surface Condition
            </span>
            <p className="font-medium text-[var(--color-mine-dark)]">
              {result.condition}
            </p>
          </div>

          {/* Recommendation */}
          <div className="p-3 rounded border border-[var(--color-mine-border)] bg-white">
            <span className="text-[10px] uppercase font-bold text-[var(--color-mine-secondary)] tracking-wider block mb-1">
              Recommended Engineering Action
            </span>
            <div className="flex items-start gap-2">
              {result.severity === 'CRITICAL' ? (
                <AlertOctagon size={16} className="text-[var(--color-mine-critical)] shrink-0 mt-0.5" />
              ) : result.severity === 'WARNING' ? (
                <AlertTriangle size={16} className="text-[var(--color-mine-warning)] shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 size={16} className="text-[var(--color-mine-accent)] shrink-0 mt-0.5" />
              )}
              <p className="font-semibold text-[var(--color-mine-dark)] leading-snug">
                {result.recommendation}
              </p>
            </div>
          </div>

          {/* Technical Explanatory Note (Section 16) */}
          <div className="p-3 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)] text-[11px] text-[var(--color-mine-secondary)] italic">
            "{result.explanation}"
          </div>

        </div>

        {/* Modal Actions */}
        <div className="mt-6 pt-3 border-t border-[var(--color-mine-border)] flex items-center justify-between">
          <div className="text-[10px] text-[var(--color-mine-secondary)] font-mono">
            MineGuard AI Industrial Verification Suite • Generated by supervisory operator station
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded bg-white hover:bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)] font-bold text-xs flex items-center gap-1.5 shadow-2xs"
            >
              <Printer size={13} /> PRINT REPORT
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded bg-[var(--color-mine-accent)] hover:bg-[var(--color-mine-accent-dark)] text-white font-bold text-xs shadow-xs"
            >
              CLOSE
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
