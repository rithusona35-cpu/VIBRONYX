import type { TelemetryData } from '../utils/types';
import { Server, Activity, Database, Eye, Camera, Thermometer, Gauge, Zap, Scale, Disc3, Layers } from 'lucide-react';

interface SystemHealthCompactProps {
  telemetry: TelemetryData;
  connectionStatus: 'CONNECTED' | 'OFFLINE' | 'STALE';
  isMonitoring: boolean;
}

export default function SystemHealthCompact({
  telemetry,
  connectionStatus,
  isMonitoring
}: SystemHealthCompactProps) {
  const isConnected = connectionStatus === 'CONNECTED';
  const isStale = connectionStatus === 'STALE';

  // Subsystem health determination without repeating raw measurement values (Section 22)
  const getSubsystems = () => {
    return [
      {
        name: 'Telemetry Ingestion',
        icon: <Activity size={13} className="text-[var(--color-mine-accent)]" />,
        state: isConnected ? 'Healthy' : isStale ? 'Warning' : 'Offline'
      },
      {
        name: 'Database Storage',
        icon: <Database size={13} className="text-[#397A9F]" />,
        state: isConnected ? 'Healthy' : 'Offline'
      },
      {
        name: 'AI Vision Pipeline',
        icon: <Eye size={13} className="text-[var(--color-mine-accent-dark)]" />,
        state: 'Healthy'
      },
      {
        name: 'Inspection Camera',
        icon: <Camera size={13} className="text-[var(--color-mine-secondary)]" />,
        state: isMonitoring ? 'Healthy' : 'Warning'
      },
      {
        name: 'Temperature Sensor',
        icon: <Thermometer size={13} className="text-[var(--color-mine-amber)]" />,
        state: telemetry.temperature === null ? 'Offline' : telemetry.temperature > 65 ? 'Warning' : 'Healthy'
      },
      {
        name: 'Vibration Sensor',
        icon: <Gauge size={13} className="text-[var(--color-mine-accent)]" />,
        state: telemetry.vibration === null ? 'Offline' : (telemetry.vibration > 140 || (telemetry.vibration > 7.0 && telemetry.vibration < 50)) ? 'Warning' : 'Healthy'
      },
      {
        name: 'Load Cell Sensor',
        icon: <Scale size={13} className="text-[#397A9F]" />,
        state: telemetry.load === null ? 'Offline' : telemetry.load < -5 ? 'Warning' : 'Healthy'
      },
      {
        name: 'Motor Current Sensor',
        icon: <Zap size={13} className="text-[var(--color-mine-accent)]" />,
        state: telemetry.motor_current === null ? 'Offline' : telemetry.motor_current > 4.5 ? 'Warning' : 'Healthy'
      },
      {
        name: 'Encoder System',
        icon: <Disc3 size={13} className="text-[var(--color-mine-secondary)]" />,
        state: (telemetry.rpm1 === null || telemetry.rpm2 === null) ? 'Offline' : (telemetry.belt_slip ?? 0) > 10 ? 'Warning' : 'Healthy'
      },
      {
        name: 'Thickness Sonar',
        icon: <Layers size={13} className="text-[var(--color-mine-secondary)]" />,
        state: (telemetry.belt_thickness === null || telemetry.belt_thickness <= 0) ? 'Warning' : 'Healthy'
      },
      {
        name: 'YOLO11s Model',
        icon: <Server size={13} className="text-[var(--color-mine-accent)]" />,
        state: 'Healthy'
      }
    ];
  };

  const subsystems = getSubsystems();
  const healthyCount = subsystems.filter(s => s.state === 'Healthy').length;
  const warningCount = subsystems.filter(s => s.state === 'Warning').length;
  const offlineCount = subsystems.filter(s => s.state === 'Offline').length;

  return (
    <div className="bg-[#FFFFFF] border border-[var(--color-mine-border)] rounded-lg p-4 shadow-2xs flex flex-col justify-between h-full">
      
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-2.5 border-b border-[var(--color-mine-border)] mb-3">
          <div className="flex items-center gap-2">
            <Server size={16} className="text-[var(--color-mine-accent)]" />
            <h2 className="text-xs font-extrabold uppercase tracking-wide text-[var(--color-mine-dark)]">
              SYSTEM HEALTH
            </h2>
          </div>
          <span className="tech-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#E2ECE7] text-[var(--color-mine-accent)] border border-[#C2D8CD]">
            {healthyCount} / {subsystems.length} NOMINAL
          </span>
        </div>

        {/* Prototype Condition Index (Section 30) */}
        <div className="flex items-center justify-between p-2.5 rounded bg-[var(--color-mine-panel-sub)] border border-[var(--color-mine-border)] mb-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-mine-secondary)] block">
              PROTOTYPE CONDITION INDEX
            </span>
            <span className="text-[11px] text-[var(--color-mine-secondary)]">
              Composite hardware & vision score
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-bold tech-mono text-[var(--color-mine-dark)]">
              {telemetry.healthScore}
            </span>
            <span className="text-xs font-bold tech-mono text-[var(--color-mine-secondary)]">/ 100</span>
          </div>
        </div>

        {/* 11 Subsystem Grid (Section 22: only healthy/offline/warning, no repeating sensor numbers) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-1.5">
          {subsystems.map((sub, idx) => {
            const isH = sub.state === 'Healthy';
            const isW = sub.state === 'Warning';

            return (
              <div
                key={idx}
                className="p-1.5 px-2 rounded bg-white border border-[var(--color-mine-border)] flex items-center justify-between gap-2 text-xs hover:bg-[var(--color-mine-panel-sub)] transition-colors"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="shrink-0">{sub.icon}</span>
                  <span className="font-semibold text-[11px] text-[var(--color-mine-dark)] truncate">
                    {sub.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isH ? 'bg-[var(--color-mine-accent)]' : isW ? 'bg-[var(--color-mine-warning)]' : 'bg-gray-400'
                  }`} />
                  <span className={`text-[10px] font-bold tech-mono ${
                    isH ? 'text-[var(--color-mine-accent)]' : isW ? 'text-[var(--color-mine-warning)]' : 'text-gray-500'
                  }`}>
                    {sub.state}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Summary */}
      <div className="mt-3 pt-2 border-t border-[var(--color-mine-border)] flex items-center justify-between text-[10px] tech-mono text-[var(--color-mine-secondary)]">
        <span>Healthy: <strong className="text-[var(--color-mine-accent)]">{healthyCount}</strong></span>
        <span>Warning: <strong className="text-[var(--color-mine-warning)]">{warningCount}</strong></span>
        <span>Offline: <strong className="text-gray-500">{offlineCount}</strong></span>
      </div>

    </div>
  );
}
