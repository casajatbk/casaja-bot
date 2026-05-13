import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  jidDecode,
} from "@whiskeysockets/baileys";

import qrcode from "qrcode-terminal";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pino from "pino";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = process.env.API_URL || "http://localhost:5000/api";
const AUTH_DIR = path.join(__dirname, "../auth_info_baileys");

let sock;
let userSessions = {};
let isConnected = false;

if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

export async function initializeWhatsApp() {
  try {
    console.log("[v0] Initializing WhatsApp...");

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      auth: state,
      version,
      logger: pino({ level: "silent" }),
      browser: ["CASAJA", "Chrome", "1.0.0"],
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log("\n[v0] ╔════════════════════════════════╗");
        console.log("[v0] ║   SCAN QR CODE DENGAN WHATSAPP   ║");
        console.log("[v0] ╚════════════════════════════════╝\n");
        qrcode.generate(qr, { small: true });
      }

      if (connection === "open") {
        isConnected = true;
        console.log("\n[v0] ✅ BOT CONNECTED - Ready to receive messages!\n");
      } else if (connection === "connecting") {
        console.log("[v0] Connecting to WhatsApp...");
      } else if (connection === "close") {
        isConnected = false;
        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !==
          DisconnectReason.loggedOut;
        console.log(
          "[v0] Connection closed:",
          JSON.stringify(lastDisconnect, null, 2),
        );
        if (shouldReconnect) {
          console.log("[v0] Attempting to reconnect in 5 seconds...");
          setTimeout(() => initializeWhatsApp(), 5000);
        }
      }
    });

    sock.ev.on("messages.upsert", async (m) => {
      if (!m.messages) return;

      for (const message of m.messages) {
        if (message.key.fromMe || !message.message) continue;

        const sender = message.key.participant || message.key.remoteJid;

        const text =
          message.message?.conversation ||
          message.message?.extendedTextMessage?.text ||
          "";

        const buttonReply =
          message.message?.buttonsResponseMessage?.selectedButtonId ||
          message.message?.templateButtonReplyMessage?.selectedId;

        // =====================================================
        // ADMIN BUTTON ACTION
        // =====================================================

        if (buttonReply) {
          try {
            // APPROVE
            if (buttonReply.startsWith("approve_")) {
              const paymentId = buttonReply.replace("approve_", "");

              await axios.patch(`${API_URL}/payments/${paymentId}`, {
                paymentStatus: "approved",
              });

              await sock.sendMessage(sender, {
                text: "✅ Pembayaran berhasil di-approve",
              });

              continue;
            }

            // REJECT
            if (buttonReply.startsWith("reject_")) {
              const paymentId = buttonReply.replace("reject_", "");

              await axios.patch(`${API_URL}/payments/${paymentId}`, {
                paymentStatus: "rejected",
              });

              await sock.sendMessage(sender, {
                text: "❌ Pembayaran berhasil di-reject",
              });

              continue;
            }
          } catch (error) {
            console.error("[v0] Button action error:", error.message);

            await sock.sendMessage(sender, {
              text: "❌ Gagal update payment status",
            });

            continue;
          }
        }

        const hasImage = !!message.message?.imageMessage;

        if (!text && !hasImage) continue;

        console.log(`[v0] Message from ${sender}: ${text}`);

        const ADMIN_NUMBER = "6289527749870@s.whatsapp.net";

        if (sender === ADMIN_NUMBER) {
          try {
            const lowerText = text.toLowerCase().trim();

            // APPROVE
            if (lowerText.startsWith("approve ")) {
              const paymentId = lowerText.replace("approve ", "").trim();

              await axios.patch(`${API_URL}/payments/${paymentId}`, {
                paymentStatus: "approved",
              });

              await sock.sendMessage(sender, {
                text: `✅ Payment berhasil di-approve\n\nID: ${paymentId}`,
              });

              continue;
            }

            // REJECT
            if (lowerText.startsWith("reject ")) {
              const paymentId = lowerText.replace("reject ", "").trim();

              await axios.patch(`${API_URL}/payments/${paymentId}`, {
                paymentStatus: "rejected",
              });

              await sock.sendMessage(sender, {
                text: `❌ Payment berhasil di-reject\n\nID: ${paymentId}`,
              });

              continue;
            }
          } catch (error) {
            console.error("[v0] Admin command error:", error.message);

            await sock.sendMessage(sender, {
              text: "❌ Gagal update payment status",
            });

            continue;
          }
        }
        await handleMessage(sender, text, hasImage);
      }
    });

    return sock;
  } catch (error) {
    console.error("[v0] Error:", error.message);
    setTimeout(() => initializeWhatsApp(), 5000);
  }
}

// ============================================================
// Sesi peminjaman yang tersedia
// ============================================================
const RENTAL_SESSIONS = {
  1: {
    label: "07.20 – 09.00",
    startHour: 7,
    startMinute: 20,
    endHour: 9,
    endMinute: 0,
  },
  2: {
    label: "09.20 – 11.00",
    startHour: 9,
    startMinute: 20,
    endHour: 11,
    endMinute: 0,
  },
  3: {
    label: "11.20 – 13.00",
    startHour: 11,
    startMinute: 20,
    endHour: 13,
    endMinute: 0,
  },
  4: {
    label: "13.20 – 15.00",
    startHour: 13,
    startMinute: 20,
    endHour: 15,
    endMinute: 0,
  },
  5: {
    label: "15.20 – 17.00",
    startHour: 15,
    startMinute: 20,
    endHour: 17,
    endMinute: 0,
  },
};

// ============================================================
// Main message handler
// Flow baru: welcome → menu → input_date → select_session
//            → select_product → input_data → select_payment → confirm
// ============================================================
async function handleMessage(sender, text, hasImage = false) {
  try {
    const userInput = text.trim().toLowerCase();

    // Inisialisasi sesi user jika belum ada
    if (!userSessions[sender]) {
      userSessions[sender] = {
        step: "welcome",
        orderData: {},
        selectedProduct: null,
        products: [],
      };
    }

    // Ketik "end" untuk mengakhiri chatbot kapan saja
    if (userInput === "end") {
      userSessions[sender] = {
        step: "idle",
        orderData: {},
        selectedProduct: null,
        products: [],
      };
      await sendMessage(
        sender,
        "Chatbot CASAJA telah diakhiri.\n\nKetik pesan apapun untuk memulai kembali 😊",
      );
      return;
    }

    // Reset ke welcome jika sebelumnya idle
    if (userSessions[sender].step === "idle") {
      userSessions[sender] = {
        step: "welcome",
        orderData: {},
        selectedProduct: null,
        products: [],
      };
    }

    // ============================================================
    // MODE HANDOVER KE ADMIN
    // ============================================================
    if (userSessions[sender].step === "handover") {
      // User ingin kembali ke chatbot
      if (
        userInput === "menu" ||
        userInput === "start" ||
        userInput === "halo"
      ) {
        userSessions[sender] = {
          step: "welcome",
          orderData: {},
          selectedProduct: null,
          products: [],
        };

        await sendMessage(
          sender,
          "🤖 Chatbot CASAJA aktif kembali.\n\nKetik menu yang tersedia 😊",
        );

        return;
      }

      // Selain keyword di atas → biarkan admin handle
      return;
    }

    const session = userSessions[sender];
    let response = "";

    switch (session.step) {
      // ----------------------------------------------------------
      // STEP 1: Sambutan awal
      // ----------------------------------------------------------
      case "welcome":
        response =
          `Halo! Selamat datang di CASAJA 🔌\n` +
          `Layanan peminjaman kabel roll untuk mahasiswa BINUS Semarang\n\n` +
          `Silakan pilih menu:\n` +
          `1️⃣ Pinjam Kabel\n` +
          `2️⃣ Cara Pemesanan\n` +
          `3️⃣ Hubungi Admin`;
        session.step = "menu";
        break;

      // ----------------------------------------------------------
      // STEP 2: Menu utama
      // ----------------------------------------------------------
      case "menu":
        if (userInput === "1") {
          response =
            `📅 Masukkan tanggal peminjaman\n` +
            `Format: YYYY-MM-DD\n\n` +
            `Contoh:\n` +
            `${getTodayFormatted()}`;
          session.step = "input_date";
        } else if (userInput === "2") {
          response =
            `📋 Cara Pemesanan:\n` +
            `1. Masukkan tanggal peminjaman\n` +
            `2. Pilih sesi waktu\n` +
            `3. Pilih kabel yang tersedia\n` +
            `4. Isi data diri\n` +
            `5. Pilih metode pembayaran\n` +
            `6. Konfirmasi pesanan`;
          session.step = "menu";
        } else if (userInput === "3") {
          response =
            `📞 Admin CASAJA:\n` +
            `WA: +62 895 2774 9870\n` +
            `Email: casajatbk@gmail.com`;
          session.step = "menu";
        } else {
          response = `Pilihan tidak valid. Silakan ketik 1, 2, atau 3`;
        }
        break;

      // ----------------------------------------------------------
      // STEP 3: Input tanggal peminjaman
      // ----------------------------------------------------------
      case "input_date": {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

        if (!dateRegex.test(userInput)) {
          response =
            `❌ Format tanggal tidak valid.\n\n` +
            `Gunakan format: YYYY-MM-DD\n\n` +
            `Contoh:\n` +
            `${getTodayFormatted()}`;
          break;
        }

        const [year, month, day] = userInput.split("-");
        const selectedDate = new Date(year, month - 1, day);

        if (isNaN(selectedDate.getTime())) {
          response = `❌ Tanggal tidak valid. Coba lagi.`;
          break;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
          response = `❌ Tanggal tidak boleh kurang dari hari ini. Coba lagi.`;
          break;
        }

        session.orderData.rentalDate = userInput;

        response =
          `📅 Tanggal dipilih: ${userInput}\n\n` +
          `⏰ Pilih Sesi Peminjaman:\n` +
          `1️⃣ 07.20 – 09.00\n` +
          `2️⃣ 09.20 – 11.00\n` +
          `3️⃣ 11.20 – 13.00\n` +
          `4️⃣ 13.20 – 15.00\n` +
          `5️⃣ 15.20 – 17.00\n\n` +
          `Silakan pilih nomor sesi (1-5)`;

        session.step = "select_session";
        break;
      }

      // ----------------------------------------------------------
      // STEP 4: Pilih sesi → fetch produk yang tersedia
      // ----------------------------------------------------------
      case "select_session": {
        if (!RENTAL_SESSIONS[userInput]) {
          response = `❌ Silakan pilih nomor sesi 1 sampai 5`;
          break;
        }

        const selectedSession = RENTAL_SESSIONS[userInput];
        session.orderData.rentalSession = selectedSession.label;

        const [year, month, day] = session.orderData.rentalDate.split("-");
        const rentalDate = new Date(year, month - 1, day);

        const rentalStart = new Date(rentalDate);
        rentalStart.setHours(
          selectedSession.startHour,
          selectedSession.startMinute,
          0,
          0,
        );

        const rentalEnd = new Date(rentalDate);
        rentalEnd.setHours(
          selectedSession.endHour,
          selectedSession.endMinute,
          0,
          0,
        );

        session.orderData.rentalStart = rentalStart;
        session.orderData.rentalEnd = rentalEnd;

        // Fetch produk yang tersedia pada sesi ini
        try {
          const productsRes = await axios.get(`${API_URL}/products/available`, {
            params: {
              rentalStart: rentalStart.toISOString(),
              rentalEnd: rentalEnd.toISOString(),
            },
            timeout: 10000,
          });

          if (productsRes.data.success && productsRes.data.data.length > 0) {
            session.products = productsRes.data.data;
            response =
              `✅ Sesi dipilih: ${selectedSession.label}\n` +
              `📅 Tanggal: ${session.orderData.rentalDate}\n\n` +
              formatProductList(session.products);
            session.step = "select_product";
          } else {
            response =
              `⚠️ Tidak ada kabel yang tersedia untuk:\n` +
              `📅 Tanggal: ${session.orderData.rentalDate}\n` +
              `⏰ Sesi: ${selectedSession.label}\n\n` +
              `Silakan pilih tanggal atau sesi lain.\n\n` +
              `1️⃣ Ganti tanggal\n` +
              `2️⃣ Ganti sesi\n` +
              `3️⃣ Kembali ke menu`;
            session.step = "no_stock_menu";
          }
        } catch (error) {
          console.error(
            "[v0] Error fetching available products:",
            error.message,
          );
          response = `❌ Gagal mengambil data produk. Silakan coba lagi.`;
        }
        break;
      }

      // ----------------------------------------------------------
      // STEP 4b: Tidak ada stok — pilih opsi lanjut
      // ----------------------------------------------------------
      case "no_stock_menu":
        if (userInput === "1") {
          response =
            `📅 Masukkan tanggal peminjaman baru\n` +
            `Format: YYYY-MM-DD\n\n` +
            `Contoh:\n` +
            `${getTodayFormatted()}`;
          session.step = "input_date";
        } else if (userInput === "2") {
          response =
            `⏰ Pilih Sesi Peminjaman:\n` +
            `1️⃣ 07.20 – 09.00\n` +
            `2️⃣ 09.20 – 11.00\n` +
            `3️⃣ 11.20 – 13.00\n` +
            `4️⃣ 13.20 – 15.00\n` +
            `5️⃣ 15.20 – 17.00\n\n` +
            `Silakan pilih nomor sesi (1-5)`;
          session.step = "select_session";
        } else if (userInput === "3") {
          response =
            `Silakan pilih menu:\n` +
            `1️⃣ Pinjam Kabel\n` +
            `2️⃣ Cara Pemesanan\n` +
            `3️⃣ Hubungi Admin`;
          session.step = "menu";
        } else {
          response = `Pilihan tidak valid. Ketik 1, 2, atau 3`;
        }
        break;

      // ----------------------------------------------------------
      // STEP 5: Pilih produk
      // ----------------------------------------------------------
      case "select_product": {
        const selectedHole = parseInt(userInput);

        const prod = session.products.find((p) => {
          const lubang = parseInt(p.name.match(/\d+/)?.[0]);
          return lubang === selectedHole;
        });

        if (prod) {
          session.selectedProduct = prod;

          response =
            `✅ Kamu memilih ${prod.name}\n\n` +
            `📝 Silakan isi data berikut:\n\n` +
            `Nama: [nama kamu]\n` +
            `NIM: [10 digit NIM]\n` +
            `Email Binus: [email@binus.ac.id]\n` +
            `Ruangan: [3 digit nomor ruangan]\n\n` +
            `Contoh:\n` +
            `Nama: Budi\n` +
            `NIM: 2601234567\n` +
            `Email Binus: budi@binus.ac.id\n` +
            `Ruangan: 201`;

          session.step = "input_data";
        } else {
          response =
            `❌ Produk tidak valid.\n\n` +
            `Ketik jumlah lubang sesuai daftar di atas.\n` +
            `Contoh: 4 / 5 / 6`;
        }
        break;
      }

      // ----------------------------------------------------------
      // STEP 6: Input data diri
      // ----------------------------------------------------------
      case "input_data": {
        const lines = text.split("\n").map((line) => line.trim());

        const nameLine = lines.find((line) =>
          line.toLowerCase().startsWith("nama:"),
        );
        const nimLine = lines.find((line) =>
          line.toLowerCase().startsWith("nim:"),
        );
        const emailLine = lines.find((line) =>
          line.toLowerCase().startsWith("email binus:"),
        );
        const roomLine = lines.find((line) =>
          line.toLowerCase().startsWith("ruangan:"),
        );

        if (!nameLine || !nimLine || !emailLine || !roomLine) {
          response =
            `❌ Format tidak sesuai.\n\n` +
            `Gunakan format berikut:\n\n` +
            `Nama: Budi\n` +
            `NIM: 2601234567\n` +
            `Email Binus: budi@binus.ac.id\n` +
            `Ruangan: 201`;
          break;
        }

        const customerName = nameLine.replace(/nama:/i, "").trim();
        const customerNim = nimLine.replace(/nim:/i, "").trim();
        const customerEmail = emailLine.replace(/email binus:/i, "").trim();
        const deliveryRoom = roomLine.replace(/ruangan:/i, "").trim();

        if (!/^\d{10}$/.test(customerNim)) {
          response = `❌ NIM harus terdiri dari 10 angka`;
          break;
        }

        if (!customerEmail.endsWith("@binus.ac.id")) {
          response = `❌ Email harus menggunakan domain @binus.ac.id`;
          break;
        }

        if (!/^\d{3}$/.test(deliveryRoom)) {
          response = `❌ Ruangan harus terdiri dari 3 angka (contoh: 201)`;
          break;
        }

        session.orderData.customerName = customerName;
        session.orderData.customerEmail = customerEmail;
        session.orderData.customerNim = customerNim;
        session.orderData.deliveryRoom = deliveryRoom;

        response =
          `💳 Pilih Metode Pembayaran:\n\n` +
          `1️⃣ QRIS\n` +
          `2️⃣ Transfer\n` +
          `3️⃣ Cash`;

        session.step = "select_payment";
        break;
      }

      // ----------------------------------------------------------
      // STEP 7: Pilih metode pembayaran
      // ----------------------------------------------------------
      case "select_payment": {
        const methods = {
          1: "qris",
          2: "transfer",
          3: "cash",
        };

        const paymentLabels = {
          qris: "QRIS",
          transfer: "Transfer",
          cash: "Cash",
        };

        if (methods[userInput]) {
          session.orderData.paymentMethod = methods[userInput];

          response =
            `📋 Konfirmasi Pesanan:\n\n` +
            `🔌 Produk: ${session.selectedProduct.name}\n` +
            `💰 Harga: Rp ${formatRupiah(session.selectedProduct.pricePerSession)}\n` +
            `📅 Tanggal: ${session.orderData.rentalDate}\n` +
            `⏰ Sesi: ${session.orderData.rentalSession}\n` +
            `👤 Nama: ${session.orderData.customerName}\n` +
            `🎓 NIM: ${session.orderData.customerNim}\n` +
            `🚪 Ruangan: ${session.orderData.deliveryRoom}\n` +
            `💳 Bayar: ${paymentLabels[session.orderData.paymentMethod]}\n\n` +
            `Ketik *YA* untuk konfirmasi atau *BATAL* untuk membatalkan`;

          session.step = "confirm";
        } else {
          response =
            `Pilihan tidak valid.\n\n` +
            `1️⃣ QRIS\n` +
            `2️⃣ Transfer\n` +
            `3️⃣ Cash`;
        }

        break;
      }

      case "confirm":
        if (userInput === "ya") {
          try {
            // create order setelah user confirm
            const code = await createOrder(session, sender);

            session.orderData.orderCode = code;

            // =====================================================
            // QRIS
            // =====================================================
            if (session.orderData.paymentMethod === "qris") {
              response =
                `🙌 Hai ${session.orderData.customerName}! ` +
                `Pesanan kamu sudah kami terima ya\n\n` +
                `💳 Silakan lakukan pembayaran terlebih dahulu`;

              await sendMessage(sender, response);

              await sendImage(
                sender,
                "https://kaj5bd5xtsvgxojs.public.blob.vercel-storage.com/QRIS.jpeg",
                `📲 Scan QRIS berikut untuk pembayaran\n\n` +
                  `Setelah pembayaran, kirim bukti ya 👍`,
              );

              session.step = "waiting_payment_proof";

              return;
            }

            // =====================================================
            // TRANSFER
            // =====================================================
            else if (session.orderData.paymentMethod === "transfer") {
              response =
                `🙌 Hai ${session.orderData.customerName}! ` +
                `Pesanan kamu sudah kami terima ya\n\n` +
                `💳 Silakan lakukan pembayaran terlebih dahulu\n\n` +
                `🏦 Transfer ke rekening berikut:\n` +
                `BCA - 123456789 a.n CASAJA\n\n` +
                `Setelah transfer, kirim bukti ya 👍`;

              session.step = "waiting_payment_proof";
            }

            // =====================================================
            // CASH
            // =====================================================
            else if (session.orderData.paymentMethod === "cash") {
              response =
                `🙌 Hai ${session.orderData.customerName}! ` +
                `Pesanan kamu sudah kami terima ya\n\n` +
                `💵 Pembayaran dilakukan saat pengantaran (cash)\n\n` +
                `🔌 Kabel akan kami antar ke Ruangan ${session.orderData.deliveryRoom} sebelum sesi dimulai\n\n` +
                `Terima kasih sudah menggunakan CASAJA! 🙏`;

              await sendAdminApprovalMessage({
                paymentId: session.orderData.paymentId,
                orderCode: session.orderData.orderCode,
                customerName: session.orderData.customerName,
                customerPhone: sender.split("@")[0],
                productName: session.selectedProduct.name,
                rentalDate: session.orderData.rentalDate,
                rentalSession: session.orderData.rentalSession,
                paymentMethod: session.orderData.paymentMethod,
              });

              userSessions[sender] = {
                step: "idle",
                orderData: {},
                selectedProduct: null,
                products: [],
              };
            }
          } catch (error) {
            console.error("[v0] Error creating order:", error.message);

            response =
              `❌ Gagal membuat pesanan.\n` +
              `Silakan coba lagi atau hubungi admin.`;

            session.step = "menu";
          }
        }

        // =====================================================
        // BATAL
        // =====================================================
        else if (userInput === "batal") {
          response =
            `🚫 Pesanan dibatalkan.\n\n` + `Ketik apapun untuk memulai ulang.`;

          userSessions[sender] = {
            step: "welcome",
            orderData: {},
            selectedProduct: null,
            products: [],
          };
        }

        // =====================================================
        // INVALID
        // =====================================================
        else {
          response = `Ketik *YA* untuk konfirmasi atau *BATAL* untuk membatalkan`;
        }

        break;

      case "waiting_payment_proof":
        if (!hasImage) {
          response = `📸 Silakan kirim bukti pembayaran dalam bentuk gambar ya 👍`;
          break;
        }

        await sendAdminApprovalMessage({
          paymentId: session.orderData.paymentId,
          orderCode: session.orderData.orderCode,
          customerName: session.orderData.customerName,
          customerPhone: sender.split("@")[0],
          productName: session.selectedProduct.name,
          rentalDate: session.orderData.rentalDate,
          rentalSession: session.orderData.rentalSession,
          paymentMethod: session.orderData.paymentMethod,
        });

        response =
          `✅ Bukti pembayaran berhasil dikirim!\n\n` +
          `Mohon tunggu admin melakukan verifikasi pembayaran 🙏`;

        userSessions[sender] = {
          step: "idle",
          orderData: {},
          selectedProduct: null,
          products: [],
        };

        break;

      default:
        userSessions[sender] = {
          step: "welcome",
          orderData: {},
          selectedProduct: null,
          products: [],
        };
        response = `Ketik apapun untuk memulai 😊`;
    }

    await sendMessage(sender, response);
  } catch (error) {
    console.error("[v0] Error:", error);
    await sendMessage(sender, `❌ Terjadi error. Silakan coba lagi.`);
  }
}

// ============================================================
// Format daftar produk yang tersedia (setelah sesi dipilih)
// ============================================================
function formatProductList(products) {
  if (!products?.length) {
    return "Tidak ada produk tersedia";
  }

  let list = `🔌 Kabel Tersedia untuk Sesi Ini:\n\n`;

  products.forEach((p) => {
    const lubang = p.name.match(/\d+/)?.[0] || "?";
    list += `Kabel Roll ${lubang} Lubang (${lubang}k) → Stok: ${p.remainingStock}\n`;
  });

  list += `\n📌 Ketik jumlah lubang yang ingin dipinjam\n(contoh: 4 / 5 / 6)`;

  return list;
}

// ============================================================
// Buat order ke API
// ============================================================
async function createOrder(session, phone) {
  const price = session.selectedProduct.pricePerSession;

  const order = await axios.post(`${API_URL}/orders`, {
    customerName: session.orderData.customerName,
    customerEmail: session.orderData.customerEmail,
    customerNim: session.orderData.customerNim,
    customerPhone: phone,
    deliveryRoom: session.orderData.deliveryRoom,
    paymentMethod: session.orderData.paymentMethod,
    sessionCount: 1,
    subtotalPrice: price,
    orderStatus: "waiting_payment",
  });

  if (!order.data.success) {
    throw new Error("Order failed");
  }

  const orderId = order.data.data._id;

  await axios.post(`${API_URL}/order-items`, {
    orderId,
    productId: session.selectedProduct._id,
    quantity: 1,
    pricePerSession: session.selectedProduct.pricePerSession,
    subtotalPrice: price,
    rentalStart: session.orderData.rentalStart,
    rentalEnd: session.orderData.rentalEnd,
  });

  const paymentRes = await axios.post(`${API_URL}/payments`, {
    orderId,
    paymentMethod: session.orderData.paymentMethod,
    amount: price,
    paymentStatus: "waiting_payment",
  });

  session.orderData.paymentId = paymentRes.data.data._id;

  return order.data.data.orderCode;
}

// ============================================================
// Kirim pesan WhatsApp
// ============================================================
async function sendMessage(phone, msg) {
  try {
    if (!sock?.user) {
      console.log("[v0] Bot not ready");
      return;
    }
    await sock.sendMessage(phone, { text: msg });
  } catch (error) {
    console.error("[v0] Send error:", error.message);
  }
}

// ============================================================
// Helper: format tanggal hari ini ke YYYY-MM-DD
// ============================================================
function getTodayFormatted() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ============================================================
// Helper: format angka ke Rupiah (tanpa "Rp")
// ============================================================
function formatRupiah(amount) {
  return amount.toLocaleString("id-ID");
}

// ============================================================
// Kirim gambar WhatsApp
// ============================================================
async function sendImage(phone, imageUrl, caption = "") {
  try {
    if (!sock?.user) {
      console.log("[v0] Bot not ready");
      return;
    }

    await sock.sendMessage(phone, {
      image: {
        url: imageUrl,
      },
      caption,
    });
  } catch (error) {
    console.error("[v0] Send image error:", error.message);
  }
}

// ============================================================
// Kirim approval ke admin
// ============================================================
async function sendAdminApprovalMessage(data) {
  try {
    // const ADMIN_NUMBER = "6289527749870@s.whatsapp.net";
    const ADMIN_NUMBER = "62811294957@s.whatsapp.net";

    await sock.sendMessage(ADMIN_NUMBER, {
      text:
        `📦 Order Baru CASAJA\n\n` +
        `🧾 Order: ${data.orderCode}\n` +
        `👤 ${data.customerName}\n` +
        `📱 ${data.customerPhone}\n` +
        `🔌 ${data.productName}\n` +
        `📅 ${data.rentalDate}\n` +
        `⏰ ${data.rentalSession}\n` +
        `💳 ${data.paymentMethod}\n\n` +
        `Pilih aksi di bawah:`,

      footer: "CASAJA",

      buttons: [
        {
          buttonId: `approve_${data.paymentId}`,
          buttonText: {
            displayText: "✅ Approve",
          },
          type: 1,
        },
        {
          buttonId: `reject_${data.paymentId}`,
          buttonText: {
            displayText: "❌ Reject",
          },
          type: 1,
        },
      ],

      headerType: 1,
    });

    console.log("[v0] SUCCESS SEND ADMIN BUTTON");
  } catch (error) {
    console.error("[v0] Admin notif error:", error.message);
  }
}
