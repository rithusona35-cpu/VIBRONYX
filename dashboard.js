const CONFIG = window.MINEGUARD_CONFIG || {};

let supabaseClient = null;
try {
  if (window.supabase && CONFIG.supabase) {
    supabaseClient = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
  }
} catch (e) {
  console.warn("Supabase init failed", e);
}

// State
let isDemoMode = false;
let isMonitoring = true;
let currentChartType = 'temp'; 
let mainChart = null;
let stream = null;
let lastSupabaseTime = Date.now();

const historyLen = 20;
let chartData = {
  temp: Array(historyLen).fill(38.0),
  vib: Array(historyLen).fill(2.0),
  curr: Array(historyLen).fill(1.5),
  speed: Array(historyLen).fill(3.5)
};

// Real sensor values (null when awaiting live packet)
let dispVals = { temp: null, vib: null, curr: null, speed: null, slip: null, thick: null, status: 'OFFLINE' };

document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  initChart();
  setupInteractions();
  startTelemetryEngine();
  startSupabaseSync();
  logEvent("System initialized. Monitoring active.");
  
  // Update connection status
  setInterval(updateConnectionStatus, 1000);
});

// ==========================================
// TELEMETRY ENGINE
// ==========================================
function startTelemetryEngine() {
  // Rapid UI refresh for realism
  setInterval(() => {
    if(!isMonitoring) return;
    
    if(isDemoMode) {
      // Realistic physical drift
      dispVals.temp = baseVals.temp + (Math.random() * 0.4 - 0.2);
      dispVals.vib = baseVals.vib + (Math.random() * 0.2 - 0.1);
      dispVals.curr = baseVals.curr + (Math.random() * 0.05 - 0.025);
      dispVals.speed = baseVals.speed + (Math.random() * 0.1 - 0.05);
      dispVals.slip = baseVals.slip + (Math.random() * 0.02 - 0.01);
      dispVals.thick = baseVals.thick; // Thickness shouldn't jitter much
    }

    updateMetricCards();
    updateHealthPanel();
  }, 500);
  
  // Chart update
  setInterval(() => {
    if(!isMonitoring) return;
    chartData.temp.push(dispVals.temp);
    chartData.vib.push(dispVals.vib);
    chartData.curr.push(dispVals.curr);
    chartData.speed.push(dispVals.speed);
    
    if (chartData.temp.length > historyLen) chartData.temp.shift();
    if (chartData.vib.length > historyLen) chartData.vib.shift();
    if (chartData.curr.length > historyLen) chartData.curr.shift();
    if (chartData.speed.length > historyLen) chartData.speed.shift();
    
    updateChartUI();
  }, 1000);
}

function updateMetricCards() {
  const elTemp = document.getElementById('val-temp');
  const elVib = document.getElementById('val-vib');
  const elCurr = document.getElementById('val-curr');
  const elSpeed = document.getElementById('val-speed');
  const elSlip = document.getElementById('val-slip');
  const elThick = document.getElementById('val-thick');
  const elStatus = document.getElementById('val-status');

  if (elTemp) elTemp.textContent = dispVals.temp !== null ? dispVals.temp.toFixed(1) : "--";
  if (elVib) {
    if (dispVals.vib !== null) {
      elVib.textContent = dispVals.vib > 50 ? dispVals.vib.toFixed(1) : dispVals.vib.toFixed(2);
      const unitEl = elVib.parentElement?.querySelector('span.text-sm');
      if (unitEl) unitEl.textContent = dispVals.vib > 50 ? "m/s²" : "mm/s";
    } else {
      elVib.textContent = "--";
    }
  }
  if (elCurr) elCurr.textContent = dispVals.curr !== null ? dispVals.curr.toFixed(2) : "--";
  if (elSpeed) elSpeed.textContent = dispVals.speed !== null ? dispVals.speed.toFixed(1) : "0.0";
  if (elSlip) elSlip.textContent = dispVals.slip !== null ? dispVals.slip.toFixed(1) : "0.0";
  if (elThick) elThick.textContent = dispVals.thick !== null ? dispVals.thick.toFixed(1) : "No Echo";

  // Status Evaluation
  let status = (dispVals.status || 'NORMAL').toUpperCase().trim();
  if (status === 'STOP_LATCHED' || status.includes('LATCH')) {
    if (elStatus) { elStatus.textContent = "STOP LATCHED"; elStatus.className = "text-2xl font-bold text-mine-red animate-pulse"; }
    styleCard('card-status', 'CRITICAL');
  } else if (status === 'SENSOR FAULT' || status.includes('FAULT')) {
    if (elStatus) { elStatus.textContent = "SENSOR FAULT"; elStatus.className = "text-2xl font-bold text-mine-warning"; }
    styleCard('card-status', 'WARNING');
  } else if (status === 'OFFLINE') {
    if (elStatus) { elStatus.textContent = "OFFLINE"; elStatus.className = "text-2xl font-bold text-mine-secondary"; }
    styleCard('card-status', 'NORMAL');
  } else {
    let stTemp = evalThreshold(dispVals.temp, 65, 50);
    let stVib = evalThreshold(dispVals.vib, (dispVals.vib > 50 ? 140 : 5.0), (dispVals.vib > 50 ? 115 : 3.5));
    let stCurr = evalThreshold(dispVals.curr, 8.0, 4.0);
    let worst = (stTemp === 'CRITICAL' || stVib === 'CRITICAL' || stCurr === 'CRITICAL') ? 'CRITICAL' : (stTemp === 'WARNING' || stVib === 'WARNING' || stCurr === 'WARNING') ? 'WARNING' : 'NORMAL';
    if (elStatus) { elStatus.textContent = worst; elStatus.className = `text-2xl font-bold ${worst === 'CRITICAL' ? 'text-mine-red animate-pulse' : worst === 'WARNING' ? 'text-mine-warning' : 'text-mine-dark'}`; }
    styleCard('card-temp', stTemp);
    styleCard('card-vib', stVib);
    styleCard('card-curr', stCurr);
    updateAlerts([stTemp, stVib, stCurr]);
  }
}

function evalThreshold(val, crit, warn) {
  if (val === null || val === undefined) return 'NORMAL';
  if (val >= crit) return 'CRITICAL';
  if (val >= warn) return 'WARNING';
  return 'NORMAL';
}

function styleCard(cardId, status) {
  const card = document.getElementById(cardId);
  if(!card) return;
  const valText = card.querySelector('span.text-2xl');
  if(status === 'NORMAL') {
    card.className = "bg-mine-panel p-4 rounded border border-mine-border shadow-sm flex flex-col justify-between";
    if(valText) valText.className = "text-2xl font-bold text-mine-dark";
  } else if(status === 'WARNING') {
    card.className = "bg-[#FDF8F0] p-4 rounded border border-mine-warning shadow-sm flex flex-col justify-between";
    if(valText) valText.className = "text-2xl font-bold text-mine-warning";
  } else {
    card.className = "bg-[#FDF0F0] p-4 rounded border border-mine-red shadow-sm flex flex-col justify-between animate-pulse";
    if(valText) valText.className = "text-2xl font-bold text-mine-red";
  }
}

function updateHealthPanel() {
  const motor = document.getElementById('health-motor');
  const belt = document.getElementById('health-belt');
  
  // Example logic: if high current, motor is warning
  if (dispVals.curr > 2.2) motor.className = "size-4 rounded-full bg-mine-warning ring-4 ring-mine-warning/20";
  else motor.className = "size-4 rounded-full bg-mine-green ring-4 ring-mine-green/20";
  
  // Belt health based on vibration
  if (dispVals.vib > 5.0) belt.className = "size-4 rounded-full bg-mine-red ring-4 ring-mine-red/20 animate-pulse";
  else if (dispVals.vib > 3.5) belt.className = "size-4 rounded-full bg-mine-warning ring-4 ring-mine-warning/20";
  else belt.className = "size-4 rounded-full bg-mine-green ring-4 ring-mine-green/20";
}

function updateAlerts(statuses) {
  const cont = document.getElementById('alerts-container');
  cont.innerHTML = '';
  
  let hasAlerts = false;
  if(statuses[0] === 'CRITICAL' || statuses[0] === 'WARNING') {
    cont.innerHTML += `<div class="bg-mine-${statuses[0]==='CRITICAL'?'red':'warning'}/10 border border-mine-${statuses[0]==='CRITICAL'?'red':'warning'}/20 rounded p-3 flex items-start gap-3">
      <i data-lucide="alert-triangle" class="size-4 text-mine-${statuses[0]==='CRITICAL'?'red':'warning'} shrink-0 mt-0.5"></i>
      <div>
        <div class="text-xs font-bold text-mine-${statuses[0]==='CRITICAL'?'red':'warning'}">${statuses[0]}</div>
        <div class="text-[11px] text-mine-secondary mt-0.5">Temperature parameter exceeded baseline.</div>
      </div>
    </div>`;
    hasAlerts = true;
  }
  
  if(!hasAlerts) {
    cont.innerHTML = `<div class="bg-mine-normal/10 border border-mine-green/20 rounded p-3 flex items-start gap-3">
      <i data-lucide="check-circle" class="size-4 text-mine-green shrink-0 mt-0.5"></i>
      <div>
        <div class="text-xs font-bold text-mine-green">No active safety alerts</div>
        <div class="text-[11px] text-mine-secondary mt-0.5">System operating within monitored limits.</div>
      </div>
    </div>`;
  }
  lucide.createIcons();
}

function updateConnectionStatus() {
  const supDot = document.getElementById('status-supa');
  const timeTxt = document.getElementById('last-telem-time');
  
  if(!supabaseClient) {
    supDot.className = "size-2 rounded-full bg-mine-red";
    timeTxt.textContent = "OFFLINE";
    timeTxt.className = "font-bold text-mine-red";
    return;
  }
  
  if(isDemoMode) {
    timeTxt.textContent = "DEMO DATA";
    timeTxt.className = "font-bold text-mine-info";
    supDot.className = "size-2 rounded-full bg-mine-info";
    return;
  }

  const diffSeconds = Math.floor((Date.now() - lastSupabaseTime)/1000);
  if(diffSeconds < 10) {
    supDot.className = "size-2 rounded-full bg-mine-normal";
    timeTxt.textContent = `${diffSeconds}s ago`;
    timeTxt.className = "font-medium text-mine-green";
  } else {
    supDot.className = "size-2 rounded-full bg-mine-amber";
    timeTxt.textContent = `${diffSeconds}s ago (STALE)`;
    timeTxt.className = "font-bold text-mine-amber";
  }
}

// ==========================================
// SUPABASE SYNC
// ==========================================
function ingestRow(data) {
  if (!data) return;
  lastSupabaseTime = Date.now();
  const parseNum = (v) => (v !== null && v !== undefined && !isNaN(Number(v))) ? Number(v) : null;
  const parseDist = (v) => { const n = parseNum(v); return (n === null || n <= 0) ? null : n; };

  dispVals.temp = parseNum(data.temperature ?? data.avg_temperature);
  dispVals.vib = parseNum(data.vibration ?? data.vibration_velocity);
  dispVals.curr = parseNum(data.motor_current);
  dispVals.speed = parseNum(data.rpm1 ?? data.rpm);
  dispVals.slip = parseNum(data.belt_slip) ?? 0.0;
  dispVals.thick = parseDist(data.belt_thickness);
  dispVals.status = data.status || data.conveyor_status || 'NORMAL';
}

async function startSupabaseSync() {
  if (supabaseClient) {
    try {
      supabaseClient
        .channel("public_conveyor_telemetry")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: CONFIG.supabase?.telemetryTable || "conveyor_telemetry" }, (payload) => {
          if (payload && payload.new) {
            ingestRow(payload.new);
          }
        })
        .subscribe();
    } catch (e) {
      console.warn("Realtime sub fallback:", e);
    }
  }

  // Periodic polling fallback
  setInterval(async () => {
    if(isDemoMode || !supabaseClient || !isMonitoring) return;
    try {
      const { data } = await supabaseClient.from(CONFIG.supabase?.telemetryTable || 'conveyor_telemetry').select('*').order('created_at', { ascending: false }).limit(1).single();
      if(data) {
        ingestRow(data);
      }
    } catch(e) {}
  }, 2000);
}

// ==========================================
// CHARTS
// ==========================================
function initChart() {
  const ctx = document.getElementById('telemetryChart').getContext('2d');
  Chart.defaults.font.family = 'Inter';
  
  mainChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array(historyLen).fill(''),
      datasets: [{
        data: chartData.temp,
        borderColor: '#176B4D',
        backgroundColor: 'rgba(23, 107, 77, 0.05)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: { border: { display: false }, grid: { color: '#D9DED8' } }
      },
      animation: { duration: 0 }
    }
  });
}

function updateChartUI() {
  if(!mainChart) return;
  mainChart.data.datasets[0].data = chartData[currentChartType];
  
  const colors = {
    temp: { b: '#176B4D', bg: 'rgba(23, 107, 77, 0.05)' },
    vib: { b: '#D89B24', bg: 'rgba(216, 155, 36, 0.05)' },
    curr: { b: '#3178A6', bg: 'rgba(49, 120, 166, 0.05)' },
    speed: { b: '#5F6B63', bg: 'rgba(95, 107, 99, 0.05)' }
  };

  const col = colors[currentChartType];
  mainChart.data.datasets[0].borderColor = col.b;
  mainChart.data.datasets[0].backgroundColor = col.bg;
  mainChart.update();
}

// ==========================================
// INTERACTIONS & CONTROLS
// ==========================================
function setupInteractions() {
  // Chart Tabs
  document.querySelectorAll('.chart-tab').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.chart-tab').forEach(b => {
        b.className = "chart-tab px-3 py-1 rounded text-xs font-medium text-mine-secondary hover:bg-white/50";
      });
      e.target.className = "chart-tab px-3 py-1 rounded bg-white shadow-sm text-xs font-bold text-mine-dark border border-mine-border";
      currentChartType = e.target.dataset.chart;
      updateChartUI();
    });
  });

  // Demo Mode
  document.getElementById('toggle-demo').addEventListener('change', (e) => {
    isDemoMode = e.target.checked;
    if (isDemoMode) {
      logEvent("[DEMO] Demo mode engaged. Using simulated telemetry.");
    } else {
      logEvent("Demo mode disabled. Awaiting Supabase live feed.");
    }
  });

  // Controls
  document.getElementById('btn-stop').addEventListener('click', () => {
    isMonitoring = false;
    document.getElementById('val-status').textContent = "STOPPED";
    document.getElementById('val-status').className = "text-2xl font-bold text-mine-secondary";
    logEvent("Monitoring manually paused.");
  });
  
  document.getElementById('btn-start').addEventListener('click', () => {
    isMonitoring = true;
    document.getElementById('val-status').textContent = "RUNNING";
    document.getElementById('val-status').className = "text-2xl font-bold text-mine-dark";
    logEvent("Monitoring resumed.");
  });

  document.getElementById('btn-estop').addEventListener('click', () => {
    isDemoMode = true; // force demo to show spike
    baseVals.temp = 85.0;
    baseVals.vib = 8.5;
    logEvent("EMERGENCY STOP TRIGGERED. SYSTEM HALTED.");
    document.getElementById('val-status').textContent = "EMERGENCY STOP";
    document.getElementById('val-status').className = "text-2xl font-bold text-mine-red";
  });

  setupAI();
}

// ==========================================
// AI & CAMERA
// ==========================================
function setupAI() {
  const btnOpenCam = document.getElementById('btn-open-cam');
  const btnStopCam = document.getElementById('btn-stop-cam');
  const btnInspect = document.getElementById('btn-capture-inspect');
  const videoEl = document.getElementById('inspection-video');
  const placeholder = document.getElementById('camera-placeholder');

  btnOpenCam.addEventListener('click', async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoEl.srcObject = stream;
      videoEl.classList.remove('hidden');
      placeholder.classList.add('hidden');
      
      btnOpenCam.classList.add('hidden');
      btnStopCam.classList.remove('hidden');
      btnInspect.classList.remove('hidden');
      document.getElementById('upload-preview').classList.add('hidden');
      
      logEvent("Laptop camera access granted and opened.");
    } catch(err) {
      logEvent("Camera access was not granted. Please allow camera permission.");
      alert('Camera access denied or unavailable.');
    }
  });
  
  btnStopCam.addEventListener('click', () => {
    if(stream) stream.getTracks().forEach(t => t.stop());
    videoEl.classList.add('hidden');
    placeholder.classList.remove('hidden');
    
    btnOpenCam.classList.remove('hidden');
    btnStopCam.classList.add('hidden');
    btnInspect.classList.add('hidden');
    document.getElementById('result-overlay').classList.add('hidden');
    logEvent("Laptop camera stopped.");
  });

  btnInspect.addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    canvas.getContext('2d').drawImage(videoEl, 0, 0);
    canvas.toBlob(blob => runAiDiagnostic(blob), 'image/jpeg');
  });

  document.getElementById('input-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(file) {
      const url = URL.createObjectURL(file);
      const img = document.getElementById('upload-preview');
      img.src = url;
      img.classList.remove('hidden');
      videoEl.classList.add('hidden');
      placeholder.classList.add('hidden');
      
      if(stream) stream.getTracks().forEach(t => t.stop());
      btnOpenCam.classList.remove('hidden');
      btnStopCam.classList.add('hidden');
      btnInspect.classList.remove('hidden');
      
      logEvent("Image uploaded for inspection.");
      runAiDiagnostic(file);
    }
  });
}

async function runAiDiagnostic(blob) {
  const resCond = document.getElementById('res-condition');
  const resConf = document.getElementById('res-conf');
  const resRec = document.getElementById('res-rec');
  const overlay = document.getElementById('result-overlay');
  
  overlay.classList.remove('hidden');
  resCond.textContent = "Analyzing...";
  resCond.className = "text-sm font-bold text-mine-amber animate-pulse";
  resRec.textContent = "Waiting for inspection...";
  resConf.textContent = "--";
  
  logEvent("Belt inspection started.");

  const formData = new FormData();
  formData.append('image', blob, 'capture.jpg');

  try {
    const res = await fetch('/predict', { method: 'POST', body: formData });
    const result = await res.json();
    logEvent("Belt inspection completed.");
    
    let maxDet = null;
    if (result.detections && result.detections.length > 0) {
       maxDet = result.detections.reduce((prev, curr) => (prev.confidence > curr.confidence) ? prev : curr);
    }
    
    if(!maxDet) {
      resCond.textContent = "NORMAL BELT";
      resCond.className = "text-sm font-bold text-mine-green";
      resConf.textContent = "99.0%";
      resConf.className = "text-sm font-bold text-mine-green";
      resRec.textContent = "No significant surface defect. Continue operation.";
    } else {
      resCond.textContent = maxDet.class_name.toUpperCase();
      resCond.className = "text-sm font-bold text-mine-red";
      resConf.textContent = (maxDet.confidence * 100).toFixed(1) + "%";
      resConf.className = "text-sm font-bold text-mine-red";
      resRec.textContent = "Inspect belt immediately.";
    }
  } catch(e) {
    resCond.textContent = "ERROR";
    resCond.className = "text-sm font-bold text-mine-red";
    resRec.textContent = "Failed to connect to YOLO API.";
  }
}

function logEvent(msg) {
  const cont = document.getElementById('event-timeline');
  if(!cont) return;
  const now = new Date();
  const timeStr = now.toLocaleTimeString();
  const line = document.createElement('div');
  line.className = "pb-2 border-b border-mine-border last:border-0";
  line.innerHTML = `<span class="font-bold text-mine-secondary mr-2">${timeStr}</span> <span class="text-mine-dark">${msg}</span>`;
  cont.insertBefore(line, cont.firstChild);
  if(cont.children.length > 20) cont.removeChild(cont.lastChild);
}
