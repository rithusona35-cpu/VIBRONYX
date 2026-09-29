const fs = require('fs');
const path = require('path');

const baseDir = 'c:\\Users\\AnbuRithu\\Downloads\\yolo_output\\mineguard-dashboard\\src';

const dirs = [
  'components',
  'pages',
  'services',
  'hooks',
  'utils',
  'assets'
];

dirs.forEach(d => {
  const p = path.join(baseDir, d);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

const files = {
  'utils/types.ts': `
export interface TelemetryData {
  temperature: number;
  vibration: number;
  motor_current: number;
  rpm: number;
  load: number;
  belt_slip: number;
  belt_thickness: number;
  belt_alignment: 'CENTERED' | 'MISALIGNED';
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  lastUpdate: number;
}

export interface AppEvent {
  id: string;
  time: string;
  message: string;
  status: 'VERIFIED' | 'ATTENTION' | 'CONNECTED';
}
`,
  'hooks/useTelemetry.ts': `
import { useState, useEffect } from 'react';
import { TelemetryData, AppEvent } from '../utils/types';
import { supabase } from '../services/supabase';

const BASE_TELEMETRY: TelemetryData = {
  temperature: 25.8,
  vibration: 2.3,
  motor_current: 1.67,
  rpm: 1500,
  load: 78,
  belt_slip: 0.6,
  belt_thickness: 12.4,
  belt_alignment: 'CENTERED',
  status: 'NORMAL',
  lastUpdate: Date.now()
};

export function useTelemetry() {
  const [isDemoMode, setDemoMode] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'OFFLINE' | 'STALE'>('OFFLINE');
  const [telemetry, setTelemetry] = useState<TelemetryData>(BASE_TELEMETRY);
  const [history, setHistory] = useState<TelemetryData[]>(Array(10).fill(BASE_TELEMETRY));
  const [events, setEvents] = useState<AppEvent[]>([
    { id: '1', time: new Date().toLocaleTimeString(), message: 'Monitoring Service Started', status: 'VERIFIED' }
  ]);

  const addEvent = (message: string, status: AppEvent['status'] = 'VERIFIED') => {
    setEvents(prev => [{ id: Math.random().toString(), time: new Date().toLocaleTimeString(), message, status }, ...prev].slice(0, 10));
  };

  useEffect(() => {
    let interval: any;
    
    // Quick demo mode sim
    if (isDemoMode && isMonitoring) {
      setConnectionStatus('CONNECTED');
      interval = setInterval(() => {
        setTelemetry(prev => {
          const newData = {
            ...prev,
            temperature: prev.temperature + (Math.random() * 0.4 - 0.2),
            vibration: prev.vibration + (Math.random() * 0.2 - 0.1),
            motor_current: prev.motor_current + (Math.random() * 0.04 - 0.02),
            load: Math.max(55, Math.min(85, prev.load + (Math.random() * 2 - 1))),
            lastUpdate: Date.now()
          };
          
          setHistory(h => [...h.slice(1), newData]);
          return newData;
        });
      }, 1000);
    } else if (!isDemoMode) {
      // Connect to real supabase if available
      setConnectionStatus(supabase ? 'CONNECTED' : 'OFFLINE');
      if(supabase && isMonitoring) {
        interval = setInterval(async () => {
          try {
            const { data } = await supabase.from('conveyor_telemetry').select('*').order('created_at', { ascending: false }).limit(1).single();
            if(data) {
              setConnectionStatus('CONNECTED');
              setTelemetry(prev => {
                const newData = {
                  ...prev,
                  temperature: data.temperature ?? prev.temperature,
                  vibration: data.vibration ?? prev.vibration,
                  motor_current: data.motor_current ?? prev.motor_current,
                  rpm: data.rpm ?? prev.rpm,
                  load: data.load ?? prev.load,
                  belt_slip: data.belt_slip ?? prev.belt_slip,
                  belt_thickness: data.belt_thickness ?? prev.belt_thickness,
                  lastUpdate: Date.now()
                };
                setHistory(h => [...h.slice(1), newData]);
                return newData;
              });
            }
          } catch(e) {
            setConnectionStatus('STALE');
          }
        }, 2000);
      }
    }

    return () => clearInterval(interval);
  }, [isDemoMode, isMonitoring]);

  return { telemetry, history, isDemoMode, setDemoMode, isMonitoring, setIsMonitoring, events, addEvent, connectionStatus };
}
`,
  'services/supabase.ts': `
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
`,
  'components/Header.tsx': `
import React from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';

export default function Header({ connectionStatus, lastUpdate }: { connectionStatus: string, lastUpdate: number }) {
  const diffSecs = Math.floor((Date.now() - lastUpdate) / 1000);
  const isStale = diffSecs > 10;
  
  let dbStatusColor = 'bg-[var(--color-mine-red)]';
  let dbStatusText = 'OFFLINE';
  
  if (connectionStatus === 'CONNECTED') {
    dbStatusColor = 'bg-[var(--color-mine-normal)]';
    dbStatusText = 'CONNECTED';
  } else if (connectionStatus === 'STALE' || isStale) {
    dbStatusColor = 'bg-[var(--color-mine-warning)]';
    dbStatusText = 'DATA STALE';
  }

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-mine-panel)] border-b border-[var(--color-mine-border)] px-6 py-4 shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded bg-[var(--color-mine-green)] flex items-center justify-center text-white shrink-0">
          <ShieldCheck size={24} />
        </div>
        <div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl font-bold tracking-tight text-[var(--color-mine-dark)]">MINEGUARD AI</h1>
            <span className="text-xs font-semibold text-[var(--color-mine-secondary)] bg-[var(--color-mine-bg)] px-2 py-0.5 rounded border border-[var(--color-mine-border)]">SIH 26008</span>
            <span className="text-xs font-semibold text-[var(--color-mine-secondary)] bg-[var(--color-mine-bg)] px-2 py-0.5 rounded border border-[var(--color-mine-border)]">Station C-01</span>
          </div>
          <p className="text-xs text-[var(--color-mine-secondary)] font-medium mt-0.5">Intelligent Conveyor Belt Safety & Predictive Monitoring</p>
        </div>
      </div>

      <div className="hidden md:flex flex-col items-center">
        <span className="text-[10px] font-bold text-[var(--color-mine-secondary)] uppercase tracking-widest">CONVEYOR</span>
        <span className="text-lg font-bold text-[var(--color-mine-dark)]">C-01 <span className="text-[var(--color-mine-normal)] ml-1 text-sm">● ACTIVE</span></span>
      </div>

      <div className="flex flex-col items-end gap-1 text-xs">
        <div className="flex items-center gap-4 font-medium text-[var(--color-mine-dark)]">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[var(--color-mine-normal)]"></div> SYSTEM ONLINE</div>
          <div className="flex items-center gap-1.5"><div className={\`w-2 h-2 rounded-full \${dbStatusColor}\`}></div> \${dbStatusText}</div>
          <button className="p-1 hover:bg-[var(--color-mine-bg)] rounded transition-colors text-[var(--color-mine-secondary)]">
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="text-[10px] text-[var(--color-mine-secondary)] mt-1">
          Last telemetry: <span className="font-semibold text-[var(--color-mine-dark)]">{isStale ? \`\${diffSecs}s ago\` : 'LIVE'}</span>
        </div>
      </div>
    </header>
  );
}
`,
  'components/StatusCards.tsx': `
import React from 'react';
import { TelemetryData } from '../utils/types';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export default function StatusCards({ telemetry }: { telemetry: TelemetryData }) {
  const cards = [
    { label: 'CONVEYOR STATUS', val: telemetry.status === 'NORMAL' ? 'RUNNING' : telemetry.status, sub: 'Operating within expected range', unit: '' },
    { label: 'TEMPERATURE', val: telemetry.temperature.toFixed(1), sub: 'Normal operating temperature', unit: '°C' },
    { label: 'VIBRATION', val: telemetry.vibration.toFixed(2), sub: 'Stable', unit: 'mm/s' },
    { label: 'MOTOR CURRENT', val: telemetry.motor_current.toFixed(2), sub: 'Normal load', unit: 'A' },
    { label: 'LOAD', val: telemetry.load.toFixed(0), sub: 'Within operating range', unit: '%' },
    { label: 'BELT SPEED', val: telemetry.rpm ? (telemetry.rpm * 0.0025).toFixed(1) : (3.8).toFixed(1), sub: 'Synchronized', unit: 'm/s' },
    { label: 'BELT THICKNESS', val: telemetry.belt_thickness.toFixed(1), sub: 'Nominal', unit: 'mm' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {cards.map((c, i) => (
        <div key={i} className="bg-[var(--color-mine-panel)] p-4 rounded-xl border border-[var(--color-mine-border)] shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-[var(--color-mine-secondary)] uppercase">{c.label}</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[var(--color-mine-dark)]">{c.val}</span>
            <span className="text-sm font-medium text-[var(--color-mine-secondary)]">{c.unit}</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-[var(--color-mine-normal)]">
            <CheckCircle size={12} /> {c.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
`,
  'components/TelemetryChart.tsx': `
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TelemetryData } from '../utils/types';

export default function TelemetryChart({ history }: { history: TelemetryData[] }) {
  const [activeTab, setActiveTab] = useState<'temperature' | 'vibration' | 'motor_current' | 'load' | 'rpm'>('temperature');
  
  const tabs = [
    { id: 'temperature', label: 'Temperature' },
    { id: 'vibration', label: 'Vibration' },
    { id: 'motor_current', label: 'Motor Current' },
    { id: 'load', label: 'Load' },
    { id: 'rpm', label: 'Belt Speed' }
  ] as const;

  const data = history.map((h, i) => ({
    time: i,
    temperature: h.temperature,
    vibration: h.vibration,
    motor_current: h.motor_current,
    load: h.load,
    rpm: h.rpm ? (h.rpm * 0.0025) : 3.8
  }));

  let maxVal = 0;
  if(activeTab === 'temperature') maxVal = 60;
  if(activeTab === 'vibration') maxVal = 10;
  if(activeTab === 'load') maxVal = 100;

  return (
    <div className="bg-[var(--color-mine-panel)] p-5 rounded-xl border border-[var(--color-mine-border)] shadow-sm flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-sm font-bold text-[var(--color-mine-dark)] uppercase tracking-wide">LIVE CONVEYOR TELEMETRY</h2>
          <p className="text-xs text-[var(--color-mine-secondary)] mt-1">Real-time physical parameter monitoring</p>
        </div>
        <div className="flex bg-[var(--color-mine-bg)] p-1 rounded-lg border border-[var(--color-mine-border)] gap-1">
          {tabs.map(t => (
            <button 
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={\`px-3 py-1.5 rounded-md text-xs font-bold transition-colors \${activeTab === t.id ? 'bg-[var(--color-mine-panel)] text-[var(--color-mine-dark)] shadow-sm border border-[var(--color-mine-border)]' : 'text-[var(--color-mine-secondary)] hover:bg-[var(--color-mine-panel)]/50'}\`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-mine-border)" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-mine-secondary)' }} axisLine={false} tickLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-mine-border)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} />
            {maxVal > 0 && <ReferenceLine y={maxVal * 0.8} stroke="var(--color-mine-warning)" strokeDasharray="3 3" />}
            <Line type="monotone" dataKey={activeTab} stroke="var(--color-mine-green)" strokeWidth={3} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
`,
  'components/BeltCondition.tsx': `
import React from 'react';
import { TelemetryData } from '../utils/types';
import { CheckCircle } from 'lucide-react';

export default function BeltCondition({ telemetry }: { telemetry: TelemetryData }) {
  return (
    <div className="bg-[var(--color-mine-panel)] p-5 rounded-xl border border-[var(--color-mine-border)] shadow-sm">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-[11px] font-bold text-[var(--color-mine-secondary)] uppercase tracking-widest">BELT CONDITION</h2>
        <span className="bg-[var(--color-mine-normal)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">NORMAL</span>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-[var(--color-mine-border)]">
          <span className="text-xs font-medium text-[var(--color-mine-secondary)]">Belt Thickness</span>
          <span className="text-sm font-bold text-[var(--color-mine-dark)]">{telemetry.belt_thickness.toFixed(1)} mm</span>
        </div>
        <div className="flex justify-between items-center pb-3 border-b border-[var(--color-mine-border)]">
          <span className="text-xs font-medium text-[var(--color-mine-secondary)]">Belt Slip</span>
          <span className="text-sm font-bold text-[var(--color-mine-dark)]">{telemetry.belt_slip.toFixed(1)} %</span>
        </div>
        <div className="flex justify-between items-center pb-3 border-b border-[var(--color-mine-border)]">
          <span className="text-xs font-medium text-[var(--color-mine-secondary)]">Alignment</span>
          <span className="text-sm font-bold text-[var(--color-mine-dark)]">{telemetry.belt_alignment}</span>
        </div>
        <div className="flex justify-between items-center pb-3 border-b border-[var(--color-mine-border)]">
          <span className="text-xs font-medium text-[var(--color-mine-secondary)]">Surface Condition</span>
          <span className="text-sm font-bold text-[var(--color-mine-dark)]">NORMAL</span>
        </div>
        
        <div className="bg-[var(--color-mine-normal)]/10 text-[var(--color-mine-normal)] p-3 rounded-lg border border-[var(--color-mine-normal)]/20 flex items-center gap-2 text-xs font-bold">
          <CheckCircle size={16} /> Inspection PASSED
        </div>
      </div>
    </div>
  );
}
`,
  'components/SystemHealth.tsx': `
import React from 'react';
import { Database, Zap, Activity, Camera, Video, Settings2 } from 'lucide-react';

export default function SystemHealth({ connectionStatus, isDemoMode, setDemoMode, isMonitoring, setIsMonitoring }: any) {
  return (
    <div className="bg-[var(--color-mine-panel)] p-5 rounded-xl border border-[var(--color-mine-border)] shadow-sm flex flex-col gap-6">
      
      <div>
        <h2 className="text-[11px] font-bold text-[var(--color-mine-secondary)] uppercase tracking-widest mb-4">SYSTEM HEALTH</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-mine-dark)]">
            <div className={\`w-2 h-2 rounded-full \${connectionStatus === 'CONNECTED' ? 'bg-[var(--color-mine-normal)]' : 'bg-[var(--color-mine-warning)]'}\`}></div>
            Telemetry Pipeline
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-mine-dark)]">
            <div className={\`w-2 h-2 rounded-full \${connectionStatus === 'CONNECTED' ? 'bg-[var(--color-mine-normal)]' : 'bg-[var(--color-mine-red)]'}\`}></div>
            Database
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-mine-dark)]">
            <div className="w-2 h-2 rounded-full bg-[var(--color-mine-normal)]"></div>
            AI Vision (YOLO11s)
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-mine-dark)]">
            <div className="w-2 h-2 rounded-full bg-[var(--color-mine-normal)]"></div>
            Camera Ready
          </div>
        </div>
      </div>

      <div className="pt-5 border-t border-[var(--color-mine-border)]">
        <h2 className="text-[11px] font-bold text-[var(--color-mine-secondary)] uppercase tracking-widest mb-4">OPERATOR CONTROLS</h2>
        
        <div className="flex justify-between items-center mb-4 text-xs font-bold">
          <span className="text-[var(--color-mine-secondary)]">SYSTEM MODE</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className={isDemoMode ? "text-[var(--color-mine-info)]" : "text-[var(--color-mine-secondary)]"}>DEMO MODE</span>
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={isDemoMode} onChange={e => setDemoMode(e.target.checked)} />
              <div className={\`block w-10 h-6 rounded-full transition-colors \${isDemoMode ? 'bg-[var(--color-mine-info)]' : 'bg-[var(--color-mine-border)]'}\`}></div>
              <div className={\`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform \${isDemoMode ? 'translate-x-4' : ''}\`}></div>
            </div>
          </label>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setIsMonitoring(true)}
            className={\`flex-1 text-xs font-bold py-2 rounded-lg transition-colors border \${isMonitoring ? 'bg-[var(--color-mine-green)] text-white border-[var(--color-mine-green)]' : 'bg-[var(--color-mine-bg)] text-[var(--color-mine-dark)] border-[var(--color-mine-border)] hover:bg-[var(--color-mine-border)]'}\`}
          >
            START MONITORING
          </button>
          <button 
            onClick={() => setIsMonitoring(false)}
            className={\`flex-1 text-xs font-bold py-2 rounded-lg transition-colors border \${!isMonitoring ? 'bg-[var(--color-mine-amber)] text-white border-[var(--color-mine-amber)]' : 'bg-[var(--color-mine-bg)] text-[var(--color-mine-dark)] border-[var(--color-mine-border)] hover:bg-[var(--color-mine-border)]'}\`}
          >
            PAUSE
          </button>
        </div>
      </div>
    </div>
  );
}
`,
  'components/AIInspection.tsx': `
import React, { useState, useRef } from 'react';
import { Camera, Upload, Play, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function AIInspection() {
  const [mode, setMode] = useState<'CAMERA' | 'UPLOAD' | 'SAMPLE'>('CAMERA');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState('READY');
  const [result, setResult] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(s);
      if(videoRef.current) videoRef.current.srcObject = s;
      setStatus('CAMERA LIVE');
      setMode('CAMERA');
    } catch(e) {
      alert("Camera access is blocked. Please allow camera permission in your browser.");
    }
  };

  const stopCamera = () => {
    if(stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
      setStatus('READY');
    }
  };

  const runInspection = () => {
    setStatus('ANALYZING BELT...');
    setTimeout(() => {
      // Simulate YOLO inference
      const defects = [
        { c: 'LONGITUDINAL TEAR', conf: '97.2%', stat: 'CRITICAL', rec: 'Inspect affected belt section' },
        { c: 'DEEP SCRATCH', conf: '94.1%', stat: 'WARNING', rec: 'Schedule maintenance review' },
        { c: 'NORMAL BELT', conf: '98.5%', stat: 'NORMAL', rec: 'Continue normal monitoring' }
      ];
      
      let res;
      if (mode === 'SAMPLE' && imageSrc?.includes('tear')) res = defects[0];
      else if (mode === 'SAMPLE' && imageSrc?.includes('scratch')) res = defects[1];
      else res = defects[2];

      setResult(res);
      setStatus('INSPECTION COMPLETE');
    }, 1200);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(file) {
      stopCamera();
      setImageSrc(URL.createObjectURL(file));
      setMode('UPLOAD');
      setResult(null);
      setStatus('READY');
    }
  };

  const loadSample = (type: string) => {
    stopCamera();
    setImageSrc(\`/static/assets/belt_\${type}.jpg\`); // Mock paths
    setMode('SAMPLE');
    setResult(null);
    setStatus('READY');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <div className="lg:col-span-2 bg-[var(--color-mine-panel)] p-5 rounded-xl border border-[var(--color-mine-border)] shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-sm font-bold text-[var(--color-mine-dark)] uppercase tracking-wide">AI BELT INSPECTION</h2>
            <p className="text-xs text-[var(--color-mine-secondary)] mt-1">YOLO11s Conveyor Belt Defect Detection</p>
          </div>
          <div className="bg-[var(--color-mine-bg)] px-2 py-1 rounded border border-[var(--color-mine-border)] text-[10px] font-bold text-[var(--color-mine-secondary)]">
            <span className={\`inline-block w-2 h-2 rounded-full mr-1 \${status === 'CAMERA LIVE' ? 'bg-[var(--color-mine-red)] animate-pulse' : 'bg-[var(--color-mine-normal)]'}\`}></span>
            {status}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 h-[350px]">
          <div className="flex-1 bg-black rounded-lg overflow-hidden relative flex items-center justify-center border border-[var(--color-mine-border)]">
            {mode === 'CAMERA' && stream && (
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            )}
            {(mode === 'UPLOAD' || mode === 'SAMPLE') && imageSrc && (
              <img src={imageSrc} className="w-full h-full object-contain bg-[var(--color-mine-bg)]" />
            )}
            {!stream && !imageSrc && (
              <div className="text-[var(--color-mine-secondary)] flex flex-col items-center">
                <Camera size={32} className="mb-2 opacity-50" />
                <span className="text-xs font-medium">Awaiting Video Source</span>
              </div>
            )}
          </div>

          <div className="w-full md:w-48 flex flex-col gap-2">
            <div className="text-[10px] font-bold text-[var(--color-mine-secondary)] uppercase tracking-widest mb-1">DATA SOURCE</div>
            
            {!stream ? (
              <button onClick={startCamera} className="w-full bg-[var(--color-mine-bg)] hover:bg-[var(--color-mine-border)] border border-[var(--color-mine-border)] text-[var(--color-mine-dark)] text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors">
                <Camera size={14} /> OPEN CAMERA
              </button>
            ) : (
              <button onClick={stopCamera} className="w-full bg-[var(--color-mine-bg)] hover:bg-[var(--color-mine-border)] border border-[var(--color-mine-border)] text-[var(--color-mine-dark)] text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors">
                STOP CAMERA
              </button>
            )}

            <label className="w-full bg-[var(--color-mine-bg)] hover:bg-[var(--color-mine-border)] border border-[var(--color-mine-border)] text-[var(--color-mine-dark)] text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors">
              <Upload size={14} /> UPLOAD IMAGE
              <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
            </label>

            <div className="mt-4 border-t border-[var(--color-mine-border)] pt-3">
               <div className="text-[10px] font-bold text-[var(--color-mine-secondary)] uppercase tracking-widest mb-2">SAMPLE IMAGES</div>
               <div className="grid grid-cols-2 gap-1.5">
                 {['normal', 'scratch', 'tear', 'splice'].map(t => (
                   <button key={t} onClick={() => loadSample(t)} className="bg-[var(--color-mine-bg)] hover:bg-[var(--color-mine-border)] border border-[var(--color-mine-border)] text-[var(--color-mine-dark)] text-[10px] py-1.5 rounded transition-colors capitalize">{t}</button>
                 ))}
               </div>
            </div>

            <button 
              onClick={runInspection}
              disabled={!stream && !imageSrc}
              className="mt-auto w-full bg-[var(--color-mine-green)] hover:bg-[var(--color-mine-green-light)] text-white text-xs font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Play size={14} /> RUN AI INSPECTION
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-mine-panel)] p-5 rounded-xl border border-[var(--color-mine-border)] shadow-sm flex flex-col">
        <h2 className="text-sm font-bold text-[var(--color-mine-dark)] uppercase tracking-wide mb-6">AI INSPECTION RESULT</h2>
        
        {result ? (
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-xs font-medium text-[var(--color-mine-secondary)] mb-1">Detected Condition</div>
              <div className={\`text-xl font-bold \${result.stat === 'NORMAL' ? 'text-[var(--color-mine-normal)]' : 'text-[var(--color-mine-red)]'}\`}>{result.c}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[var(--color-mine-border)]">
              <div>
                <div className="text-xs font-medium text-[var(--color-mine-secondary)] mb-1">Confidence</div>
                <div className="text-lg font-bold text-[var(--color-mine-dark)]">{result.conf}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-[var(--color-mine-secondary)] mb-1">Inspection</div>
                <div className={\`text-sm font-bold px-2 py-1 inline-block rounded \${result.stat === 'NORMAL' ? 'bg-[var(--color-mine-normal)]/10 text-[var(--color-mine-normal)]' : 'bg-[var(--color-mine-red)]/10 text-[var(--color-mine-red)]'}\`}>{result.stat}</div>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-[var(--color-mine-secondary)] mb-1">Recommendation</div>
              <div className="text-sm font-medium text-[var(--color-mine-dark)]">{result.rec}</div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-mine-secondary)]">
            <ShieldAlert size={32} className="mb-2 opacity-50" />
            <span className="text-xs font-medium">Awaiting Inspection Run</span>
          </div>
        )}
      </div>

    </div>
  );
}
`,
  'components/EventTimeline.tsx': `
import React from 'react';
import { AppEvent } from '../utils/types';
import { Clock } from 'lucide-react';

export default function EventTimeline({ events }: { events: AppEvent[] }) {
  return (
    <div className="bg-[var(--color-mine-panel)] p-5 rounded-xl border border-[var(--color-mine-border)] shadow-sm">
      <h2 className="text-sm font-bold text-[var(--color-mine-dark)] uppercase tracking-wide mb-4">LIVE EVENT TIMELINE</h2>
      <div className="flex flex-col gap-3">
        {events.map((e, i) => (
          <div key={e.id} className="flex items-start gap-4 pb-3 border-b border-[var(--color-mine-bg)] last:border-0 last:pb-0">
            <div className="flex flex-col items-end shrink-0 w-20">
              <span className="text-xs font-bold text-[var(--color-mine-secondary)]">{e.time}</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-[var(--color-mine-border)] mt-1 shrink-0 relative before:content-[''] before:absolute before:top-3 before:-bottom-4 before:left-1/2 before:-translate-x-1/2 before:w-px before:bg-[var(--color-mine-border)] last:before:hidden"></div>
            <div>
              <span className="text-xs font-medium text-[var(--color-mine-dark)] block leading-tight">{e.message}</span>
              <span className={\`text-[10px] font-bold mt-1 block \${e.status === 'VERIFIED' ? 'text-[var(--color-mine-green)]' : 'text-[var(--color-mine-amber)]'}\`}>{e.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`
};

for (const [relPath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(baseDir, relPath), content.trim() + '\n');
}
console.log('React components generated successfully.');
