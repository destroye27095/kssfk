# KSFP v2.0.0 - FRP Tunneling & Hosting Setup Guide

**Date**: January 28, 2026  
**Platform**: Fast Reverse Proxy (FRP) for Remote Hosting  
**Status**: Ready for Deployment

---

## 📌 Quick Start - FRP Configuration

### What is FRP?
FRP (Fast Reverse Proxy) allows you to expose your local application to the internet securely without needing a public IP or domain.

---

## 🚀 Installation Steps

### Step 1: Install Node.js
**Required before running the application**

```powershell
# Option A: Using Winget (Windows)
winget install OpenJS.NodeJS

# Option B: Using Chocolatey
choco install nodejs

# Option C: Download from official site
# Visit: https://nodejs.org/en/download/
```

**Verify installation:**
```powershell
node --version    # Should show v14 or higher
npm --version     # Should show v6 or higher
```

---

## 📋 Setup Steps (After Node.js Installation)

### Step 1: Install Dependencies

```powershell
cd i:\KSSFK\backend
npm install
```

### Step 2: Create .env File

```powershell
# In i:\KSSFK\backend, create .env file with:

PORT=3000
NODE_ENV=production
DATABASE_URL=sqlite:./app.db
JWT_SECRET=KSFP_v2_0_production_secret_key_2026
JWT_EXPIRY=24h
CORS_ORIGIN=*
RATE_LIMIT=1000

# Optional: If using PostgreSQL/MySQL
# DATABASE_URL=postgresql://user:password@localhost:5432/ksfp
```

### Step 3: Start Backend Server

```powershell
cd i:\KSSFK\backend
npm start

# Output should show:
# Server running on http://localhost:3000
# Connected to database...
```

---

## 🌐 FRP Tunneling Setup

### Option 1: Using frp (Recommended)

#### 1. Download FRP
- **Windows**: https://github.com/fatedier/frp/releases
- Download: `frp_x.x.x_windows_amd64.zip`

#### 2. Configure FRP Client (frpc.ini)

Create file: `i:\KSSFK\frpc.ini`

```ini
[common]
server_addr = frp.example.com
server_port = 7000
token = your_secure_token_here

[web]
type = http
local_ip = 127.0.0.1
local_port = 3000
custom_domains = ksfp-demo.yourdomain.com
```

#### 3. Start FRP Client

```powershell
# In the frp directory
.\frpc.exe -c frpc.ini

# Output:
# 2026/01/28 10:30:45 [I] [control.go:xxx] connected to server
# 2026/01/28 10:30:45 [I] [proxy.go:xxx] [web] proxy created
```

---

### Option 2: Using Ngrok (Easiest)

#### 1. Download & Install Ngrok
```powershell
# Using Chocolatey
choco install ngrok

# Or from: https://ngrok.com/download
```

#### 2. Authenticate Ngrok
```powershell
ngrok config add-authtoken YOUR_NGROK_TOKEN
```
Get your token from: https://dashboard.ngrok.com/auth/your-authtoken

#### 3. Start Ngrok Tunnel
```powershell
ngrok http 3000

# Output:
# Forwarding                    https://abc123.ngrok.io -> http://localhost:3000
# Web Interface                 http://127.0.0.1:4040
```

**Your public URL**: `https://abc123.ngrok.io`

---

### Option 3: Using Cloudflare Tunnel (Free & Reliable)

#### 1. Install Cloudflare Tunnel
```powershell
# Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/local-management/windows/
```

#### 2. Create Tunnel
```powershell
cloudflared tunnel create ksfp-demo

# Creates tunnel with UUID
```

#### 3. Route Traffic
```powershell
cloudflared tunnel route dns ksfp-demo ksfp-demo.yourdomain.com

# Where yourdomain.com is your Cloudflare domain
```

#### 4. Run Tunnel
```powershell
cloudflared tunnel run --url http://localhost:3000 ksfp-demo
```

**Your public URL**: `https://ksfp-demo.yourdomain.com`

---

## 🔧 Complete Startup Script

Save as: `i:\KSSFK\start-all.ps1`

```powershell
# ==========================================
# KSFP v2.0.0 - Complete Startup Script
# ==========================================

Write-Host "Starting Kenya School Fee Platform..." -ForegroundColor Green

# 1. Start Backend Server
Write-Host "`n[1/2] Starting Backend Server..." -ForegroundColor Yellow
$backendProcess = Start-Process powershell -ArgumentList {
    cd i:\KSSFK\backend
    npm start
} -WindowStyle Normal -PassThru

Write-Host "Backend PID: $($backendProcess.Id)" -ForegroundColor Cyan
Start-Sleep -Seconds 3

# 2. Start FRP Tunnel (Choose one option below)
Write-Host "`n[2/2] Starting FRP Tunnel (Ngrok)..." -ForegroundColor Yellow
$tunnelProcess = Start-Process powershell -ArgumentList {
    ngrok http 3000
} -WindowStyle Normal -PassThru

Write-Host "Tunnel PID: $($tunnelProcess.Id)" -ForegroundColor Cyan

Write-Host "`n================================================" -ForegroundColor Green
Write-Host "KSFP v2.0.0 is now running!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "`nLocal URL:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "Public URL: Check ngrok/tunnel output above" -ForegroundColor Cyan
Write-Host "`nDashboard: /public/admin-dashboard.html" -ForegroundColor Cyan
Write-Host "API Docs:  /API_DOCUMENTATION.md" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C to stop all processes`n" -ForegroundColor Yellow

# Keep script running
Wait-Process -Id $backendProcess.Id
```

**Run the script:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\start-all.ps1
```

---

## 🌍 Accessing Your Application

### Local Access
```
http://localhost:3000
```

### Remote Access (via FRP)

**Ngrok Example:**
```
https://abc123.ngrok.io
Dashboard: https://abc123.ngrok.io/public/admin-dashboard.html
API: https://abc123.ngrok.io/schools
```

**Cloudflare Tunnel Example:**
```
https://ksfp-demo.yourdomain.com
Dashboard: https://ksfp-demo.yourdomain.com/public/admin-dashboard.html
API: https://ksfp-demo.yourdomain.com/schools
```

---

## 📡 API Endpoints (Public Access)

### Schools API
```bash
# List schools
curl https://your-public-url.com/schools

# Filter by fee
curl "https://your-public-url.com/schools?maxFee=50000"

# Get specific school
curl https://your-public-url.com/schools/school-001
```

### Admin Dashboard
```
https://your-public-url.com/public/admin-dashboard.html
```

### School Finder
```
https://your-public-url.com/public/school-finder-map.html
```

### API Documentation
```
https://your-public-url.com/API_DOCUMENTATION.md
```

---

## 🔒 Security Considerations

### For FRP Tunneling

1. **Use HTTPS**: Always use HTTPS tunnels (ngrok, Cloudflare)
2. **Token Security**: Never expose FRP server tokens in public
3. **Rate Limiting**: Configured at 1000 req/hour by default
4. **Authentication**: Admin endpoints require JWT token
5. **CORS**: Set CORS_ORIGIN in .env for your public URL

### Update CORS for Public Access

```javascript
// In backend/app.js
const cors = require('cors');

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 🧪 Testing the Setup

### 1. Verify Backend is Running
```bash
curl http://localhost:3000/schools
# Should return JSON with schools list
```

### 2. Verify Tunnel is Active
```bash
# Check Ngrok dashboard
curl http://127.0.0.1:4040/api/tunnels

# Check Cloudflare tunnel
cloudflared tunnel info ksfp-demo
```

### 3. Test Remote Access
```bash
curl https://your-public-url.com/schools
# Should return same JSON as local
```

### 4. Test Admin Dashboard
```
Visit: https://your-public-url.com/public/admin-dashboard.html
```

---

## 📊 Performance Monitoring

### Monitor Local Server
```powershell
# Watch server logs in real-time
Get-Content -Path i:\KSSFK\logs\app.log -Wait
```

### Monitor Tunnel
- **Ngrok Dashboard**: http://127.0.0.1:4040
- **Cloudflare Dashboard**: https://dash.cloudflare.com

---

## 🐛 Troubleshooting

### "Port 3000 already in use"
```powershell
# Find process using port 3000
Get-NetTCPConnection -LocalPort 3000

# Kill the process (replace PID)
Stop-Process -Id PID -Force

# Or use different port
$env:PORT=3001
npm start
```

### "npm not found"
```powershell
# Install Node.js from https://nodejs.org
# Or use Chocolatey
choco install nodejs

# Verify installation
node --version
npm --version
```

### "Tunnel connection failed"
```powershell
# Check internet connection
Test-Connection google.com

# Verify FRP server is accessible
Test-NetConnection frp.example.com -Port 7000

# For Ngrok, check auth token
ngrok config check
```

### "CORS errors in browser"
```javascript
// Make sure CORS_ORIGIN in .env matches your public URL
// For development: CORS_ORIGIN=*
// For production: CORS_ORIGIN=https://your-public-url.com
```

---

## 📋 Complete Checklist

- [ ] Node.js installed (v14+)
- [ ] npm dependencies installed (`npm install`)
- [ ] .env file created with correct variables
- [ ] Backend server starts without errors
- [ ] FRP tool installed (Ngrok/Cloudflare/frp)
- [ ] FRP authentication configured
- [ ] Tunnel starts and shows public URL
- [ ] Local access works (localhost:3000)
- [ ] Remote access works (public URL)
- [ ] Admin dashboard loads
- [ ] API endpoints return data
- [ ] All documentation accessible

---

## 🎯 Summary

```
KSFP v2.0.0 Full Stack Running
════════════════════════════════════════════════════════

✅ Backend:        http://localhost:3000
✅ Admin Panel:    /public/admin-dashboard.html
✅ School Finder:  /public/school-finder-map.html
✅ API Docs:       /API_DOCUMENTATION.md
✅ Public URL:     https://your-ngrok-url (via tunnel)

Ready for demonstration to stakeholders!
════════════════════════════════════════════════════════
```

---

## 📞 Support

For issues:
1. Check this guide's troubleshooting section
2. Review [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
3. Check application logs in `logs/` directory
4. Contact: support@ksfp.ac.ke

---

**Version**: 2.0.0  
**Status**: Ready for FRP Deployment  
**Developer**: Wanoto Raphael - Meru University IT  
**Last Updated**: January 28, 2026
