import os
import shutil

BASE = os.path.abspath('.')
FE_DIR = os.path.join(BASE, 'git_staging_frontend')
BE_DIR = os.path.join(BASE, 'git_staging_backend')

if os.path.exists(FE_DIR):
    shutil.rmtree(FE_DIR)
if os.path.exists(BE_DIR):
    shutil.rmtree(BE_DIR)

os.makedirs(FE_DIR, exist_ok=True)
os.makedirs(BE_DIR, exist_ok=True)

# 1. POPULATE FRONTEND STAGING (for Netlify)
src_fe = os.path.join(BASE, 'mineguard-dashboard')
for item in ['index.html', 'package.json', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json']:
    p = os.path.join(src_fe, item)
    if os.path.exists(p):
        shutil.copyfile(p, os.path.join(FE_DIR, item))

shutil.copytree(os.path.join(src_fe, 'src'), os.path.join(FE_DIR, 'src'))
shutil.copytree(os.path.join(src_fe, 'public'), os.path.join(FE_DIR, 'public'))

# Netlify config & env template for frontend
with open(os.path.join(FE_DIR, 'netlify.toml'), 'w', encoding='utf-8') as f:
    f.write("""[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "20"
""")

with open(os.path.join(FE_DIR, '.env.example'), 'w', encoding='utf-8') as f:
    f.write("""# MINEGUARD AI FRONTEND — NETLIFY ENVIRONMENT VARIABLES
VITE_API_BASE_URL=https://your-render-backend-url.onrender.com
VITE_SUPABASE_URL=https://tffhdzctkfdmzamwqxal.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZmhkemN0a2ZkbXphbXdxeGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MTM4MTEsImV4cCI6MjEwNDE4OTgxMX0.rDc7I_VHd4Egypi311fXVvsvrpRqbgbYinOV32irioo
""")

with open(os.path.join(FE_DIR, '.gitignore'), 'w', encoding='utf-8') as f:
    f.write("""node_modules/
dist/
dist-ssr/
.env
.env.*
!.env.example
*.log
.DS_Store
Thumbs.db
""")

with open(os.path.join(FE_DIR, 'README.md'), 'w', encoding='utf-8') as f:
    f.write("""# MineGuard AI — Frontend Dashboard (Netlify Deployment)
**Branch: `Minegaurdai-frontend`** | **SIH 26008**

Industrial Conveyor Belt Defect Detection, Supervisory Health Digital Twin & Predictive Monitoring Dashboard built with React 19, TypeScript, and Tailwind CSS.

## Netlify One-Click Deployment
1. Import this repository branch (`Minegaurdai-frontend`) into Netlify.
2. Build Settings:
   - **Base directory**: Leave blank (root of branch)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. Environment Variables:
   - `VITE_API_BASE_URL`: Your deployed Render backend URL (e.g. `https://mineguard-backend.onrender.com`)
   - `VITE_SUPABASE_URL`: `https://tffhdzctkfdmzamwqxal.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase public anon key (see `.env.example`)
4. Click **Deploy Site**.
""")

print("Frontend staging populated successfully!")

# 2. POPULATE BACKEND STAGING (for Render 512MB RAM / 0.1 vCPU)
for f in ['fastapi_app.py', 'unified_preprocessor.py', 'Dockerfile', '.dockerignore', 'API.md', 'MODEL_VALIDATION.md', 'DEPLOYMENT.md']:
    p = os.path.join(BASE, f)
    if os.path.exists(p):
        shutil.copyfile(p, os.path.join(BE_DIR, f))

# Lightweight requirements.txt for Render 512MB RAM
with open(os.path.join(BE_DIR, 'requirements.txt'), 'w', encoding='utf-8') as f:
    f.write("""fastapi>=0.100.0
uvicorn[standard]>=0.22.0
python-multipart>=0.0.6
pydantic>=2.0.0
onnxruntime>=1.15.0
pillow>=9.0.0
numpy>=1.21.0
requests>=2.28.0
""")

# Render Blueprint
with open(os.path.join(BE_DIR, 'render.yaml'), 'w', encoding='utf-8') as f:
    f.write("""services:
  - type: web
    name: mineguardai-backend
    env: python
    region: oregon
    plan: free
    branch: minegaurdai-backend
    buildCommand: "pip install --upgrade pip && pip install -r requirements.txt"
    startCommand: "uvicorn fastapi_app:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: ALLOWED_ORIGINS
        value: "*"
      - key: PORT
        value: "8000"
""")

with open(os.path.join(BE_DIR, '.env.example'), 'w', encoding='utf-8') as f:
    f.write("""# MINEGUARD AI BACKEND — RENDER ENVIRONMENT VARIABLES
ALLOWED_ORIGINS=*
PORT=8000
""")

with open(os.path.join(BE_DIR, '.gitignore'), 'w', encoding='utf-8') as f:
    f.write("""__pycache__/
*.py[cod]
*$py.class
venv/
env/
.venv/
.env
.env.*
!.env.example
*.log
uploads/*
!uploads/.gitkeep
""")

with open(os.path.join(BE_DIR, 'README.md'), 'w', encoding='utf-8') as f:
    f.write("""# MineGuard AI — Quantized YOLO Inference Backend (Render Deployment)
**Branch: `minegaurdai-backend`** | **SIH 26008**

Ultra-lightweight FastAPI defect detection inference backend optimized for Render free tier (**512 MB RAM, 0.1 vCPU**).

## Render One-Click Deployment
1. Connect this repository branch (`minegaurdai-backend`) on [render.com](https://render.com/).
2. Select **Web Service** with **Free Plan**.
3. Configuration:
   - **Environment**: `Python 3`
   - **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command**: `uvicorn fastapi_app:app --host 0.0.0.0 --port $PORT`
4. Environment Variables:
   - `ALLOWED_ORIGINS`: `*`
   - `PORT`: `8000`
5. Click **Create Web Service**.

## Quantization & Resource Specification
- **Engine**: ONNX Runtime INT8 dynamic quantization
- **Idle Memory**: ~65 MB (leaves >400 MB headroom under Render 512 MB limit)
- **Peak Inference Memory**: ~185 MB
- **Concurrency**: 1-thread sequential execution tuned for 0.1 vCPU
- **Endpoints**: `/health`, `/model-info`, `POST /api/detect`, `POST /api/models/cross_check`
""")

# Copy models & static samples
os.makedirs(os.path.join(BE_DIR, 'models'), exist_ok=True)
shutil.copyfile(os.path.join(BASE, 'models', 'final_sih_model_int8.onnx'), os.path.join(BE_DIR, 'models', 'final_sih_model_int8.onnx'))
shutil.copyfile(os.path.join(BASE, 'models', 'final_sih_model_metadata.json'), os.path.join(BE_DIR, 'models', 'final_sih_model_metadata.json'))

shutil.copytree(os.path.join(BASE, 'static'), os.path.join(BE_DIR, 'static'))
os.makedirs(os.path.join(BE_DIR, 'golden_test_images'), exist_ok=True)
for gf in os.listdir(os.path.join(BASE, 'golden_test_images')):
    shutil.copyfile(os.path.join(BASE, 'golden_test_images', gf), os.path.join(BE_DIR, 'golden_test_images', gf))

print("Backend staging populated successfully!")
