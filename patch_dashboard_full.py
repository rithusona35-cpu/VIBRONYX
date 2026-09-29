import os
import re

# 1. Update index.html
html_path = r'D:\SIH\anband told\templates\index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Replace metrics grid
old_metrics = """        <!-- Metrics Overview Section -->
        <section class="metrics-grid">
            <div class="metric-card">
                <div class="metric-icon blue"><i class="fa-solid fa-eye"></i></div>
                <div class="metric-info">
                    <span class="metric-label">Total Scanned Frames</span>
                    <h3 id="statTotalScanned">1,482</h3>
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-icon red"><i class="fa-solid fa-triangle-exclamation"></i></div>
                <div class="metric-info">
                    <span class="metric-label">Critical Anomaly Count</span>
                    <h3 id="statCriticalDefects">28</h3>
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-icon emerald"><i class="fa-solid fa-heart-pulse"></i></div>
                <div class="metric-info">
                    <span class="metric-label">Belt Health Index</span>
                    <h3 id="statHealthIndex">94.2%</h3>
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-icon purple"><i class="fa-solid fa-bolt"></i></div>
                <div class="metric-info">
                    <span class="metric-label">Inference Latency</span>
                    <h3 id="statInferenceTime">12.4 ms</h3>
                </div>
            </div>
        </section>"""

new_metrics = """        <!-- Metrics Overview Section -->
        <section class="metrics-grid">
            <div class="metric-card">
                <div class="metric-icon blue"><i class="fa-solid fa-eye"></i></div>
                <div class="metric-info">
                    <span class="metric-label">Total Inspection Frames</span>
                    <h3 id="statTotalScanned">1,482</h3>
                    <span style="font-size: 0.72rem; color: #64748b;">1,482 Baseline + Session</span>
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-icon red"><i class="fa-solid fa-triangle-exclamation"></i></div>
                <div class="metric-info">
                    <span class="metric-label">Session Critical Defects</span>
                    <h3 id="statCriticalDefects">0</h3>
                    <span style="font-size: 0.72rem; color: #64748b;">Real-time Detected</span>
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-icon emerald"><i class="fa-solid fa-heart-pulse"></i></div>
                <div class="metric-info">
                    <span class="metric-label">Belt Health Index (Live)</span>
                    <h3 id="statHealthIndex">100.0%</h3>
                    <span style="font-size: 0.72rem; color: #64748b;">Deterministic Penalty Model</span>
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-icon purple"><i class="fa-solid fa-bolt"></i></div>
                <div class="metric-info">
                    <span class="metric-label">Model Inference Latency</span>
                    <h3 id="statInferenceTime">-- ms</h3>
                    <span id="statE2ELatency" style="font-size: 0.72rem; color: #64748b;">E2E: -- ms</span>
                </div>
            </div>
        </section>"""

if 'Total Inspection Frames' not in html:
    html = html.replace(old_metrics, new_metrics)

# Fix Confidence Slider wording in index.html
old_slider_pattern = re.compile(r'<!-- Confidence Sensitivity Control -->.*?</div>\s*</div>', re.DOTALL)
new_slider = """<!-- Confidence Sensitivity Control -->
                <div class="threshold-card" style="margin-top: 1rem; margin-bottom: 1rem; padding: 0.85rem 1rem; background: rgba(30, 41, 59, 0.7); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.08);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <span style="font-size: 0.85rem; font-weight: 600; color: #94a3b8;"><i class="fa-solid fa-sliders"></i> Minimum Detection Confidence</span>
                        <strong id="confValDisplay" style="font-size: 0.85rem; color: #38bdf8; font-family: var(--font-mono);">0.25 (25%)</strong>
                    </div>
                    <input type="range" id="confSlider" min="0.10" max="0.75" step="0.05" value="0.25" style="width: 100%; accent-color: #38bdf8; cursor: pointer;" oninput="onConfidenceChange(this.value)">
                    <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #64748b; margin-top: 4px;">
                        <span>0.10 (High Recall)</span>
                        <span>0.25 (Balanced Default)</span>
                        <span>0.75 (High Precision)</span>
                    </div>
                </div>"""

html = old_slider_pattern.sub(new_slider, html)

# Fix dataset defect distribution title
html = html.replace('<h4>Dataset Defect Distribution</h4>', 
                    '<h4><i class="fa-solid fa-chart-pie"></i> Dataset Defect Distribution (Offline Benchmark)</h4>\n                    <span style="font-size: 0.72rem; color: #64748b; display: block; margin-bottom: 8px;">Cumulative training & validation distribution across 1,556 frames</span>')

# Update reset button onclick
html = html.replace('onclick="resetZoom()" title="Reset View"', 'onclick="resetInspection()" title="Reset Inspection Standby"')

# Fix simulation overlay tag
html = html.replace('SIMULATING LIVE CONVEYOR FEED', 'SIMULATION (Live Feed Simulation Mode)')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
print("Updated index.html successfully")


# 2. Update main.js
js_path = r'D:\SIH\anband told\static\js\main.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Update initial counts
js = js.replace('let criticalCount = 28;', 'let criticalCount = 0;')

# Update onConfidenceChange display
old_conf_disp = """    const disp = document.getElementById('confValDisplay');
    if (disp) disp.textContent = currentConfThreshold.toFixed(2);"""
new_conf_disp = """    const disp = document.getElementById('confValDisplay');
    if (disp) disp.textContent = `${currentConfThreshold.toFixed(2)} (${Math.round(currentConfThreshold * 100)}%)`;"""
if old_conf_disp in js:
    js = js.replace(old_conf_disp, new_conf_disp)

# Update statE2ELatency display in updateUI
old_lat_update = """    const modelLat = data.model_latency_ms || data.latency_ms || 0;
    const totalLat = data.latency_ms || 0;
    document.getElementById('statInferenceTime').textContent = `${modelLat} ms`;
    document.getElementById('detLatency').textContent = `${modelLat} ms (E2E: ${totalLat} ms)`;"""

new_lat_update = """    const modelLat = data.model_latency_ms || data.latency_ms || 0;
    const totalLat = data.latency_ms || 0;
    document.getElementById('statInferenceTime').textContent = `${modelLat} ms`;
    const e2eElem = document.getElementById('statE2ELatency');
    if (e2eElem) e2eElem.textContent = `E2E: ${totalLat} ms`;
    document.getElementById('detLatency').textContent = `${modelLat} ms (E2E: ${totalLat} ms)`;"""

if old_lat_update in js:
    js = js.replace(old_lat_update, new_lat_update)

# Add resetInspection implementation
reset_fn = """
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
"""

if 'function resetInspection()' not in js:
    js += "\n" + reset_fn

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)
print("Updated main.js successfully")
