import os
import re

# 1. Patch style.css
css_path = r'D:\SIH\anband told\static\css\style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

nominal_css = """
.severity-box.nominal { background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; }
.severity-box.error { background: rgba(148, 163, 184, 0.15); border: 1px solid rgba(148, 163, 184, 0.3); color: #94a3b8; }
.status-pill.nominal { background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; }
"""

if '.severity-box.nominal' not in css:
    css = css.replace('.severity-box.critical { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: var(--color-danger); }',
                      '.severity-box.critical { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: var(--color-danger); }\n' + nominal_css)
    with open(css_path, 'w', encoding='utf-8') as f:
        f.write(css)
    print("Patched style.css successfully")
else:
    print("style.css already contains nominal rules")


# 2. Patch index.html
html_path = r'D:\SIH\anband told\templates\index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

slider_html = """
                <!-- Confidence Sensitivity Control -->
                <div class="threshold-card" style="margin-top: 1rem; margin-bottom: 1rem; padding: 0.85rem 1rem; background: rgba(30, 41, 59, 0.7); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.08);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <span style="font-size: 0.85rem; font-weight: 600; color: #94a3b8;"><i class="fa-solid fa-sliders"></i> Confidence Threshold</span>
                        <strong id="confValDisplay" style="font-size: 0.85rem; color: #38bdf8; font-family: var(--font-mono);">0.25</strong>
                    </div>
                    <input type="range" id="confSlider" min="0.10" max="0.75" step="0.05" value="0.25" style="width: 100%; accent-color: #38bdf8; cursor: pointer;" oninput="onConfidenceChange(this.value)">
                    <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #64748b; margin-top: 4px;">
                        <span>0.10 (High Sensitivity)</span>
                        <span>0.25 (Default)</span>
                        <span>0.75 (Strict)</span>
                    </div>
                </div>
"""

if 'confSlider' not in html:
    html = html.replace('<!-- Class Legend Card -->', slider_html + '\n                <!-- Class Legend Card -->')
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print("Patched index.html with confidence slider")
else:
    print("index.html already contains confidence slider")


# 3. Patch main.js
js_path = r'D:\SIH\anband told\static\js\main.js'

with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Replace global state
old_globals = """let scannedCount = 1482;
let criticalCount = 28;"""

new_globals = """let scannedCount = 1482;
let criticalCount = 28;
let currentConfThreshold = 0.25;
let lastLoadedFile = null;
let lastSampleFilename = null;
let sessionDefectCount = 0;
let sessionCleanCount = 0;

function onConfidenceChange(val) {
    currentConfThreshold = parseFloat(val);
    const disp = document.getElementById('confValDisplay');
    if (disp) disp.textContent = currentConfThreshold.toFixed(2);

    if (lastLoadedFile) {
        processFile(lastLoadedFile);
    } else if (lastSampleFilename) {
        runDetection({ sample_filename: lastSampleFilename, conf: currentConfThreshold }, `Sample: ${lastSampleFilename.substring(0, 12)}...`);
    }
}"""

if 'currentConfThreshold' not in js:
    js = js.replace(old_globals, new_globals)

# Update selectSample
old_select = """function selectSample(filename, element) {
    document.querySelectorAll('.sample-thumb').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');

    runDetection({ sample_filename: filename }, `Test Sample (${filename.substring(0, 12)}...)`);
}"""

new_select = """function selectSample(filename, element) {
    document.querySelectorAll('.sample-thumb').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');
    lastSampleFilename = filename;
    lastLoadedFile = null;

    runDetection({ sample_filename: filename, conf: currentConfThreshold }, `Test Sample (${filename.substring(0, 12)}...)`);
}"""

if 'lastSampleFilename = filename;' not in js:
    js = js.replace(old_select, new_select)

# Update processFile
old_proc = """function processFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    runDetection(formData, `Upload: ${file.name}`);
}"""

new_proc = """function processFile(file) {
    lastLoadedFile = file;
    lastSampleFilename = null;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conf', currentConfThreshold);
    runDetection(formData, `Upload: ${file.name}`);
}"""

if 'lastLoadedFile = file;' not in js:
    js = js.replace(old_proc, new_proc)

# Update runDetection with full debug output (Phase 5)
old_run = """async function runDetection(bodyData, sourceName = 'Manual Input') {
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
            options.body = form;
        }

        const res = await fetch('/api/detect', options);
        const data = await res.json();
        showCanvasLoader(false);

        if (data.error) {
            alert('Detection error: ' + data.error);
            return;
        }

        currentDetections = data.detections;
        updateUI(data, sourceName);
        renderCanvas(data.image_data, data.detections);

    } catch (err) {
        showCanvasLoader(false);
        console.error('Detection request failed:', err);
    }
}"""

new_run = """async function runDetection(bodyData, sourceName = 'Manual Input') {
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
}"""

if 'Phase 5: Complete Forensic Console Logging' not in js:
    js = js.replace(old_run, new_run)

# Update updateUI with Phase 6 & Phase 12 logic
old_update_pattern = re.compile(r'function updateUI\(data, sourceName\) \{.*?addAuditLogRow\(\{', re.DOTALL)

new_update_ui = """function updateUI(data, sourceName) {
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

    // 4. Add to Audit Log
    addAuditLogRow({"""

js = old_update_pattern.sub(new_update_ui, js)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)
print("Patched main.js successfully")
