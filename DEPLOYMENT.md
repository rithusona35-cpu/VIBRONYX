# MineGuard AI — Final Public Deployment Guide
**Smart India Hackathon (SIH 26008)**  
*AI-Based Industrial Conveyor Belt Defect Detection, Predictive Monitoring & Safety Shutdown System*

---

## 1. System Architecture

MineGuard AI is deployed using a decoupled, production-grade microservice architecture:

```
┌─────────────────────────────────────────────────────────┐
│                     USER BROWSER                        │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND DASHBOARD                    │
│             React 19 + TypeScript + Vite                │
│    (Hosted on Vercel / Netlify / Cloudflare Pages)     │
│             Environment: VITE_API_BASE_URL              │
└──────────────┬───────────────────────────┬──────────────┘
               │                           │
               │ HTTPS (REST API)          │ WSS (Realtime Ingest)
               ▼                           ▼
┌──────────────────────────────┐ ┌────────────────────────┐
│     FASTAPI YOLO BACKEND     │ │   SUPABASE DATABASE    │
│    Python 3.10+ / ASGI       │ │  Telemetry Streaming  │
│ (Hosted on Render / HF Space)│ │     (Public Anon Role) │
│                              │ └────────────────────────┘
│  models/final_sih_model.pt   │
│   YOLO11s (800x800, CPU)     │
└──────────────────────────────┘
```

> **CRITICAL SECURITY GUARANTEE**:
> - The YOLO `.pt` model is never loaded into the client browser.
> - No secrets, service-role keys, or database administrative passwords exist in the frontend repository.
> - The model weights reside securely inside the backend inference container.

---

## 2. Free-Tier Hosting Recommendations

Both tiers can be operated on 100% free hosting tiers:

| Component | Recommended Free Platform | Free Tier Specs | URL Scheme |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** or **Netlify** | Unlimited bandwidth, global CDN edge, SSL | `https://mineguard-ai.vercel.app` |
| **Backend** | **Render** or **Hugging Face Spaces** | 512 MB – 16 GB RAM, Free CPU tier, HTTPS | `https://mineguard-api.onrender.com` |
| **Database** | **Supabase** (Existing Project) | 500 MB DB, Realtime Websockets, SSL | `https://tffhdzctkfdmzamwqxal.supabase.co` |

---

## 3. Backend Deployment (FastAPI + YOLO)

### Option A: Deploying on Render (Free Web Service)

1. Sign up or log in at [render.com](https://render.com/).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository containing the backend code (`fastapi_app.py`, `unified_preprocessor.py`, `models/final_sih_model.pt`, `requirements.txt`).
4. Configure service settings:
   - **Name**: `mineguard-ai-api`
   - **Environment**: `Python 3`
   - **Region**: Choose closest to your audience (e.g., Singapore / Frankfurt / Oregon)
   - **Branch**: `main`
   - **Root Directory**: Leave blank (or specify path if monorepo)
   - **Build Command**:
     ```bash
     pip install --upgrade pip && pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     uvicorn fastapi_app:app --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type**: `Free`
5. Configure Environment Variables in Render:
   ```env
   ALLOWED_ORIGINS=*
   PORT=8000
   ```
6. Click **Create Web Service**.
7. Once deployed, note your service URL: `https://mineguard-ai-api.onrender.com`.

---

### Option B: Deploying on Hugging Face Spaces (Free Docker / FastAPI)

1. Go to [huggingface.co/spaces](https://huggingface.co/spaces) and click **Create new Space**.
2. Select **Docker** or **Blank** SDK with **Free CPU (2 vCPU, 16 GB RAM)**.
3. Push `fastapi_app.py`, `unified_preprocessor.py`, `models/final_sih_model.pt`, and `requirements.txt`.
4. Create a `Dockerfile`:
   ```dockerfile
   FROM python:3.10-slim
   WORKDIR /app
   RUN apt-get update && apt-get install -y libgl1-mesa-glx libglib2.0-0 && rm -rf /var/lib/apt/lists/*
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   COPY . .
   EXPOSE 7860
   CMD ["uvicorn", "fastapi_app:app", "--host", "0.0.0.0", "--port", "7860"]
   ```
5. Your public endpoint will be available at `https://<user>-<space-name>.hf.space`.

---

## 4. Frontend Deployment (React / Vite)

### Deploying on Vercel or Netlify

1. Sign up or log in at [vercel.com](https://vercel.com/) or [netlify.com](https://netlify.com/).
2. Click **Add New Project** → Import your GitHub repository.
3. Configure the build parameters:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `mineguard-dashboard` (or root if using root package.json)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Add Environment Variables**:
   ```env
   VITE_API_BASE_URL=https://your-deployed-backend-url.onrender.com
   VITE_SUPABASE_URL=https://tffhdzctkfdmzamwqxal.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZmhkemN0a2ZkbXphbXdxeGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MTM4MTEsImV4cCI6MjEwNDE4OTgxMX0.rDc7I_VHd4Egypi311fXVvsvrpRqbgbYinOV32irioo
   ```
5. Click **Deploy**.
6. When deployment finishes, your MineGuard AI dashboard is live!

---

## 5. Verification & Health Test Instructions

Once deployed, execute the following smoke tests against the public URLs:

### 1. Test Backend Health
```bash
curl -X GET "https://YOUR-BACKEND-URL/health"
```
**Expected Response**:
```json
{"status": "online", "model_loaded": true}
```

### 2. Test Model Metadata
```bash
curl -X GET "https://YOUR-BACKEND-URL/model-info"
```
**Expected Response**:
Confirms model name, version (`YOLO11s-Small-800px`), and 5 defect classes without exposing filesystem paths.

### 3. Test Detection Endpoint (Critical Regression Test)
```bash
curl -X POST "https://YOUR-BACKEND-URL/api/detect" \
  -F "sample_filename=longitudinal_tear.jpg"
```
**Expected Response**:
```json
{
  "success": true,
  "class": "Longitudinal Tear",
  "confidence": 0.604,
  "severity": "CRITICAL"
}
```

### 4. Verify Frontend Dashboard
1. Open the public frontend URL in Google Chrome.
2. In the top header deployment panel, confirm:
   - `FRONTEND: ONLINE`
   - `YOLO API: ONLINE`
   - `MODEL: LOADED`
   - `DATABASE: CONNECTED`
   - `CAMERA: READY`
3. Navigate to **AI Belt Inspection**:
   - Status badge shows: `AI MODEL READY`.
   - Click **Run AI Inspection** on the loaded sample.
   - Result card displays expected class, genuine confidence (e.g. `60.4%`), bounding box overlay, and `PASS` result badge.

---

## 6. Cold-Start & Offline Handling Notes

- **Render Free Tier Spin-Down**: Free Render web services spin down after 15 minutes of inactivity. When a user first opens the dashboard, the backend takes ~40-50 seconds to boot up.
- **Graceful Dashboard Behavior**:
  - The dashboard remains fully operational.
  - The status badge clearly displays `AI MODEL OFFLINE` until the backend is awake.
  - If an inspection is triggered while waking, the dashboard displays:
    ```
    AI INFERENCE OFFLINE
    Inference service unreachable. Genuine neural tensor analysis cannot proceed.
    [RETRY CONNECTION]  [USE SAMPLE TEST]
    ```
  - **No Fake Predictions**: The system strictly refuses to synthesize artificial confidence or falsely declare the belt healthy.
  - Once the backend is online, the dashboard automatically transitions to `AI MODEL READY`.

---

## 7. Local Development Quickstart

To run the complete system locally:

```bash
# Terminal 1: Start FastAPI YOLO Backend (Port 8000)
python fastapi_app.py

# Terminal 2: Start React Frontend (Port 5173)
cd mineguard-dashboard
npm install
npm run dev
```

Open `http://localhost:5173/` in your browser.
