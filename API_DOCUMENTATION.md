# CASAJA WhatsApp Chatbot - API Documentation

## Struktur Project

```
├── api/
│   ├── models/           # Mongoose models
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── OrderItem.js
│   │   └── Payment.js
│   ├── controllers/       # Business logic
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   ├── orderItemController.js
│   │   └── paymentController.js
│   ├── routes/           # API routes
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── orderItems.js
│   │   └── payments.js
│   ├── db.js            # Database connection
│   └── server.js        # Express server
├── bot/
│   ├── index.js         # Bot entry point
│   └── whatsapp.js      # Baileys integration
├── .env                 # Environment variables
└── .env.example         # Example env file
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Edit `.env` file dengan konfigurasi berikut:

```env
# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/casaja_bot

# Server port
PORT=5000

# Environment
NODE_ENV=development

# API URL (untuk bot connect ke API)
API_URL=http://localhost:5000/api
```

### 3. Run API Server

```bash
# Development mode (with hot reload)
npm run api:dev

# Production mode
npm run api:start
```

Server akan berjalan di `http://localhost:5000`

### 4. Run WhatsApp Bot (Separate Terminal)

```bash
# Development mode
npm run bot:dev

# Production mode
npm run bot:start
```

Scan QR code dengan WhatsApp dan gunakan nomor Anda (0895xxxxxxxxx) untuk testing.

---

## API Endpoints

### Products

#### GET /api/products
Ambil semua produk yang aktif
```bash
curl http://localhost:5000/api/products
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Kabel Roll 4 Lubang",
      "holes": 4,
      "pricePerSession": 40000,
      "availableStock": 5,
      "status": "active"
    }
  ],
  "count": 3
}
```

#### GET /api/products/:id
Ambil detail produk berdasarkan ID

#### POST /api/products
Buat produk baru
```json
{
  "name": "Kabel Roll 4 Lubang",
  "holes": 4,
  "pricePerSession": 40000,
  "availableStock": 5,
  "description": "Kabel roll dengan 4 lubang untuk acara"
}
```

#### PATCH /api/products/:id/stock
Update stok produk
```json
{
  "availableStock": 10
}
```

---

### Orders

#### GET /api/orders
Ambil semua order

#### GET /api/orders/:id
Ambil detail order dengan item dan payment
```bash
curl http://localhost:5000/api/orders/order-id
```

Response:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "orderCode": "ORD-1234567890",
    "customerName": "Budi Santoso",
    "customerNim": "2540123456",
    "customerEmail": "budi@binus.ac.id",
    "customerPhone": "0895xxxxxxxxx",
    "customerRoom": "B220",
    "sessionCount": 2,
    "subtotalPrice": 80000,
    "orderStatus": "waiting_payment",
    "items": [
      {
        "_id": "...",
        "productId": { "name": "Kabel Roll 4 Lubang" },
        "quantity": 1,
        "pricePerSession": 40000,
        "subtotalPrice": 80000
      }
    ],
    "payment": {
      "_id": "...",
      "paymentMethod": "midtrans",
      "amount": 80000,
      "paymentStatus": "pending"
    }
  }
}
```

#### GET /api/orders/phone/:phone
Ambil order berdasarkan nomor telepon
```bash
curl http://localhost:5000/api/orders/phone/0895xxxxxxxxx
```

#### POST /api/orders
Buat order baru (dibuat oleh bot)
```json
{
  "customerName": "Budi Santoso",
  "customerNim": "2540123456",
  "customerEmail": "budi@binus.ac.id",
  "customerPhone": "0895xxxxxxxxx",
  "customerRoom": "B220",
  "paymentMethod": "midtrans",
  "sessionCount": 2,
  "subtotalPrice": 80000
}
```

#### PATCH /api/orders/:id/status
Update status order
```json
{
  "orderStatus": "confirmed"
}
```

Status yang tersedia:
- `waiting_payment` - Menunggu pembayaran
- `confirmed` - Pembayaran dikonfirmasi
- `completed` - Order selesai
- `cancelled` - Order dibatalkan

---

### Order Items

#### POST /api/order-items
Buat item dalam order (dibuat oleh bot)
```json
{
  "orderId": "order-id",
  "productId": "product-id",
  "quantity": 1,
  "pricePerSession": 40000,
  "subtotalPrice": 80000
}
```

#### GET /api/order-items/:orderId
Ambil semua item dalam order

---

### Payments

#### POST /api/payments
Buat record pembayaran (dibuat oleh bot)
```json
{
  "orderId": "order-id",
  "paymentMethod": "midtrans",
  "amount": 80000
}
```

#### GET /api/payments/order/:orderId
Ambil info pembayaran berdasarkan order ID

#### PATCH /api/payments/:id/status
Update status pembayaran
```json
{
  "paymentStatus": "completed"
}
```

Status yang tersedia:
- `pending` - Menunggu pembayaran
- `completed` - Pembayaran selesai
- `failed` - Pembayaran gagal
- `cancelled` - Pembayaran dibatalkan

---

## WhatsApp Bot Flow

### Menu Utama
1. Lihat Produk - Menampilkan daftar produk
2. Cara Pemesanan - Menampilkan instruksi pemesanan

### Flow Pemesanan
1. User memilih produk
2. User memilih jumlah sesi
3. User mengisi data diri (Nama, Email, NIM, Ruangan)
4. User memilih metode pembayaran
5. User mengkonfirmasi pesanan
6. Sistem membuat order, order item, dan payment record di database

### Format Input Data Diri
```
Nama Email NIM Ruangan
```

Contoh:
```
Budi Santoso budi@binus.ac.id 2540123456 B220
```

---

## Database Schema

### Products Collection
```javascript
{
  name: String,                  // Nama produk
  holes: Number,                 // Jumlah lubang
  description: String,           // Deskripsi
  pricePerSession: Number,       // Harga per sesi
  availableStock: Number,        // Stok tersedia
  totalStock: Number,            // Total stok
  status: String,                // active/inactive
  image: String,                 // URL gambar
  createdAt: Date,
  updatedAt: Date
}
```

### Orders Collection
```javascript
{
  orderCode: String,             // Kode unik order
  customerName: String,
  customerNim: String,           // NIM Binus
  customerEmail: String,
  customerPhone: String,
  customerRoom: String,          // Ruangan pengguna
  paymentMethod: String,         // midtrans/manual_transfer/cash
  sessionCount: Number,          // Jumlah sesi
  subtotalPrice: Number,
  rentalStart: Date,
  rentalEnd: Date,
  orderStatus: String,           // waiting_payment/confirmed/completed/cancelled
  createdAt: Date,
  updatedAt: Date
}
```

### OrderItems Collection
```javascript
{
  orderId: ObjectId,             // Reference ke Order
  productId: ObjectId,           // Reference ke Product
  quantity: Number,
  pricePerSession: Number,
  subtotalPrice: Number,
  createdAt: Date
}
```

### Payments Collection
```javascript
{
  orderId: ObjectId,             // Reference ke Order
  paymentMethod: String,
  amount: Number,
  paymentStatus: String,         // pending/completed/failed/cancelled
  paymentProof: String,          // URL bukti transfer
  midtransTransactionId: String, // ID dari Midtrans (jika QRIS)
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Deployment ke Vercel

### 1. Setup GitHub Repository
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/casaja-bot.git
git push -u origin main
```

### 2. Deploy API Server
Gunakan platform seperti Railway, Render, atau Heroku untuk deploy Express server:

```bash
# Railway.app
railway link
railway up
```

### 3. Deploy Bot
Bot bisa di-host di VPS atau platform serverless. Untuk Vercel, gunakan cron job atau external service.

### 4. Update Environment Variables
Setelah deploy, update `.env` dengan production URLs dan credentials.

---

## Testing dengan Postman

1. Import collection ke Postman
2. Update `{{base_url}}` variable menjadi `http://localhost:5000` (development) atau production URL
3. Test setiap endpoint

---

## Troubleshooting

### WhatsApp Connection Error
- Pastikan nomor WhatsApp terdaftar di device
- Scan QR code dengan benar
- Jangan tutup process bot sampai QR ter-scan

### MongoDB Connection Error
- Verifikasi connection string di `.env`
- Pastikan IP Anda ditambahkan di MongoDB Atlas whitelist
- Check Network Access di MongoDB Atlas settings

### API Not Responding
- Pastikan server sudah running di port yang benar
- Check console untuk error messages
- Restart server jika ada perubahan

---

## Support
Untuk bantuan lebih lanjut, hubungi admin CASAJA atau buka issue di GitHub repository.
