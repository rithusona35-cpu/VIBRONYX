import { useState, useEffect, useCallback } from 'react';
import { Shield, Maximize2, Minimize2, Scan, LineChart, BellCheck, FileText, SlidersHorizontal, Activity } from 'lucide-react';
import type { NavSection, SimulationScenario } from '../utils/types';
import { getApiUrl } from '../utils/apiConfig';

interface HeaderProps {
  connectionStatus: 'CONNECTED' | 'OFFLINE' | 'STALE';
  lastUpdate: number;
  isDemoMode: boolean;
  setDemoMode: (val: boolean) => void;
  isMonitoring: boolean;
  setIsMonitoring: (val: boolean) => void;
  scenario: SimulationScenario;
  setScenario: (sc: SimulationScenario) => void;
  onNavigate: (section: NavSection) => void;
  onExportReport: () => void;
  operatorConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  operatorConfidenceReason: string;
}

const ALL_SCENARIOS: { key: SimulationScenario; label: string }[] = [
  { key: 'NORMAL', label: 'NORMAL OPERATION' },
  { key: 'LOAD_INC', label: 'LOAD INCREASE' },
  { key: 'TEMP_RISE', label: 'TEMPERATURE RISE' },
  { key: 'VIBRATION_INC', label: 'VIBRATION INCREASE' },
  { key: 'BELT_SLIP', label: 'BELT SLIP' },
  { key: 'SLIGHT_SCRATCH', label: 'SLIGHT SCRATCH' },
  { key: 'DEEP_SCRATCH', label: 'DEEP SCRATCH' },
  { key: 'LONGITUDINAL_TEAR', label: 'LONGITUDINAL TEAR' },
  { key: 'BELT_SPLICE', label: 'BELT SPLICE' },
  { key: 'SENSOR_DISCONNECT', label: 'SENSOR DISCONNECT' },
  { key: 'ESTOP', label: 'E-STOP' }
];

export default function Header({
  connectionStatus,
  isDemoMode,
  setDemoMode,
  isMonitoring,
  setIsMonitoring,
  scenario,
  setScenario,
  onNavigate,
  onExportReport
}: HeaderProps) {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [apiStatus, setApiStatus] = useState<'ONLINE' | 'OFFLINE'>('OFFLINE');
  const [modelLoaded, setModelLoaded] = useState<boolean>(false);
  const [cameraReady, setCameraReady] = useState<boolean>(false);

  const checkBackendHealth = useCallback(async () => {
    try {
      const healthUrl = getApiUrl('/health');
      const res = await fetch(healthUrl, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        setApiStatus('ONLINE');
        setModelLoaded(Boolean(data.model_loaded || data.engine_ready || data.status === 'online' || data.status === 'HEALTHY'));
        return;
      }
      setApiStatus('OFFLINE');
      setModelLoaded(false);
    } catch {
      setApiStatus('OFFLINE');
      setModelLoaded(false);
    }
  }, []);

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 12000);
    return () => clearInterval(interval);
  }, [checkBackendHealth]);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function') {
      setCameraReady(true);
    }
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FFFFFF] border-b border-[#E5E7EB] px-4 lg:px-6 py-2.5 shadow-xs">
      <div className="w-full flex items-center justify-between gap-4">
        
        {/* LEFT: Project Identity (Section 2) */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center shrink-0 shadow-xs">
            <Shield size={20} className="text-[#087F5B] stroke-[2.3]" />
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-[#111827]">
                MINEGUARD AI
              </span>
              <span className="tech-mono px-1.5 py-0.5 rounded bg-[#F3F4F6] border border-[#E5E7EB] text-[#4B5563] text-[10px] font-bold">
                SIH 26008
              </span>
            </div>
            <span className="text-[11px] text-[#6B7280] font-medium leading-none mt-0.5">
              Intelligent Conveyor Safety & Predictive Monitoring
            </span>
          </div>
        </div>

        {/* CENTER: CONVEYOR C-01 ● ACTIVE (Section 2) */}
        <div className="hidden md:flex items-center gap-3 px-3 py-1 bg-[#F9FAFB] rounded-md border border-[#E5E7EB]">
          <span className="text-xs font-black tracking-widest text-[#111827] tech-mono">
            CONVEYOR C-01
          </span>
          <div className="w-px h-3.5 bg-[#D1D5DB]"></div>
          <span className="flex items-center gap-1.5 text-xs font-bold text-[#087F5B] tech-mono">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping opacity-75"></span>
            <span className="w-2 h-2 rounded-full bg-[#087F5B] -ml-3.5"></span>
            ACTIVE
          </span>
        </div>

        {/* RIGHT: Deployment Status Panel + Quick Nav + Time + Controls (Section 22) */}
        <div className="flex items-center gap-2.5">
          
          {/* Section 22: Deployment Status Panel */}
          <div className="hidden xl:flex items-center gap-1.5 tech-mono text-[9px] font-bold bg-[#F9FAFB] p-1 rounded border border-[#E5E7EB]">
            {/* FRONTEND */}
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#087F5B] border border-[#A7F3D0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
              FRONTEND: ONLINE
            </span>
            {/* YOLO API */}
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${
              apiStatus === 'ONLINE' ? 'bg-[#ECFDF5] text-[#087F5B] border-[#A7F3D0]' : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${apiStatus === 'ONLINE' ? 'bg-[#10B981]' : 'bg-[#DC2626]'}`}></span>
              YOLO API: {apiStatus}
            </span>
            {/* MODEL */}
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${
              modelLoaded ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]' : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${modelLoaded ? 'bg-[#2563EB]' : 'bg-[#DC2626]'}`}></span>
              MODEL: {modelLoaded ? 'LOADED' : 'OFFLINE'}
            </span>
            {/* DATABASE */}
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${
              connectionStatus === 'CONNECTED' ? 'bg-[#ECFDF5] text-[#087F5B] border-[#A7F3D0]' : 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'CONNECTED' ? 'bg-[#10B981]' : 'bg-[#D97706]'}`}></span>
              DATABASE: {connectionStatus === 'CONNECTED' ? 'CONNECTED' : 'STANDBY'}
            </span>
            {/* CAMERA */}
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${
              cameraReady ? 'bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]' : 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cameraReady ? 'bg-[#7C3AED]' : 'bg-[#9CA3AF]'}`}></span>
              CAMERA: {cameraReady ? 'READY' : 'STANDBY'}
            </span>
          </div>

          {/* Quick Nav Links: Inspect, Trends, Alarms, Events, Reports */}
          <div className="hidden sm:flex items-center gap-1 bg-[#F9FAFB] p-0.5 rounded border border-[#E5E7EB]">
            <button
              onClick={() => onNavigate('BELT_INSPECTION')}
              title="Inspect Belt Surface"
              className="p-1.5 rounded hover:bg-[#E5E7EB] text-[#4B5563] hover:text-[#111827] transition-colors flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
            >
              <Scan size={14} className="text-[#087F5B]" /> <span className="hidden lg:inline">Inspect</span>
            </button>
            <button
              onClick={() => onNavigate('TRENDS')}
              title="View Trends"
              className="p-1.5 rounded hover:bg-[#E5E7EB] text-[#4B5563] hover:text-[#111827] transition-colors flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
            >
              <LineChart size={14} className="text-[#2563EB]" /> <span className="hidden lg:inline">Trends</span>
            </button>
            <button
              onClick={() => onNavigate('ALARMS')}
              title="Alarm Center"
              className="p-1.5 rounded hover:bg-[#E5E7EB] text-[#4B5563] hover:text-[#111827] transition-colors flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
            >
              <BellCheck size={14} className="text-[#D97706]" /> <span className="hidden lg:inline">Alarms</span>
            </button>
            <button
              onClick={() => onNavigate('EVENTS')}
              title="Event Log"
              className="p-1.5 rounded hover:bg-[#E5E7EB] text-[#4B5563] hover:text-[#111827] transition-colors flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
            >
              <Activity size={14} className="text-[#7C3AED]" /> <span className="hidden lg:inline">Events</span>
            </button>
            <button
              onClick={onExportReport}
              title="Generate Inspection Report"
              className="p-1.5 rounded hover:bg-[#E5E7EB] text-[#4B5563] hover:text-[#111827] transition-colors flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
            >
              <FileText size={14} className="text-[#111827]" /> <span className="hidden lg:inline">Reports</span>
            </button>
          </div>

          {/* Current Time Clock */}
          <div className="tech-mono text-xs font-bold text-[#111827] bg-[#F9FAFB] px-2.5 py-1 rounded border border-[#E5E7EB] shadow-xs">
            {currentTime || '16:20:00'}
          </div>

          {/* Settings & Fullscreen */}
          <div className="flex items-center gap-1 relative">
            <button
              onClick={() => setShowConfig(!showConfig)}
              title="HMI Configuration & Demo Mode"
              className={`p-1.5 rounded border transition-colors cursor-pointer ${
                isDemoMode 
                  ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]' 
                  : showConfig 
                  ? 'bg-[#E5E7EB] border-[#D1D5DB] text-[#111827]' 
                  : 'bg-[#F9FAFB] border-[#E5E7EB] text-[#4B5563] hover:text-[#111827] hover:bg-[#E5E7EB]'
              }`}
            >
              <SlidersHorizontal size={15} />
            </button>

            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Monitoring"}
              className="p-1.5 rounded border border-[#E5E7EB] bg-[#F9FAFB] text-[#4B5563] hover:text-[#111827] hover:bg-[#E5E7EB] transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            {/* Station Configuration Dropdown with full 11 SIH Demo Scenarios */}
            {showConfig && (
              <div className="absolute right-0 top-10 w-80 bg-[#FFFFFF] rounded-lg border border-[#E5E7EB] shadow-xl p-3.5 z-50 text-xs">
                <div className="font-bold text-[#111827] uppercase text-[10px] tracking-wider mb-2.5 flex items-center justify-between pb-1.5 border-b border-[#E5E7EB]">
                  <span>HMI DEMO & CONFIGURATION</span>
                  <span className="tech-mono text-[9px] text-[#6B7280]">SIH 26008</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#111827]">Demo Mode (SIH Presentation)</div>
                      <div className="text-[10px] text-[#6B7280]">Simulate machine & defect scenarios</div>
                    </div>
                    <button
                      onClick={() => setDemoMode(!isDemoMode)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        isDemoMode ? 'bg-[#087F5B]' : 'bg-[#D1D5DB]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                          isDemoMode ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-2">
                    <div>
                      <div className="font-bold text-[#111827]">Monitoring Poller</div>
                      <div className="text-[10px] text-[#6B7280]">Real-time telemetry loop</div>
                    </div>
                    <button
                      onClick={() => setIsMonitoring(!isMonitoring)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        isMonitoring ? 'bg-[#087F5B]' : 'bg-[#D1D5DB]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                          isMonitoring ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 11 Demo Scenarios */}
                  <div className="border-t border-[#E5E7EB] pt-2">
                    <div className="font-bold text-[#111827] mb-1.5 flex items-center justify-between">
                      <span>SIMULATE DEMO SCENARIOS:</span>
                      {isDemoMode && <span className="text-[9px] tech-mono text-[#D97706] font-bold">DEMO ACTIVE</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      {ALL_SCENARIOS.map(sc => (
                        <button
                          key={sc.key}
                          onClick={() => {
                            setScenario(sc.key);
                            setDemoMode(true);
                          }}
                          className={`p-1.5 rounded text-left font-mono truncate transition-all cursor-pointer ${
                            scenario === sc.key && isDemoMode
                              ? 'bg-[#087F5B] text-[#FFFFFF] font-black shadow-xs' 
                              : 'bg-[#F9FAFB] text-[#4B5563] hover:bg-[#E5E7EB] hover:text-[#111827] border border-[#E5E7EB]'
                          }`}
                        >
                          {sc.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
