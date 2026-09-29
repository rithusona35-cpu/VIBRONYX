import type { TelemetryData } from '../utils/types';
import { Activity, Flame, Gauge, Zap, Layers, Scale, Disc } from 'lucide-react';

interface PrimaryKPIStripProps {
  telemetry: TelemetryData;
}

export default function PrimaryKPIStrip({ telemetry }: PrimaryKPIStripProps) {
  // 1. BELT SPEED (e.g. 3.8 m/s, SYNCHRONIZED)
  const isStopped = (telemetry.belt_speed ?? 0) === 0 && (telemetry.rpm1 ?? telemetry.rpm ?? 0) === 0;
  const speedVal = telemetry.belt_speed !== null ? telemetry.belt_speed.toFixed(1) : '3.8';
  const speedStatus = isStopped ? 'STOPPED' : (telemetry.belt_slip ?? 0) > 5.0 ? 'SLIP DRIFT' : 'SYNCHRONIZED';

  // 2. TEMPERATURE (e.g. 25.5 °C, NORMAL)
  const tempVal = telemetry.temperature !== null ? telemetry.temperature.toFixed(1) : '25.5';
  const tempStatus = telemetry.temperature === null ? 'SENSOR OFFLINE' : telemetry.temperature > 50 ? 'ELEVATED' : 'NORMAL';

  // 3. VIBRATION (e.g. 2.30 mm/s, STABLE)
  const isVibRaw = telemetry.vibration !== null && telemetry.vibration > 50;
  const vibVal = telemetry.vibration !== null 
    ? (isVibRaw ? telemetry.vibration.toFixed(1) : telemetry.vibration.toFixed(2)) 
    : '2.30';
  const vibUnit = isVibRaw ? 'm/s²' : 'mm/s';
  const vibStatus = telemetry.vibration === null 
    ? 'SENSOR OFFLINE' 
    : (isVibRaw ? telemetry.vibration > 115 : telemetry.vibration > 3.0) 
    ? 'ATTENTION' 
    : 'STABLE';

  // 4. MOTOR CURRENT (e.g. 1.67 A, NORMAL)
  const currVal = telemetry.motor_current !== null ? telemetry.motor_current.toFixed(2) : '1.67';
  const currStatus = telemetry.motor_current === null ? 'SENSOR OFFLINE' : telemetry.motor_current > 4.0 ? 'OVERCURRENT' : 'NORMAL';

  // 5. LOAD (e.g. 78 %, NORMAL)
  const loadVal = telemetry.load !== null 
    ? (Math.abs(telemetry.load) < 0.05 ? '0' : Math.round(telemetry.load).toString()) 
    : '78';
  const loadStatus = telemetry.load === null ? 'SENSOR OFFLINE' : (telemetry.load ?? 0) > 85 ? 'HIGH LOAD' : 'NORMAL';

  // 6. BELT THICKNESS (e.g. 12.4 mm, NOMINAL or NO VALID READING)
  const isThickValid = telemetry.belt_thickness !== null && telemetry.belt_thickness > 0;
  const thickVal = isThickValid ? telemetry.belt_thickness!.toFixed(1) : '12.4';
  const thickStatus = isThickValid ? 'NOMINAL' : 'NO ECHO';

  // 7. BELT SLIP (e.g. 0.6 %, LOCKED)
  const slipVal = telemetry.belt_slip !== null ? telemetry.belt_slip.toFixed(1) : '0.6';
  const slipStatus = isStopped ? 'PARKED' : (telemetry.belt_slip ?? 0) > 5.0 ? 'SLIP ALERT' : 'LOCKED';

  const cards = [
    {
      label: 'BELT SPEED',
      value: speedVal,
      unit: 'm/s',
      status: speedStatus,
      icon: <Activity size={14} className="text-[#087F5B]" />
    },
    {
      label: 'TEMPERATURE',
      value: tempVal,
      unit: '°C',
      status: tempStatus,
      icon: <Flame size={14} className="text-[#D97706]" />
    },
    {
      label: 'VIBRATION',
      value: vibVal,
      unit: vibUnit,
      status: vibStatus,
      icon: <Gauge size={14} className="text-[#087F5B]" />
    },
    {
      label: 'MOTOR CURRENT',
      value: currVal,
      unit: 'A',
      status: currStatus,
      icon: <Zap size={14} className="text-[#2563EB]" />
    },
    {
      label: 'LOAD',
      value: loadVal,
      unit: '%',
      status: loadStatus,
      icon: <Scale size={14} className="text-[#7C3AED]" />
    },
    {
      label: 'BELT THICKNESS',
      value: thickVal,
      unit: isThickValid ? 'mm' : 'mm',
      status: thickStatus,
      icon: <Layers size={14} className="text-[#087F5B]" />
    },
    {
      label: 'BELT SLIP',
      value: slipVal,
      unit: '%',
      status: slipStatus,
      icon: <Disc size={14} className="text-[#087F5B]" />
    }
  ];

  return (
    <div className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg shadow-xs overflow-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 divide-x divide-y lg:divide-y-0 divide-[#E5E7EB]">
        {cards.map((card, idx) => {
          const isWarn = card.status === 'ATTENTION' || card.status === 'ELEVATED' || card.status === 'HIGH LOAD' || card.status === 'SLIP ALERT' || card.status === 'SLIP DRIFT' || card.status === 'OVERCURRENT';
          const isOffline = card.status === 'SENSOR OFFLINE' || card.status === 'NO ECHO';
          const isParked = card.status === 'STOPPED' || card.status === 'PARKED';

          return (
            <div 
              key={idx} 
              className="p-3 lg:p-3.5 flex flex-col justify-between hover:bg-[#F9FAFB] transition-colors group"
            >
              {/* Top label + Icon */}
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-[10px] font-bold tracking-wider text-[#6B7280] uppercase truncate tech-mono">
                  {card.label}
                </span>
                <span className="opacity-80 group-hover:opacity-100 transition-opacity">
                  {card.icon}
                </span>
              </div>

              {/* Value + Unit */}
              <div className="flex items-baseline gap-1.5 my-0.5 min-w-0">
                <span className={`text-xl lg:text-2xl font-black tech-mono tracking-tight truncate ${
                  isWarn 
                    ? 'text-[#D97706]' 
                    : isOffline 
                    ? 'text-xs text-[#DC2626]' 
                    : isParked 
                    ? 'text-[#6B7280]' 
                    : 'text-[#111827]'
                }`}>
                  {card.value}
                </span>
                {card.unit && !isOffline && (
                  <span className="text-xs text-[#6B7280] font-medium tech-mono">
                    {card.unit}
                  </span>
                )}
              </div>

              {/* Status Pill */}
              <div className="mt-2 pt-1.5 border-t border-[#F3F4F6] flex items-center justify-between">
                <span className={`tech-mono text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  isWarn
                    ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]'
                    : isOffline
                    ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                    : isParked
                    ? 'bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]'
                    : 'bg-[#ECFDF5] text-[#087F5B] border border-[#A7F3D0]'
                }`}>
                  {card.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
