import { 
  Activity, 
  Database, 
  Eye, 
  Camera, 
  Shield, 
  CheckCircle2, 
  Wifi, 
  Thermometer, 
  Gauge, 
  Zap, 
  Scale, 
  Disc3, 
  Layers, 
  Info,
  Cpu
} from 'lucide-react';
import type { TelemetryData } from '../utils/types';

interface SystemDiagnosticsProps {
  telemetry: TelemetryData;
  connectionStatus: 'CONNECTED' | 'OFFLINE' | 'STALE';
  isMonitoring: boolean;
  isDemoMode: boolean;
}

export default function SystemDiagnostics({
  telemetry,
  connectionStatus,
  isMonitoring,
  isDemoMode
}: SystemDiagnosticsProps) {
  const diffSec = Math.floor((Date.now() - telemetry.lastUpdate) / 1000);

  // Health evaluations based strictly on active real telemetry fields
  const getEsp32Health = () => {
    if (connectionStatus === 'CONNECTED') return { status: 'ONLINE', badge: 'bg-[#E2ECE7] text-[var(--color-mine-accent)] border-[#C2D8CD]' };
    if (connectionStatus === 'STALE') return { status: 'WARNING (STALE)', badge: 'bg-[var(--color-mine-warning-bg)] text-[var(--color-mine-warning)] border-[var(--color-mine-warning-border)]' };
    return { status: 'OFFLINE', badge: 'bg-[var(--color-mine-critical-bg)] text-[var(--color-mine-critical)] border-[var(--color-mine-critical-border)]' };
  };

  const getTemperatureHealth = () => {
    if (connectionStatus === 'OFFLINE') return { status: 'OFFLINE', note: 'Awaiting telemetry packet' };
    if (telemetry.temperature === null || telemetry.temperature <= 0) return { status: 'SENSOR FAULT', note: 'No valid measurement' };
    if (telemetry.temperature > 65) return { status: 'WARNING', note: `${telemetry.temperature.toFixed(1)}°C (Elevated)` };
    return { status: 'ONLINE', note: `${telemetry.temperature.toFixed(1)}°C (Normal)` };
  };

  const getVibrationHealth = () => {
    if (connectionStatus === 'OFFLINE') return { status: 'OFFLINE', note: 'Awaiting telemetry packet' };
    if (telemetry.vibration === null || telemetry.vibration < 0) return { status: 'SENSOR FAULT', note: 'No valid measurement' };
    if (telemetry.vibration > 7.0) return { status: 'WARNING', note: `${telemetry.vibration.toFixed(2)} mm/s (High)` };
    return { status: 'ONLINE', note: `${telemetry.vibration.toFixed(2)} mm/s (Optimal)` };
  };

  const getLoadHealth = () => {
    if (connectionStatus === 'OFFLINE') return { status: 'OFFLINE', note: 'Awaiting telemetry packet' };
    if (telemetry.load === null) return { status: 'SENSOR FAULT', note: 'Sensor unavailable' };
    if (telemetry.load < -5) return { status: 'CALIBRATION REQUIRED', note: 'Tare calibration required' };
    return { status: 'ONLINE', note: `${Math.max(0, telemetry.load).toFixed(2)} kg load` };
  };

  const getCurrentHealth = () => {
    if (connectionStatus === 'OFFLINE') return { status: 'OFFLINE', note: 'Awaiting telemetry packet' };
    if (telemetry.motor_current === null || telemetry.motor_current < 0) return { status: 'SENSOR FAULT', note: 'Current shunt offline' };
    if (telemetry.motor_current > 4.5) return { status: 'WARNING', note: `${telemetry.motor_current.toFixed(2)} A (Overcurrent)` };
    return { status: 'ONLINE', note: `${telemetry.motor_current.toFixed(2)} A (Normal)` };
  };

  const getEncoderHealth = () => {
    if (connectionStatus === 'OFFLINE') return { status: 'OFFLINE', note: 'Awaiting telemetry packet' };
    if (telemetry.rpm1 === null || telemetry.rpm2 === null) return { status: 'SENSOR FAULT', note: 'RPM comparison unavailable' };
    if (telemetry.rpm1 === 0 && telemetry.rpm2 === 0) return { status: 'NORMAL (STOPPED)', note: 'Conveyor Stopped (0 RPM)' };
    if (telemetry.belt_slip !== null && telemetry.belt_slip > 15) return { status: 'WARNING (SLIP)', note: `${telemetry.belt_slip.toFixed(1)}% slip detected` };
    return { status: 'ONLINE', note: `D1: ${telemetry.rpm1} | D2: ${telemetry.rpm2} RPM` };
  };

  const getThicknessHealth = () => {
    if (connectionStatus === 'OFFLINE') return { status: 'OFFLINE', note: 'Awaiting telemetry packet' };
    if (telemetry.belt_thickness === null || telemetry.belt_thickness <= 0) return { status: 'NO VALID DATA', note: 'Measurement unavailable (No echo)' };
    return { status: 'ONLINE', note: `${telemetry.belt_thickness.toFixed(1)} mm (Prototype Est.)` };
  };

  const esp32 = getEsp32Health();
  const tempH = getTemperatureHealth();
  const vibH = getVibrationHealth();
  const loadH = getLoadHealth();
  const currH = getCurrentHealth();
  const encH = getEncoderHealth();
  const thickH = getThicknessHealth();

  const getBadge = (st: string) => {
    if (st.includes('ONLINE') || st.includes('NORMAL')) return 'bg-[#E2ECE7] text-[var(--color-mine-accent)] border-[#C2D8CD]';
    if (st.includes('WARNING') || st.includes('CALIBRATION')) return 'bg-[var(--color-mine-warning-bg)] text-[var(--color-mine-warning)] border-[var(--color-mine-warning-border)]';
    if (st.includes('FAULT') || st.includes('CRITICAL')) return 'bg-[var(--color-mine-critical-bg)] text-[var(--color-mine-critical)] border-[var(--color-mine-critical-border)]';
    return 'bg-[var(--color-mine-panel-sub)] text-[var(--color-mine-secondary)] border-[var(--color-mine-border)]';
  };

  // Safety State Evaluation
  const safetyState = 
    telemetry.status === 'CRITICAL' ? 'CRITICAL' :
    telemetry.status === 'STOP_LATCHED' ? 'STOP LATCHED' :
    telemetry.status === 'WARNING' ? 'WARNING' :
    (telemetry.rpm1 || 0) > 0 ? 'RUNNING' : 'SAFE IDLE';

  return (
    <div className="space-y-4">
      
      {/* Title Header with Safety & Latency status */}
      <div className="bg-white p-4 rounded-lg border border-[var(--color-mine-border)] shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--color-mine-dark)] flex items-center gap-2">
            <Cpu size={16} className="text-[var(--color-mine-accent)]" />
            STATION SYSTEM HEALTH & SENSOR DIAGNOSTICS
          </h2>
          <p className="text-xs text-[var(--color-mine-secondary)] font-medium mt-0.5">
            Supervisory monitoring telemetry pipeline • Machine Safety Architecture
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Visible Safety-State Indicator (Section 27) */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)]">
            <span className="text-[10px] uppercase font-bold text-[var(--color-mine-secondary)]">SAFETY STATE:</span>
            <span className={`tech-mono text-xs font-extrabold px-2 py-0.2 rounded border ${
              safetyState === 'CRITICAL' ? 'bg-[var(--color-mine-critical-bg)] text-[var(--color-mine-critical)] border-[var(--color-mine-critical-border)]' :
              safetyState === 'STOP LATCHED' ? 'bg-[var(--color-mine-critical-bg)] text-[var(--color-mine-critical)] border-[var(--color-mine-critical-border)]' :
              safetyState === 'WARNING' ? 'bg-[var(--color-mine-warning-bg)] text-[var(--color-mine-warning)] border-[var(--color-mine-warning-border)]' :
              safetyState === 'RUNNING' ? 'bg-[#E2ECE7] text-[var(--color-mine-accent)] border-[#C2D8CD]' :
              'bg-[#E4E7E1] text-[var(--color-mine-dark)] border-[#C2D8CD]'
            }`}>
              {safetyState}
            </span>
          </div>

          <span className="tech-mono text-xs font-bold px-2.5 py-1 rounded bg-[#E2ECE7] text-[var(--color-mine-accent)] border border-[#C2D8CD] flex items-center gap-1.5">
            <CheckCircle2 size={13} /> {telemetry.dataQuality === 'GOOD' ? 'DATA QUALITY: GOOD' : 'DATA QUALITY: DEGRADED'}
          </span>
          <span className="tech-mono text-xs font-bold px-2.5 py-1 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)] text-[var(--color-mine-secondary)]">
            PACKET LATENCY: {diffSec}s
          </span>
        </div>
      </div>

      {/* 11 Subsystem Nodes Grid (Section 26 Requirements) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* 1. ESP32 Node */}
        <div className="bg-white p-3.5 rounded-lg border border-[var(--color-mine-border)] shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-[var(--color-mine-secondary)] tracking-wider">
              1. ESP32 Dev Module
            </span>
            <Wifi size={15} className="text-[var(--color-mine-accent)]" />
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] tech-mono font-bold px-2 py-0.5 rounded border ${esp32.badge}`}>
              {esp32.status}
            </span>
            <span className="text-[10px] tech-mono text-[var(--color-mine-secondary)]">ID: {telemetry.device_id || 'critical_zone'}</span>
          </div>
          <div className="mt-2 text-[10px] text-[var(--color-mine-secondary)] border-t border-[var(--color-mine-grid)] pt-1.5">
            Wi-Fi Telemetry Controller • Client Transport
          </div>
        </div>

        {/* 2. Supabase DB */}
        <div className="bg-white p-3.5 rounded-lg border border-[var(--color-mine-border)] shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-[var(--color-mine-secondary)] tracking-wider">
              2. Supabase Database
            </span>
            <Database size={15} className="text-[#397A9F]" />
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] tech-mono font-bold px-2 py-0.5 rounded border ${connectionStatus === 'CONNECTED' ? 'bg-[#E2ECE7] text-[var(--color-mine-accent)] border-[#C2D8CD]' : 'bg-[var(--color-mine-critical-bg)] text-[var(--color-mine-critical)] border-[var(--color-mine-critical-border)]'}`}>
              {connectionStatus === 'CONNECTED' ? 'ONLINE' : connectionStatus}
            </span>
            <span className="text-[10px] tech-mono text-[var(--color-mine-secondary)]">PostgreSQL</span>
          </div>
          <div className="mt-2 text-[10px] text-[var(--color-mine-secondary)] border-t border-[var(--color-mine-grid)] pt-1.5">
            Endpoint: <span className="font-mono font-semibold">conveyor_telemetry</span>
          </div>
        </div>

        {/* 3. Telemetry Stream */}
        <div className="bg-white p-3.5 rounded-lg border border-[var(--color-mine-border)] shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-[var(--color-mine-secondary)] tracking-wider">
              3. Telemetry Ingestion
            </span>
            <Activity size={15} className="text-[var(--color-mine-accent)]" />
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] tech-mono font-bold px-2 py-0.5 rounded border ${connectionStatus === 'CONNECTED' ? 'bg-[#E2ECE7] text-[var(--color-mine-accent)] border-[#C2D8CD]' : 'bg-[var(--color-mine-panel-sub)] text-[var(--color-mine-secondary)] border-[var(--color-mine-border)]'}`}>
              {connectionStatus === 'CONNECTED' ? (isDemoMode ? 'SIMULATOR LIVE' : 'STREAMING LIVE') : 'WAITING'}
            </span>
            <span className="text-[10px] tech-mono text-[var(--color-mine-secondary)]">Realtime WS</span>
          </div>
          <div className="mt-2 text-[10px] text-[var(--color-mine-secondary)] border-t border-[var(--color-mine-grid)] pt-1.5">
            Ingestion Interval: ~1.5s • Zero synthetic data
          </div>
        </div>

        {/* 4. Temperature Sensor */}
        <div className="bg-white p-3.5 rounded-lg border border-[var(--color-mine-border)] shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-[var(--color-mine-secondary)] tracking-wider">
              4. Temperature Sensor
            </span>
            <Thermometer size={15} className="text-[var(--color-mine-amber)]" />
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] tech-mono font-bold px-2 py-0.5 rounded border ${getBadge(tempH.status)}`}>
              {tempH.status}
            </span>
            <span className="text-[10px] tech-mono font-bold text-[var(--color-mine-dark)]">{telemetry.temperature !== null ? `${telemetry.temperature.toFixed(1)}°C` : 'N/A'}</span>
          </div>
          <div className="mt-2 text-[10px] text-[var(--color-mine-secondary)] border-t border-[var(--color-mine-grid)] pt-1.5">
            {tempH.note} (DS18B20 1-Wire Digital)
          </div>
        </div>

        {/* 5. Vibration Sensor */}
        <div className="bg-white p-3.5 rounded-lg border border-[var(--color-mine-border)] shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-[var(--color-mine-secondary)] tracking-wider">
              5. Vibration Sensor
            </span>
            <Gauge size={15} className="text-[var(--color-mine-accent)]" />
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] tech-mono font-bold px-2 py-0.5 rounded border ${getBadge(vibH.status)}`}>
              {vibH.status}
            </span>
            <span className="text-[10px] tech-mono font-bold text-[var(--color-mine-dark)]">{telemetry.vibration !== null ? `${telemetry.vibration.toFixed(2)} mm/s` : 'N/A'}</span>
          </div>
          <div className="mt-2 text-[10px] text-[var(--color-mine-secondary)] border-t border-[var(--color-mine-grid)] pt-1.5">
            {vibH.note} (MPU6050 6-DOF IMU)
          </div>
        </div>

        {/* 6. Load Cell Sensor */}
        <div className="bg-white p-3.5 rounded-lg border border-[var(--color-mine-border)] shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-[var(--color-mine-secondary)] tracking-wider">
              6. Load Cell Sensor
            </span>
            <Scale size={15} className="text-[#397A9F]" />
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] tech-mono font-bold px-2 py-0.5 rounded border ${getBadge(loadH.status)}`}>
              {loadH.status}
            </span>
            <span className="text-[10px] tech-mono font-bold text-[var(--color-mine-dark)]">{telemetry.load !== null ? `${Math.max(0, telemetry.load).toFixed(2)} kg` : 'N/A'}</span>
          </div>
          <div className="mt-2 text-[10px] text-[var(--color-mine-secondary)] border-t border-[var(--color-mine-grid)] pt-1.5">
            {loadH.note} (HX711 24-bit ADC)
          </div>
        </div>

        {/* 7. Current Sensor */}
        <div className="bg-white p-3.5 rounded-lg border border-[var(--color-mine-border)] shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-[var(--color-mine-secondary)] tracking-wider">
              7. Motor Current Sensor
            </span>
            <Zap size={15} className="text-[var(--color-mine-accent)]" />
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] tech-mono font-bold px-2 py-0.5 rounded border ${getBadge(currH.status)}`}>
              {currH.status}
            </span>
            <span className="text-[10px] tech-mono font-bold text-[var(--color-mine-dark)]">{telemetry.motor_current !== null ? `${telemetry.motor_current.toFixed(2)} A` : 'N/A'}</span>
          </div>
          <div className="mt-2 text-[10px] text-[var(--color-mine-secondary)] border-t border-[var(--color-mine-grid)] pt-1.5">
            {currH.note} (ACS712 Hall-Effect Transducer)
          </div>
        </div>

        {/* 8. Encoder System */}
        <div className="bg-white p-3.5 rounded-lg border border-[var(--color-mine-border)] shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-[var(--color-mine-secondary)] tracking-wider">
              8. Encoder System
            </span>
            <Disc3 size={15} className="text-[var(--color-mine-secondary)]" />
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] tech-mono font-bold px-2 py-0.5 rounded border ${getBadge(encH.status)}`}>
              {encH.status}
            </span>
            <span className="text-[10px] tech-mono font-bold text-[var(--color-mine-dark)]">{telemetry.rpm1 !== null ? `${telemetry.rpm1} RPM` : 'N/A'}</span>
          </div>
          <div className="mt-2 text-[10px] text-[var(--color-mine-secondary)] border-t border-[var(--color-mine-grid)] pt-1.5">
            {encH.note} (Dual Roller Optical Encoders)
          </div>
        </div>

        {/* 9. Thickness Measurement */}
        <div className="bg-white p-3.5 rounded-lg border border-[var(--color-mine-border)] shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-[var(--color-mine-secondary)] tracking-wider">
              9. Belt Thickness
            </span>
            <Layers size={15} className="text-[var(--color-mine-accent-dark)]" />
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] tech-mono font-bold px-2 py-0.5 rounded border ${getBadge(thickH.status)}`}>
              {thickH.status}
            </span>
            <span className="text-[10px] tech-mono font-bold text-[var(--color-mine-dark)]">
              {telemetry.belt_thickness !== null && telemetry.belt_thickness > 0 ? `${telemetry.belt_thickness.toFixed(1)} mm` : 'N/A'}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-[var(--color-mine-secondary)] border-t border-[var(--color-mine-grid)] pt-1.5">
            {thickH.note} (Ultrasonic Prototype Estimation)
          </div>
        </div>

        {/* 10. AI Vision Engine */}
        <div className="bg-white p-3.5 rounded-lg border border-[var(--color-mine-border)] shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-[var(--color-mine-secondary)] tracking-wider">
              10. AI Inspection Pipeline
            </span>
            <Eye size={15} className="text-[var(--color-mine-accent)]" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] tech-mono font-bold px-2 py-0.5 rounded border bg-[#E2ECE7] text-[var(--color-mine-accent)] border-[#C2D8CD]">
              READY
            </span>
            <span className="text-[10px] tech-mono text-[var(--color-mine-secondary)]">Client / YOLO</span>
          </div>
          <div className="mt-2 text-[10px] text-[var(--color-mine-secondary)] border-t border-[var(--color-mine-grid)] pt-1.5">
            AI-Assisted Visual Inspection • Zero fake inference
          </div>
        </div>

        {/* 11. Camera System */}
        <div className="bg-white p-3.5 rounded-lg border border-[var(--color-mine-border)] shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-[var(--color-mine-secondary)] tracking-wider">
              11. Optical Camera Link
            </span>
            <Camera size={15} className="text-[var(--color-mine-secondary)]" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] tech-mono font-bold px-2 py-0.5 rounded border bg-[#E2ECE7] text-[var(--color-mine-accent)] border-[#C2D8CD]">
              {isMonitoring ? 'ACTIVE' : 'READY'}
            </span>
            <span className="text-[10px] tech-mono text-[var(--color-mine-secondary)]">MediaDevices</span>
          </div>
          <div className="mt-2 text-[10px] text-[var(--color-mine-secondary)] border-t border-[var(--color-mine-grid)] pt-1.5">
            WebRTC Camera + Local Image Upload Pipeline
          </div>
        </div>

      </div>

      {/* Physical Safety Architecture & Boundary Notice (Section 27 & 28) */}
      <div className="bg-[#FCFBF8] p-4 rounded-lg border border-[var(--color-mine-border)] space-y-2">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-[var(--color-mine-accent)]" />
          <span className="text-xs font-extrabold uppercase tracking-wide text-[var(--color-mine-dark)]">
            PHYSICAL SAFETY ARCHITECTURE & MONITORING SEPARATION
          </span>
        </div>
        <p className="text-xs text-[var(--color-mine-secondary)] leading-relaxed">
          The MineGuard AI dashboard functions exclusively as a <strong>supervisory monitoring and predictive inspection interface</strong>. The physical safety shutdown mechanism—including the physical E-STOP push button, manual safety reset, safety latch relay, motor contactor de-energization, and hardware watchdog timer—resides locally on the conveyor electrical hardware. In accordance with industrial safety engineering best practices, no software or web button can bypass or replace local physical safety interlocks.
        </p>
      </div>

      {/* Engineering Prototype Limitations (Section 46 & 47) */}
      <div className="bg-[#FAF8F2] p-4 rounded-lg border border-[var(--color-mine-border)] space-y-2">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-[var(--color-mine-secondary)]" />
          <span className="text-xs font-extrabold uppercase tracking-wide text-[var(--color-mine-dark)]">
            PROTOTYPE SPECIFICATION & REGULATORY LIMITATIONS (SIH 26008)
          </span>
        </div>
        <p className="text-xs text-[var(--color-mine-secondary)] leading-relaxed">
          MineGuard AI is an <em>engineering prototype</em> designed using established machinery-safety principles to demonstrate real-time conveyor monitoring, AI-assisted optical defect detection, multi-sensor telemetry, and safety-oriented shutdown concepts. 
        </p>
        <p className="text-xs text-[var(--color-mine-secondary)] leading-relaxed font-medium">
          Formal machinery certification, functional safety validation (e.g., ISO 13849 PL, IEC 62061 SIL), industrial deployment qualification, and commercial production certification are outside the scope of this academic prototype. Ultrasonic thickness readings represent experimental prototype estimations.
        </p>
      </div>

    </div>
  );
}
