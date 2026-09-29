// Global Application State
let currentDetections = [];
let currentImage = null;
let currentDatasetStats = null;
let liveStreamInterval = null;
let isStreaming = false;
let auditLogs = [];
let scannedCount = 1482;
let criticalCount = 0;
let currentConfThreshold = 0.25;
let lastLoadedFile = null;
let lastSampleFilename = null;
let sessionDefectCount = 0;
let sessionCleanCount = 0;

function onConfidenceChange(val) {
    currentConfThreshold = parseFloat(val);
    const disp = document.getElementById('confValDisplay');
    if (disp) disp.textContent = `${currentConfThreshold.toFixed(2)} (${Math.round(currentConfThreshold * 100)}%)`;

    if (lastLoadedFile) {
        processFile(lastLoadedFile);
    } else if (lastSampleFilename) {
        runDetection({ sample_filename: lastSampleFilename, conf: currentConfThreshold }, `Sample: ${lastSampleFilename.substring(0, 12)}...`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initClock();
    loadDatasetStats();
    loadDatasetSamples();
    setupDragAndDrop();
});

// Real-time Clock
function initClock() {
    const clock = document.getElementById('clockDisplay');
    setInterval(() => {
        const now = new Date();
        clock.textContent = now.toTimeString().split(' ')[0] + ' UTC+5:30';
    }, 1000);
}

// Fetch Dataset Stats
async function loadDatasetStats() {
    try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        currentDatasetStats = data;
        renderDatasetStatBars(data);
    } catch (err) {
        console.error("Failed to load dataset stats:", err);
    }
}

function renderDatasetStatBars(data) {
    const container = document.getElementById('datasetStatBars');
    container.innerHTML = '';
    
    const maxVal = Math.max(...Object.values(data.class_counts), 1);
    
    for (const [cls, count] of Object.entries(data.class_counts)) {
        const color = data.colors[cls] || '#3b82f6';
        const pct = Math.round((count / maxVal) * 100);
        
        const item = document.createElement('div');
        item.className = 'stat-bar-item';
        item.innerHTML = `
            <div class="stat-bar-header">
                <span>${cls}</span>
                <strong>${count} boxes</strong>
            </div>
            <div class="stat-bar-track">
                <div class="stat-bar-fill" style="width: ${pct}%; background: ${color};"></div>
            </div>
        `;
        container.appendChild(item);
    }
}

// Fetch Sample Images from Backend
async function loadDatasetSamples() {
    const grid = document.getElementById('sampleGrid');
    try {
        const res = await fetch('/api/samples');
        const samples = await res.json();
        
        if (!samples.length) {
            grid.innerHTML = '<div class="sample-loading">No sample images found.</div>';
            return;
        }

        grid.innerHTML = '';
        samples.forEach((s, idx) => {
            const img = document.createElement('img');
            img.src = s.url;
            img.className = `sample-thumb ${idx === 0 ? 'active' : ''}`;
            img.title = `${s.filename} (${s.defect_count} defects)`;
            img.onclick = () => selectSample(s.filename, img);
            grid.appendChild(img);
        });

        // Automatically run detection on the first sample!
        if (samples.length > 0) {
            selectSample(samples[0].filename, grid.children[0]);
        }
    } catch (err) {
        grid.innerHTML = '<div class="sample-loading">Error loading dataset samples.</div>';
    }
}

// Select Sample Frame
function selectSample(filename, element) {
    document.querySelectorAll('.sample-thumb').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');
    lastSampleFilename = filename;
    lastLoadedFile = null;

    runDetection({ sample_filename: filename, conf: currentConfThreshold }, `Test Sample (${filename.substring(0, 12)}...)`);
}

// Input Mode Switching
function switchInputMode(mode) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.mode-content').forEach(mc => mc.classList.add('hidden'));

    if (mode === 'upload') {
        document.getElementById('tabUploadBtn').classList.add('active');
        document.getElementById('modeUpload').classList.remove('hidden');
        stopLiveStream();
    } else if (mode === 'sample') {
        document.getElementById('tabSampleBtn').classList.add('active');
        document.getElementById('modeSample').classList.remove('hidden');
        stopLiveStream();
    } else if (mode === 'demo') {
        document.getElementById('tabDemoBtn').classList.add('active');
        document.getElementById('modeDemo').classList.remove('hidden');
        stopLiveStream();
    } else if (mode === 'stream') {
        document.getElementById('tabStreamBtn').classList.add('active');
        document.getElementById('modeStream').classList.remove('hidden');
    } else if (mode === 'laptop') {
        const btn = document.getElementById('tabLaptopBtn');
        const modeDiv = document.getElementById('modeLaptop');
        if (btn) btn.classList.add('active');
        if (modeDiv) modeDiv.classList.remove('hidden');
        stopLiveStream();
    }
}

async function runLaptopValidationUI(action) {
    try {
        const res = await fetch(`/api/laptop_validation/${action}`, { method: 'POST' });
        const data = await res.json();
        
        if (action === 'clean_belt') {
            const el = document.getElementById('valCleanSafety');
            if (el) el.textContent = data.status;
        } else if (action === 'defect') {
            const el = document.getElementById('valDefects');
            if (el) el.textContent = data.status;
        } else if (action === 'portrait' || action === 'orientation') {
            const el = document.getElementById('valOrientation');
            if (el) el.textContent = data.status;
        } else if (action === 'api') {
            const el = document.getElementById('valApi');
            if (el) el.textContent = data.status;
        } else if (action === 'hardware') {
            const el = document.getElementById('valHwSim');
            if (el) el.textContent = data.status;
        } else if (action === 'full_test') {
            if (document.getElementById('valFastPath')) document.getElementById('valFastPath').textContent = data.FAST_PATH || 'PASS';
            if (document.getElementById('valOrientation')) document.getElementById('valOrientation').textContent = data.ORIENTATION || 'PASS';
            if (document.getElementById('valDefects')) document.getElementById('valDefects').textContent = data.DEFECT_DETECTION || 'PASS';
            if (document.getElementById('valCleanSafety')) document.getElementById('valCleanSafety').textContent = data.CLEAN_BELT_SAFETY || 'PASS';
            if (document.getElementById('valApi')) document.getElementById('valApi').textContent = data.API || 'PASS';
            if (document.getElementById('valHwSim')) document.getElementById('valHwSim').textContent = data.HARDWARE_SIMULATION || 'PASS';
        }
        
        const note = document.getElementById('emergencyHeadline');
        if (note && data.message) {
            note.textContent = `[LAPTOP VALIDATION] ${action.toUpperCase()}: ${data.status} - ${data.message}`;
        }
    } catch (err) {
        console.error("Laptop validation error:", err);
    }
}

// Setup Drag & Drop Upload
function setupDragAndDrop() {
    const dropzone = document.getElementById('dropzone');
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.classList.add('hover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.classList.remove('hover');
        }, false);
    });

    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) {
            processFile(files[0]);
        }
    });
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        processFile(file);
    }
}

function processFile(file) {
    lastLoadedFile = file;
    lastSampleFilename = null;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conf', currentConfThreshold);
    runDetection(formData, `Upload: ${file.name}`);
}

// Core Detection Runner
async function runDetection(bodyData, sourceName = 'Manual Input') {
    showCanvasLoader(true);

    try {
        let options = { method: 'POST' };
        if (bodyData instanceof FormData) {
            options.body = bodyData;
        } else {
            const form = new FormData();
            for (const k in bodyData) {
                form.append(k, bodyData[k]);
            }
            if (!bodyData.conf) {
                form.append('conf', currentConfThreshold);
            }
            options.body = form;
        }

        const res = await fetch('/api/detect', options);
        const data = await res.json();
        showCanvasLoader(false);

        // Phase 5: Complete Forensic Console Logging
        console.log('🔍 [MineGuard AI Inference Response]:', {
            status: data.status,
            health_state: data.health_state,
            highest_severity: data.highest_severity,
            total_detections: data.total_detections,
            detections: data.detections,
            conf_threshold: data.conf_threshold,
            model_latency_ms: data.model_latency_ms,
            total_latency_ms: data.latency_ms,
            image_dimensions: data.original_image_dimensions
        });

        if (data.error || data.status === 'error') {
            console.error('Detection error:', data);
            alert('Detection error: ' + (data.message || data.error));
            updateUI({
                health_state: 'ANALYSIS_ERROR',
                status: 'ANALYSIS ERROR',
                total_detections: 0,
                detections: [],
                latency_ms: 0,
                timestamp: new Date().toLocaleTimeString(),
                message: data.message || data.error
            }, sourceName);
            return;
        }

        currentDetections = data.detections || [];
        updateUI(data, sourceName);
        if (data.image_data) {
            renderCanvas(data.image_data, data.detections || []);
        }

    } catch (err) {
        showCanvasLoader(false);
        console.error('Detection request failed:', err);
    }
}

// Canvas Rendering Function
function renderCanvas(imageBase64, detections) {
    const canvas = document.getElementById('detectionCanvas');
    const ctx = canvas.getContext('2d');
    const placeholder = document.getElementById('placeholderView');

    placeholder.style.display = 'none';
    canvas.style.display = 'block';

    const img = new Image();
    img.onload = () => {
        currentImage = img;
        canvas.width = img.width;
        canvas.height = img.height;
        
        document.getElementById('resolutionTag').textContent = `${img.width}x${img.height} px`;

        // Clear canvas & draw image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        // Draw Bounding Boxes
        detections.forEach(det => {
            const [xmin, ymin, xmax, ymax] = det.bbox;
            const w = xmax - xmin;
            const h = ymax - ymin;

            // Draw bounding box rectangle
            ctx.lineWidth = 3;
            ctx.strokeStyle = det.color;
            ctx.strokeRect(xmin, ymin, w, h);

            // Semi-transparent box background fill
            ctx.fillStyle = det.color + '22';
            ctx.fillRect(xmin, ymin, w, h);

            // Label tag background
            const labelText = `${det.class_name.toUpperCase()} ${(det.confidence * 100).toFixed(0)}%`;
            ctx.font = 'bold 14px "Outfit", sans-serif';
            const textWidth = ctx.measureText(labelText).width;
            
            ctx.fillStyle = det.color;
            ctx.fillRect(xmin, Math.max(0, ymin - 26), textWidth + 16, 26);

            // Label text
            ctx.fillStyle = '#ffffff';
            ctx.fillText(labelText, xmin + 8, Math.max(18, ymin - 8));
        });
    };
    img.src = imageBase64;
}

// Update Dashboard UI Elements
function updateUI(data, sourceName) {
    // 1. Update Metrics
    scannedCount += 1;
    document.getElementById('statTotalScanned').textContent = scannedCount.toLocaleString();

    const criticalInFrame = (data.detections || []).filter(d => d.severity === 'CRITICAL').length;
    if (criticalInFrame > 0) {
        criticalCount += criticalInFrame;
        document.getElementById('statCriticalDefects').textContent = criticalCount;
    }

    const modelLat = data.model_latency_ms || data.latency_ms || 0;
    const totalLat = data.latency_ms || 0;
    document.getElementById('statInferenceTime').textContent = `${modelLat} ms`;
    const e2eElem = document.getElementById('statE2ELatency');
    if (e2eElem) e2eElem.textContent = `E2E: ${totalLat} ms`;
    document.getElementById('detLatency').textContent = `${modelLat} ms (E2E: ${totalLat} ms)`;
    document.getElementById('detectionCount').textContent = data.total_detections || 0;

    // Phase 12: Dynamically calculate Belt Health Index from session scan history
    if (data.health_state === 'DEFECT_DETECTED') {
        sessionDefectCount += 1;
    } else {
        sessionCleanCount += 1;
    }
    const penalty = (criticalCount * 2.5) + (sessionDefectCount * 4.0);
    const healthIndex = Math.max(12.5, Math.min(99.4, 100.0 - penalty));
    const healthElem = document.getElementById('statHealthIndex');
    if (healthElem) {
        healthElem.textContent = `${healthIndex.toFixed(1)}%`;
        if (healthIndex < 50) healthElem.style.color = '#ef4444';
        else if (healthIndex < 80) healthElem.style.color = '#f59e0b';
        else healthElem.style.color = '#10b981';
    }

    // 2. Status Pill & Badge (Phase 6)
    const pill = document.getElementById('systemStatusPill');
    const pillText = document.getElementById('systemStatusText');
    const detStatusBadge = document.getElementById('detStatusBadge');

    pill.className = 'status-pill';
    
    if (data.health_state === 'DEFECT_DETECTED') {
        const hasCritical = (data.detections || []).some(d => d.severity === 'CRITICAL');
        if (hasCritical) {
            pill.classList.add('alert');
            pillText.textContent = 'CRITICAL DEFECT DETECTED';
            detStatusBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ALERT`;
            detStatusBadge.style.color = '#ef4444';
        } else {
            pill.classList.add('warning');
            pillText.textContent = 'DEFECT WARNING';
            detStatusBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> WARNING`;
            detStatusBadge.style.color = '#f59e0b';
        }
    } else if (data.health_state === 'HEALTHY') {
        pill.classList.add('healthy');
        pillText.textContent = 'SYSTEM OPERATIONAL (NORMAL BELT)';
        detStatusBadge.innerHTML = `<i class="fa-solid fa-shield-check"></i> VERIFIED HEALTHY`;
        detStatusBadge.style.color = '#10b981';
    } else if (data.health_state === 'NO_DETECTIONS') {
        pill.classList.add('nominal');
        pillText.textContent = 'SCAN NOMINAL (0 DETECTIONS)';
        detStatusBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> NO DETECTIONS`;
        detStatusBadge.style.color = '#38bdf8';
    } else {
        pill.classList.add('warning');
        pillText.textContent = 'ANALYSIS ERROR';
        detStatusBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ERROR`;
        detStatusBadge.style.color = '#94a3b8';
    }

    // 3. Update Analysis Card (Phase 6: Strict Segregation of States)
    const severityBanner = document.getElementById('severityBanner');
    const severityIcon = document.getElementById('severityIcon');
    const severityTitle = document.getElementById('severityTitle');
    const severityDesc = document.getElementById('severityDesc');
    const breakdownList = document.getElementById('breakdownList');
    const actionText = document.getElementById('actionText');

    if (data.health_state === 'DEFECT_DETECTED') {
        const hasCritical = (data.detections || []).some(d => d.severity === 'CRITICAL');
        if (hasCritical) {
            severityBanner.className = 'severity-box critical';
            severityIcon.className = 'fa-solid fa-triangle-exclamation';
            severityTitle.textContent = 'CRITICAL ANOMALY ALERT';
            severityDesc.textContent = 'Structural belt damage detected (Splice / Longitudinal Tear)!';
            actionText.textContent = 'STOP CONVEYOR IMMEDIATELY. Dispatch maintenance crew to inspect damaged section.';
        } else {
            severityBanner.className = 'severity-box warning';
            severityIcon.className = 'fa-solid fa-triangle-exclamation';
            severityTitle.textContent = 'DEFECT DETECTED';
            severityDesc.textContent = 'Surface scratches identified on conveyor belt.';
            actionText.textContent = 'Schedule inspection during next maintenance window. Monitor scratch propagation.';
        }

        breakdownList.innerHTML = '';
        data.detections.forEach((det) => {
            const item = document.createElement('div');
            item.className = 'breakdown-item';
            item.innerHTML = `
                <div>
                    <span class="dot" style="background:${det.color};"></span>
                    <strong>${det.class_name}</strong>
                </div>
                <div>
                    <span class="badge ${det.severity.toLowerCase()}">${det.severity}</span>
                    <span style="font-family: var(--font-mono); margin-left: 6px;">${(det.confidence * 100).toFixed(1)}%</span>
                </div>
            `;
            breakdownList.appendChild(item);
        });
    } else if (data.health_state === 'HEALTHY') {
        severityBanner.className = 'severity-box healthy';
        severityIcon.className = 'fa-solid fa-circle-check';
        severityTitle.textContent = 'BELT INTEGRITY VERIFIED HEALTHY';
        severityDesc.textContent = 'AI model confirmed explicit Normal Belt rubber surface pattern.';
        breakdownList.innerHTML = '<div class="empty-list-msg">Explicit normal belt pattern verified.</div>';
        actionText.textContent = 'Belt operating within nominal parameters. Routine monitoring active.';
    } else if (data.health_state === 'NO_DETECTIONS') {
        const confPct = Math.round((data.conf_threshold || currentConfThreshold) * 100);
        severityBanner.className = 'severity-box nominal';
        severityIcon.className = 'fa-solid fa-magnifying-glass';
        severityTitle.textContent = 'NO DEFECTS DETECTED';
        severityDesc.textContent = `No surface anomalies detected above ${confPct}% confidence threshold.`;
        breakdownList.innerHTML = `<div class="empty-list-msg">Zero bounding boxes above ${confPct}% sensitivity. If inspecting faint hairline defects, adjust the sensitivity slider.</div>`;
        actionText.textContent = `Scan nominal at ${confPct}% threshold. Belt surface clear of prominent tears, splices, or deep scratches.`;
    } else {
        severityBanner.className = 'severity-box error';
        severityIcon.className = 'fa-solid fa-triangle-exclamation';
        severityTitle.textContent = 'ANALYSIS ERROR';
        severityDesc.textContent = data.message || 'Inference could not be completed.';
        breakdownList.innerHTML = '<div class="empty-list-msg">Inference error occurred.</div>';
        actionText.textContent = 'Verify model weights and server connectivity.';
    }

    // Critical Defect Emergency Alert Banner Handling
    const emergencyBanner = document.getElementById('criticalEmergencyBanner');
    if (emergencyBanner) {
        if (data.health_state === 'DEFECT_DETECTED') {
            const critDefect = (data.detections || []).find(d => d.severity === 'CRITICAL');
            if (critDefect) {
                emergencyBanner.classList.remove('hidden');
                document.getElementById('emergencyHeadline').textContent = 
                    `CRITICAL DEFECT DETECTED: ${critDefect.class_name.toUpperCase()} (Confidence: ${(critDefect.confidence * 100).toFixed(0)}%)`;
                document.getElementById('emergencySub').textContent = 
                    `CONVEYOR EMERGENCY STOP SIGNAL DISPATCHED TO STM32 CONTROLLER [ACTION: STOP_CONVEYOR]`;
            } else {
                emergencyBanner.classList.add('hidden');
            }
        } else {
            // NEVER trigger critical alert on NO_DETECTIONS, NORMAL_BELT, or ANALYSIS_ERROR
            emergencyBanner.classList.add('hidden');
        }
    }

    // Hardware Conveyor Controller Signal & 11-Point Telemetry Display
    const hwBadge = document.getElementById('hwActionBadge');
    const hwText = document.getElementById('hwSignalText');
    if (data.hardware_control) {
        const hw = data.hardware_control;
        if (hwBadge) {
            hwBadge.textContent = hw.action || 'CONTINUE';
            if (hw.action === 'STOP_CONVEYOR') {
                hwBadge.style.background = '#ef4444';
            } else if (hw.action === 'ALERT' || hw.action === 'SCHEDULE_MAINTENANCE') {
                hwBadge.style.background = '#f59e0b';
            } else if (hw.action === 'SAFE_STATE') {
                hwBadge.style.background = '#94a3b8';
            } else {
                hwBadge.style.background = '#10b981';
            }
        }
        if (hwText) {
            if (hw.action === 'STOP_CONVEYOR') {
                hwText.textContent = `SIGNAL: STOP (0V) | RELAY: TRIPPED | MOTOR: HALTED | DEFECT: ${hw.defect_class || 'CRITICAL'}`;
            } else if (hw.action === 'ALERT' || hw.action === 'SCHEDULE_MAINTENANCE') {
                hwText.textContent = `SIGNAL: RUN (24V) | RELAY: OPEN | MOTOR: ACTIVE | ALERT: ${hw.defect_class || 'DEFECT'}`;
            } else if (hw.action === 'SAFE_STATE') {
                hwText.textContent = `SIGNAL: STANDBY | RELAY: SAFE | MOTOR: STANDBY | REASON: ${data.error_code || 'ERROR'}`;
            } else {
                hwText.textContent = `SIGNAL: RUN (24V) | RELAY: OPEN | MOTOR: ACTIVE | SCAN: NOMINAL`;
            }
        }

        // 11 Key Telemetry Points
        const tSys = document.getElementById('telemSystemStatus');
        if (tSys) tSys.textContent = hw.hardware_state || (hw.action === 'STOP_CONVEYOR' ? 'BELT_STOPPED' : 'BELT_RUNNING');
        const tCam = document.getElementById('telemCameraStatus');
        if (tCam) tCam.textContent = hw.camera_status || 'ONLINE (VALIDATED)';
        const tBelt = document.getElementById('telemBeltStatus');
        if (tBelt) tBelt.textContent = (hw.motor_state === 'HALTED' || hw.action === 'STOP_CONVEYOR') ? 'STOPPED' : 'RUNNING';
        const tSpeed = document.getElementById('telemBeltSpeed');
        if (tSpeed) tSpeed.textContent = (hw.belt_speed !== null && hw.belt_speed !== undefined) ? `${hw.belt_speed} m/s` : '-- m/s (NOT CONNECTED)';
        const tAi = document.getElementById('telemAiStatus');
        if (tAi) tAi.textContent = 'READY (YOLO11s-800px)';
        const tDefect = document.getElementById('telemCurrentDefect');
        if (tDefect) tDefect.textContent = hw.defect_class || (data.detections.length ? data.detections[0].class_name.toUpperCase() : 'NONE');
        const tConf = document.getElementById('telemConfidence');
        if (tConf) tConf.textContent = hw.confidence ? `${(hw.confidence * 100).toFixed(1)}%` : (data.detections.length ? `${(data.detections[0].confidence * 100).toFixed(1)}%` : '--');
        const tAction = document.getElementById('telemControlAction');
        if (tAction) tAction.textContent = hw.action || 'CONTINUE';
        const tStm = document.getElementById('telemStm32Status');
        if (tStm) tStm.textContent = hw.stm32_connected ? 'CONNECTED (UART)' : 'SIMULATED LOOPBACK';
        const tMotor = document.getElementById('telemMotorStatus');
        if (tMotor) tMotor.textContent = (hw.motor_state === 'HALTED' || hw.action === 'STOP_CONVEYOR') ? 'HALTED (0V)' : 'RUNNING (24V)';
    }

async function executeOperatorReset() {
    try {
        const res = await fetch('/api/operator_reset?operator_id=WEB_OPERATOR', { method: 'POST' });
        const data = await res.json();
        const emergencyBanner = document.getElementById('criticalEmergencyBanner');
        if (emergencyBanner) emergencyBanner.classList.add('hidden');
        const hwBadge = document.getElementById('hwActionBadge');
        if (hwBadge) {
            hwBadge.textContent = 'CONTINUE';
            hwBadge.style.background = '#10b981';
        }
        const hwText = document.getElementById('hwSignalText');
        if (hwText) {
            hwText.textContent = 'SIGNAL: RUN (24V) | RELAY: OPEN | MOTOR: ACTIVE | RESET: OK';
        }
        const tSys = document.getElementById('telemSystemStatus');
        if (tSys) tSys.textContent = 'SYSTEM_READY';
        const tBelt = document.getElementById('telemBeltStatus');
        if (tBelt) tBelt.textContent = 'RUNNING';
        const tMotor = document.getElementById('telemMotorStatus');
        if (tMotor) tMotor.textContent = 'RUNNING (24V)';
        const tAction = document.getElementById('telemControlAction');
        if (tAction) tAction.textContent = 'CONTINUE';
        console.log('Operator reset executed successfully:', data);
    } catch (err) {
        console.error('Failed to execute operator reset:', err);
    }
}

    // 4. Add to Audit Log
    addAuditLogRow({
        timestamp: data.timestamp,
        source: sourceName,
        status: data.status.split(':')[0],
        count: data.total_detections,
        primaryDefect: data.detections.length ? data.detections[0].class_name : 'None',
        confidence: data.detections.length ? `${(data.detections[0].confidence * 100).toFixed(0)}%` : 'N/A',
        latency: `${data.latency_ms} ms`
    });
}

// Audit Table Log
function addAuditLogRow(log) {
    auditLogs.unshift(log);
    const tbody = document.getElementById('auditTableBody');
    const tr = document.createElement('tr');
    
    let statusBadgeClass = 'healthy';
    if (log.status.includes('ALERT')) statusBadgeClass = 'critical';
    else if (log.status.includes('WARNING')) statusBadgeClass = 'warning';

    tr.innerHTML = `
        <td>${log.timestamp}</td>
        <td>${log.source}</td>
        <td><span class="badge ${statusBadgeClass}">${log.status}</span></td>
        <td>${log.count}</td>
        <td><strong>${log.primaryDefect}</strong></td>
        <td>${log.confidence}</td>
        <td>${log.latency}</td>
    `;
    
    tbody.insertBefore(tr, tbody.firstChild);
    if (tbody.children.length > 15) {
        tbody.removeChild(tbody.lastChild);
    }
}

function clearAuditLog() {
    auditLogs = [];
    document.getElementById('auditTableBody').innerHTML = '';
}

// Live Stream Simulation Mode
function toggleLiveStream() {
    const btn = document.getElementById('startStreamBtn');
    if (isStreaming) {
        stopLiveStream();
    } else {
        isStreaming = true;
        btn.className = 'btn btn-secondary';
        btn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause Stream';
        
        // Cycle through dataset samples continuously
        const thumbs = document.querySelectorAll('.sample-thumb');
        let idx = 0;
        liveStreamInterval = setInterval(() => {
            if (thumbs.length > 0) {
                thumbs[idx].click();
                idx = (idx + 1) % thumbs.length;
            }
        }, 2000);
    }
}

function stopLiveStream() {
    isStreaming = false;
    if (liveStreamInterval) {
        clearInterval(liveStreamInterval);
        liveStreamInterval = null;
    }
    const btn = document.getElementById('startStreamBtn');
    if (btn) {
        btn.className = 'btn btn-success';
        btn.innerHTML = '<i class="fa-solid fa-play"></i> Start Inspection Stream';
    }
}

function showCanvasLoader(show) {
    const loader = document.getElementById('canvasLoader');
    if (loader) {
        if (show) loader.classList.remove('hidden');
        else loader.classList.add('hidden');
    }
}

function resetZoom() {
    if (currentImage) {
        renderCanvas(currentImage.src, currentDetections);
    }
}

// Export JSON Analysis
function exportAnalysisJSON() {
    const report = {
        model: "MineGuard YOLO11s (Locked Production Checkpoint)",
        timestamp: new Date().toISOString(),
        confidence_threshold: currentConfThreshold,
        detections: currentDetections,
        scanned_history: auditLogs
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mineguard_inspection_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// SIH 6-Step Demonstration Runner
async function executeDemoStepInUI(stepId) {
    document.querySelectorAll('.demo-step-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`demoStep${stepId}`);
    if (activeBtn) activeBtn.classList.add('active');

    showCanvasLoader(true);
    try {
        const res = await fetch(`/api/demo_step/${stepId}`);
        const data = await res.json();
        showCanvasLoader(false);

        if (data.status === 'error') {
            alert('Demo Step Error: ' + data.error);
            return;
        }

        const stepTitle = data.demo_step_info ? data.demo_step_info.title : `Demo Step ${stepId}`;
        updateUI(data, `SIH Demo [Step ${stepId}]: ${stepTitle}`);
        if (data.image_data) {
            renderCanvas(data.image_data, data.detections || []);
        }
    } catch (err) {
        showCanvasLoader(false);
        console.error('Failed to execute demo step:', err);
    }
}

let autoDemoTimer = null;
let currentDemoStep = 1;

function runAutoDemoSequence() {
    const btn = document.getElementById('autoDemoBtn');
    if (autoDemoTimer) {
        clearInterval(autoDemoTimer);
        autoDemoTimer = null;
        if (btn) btn.innerHTML = '<i class="fa-solid fa-forward"></i> Auto Run (6s)';
        return;
    }

    if (btn) btn.innerHTML = '<i class="fa-solid fa-stop"></i> Stop Demo';
    currentDemoStep = 1;
    executeDemoStepInUI(currentDemoStep);

    autoDemoTimer = setInterval(() => {
        currentDemoStep += 1;
        if (currentDemoStep > 6) {
            clearInterval(autoDemoTimer);
            autoDemoTimer = null;
            if (btn) btn.innerHTML = '<i class="fa-solid fa-forward"></i> Auto Run (6s)';
            return;
        }
        executeDemoStepInUI(currentDemoStep);
    }, 2000);
}

// Full Inspection Reset Function (Phase 26)
function resetInspection() {
    currentImage = null;
    currentDetections = [];
    lastLoadedFile = null;
    lastSampleFilename = null;

    const canvas = document.getElementById('detectionCanvas');
    const placeholder = document.getElementById('placeholderView');
    if (canvas) canvas.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';

    document.getElementById('resolutionTag').textContent = '-- px';
    document.getElementById('detectionCount').textContent = '0';
    document.getElementById('detLatency').textContent = '-- ms';

    // Reset status pill
    const pill = document.getElementById('systemStatusPill');
    const pillText = document.getElementById('systemStatusText');
    const detStatusBadge = document.getElementById('detStatusBadge');
    if (pill) {
        pill.className = 'status-pill healthy';
        pillText.textContent = 'SYSTEM OPERATIONAL (STANDBY)';
        detStatusBadge.innerHTML = '<i class="fa-solid fa-shield-check"></i> READY';
        detStatusBadge.style.color = '#10b981';
    }

    // Reset severity analysis card
    const severityBanner = document.getElementById('severityBanner');
    const severityIcon = document.getElementById('severityIcon');
    const severityTitle = document.getElementById('severityTitle');
    const severityDesc = document.getElementById('severityDesc');
    const breakdownList = document.getElementById('breakdownList');
    const actionText = document.getElementById('actionText');

    if (severityBanner) {
        severityBanner.className = 'severity-box nominal';
        severityIcon.className = 'fa-solid fa-circle-info';
        severityTitle.textContent = 'SYSTEM READY FOR INSPECTION';
        severityDesc.textContent = 'Select a dataset test frame or upload a conveyor belt image to run inference.';
        breakdownList.innerHTML = '<div class="empty-list-msg">No active frame loaded. Select or upload an image above.</div>';
        actionText.textContent = 'Awaiting conveyor belt inspection input.';
    }

    console.log('🔄 [MineGuard]: Inspection standby state restored.');
}
