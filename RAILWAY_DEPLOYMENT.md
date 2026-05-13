# Deployment Guide - CASAJA Chatbot ke Railway.app

Panduan lengkap untuk deploy chatbot WhatsApp dengan Express API ke Railway.app untuk menjalankan 24/7.

## Prasyarat

- GitHub Account
- Railway.app Account (gratis: https://railway.app)
- MongoDB Atlas Connection String
- Project sudah di-push ke GitHub

## Step 1: Setup GitHub Repository

```bash
# Initialize git jika belum
git init

# Add all files
git add .

# Commit
git commit -m "Initial CASAJA Chatbot setup"

# Create repository di GitHub

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/casaja-bot.git

# Push ke GitHub
git branch -M main
git push -u origin main
```

## Step 2: Setup Railway Project

### 2.1 Create New Project di Railway

1. Buka https://railway.app/dashboard
2. Click **"+ New Project"**
3. Pilih **"Deploy from GitHub repo"**
4. Connect GitHub account jika belum
5. Select repository `casaja-bot`
6. Railway akan auto-detect dan create project

### 2.2 Configure Environment Variables

Di Railway Dashboard:

1. Buka project Anda
2. Klik **"Variables"** tab
3. Add environment variables:

```
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/casaja_bot?retryWrites=true&w=majority

PORT=5000

NODE_ENV=production

API_URL=https://YOUR_RAILWAY_URL/api

LOG_LEVEL=info
```

**Cara mendapat `MONGODB_URI`:**
1. Buka MongoDB Atlas (https://www.mongodb.com/cloud/atlas)
2. Cluster → Connect → Drivers
3. Copy connection string
4. Replace `YOUR_USERNAME`, `YOUR_PASSWORD`, `YOUR_CLUSTER`

**Cara mendapat Railway URL:**
- Setelah deploy berhasil, Railway akan generate domain otomatis
- Format: `https://casaja-bot-production.up.railway.app`

### 2.3 Add MongoDB Integration (Optional)

Railway punya integrated MongoDB, tapi kami gunakan MongoDB Atlas yang sudah ada:

1. Skip MongoDB integration
2. Gunakan connection string MONGODB_URI dari Step 2.2

## Step 3: Deploy Configuration

### 3.1 Package.json Scripts

Pastikan `package.json` memiliki scripts yang benar:

```json
{
  "scripts": {
    "start": "node api/server.js && node bot/index.js",
    "dev": "concurrently \"npm run api:dev\" \"npm run bot:dev\"",
    "api:dev": "nodemon api/server.js",
    "api:start": "node api/server.js",
    "bot:start": "node bot/index.js"
  }
}
```

### 3.2 Procfile (Optional tapi Recommended)

Buat file `Procfile` di root directory:

```
web: node api/server.js
bot: node bot/index.js
```

## Step 4: Deploy Process

Railway akan **automatically deploy** ketika push ke GitHub:

1. Push code ke GitHub
2. Railway akan trigger build otomatis
3. Tunggu ~2-5 menit sampai deployment selesai
4. Check logs di Railway Dashboard

## Step 5: Verify Deployment

### 5.1 Check API Health

```bash
curl https://YOUR_RAILWAY_URL/health
```

Response yang diharapkan:
```json
{
  "status": "API Server is running",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "environment": "production"
}
```

### 5.2 Check Bot Logs

1. Railway Dashboard → Logs tab
2. Cari pattern: `[v0] WhatsApp Connection OPEN - Bot ready!`
3. Jika ada QR Code yang muncul, scan dengan WhatsApp

## Step 6: Scan WhatsApp QR Code

1. Bot sudah running di Railway
2. Check Railway Logs tab
3. Cari QR code output
4. Scan dengan WhatsApp app atau web di browser
5. Approve login

## Step 7: Testing

### Test dari WhatsApp:

1. Buka WhatsApp app atau web
2. Chat ke nomor yang sudah login via Baileys (089527749870)
3. Kirim message: `Halo`
4. Bot akan reply dengan menu

### Test API direktly:

```bash
# Get all products
curl https://YOUR_RAILWAY_URL/api/products

# Expected response:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Kabel Roll 4 Lubang",
      "pricePerSession": 40000,
      "availableStock": 5
    }
  ]
}
```

## Monitoring & Troubleshooting

### View Logs

Railway Dashboard → select project → **Logs** tab

Look for:
- `[v0] WhatsApp Connection OPEN` = Bot connected ✅
- `[v0] Error` = Ada error
- `MongoDB Connected` = Database connected ✅

### Common Issues

#### 1. Bot tidak menerima pesan

**Penyebab:** Koneksi WhatsApp terputus

**Solusi:**
```bash
# Re-scan QR code
# Delete auth file dan trigger restart
```

#### 2. API Error

**Penyebab:** MONGODB_URI tidak valid atau MongoDB Atlas firewall

**Solusi:**
1. Check MONGODB_URI di Variables
2. MongoDB Atlas → Network Access
3. Allow access dari Railway IP (0.0.0.0/0 untuk test)

#### 3. Build Failed

**Solusi:**
1. Check package.json dependencies
2. Ensure all required packages terinstall
3. Check logs detail di Railway

## Production Settings

### 1. Enable Auto-Deploy

Railway Dashboard → Settings:
- Toggle **"Auto Deploy"** = ON
- Setiap push ke GitHub, auto-deploy

### 2. Setup Custom Domain (Optional)

Railway Dashboard → Domain:
1. Click **"Generate Domain"** atau use custom domain
2. Configure DNS

### 3. Setup Monitoring

Railway provides built-in monitoring:
- View memory usage
- Check uptime
- Monitor logs

## Ongoing Maintenance

### Update Code

```bash
# Local changes
git add .
git commit -m "Update bot features"
git push origin main

# Railway auto-deploy dalam 1-2 menit
```

### Check Uptime

Railway Dashboard → Deployments:
- View all deployment history
- Check status setiap deployment

### Scale Resources

Jika bot sering crash:
1. Railway Dashboard → Settings
2. Increase allocated RAM/CPU
3. Monitor performance

## Backup & Recovery

### Export Data

```bash
# Export orders collection
mongoexport --uri "YOUR_MONGODB_URI" --collection orders --out orders_backup.json

# Export products
mongoexport --uri "YOUR_MONGODB_URI" --collection products --out products_backup.json
```

### Restore Data

```bash
mongoimport --uri "YOUR_MONGODB_URI" --collection orders --file orders_backup.json
```

## Next Steps

1. ✅ Deploy ke Railway
2. ✅ Verify API & Bot running
3. ✅ Scan WhatsApp QR code
4. ✅ Test chat flow
5. ✅ Monitor logs reguler
6. ✅ Setup custom domain (optional)
7. ✅ Configure alerts/monitoring (optional)

## Support

Jika ada issue:

1. Check Railway logs terlebih dahulu
2. Verify MONGODB_URI correct
3. Test API dengan curl
4. Check WhatsApp bot connection

---

**Status**: 🟢 Ready for 24/7 Production
**Platform**: Railway.app
**Bot Framework**: Baileys + Express.js
**Database**: MongoDB Atlas
