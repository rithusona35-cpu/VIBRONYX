import { AlertTriangle, ShieldCheck, FileCheck } from 'lucide-react';

export default function SystemNotes() {
  return (
    <footer className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-4 shadow-xs space-y-3">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <FileCheck size={16} className="text-[#087F5B]" />
          <h2 className="text-xs font-black uppercase tracking-wider text-[#111827] tech-mono">
            SYSTEM ARCHITECTURE & PROTOTYPE NOTES
          </h2>
        </div>
        <span className="text-[10px] tech-mono text-[#6B7280]">
          SIH 26008 Engineering Prototype
        </span>
      </div>

      {/* Main limitation & safety engineering context content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        
        {/* Card 1: Prototype Disclaimer */}
        <div className="p-3 rounded-md bg-[#F9FAFB] border border-[#E5E7EB] space-y-1.5">
          <div className="flex items-center gap-2 text-[#D97706]">
            <AlertTriangle size={15} />
            <span className="font-bold tech-mono uppercase text-[10px] tracking-wider">
              ENGINEERING PROTOTYPE STATUS
            </span>
          </div>
          <p className="text-[11px] text-[#4B5563] leading-relaxed">
            MineGuard AI is a university engineering prototype. Sensor thresholds, AI defect classification models, and supervisory safety functions require formal field validation before deployment in a production industrial bulk haulage environment.
          </p>
        </div>

        {/* Card 2: Standards Design References */}
        <div className="p-3 rounded-md bg-[#F9FAFB] border border-[#E5E7EB] space-y-1.5">
          <div className="flex items-center gap-2 text-[#087F5B]">
            <ShieldCheck size={15} />
            <span className="font-bold tech-mono uppercase text-[10px] tracking-wider">
              SAFETY ARCHITECTURE INSPIRATION
            </span>
          </div>
          <p className="text-[11px] text-[#4B5563] leading-relaxed">
            Prototype safety architecture designed using established machinery-safety principles. The physical E-stop remains completely independent of dashboard, Wi-Fi, database, cloud, and AI vision inference.
          </p>
        </div>

      </div>

      {/* Hardware Context Footer (Section 34) */}
      <div className="pt-2 border-t border-[#F3F4F6] flex flex-wrap items-center justify-between gap-2 text-[10px] tech-mono text-[#6B7280]">
        <div>
          <strong className="text-[#111827]">MINEGUARD AI</strong> // SIH 26008 // Industrial Prototype
        </div>
        <div>
          Architecture: ESP32/STM32 MCU • YOLO11s Vision • Supabase Telemetry • Industrial SCADA HMI
        </div>
        <div>
          Status: <span className="text-[#D97706] font-bold">Prototype — Not Formally Certified</span>
        </div>
      </div>

    </footer>
  );
}
