# CASAJA WhatsApp Chatbot - Setup Guide

## Prerequisites
- Node.js v18+ installed
- MongoDB Atlas account (free tier available)
- WhatsApp installed on phone (untuk QR code scanning)
- Terminal/Command Prompt

---

## Step 1: MongoDB Atlas Setup

### 1.1 Create MongoDB Atlas Account
1. Buka https://account.mongodb.com/account/login
2. Sign up dengan email Anda
3. Pilih "Create a Free Cluster"

### 1.2 Create Database
1. Di MongoDB Atlas Dashboard, klik "Build a Database"
2. Pilih shared cluster (gratis)
3. Pilih region: Asia (Singapore) atau terdekat dengan lokasi Anda
4. Klik "Create Cluster" (tunggu ~3 menit)

### 1.3 Create Database User
1. Di sidebar, klik "Database Access"
2. Klik "Add New Database User"
3. Username: `casaja_user` (atau sesuai preferensi)
4. Password: Generate secure password
5. Built-in Role: `Read and write to any database`
6. Klik "Add User"

### 1.4 Get Connection String
1. Di sidebar, klik "Clusters"
2. Klik tombol "Connect" pada cluster Anda
3. Pilih "Drivers"
4. Copy connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true`)
5. Replace `<username>`, `<password>`, dan `myFirstDatabase` dengan:
   - username: `casaja_user`
   - password: password yang dibuat di step 1.3
   - database name: `casaja_bot`

Hasil akhir: `mongodb+srv://casaja_user:your_password@cluster.mongodb.net/casaja_bot`

### 1.5 Add IP to Whitelist
1. Di sidebar, klik "Network Access"
2. Klik "Add IP Address"
3. Pilih "Allow Access from Anywhere" (untuk development)
4. Klik "Confirm"

---

## Step 2: Project Setup

### 2.1 Clone/Download Project
```bash
cd your-projects-directory
git clone https://github.com/username/casaja-bot.git
cd casaja-bot
```

### 2.2 Install Dependencies
```bash
npm install
```

Ini akan menginstall:
- Express (API server)
- Mongoose (Database driver)
- Baileys (WhatsApp connector)
- Axios (HTTP client untuk bot)
- CORS (Cross-origin support)
- Dotenv (Environment variables)
- Nodemon (Auto reload development)

### 2.3 Configure Environment Variables
1. Edit file `.env` di root project
2. Update `MONGODB_URI` dengan connection string dari step 1.4

```env
MONGODB_URI=mongodb+srv://casaja_user:your_password@cluster.mongodb.net/casaja_bot
PORT=5000
NODE_ENV=development
API_URL=http://localhost:5000/api
```

---

## Step 3: Initialize Database (Optional)

Untuk menambahkan sample products, buat file `init-db.js` di root project:

```javascript
const mongoose = require('mongoose');
const Product = require('./api/models/Product');
require('dotenv').config();

async function initializeProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const products = [
      {
        name: 'Kabel Roll 4 Lubang',
        holes: 4,
        pricePerSession: 40000,
        availableStock: 5,
        description: 'Kabel roll dengan 4 lubang untuk acara'
      },
      {
        name: 'Kabel Roll 5 Lubang',
        holes: 5,
        pricePerSession: 50000,
        availableStock: 3,
        description: 'Kabel roll dengan 5 lubang untuk acara'
      },
      {
        name: 'Kabel Roll 6 Lubang',
        holes: 6,
        pricePerSession: 60000,
        availableStock: 2,
        description: 'Kabel roll dengan 6 lubang untuk acara'
      }
    ];

    await Product.insertMany(products);
    console.log('Products initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

initializeProducts();
```

Jalankan dengan:
```bash
node init-db.js
```

---

## Step 4: Run API Server

Buka terminal pertama:
```bash
npm run api:dev
```

Output yang diharapkan:
```
> api:dev
> nodemon api/server.js

[nodemon] 3.0.1
[nodemon] to restart at any time, type `rs`
[nodemon] watching path(s): api/**/* 
[nodemon] watching extensions: js
MongoDB Connected: cluster.mongodb.net
Server running on port 5000
```

Test API dengan:
```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "status": "API Server is running",
  "timestamp": "2024-XX-XXTXX:XX:XX.XXXZ",
  "environment": "development"
}
```

---

## Step 5: Run WhatsApp Bot

Buka terminal kedua (jangan tutup yang pertama):
```bash
npm run bot:dev
```

Output yang diharapkan:
```
> bot:dev
> nodemon bot/index.js

[nodemon] 3.0.1
[nodemon] to restart at any time, type `rs`
[nodemon] watching path(s): bot/**/* 
[nodemon] watching extensions: js
Starting WhatsApp bot...
```

Kemudian akan muncul QR code di terminal. Jangan tutup terminal ini.

---

## Step 6: Scan QR Code

1. **Di WhatsApp Anda:**
   - Buka WhatsApp
   - Tap "Settings" → "Linked Devices" (atau "Device Link" tergantung versi)
   - Tap "Link a Device"

2. **Di Terminal Bot:**
   - Copy seluruh QR code (text art dengan simbol `█` dan space)
   - Paste ke:
     - QR Scanner online (https://zxing.org/w/decode.jspx)
     - Atau scan langsung dari terminal jika mendukung

3. **Setelah scan:**
   - Tunggu pesan di terminal: "WhatsApp bot is ready!"
   - Coba kirim pesan ke nomor Anda sendiri

---

## Step 7: Testing Chatbot

### 7.1 Test via WhatsApp
1. Buka WhatsApp
2. Buka chat dengan nomor Anda (atau group chat)
3. Kirim pesan apapun untuk memulai

Bot akan merespons:
```
Halo! Selamat datang di CASAJA 🔌
Layanan peminjaman kabel roll untuk mahasiswa BINUS Semarang

Silakan pilih menu:
1️⃣ Lihat Produk
2️⃣ Cara Pemesanan
```

### 7.2 Test Chatbot Flow
1. Kirim: `1` (Lihat Produk)
2. Kirim: `1` (Pilih produk pertama)
3. Kirim: `2` (Pilih 2 sesi)
4. Kirim: `Budi Santoso budi@binus.ac.id 2540123456 B220` (Isi data diri)
5. Kirim: `1` (Pilih QRIS)
6. Kirim: `YA` (Konfirmasi)

Bot akan merespons dengan kode order.

### 7.3 Check Database
Buka MongoDB Atlas → Clusters → Collections, verifikasi ada order baru:
- `orders` collection
- `orderitems` collection
- `payments` collection

---

## Step 8: Troubleshooting

### QR Code tidak muncul
- Pastikan terminal cukup besar (minimal 150x50 characters)
- Resize terminal dan coba restart bot
- Atau gunakan online QR decoder

### Bot tidak merespons
- Verifikasi WhatsApp status di terminal
- Check error di console
- Pastikan API server berjalan (check terminal pertama)

### API Error 500
- Check MongoDB connection string
- Verify IP whitelist di MongoDB Atlas
- Check connection di Atlas dashboard

### Port 5000 sudah digunakan
Ubah PORT di `.env`:
```env
PORT=3001
```

### Module not found error
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Production Deployment

### Deploy API Server to Railway

1. Push code ke GitHub:
```bash
git add .
git commit -m "Add chatbot"
git push
```

2. Buka https://railway.app
3. Connect GitHub account
4. Create project → Import dari repository
5. Add environment variables
6. Deploy

### Deploy Bot to Vercel + External Service

Atau gunakan VPS/hosting lain yang mendukung Node.js long-running processes.

---

## API Endpoints Quick Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/products | Ambil semua produk |
| POST | /api/orders | Buat order baru |
| PATCH | /api/orders/:id/status | Update status order |
| POST | /api/payments | Buat payment record |
| GET | /api/orders/phone/:phone | Ambil order by phone |

---

## Next Steps

1. ✅ Setup MongoDB Atlas
2. ✅ Clone/Setup project
3. ✅ Run API server
4. ✅ Run WhatsApp bot
5. ⏭️ Test conversation
6. ⏭️ Setup payment gateway (optional)
7. ⏭️ Deploy to production

---

## Support & Help

- Baca `API_DOCUMENTATION.md` untuk detail endpoint
- Check console untuk error messages
- Lihat commit history di GitHub untuk troubleshooting

---

**Selamat! Chatbot Anda sudah siap digunakan!** 🎉
