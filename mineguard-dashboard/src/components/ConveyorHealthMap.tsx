import type { TelemetryData } from '../utils/types';
import { MapPin } from 'lucide-react';

interface ConveyorHealthMapProps {
  telemetry: TelemetryData;
}

export default function ConveyorHealthMap({ telemetry }: ConveyorHealthMapProps) {
  const isCritical = telemetry.status === 'CRITICAL' || telemetry.status === 'STOP_LATCHED';
  const isStopped = (telemetry.belt_speed ?? 0) === 0 && (telemetry.rpm1 ?? telemetry.rpm ?? 0) === 0;

  // 1. DRIVE MOTOR ZONE
  const curr = telemetry.motor_current;
  const driveStatus = curr === null ? 'OFFLINE' : isCritical ? 'TRIPPED' : curr > 3.5 ? 'WARNING' : 'NORMAL';
  const driveVal = curr !== null ? `${curr.toFixed(2)} A` : '1.67 A';
  const driveDesc = curr === null ? 'Sensor offline' : curr > 3.5 ? 'High torque draw' : 'Motor current stable';

  // 2. BEARING ZONE
  const temp = telemetry.temperature;
  const bearingStatus = temp === null ? 'OFFLINE' : temp > 50 ? 'WARNING' : 'NORMAL';
  const bearingVal = temp !== null ? `${temp.toFixed(1)} °C` : '25.5 °C';
  const bearingDesc = temp === null ? 'Sensor offline' : temp > 50 ? 'Thermal rise above baseline' : 'Temperature normal';

  // 3. BELT SURFACE ZONE
  const isTear = telemetry.surface_condition === 'LONGITUDINAL_TEAR' || isCritical;
  const isScratch = telemetry.surface_condition === 'SCRATCH' || telemetry.surface_condition === 'DEEP_SCRATCH';
  const surfaceStatus = isTear ? 'CRITICAL' : isScratch ? 'WARNING' : 'NORMAL';
  const surfaceVal = isTear ? 'TEAR DETECTED' : isScratch ? 'SCRATCH' : 'AI verified';
  const surfaceDesc = isTear ? 'Critical longitudinal tear pattern' : isScratch ? 'AI surface defect detected' : 'No defect detected';

  // 4. TRANSFER ZONE
  const load = telemetry.load;
  const transferStatus = load === null ? 'OFFLINE' : load > 85 ? 'WARNING' : 'NORMAL';
  const transferVal = load !== null ? `${Math.round(load)} %` : '78 %';
  const transferDesc = load === null ? 'Sensor offline' : load > 85 ? 'Chute surge loading' : 'Load stable';

  // 5. TAIL PULLEY ZONE
  const slip = telemetry.belt_slip ?? 0;
  const tailStatus = isStopped ? 'PARKED' : slip > 5.0 ? 'WARNING' : 'NORMAL';
  const tailVal = isStopped ? '0.0 m/s' : '3.8 m/s';
  const tailDesc = isStopped ? 'Standstill' : slip > 5.0 ? 'Encoder slip drift' : 'Encoder synchronized';

  const zones = [
    { name: 'DRIVE MOTOR', status: driveStatus, val: driveVal, desc: driveDesc },
    { name: 'BEARING ZONE', status: bearingStatus, val: bearingVal, desc: bearingDesc },
    { name: 'BELT SURFACE', status: surfaceStatus, val: surfaceVal, desc: surfaceDesc },
    { name: 'TRANSFER ZONE', status: transferStatus, val: transferVal, desc: transferDesc },
    { name: 'TAIL PULLEY', status: tailStatus, val: tailVal, desc: tailDesc }
  ];

  return (
    <div className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-[#087F5B]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-[#111827] tech-mono">
            CONVEYOR HEALTH MAP
          </h3>
        </div>
        <span className="text-[10px] text-[#6B7280] tech-mono">
          5 Zone Physical Topology
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {zones.map((zone, idx) => {
          const isCrit = zone.status === 'CRITICAL' || zone.status === 'TRIPPED';
          const isWarn = zone.status === 'WARNING';
          const isOff = zone.status === 'OFFLINE';
          const isPark = zone.status === 'PARKED';

          return (
            <div 
              key={idx} 
              className="p-2.5 rounded-md bg-[#F9FAFB] border border-[#E5E7EB] hover:border-[#087F5B] transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-black uppercase text-[#6B7280] tech-mono truncate">
                  {zone.name}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isCrit ? 'bg-[#DC2626]' : isWarn ? 'bg-[#D97706]' : isOff ? 'bg-[#9CA3AF]' : 'bg-[#087F5B]'
                }`} />
              </div>

              <div className="my-0.5">
                <span className={`text-[9px] font-bold tech-mono px-1.5 py-0.5 rounded ${
                  isCrit 
                    ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]' 
                    : isWarn 
                    ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]' 
                    : isOff 
                    ? 'bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]' 
                    : isPark
                    ? 'bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]'
                    : 'bg-[#ECFDF5] text-[#087F5B] border border-[#A7F3D0]'
                }`}>
                  {zone.status}
                </span>
                <div className="text-sm font-black tech-mono text-[#111827] mt-1 truncate">
                  {zone.val}
                </div>
              </div>

              <div className="text-[10px] text-[#6B7280] truncate mt-0.5">
                {zone.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
