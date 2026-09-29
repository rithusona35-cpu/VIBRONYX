# MineGuard AI — Intelligent Conveyor Safety & Predictive Monitoring Platform
**Smart India Hackathon (SIH) Problem Statement 26008**  
*AI-Based Industrial Conveyor Belt Defect Detection, Predictive Monitoring and Safety-Oriented Shutdown System*

---

## 1. Project Purpose & Scope

**MineGuard AI** is a supervisory engineering monitoring and AI-assisted defect inspection interface developed for a physical industrial conveyor belt prototype. The platform bridges physical microcontroller sensor telemetry, cloud-native real-time data ingestion, and computer vision defect recognition into an operator-centric control room interface.

### Physical Prototype Hardware Architecture
- **Microcontroller**: ESP32 Dev Module (Wi-Fi 802.11b/g/n Telemetry Transmitter)
- **Vibration Monitoring**: MPU6050 6-DOF IMU (Bearing oscillation & mechanical vibration)
- **Temperature Monitoring**: DS18B20 1-Wire Digital Sensor (Drive head pulley bearing temperature)
- **Load Monitoring**: HX711 24-bit ADC + Precision Load Cell (Carrying strand weight & load distribution)
- **Current Monitoring**: ACS712 Hall-Effect Transducer (12V DC motor operational current draw)
- **Encoder System**: Dual Optical Incremental Encoders (Drive roller RPM1 & Driven roller RPM2)
- **Clearance / Wear Estimation**: Ultrasonic Transducers (Prototype belt clearance / sag estimation)
- **Structure**: Precision aluminium extrusion tabletop conveyor chassis with PVC industrial belt & 12V geared drive motor.

> **Operational Boundary**: This web interface is strictly an **engineering supervisory dashboard**. Pin wiring, GPIO assignments, and raw firmware implementation details are segregated to hardware diagnostics.

---

## 2. Cloud Architecture & Data Ingestion

```
Physical Prototype                     Cloud Database                    Frontend Monitoring
[Sensors + Motor]                       [PostgreSQL]                       [Control Room]
       │                                     │                                    │
    [ESP32] ──(HTTPS/REST/WiFi JSON)──> [Supabase DB] ──(Realtime WS/Poller)──> [MineGuard AI]
                                     Table: conveyor_telemetry             (React + Vite)
```

- **Cloud Backend**: Supabase PostgreSQL (`https://tffhdzctkfdmzamwqxal.supabase.co`)
- **Telemetry Table**: `public.conveyor_telemetry`
- **Device Node**: `critical_zone`
- **Realtime Pipeline**: Supabase Realtime channel subscription with resilient 2.0s background polling fallback.
- **Stale Data Watchdog**: Telemetry older than 15 seconds automatically flags the station as `OFFLINE / DATA STALE`.
- **Zero Fake Data Policy**: Never synthesizes random sensor fluctuations or artificial waveforms. When real data is missing or out-of-range, explicit states (`N/A`, `No Echo`, `Sensor unavailable`, `Conveyor Stopped`) are displayed.

---

## 3. Technology Stack

- **Framework**: React 19.2 + TypeScript
- **Bundler & Tooling**: Vite 8.3
- **Styling**: Tailwind CSS v4 (Industrial warm off-white / light neutral control room palette)
- **Data Visualization**: Recharts (Dynamic SVG telemetry trends)
- **Icons**: Lucide React
- **Cloud Client**: `@supabase/supabase-js` v2.49 (Public anon key transport)

---

## 4. Environment Variables & Security

MineGuard AI enforces a zero-secrets policy in client-side code:
- **Never expose** `service_role` keys, private API keys, database passwords, or JWT secrets in client builds.
- All browser interactions utilize the public Supabase `anon` key protected by Row Level Security (RLS) policies.

### Configuration Template (`.env.example`)
```env
# Supabase Public Telemetry Endpoint
VITE_SUPABASE_URL=https://tffhdzctkfdmzamwqxal.supabase.co
VITE_SUPABASE_ANON_KEY=your_public_anon_key_here
```

To configure locally:
```bash
cp .env.example .env
```

---

## 5. Local Development Workflow

### Prerequisites
- Node.js 18+ or 20+ LTS
- npm 9+

### Quick Start
```bash
# 1. Install root & dashboard dependencies
npm install
cd mineguard-dashboard && npm install && cd ..

# 2. Start Vite local development server
npm run dev
# or from mineguard-dashboard:
npm --prefix mineguard-dashboard run dev
```

Visit `http://localhost:5173/` in your browser.

---

## 6. Production Build & Validation

To compile the production build:
```bash
npm run build
```

This compiles optimized client bundles into:
- `mineguard-dashboard/dist/`
- `dist/` (mirrored for root host providers)

To preview the production bundle locally:
```bash
npm --prefix mineguard-dashboard run preview
```

---

## 7. Free Public Deployment on Netlify

MineGuard AI is fully pre-configured for free static hosting on [Netlify](https://www.netlify.com/):

1. **Push Code to GitHub**: Create a repository with the project files.
2. **Import into Netlify**: Select your repository on Netlify.
3. **Configure Build Settings**:
   - **Base directory**: `mineguard-dashboard` (or leave empty if deploying standalone package)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. **Configure Environment Variables** in Netlify Site Settings > Build & Deploy > Environment:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. **Deploy Site**: Netlify automatically compiles assets and enables SPA routing via the included `netlify.toml`.

---

## 8. Camera & AI Belt Defect Inspection

The AI Inspection page provides a multi-input visual defect inspection workstation:
1. **Live Camera Access**: Uses `navigator.mediaDevices.getUserMedia({ video: true })`.
   - **Note on HTTPS**: Modern browsers require an **HTTPS origin** (such as Netlify's `*.netlify.app` or `localhost`) for camera permissions.
2. **Local Image Upload**: Operators can browse and upload local high-resolution belt inspection photos for analysis.
3. **Inspection Classes**:
   - `Normal Belt`: Surface intact, continuous rubber cover.
   - `Slight Scratch`: Surface-level abrasive wear.
   - `Deep Scratch`: Severe gouge penetrating towards carcass layer.
   - `Longitudinal Tear`: Critical axial tear requiring immediate shutdown.
   - `Belt Splice Transition`: Mechanical fastener joint or vulcanized seam inspection.
4. **Backend Connectivity**: If a local Python YOLO server (`http://127.0.0.1:5000/api/detect`) is active, live bounding boxes and tensor confidences are rendered. If offline, the interface seamlessly engages a client-side diagnostic fallback with clear status indications (zero fake inference).

---

## 9. Physical Safety vs Supervisory Monitoring

> **CRITICAL SAFETY BOUNDARY**:  
> MineGuard AI functions strictly as a **supervisory monitoring and predictive inspection interface**.  
> The physical emergency stop mechanism—including the physical E-STOP push button, manual safety reset, safety latch relay, motor contactor de-energization, and microcontroller watchdog timer—resides locally on the conveyor hardware.  
> In compliance with machinery safety principles, **no software button on the web interface can replace or bypass local physical safety interlocks**.

---

## 10. Prototype Limitations & Regulatory Disclaimer

- **Academic Prototype**: MineGuard AI is an engineering demonstration prototype developed for the Smart India Hackathon (SIH 26008).
- **No False Certifications**: This prototype is **not certified** under ISO 13849 (PL d/e), IEC 62061 (SIL 1/2/3), or ATEX underground explosion-proof standards.
- **Sensor Accuracies**: Ultrasonic thickness measurements represent experimental prototype estimations subject to surface dust and acoustic reflection angles.
