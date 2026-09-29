# MineGuard AI — Production Deployment Guide
**Smart India Hackathon (SIH) Problem Statement 26008**

This document provides step-by-step instructions for deploying the **MineGuard AI Industrial Conveyor Monitoring Platform** to free public cloud hosting (Netlify) with zero exposed secrets.

---

## 1. Prerequisites

- **Node.js**: Version 18.x or 20.x LTS installed. [Download Node.js](https://nodejs.org/)
- **npm**: Version 9.x or later (bundled with Node.js)
- **Git**: Installed for version control and GitHub integration
- **Netlify Account**: Free tier account at [netlify.com](https://www.netlify.com/)

---

## 2. Local Installation & Dependency Verification

From your terminal, navigate to the project directory:

```bash
# 1. Install root workspace scripts
npm install

# 2. Install React frontend application dependencies
cd mineguard-dashboard
npm install
cd ..
```

---

## 3. Environment Variable Configuration

Create a local `.env` file from the provided template:

```bash
cp .env.example .env
```

Ensure `.env` contains the public browser-safe variables:

```env
VITE_SUPABASE_URL=https://tffhdzctkfdmzamwqxal.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZmhkemN0a2ZkbXphbXdxeGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MTM4MTEsImV4cCI6MjEwNDE4OTgxMX0.rDc7I_VHd4Egypi311fXVvsvrpRqbgbYinOV32irioo
```

> **CRITICAL SECURITY NOTE**: Never place `service_role` keys, database passwords, or private backend tokens in this file or any frontend repository.

---

## 4. Production Build Execution

Compile and minify the React + TypeScript application:

```bash
npm run build
```

**Expected output**:
```text
✓ 2514 modules transformed.
dist/index.html                   0.65 kB │ gzip:   0.42 kB
dist/assets/index-BaBfJiDo.css   43.68 kB │ gzip:   8.65 kB
dist/assets/index-C9Q6WTdJ.js   933.57 kB │ gzip: 259.27 kB
✓ built in <1.0s
✓ Production build assets compiled to dist/
```

---

## 5. Verify Production Build Locally

Preview the compiled distribution using Vite's local preview server:

```bash
npm --prefix mineguard-dashboard run preview
```

Open `http://localhost:4173/` in your browser. Verify:
- The dashboard loads with the industrial control-room theme.
- Supabase connects to `conveyor_telemetry` and displays live telemetry packets.
- Navigation between tabs (Overview, Live Monitoring, AI Inspection, Events, System Diagnostics) functions smoothly.
- Zero console errors appear in developer tools.

---

## 6. Push to GitHub (Optional but Recommended)

```bash
# Initialize git if not already present
git init
git add .
git commit -m "feat: release MineGuard AI production build SIH-26008"

# Push to your GitHub repository
git remote add origin https://github.com/<your-username>/mineguard-ai.git
git branch -M main
git push -u origin main
```

---

## 7. Connect Repository to Netlify

1. Log in to [Netlify App](https://app.netlify.com/).
2. Click **Add new site** > **Import an existing project**.
3. Select **GitHub** and authorize access to your repository.
4. Select the `mineguard-ai` repository.

---

## 8. Configure Netlify Build Settings

Netlify will automatically detect settings from the included `netlify.toml`. Verify the following parameters:

| Configuration Parameter | Value |
|---|---|
| **Base directory** | `mineguard-dashboard` *(or leave empty if deploying standalone package)* |
| **Build command** | `npm run build` |
| **Publish directory** | `dist` |
| **Node Version** | `20` |

### Environment Variables on Netlify
Navigate to **Site settings** > **Build & deploy** > **Environment** > **Environment variables**:
- Key: `VITE_SUPABASE_URL` | Value: `https://tffhdzctkfdmzamwqxal.supabase.co`
- Key: `VITE_SUPABASE_ANON_KEY` | Value: *(Your public Supabase anon key)*

---

## 9. Deploy Site

Click **Deploy site**. Netlify will:
1. Pull the repository.
2. Execute `npm run build`.
3. Distribute assets across its global CDN.
4. Assign a production URL (e.g. `https://mineguard-ai.netlify.app`).

---

## 10. Post-Deployment Verification Checklist

Once deployed, open your live Netlify URL and test the following:
- [ ] **HTTPS Origin**: Verify the padlock icon in the browser address bar.
- [ ] **SPA Route Refresh**: Refresh the page on any sub-view; verify it does not return a 404 error (handled by `netlify.toml` redirect `/* -> /index.html 200`).
- [ ] **Supabase Telemetry**: Confirm real-time updates arrive from `conveyor_telemetry`.
- [ ] **Camera Access**: Click "Start Camera" in the AI Inspection tab; accept the browser permission prompt to verify live webcam stream.
- [ ] **Image Upload**: Upload a test belt surface photo; verify the preview and inspection results render cleanly.
- [ ] **Responsive View**: Open on desktop, tablet, and mobile viewport widths to confirm layout responsiveness.
