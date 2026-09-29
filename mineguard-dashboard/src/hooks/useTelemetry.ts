import { useState, useEffect, useRef } from 'react';
import type { TelemetryData, AppEvent, AppAlarm, SimulationScenario, HealthBreakdown, MachineStatus } from '../utils/types';
import { supabase } from '../services/supabase';

const DEFAULT_HEALTH: HealthBreakdown = {
  temperature: 98,
  vibration: 94,
  motor: 91,
  belt: 96,
  aiInspection: 93
};

export const BASE_TELEMETRY: TelemetryData = {
  temperature: null,
  vibration: null,
  motor_current: null,
  load: null,
  belt_speed: 0.0,
  belt_thickness: null,
  belt_slip: 0.0,
  distance1: null,
  distance2: null,
  rpm1: null,
  rpm2: null,
  belt_alignment: 'CENTERED',
  rpm: 0,
  status: 'OFFLINE',
  lastUpdate: Date.now(),
  healthScore: 100,
  healthBreakdown: DEFAULT_HEALTH,
  humanStory: 'Connecting to Supabase conveyor_telemetry live stream...',
  operatorConfidence: 'HIGH',
  operatorConfidenceReason: 'Awaiting edge telemetry stream from ESP32 controller.',
  dataQuality: 'GOOD',
  maintenanceInsight: 'Awaiting live sensor packet ingest.'
};

export function useTelemetry() {
  const [isDemoMode, setDemoMode] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [scenario, setScenario] = useState<SimulationScenario>('NORMAL');
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'OFFLINE' | 'STALE'>('CONNECTED');
  const [telemetry, setTelemetry] = useState<TelemetryData>(BASE_TELEMETRY);
  const [history, setHistory] = useState<TelemetryData[]>([]);

  // Alarms per ISA-18
  const [alarms, setAlarms] = useState<AppAlarm[]>([
    {
      id: 'alm-init',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      source: 'System Monitor',
      condition: 'MineGuard Supervisory Service Initialized',
      currentValue: 'Production Ready',
      threshold: 'Normal Limits',
      category: 'NORMAL',
      action: 'Monitoring active',
      acknowledged: true
    }
  ]);

  const [events, setEvents] = useState<AppEvent[]>([
    {
      id: 'e-init',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      message: 'MineGuard AI supervisory interface started.',
      category: 'SYSTEM',
      status: 'INFO'
    }
  ]);

  const lastTelemetryTimeRef = useRef<number>(0);

  const addEvent = (
    message: string,
    category: AppEvent['category'] = 'TELEMETRY',
    status: AppEvent['status'] = 'NORMAL'
  ) => {
    const newEvt: AppEvent = {
      id: 'evt-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      message,
      category,
      status
    };
    setEvents(prev => [newEvt, ...prev].slice(0, 30));
  };

  const acknowledgeAlarm = (alarmId: string) => {
    setAlarms(prev => prev.map(a => a.id === alarmId ? { ...a, acknowledged: true } : a));
    addEvent(`Operator acknowledged alarm #${alarmId.slice(-4)}`, 'OPERATOR', 'INFO');
  };

  // Helper to parse database records
  const parseTelemetryRow = (data: any, _prev: TelemetryData): TelemetryData => {
    const parseNumber = (val: any): number | null => {
      if (val === null || val === undefined || val === '') return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    };

    // Ultrasonic returns -1 on echo timeout
    const parseDistance = (val: any): number | null => {
      const num = parseNumber(val);
      if (num === null || num <= 0) return null;
      return num;
    };

    const temp = parseNumber(data.temperature ?? data.avg_temperature);
    const vib = parseNumber(data.vibration ?? data.vibration_velocity);
    const curr = parseNumber(data.motor_current);
    const rawLoad = parseNumber(data.load ?? data.belt_load_kg);
    const rpm1Val = parseNumber(data.rpm1);
    const rpm2Val = parseNumber(data.rpm2);
    const slipVal = parseNumber(data.belt_slip) ?? 0.0;
    const d1 = parseDistance(data.distance1);
    const d2 = parseDistance(data.distance2);
    const thick = parseDistance(data.belt_thickness);

    const rpmPrimary = rpm1Val ?? rpm2Val ?? parseNumber(data.rpm) ?? 0;
    const speed = parseNumber(data.belt_speed) ?? Number((rpmPrimary * 0.0025).toFixed(1));

    // Determine status from row or sensor thresholds
    let rawStatus = (data.status || data.conveyor_status || '').toUpperCase().trim();
    let status: MachineStatus = 'NORMAL';

    if (rawStatus === 'STOP_LATCHED' || rawStatus.includes('LATCH')) {
      status = 'STOP_LATCHED';
    } else if (rawStatus === 'CRITICAL' || rawStatus.includes('CRIT') || rawStatus.includes('EMERGENCY')) {
      status = 'CRITICAL';
    } else if (rawStatus === 'SENSOR FAULT' || rawStatus === 'SENSOR_FAULT' || rawStatus.includes('FAULT')) {
      status = 'SENSOR FAULT';
    } else if (rawStatus === 'WARNING' || rawStatus.includes('WARN')) {
      status = 'WARNING';
    } else if (rawStatus === 'OFFLINE') {
      status = 'OFFLINE';
    } else if (rawStatus === 'PAUSED' || rawStatus === 'STOPPED') {
      status = 'PAUSED';
    } else {
      // Evaluate physical sensor limits
      if (temp !== null && temp >= 65.0) status = 'CRITICAL';
      else if (vib !== null && (vib >= 140.0 || (vib > 0 && vib < 20 && vib >= 7.0))) status = 'CRITICAL';
      else if (curr !== null && curr >= 8.0) status = 'CRITICAL';
      else if (temp !== null && temp >= 50.0) status = 'WARNING';
      else if (vib !== null && (vib >= 115.0 || (vib > 0 && vib < 20 && vib >= 4.5))) status = 'WARNING';
      else if (curr !== null && curr >= 4.0) status = 'WARNING';
      else if (slipVal >= 5.0) status = 'WARNING';
      else status = 'NORMAL';
    }

    // Health Score calculation
    let health = 98;
    if (status === 'STOP_LATCHED' || status === 'CRITICAL') health = 42;
    else if (status === 'WARNING') health = 76;
    else if (status === 'SENSOR FAULT') health = 80;
    else if (temp !== null && temp > 40) health -= 8;

    let story = 'Conveyor C-01 telemetry live from physical ESP32 edge sensors.';
    let insight = 'Physical parameters operating within monitored safety boundaries.';

    if (status === 'STOP_LATCHED') {
      story = 'CONVEYOR STOP LATCHED. Safety interlock triggered. Manual operator inspection required.';
      insight = 'Safety gate engaged. Verify conveyor clear before issuing operator reset.';
    } else if (status === 'CRITICAL') {
      story = 'CRITICAL alert on conveyor sensors. Immediate mechanical attention required.';
      insight = 'Vibration or thermal excursion detected. Inspect drive unit.';
    } else if (status === 'WARNING') {
      story = 'Conveyor operating under warning condition. Parameter exceeded baseline.';
      insight = 'Elevated operating telemetry. Monitor trend closely.';
    } else if (status === 'SENSOR FAULT') {
      story = 'Sensor diagnostic report: one or more telemetry channels returned fault or timeout.';
      insight = 'Inspect sensor wire harness and ultrasonic transducers.';
    }

    const tScore = temp !== null ? Math.max(30, Math.min(100, Math.round(100 - (temp - 25) * 1.5))) : 95;
    const vScore = vib !== null ? Math.max(30, Math.min(100, Math.round(100 - (vib > 50 ? (vib - 100) : vib) * 2))) : 95;
    const mScore = curr !== null ? Math.max(30, Math.min(100, Math.round(100 - curr * 8))) : 95;

    return {
      temperature: temp,
      vibration: vib,
      motor_current: curr,
      load: rawLoad,
      belt_speed: speed,
      belt_slip: slipVal,
      belt_thickness: thick,
      device_id: data.device_id || 'critical_zone',
      distance1: d1,
      distance2: d2,
      rpm1: rpm1Val,
      rpm2: rpm2Val,
      rpm: rpmPrimary,
      belt_alignment: data.belt_alignment === 'MISALIGNED' ? 'MISALIGNED' : 'CENTERED',
      status,
      lastUpdate: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
      healthScore: health,
      healthBreakdown: {
        temperature: tScore,
        vibration: vScore,
        motor: mScore,
        belt: 95,
        aiInspection: 95
      },
      humanStory: story,
      operatorConfidence: 'HIGH',
      operatorConfidenceReason: 'Direct Supabase conveyor_telemetry synchronization active.',
      dataQuality: 'GOOD',
      maintenanceInsight: insight
    };
  };

  useEffect(() => {
    let pollTimer: any = null;
    let channel: any = null;

    if (!isMonitoring) {
      setTelemetry(prev => ({ ...prev, status: 'PAUSED' }));
      return;
    }

    if (isDemoMode) {
      setConnectionStatus('CONNECTED');
      pollTimer = setInterval(() => {
        setTelemetry(prev => {
          let targetTemp: number | null = 25.5;
          let targetVib: number | null = 2.30;
          let targetCurr: number | null = 1.67;
          let targetLoad: number | null = 78;
          let targetSpeed: number | null = 3.8;
          let targetSlip: number | null = 0.6;
          let targetThick: number | null = 12.4;
          let targetRpm1: number | null = 142;
          let targetRpm2: number | null = 141;
          let status: MachineStatus = 'RUNNING';
          let surface_condition: 'NORMAL' | 'SCRATCH' | 'DEEP_SCRATCH' | 'LONGITUDINAL_TEAR' | 'BELT_SPLICE' = 'NORMAL';
          let story = 'Conveyor C-01 is operating normally. All monitored parameters remain within the configured baseline. AI surface inspection is ready.';
          let insight = 'Current telemetry shows stable operation. Continue monitoring.';
          let healthScore = 96;

          if (scenario === 'LOAD_INC') {
            targetLoad = 94;
            targetCurr = 2.35;
            targetSpeed = 3.7;
            targetTemp = 27.2;
            targetVib = 2.45;
            surface_condition = 'NORMAL';
            story = 'Conveyor C-01 is handling elevated bulk material loading. Motor torque and current elevated within safe operating reserve.';
            insight = 'Material feed rate above standard baseline. Current and thermal rise monitored.';
            healthScore = 88;
          } else if (scenario === 'VIBRATION_INC') {
            targetVib = 4.10;
            targetTemp = 29.1;
            status = 'WARNING';
            surface_condition = 'NORMAL';
            story = 'Conveyor C-01 mechanical oscillation has increased gradually over the last 10 minutes.';
            insight = 'Vibration is trending upward. Inspect the drive and bearing zones if the trend persists.';
            healthScore = 74;
          } else if (scenario === 'TEMP_RISE') {
            targetTemp = 48.5;
            targetCurr = 1.95;
            status = 'WARNING';
            surface_condition = 'NORMAL';
            story = 'Conveyor C-01 drive head bearing temperature has elevated above baseline (48.5°C).';
            insight = 'Drive bearing temperature is above baseline. Inspect cooling fan and grease pack.';
            healthScore = 76;
          } else if (scenario === 'BELT_SLIP') {
            targetSlip = 6.8;
            targetSpeed = 3.2;
            targetRpm1 = 144;
            targetRpm2 = 134;
            status = 'WARNING';
            surface_condition = 'NORMAL';
            story = 'Conveyor C-01 is experiencing dynamic belt slip. Roller speed differential observed between drive and driven pulleys.';
            insight = 'Drive pulley traction loss detected. Verify take-up carriage tension.';
            healthScore = 72;
          } else if (scenario === 'SLIGHT_SCRATCH') {
            status = 'WARNING';
            surface_condition = 'SCRATCH';
            story = 'Conveyor operating under warning condition. Surface defect (Scratch) detected by AI vision.';
            insight = 'Superficial surface scratch observed. Schedule visual inspection during next maintenance cycle.';
            healthScore = 84;
          } else if (scenario === 'DEEP_SCRATCH') {
            status = 'WARNING';
            targetVib = 2.65;
            surface_condition = 'DEEP_SCRATCH';
            story = 'Conveyor operating under warning condition. Deep scratch (~3.4 mm depth) detected on belt surface.';
            insight = 'Top cover grooving detected. Monitor groove depth during next planned shift halt.';
            healthScore = 76;
          } else if (scenario === 'LONGITUDINAL_TEAR') {
            status = 'STOP_LATCHED';
            targetSpeed = 0;
            targetRpm1 = 0;
            targetRpm2 = 0;
            targetCurr = 0;
            surface_condition = 'LONGITUDINAL_TEAR';
            story = 'Critical belt condition detected. Longitudinal belt tear detected by AI vision. Conveyor shutdown initiated and safety latch active.';
            insight = 'Critical surface defect detected. Stop the conveyor and perform physical inspection.';
            healthScore = 38;
          } else if (scenario === 'BELT_SPLICE') {
            status = 'CRITICAL';
            targetVib = 3.85;
            surface_condition = 'BELT_SPLICE';
            story = 'AI vision detected vulcanized splice joint seam abnormality under structural tension.';
            insight = 'Mechanical splice joint anomaly detected. Prepare for joint inspection.';
            healthScore = 44;
          } else if (scenario === 'SENSOR_DISCONNECT') {
            targetTemp = null;
            targetVib = null;
            targetThick = null;
            status = 'SENSOR FAULT';
            surface_condition = 'NORMAL';
            story = 'Sensor communication is unavailable. The affected measurement is excluded until the sensor becomes healthy.';
            insight = 'Thickness sensor has no valid reading. Sensor diagnostic offline.';
            healthScore = 65;
          } else if (scenario === 'ESTOP') {
            status = 'STOP_LATCHED';
            targetSpeed = 0;
            targetRpm1 = 0;
            targetRpm2 = 0;
            targetCurr = 0;
            surface_condition = 'NORMAL';
            story = 'Critical shutdown: Physical E-stop active. Motor de-energized by local safety loop. Safety latch active.';
            insight = 'Emergency stop loop open. Operator inspection and authorized reset required prior to restart.';
            healthScore = 40;
          }

          const smooth = (curr: number | null, target: number | null, step: number, jitter: number): number | null => {
            if (target === null) return null;
            const base = curr ?? target;
            const diff = target - base;
            return base + (diff * step) + (Math.random() * jitter * 2 - jitter);
          };

          const newTemp = targetTemp !== null ? Number(smooth(prev.temperature, targetTemp, 0.18, 0.05)?.toFixed(1)) : null;
          const newVib = targetVib !== null ? Number(smooth(prev.vibration, targetVib, 0.18, 0.03)?.toFixed(2)) : null;
          const newCurr = targetCurr !== null ? Number(smooth(prev.motor_current, targetCurr, 0.18, 0.02)?.toFixed(2)) : null;
          const newLoad = targetLoad !== null ? Math.round(smooth(prev.load, targetLoad, 0.18, 0.4) ?? targetLoad) : null;
          const newSpeed = targetSpeed !== null ? Number(smooth(prev.belt_speed, targetSpeed, 0.2, 0.02)?.toFixed(1)) : 0;
          const newSlip = targetSlip !== null ? Number(smooth(prev.belt_slip, targetSlip, 0.18, 0.02)?.toFixed(1)) : 0;
          const newThick = targetThick !== null ? Number(smooth(prev.belt_thickness, targetThick, 0.1, 0.02)?.toFixed(1)) : null;

          const candidate: TelemetryData = {
            ...prev,
            temperature: newTemp,
            vibration: newVib,
            motor_current: newCurr,
            load: newLoad,
            belt_speed: newSpeed,
            belt_slip: newSlip,
            belt_thickness: newThick,
            rpm1: targetRpm1,
            rpm2: targetRpm2,
            rpm: targetRpm1 ?? 0,
            status,
            surface_condition,
            humanStory: story,
            maintenanceInsight: insight,
            healthScore,
            healthBreakdown: {
              temperature: newTemp !== null ? Math.max(30, Math.min(100, Math.round(100 - (newTemp - 25) * 2))) : 80,
              vibration: newVib !== null ? Math.max(30, Math.min(100, Math.round(100 - newVib * 14))) : 80,
              motor: newCurr !== null ? Math.max(30, Math.min(100, Math.round(100 - (newCurr - 1.5) * 20))) : 80,
              belt: scenario === 'LONGITUDINAL_TEAR' ? 30 : scenario === 'BELT_SPLICE' ? 45 : scenario === 'DEEP_SCRATCH' ? 65 : 95,
              aiInspection: scenario === 'LONGITUDINAL_TEAR' ? 25 : scenario === 'BELT_SPLICE' ? 40 : scenario === 'DEEP_SCRATCH' ? 60 : 96
            },
            lastUpdate: Date.now()
          };

          setHistory(h => [...h.slice(-59), candidate]);
          return candidate;
        });
      }, 1500);

    } else {
      // Real Supabase Mode
      const client = supabase;
      if (client) {
        // 1. Initial history fetch
        (async () => {
          try {
            const { data, error } = await client
              .from('conveyor_telemetry')
              .select('*')
              .order('id', { ascending: false })
              .limit(50);

            if (!error && data && data.length > 0) {
              const hist = data.slice().reverse().map(r => parseTelemetryRow(r, BASE_TELEMETRY));
              setHistory(hist);
              const latest = hist[hist.length - 1];
              setTelemetry(latest);
              setConnectionStatus('CONNECTED');
              lastTelemetryTimeRef.current = Date.now();
              addEvent('Supabase conveyor_telemetry connected. Telemetry streaming.', 'TELEMETRY', 'NORMAL');
            }
          } catch (err) {
            console.warn('[MineGuard] Initial telemetry fetch failed:', err);
          }
        })();

        // 2. Realtime WebSocket subscription
        try {
          channel = client
            .channel('conveyor_telemetry_live')
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'conveyor_telemetry'
              },
              (payload) => {
                if (payload && payload.new) {
                  setConnectionStatus('CONNECTED');
                  lastTelemetryTimeRef.current = Date.now();
                  setTelemetry(prev => {
                    const parsed = parseTelemetryRow(payload.new, prev);
                    setHistory(h => [...h.slice(-59), parsed]);
                    return parsed;
                  });
                }
              }
            )
            .subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                setConnectionStatus('CONNECTED');
              } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                setConnectionStatus('STALE');
              }
            });
        } catch (e) {
          console.warn('[MineGuard] Realtime subscription failed, using polling fallback.', e);
        }

        // 3. Resilient Polling Fallback (every 2.0s)
        pollTimer = setInterval(async () => {
          try {
            const { data, error } = await client
              .from('conveyor_telemetry')
              .select('*')
              .order('id', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (!error && data) {
              setConnectionStatus('CONNECTED');
              lastTelemetryTimeRef.current = Date.now();
              setTelemetry(prev => {
                const parsed = parseTelemetryRow(data, prev);
                setHistory(h => {
                  if (h.length === 0 || h[h.length - 1].lastUpdate !== parsed.lastUpdate) {
                    return [...h.slice(-59), parsed];
                  }
                  return h;
                });
                return parsed;
              });
            } else {
              const diffSec = (Date.now() - lastTelemetryTimeRef.current) / 1000;
              if (diffSec > 15 && lastTelemetryTimeRef.current > 0) {
                setConnectionStatus('OFFLINE');
                setTelemetry(prev => ({
                  ...prev,
                  status: 'OFFLINE',
                  operatorConfidence: 'LOW',
                  operatorConfidenceReason: 'No telemetry row received in over 15 seconds.',
                  dataQuality: 'DEGRADED'
                }));
              }
            }
          } catch {
            const diffSec = (Date.now() - lastTelemetryTimeRef.current) / 1000;
            if (diffSec > 15 && lastTelemetryTimeRef.current > 0) {
              setConnectionStatus('OFFLINE');
            }
          }
        }, 2000);
      }
    }

    return () => {
      if (pollTimer) clearInterval(pollTimer);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [isDemoMode, isMonitoring, scenario]);

  // Synchronize alarms and events when scenario changes
  useEffect(() => {
    if (!isDemoMode) return;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    
    if (scenario === 'SLIGHT_SCRATCH') {
      addEvent('AI inspection completed: SCRATCH DETECTED (Confidence 94.7%).', 'AI_INSPECTION', 'WARNING');
      setAlarms(prev => [
        {
          id: 'alm-scr-' + Date.now(),
          time: nowTime,
          source: 'AI Vision (YOLO11s)',
          condition: 'Belt Surface Scratch Anomaly Detected',
          currentValue: 'Scratch (94.7%)',
          threshold: 'Continuous Carcass',
          category: 'WARNING',
          action: 'Inspect affected belt region during next shift pause',
          acknowledged: false
        },
        ...prev.filter(a => a.condition !== 'Belt Surface Scratch Anomaly Detected')
      ]);
    } else if (scenario === 'LONGITUDINAL_TEAR') {
      addEvent('CRITICAL SAFETY TRIP: Longitudinal tear detected by AI Vision.', 'ALARM', 'CRITICAL');
      setAlarms(prev => [
        {
          id: 'alm-tear-' + Date.now(),
          time: nowTime,
          source: 'AI Vision (YOLO11s)',
          condition: 'CRITICAL: High-Confidence Longitudinal Belt Tear',
          currentValue: 'Longitudinal Tear (96.8%)',
          threshold: 'Continuous Carcass',
          category: 'CRITICAL',
          action: 'Immediate conveyor shutdown & mechanical inspection required',
          acknowledged: false
        },
        ...prev.filter(a => !a.condition.includes('Longitudinal Belt Tear'))
      ]);
    } else if (scenario === 'TEMP_RISE') {
      addEvent('Bearing temperature approaching warning boundary (48.5°C).', 'TELEMETRY', 'WARNING');
      setAlarms(prev => [
        {
          id: 'alm-temp-' + Date.now(),
          time: nowTime,
          source: 'Temperature (Bearing Zone)',
          condition: 'Head Drive Bearing Thermal Elevation',
          currentValue: '48.5 °C',
          threshold: '45.0 °C Warning',
          category: 'WARNING',
          action: 'Inspect cooling air path and bearing grease pack',
          acknowledged: false
        },
        ...prev.filter(a => a.source !== 'Temperature (Bearing Zone)')
      ]);
    } else if (scenario === 'VIBRATION_INC') {
      addEvent('Drive velocity vibration elevated above nominal baseline (4.10 mm/s).', 'TELEMETRY', 'WARNING');
      setAlarms(prev => [
        {
          id: 'alm-vib-' + Date.now(),
          time: nowTime,
          source: 'Vibration Sensor',
          condition: 'Drive Pulley Mechanical Oscillation Rise',
          currentValue: '4.10 mm/s',
          threshold: '3.50 mm/s Warning',
          category: 'WARNING',
          action: 'Inspect drive alignment and base anchoring bolts',
          acknowledged: false
        },
        ...prev.filter(a => a.source !== 'Vibration Sensor')
      ]);
    } else if (scenario === 'BELT_SLIP') {
      addEvent('Two-encoder speed differential detected (6.8% slip, 10 RPM diff).', 'TELEMETRY', 'WARNING');
      setAlarms(prev => [
        {
          id: 'alm-slip-' + Date.now(),
          time: nowTime,
          source: 'Encoder 1 & 2 Sync',
          condition: 'Drive / Tail Pulley Speed Mismatch',
          currentValue: '6.8 % Slip',
          threshold: '5.0 % Slip Limit',
          category: 'WARNING',
          action: 'Check belt take-up carriage tension and drive lag friction',
          acknowledged: false
        },
        ...prev.filter(a => a.source !== 'Encoder 1 & 2 Sync')
      ]);
    } else if (scenario === 'SENSOR_DISCONNECT') {
      addEvent('Sensor communication timeout: Ultrasonic & vibration offline.', 'SYSTEM', 'WARNING');
      setAlarms(prev => [
        {
          id: 'alm-disc-' + Date.now(),
          time: nowTime,
          source: 'Hardware Bus',
          condition: 'Sensor Offline / Loss of Signal',
          currentValue: 'NO ECHO / TIMEOUT',
          threshold: 'Heartbeat < 2s',
          category: 'WARNING',
          action: 'Inspect ESP32 I2C / UART wiring bus',
          acknowledged: false
        },
        ...prev.filter(a => a.source !== 'Hardware Bus')
      ]);
    } else if (scenario === 'NORMAL') {
      addEvent('Operating parameters normalized. Baseline monitoring active.', 'SYSTEM', 'NORMAL');
    }
  }, [scenario, isDemoMode]);

  return {
    telemetry,
    history,
    isDemoMode,
    setDemoMode,
    isMonitoring,
    setIsMonitoring,
    scenario,
    setScenario,
    alarms,
    acknowledgeAlarm,
    events,
    addEvent,
    connectionStatus
  };
}
