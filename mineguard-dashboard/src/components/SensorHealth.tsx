import type { TelemetryData } from '../utils/types';
import { Server, Camera, Thermometer, Gauge, Zap, Scale, Disc, Radio } from 'lucide-react';

interface SensorHealthProps {
  telemetry: TelemetryData;
  connectionStatus: 'CONNECTED' | 'OFFLINE' | 'STALE';
  isMonitoring: boolean;
}

export default function SensorHealth({
  telemetry,
  connectionStatus
}: SensorHealthProps) {
  const isConnected = connectionStatus === 'CONNECTED';
  const isFault = telemetry.status === 'SENSOR FAULT' || connectionStatus === 'OFFLINE';

  const systemServices = [
    { name: 'Telemetry', state: isConnected ? 'LIVE' : 'OFFLINE', color: isConnected ? 'text-[#087F5B]' : 'text-[#DC2626]', dot: isConnected ? 'bg-[#087F5B]' : 'bg-[#DC2626]' },
    { name: 'Database', state: isConnected ? 'CONNECTED' : 'OFFLINE', color: isConnected ? 'text-[#087F5B]' : 'text-[#DC2626]', dot: isConnected ? 'bg-[#087F5B]' : 'bg-[#DC2626]' },
    { name: 'AI Vision', state: 'READY', color: 'text-[#087F5B]', dot: 'bg-[#087F5B]' },
    { name: 'Camera', state: 'READY', color: 'text-[#087F5B]', dot: 'bg-[#087F5B]' },
    { name: 'ESP32 / MCU', state: isConnected ? 'ONLINE' : 'OFFLINE', color: isConnected ? 'text-[#087F5B]' : 'text-[#DC2626]', dot: isConnected ? 'bg-[#087F5B]' : 'bg-[#DC2626]' },
    { name: 'Wi-Fi / Bus', state: isConnected ? 'CONNECTED' : 'OFFLINE', color: isConnected ? 'text-[#087F5B]' : 'text-[#DC2626]', dot: isConnected ? 'bg-[#087F5B]' : 'bg-[#DC2626]' }
  ];

  const sensors = [
    {
      name: 'Temperature Sensor',
      state: (telemetry.temperature === null || isFault) ? 'SENSOR OFFLINE' : telemetry.temperature > 50 ? 'FAULT' : 'LIVE',
      measurement: (telemetry.temperature === null || isFault) ? 'N/A' : `${telemetry.temperature.toFixed(1)} °C`,
      color: (telemetry.temperature === null || isFault) ? 'text-[#DC2626]' : telemetry.temperature > 50 ? 'text-[#D97706]' : 'text-[#087F5B]',
      dot: (telemetry.temperature === null || isFault) ? 'bg-[#DC2626]' : telemetry.temperature > 50 ? 'bg-[#D97706]' : 'bg-[#087F5B]',
      icon: <Thermometer size={13} className="text-[#D97706]" />
    },
    {
      name: 'Vibration Sensor',
      state: (telemetry.vibration === null || isFault) ? 'SENSOR OFFLINE' : telemetry.vibration > 4.0 ? 'FAULT' : 'LIVE',
      measurement: (telemetry.vibration === null || isFault) ? 'N/A' : `${telemetry.vibration.toFixed(2)} mm/s`,
      color: (telemetry.vibration === null || isFault) ? 'text-[#DC2626]' : telemetry.vibration > 4.0 ? 'text-[#D97706]' : 'text-[#087F5B]',
      dot: (telemetry.vibration === null || isFault) ? 'bg-[#DC2626]' : telemetry.vibration > 4.0 ? 'bg-[#D97706]' : 'bg-[#087F5B]',
      icon: <Gauge size={13} className="text-[#087F5B]" />
    },
    {
      name: 'Current Sensor',
      state: (telemetry.motor_current === null || isFault) ? 'SENSOR OFFLINE' : telemetry.motor_current > 3.5 ? 'FAULT' : 'LIVE',
      measurement: (telemetry.motor_current === null || isFault) ? 'N/A' : `${telemetry.motor_current.toFixed(2)} A`,
      color: (telemetry.motor_current === null || isFault) ? 'text-[#DC2626]' : telemetry.motor_current > 3.5 ? 'text-[#D97706]' : 'text-[#087F5B]',
      dot: (telemetry.motor_current === null || isFault) ? 'bg-[#DC2626]' : telemetry.motor_current > 3.5 ? 'bg-[#D97706]' : 'bg-[#087F5B]',
      icon: <Zap size={13} className="text-[#2563EB]" />
    },
    {
      name: 'Load Sensor',
      state: (telemetry.load === null || isFault) ? 'SENSOR OFFLINE' : telemetry.load > 85 ? 'FAULT' : 'LIVE',
      measurement: (telemetry.load === null || isFault) ? 'N/A' : `${Math.round(telemetry.load)} %`,
      color: (telemetry.load === null || isFault) ? 'text-[#DC2626]' : telemetry.load > 85 ? 'text-[#D97706]' : 'text-[#087F5B]',
      dot: (telemetry.load === null || isFault) ? 'bg-[#DC2626]' : telemetry.load > 85 ? 'bg-[#D97706]' : 'bg-[#087F5B]',
      icon: <Scale size={13} className="text-[#7C3AED]" />
    },
    {
      name: 'Encoder 1 (Head)',
      state: (telemetry.rpm1 === null && telemetry.rpm === null) ? 'SENSOR OFFLINE' : 'LIVE',
      measurement: (telemetry.rpm1 === null && telemetry.rpm === null) ? 'N/A' : `${telemetry.rpm1 ?? telemetry.rpm ?? 142} RPM`,
      color: (telemetry.rpm1 === null && telemetry.rpm === null) ? 'text-[#DC2626]' : 'text-[#087F5B]',
      dot: (telemetry.rpm1 === null && telemetry.rpm === null) ? 'bg-[#DC2626]' : 'bg-[#087F5B]',
      icon: <Disc size={13} className="text-[#087F5B]" />
    },
    {
      name: 'Encoder 2 (Tail)',
      state: (telemetry.rpm2 === null && telemetry.rpm === null) ? 'SENSOR OFFLINE' : 'LIVE',
      measurement: (telemetry.rpm2 === null && telemetry.rpm === null) ? 'N/A' : `${telemetry.rpm2 ?? telemetry.rpm ?? 141} RPM`,
      color: (telemetry.rpm2 === null && telemetry.rpm === null) ? 'text-[#DC2626]' : 'text-[#087F5B]',
      dot: (telemetry.rpm2 === null && telemetry.rpm === null) ? 'bg-[#DC2626]' : 'bg-[#087F5B]',
      icon: <Disc size={13} className="text-[#087F5B]" />
    },
    {
      name: 'Ultrasonic Distance',
      state: (telemetry.belt_thickness === null || telemetry.belt_thickness <= 0) ? 'SENSOR OFFLINE' : 'LIVE',
      measurement: (telemetry.belt_thickness === null || telemetry.belt_thickness <= 0) ? 'N/A' : `${telemetry.belt_thickness.toFixed(1)} mm`,
      color: (telemetry.belt_thickness === null || telemetry.belt_thickness <= 0) ? 'text-[#D97706]' : 'text-[#087F5B]',
      dot: (telemetry.belt_thickness === null || telemetry.belt_thickness <= 0) ? 'bg-[#D97706]' : 'bg-[#087F5B]',
      icon: <Radio size={13} className="text-[#087F5B]" />
    },
    {
      name: 'Camera Vision',
      state: 'READY',
      measurement: 'YOLO11s',
      color: 'text-[#087F5B]',
      dot: 'bg-[#087F5B]',
      icon: <Camera size={13} className="text-[#087F5B]" />
    }
  ];

  return (
    <div className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-4 shadow-xs space-y-3">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <Server size={16} className="text-[#087F5B]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-[#111827] tech-mono">
            SYSTEM & SENSOR HEALTH
          </h3>
        </div>
        <span className="text-[10px] text-[#6B7280] tech-mono">
          Edge Hardware Matrix
        </span>
      </div>

      {/* Top 6 System Services */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pb-2 border-b border-[#F3F4F6]">
        {systemServices.map((svc, idx) => (
          <div key={idx} className="p-1.5 rounded bg-[#F9FAFB] border border-[#E5E7EB] text-center">
            <span className="text-[8px] font-bold uppercase text-[#6B7280] tech-mono block truncate">{svc.name}</span>
            <span className={`text-[10px] font-black tech-mono ${svc.color}`}>{svc.state}</span>
          </div>
        ))}
      </div>

      {/* 8 Field Hardware Sensors */}
      <div className="grid grid-cols-2 gap-2">
        {sensors.map((s, idx) => (
          <div 
            key={idx}
            className="p-2 rounded-md bg-[#F9FAFB] border border-[#E5E7EB] hover:border-[#087F5B] transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {s.icon}
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-[#111827] tech-mono truncate block">
                  {s.name}
                </span>
                <span className="text-[9px] text-[#6B7280] tech-mono">
                  {s.measurement}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-1">
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              <span className={`text-[9px] font-bold tech-mono ${s.color}`}>
                {s.state}
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
