import type { TelemetryData } from '../utils/types';
import { Activity, Gauge, Flame, Zap, Layers, Disc3 } from 'lucide-react';

interface LiveStatusStripProps {
  telemetry: TelemetryData;
}

export default function LiveStatusStrip({ telemetry }: LiveStatusStripProps) {
  const getStatusCategory = (s: string) => {
    if (s === 'CRITICAL' || s === 'STOP_LATCHED') return 'CRITICAL';
    if (s === 'WARNING' || s === 'SENSOR FAULT') return 'WARNING';
    if (s === 'OFFLINE') return 'OFFLINE';
    return 'NORMAL';
  };

  const isVibRaw = telemetry.vibration !== null && telemetry.vibration > 50;

  const items = [
    {
      label: 'CONVEYOR STATUS',
      value: telemetry.status,
      unit: '',
      status: getStatusCategory(telemetry.status),
      explanation: telemetry.status === 'STOP_LATCHED'
        ? 'Emergency / safety latch engaged'
        : telemetry.status === 'SENSOR FAULT'
        ? 'Sensor communication fault'
        : telemetry.status === 'OFFLINE'
        ? 'Telemetry stream offline'
        : telemetry.status === 'CRITICAL'
        ? 'Critical threshold exceeded'
        : telemetry.status === 'WARNING'
        ? 'Operating parameter warning'
        : 'Continuous haulage operating nominal',
      icon: <Activity size={16} className="text-[var(--color-mine-accent)]" />
    },
    {
      label: 'TEMPERATURE',
      value: telemetry.temperature !== null ? telemetry.temperature.toFixed(1) : 'N/A',
      unit: telemetry.temperature !== null ? '°C' : '',
      status: telemetry.temperature === null ? 'OFFLINE' : telemetry.temperature > 50 ? 'WARNING' : 'NORMAL',
      explanation: telemetry.temperature === null ? 'No sensor reading' : telemetry.temperature > 50 ? 'Bearing temperature elevated' : 'Normal contact temperature',
      icon: <Flame size={16} className="text-[var(--color-mine-amber)]" />
    },
    {
      label: 'VIBRATION',
      value: telemetry.vibration !== null ? (isVibRaw ? telemetry.vibration.toFixed(1) : telemetry.vibration.toFixed(2)) : 'N/A',
      unit: telemetry.vibration !== null ? (isVibRaw ? 'm/s²' : 'mm/s') : '',
      status: telemetry.vibration === null ? 'OFFLINE' : (isVibRaw ? telemetry.vibration > 115 : telemetry.vibration > 3.0) ? 'WARNING' : 'NORMAL',
      explanation: telemetry.vibration === null ? 'No sensor reading' : (isVibRaw ? telemetry.vibration > 115 : telemetry.vibration > 3.0) ? 'Elevated vibration pattern' : 'Vibration within safe baseline',
      icon: <Gauge size={16} className="text-[var(--color-mine-accent)]" />
    },
    {
      label: 'MOTOR CURRENT',
      value: telemetry.motor_current !== null ? telemetry.motor_current.toFixed(2) : 'N/A',
      unit: telemetry.motor_current !== null ? 'A' : '',
      status: telemetry.motor_current === null ? 'OFFLINE' : telemetry.motor_current > 4.0 ? 'WARNING' : 'NORMAL',
      explanation: telemetry.motor_current === null ? 'No sensor reading' : telemetry.motor_current > 4.0 ? 'Motor load approaching peak' : 'Motor within expected load range',
      icon: <Zap size={16} className="text-[#0B5C43]" />
    },
    {
      label: 'LOAD',
      value: telemetry.load !== null ? (Math.abs(telemetry.load) < 0.05 ? '0 (Calib)' : telemetry.load.toFixed(0)) : 'N/A',
      unit: telemetry.load !== null ? (Math.abs(telemetry.load) < 0.05 ? '' : '%') : '',
      status: telemetry.load === null ? 'OFFLINE' : telemetry.load > 85 ? 'WARNING' : 'NORMAL',
      explanation: telemetry.load === null ? 'Load cell offline' : Math.abs(telemetry.load) < 0.05 ? 'Load cell zero baseline' : 'Material loading nominal',
      icon: <Layers size={16} className="text-[var(--color-mine-secondary)]" />
    },
    {
      label: 'BELT SPEED',
      value: telemetry.belt_speed !== null ? telemetry.belt_speed.toFixed(1) : '0.0',
      unit: 'm/s',
      status: telemetry.belt_speed === null ? 'OFFLINE' : telemetry.belt_speed === 0 ? 'NORMAL' : 'NORMAL',
      explanation: telemetry.belt_speed === 0 ? 'Conveyor belt at standby (0 RPM)' : 'Belt synchronized to drive speed',
      icon: <Disc3 size={16} className="text-[var(--color-mine-accent)]" />
    },
    {
      label: 'BELT THICKNESS',
      value: telemetry.belt_thickness !== null ? telemetry.belt_thickness.toFixed(1) : 'No Echo',
      unit: telemetry.belt_thickness !== null ? 'mm' : '',
      status: telemetry.belt_thickness === null ? 'NORMAL' : telemetry.belt_thickness < 10.5 ? 'WARNING' : 'NORMAL',
      explanation: telemetry.belt_thickness === null ? 'Ultrasonic sonar awaiting valid echo' : 'Belt carcass top cover nominal',
      icon: <Layers size={16} className="text-[var(--color-mine-blue)]" />
    }
  ];

  return (
    <div className="w-full bg-[#FFFFFF] border-b border-[var(--color-mine-border)] shadow-2xs overflow-x-auto">
      <div className="flex divide-x divide-[var(--color-mine-border)] min-w-[1100px]">
        {items.map((item, index) => {
          const isCritical = item.status === 'CRITICAL';
          const isWarning = item.status === 'WARNING';
          const isOffline = item.status === 'OFFLINE';

          return (
            <div 
              key={index} 
              className="flex-1 px-3.5 py-2.5 flex flex-col justify-between hover:bg-[var(--color-mine-panel-sub)] transition-colors group cursor-default"
            >
              {/* Metric Label + Icon */}
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-bold tracking-wider text-[var(--color-mine-secondary)] uppercase truncate">
                  {item.label}
                </span>
                <span className="opacity-80 group-hover:opacity-100 transition-opacity">
                  {item.icon}
                </span>
              </div>

              {/* Large Attention-Grabbing Value (Section 4 & 5) */}
              <div className="flex items-baseline gap-1 my-0.5">
                <span className={`text-2xl lg:text-[26px] font-bold tech-mono tracking-tight ${
                  isCritical 
                    ? 'text-[var(--color-mine-danger)]' 
                    : isWarning 
                    ? 'text-[var(--color-mine-warning)]' 
                    : isOffline
                    ? 'text-gray-400'
                    : 'text-[var(--color-mine-dark)]'
                }`}>
                  {item.value}
                </span>
                {item.unit && (
                  <span className="text-sm font-bold text-[var(--color-mine-secondary)] tech-mono">
                    {item.unit}
                  </span>
                )}
              </div>

              {/* Status Indicator + Short Human Explanation */}
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  isCritical 
                    ? 'bg-[var(--color-mine-danger)] animate-ping' 
                    : isWarning 
                    ? 'bg-[var(--color-mine-warning)]' 
                    : isOffline
                    ? 'bg-gray-400'
                    : 'bg-[var(--color-mine-accent)]'
                }`} />
                <span className={`text-[11px] leading-tight truncate font-medium ${
                  isCritical 
                    ? 'text-[var(--color-mine-danger)] font-bold' 
                    : isWarning 
                    ? 'text-[var(--color-mine-warning)] font-bold' 
                    : isOffline
                    ? 'text-gray-400 italic'
                    : 'text-[var(--color-mine-secondary)]'
                }`}>
                  {item.explanation}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
