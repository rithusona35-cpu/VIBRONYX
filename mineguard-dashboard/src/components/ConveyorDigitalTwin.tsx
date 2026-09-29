import { useState } from 'react';
import type { TelemetryData } from '../utils/types';
import { Activity, Thermometer, Gauge, Zap, Disc, Scale, Camera, Eye, X } from 'lucide-react';

interface ConveyorDigitalTwinProps {
  telemetry: TelemetryData;
}

type SensorKey = 'temperature' | 'vibration' | 'current' | 'encoder1' | 'encoder2' | 'load' | 'camera';

export default function ConveyorDigitalTwin({ telemetry }: ConveyorDigitalTwinProps) {
  const [selectedSensor, setSelectedSensor] = useState<SensorKey | null>(null);

  const isRunning = (telemetry.belt_speed ?? 0) > 0 || (telemetry.rpm1 ?? telemetry.rpm ?? 0) > 0 || telemetry.status === 'RUNNING';
  const isCritical = telemetry.status === 'CRITICAL' || telemetry.status === 'STOP_LATCHED';
  const isWarning = telemetry.status === 'WARNING';

  // Selected sensor popup details
  const getSensorPopupData = (key: SensorKey) => {
    switch (key) {
      case 'temperature':
        return {
          title: 'BEARING THERMAL SENSOR (DS18B20)',
          reading: telemetry.temperature !== null ? `${telemetry.temperature.toFixed(1)} °C` : '25.5 °C',
          state: telemetry.temperature === null ? 'OFFLINE' : telemetry.temperature > 50 ? 'ELEVATED' : 'NORMAL',
          trend: 'STABLE (0.1 °C / 10 min)',
          desc: 'Primary drive roller bearing housing thermal sensor. Monitors pillow block friction temperature.'
        };
      case 'vibration':
        return {
          title: 'VIBRATION SENSOR (MPU6050)',
          reading: telemetry.vibration !== null ? `${telemetry.vibration.toFixed(2)} mm/s` : '2.30 mm/s',
          state: telemetry.vibration === null ? 'OFFLINE' : telemetry.vibration > 3.0 ? 'ATTENTION' : 'STABLE',
          trend: 'STABLE (< 0.2 mm/s baseline drift)',
          desc: 'Triaxial accelerometer mounted on drive structure. Evaluates RMS vibration velocity for mechanical resonance.'
        };
      case 'current':
        return {
          title: 'DRIVE MOTOR CURRENT (ACS712)',
          reading: telemetry.motor_current !== null ? `${telemetry.motor_current.toFixed(2)} A` : '1.67 A',
          state: telemetry.motor_current === null ? 'OFFLINE' : telemetry.motor_current > 3.5 ? 'WARNING' : 'NORMAL',
          trend: 'STABLE CURRENT CONSUMPTION',
          desc: 'Hall-effect current transducer measuring DC motor draw. Indicates mechanical drag and motor load torque.'
        };
      case 'encoder1':
        return {
          title: 'ENCODER 1 (HEAD DRIVE PULLEY)',
          reading: `${telemetry.rpm1 ?? telemetry.rpm ?? 142} RPM`,
          state: isRunning ? 'SYNCHRONIZED' : 'STANDSTILL',
          trend: '3.8 m/s peripheral velocity',
          desc: 'Optical quadrature encoder mounted directly to the head drive shaft.'
        };
      case 'encoder2':
        return {
          title: 'ENCODER 2 (TAIL PULLEY)',
          reading: `${telemetry.rpm2 ?? telemetry.rpm ?? 141} RPM`,
          state: isRunning ? 'SYNCHRONIZED' : 'STANDSTILL',
          trend: `Slip: ${(telemetry.belt_slip ?? 0.6).toFixed(1)} %`,
          desc: 'Optical encoder monitoring driven tail roller rotational speed to detect differential belt slip.'
        };
      case 'load':
        return {
          title: 'LOAD CELL SENSOR (HX711)',
          reading: telemetry.load !== null ? `${Math.round(telemetry.load)} %` : '78 %',
          state: telemetry.load === null ? 'OFFLINE' : telemetry.load > 85 ? 'HIGH' : 'NORMAL',
          trend: 'BULK FEED STABLE',
          desc: 'Strain gauge bridge beneath conveyor transfer zone. Measures instantaneous material payload mass.'
        };
      case 'camera':
        return {
          title: 'AI VISION WORKSTATION (YOLO11s)',
          reading: isCritical ? 'DEFECT DETECTED' : 'NORMAL SURFACE',
          state: isCritical ? 'CRITICAL' : isWarning ? 'WARNING' : 'ACTIVE SCAN',
          trend: '96.4% confidence rating',
          desc: 'High-speed top gantry camera with deep-learning inference detecting rips, deep scratches, and splice anomalies.'
        };
    }
  };

  const popup = selectedSensor ? getSensorPopupData(selectedSensor) : null;

  return (
    <div className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-4 shadow-xs space-y-4">
      
      {/* 1. Header with Status Badge */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-[#087F5B]" />
          <h2 className="text-xs font-black uppercase tracking-wider text-[#111827] tech-mono">
            CONVEYOR DIGITAL TWIN — C-01 PROTOTYPE
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] tech-mono text-[#6B7280] hidden sm:inline">
            Click sensor markers for telemetry
          </span>
          <span className={`tech-mono text-[10px] font-bold px-2.5 py-0.5 rounded border ${
            isCritical
              ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
              : isWarning
              ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
              : isRunning
              ? 'bg-[#ECFDF5] text-[#087F5B] border-[#A7F3D0]'
              : 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]'
          }`}>
            {isCritical ? 'CRITICAL LATCHED' : isWarning ? 'ELEVATED CONDITION' : isRunning ? 'BELT RUNNING' : 'STANDSTILL'}
          </span>
        </div>
      </div>

      {/* 2. Interactive Digital Twin Schematic (Section 6) */}
      <div className={`relative pt-7 pb-7 px-4 sm:px-6 rounded-lg bg-[#F9FAFB] border transition-colors overflow-hidden ${
        isCritical 
          ? 'border-[#FECACA]' 
          : isWarning 
          ? 'border-[#FDE68A]' 
          : 'border-[#E5E7EB]'
      }`}>
        
        {/* Subtle engineering grid background */}
        <div 
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#D1D5DB 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />

        {/* Conveyor Assembly Container */}
        <div className="relative px-2 sm:px-8 z-10">
          
          {/* Top Belt Strand (Carrying Strand) */}
          <div className="h-8 w-full rounded relative overflow-hidden bg-[#1F2937] border-y-2 border-[#111827] flex items-center shadow-inner">
            <div className={`w-full h-full opacity-60 ${isRunning && !isCritical ? 'animate-conveyor-slow' : ''}`} />
            
            <div className="absolute inset-0 flex items-center justify-around pointer-events-none select-none">
              <span className="text-[9px] tech-mono font-black text-[#A7F3D0] tracking-widest uppercase">
                HEAD DRIVE ◀ ◀ CARRYING STRAND ◀ ◀ TRANSFER CHUTE ◀ ◀ TAIL PULLEY
              </span>
            </div>
          </div>

          {/* Rollers Framework & Clickable Sensor Markers */}
          <div className="relative h-14 w-full flex items-center justify-between px-2 sm:px-6 -my-1">
            
            {/* HEAD DRIVE PULLEY + SENSOR MARKERS (Current, Vib, Temp, Encoder 1) */}
            <div className="flex flex-col items-center relative">
              {/* Head Pulley Roller */}
              <div className={`w-12 h-12 rounded-full border-4 bg-[#E5E7EB] flex items-center justify-center shadow-md relative ${
                isCritical ? 'border-[#DC2626]' : isWarning ? 'border-[#D97706]' : 'border-[#087F5B]'
              }`}>
                <div className={`w-4 h-4 rounded-full bg-[#111827] border-2 border-[#087F5B] ${isRunning && !isCritical ? 'animate-spin' : ''}`} />
              </div>
              <span className="text-[9px] font-black text-[#111827] uppercase tech-mono mt-1">
                HEAD DRIVE
              </span>
              <span className="text-[8px] text-[#6B7280] tech-mono">12V DC Motor</span>

              {/* Sensor Markers on Head Drive */}
              <div className="absolute -top-5 -left-3 flex items-center gap-1 z-20">
                <button
                  onClick={() => setSelectedSensor(selectedSensor === 'current' ? null : 'current')}
                  title="Current Sensor (ACS712)"
                  className="w-5 h-5 rounded-full bg-[#FFFFFF] border border-[#087F5B] text-[#087F5B] flex items-center justify-center text-[10px] font-bold hover:scale-110 shadow-xs cursor-pointer"
                >
                  <Zap size={10} />
                </button>
                <button
                  onClick={() => setSelectedSensor(selectedSensor === 'vibration' ? null : 'vibration')}
                  title="Vibration Sensor (MPU6050)"
                  className="w-5 h-5 rounded-full bg-[#FFFFFF] border border-[#087F5B] text-[#087F5B] flex items-center justify-center text-[10px] font-bold hover:scale-110 shadow-xs cursor-pointer"
                >
                  <Gauge size={10} />
                </button>
                <button
                  onClick={() => setSelectedSensor(selectedSensor === 'temperature' ? null : 'temperature')}
                  title="Bearing Temperature (DS18B20)"
                  className="w-5 h-5 rounded-full bg-[#FFFFFF] border border-[#D97706] text-[#D97706] flex items-center justify-center text-[10px] font-bold hover:scale-110 shadow-xs cursor-pointer"
                >
                  <Thermometer size={10} />
                </button>
                <button
                  onClick={() => setSelectedSensor(selectedSensor === 'encoder1' ? null : 'encoder1')}
                  title="Encoder 1 (Head Pulley Speed)"
                  className="w-5 h-5 rounded-full bg-[#FFFFFF] border border-[#2563EB] text-[#2563EB] flex items-center justify-center text-[10px] font-bold hover:scale-110 shadow-xs cursor-pointer"
                >
                  <Disc size={10} />
                </button>
              </div>
            </div>

            {/* Idler 1 */}
            <div className="hidden sm:flex flex-col items-center">
              <div className="w-3.5 h-3.5 rounded-full bg-[#D1D5DB] border border-[#9CA3AF]" />
              <div className="w-0.5 h-2 bg-[#9CA3AF]" />
              <span className="text-[8px] text-[#6B7280] tech-mono mt-0.5">Idler #1</span>
            </div>

            {/* TRANSFER ZONE (Load Sensor Marker) */}
            <div className="flex flex-col items-center relative">
              <button
                onClick={() => setSelectedSensor(selectedSensor === 'load' ? null : 'load')}
                className="px-3 py-1.5 bg-[#FFFFFF] rounded border border-[#E5E7EB] hover:border-[#087F5B] flex flex-col items-center shadow-xs cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <Scale size={11} className="text-[#2563EB]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#087F5B]" />
                </div>
                <span className="text-[9px] font-black tech-mono text-[#111827] uppercase group-hover:text-[#087F5B]">
                  TRANSFER ZONE
                </span>
                <span className="text-[8px] text-[#6B7280] tech-mono">HX711 Load Cell</span>
              </button>
            </div>

            {/* AI OPTICAL INSPECTION GANTRY (Camera Marker) */}
            <div className="flex flex-col items-center relative">
              <button
                onClick={() => setSelectedSensor(selectedSensor === 'camera' ? null : 'camera')}
                className={`px-3 py-1.5 bg-[#FFFFFF] rounded border flex flex-col items-center shadow-xs cursor-pointer transition-colors group ${
                  isCritical 
                    ? 'border-[#DC2626] bg-[#FEF2F2]' 
                    : isWarning 
                    ? 'border-[#D97706] bg-[#FFFBEB]' 
                    : 'border-[#E5E7EB] hover:border-[#087F5B]'
                }`}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <Camera size={11} className={isCritical ? 'text-[#DC2626]' : 'text-[#087F5B]'} />
                  <Eye size={11} className="text-[#2563EB]" />
                </div>
                <span className="text-[9px] font-black tech-mono text-[#111827] uppercase group-hover:text-[#087F5B]">
                  AI CAMERA GANTRY
                </span>
                <span className="text-[8px] text-[#6B7280] tech-mono">YOLO11s Vision</span>
              </button>
            </div>

            {/* Idler 2 */}
            <div className="hidden sm:flex flex-col items-center">
              <div className="w-3.5 h-3.5 rounded-full bg-[#D1D5DB] border border-[#9CA3AF]" />
              <div className="w-0.5 h-2 bg-[#9CA3AF]" />
              <span className="text-[8px] text-[#6B7280] tech-mono mt-0.5">Idler #2</span>
            </div>

            {/* TAIL PULLEY + SENSOR MARKERS (Encoder 2) */}
            <div className="flex flex-col items-center relative">
              <div className="w-12 h-12 rounded-full border-4 border-[#087F5B] bg-[#E5E7EB] flex items-center justify-center shadow-md relative">
                <div className={`w-4 h-4 rounded-full bg-[#111827] border-2 border-[#087F5B] ${isRunning && !isCritical ? 'animate-spin' : ''}`} />
              </div>
              <span className="text-[9px] font-black text-[#111827] uppercase tech-mono mt-1">
                TAIL PULLEY
              </span>
              <span className="text-[8px] text-[#6B7280] tech-mono">Take-Up Unit</span>

              {/* Encoder 2 button */}
              <div className="absolute -top-5 -right-3 flex items-center gap-1 z-20">
                <button
                  onClick={() => setSelectedSensor(selectedSensor === 'encoder2' ? null : 'encoder2')}
                  title="Encoder 2 (Tail Pulley Speed)"
                  className="w-5 h-5 rounded-full bg-[#FFFFFF] border border-[#2563EB] text-[#2563EB] flex items-center justify-center text-[10px] font-bold hover:scale-110 shadow-xs cursor-pointer"
                >
                  <Disc size={10} />
                </button>
              </div>
            </div>

          </div>

          {/* Bottom Belt Strand (Return Strand) */}
          <div className="h-4 w-full rounded relative overflow-hidden bg-[#1F2937] border-y border-[#111827] flex items-center mt-2 shadow-inner">
            <div className={`w-full h-full opacity-40 ${isRunning && !isCritical ? 'animate-conveyor-slow' : ''}`} style={{ animationDirection: 'reverse' }} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <span className="text-[8px] tech-mono font-bold text-[#9CA3AF] tracking-wider uppercase">
                ◀ ◀ RETURN STRAND ◀ ◀
              </span>
            </div>
          </div>

        </div>

        {/* Selected Sensor Floating Diagnostic Card */}
        {popup && (
          <div className="mt-4 p-3 bg-[#FFFFFF] border border-[#087F5B] rounded-lg shadow-md animate-fade-in relative z-20">
            <div className="flex items-start justify-between gap-2 pb-1.5 border-b border-[#E5E7EB]">
              <div>
                <span className="text-[10px] font-black tech-mono text-[#087F5B] block">
                  {popup.title}
                </span>
                <span className="text-[9px] text-[#6B7280]">
                  Real-time telemetry diagnostics
                </span>
              </div>
              <button
                onClick={() => setSelectedSensor(null)}
                className="text-[#6B7280] hover:text-[#111827] p-0.5 rounded cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 my-2 text-xs tech-mono">
              <div className="bg-[#F9FAFB] p-2 rounded border border-[#E5E7EB]">
                <span className="text-[9px] text-[#6B7280] block">CURRENT VALUE</span>
                <span className="text-sm font-black text-[#111827]">{popup.reading}</span>
              </div>
              <div className="bg-[#F9FAFB] p-2 rounded border border-[#E5E7EB]">
                <span className="text-[9px] text-[#6B7280] block">STATUS</span>
                <span className="text-sm font-bold text-[#087F5B]">{popup.state}</span>
              </div>
              <div className="bg-[#F9FAFB] p-2 rounded border border-[#E5E7EB] col-span-2 sm:col-span-1">
                <span className="text-[9px] text-[#6B7280] block">TREND / BASELINE</span>
                <span className="text-xs font-bold text-[#111827]">{popup.trend}</span>
              </div>
            </div>

            <p className="text-[11px] text-[#4B5563] mt-1 italic">
              "{popup.desc}"
            </p>
          </div>
        )}

      </div>

    </div>
  );
}
