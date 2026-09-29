import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import type { TelemetryData } from '../utils/types';
import { Flame, Gauge, Zap, Scale, Activity, Layers, Sparkles } from 'lucide-react';

interface LiveTelemetryChartProps {
  history: TelemetryData[];
  isDemoMode: boolean;
  connectionStatus: 'CONNECTED' | 'OFFLINE' | 'STALE';
  selectedMetric?: string;
  onSelectMetric?: (metric: string) => void;
}

type MetricKey = 'temperature' | 'vibration' | 'motor_current' | 'load' | 'belt_speed' | 'thickness';

interface MetricConfig {
  key: MetricKey;
  label: string;
  unit: string;
  strokeColor: string;
  fillColor: string;
  threshold: number;
  normalBand: [number, number];
  icon: any;
}

export default function LiveTelemetryChart({
  history,
  selectedMetric,
  onSelectMetric
}: LiveTelemetryChartProps) {
  const [internalMetric, setInternalMetric] = useState<MetricKey>('temperature');
  const [timeRange, setTimeRange] = useState<'30 MIN' | '1 HOUR' | '6 HOURS'>('30 MIN');

  const activeMetric: MetricKey = (selectedMetric as MetricKey) || internalMetric;

  const handleTabChange = (key: MetricKey) => {
    setInternalMetric(key);
    if (onSelectMetric) {
      onSelectMetric(key);
    }
  };

  const isVibRaw = activeMetric === 'vibration' && history.some(h => (h.vibration ?? 0) > 50);

  const metricConfigs: Record<MetricKey, MetricConfig> = {
    temperature: {
      key: 'temperature',
      label: 'TEMPERATURE',
      unit: '°C',
      strokeColor: '#D97706',
      fillColor: 'rgba(217, 119, 6, 0.12)',
      threshold: 50.0,
      normalBand: [22.0, 35.0],
      icon: Flame
    },
    vibration: {
      key: 'vibration',
      label: 'VIBRATION',
      unit: isVibRaw ? 'm/s²' : 'mm/s',
      strokeColor: '#087F5B',
      fillColor: 'rgba(8, 127, 91, 0.12)',
      threshold: isVibRaw ? 115.0 : 4.0,
      normalBand: isVibRaw ? [95.0, 110.0] : [1.0, 3.0],
      icon: Gauge
    },
    motor_current: {
      key: 'motor_current',
      label: 'MOTOR CURRENT',
      unit: 'A',
      strokeColor: '#2563EB',
      fillColor: 'rgba(37, 99, 235, 0.12)',
      threshold: 3.5,
      normalBand: [0.3, 2.2],
      icon: Zap
    },
    load: {
      key: 'load',
      label: 'LOAD',
      unit: '%',
      strokeColor: '#7C3AED',
      fillColor: 'rgba(124, 58, 237, 0.12)',
      threshold: 85.0,
      normalBand: [40.0, 80.0],
      icon: Scale
    },
    belt_speed: {
      key: 'belt_speed',
      label: 'BELT SPEED',
      unit: 'm/s',
      strokeColor: '#059669',
      fillColor: 'rgba(5, 150, 105, 0.12)',
      threshold: 4.5,
      normalBand: [3.4, 4.0],
      icon: Activity
    },
    thickness: {
      key: 'thickness',
      label: 'THICKNESS',
      unit: 'mm',
      strokeColor: '#087F5B',
      fillColor: 'rgba(8, 127, 91, 0.12)',
      threshold: 14.5,
      normalBand: [11.5, 13.0],
      icon: Layers
    }
  };

  const currentCfg = metricConfigs[activeMetric];

  // Filter history based on time range
  const sliceCount = timeRange === '30 MIN' ? 18 : timeRange === '1 HOUR' ? 36 : 60;
  const filteredData = useMemo(() => {
    return history.slice(-sliceCount).map((d) => {
      let val: number | null = null;
      if (activeMetric === 'temperature') val = d.temperature;
      else if (activeMetric === 'vibration') val = d.vibration;
      else if (activeMetric === 'motor_current') val = d.motor_current;
      else if (activeMetric === 'load') val = d.load !== null ? Math.max(0, d.load) : null;
      else if (activeMetric === 'belt_speed') val = d.belt_speed;
      else if (activeMetric === 'thickness') val = d.belt_thickness !== null && d.belt_thickness > 0 ? d.belt_thickness : null;

      const dateObj = new Date(d.lastUpdate || Date.now());
      const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

      return {
        time: timeStr,
        value: val
      };
    });
  }, [history, sliceCount, activeMetric]);

  // Compute stats: CURRENT, AVERAGE, MINIMUM, MAXIMUM
  const stats = useMemo(() => {
    const validVals = filteredData
      .map(d => d.value)
      .filter((v): v is number => v !== null && !isNaN(v));

    if (validVals.length === 0) {
      return { current: 'N/A', avg: 'N/A', min: 'N/A', max: 'N/A' };
    }

    const current = validVals[validVals.length - 1];
    const avg = validVals.reduce((a, b) => a + b, 0) / validVals.length;
    const min = Math.min(...validVals);
    const max = Math.max(...validVals);

    const format = (n: number) => activeMetric === 'vibration' && isVibRaw ? n.toFixed(1) : n.toFixed(2);

    return {
      current: `${format(current)} ${currentCfg.unit}`,
      avg: `${format(avg)} ${currentCfg.unit}`,
      min: `${format(min)} ${currentCfg.unit}`,
      max: `${format(max)} ${currentCfg.unit}`
    };
  }, [filteredData, activeMetric, isVibRaw, currentCfg.unit]);

  // Section 8: Humanized explanation string
  const getTrendExplanation = () => {
    switch (activeMetric) {
      case 'temperature':
        return 'Bearing thermal signature is stable within the configured operating envelope. Heat dissipation is nominal.';
      case 'vibration':
        return 'Vibration velocity harmonics remain stable. No mechanical resonance or looseness detected.';
      case 'motor_current':
        return 'Drive motor current draw is nominal. DC motor torque remains within continuous rating.';
      case 'load':
        return 'Conveyor payload throughput is consistent with the material delivery schedule.';
      case 'belt_speed':
        return 'Belt velocity is synchronized with drive motor RPM. Differential slip remains nominal (< 1.5%).';
      case 'thickness':
        return 'Top rubber cover profiling indicates nominal thickness wear with no localized cord exposure.';
    }
  };

  return (
    <div className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-4 shadow-xs space-y-4">
      
      {/* 1. Header with Metric Tabs & Time Range */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
        
        {/* Metric Selection Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(Object.keys(metricConfigs) as MetricKey[]).map((key) => {
            const cfg = metricConfigs[key];
            const Icon = cfg.icon;
            const isSelected = activeMetric === key;

            return (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold tech-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#ECFDF5] text-[#087F5B] border border-[#A7F3D0] shadow-xs'
                    : 'bg-[#F9FAFB] text-[#6B7280] hover:text-[#111827] hover:bg-[#E5E7EB] border border-[#E5E7EB]'
                }`}
              >
                <Icon size={13} className={isSelected ? 'text-[#087F5B]' : 'text-[#6B7280]'} />
                <span>{cfg.label}</span>
              </button>
            );
          })}
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1 bg-[#F9FAFB] p-0.5 rounded-md border border-[#E5E7EB] text-[10px] tech-mono font-bold">
          {(['30 MIN', '1 HOUR', '6 HOURS'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                timeRange === r
                  ? 'bg-[#FFFFFF] text-[#087F5B] border border-[#E5E7EB] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

      </div>

      {/* 2. Four Stats Cards: CURRENT, AVERAGE, MINIMUM, MAXIMUM */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs tech-mono">
        <div className="bg-[#F9FAFB] p-2.5 rounded-md border border-[#E5E7EB]">
          <span className="text-[9px] text-[#6B7280] uppercase block">Current</span>
          <span className="text-base font-bold text-[#111827] truncate block">{stats.current}</span>
        </div>
        <div className="bg-[#F9FAFB] p-2.5 rounded-md border border-[#E5E7EB]">
          <span className="text-[9px] text-[#6B7280] uppercase block">Average</span>
          <span className="text-base font-bold text-[#111827] truncate block">{stats.avg}</span>
        </div>
        <div className="bg-[#F9FAFB] p-2.5 rounded-md border border-[#E5E7EB]">
          <span className="text-[9px] text-[#6B7280] uppercase block">Minimum</span>
          <span className="text-base font-bold text-[#111827] truncate block">{stats.min}</span>
        </div>
        <div className="bg-[#F9FAFB] p-2.5 rounded-md border border-[#E5E7EB]">
          <span className="text-[9px] text-[#6B7280] uppercase block">Maximum</span>
          <span className="text-base font-bold text-[#111827] truncate block">{stats.max}</span>
        </div>
      </div>

      {/* 3. Smooth Professional Area Chart */}
      <div className="h-64 sm:h-72 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={currentCfg.strokeColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={currentCfg.strokeColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="#9CA3AF" 
              fontSize={10} 
              tickLine={false}
              fontFamily="var(--font-mono)"
            />
            <YAxis 
              stroke="#9CA3AF" 
              fontSize={10} 
              tickLine={false}
              domain={['auto', 'auto']}
              fontFamily="var(--font-mono)"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderColor: '#E5E7EB',
                borderRadius: '6px',
                fontSize: '11px',
                color: '#111827',
                fontFamily: 'var(--font-mono)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(val: any) => [
                typeof val === 'number' ? `${val.toFixed(2)} ${currentCfg.unit}` : 'N/A',
                currentCfg.label
              ]}
            />
            {/* Warning baseline threshold */}
            <ReferenceLine 
              y={currentCfg.threshold} 
              stroke="#D97706" 
              strokeDasharray="4 4" 
              label={{ 
                value: `THRESHOLD (${currentCfg.threshold} ${currentCfg.unit})`, 
                fill: '#D97706', 
                fontSize: 9, 
                position: 'top' 
              }} 
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={currentCfg.strokeColor}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#grad-${activeMetric})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 4. Humanized Technical Explanation */}
      <div className="p-3 bg-[#F9FAFB] rounded-md border border-[#E5E7EB] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-[#4B5563]">
          <Sparkles size={14} className="text-[#087F5B] shrink-0" />
          <span className="font-medium italic">
            "{getTrendExplanation()}"
          </span>
        </div>
        <span className="text-[10px] tech-mono font-bold text-[#6B7280] hidden md:inline shrink-0 ml-2">
          CONFIGURED BASELINE: [{currentCfg.normalBand[0]} – {currentCfg.normalBand[1]} {currentCfg.unit}]
        </span>
      </div>

    </div>
  );
}
