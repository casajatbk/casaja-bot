# CASAJA Chatbot - WhatsApp Rental Management System

Sistem chatbot WhatsApp otomatis untuk manajemen peminjaman kabel roll di BINUS Semarang.

## Features

✅ **WhatsApp Integration** - Respons otomatis via Baileys  
✅ **Product Management** - Daftar kabel roll dengan stok real-time  
✅ **Automated Ordering** - Customer bisa pesan langsung di chat  
✅ **Payment Tracking** - Catat metode pembayaran (QRIS, Transfer, Cash)  
✅ **Order History** - Semua order tersimpan di MongoDB  
✅ **24/7 Operation** - Deploy ke Railway untuk running continuous  
✅ **API-First Design** - RESTful API untuk integrasi future  

## Tech Stack

- **Framework**: Express.js (Node.js)
- **WhatsApp**: Baileys (WhatsApp Web Client)
- **Database**: MongoDB Atlas
- **Deployment**: Railway.app
- **Language**: JavaScript (Node.js)

## Project Structure

```
casaja-bot/
├── api/
│   ├── controllers/          # Business logic
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   ├── orderItemController.js
│   │   └── paymentController.js
│   ├── models/               # MongoDB schemas
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── OrderItem.js
│   │   └── Payment.js
│   ├── routes/               # API endpoints
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── orderItems.js
│   │   └── payments.js
│   ├── db.js                 # Database connection
│   └── server.js             # Express server
├── bot/
│   ├── whatsapp.js           # Baileys bot logic
│   └── index.js              # Bot entry point
├── auth_info_baileys/        # WhatsApp session cache
├── .env                      # Environment variables
├── package.json
├── QUICKSTART.md             # Local development guide
├── RAILWAY_DEPLOYMENT.md     # Production deployment
└── README.md                 # This file
```

## API Endpoints

### Products
```
GET    /api/products              - Get all active products
GET    /api/products/:id          - Get product by ID
POST   /api/products              - Create product
PATCH  /api/products/:id/stock    - Update stock
```

### Orders
```
GET    /api/orders                - Get all orders
GET    /api/orders/:id            - Get order with items
POST   /api/orders                - Create order
PATCH  /api/orders/:id/status     - Update order status
GET    /api/orders/phone/:phone   - Get orders by customer phone
```

### Order Items
```
GET    /api/order-items           - Get all order items
POST   /api/order-items           - Create order item
GET    /api/order-items/:orderId  - Get items by order
```

### Payments
```
GET    /api/payments              - Get all payments
POST   /api/payments              - Create payment record
GET    /api/payments/:orderId     - Get payment by order
PATCH  /api/payments/:id/status   - Update payment status
```

## Chat Flow

```
User: Halo
Bot: Menu utama (1. Lihat Produk, 2. Cara Pemesanan, 3. Hubungi Admin)

User: 1 (Lihat Produk)
Bot: Daftar produk dengan harga & stok

User: 1 (Pilih Kabel Roll 4 Lubang)
Bot: Konfirmasi produk, tanya jumlah sesi

User: 2 (2 sesi)
Bot: Minta data (Nama Email NIM Ruangan)

User: Budi budi@binus.ac.id 2540123456 B220
Bot: Pilih metode pembayaran

User: 1 (QRIS)
Bot: Konfirmasi pesanan

User: YA
Bot: Order berhasil! Kode order + instruksi pembayaran
     → Order, OrderItem, Payment otomatis disimpan ke MongoDB
```

## Getting Started

### Option 1: Development Lokal (Recommended untuk testing)

```bash
# 1. Clone atau extract project
cd casaja-bot

# 2. Install dependencies
npm install

# 3. Setup .env dengan MongoDB URI
# Edit .env - pastikan MONGODB_URI sudah benar

# 4. Terminal 1 - Run API Server
npm run api:dev

# 5. Terminal 2 - Run Bot
npm run bot:dev

# 6. Scan QR code dengan WhatsApp
# 7. Test chat flow
```

Lihat: `QUICKSTART.md` untuk detail lengkap

### Option 2: Production Deployment (24/7)

```bash
# 1. Push ke GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# 2. Connect ke Railway.app
# 3. Railway auto-deploy dari GitHub
# 4. Configure environment variables di Railway
# 5. Verify bot online dan scan QR
```

Lihat: `RAILWAY_DEPLOYMENT.md` untuk detail lengkap

## Configuration

### .env Variables

```
# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/casaja_bot

# Server
PORT=5000                          # Port untuk API
NODE_ENV=development               # development atau production
API_URL=http://localhost:5000/api  # API base URL untuk bot
LOG_LEVEL=debug                    # debug, info, warn, error
```

### Environment di Railway

Semua `.env` variables harus di-add juga di Railway dashboard untuk production.

## Data Models

### Product
```javascript
{
  name: String,              // "Kabel Roll 4 Lubang"
  holes: Number,             // 4
  pricePerSession: Number,   // 40000
  availableStock: Number,    // 5
  status: String,            // "active" | "inactive"
  description: String
}
```

### Order
```javascript
{
  orderCode: String,         // "ORD-1234567890"
  customerName: String,
  customerNim: String,
  customerEmail: String,
  customerPhone: String,     // "+6289527749870"
  customerRoom: String,      // "B220"
  paymentMethod: String,     // "midtrans" | "manual_transfer" | "cash"
  sessionCount: Number,      // Jumlah sesi
  subtotalPrice: Number,
  orderStatus: String,       // "waiting_payment" | "confirmed" | "completed" | "cancelled"
  rentalStart: Date,
  rentalEnd: Date
}
```

### Payment
```javascript
{
  orderId: ObjectId,
  paymentMethod: String,     // "midtrans" | "manual_transfer" | "cash"
  amount: Number,
  paymentStatus: String      // "pending" | "completed" | "failed" | "cancelled"
}
```

## Common Tasks

### Add New Product via API

```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kabel Roll 7 Lubang",
    "holes": 7,
    "pricePerSession": 70000,
    "availableStock": 10
  }'
```

### Get All Orders

```bash
curl http://localhost:5000/api/orders
```

### Update Order Status

```bash
curl -X PATCH http://localhost:5000/api/orders/ORDER_ID/status \
  -H "Content-Type: application/json" \
  -d '{"orderStatus": "completed"}'
```

### Update Payment Status

```bash
curl -X PATCH http://localhost:5000/api/payments/PAYMENT_ID/status \
  -H "Content-Type: application/json" \
  -d '{"paymentStatus": "completed"}'
```

## Troubleshooting

### Bot tidak respond

1. Check API running: `curl http://localhost:5000/health`
2. Check bot connected: Lihat log `[v0] WhatsApp Connection OPEN`
3. Re-scan QR code
4. Ensure both API dan bot terminal running

### MongoDB connection error

1. Verify MONGODB_URI di .env
2. Check MongoDB Atlas network access
3. Verify username/password correct
4. Test connection string

### Products tidak muncul

1. Check products exist: `curl http://localhost:5000/api/products`
2. Jika empty, add products via curl (lihat Common Tasks)
3. Check product status = "active"

### Order tidak tersimpan

1. Check MongoDB connection
2. Check API logs untuk error
3. Verify order data lengkap sebelum submit

## Deployment Checklist

- [ ] MongoDB Atlas cluster setup & running
- [ ] Connection string di .env (lokal) & Railway variables
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Railway project created & connected
- [ ] Environment variables configured di Railway
- [ ] Deploy successful (check Railway logs)
- [ ] QR code scanned & bot online
- [ ] Test chat flow completes
- [ ] Check MongoDB untuk verify order created

## Maintenance

### Check Bot Status

```bash
curl http://localhost:5000/health
# atau
curl https://your-railway-url.com/health
```

### View Logs Lokal

```bash
# Terminal yang running API atau bot
# Logs akan muncul real-time dengan [v0] prefix
```

### View Logs di Railway

Railway Dashboard → Select Project → Logs tab

### Backup Data

```bash
# Export products
mongoexport --uri "MONGODB_URI" --collection products --out products.json

# Export orders
mongoexport --uri "MONGODB_URI" --collection orders --out orders.json
```

## Support & Issues

Jika ada masalah:

1. Check logs (`[v0]` messages)
2. Verify `.env` configuration
3. Test API dengan curl
4. Ensure MongoDB Atlas accessible
5. Check Railway logs di dashboard

## Future Enhancements

- [ ] Admin dashboard web interface
- [ ] Payment gateway integration (Midtrans)
- [ ] Customer notification via WhatsApp
- [ ] Automated status updates
- [ ] Analytics & reports
- [ ] Multiple language support
- [ ] Auto-reschedule invalid bookings
- [ ] Rating & review system

## License

Private - BINUS Semarang CASAJA Project

## Author

Created for CASAJA BINUS Semarang rental management system.

---

**Status**: 🟢 Production Ready  
**Last Updated**: January 2024  
**Deployment**: Railway.app (24/7)  
**Docs**: See QUICKSTART.md & RAILWAY_DEPLOYMENT.md
