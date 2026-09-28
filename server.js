console.log("SERVER JS FOUND");

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const formidable = require("formidable");
const fs = require("fs");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROUP_ID = process.env.TELEGRAM_GROUP_ID;

// Escape HTML characters for Telegram HTML mode
function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// Health check
app.get("/", (req, res) => {
    res.json({
        status: "online",
        service: "IVR Telegram Backend"
    });
});

// Receive order from website
app.post("/api/orders", (req, res) => {

    const form = formidable({
        multiples: false,
        keepExtensions: true
    });

    form.parse(req, async (err, fields, files) => {

        if (err) {
            console.error("Form Parse Error:", err);

            return res.status(400).json({
                success: false,
                message: "Could not read order data."
            });
        }

        try {

            const game = fields.game?.[0] || "";
            const playerId = fields.playerId?.[0] || "";
            const zoneId = fields.zoneId?.[0] || "";
            const packageName = fields.package?.[0] || "";
            const price = fields.price?.[0] || "";
            const payment = fields.payment?.[0] || "";
            const accountHolder = fields.accountHolder?.[0] || "";
            const targetPhone = fields.targetPhone?.[0] || "";

            const orderId =
                "IVR-" + Date.now().toString().slice(-8);

            const dateTime = new Date().toLocaleString("en-US", {
                timeZone: "Asia/Yangon"
            });

            // Telegram order message
            let message = 
🎮 <b>NEW IVR TOP-UP ORDER</b>
━━━━━━━━━━━━━━━━━━

🆔 <b>Order ID:</b> <code>${escapeHtml(orderId)}</code>

🎮 <b>Game:</b> ${escapeHtml(game)}

👤 <b>Player ID:</b> <code>${escapeHtml(playerId)}</code>
${zoneId ? 🌐 <b>Zone ID:</b> <code>${escapeHtml(zoneId)}</code> : ""}

💎 <b>Package:</b> ${escapeHtml(packageName)}

💰 <b>Amount:</b> ${escapeHtml(price)} Ks

💳 <b>Payment:</b> ${escapeHtml(payment)}

👤 <b>Account Holder:</b> ${escapeHtml(accountHolder)}

📱 <b>Payment Phone:</b> ${escapeHtml(targetPhone)}

🕐 <b>Date:</b> ${escapeHtml(dateTime)}

━━━━━━━━━━━━━━━━━━
📎 <i>Payment slip attached below.</i>
;

            // Payment slip
            const slip =
                files.slip ||
                files.paymentSlip ||
                files.receipt;

            // Send photo + order information
            if (slip) {

                const slipFile = Array.isArray(slip)
                    ? slip[0]
                    : slip;

                const telegramUrl =
                    https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto;

                const formData = new FormData();

                formData.append("chat_id", GROUP_ID);

                // Read image and convert to Blob
                const fileBuffer = fs.readFileSync(slipFile.filepath);

                const fileBlob = new Blob(
                    [fileBuffer],
                    {
                        type: slipFile.mimetype || "image/jpeg"
                    }
                );

                formData.append(
                    "photo",
                    fileBlob,
                    slipFile.originalFilename || "payment-slip.jpg"
                );

                formData.append("caption", message);
                formData.append("parse_mode", "HTML");

                const response = await fetch(telegramUrl, {
                    method: "POST",
                    body: formData
                });

                const result = await response.json();
                if (!result.ok) {
                    throw new Error(
                        result.description || "Telegram error"
                    );
                }

            } else {

                // Send text only if no slip exists
                const telegramUrl =
                    https://api.telegram.org/bot${BOT_TOKEN}/sendMessage;

                const response = await fetch(telegramUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        chat
