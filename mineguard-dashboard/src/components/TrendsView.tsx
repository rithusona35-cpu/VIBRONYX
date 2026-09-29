import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import type { TelemetryData } from '../utils/types';
import { Flame, Gauge, Zap, Layers, Disc3 } from 'lucide-react';

interface TrendsViewProps {
  history: TelemetryData[];
}

export default function TrendsView({ history }: TrendsViewProps) {
  const [timeFilter, setTimeFilter] = useState<'30M' | '1H' | '6H'>('1H');

  const sampleCount = timeFilter === '30M' ? 25 : timeFilter === '1H' ? 45 : 60;
  const sliced = history.slice(-sampleCount);

  const metrics = [
    { key: 'temperature', label: 'Drive Temperature', unit: '°C', color: '#D59622', limit: 45.0, icon: Flame },
    { key: 'vibration', label: 'Bearing Vibration', unit: 'mm/s', color: '#147A55', limit: 4.5, icon: Gauge },
    { key: 'motor_current', label: 'Motor Current', unit: 'A', color: '#0B5A40', limit: 2.4, icon: Zap },
    { key: 'load', label: 'Conveyor Load', unit: '%', color: '#17221D', limit: 90.0, icon: Layers },
    { key: 'belt_speed', label: 'Belt Speed', unit: 'm/s', color: '#397A9F', limit: 4.5, icon: Disc3 },
    { key: 'belt_thickness', label: 'Belt Thickness', unit: 'mm', color: '#147A55', limit: 10.0, icon: Layers }
  ];

  return (
    <div className="space-y-4">
      
      {/* Top Header with Time Filter */}
      <div className="bg-white p-4 rounded-lg border border-[var(--color-mine-border)] shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-[var(--color-mine-dark)]">
            HISTORICAL TELEMETRY TREND ANALYTICS
          </h2>
          <p className="text-xs text-[var(--color-mine-secondary)] font-medium mt-0.5">
            Continuous operating trends evaluated against dynamic operating baseline
          </p>
        </div>

        {/* Time Filter Buttons */}
        <div className="flex items-center gap-1 bg-[var(--color-mine-panel-sub)] p-1 rounded border border-[var(--color-mine-border)]">
          <span className="text-[10px] uppercase font-bold text-[var(--color-mine-secondary)] px-2">TIME WINDOW:</span>
          {(['30M', '1H', '6H'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeFilter(tf)}
              className={`px-3 py-1 text-xs font-bold tech-mono rounded transition-colors ${
                timeFilter === tf
                  ? 'bg-white text-[var(--color-mine-dark)] shadow-2xs border border-[var(--color-mine-border-strong)]'
                  : 'text-[var(--color-mine-secondary)] hover:text-[var(--color-mine-dark)]'
              }`}
            >
              {tf === '30M' ? '30 MINUTES' : tf === '1H' ? '1 HOUR' : '6 HOURS'}
            </button>
          ))}
        </div>
      </div>

      {/* Waveform Cards or Empty State */}
      {sliced.length === 0 ? (
        <div className="bg-white p-12 rounded-lg border border-[var(--color-mine-border)] shadow-2xs text-center">
          <div className="text-sm font-bold text-[var(--color-mine-dark)] mb-1">
            Waiting for telemetry history...
          </div>
          <p className="text-xs text-[var(--color-mine-secondary)]">
            Awaiting incoming telemetry packets from Supabase table <code className="tech-mono font-bold">conveyor_telemetry</code>. Historical trends will generate automatically as live telemetry arrives.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map(metric => {
          const vals = sliced.map(d => Number(d[metric.key as keyof TelemetryData]) || 0);
          const current = vals.length > 0 ? vals[vals.length - 1] : 0;
          const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
          const min = vals.length > 0 ? Math.min(...vals) : 0;
          const max = vals.length > 0 ? Math.max(...vals) : 0;

          const chartData = sliced.map((pt, i) => ({
            index: i,
            val: Number(pt[metric.key as keyof TelemetryData]) || 0,
            time: new Date(pt.lastUpdate).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })
          }));

          const Icon = metric.icon;

          return (
            <div key={metric.key} className="bg-white p-4 rounded-lg border border-[var(--color-mine-border)] shadow-2xs flex flex-col justify-between">
              
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[var(--color-mine-border)] mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--color-mine-dark)]">
                    <Icon size={14} style={{ color: metric.color }} />
                    <span>{metric.label}</span>
                  </div>
                  <span className="text-xs font-bold tech-mono text-[var(--color-mine-dark)]">
                    {current.toFixed(1)} {metric.unit}
                  </span>
                </div>

                {/* 4 Stats: Current, Average, Min, Max */}
                <div className="grid grid-cols-4 gap-1 p-2 rounded bg-[var(--color-mine-panel-sub)] text-[10px] tech-mono mb-3 text-center border border-[var(--color-mine-border)]">
                  <div>
                    <span className="text-[9px] text-[var(--color-mine-secondary)] block uppercase">CURR</span>
                    <span className="font-bold text-[var(--color-mine-dark)]">{current.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[var(--color-mine-secondary)] block uppercase">AVG</span>
                    <span className="font-bold text-[var(--color-mine-dark)]">{avg.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[var(--color-mine-secondary)] block uppercase">MIN</span>
                    <span className="font-bold text-[var(--color-mine-dark)]">{min.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[var(--color-mine-secondary)] block uppercase">MAX</span>
                    <span className="font-bold text-[var(--color-mine-amber)]">{max.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* Sparkline / Chart */}
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#E1E5DC" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={['dataMin - 0.2', 'dataMax + 0.2']} tick={{ fill: '#5F6C65', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#B8BDB2', fontSize: '10px', fontFamily: 'monospace' }}
                      formatter={(v: any) => [`${Number(v).toFixed(2)} ${metric.unit}`, metric.label]}
                    />
                    <ReferenceLine y={metric.limit} stroke="#E0A52A" strokeDasharray="3 3" />
                    <Area type="monotone" dataKey="val" stroke={metric.color} strokeWidth={2} fill={metric.color} fillOpacity={0.12} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

            </div>
          );
        })}
      </div>
    )}

    </div>
  );
}
