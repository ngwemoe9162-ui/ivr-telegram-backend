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
            console.error(err);
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
                "IVR-" +
                Date.now().toString().slice(-8);

            const dateTime = new Date().toLocaleString("en-US", {
                timeZone: "Asia/Yangon"
            });

            let message = 
🎮 <b>NEW IVR TOP-UP ORDER</b>
━━━━━━━━━━━━━━━━━━

🆔 <b>Order ID:</b> <code>${orderId}</code>

🎮 <b>Game:</b> ${game}

👤 <b>Player ID:</b> <code>${playerId}</code>
${zoneId ? 🌐 <b>Zone ID:</b> <code>${zoneId}</code> : ""}

💎 <b>Package:</b> ${packageName}

💰 <b>Amount:</b> ${price} Ks

💳 <b>Payment:</b> ${payment}

👤 <b>Account Holder:</b> ${accountHolder}

📱 <b>Payment Phone:</b> ${targetPhone}

🕐 <b>Date:</b> ${dateTime}

━━━━━━━━━━━━━━━━━━
📎 <i>Payment slip attached below.</i>
;

            const slip =
                files.slip ||
                files.paymentSlip ||
                files.receipt;

            if (slip) {

                const slipFile = Array.isArray(slip)
                    ? slip[0]
                    : slip;

                const telegramUrl =
                    https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto;

                const formData = new FormData();

                formData.append("chat_id", GROUP_ID);
                formData.append(
                    "photo",
                    fs.createReadStream(slipFile.filepath)
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

                const telegramUrl =
                    https://api.telegram.org/bot${BOT_TOKEN}/sendMessage;

                const response = await fetch(telegramUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        chat_id: GROUP_ID,
                        text: message,
                        parse_mode: "HTML"
                    })
                });

                const result = await response.json();

                if (!result.ok) {
                    throw new Error(
                        result.description || "Telegram error"
                    );
                }
            }
          return res.json({
                success: true,
                orderId: orderId,
                message: "Order sent successfully."
            });

        } catch (error) {

            console.error("Order Error:", error);

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    });
});

app.listen(PORT, () => {
    console.log(
        IVR Telegram Backend running on port ${PORT}
    );
});
