# HostForge Cloud Deployment Guide — Quezon City Flow Guardian

This step-by-step guide walks you through deploying both the **Frontend Web Application** and the **AI Vision Microservice** to **HostForge** using Docker and Docker Compose.

---

## Architecture Overview

```
                          Internet / Users
                                │
                                ▼
                   ┌──────────────────────────┐
                   │   Nginx Reverse Proxy    │ (Port 80 / 443 SSL)
                   └─────────────┬────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       ┌──────────────────┐            ┌──────────────────┐
       │   Frontend Web   │            │ AI Microservice  │
       │  TanStack Start  │            │  FastAPI + YOLO  │
       │   (Port 3000)    │            │   (Port 8000)    │
       └──────────────────┘            └──────────────────┘
                 │                               │
                 └───────────────┬───────────────┘
                                 ▼
                     ┌───────────────────────┐
                     │   Supabase Cloud DB   │
                     │  (Postgres, Realtime) │
                     └───────────────────────┘
```

---

## Step 1: Connect to Your HostForge Server via SSH

Open PowerShell or your terminal and connect to your HostForge Linux VPS (replace with your server IP):

```bash
ssh root@YOUR_HOSTFORGE_SERVER_IP
```

Update package lists:
```bash
sudo apt update && sudo apt upgrade -y
```

---

## Step 2: Install Docker and Docker Compose on HostForge

Run the official Docker automated installation script:

```bash
# 1. Install Docker Engine
curl -fsSL https://get.docker.com | sh

# 2. Enable and start Docker service
sudo systemctl enable --now docker

# 3. Verify Docker and Compose are installed
docker --version
docker compose version
```

---

## Step 3: Clone or Upload the Codebase to HostForge

### Option A: Using Git (Recommended)
```bash
# Install git if missing
sudo apt install git -y

# Clone your project repository into /var/www/qc-flow-guardian
cd /var/www
git clone https://github.com/your-username/qc-flow-guardian.git
cd qc-flow-guardian
```

### Option B: Using SCP / FileZilla / SFTP from Windows
If you don't use Git, transfer your project folder from your PC to the server:
```powershell
# Run this from your Windows PowerShell:
scp -r c:\Users\Nico\qc-flow-guardian-main root@YOUR_HOSTFORGE_SERVER_IP:/var/www/qc-flow-guardian
```

---

## Step 4: Configure Production Environment (`.env`)

On your HostForge server, create or edit `.env`:

```bash
nano .env
```

Paste your production secrets:

```env
# 1. Supabase Backend
SUPABASE_PROJECT_ID="wcprajgotifqgwdjnpss"
SUPABASE_URL="https://wcprajgotifqgwdjnpss.supabase.co"
SUPABASE_PUBLISHABLE_KEY="sb_publishable_Xw_6U8zHYrNcuU--0tbbmQ_QTDbsQew"

VITE_SUPABASE_PROJECT_ID="wcprajgotifqgwdjnpss"
VITE_SUPABASE_URL="https://wcprajgotifqgwdjnpss.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_Xw_6U8zHYrNcuU--0tbbmQ_QTDbsQew"

# 2. GCash Merchant Configuration
VITE_GCASH_ACCOUNT_NAME="Steven john A. Duque"
VITE_GCASH_ACCOUNT_NUMBER="0992-606-2210"
VITE_GCASH_QR_IMAGE="/my-gcash-qr.png"

# 3. Direct Gmail SMTP Gateway (For 1-Minute 2FA OTP & Notice Dispatch)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="escalavincenico28@gmail.com"
SMTP_PASS="dhhp ayra vlcm ncpw"
SMTP_FROM="Quezon City DPOS <escalavincenico28@gmail.com>"

# 4. HostForge / Domain URL
# Point this to your HostForge Server IP or Domain:
APP_URL="http://YOUR_HOSTFORGE_SERVER_IP"
VITE_AI_SERVICE_URL="http://YOUR_HOSTFORGE_SERVER_IP:8000"
```

Save and exit `nano` by pressing `Ctrl + O`, `Enter`, then `Ctrl + X`.

---

## Step 5: Build and Launch Containers

Choose one of the two deployment profiles:

### Profile A: Direct Multi-Port (Ports 3000 & 8000)
Run this command to build and launch both services:
```bash
docker compose up -d --build
```
- **Web Command Center**: `http://YOUR_HOSTFORGE_SERVER_IP:3000`
- **AI Microservice**: `http://YOUR_HOSTFORGE_SERVER_IP:8000`
- **AI Health Status**: `http://YOUR_HOSTFORGE_SERVER_IP:8000/health`

### Profile B: Production Single-Port with Nginx Reverse Proxy (Port 80)
If you want the web app on Port 80 and the AI service reverse-proxied under `/ai/`:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```
- **Web App**: `http://YOUR_HOSTFORGE_SERVER_IP`
- **AI API**: `http://YOUR_HOSTFORGE_SERVER_IP/ai/health`

---

## Step 6: Verify Deployment & Logs

Check container status:
```bash
docker compose ps
```
You should see both containers in `Up` (running) status:
```
NAME                    IMAGE                           COMMAND                  STATUS
qc-flow-guardian-web    qc-flow-guardian-main-web       "node .output/server…"   Up
qc-flow-guardian-ai     qc-flow-guardian-main-ai-service "python run.py"          Up
```

View live logs from both services:
```bash
# View all logs in real time
docker compose logs -f

# View only the AI microservice logs
docker compose logs -f ai-service

# View only the Web application logs
docker compose logs -f web
```

Test the AI microservice health endpoint from the terminal:
```bash
curl http://localhost:8000/health
```
Expected output:
```json
{
  "status": "online",
  "service": "QC Flow Guardian AI Traffic Sentry",
  "model": "Ultralytics YOLOv8n + OpenCV 5.0.0",
  "yolo_active": true,
  "frames_processed": 0,
  "active_tracks_count": 0,
  "db_connected": true
}
```

---

## Step 7: (Optional) Set Up Custom Domain & Free HTTPS (SSL)

If you have a domain (e.g. `qcflow.yourcity.gov.ph` or `qcguardian.com`):

1. Go to your Domain Registrar (GoDaddy, Namecheap, Cloudflare) and create an **A Record**:
   - **Type**: `A`
   - **Name**: `@` (or `traffic`)
   - **Value**: `YOUR_HOSTFORGE_SERVER_IP`

2. On your HostForge server, install Certbot:
   ```bash
   sudo apt install certbot -y
   ```

3. Generate SSL certificate:
   ```bash
   sudo certbot certonly --standalone -d yourdomain.com
   ```

---

## Common Management Commands

| Action | Command |
| :--- | :--- |
| **Check Container Status** | `docker compose ps` |
| **Stop System** | `docker compose down` |
| **Restart System** | `docker compose restart` |
| **View Live Logs** | `docker compose logs -f` |
| **Pull New Updates & Rebuild** | `git pull && docker compose up -d --build` |
| **Check System Resource Usage** | `docker stats` |
