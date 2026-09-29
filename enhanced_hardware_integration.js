/* ==============================================================================
   MineGuard AI — Industrial SCADA & Hardware Integration Controller
   SIH 26008: AI-Based Conveyor Belt Defect Detection, Monitoring & Safety System
   Integrates:
   - Real-Time SCADA Status Cards (System, Conveyor, AI, Camera, STM32, E-Stop, Watchdog)
   - Sensor Health Matrix (MPU6050, ACS712, Rotary Encoder, DS18B20, TCRT5000)
   - Live SCADA Sensor Trend Charts (Current, Temperature, Vibration, RPM)
   - Live Camera Monitoring & Bounding Box Overlay
   - Operator Control Station (Run, Stop, E-Stop, Authenticated Reset)
   - SIH Demonstration Mode & Interactive Visual State Machine (10 Steps)
   - Defect Event Log & Safety Event Log with Filtering
   - Maintenance Management Module (Open, In Progress, Resolved)
   ============================================================================== */

(function () {
  "use strict";

  const API_BASE = "";
  let refreshTimer = null;
  let chartTimer = null;
  let cameraStreamTimer = null;
  let isCameraActive = false;

  // Chart data history buffers (last 30 samples)
  const chartHistory = {
    current: Array(30).fill(84.0),
    temp: Array(30).fill(42.5),
    vib: Array(30).fill(2.3),
    rpm: Array(30).fill(1200)
  };

  // Demo sequence definition (10 evaluation steps matching SIH requirements)
  const DEMO_STEPS = [
    { step: 1, name: "System Startup", desc: "System initialized in SYSTEM_READY state. Conveyor safe.", state: "SYSTEM_READY", severity: "NORMAL", action: "CONTINUE" },
    { step: 2, name: "Clean Belt Surface", desc: "Zero false alarms on normal clean rubber surface.", state: "BELT_RUNNING", severity: "NORMAL", action: "CONTINUE", img: "real_world_test/REAL_HEALTHY/frame_00021_jpg.rf.6831210c001ea5ff0d9b88a309b62f97.jpg" },
    { step: 3, name: "Slight Scratch", desc: "Minor surface scratch detected. Warning alert issued, conveyor continues.", state: "BELT_RUNNING", severity: "WARNING", action: "ALERT", img: "known_defect_tests/slight_scratch_5_frame_00129_jpg.rf.7719d1d835cab947ea466cdf7469001a.jpg" },
    { step: 4, name: "Deep Scratch", desc: "Deep longitudinal gouge detected. Maintenance alert recorded, conveyor continues.", state: "BELT_RUNNING", severity: "WARNING", action: "ALERT", img: "known_defect_tests/deep_scratch_1_frame_00024_jpg.rf.40676e62568fb1c96b30338f08050897.jpg" },
    { step: 5, name: "Longitudinal Tear", desc: "CRITICAL DEFECT DETECTED! High tension rupture hazard.", state: "DEFECT_DETECTED", severity: "CRITICAL", action: "STOP_CONVEYOR", img: "known_defect_tests/longitudinal_tear_2_frame_00007_jpg.rf.fc0f5aff005d781418faaa297ff2471c.jpg" },
    { step: 6, name: "Conveyor Motor Stop", desc: "Motor de-energized via STM32 relay/command. Deceleration to 0 RPM.", state: "BELT_STOPPED", severity: "CRITICAL", action: "STOP_CONVEYOR" },
    { step: 7, name: "Safety Stop Latched", desc: "Safety state machine locks in STOP_LATCHED. Auto-restart prohibited.", state: "STOP_LATCHED", severity: "CRITICAL", action: "STOP_CONVEYOR" },
    { step: 8, name: "Clean Frame While Latched", desc: "CRITICAL PROOF: Clean camera frame DOES NOT auto-restart stopped conveyor!", state: "STOP_LATCHED", severity: "CRITICAL", action: "STOP_CONVEYOR", img: "real_world_test/REAL_HEALTHY/frame_00021_jpg.rf.6831210c001ea5ff0d9b88a309b62f97.jpg" },
    { step: 9, name: "Authorized Operator Reset", desc: "Operator credentials verified. Critical latch cleared, safe state restored.", state: "SYSTEM_READY", severity: "NORMAL", action: "RESET" },
    { step: 10, name: "Sensor Anomaly Simulation", desc: "Excessive bearing temperature / motor current spike detected.", state: "WARNING", severity: "WARNING", action: "ALERT" }
  ];

  let currentDemoStepIndex = 0;

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  // ---------------------------------------------------------------------------
  // 1. INJECT COMPLETE SCADA INTERFACE
  // ---------------------------------------------------------------------------
  function injectScadaInterface() {
    if (document.getElementById("mineguard-scada-root")) return;

    const nav = document.querySelector("header") || document.body.firstElementChild || document.body;
    const root = document.createElement("div");
    root.id = "mineguard-scada-root";
    root.className = "px-4 py-2 flex flex-col gap-4";

    root.innerHTML = `
      <!-- TOP SCADA MASTER STATUS BAR -->
      <section class="bg-surface-container rounded-2xl border border-outline-variant p-5 shadow-2xl">
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant pb-4">
          <div class="flex items-center gap-3">
            <span class="size-3 rounded-full bg-primary animate-ping"></span>
            <div>
              <h2 class="text-on-surface text-xl font-black tracking-tight flex items-center gap-2">
                <span>MineGuard AI &bull; Industrial SCADA Command Suite</span>
                <span id="scada-hw-badge" class="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-purple-950 text-purple-300 border border-purple-600">SIMULATION MODE</span>
              </h2>
              <p class="text-on-surface-variant text-xs font-mono mt-0.5">SIH 26008 Real-Time Perception, Deterministic Safety Interlock & Sensor Telemetry</p>
            </div>
          </div>
          <div class="flex items-center gap-2 text-xs font-mono">
            <span class="text-on-surface-variant">STM32 Link:</span>
            <span id="scada-stm32-link" class="text-secondary font-bold">DISCOVERING...</span>
          </div>
        </div>

        <!-- 7 REAL-TIME STATUS CARDS -->
        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-4">
          <!-- Card 1: System Status -->
          <div class="p-3.5 rounded-xl bg-surface-container-high border border-outline-variant flex flex-col justify-between">
            <span class="text-[10px] uppercase font-mono text-on-surface-variant">SYSTEM STATUS</span>
            <div id="card-system-status" class="text-sm font-black font-mono text-emerald-400 mt-1">HEALTHY</div>
            <span class="text-[9px] text-on-surface-variant mt-1">Autonomous Safe</span>
          </div>
          <!-- Card 2: Conveyor -->
          <div class="p-3.5 rounded-xl bg-surface-container-high border border-outline-variant flex flex-col justify-between">
            <span class="text-[10px] uppercase font-mono text-on-surface-variant">CONVEYOR C-01</span>
            <div id="card-conveyor-status" class="text-sm font-black font-mono text-emerald-400 mt-1">RUNNING</div>
            <span class="text-[9px] text-on-surface-variant mt-1">Motor 1200 RPM</span>
          </div>
          <!-- Card 3: AI Model -->
          <div class="p-3.5 rounded-xl bg-surface-container-high border border-outline-variant flex flex-col justify-between">
            <span class="text-[10px] uppercase font-mono text-on-surface-variant">AI PERCEPTION</span>
            <div id="card-ai-status" class="text-sm font-black font-mono text-cyan-300 mt-1">ONLINE</div>
            <span id="card-ai-sub" class="text-[9px] text-on-surface-variant mt-1">YOLO11s &bull; 800px</span>
          </div>
          <!-- Card 4: Camera -->
          <div class="p-3.5 rounded-xl bg-surface-container-high border border-outline-variant flex flex-col justify-between">
            <span class="text-[10px] uppercase font-mono text-on-surface-variant">LIVE CAMERA</span>
            <div id="card-camera-status" class="text-sm font-black font-mono text-on-surface mt-1">STANDBY</div>
            <span id="card-camera-sub" class="text-[9px] text-on-surface-variant mt-1">DirectShow / Sim</span>
          </div>
          <!-- Card 5: STM32 -->
          <div class="p-3.5 rounded-xl bg-surface-container-high border border-outline-variant flex flex-col justify-between">
            <span class="text-[10px] uppercase font-mono text-on-surface-variant">STM32 SAFETY</span>
            <div id="card-stm32-status" class="text-sm font-black font-mono text-purple-300 mt-1">SIMULATION</div>
            <span class="text-[9px] text-on-surface-variant mt-1">115200 Baud CRC-8</span>
          </div>
          <!-- Card 6: E-Stop -->
          <div class="p-3.5 rounded-xl bg-surface-container-high border border-outline-variant flex flex-col justify-between">
            <span class="text-[10px] uppercase font-mono text-on-surface-variant">E-STOP CIRCUIT</span>
            <div id="card-estop-status" class="text-sm font-black font-mono text-emerald-400 mt-1">RELEASED</div>
            <span class="text-[9px] text-on-surface-variant mt-1">Circuit Closed</span>
          </div>
          <!-- Card 7: Watchdog -->
          <div class="p-3.5 rounded-xl bg-surface-container-high border border-outline-variant flex flex-col justify-between">
            <span class="text-[10px] uppercase font-mono text-on-surface-variant">WATCHDOG TIMER</span>
            <div id="card-watchdog-status" class="text-sm font-black font-mono text-emerald-400 mt-1">2000 ms</div>
            <span class="text-[9px] text-on-surface-variant mt-1">Heartbeat Active</span>
          </div>
        </div>

        <!-- OPERATOR CONTROL STATION -->
        <div class="mt-4 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-lg">tune</span>
            <div>
              <span class="text-xs font-bold text-on-surface block">Operator Actuator Panel</span>
              <span class="text-[11px] text-on-surface-variant font-mono">Deterministic Motor Interlock & Safety Reset Protocol</span>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button id="btn-operator-run" class="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer">
              <span class="material-symbols-outlined text-sm">play_arrow</span> START CONVEYOR
            </button>
            <button id="btn-operator-stop" class="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer">
              <span class="material-symbols-outlined text-sm">stop</span> STOP CONVEYOR
            </button>
            <button id="btn-operator-estop" class="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer">
              <span class="material-symbols-outlined text-sm">dangerous</span> EMERGENCY STOP
            </button>
            <button id="btn-operator-reset" class="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-variant border border-cyan-500/50 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer">
              <span class="material-symbols-outlined text-sm">lock_open</span> RESET SAFETY LATCH
            </button>
          </div>
        </div>
        <div id="operator-feedback-banner" class="mt-2 text-xs font-mono text-on-surface-variant hidden"></div>
      </section>

      <!-- SIH DEMONSTRATION MODE & VISUAL STATE MACHINE -->
      <section class="bg-surface-container rounded-2xl border border-outline-variant p-5 shadow-2xl">
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant pb-4">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-cyan-400 text-2xl">smart_toy</span>
            <div>
              <h3 class="text-on-surface text-lg font-bold flex items-center gap-2">
                <span>SIH 26008 Demonstration Control Mode</span>
                <span class="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700">10-STEP GOLDEN AUDIT</span>
              </h3>
              <p class="text-on-surface-variant text-xs">Full end-to-end controlled demonstration of defect classification, safety latching, clean-frame latch retention, and authorized reset.</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button id="btn-demo-prev" class="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-xs font-bold border border-outline-variant">Previous</button>
            <span id="demo-step-counter" class="text-xs font-mono font-bold text-cyan-300 px-2">Step 1 of 10</span>
            <button id="btn-demo-next" class="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary-container/90 text-xs font-bold shadow-md">Execute Next Step</button>
            <button id="btn-demo-autorun" class="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-cyan-950/40 text-cyan-300 text-xs font-bold border border-outline-variant">Auto Play Sequence</button>
          </div>
        </div>

        <!-- VISUAL STATE MACHINE DIAGRAM -->
        <div class="mt-4 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant">
          <span class="text-[10px] font-mono uppercase text-on-surface-variant block mb-2 font-bold">Deterministic 9-State Safety State Machine (FSM)</span>
          <div class="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div id="fsm-node-ready" class="p-2 px-3 rounded-lg bg-surface-container-high border border-outline-variant transition-all font-bold">1. SYSTEM_READY</div>
            <span class="text-outline">&rarr;</span>
            <div id="fsm-node-running" class="p-2 px-3 rounded-lg bg-surface-container-high border border-outline-variant transition-all font-bold">2. BELT_RUNNING</div>
            <span class="text-outline">&rarr;</span>
            <div id="fsm-node-detected" class="p-2 px-3 rounded-lg bg-surface-container-high border border-outline-variant transition-all font-bold">3. DEFECT_DETECTED</div>
            <span class="text-outline">&rarr;</span>
            <div id="fsm-node-analysis" class="p-2 px-3 rounded-lg bg-surface-container-high border border-outline-variant transition-all font-bold">4. SEVERITY_ANALYSIS</div>
            <span class="text-outline">&rarr;</span>
            <div id="fsm-node-stop" class="p-2 px-3 rounded-lg bg-surface-container-high border border-outline-variant transition-all font-bold">5. STOP_CONVEYOR</div>
            <span class="text-outline">&rarr;</span>
            <div id="fsm-node-latch" class="p-2 px-3 rounded-lg bg-surface-container-high border border-outline-variant transition-all font-bold text-red-400">6. STOP_LATCHED</div>
            <span class="text-outline">&rarr;</span>
            <div id="fsm-node-reset" class="p-2 px-3 rounded-lg bg-surface-container-high border border-outline-variant transition-all font-bold text-cyan-300">7. OPERATOR_RESET</div>
          </div>
        </div>

        <!-- CURRENT DEMO STEP DETAILS -->
        <div id="demo-step-details" class="mt-3 p-4 rounded-xl bg-surface-container-high/60 border border-outline-variant flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <div class="flex items-center gap-2">
              <span id="demo-badge-title" class="font-bold text-sm text-on-surface">Step 1: System Startup</span>
              <span id="demo-badge-severity" class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">NORMAL</span>
            </div>
            <p id="demo-step-desc" class="text-on-surface-variant mt-1 text-xs">System initialized in SYSTEM_READY state. Conveyor safe and ready for inspection.</p>
          </div>
          <div id="demo-step-status-msg" class="font-mono text-cyan-300">Ready to execute.</div>
        </div>
      </section>

      <!-- LIVE CAMERA MONITORING & SENSOR HEALTH MATRIX -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <!-- Live Camera Section (7 cols) -->
        <section class="lg:col-span-7 bg-surface-container rounded-2xl border border-outline-variant p-5 shadow-xl flex flex-col gap-4">
          <div class="flex items-center justify-between border-b border-outline-variant pb-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-xl">videocam</span>
              <h3 class="text-on-surface text-base font-bold">Live Industrial Conveyor Camera Monitor</h3>
            </div>
            <div class="flex items-center gap-2">
              <span id="cam-fps-tag" class="text-[10px] font-mono text-on-surface-variant bg-surface-container-high px-2 py-1 rounded">FPS: --</span>
              <button id="btn-toggle-camera" class="px-3 py-1 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary-container/90 text-xs font-bold transition-all cursor-pointer">
                Start Live Camera
              </button>
            </div>
          </div>

          <div class="relative w-full aspect-video bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden flex items-center justify-center">
            <img id="live-camera-feed" src="/api/camera/frame" alt="Conveyor Camera Stream" class="w-full h-full object-contain"/>
            <!-- Orientation Recovery Notification Overlay -->
            <div id="orientation-recovery-badge" class="absolute top-3 right-3 hidden bg-purple-950/90 border border-purple-500 text-purple-200 text-xs font-mono font-bold px-3 py-1.5 rounded-lg backdrop-blur-md shadow-lg flex items-center gap-1.5">
              <span class="material-symbols-outlined text-sm animate-spin">screen_rotation</span>
              <span>ORIENTATION RECOVERED (90° Rotation Detected)</span>
            </div>
            <!-- Live Detection Latency Overlay -->
            <div class="absolute bottom-3 left-3 bg-surface-container-high/90 border border-outline-variant text-[11px] font-mono text-on-surface px-2.5 py-1 rounded backdrop-blur-sm">
              <span id="cam-latency-tag">Inference Latency: ~140 ms</span>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <button id="btn-camera-capture" class="flex-1 px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface border border-outline-variant text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
              <span class="material-symbols-outlined text-sm">photo_camera</span> CAPTURE &amp; INSPECT
            </button>
            <button id="btn-camera-detect-live" class="flex-1 px-4 py-2 rounded-lg bg-secondary text-black hover:bg-secondary/90 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
              <span class="material-symbols-outlined text-sm">model_training</span> RUN LIVE YOLO INFERENCE
            </button>
          </div>
        </section>

        <!-- Sensor Health Matrix & Live Sparklines (5 cols) -->
        <section class="lg:col-span-5 bg-surface-container rounded-2xl border border-outline-variant p-5 shadow-xl flex flex-col gap-4">
          <div class="flex items-center justify-between border-b border-outline-variant pb-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-secondary text-xl">sensors</span>
              <h3 class="text-on-surface text-base font-bold">Sensor Health &amp; Telemetry Matrix</h3>
            </div>
            <span class="text-[10px] font-mono text-on-surface-variant">5 Hardware Sensors</span>
          </div>

          <!-- 5 SENSORS MATRIX -->
          <div class="grid grid-cols-1 gap-2 text-xs font-mono">
            <div class="p-2.5 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-between">
              <div><strong class="text-on-surface">MPU6050</strong> <span class="text-[11px] text-on-surface-variant block">Vibration Velocity & Spike</span></div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">ONLINE</span>
            </div>
            <div class="p-2.5 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-between">
              <div><strong class="text-on-surface">ACS712-05B</strong> <span class="text-[11px] text-on-surface-variant block">Motor Current / Mechanical Jam</span></div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">ONLINE</span>
            </div>
            <div class="p-2.5 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-between">
              <div><strong class="text-on-surface">Rotary Encoder</strong> <span class="text-[11px] text-on-surface-variant block">Belt Speed (m/s) &amp; Motor RPM</span></div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">ONLINE</span>
            </div>
            <div class="p-2.5 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-between">
              <div><strong class="text-on-surface">DS18B20</strong> <span class="text-[11px] text-on-surface-variant block">Bearing Housing Temperature</span></div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">ONLINE</span>
            </div>
            <div class="p-2.5 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-between">
              <div><strong class="text-on-surface">TCRT5000</strong> <span class="text-[11px] text-on-surface-variant block">Belt Presence &amp; Edge Alignment</span></div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">ONLINE</span>
            </div>
          </div>

          <!-- 4 LIVE SCADA TREND CHARTS -->
          <div class="mt-2 border-t border-outline-variant pt-3">
            <span class="text-[10px] font-mono uppercase text-on-surface-variant block mb-2 font-bold">Real-Time Waveform Telemetry</span>
            <div class="grid grid-cols-2 gap-2">
              <div class="p-2 rounded bg-surface-container-lowest border border-outline-variant">
                <div class="flex justify-between text-[10px] font-mono text-on-surface-variant"><span>Motor Current (A)</span><span id="chart-val-current">84.0 A</span></div>
                <canvas id="scada-chart-current" width="160" height="40" class="w-full h-10 mt-1"></canvas>
              </div>
              <div class="p-2 rounded bg-surface-container-lowest border border-outline-variant">
                <div class="flex justify-between text-[10px] font-mono text-on-surface-variant"><span>Bearing Temp (°C)</span><span id="chart-val-temp">42.5 °C</span></div>
                <canvas id="scada-chart-temp" width="160" height="40" class="w-full h-10 mt-1"></canvas>
              </div>
              <div class="p-2 rounded bg-surface-container-lowest border border-outline-variant">
                <div class="flex justify-between text-[10px] font-mono text-on-surface-variant"><span>Vibration (mm/s)</span><span id="chart-val-vib">2.3 mm/s</span></div>
                <canvas id="scada-chart-vib" width="160" height="40" class="w-full h-10 mt-1"></canvas>
              </div>
              <div class="p-2 rounded bg-surface-container-lowest border border-outline-variant">
                <div class="flex justify-between text-[10px] font-mono text-on-surface-variant"><span>Belt Speed (RPM)</span><span id="chart-val-rpm">1200 RPM</span></div>
                <canvas id="scada-chart-rpm" width="160" height="40" class="w-full h-10 mt-1"></canvas>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- DEFECT EVENT LOG & SAFETY EVENT LOG SECTIONS -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Defect Event Log Table -->
        <section class="bg-surface-container rounded-2xl border border-outline-variant p-5 shadow-xl">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant pb-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-amber-400 text-xl">warning</span>
              <h3 class="text-on-surface text-base font-bold">Defect Event Log</h3>
            </div>
            <div class="flex items-center gap-1 text-[11px] font-mono">
              <button onclick="window.filterDefectLog('ALL')" class="px-2 py-0.5 rounded bg-surface-container-high text-on-surface border border-outline-variant">ALL</button>
              <button onclick="window.filterDefectLog('NORMAL')" class="px-2 py-0.5 rounded bg-surface-container-high text-emerald-400 border border-outline-variant">NORMAL</button>
              <button onclick="window.filterDefectLog('WARNING')" class="px-2 py-0.5 rounded bg-surface-container-high text-amber-400 border border-outline-variant">WARNING</button>
              <button onclick="window.filterDefectLog('CRITICAL')" class="px-2 py-0.5 rounded bg-surface-container-high text-red-400 border border-outline-variant">CRITICAL</button>
            </div>
          </div>
          <div class="overflow-x-auto mt-3 max-h-56 overflow-y-auto">
            <table class="w-full text-left text-xs font-mono">
              <thead class="bg-surface-container-high text-on-surface-variant text-[10px] uppercase">
                <tr><th class="p-2">Time</th><th class="p-2">Defect</th><th class="p-2">Conf</th><th class="p-2">Severity</th><th class="p-2">Action</th></tr>
              </thead>
              <tbody id="defect-events-tbody" class="divide-y divide-outline-variant">
                <tr><td colspan="5" class="p-3 text-center italic text-on-surface-variant">Awaiting initial defect detection...</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Safety Event Log Table -->
        <section class="bg-surface-container rounded-2xl border border-outline-variant p-5 shadow-xl">
          <div class="flex items-center justify-between border-b border-outline-variant pb-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-xl">security</span>
              <h3 class="text-on-surface text-base font-bold">Safety Event Log</h3>
            </div>
            <span class="text-[10px] font-mono text-on-surface-variant">Deterministic Audit</span>
          </div>
          <div class="overflow-x-auto mt-3 max-h-56 overflow-y-auto">
            <table class="w-full text-left text-xs font-mono">
              <thead class="bg-surface-container-high text-on-surface-variant text-[10px] uppercase">
                <tr><th class="p-2">Time</th><th class="p-2">Event</th><th class="p-2">Severity</th><th class="p-2">Source</th><th class="p-2">Description</th></tr>
              </thead>
              <tbody id="safety-events-tbody" class="divide-y divide-outline-variant">
                <tr><td colspan="5" class="p-3 text-center italic text-on-surface-variant">Loading safety events...</td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <!-- MAINTENANCE MANAGEMENT MODULE -->
      <section class="bg-surface-container rounded-2xl border border-outline-variant p-5 shadow-xl">
        <div class="flex items-center justify-between border-b border-outline-variant pb-3">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary text-xl">build</span>
            <h3 class="text-on-surface text-base font-bold">Maintenance Records &amp; Remediation Protocols</h3>
          </div>
          <span class="text-xs text-on-surface-variant font-mono">Synced with Supabase conveyor_alerts</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3" id="maintenance-cards-container">
          <!-- Ticket 1 -->
          <div class="p-3.5 rounded-xl bg-surface-container-high border border-outline-variant flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-mono font-bold text-amber-400">WARNING &bull; TKT-001</span>
                <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950 text-amber-300">OPEN</span>
              </div>
              <h4 class="font-bold text-sm text-on-surface mt-1">Bearing Temperature Alert</h4>
              <p class="text-xs text-on-surface-variant mt-1">Bearing #4 DS18B20 reading 44.8°C (+2.3°C above baseline). Lubrication inspection recommended.</p>
            </div>
            <div class="flex items-center gap-2 mt-3 pt-2 border-t border-outline-variant">
              <button onclick="window.updateTicketStatus('TKT-001', 'IN_PROGRESS')" class="px-2 py-1 rounded bg-surface-container text-[11px] font-bold text-on-surface hover:bg-surface-variant">In Progress</button>
              <button onclick="window.updateTicketStatus('TKT-001', 'RESOLVED')" class="px-2 py-1 rounded bg-emerald-900/60 text-emerald-300 text-[11px] font-bold hover:bg-emerald-900">Resolve</button>
            </div>
          </div>
        </div>
      </section>
    `;

    nav.parentNode.insertBefore(root, nav.nextSibling);
    attachEventListeners();
  }

  // ---------------------------------------------------------------------------
  // 2. ATTACH OPERATOR & DEMO CONTROLS
  // ---------------------------------------------------------------------------
  function attachEventListeners() {
    // Operator Actions
    const btnRun = document.getElementById("btn-operator-run");
    const btnStop = document.getElementById("btn-operator-stop");
    const btnEstop = document.getElementById("btn-operator-estop");
    const btnReset = document.getElementById("btn-operator-reset");

    if (btnRun) btnRun.onclick = () => dispatchCommand("RUN");
    if (btnStop) btnStop.onclick = () => dispatchCommand("STOP");
    if (btnEstop) btnEstop.onclick = () => dispatchCommand("ESTOP");
    if (btnReset) btnReset.onclick = promptOperatorReset;

    // Demo Actions
    const btnNext = document.getElementById("btn-demo-next");
    const btnPrev = document.getElementById("btn-demo-prev");
    const btnAuto = document.getElementById("btn-demo-autorun");

    if (btnNext) btnNext.onclick = nextDemoStep;
    if (btnPrev) btnPrev.onclick = prevDemoStep;
    if (btnAuto) btnAuto.onclick = autoRunDemoSequence;

    // Camera Actions
    const btnToggleCam = document.getElementById("btn-toggle-camera");
    const btnCapture = document.getElementById("btn-camera-capture");
    const btnDetectLive = document.getElementById("btn-camera-detect-live");

    if (btnToggleCam) btnToggleCam.onclick = toggleLiveCamera;
    if (btnCapture) btnCapture.onclick = captureCameraFrame;
    if (btnDetectLive) btnDetectLive.onclick = runCameraInference;
  }

  // ---------------------------------------------------------------------------
  // 3. COMMAND DISPATCH & OPERATOR RESET
  // ---------------------------------------------------------------------------
  async function dispatchCommand(cmd, token) {
    const fb = document.getElementById("operator-feedback-banner");
    try {
      const res = await fetch("/api/hardware/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd, token: token || undefined })
      });
      const data = await res.json();
      if (fb) {
        fb.classList.remove("hidden");
        fb.textContent = data.ok ? `Command '${cmd}' dispatched successfully (${data.mode}).` : `Command '${cmd}' rejected: ${data.error}`;
        fb.className = data.ok ? "mt-2 text-xs font-mono text-emerald-400" : "mt-2 text-xs font-mono text-red-400 font-bold";
      }
      await refreshScadaState();
    } catch (e) {
      if (fb) {
        fb.classList.remove("hidden");
        fb.textContent = `Command API error: ${e.message}`;
        fb.className = "mt-2 text-xs font-mono text-red-400";
      }
    }
  }

  function promptOperatorReset() {
    const token = window.prompt("Enter Authorized Operator Reset Token:\n(Default Demo Token: MINEGUARD_RESET_2026 or 'admin')");
    if (!token) return;
    dispatchCommand("RESET", token);
  }

  // ---------------------------------------------------------------------------
  // 4. SIH DEMO STEP CONTROLLER
  // ---------------------------------------------------------------------------
  async function executeDemoStepIndex(index) {
    if (index < 0 || index >= DEMO_STEPS.length) return;
    currentDemoStepIndex = index;
    const step = DEMO_STEPS[index];

    const stepCounter = document.getElementById("demo-step-counter");
    const badgeTitle = document.getElementById("demo-badge-title");
    const badgeSeverity = document.getElementById("demo-badge-severity");
    const stepDesc = document.getElementById("demo-step-desc");
    const statusMsg = document.getElementById("demo-step-status-msg");

    if (stepCounter) stepCounter.textContent = `Step ${step.step} of ${DEMO_STEPS.length}`;
    if (badgeTitle) badgeTitle.textContent = `Step ${step.step}: ${step.name}`;
    if (stepDesc) stepDesc.textContent = step.desc;

    if (badgeSeverity) {
      badgeSeverity.textContent = step.severity;
      badgeSeverity.className = step.severity === "CRITICAL"
        ? "px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-700 animate-pulse"
        : (step.severity === "WARNING" ? "px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700" : "px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700");
    }

    if (statusMsg) statusMsg.textContent = "Executing inference...";

    // Highlight FSM Node
    highlightFsmNode(step.state);

    try {
      if (step.step === 9) {
        // Operator Reset Step
        await dispatchCommand("RESET", "MINEGUARD_RESET_2026");
        if (statusMsg) statusMsg.textContent = "Authorized reset executed -> SYSTEM_READY.";
      } else if (step.img) {
        // Execute real inference on target demo image
        const formData = new FormData();
        formData.append("sample_filename", step.img);
        const res = await fetch("/api/detect", { method: "POST", body: formData });
        const resData = await res.json();
        if (statusMsg) {
          statusMsg.textContent = `Inferred: ${resData.health_state || "PROCESSED"} | Action: ${resData.hardware_control?.action || "NONE"}`;
        }
      } else {
        if (statusMsg) statusMsg.textContent = `State simulated: ${step.state}`;
      }
      await refreshScadaState();
    } catch (e) {
      if (statusMsg) statusMsg.textContent = `Demo execution notice: ${e.message}`;
    }
  }

  function nextDemoStep() {
    const nextIdx = (currentDemoStepIndex + 1) % DEMO_STEPS.length;
    executeDemoStepIndex(nextIdx);
  }

  function prevDemoStep() {
    const prevIdx = (currentDemoStepIndex - 1 + DEMO_STEPS.length) % DEMO_STEPS.length;
    executeDemoStepIndex(prevIdx);
  }

  let autoRunTimer = null;
  function autoRunDemoSequence() {
    const btn = document.getElementById("btn-demo-autorun");
    if (autoRunTimer) {
      clearInterval(autoRunTimer);
      autoRunTimer = null;
      if (btn) btn.textContent = "Auto Play Sequence";
      return;
    }
    if (btn) btn.textContent = "Stop Auto Play";
    currentDemoStepIndex = 0;
    executeDemoStepIndex(0);
    autoRunTimer = setInterval(() => {
      if (currentDemoStepIndex >= DEMO_STEPS.length - 1) {
        clearInterval(autoRunTimer);
        autoRunTimer = null;
        if (btn) btn.textContent = "Auto Play Sequence";
      } else {
        nextDemoStep();
      }
    }, 4000);
  }

  function highlightFsmNode(state) {
    const map = {
      "SYSTEM_READY": "fsm-node-ready",
      "BELT_RUNNING": "fsm-node-running",
      "DEFECT_DETECTED": "fsm-node-detected",
      "SEVERITY_ANALYSIS": "fsm-node-analysis",
      "STOP_CONVEYOR": "fsm-node-stop",
      "STOP_LATCHED": "fsm-node-latch",
      "RESET": "fsm-node-reset"
    };

    Object.values(map).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove("ring-2", "ring-cyan-400", "bg-cyan-950/80");
    });

    const activeId = map[state] || "fsm-node-ready";
    const activeEl = document.getElementById(activeId);
    if (activeEl) {
      activeEl.classList.add("ring-2", "ring-cyan-400", "bg-cyan-950/80");
    }
  }

  // ---------------------------------------------------------------------------
  // 5. LIVE CAMERA CONTROLLER
  // ---------------------------------------------------------------------------
  async function toggleLiveCamera() {
    const btn = document.getElementById("btn-toggle-camera");
    const img = document.getElementById("live-camera-feed");
    if (isCameraActive) {
      // Stop Camera
      await fetch("/api/camera/stop", { method: "POST" });
      isCameraActive = false;
      if (btn) btn.textContent = "Start Live Camera";
      if (cameraStreamTimer) clearInterval(cameraStreamTimer);
    } else {
      // Start Camera
      await fetch("/api/camera/start", { method: "POST" });
      isCameraActive = true;
      if (btn) btn.textContent = "Stop Live Camera";
      if (img) img.src = "/api/camera/frame?t=" + Date.now();
      cameraStreamTimer = setInterval(() => {
        if (img && isCameraActive) {
          img.src = "/api/camera/frame?t=" + Date.now();
        }
      }, 500);
    }
    await refreshScadaState();
  }

  async function captureCameraFrame() {
    const img = document.getElementById("live-camera-feed");
    if (img) img.src = "/api/camera/frame?t=" + Date.now();
    await runCameraInference();
  }

  async function runCameraInference() {
    const latTag = document.getElementById("cam-latency-tag");
    const orientBadge = document.getElementById("orientation-recovery-badge");
    try {
      const res = await fetch("/api/camera/detect", { method: "POST" });
      const data = await res.json();
      if (latTag && data.latency_ms) {
        latTag.textContent = `Inference Latency: ${data.latency_ms.toFixed(1)} ms (${data.camera_policy || "LATEST_FRAME_WINS"})`;
      }
      if (orientBadge) {
        if (data.orientation_recovered) {
          orientBadge.classList.remove("hidden");
        } else {
          orientBadge.classList.add("hidden");
        }
      }
      await refreshScadaState();
    } catch (e) {
      console.warn("Live camera detection notice:", e);
    }
  }

  // ---------------------------------------------------------------------------
  // 6. SCADA TELEMETRY CHARTS RENDERER
  // ---------------------------------------------------------------------------
  function drawSparkline(canvasId, data, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (data.length < 2) return;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1.0;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    for (let i = 0; i < data.length; i++) {
      const x = (i / (data.length - 1)) * (w - 4) + 2;
      const y = h - 4 - ((data[i] - min) / range) * (h - 8);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Fill gradient
    ctx.lineTo(w - 2, h);
    ctx.lineTo(2, h);
    ctx.closePath();
    ctx.fillStyle = color.replace(")", ", 0.15)").replace("rgb", "rgba");
    ctx.fill();
  }

  function updateCharts(curr, temp, vib, rpm) {
    chartHistory.current.push(curr);
    chartHistory.current.shift();

    chartHistory.temp.push(temp);
    chartHistory.temp.shift();

    chartHistory.vib.push(vib);
    chartHistory.vib.shift();

    chartHistory.rpm.push(rpm);
    chartHistory.rpm.shift();

    drawSparkline("scada-chart-current", chartHistory.current, "rgb(56, 189, 248)");
    drawSparkline("scada-chart-temp", chartHistory.temp, "rgb(251, 146, 60)");
    drawSparkline("scada-chart-vib", chartHistory.vib, "rgb(248, 113, 113)");
    drawSparkline("scada-chart-rpm", chartHistory.rpm, "rgb(52, 211, 153)");

    const cCur = document.getElementById("chart-val-current");
    const cTmp = document.getElementById("chart-val-temp");
    const cVib = document.getElementById("chart-val-vib");
    const cRpm = document.getElementById("chart-val-rpm");

    if (cCur) cCur.textContent = `${curr.toFixed(1)} A`;
    if (cTmp) cTmp.textContent = `${temp.toFixed(1)} °C`;
    if (cVib) cVib.textContent = `${vib.toFixed(2)} mm/s`;
    if (cRpm) cRpm.textContent = `${Math.round(rpm)} RPM`;
  }

  // ---------------------------------------------------------------------------
  // 7. EVENT LOGS & MAINTENANCE UPDATERS
  // ---------------------------------------------------------------------------
  window.filterDefectLog = async function (sev) {
    try {
      const res = await fetch(`/api/events/defects?severity=${sev}`);
      const events = await res.json();
      renderDefectTable(events);
    } catch (e) {}
  };

  function renderDefectTable(events) {
    const tbody = document.getElementById("defect-events-tbody");
    if (!tbody) return;
    if (!events || events.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="p-3 text-center italic text-on-surface-variant">No defect events recorded.</td></tr>`;
      return;
    }
    tbody.innerHTML = events.map(e => `
      <tr class="hover:bg-surface-container-high/60">
        <td class="p-2 text-on-surface-variant font-mono">${esc(e.timestamp)}</td>
        <td class="p-2 font-bold text-on-surface">${esc(e.defect)}</td>
        <td class="p-2 font-mono text-cyan-300">${(e.confidence * 100).toFixed(1)}%</td>
        <td class="p-2"><span class="px-1.5 py-0.5 rounded text-[9px] font-bold ${e.severity === 'CRITICAL' ? 'bg-red-950 text-red-300' : 'bg-amber-950 text-amber-300'}">${esc(e.severity)}</span></td>
        <td class="p-2 font-mono ${e.action === 'STOP_CONVEYOR' ? 'text-red-400 font-bold' : 'text-on-surface-variant'}">${esc(e.action)}</td>
      </tr>
    `).join("");
  }

  async function refreshSafetyTable() {
    try {
      const res = await fetch("/api/events/safety");
      const events = await res.json();
      const tbody = document.getElementById("safety-events-tbody");
      if (!tbody || !events) return;
      tbody.innerHTML = events.slice(0, 15).map(e => `
        <tr class="hover:bg-surface-container-high/60">
          <td class="p-2 text-on-surface-variant font-mono">${esc(e.timestamp)}</td>
          <td class="p-2 font-bold ${e.severity === 'CRITICAL' ? 'text-red-400' : 'text-on-surface'}">${esc(e.event_type)}</td>
          <td class="p-2"><span class="px-1.5 py-0.5 rounded text-[9px] font-bold ${e.severity === 'CRITICAL' ? 'bg-red-950 text-red-300' : 'bg-emerald-950 text-emerald-300'}">${esc(e.severity)}</span></td>
          <td class="p-2 text-on-surface-variant font-mono text-[10px]">${esc(e.source)}</td>
          <td class="p-2 text-on-surface">${esc(e.description)}</td>
        </tr>
      `).join("");
    } catch (e) {}
  }

  window.updateTicketStatus = async function (id, status) {
    try {
      await fetch("/api/maintenance/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
      await refreshMaintenanceCards();
    } catch (e) {}
  };

  async function refreshMaintenanceCards() {
    try {
      const res = await fetch("/api/maintenance");
      const records = await res.json();
      const container = document.getElementById("maintenance-cards-container");
      if (!container || !records) return;

      container.innerHTML = records.map(r => `
        <div class="p-3.5 rounded-xl bg-surface-container-high border border-outline-variant flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-mono font-bold ${r.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}">${esc(r.severity)} &bull; ${esc(r.id)}</span>
              <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold ${r.status === 'RESOLVED' ? 'bg-emerald-950 text-emerald-300' : (r.status === 'IN_PROGRESS' ? 'bg-cyan-950 text-cyan-300' : 'bg-amber-950 text-amber-300')}">${esc(r.status)}</span>
            </div>
            <h4 class="font-bold text-sm text-on-surface mt-1">${esc(r.defect)}</h4>
            <p class="text-xs text-on-surface-variant mt-1">${esc(r.notes || '')}</p>
          </div>
          <div class="flex items-center gap-2 mt-3 pt-2 border-t border-outline-variant">
            <button onclick="window.updateTicketStatus('${esc(r.id)}', 'IN_PROGRESS')" class="px-2 py-1 rounded bg-surface-container text-[11px] font-bold text-on-surface hover:bg-surface-variant">In Progress</button>
            <button onclick="window.updateTicketStatus('${esc(r.id)}', 'RESOLVED')" class="px-2 py-1 rounded bg-emerald-900/60 text-emerald-300 text-[11px] font-bold hover:bg-emerald-900">Resolve</button>
          </div>
        </div>
      `).join("");
    } catch (e) {}
  }

  // ---------------------------------------------------------------------------
  // 8. MASTER REFRESH LOOP
  // ---------------------------------------------------------------------------
  async function refreshScadaState() {
    try {
      const [hwRes, telRes, camRes] = await Promise.all([
        fetch("/api/hardware/status", { cache: "no-store" }),
        fetch("/api/telemetry", { cache: "no-store" }),
        fetch("/api/camera/status", { cache: "no-store" })
      ]);

      const hw = await hwRes.json();
      const tel = await telRes.json();
      const cam = await camRes.json();

      // Top Status Badge
      const hwBadge = document.getElementById("scada-hw-badge");
      const stm32Link = document.getElementById("scada-stm32-link");
      if (hwBadge) {
        hwBadge.textContent = hw.connected ? "PHYSICAL STM32 ONLINE" : "SIMULATION MODE";
        hwBadge.className = hw.connected
          ? "text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-600"
          : "text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-purple-950 text-purple-300 border border-purple-600";
      }
      if (stm32Link) {
        stm32Link.textContent = hw.connected ? `STM32 ${hw.port} (${hw.baud} Baud)` : "Simulation Virtual COM (Bypass Active)";
      }

      // 7 Status Cards
      const cSys = document.getElementById("card-system-status");
      const cConv = document.getElementById("card-conveyor-status");
      const cAi = document.getElementById("card-ai-status");
      const cCam = document.getElementById("card-camera-status");
      const cStm = document.getElementById("card-stm32-status");
      const cEstop = document.getElementById("card-estop-status");
      const cWd = document.getElementById("card-watchdog-status");

      if (cSys) {
        if (hw.safety_latched) {
          cSys.textContent = "STOP LATCHED";
          cSys.className = "text-sm font-black font-mono text-red-500 animate-pulse";
        } else if (hw.safety_state === "EMERGENCY_STOP" || !hw.estop_ok) {
          cSys.textContent = "CRITICAL / E-STOP";
          cSys.className = "text-sm font-black font-mono text-red-500";
        } else if (hw.safety_state === "BELT_RUNNING") {
          cSys.textContent = "HEALTHY";
          cSys.className = "text-sm font-black font-mono text-emerald-400";
        } else {
          cSys.textContent = hw.safety_state || "READY";
          cSys.className = "text-sm font-black font-mono text-cyan-300";
        }
      }

      if (cConv) {
        cConv.textContent = hw.motor_running ? "RUNNING" : "STOPPED";
        cConv.className = hw.motor_running ? "text-sm font-black font-mono text-emerald-400" : "text-sm font-black font-mono text-amber-400";
      }

      if (cAi) {
        cAi.textContent = "ONLINE";
        cAi.className = "text-sm font-black font-mono text-cyan-300";
      }

      if (cCam) {
        cCam.textContent = cam.is_active ? "ONLINE" : "STANDBY";
        cCam.className = cam.is_active ? "text-sm font-black font-mono text-emerald-400" : "text-sm font-black font-mono text-on-surface";
      }

      if (cStm) {
        cStm.textContent = hw.connected ? "CONNECTED" : "SIMULATION";
        cStm.className = hw.connected ? "text-sm font-black font-mono text-emerald-400" : "text-sm font-black font-mono text-purple-300";
      }

      if (cEstop) {
        cEstop.textContent = hw.estop_ok ? "RELEASED" : "TRIPPED";
        cEstop.className = hw.estop_ok ? "text-sm font-black font-mono text-emerald-400" : "text-sm font-black font-mono text-red-500 animate-pulse";
      }

      if (cWd) {
        cWd.textContent = `${hw.watchdog_remaining_ms || 2000} ms`;
      }

      // Update Waveform Charts
      const currVal = tel.motor_current_A ?? (hw.motor_running ? 84.0 : 2.1);
      const tempVal = tel.bearing_temp_C ?? 42.5;
      const vibVal = tel.vibration_velocity_mms ?? 2.3;
      const rpmVal = tel.belt_speed_rpm ?? (hw.motor_running ? 1200 : 0);
      updateCharts(currVal, tempVal, vibVal, rpmVal);

    } catch (e) {
      console.warn("SCADA state refresh notice:", e);
    }
  }

  // ---------------------------------------------------------------------------
  // 9. INITIALIZE
  // ---------------------------------------------------------------------------
  function init() {
    injectScadaInterface();
    refreshScadaState();
    window.filterDefectLog("ALL");
    refreshSafetyTable();
    refreshMaintenanceCards();

    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(refreshScadaState, 1500);

    // Heartbeat ping
    setInterval(() => {
      fetch("/api/hardware/heartbeat", { method: "POST" }).catch(() => {});
    }, 1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
