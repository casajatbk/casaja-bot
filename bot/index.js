require("dotenv").config();

import("./whatsapp.mjs").then(({ initializeWhatsApp }) =>
  startBot(initializeWhatsApp),
);

async function startBot(initializeWhatsApp) {
  try {
    console.log("[v0] Starting WhatsApp bot...");
    console.log("[v0] Environment:", process.env.NODE_ENV || "development");
    console.log(
      "[v0] API URL:",
      process.env.API_URL || "http://localhost:5000/api",
    );

    await initializeWhatsApp();

    console.log("[v0] WhatsApp bot is ready!");
    console.log("[v0] Waiting for messages...");
  } catch (error) {
    console.error("[v0] Failed to start bot:", error.message);
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  console.log("[v0] Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("[v0] Shutting down gracefully...");
  process.exit(0);
});
