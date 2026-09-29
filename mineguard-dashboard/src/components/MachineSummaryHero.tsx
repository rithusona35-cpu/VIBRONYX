import type { TelemetryData } from '../utils/types';
import { ShieldCheck, AlertTriangle, AlertOctagon, Activity, Radio, Sparkles } from 'lucide-react';

interface MachineSummaryHeroProps {
  telemetry: TelemetryData;
  connectionStatus: 'CONNECTED' | 'OFFLINE' | 'STALE';
  isDemoMode: boolean;
}

export default function MachineSummaryHero({
  telemetry,
  connectionStatus,
  isDemoMode
}: MachineSummaryHeroProps) {
  const isRunning = (telemetry.rpm1 || 0) > 0 || telemetry.status === 'RUNNING';
  const isCritical = telemetry.status === 'CRITICAL' || telemetry.status === 'STOP_LATCHED';
  const isWarning = telemetry.status === 'WARNING';

  // Dynamic, human-readable machine story based strictly on actual sensor telemetry
  const getMachineStory = () => {
    if (telemetry.status === 'STOP_LATCHED') {
      return 'Conveyor C-01 operation halted by safety latch interlock. Operator physical inspection and manual safety reset required prior to restart.';
    }
    if (telemetry.status === 'CRITICAL') {
      return 'Conveyor C-01 is operating under critical alarm. Vibration or thermal excursion detected exceeding safety boundaries. Motor de-energization advised.';
    }
    if ((telemetry.belt_slip ?? 0) > 5) {
      return `Conveyor C-01 is experiencing dynamic belt slip (${(telemetry.belt_slip ?? 0).toFixed(1)}%). Roller speed differential observed between drive and driven pulleys. Inspect take-up tension.`;
    }
    if ((telemetry.temperature ?? 0) > 50) {
      return `Conveyor C-01 drive head bearing temperature has elevated to ${(telemetry.temperature ?? 0).toFixed(1)}°C. Condition observation indicates thermal rise under current haulage load.`;
    }
    if ((telemetry.vibration ?? 0) > 3.5 && (telemetry.vibration ?? 0) < 50) {
      return `Conveyor C-01 bearing oscillation has risen to ${(telemetry.vibration ?? 0).toFixed(2)} mm/s. Mechanical vibration within warning envelope. Monitor drive alignment.`;
    }
    if (!isRunning) {
      return 'Conveyor C-01 is currently in a safe stopped idle state (0 RPM). Drive and driven rollers disengaged, awaiting material feed startup command.';
    }
    return 'Conveyor C-01 is operating normally. Drive bearing temperature and mechanical vibration remain stable, while drive and driven roller speeds show minimal differential slip.';
  };

  const getMachineStatusLabel = () => {
    if (telemetry.status === 'STOP_LATCHED') return 'STOP LATCHED';
    if (telemetry.status === 'CRITICAL') return 'CRITICAL STOP';
    if (isWarning) return 'ATTENTION';
    if (isRunning) return 'RUNNING';
    return 'STOPPED';
  };

  const getSafetyStateLabel = () => {
    if (isCritical) return 'STOP LATCHED';
    if (isWarning) return 'WARNING';
    if (isRunning) return 'SAFE';
    return 'SAFE IDLE';
  };

  const getSiteConditionLabel = () => {
    if (isCritical) return 'Critical Alert';
    if (isWarning) return 'Attention Required';
    return 'Normal';
  };

  return (
    <div className="w-full bg-[#FFFFFF] border border-[var(--color-mine-border)] rounded-lg shadow-2xs overflow-hidden">
      
      {/* Top Banner with Local Mining Context Image */}
      <div className="relative min-h-[140px] lg:min-h-[155px] bg-[#141C18] flex items-center overflow-hidden">
        {/* Background Image with Dark Vignette */}
        <img
          src="/static/assets/assets/mining/open_pit_conveyor.jpg"
          alt="Conveyor Station C-01"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-40 mix-blend-luminosity scale-105"
          onError={(e) => {
            // Fallback to demo image if needed
            (e.target as HTMLImageElement).src = '/demo_images/frame_00002_jpg.rf.5e28130cc2199a50e3b0fdc3d2e38885.jpg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#111915]/95 via-[#111915]/85 to-[#111915]/60"></div>

        {/* Content Container */}
        <div className="relative z-10 w-full p-4 lg:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left: Station Identity & Machine Story */}
          <div className="flex-1 max-w-3xl space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl lg:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                CONVEYOR C-01
              </h1>
              <span className="tech-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#202E27] text-[#45D59E] border border-[#2D4539]">
                CRITICAL CONVEYOR ZONE
              </span>
              <span className="text-xs text-gray-300 font-medium hidden sm:inline">
                Real-time monitoring • AI inspection • Safety-oriented monitoring
              </span>
            </div>

            {/* Section 42: CURRENT MACHINE STORY */}
            <div className="p-2.5 rounded bg-black/40 border border-white/10 backdrop-blur-xs flex items-start gap-2.5">
              <div className="mt-0.5 shrink-0 text-[#45D59E]">
                <Sparkles size={15} />
              </div>
              <div>
                <span className="text-[10px] tech-mono font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                  CURRENT MACHINE STORY
                </span>
                <p className="text-xs font-medium text-gray-100 leading-relaxed">
                  {getMachineStory()}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Key Machine Status & Safety Indicators (Section 6) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-2 shrink-0">
            
            {/* 1. Machine Status */}
            <div className="p-2.5 rounded bg-white/10 border border-white/10 backdrop-blur-xs">
              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider mb-1">
                MACHINE STATUS
              </span>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  isCritical 
                    ? 'bg-red-500 animate-ping' 
                    : isWarning 
                    ? 'bg-amber-400' 
                    : isRunning 
                    ? 'bg-emerald-400 animate-pulse' 
                    : 'bg-gray-400'
                }`} />
                <span className="text-xs font-extrabold text-white tech-mono truncate">
                  {getMachineStatusLabel()}
                </span>
              </div>
            </div>

            {/* 2. Safety State */}
            <div className="p-2.5 rounded bg-white/10 border border-white/10 backdrop-blur-xs">
              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider mb-1">
                SAFETY STATE
              </span>
              <div className="flex items-center gap-1.5">
                {isCritical ? (
                  <AlertOctagon size={13} className="text-red-400 shrink-0" />
                ) : isWarning ? (
                  <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                ) : (
                  <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
                )}
                <span className="text-xs font-extrabold text-white tech-mono truncate">
                  {getSafetyStateLabel()}
                </span>
              </div>
            </div>

            {/* 3. Last Update */}
            <div className="p-2.5 rounded bg-white/10 border border-white/10 backdrop-blur-xs">
              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider mb-1">
                LAST UPDATE
              </span>
              <div className="flex items-center gap-1.5">
                <Radio size={13} className={connectionStatus === 'CONNECTED' ? 'text-emerald-400 animate-pulse' : 'text-gray-400'} />
                <span className="text-xs font-extrabold text-white tech-mono truncate">
                  {connectionStatus === 'CONNECTED' ? (isDemoMode ? 'SIMULATED' : 'LIVE') : connectionStatus}
                </span>
              </div>
            </div>

            {/* 4. Site Condition */}
            <div className="p-2.5 rounded bg-white/10 border border-white/10 backdrop-blur-xs">
              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider mb-1">
                SITE CONDITION
              </span>
              <div className="flex items-center gap-1.5">
                <Activity size={13} className="text-blue-400 shrink-0" />
                <span className="text-xs font-extrabold text-white tech-mono truncate">
                  {getSiteConditionLabel()}
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
