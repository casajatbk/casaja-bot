# Quick Start Guide - CASAJA Chatbot

Panduan cepat untuk menjalankan chatbot WhatsApp lokal.

## Prerequisites

- Node.js 16+ (check: `node --version`)
- npm atau pnpm
- MongoDB Atlas Account (https://www.mongodb.com/cloud/atlas)
- WhatsApp App / Web (untuk test)

## 1. Setup MongoDB Atlas

### 1.1 Create Cluster

1. Buka https://www.mongodb.com/cloud/atlas
2. Create Account / Login
3. Click "Create" → Create a Deployment
4. Pilih FREE tier
5. Provider: AWS / Google Cloud (pick any)
6. Region: Choose closest to you (Singapore recommended)
7. Cluster name: `casaja-bot`
8. Click "Create Deployment"

### 1.2 Setup Network Access

1. Sidebar → Network Access
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (untuk development)
4. Confirm

### 1.3 Create Database User

1. Database Access → Add New Database User
2. Username: `casaja_user`
3. Password: `your_secure_password`
4. Built-in Role: `Atlas Admin`
5. Add User

### 1.4 Get Connection String

1. Clusters → Cluster0 → Connect
2. Choose "Drivers"
3. Copy Connection String
4. Ganti `<username>` dan `<password>` dengan data user
5. Format final: `mongodb+srv://casaja_user:password@cluster0.xxxxx.mongodb.net/casaja_bot?retryWrites=true&w=majority`

## 2. Setup Project Lokal

### 2.1 Clone / Extract

```bash
# Navigate ke folder project
cd casaja-bot
```

### 2.2 Install Dependencies

```bash
# Using npm
npm install

# Or using pnpm
pnpm install

# Or using yarn
yarn install
```

### 2.3 Configure .env

Buat file `.env` di root directory:

```env
# MongoDB Connection String (dari Step 1.4)
MONGODB_URI=mongodb+srv://casaja_user:your_password@cluster0.xxxxx.mongodb.net/casaja_bot?retryWrites=true&w=majority

# Server
PORT=5000
NODE_ENV=development
API_URL=http://localhost:5000/api
LOG_LEVEL=debug
```

**PENTING**: Replace:
- `casaja_user` dengan username Anda
- `your_password` dengan password Anda
- `cluster0.xxxxx` dengan cluster URL Anda

## 3. Seed Database (Add Initial Products)

### 3.1 Create Products Manually

Start API server dulu:

```bash
npm run api:dev
```

Kemudian in another terminal, POST products:

```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kabel Roll 4 Lubang",
    "holes": 4,
    "pricePerSession": 40000,
    "availableStock": 5,
    "description": "Kabel roll dengan 4 lubang untuk peminjaman"
  }'
```

Repeat untuk produk lain:

```bash
# Kabel Roll 5 Lubang
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kabel Roll 5 Lubang",
    "holes": 5,
    "pricePerSession": 50000,
    "availableStock": 3,
    "description": "Kabel roll dengan 5 lubang untuk peminjaman"
  }'

# Kabel Roll 6 Lubang
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kabel Roll 6 Lubang",
    "holes": 6,
    "pricePerSession": 60000,
    "availableStock": 2,
    "description": "Kabel roll dengan 6 lubang untuk peminjaman"
  }'
```

### 3.2 Verify Products

```bash
curl http://localhost:5000/api/products

# Expected output:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Kabel Roll 4 Lubang",
      "holes": 4,
      "pricePerSession": 40000,
      "availableStock": 5
    }
  ]
}
```

## 4. Run API Server

Terminal 1:

```bash
npm run api:dev
```

Expected output:
```
[v0] Connecting to MongoDB...
[v0] MongoDB Connected: cluster0.xxxxx.mongodb.net
[v0] Database: casaja_bot
Server running on port 5000
[v0] Fetched 3 products
```

## 5. Run WhatsApp Bot

Terminal 2:

```bash
npm run bot:dev
```

Expected output:
```
[v0] WhatsApp bot initialized
[v0] Connecting to WhatsApp...
[v0] QR Code Generated - Scan dengan WhatsApp Anda
[QR CODE ASCII WILL DISPLAY HERE]
```

## 6. Scan WhatsApp QR Code

1. Open WhatsApp App or WhatsApp Web (web.whatsapp.com)
2. Scan QR code dari terminal
3. Approve login

Expected dalam log:
```
[v0] WhatsApp Connection OPEN - Bot ready!
```

## 7. Test Bot

1. Open WhatsApp
2. Go to the number yang sudah login (089527749870)
3. Send: `Halo`

Expected response:
```
Halo! Selamat datang di CASAJA 🔌
Layanan peminjaman kabel roll untuk mahasiswa BINUS Semarang

Silakan pilih menu:
1️⃣ Lihat Produk
2️⃣ Cara Pemesanan
3️⃣ Hubungi Admin
```

## 8. Complete Chat Flow Test

### Chat Commands:

```
1 → View products
2 → Cara pemesanan
3 → Contact admin
1 → Select product
2 → Select session count
Budi budi@binus.ac.id 2540123456 B220 → Fill data
1 → Select QRIS payment
YA → Confirm order
```

## Troubleshooting

### Issue: "MONGODB_URI is not defined"

**Solution:**
- Check `.env` file exists
- Verify MONGODB_URI value
- Restart terminal

### Issue: "Cannot connect to MongoDB"

**Solution:**
1. Check connection string
2. MongoDB Atlas → Network Access → Allow from anywhere
3. Verify username/password correct

### Issue: "WhatsApp bot tidak terima pesan"

**Solution:**
- Check terminal shows: `[v0] WhatsApp Connection OPEN`
- Re-scan QR code
- Ensure bot terminal running

### Issue: "Bot tidak reply"

**Solution:**
1. Check API running: `curl http://localhost:5000/health`
2. Check products exist: `curl http://localhost:5000/api/products`
3. Check both terminals running

## Logs Understanding

- `[v0]` = Debug info
- `[v0] WhatsApp Connection OPEN` = Bot ready
- `[v0] Error` = Error message
- `[v0] Pesan dari +62xxx` = Pesan masuk
- `[v0] Pesan terkirim ke` = Reply sent

## Stop Services

Tekan `Ctrl+C` di masing-masing terminal

## Next Steps

1. ✅ Setup MongoDB Atlas
2. ✅ Install dependencies
3. ✅ Configure .env
4. ✅ Add products
5. ✅ Run API server
6. ✅ Run WhatsApp bot
7. ✅ Scan QR code
8. ✅ Test chat flow
9. → Ready to deploy to Railway

---

For deployment guide, see: `RAILWAY_DEPLOYMENT.md`
