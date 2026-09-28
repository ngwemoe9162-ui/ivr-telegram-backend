const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const formidable = require("formidable");
const fs = require("fs");
const FormData = require("form-data");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROUP_ID = process.env.TELEGRAM_GROUP_ID;

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

app.get("/", (req, res) => {
    res.json({
        status: "online",
        service: "IVR Telegram Backend"
    });
});

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
                "IVR-" + Date.now().toString().slice(-8);

            const dateTime = new Date().toLocaleString("en-US", {
                timeZone: "Asia/Yangon"
            });

            let message = "";

            message += "🎮 <b>NEW IVR TOP-UP ORDER</b>\n";
            message += "━━━━━━━━━━━━━━━━━━\n\n";

            message += "🆔 <b>Order ID:</b> <code>" +
                escapeHtml(orderId) +
                "</code>\n\n";

            message += "🎮 <b>Game:</b> " +
                escapeHtml(game) +
                "\n\n";

            message += "👤 <b>Player ID:</b> <code>" +
                escapeHtml(playerId) +
                "</code>\n";

            if (zoneId) {
                message += "🌐 <b>Zone ID:</b> <code>" +
                    escapeHtml(zoneId) +
                    "</code>\n";
            }

            message += "\n";

            message += "💎 <b>Package:</b> " +
                escapeHtml(packageName) +
                "\n\n";

            message += "💰 <b>Amount:</b> " +
                escapeHtml(price) +
                " Ks\n\n";

            message += "💳 <b>Payment:</b> " +
                escapeHtml(payment) +
                "\n\n";

            message += "👤 <b>Account Holder:</b> " +
                escapeHtml(accountHolder) +
                "\n\n";

            message += "📱 <b>Payment Phone:</b> " +
                escapeHtml(targetPhone) +
                "\n\n";

            message += "🕐 <b>Date:</b> " +
                escapeHtml(dateTime) +
                "\n\n";

            message += "━━━━━━━━━━━━━━━━━━\n";
            message += "📎 <i>Payment slip attached below.</i>";

            const slip =
                files.slip ||
                files.paymentSlip ||
                files.receipt;

            if (slip) {

                const slipFile = Array.isArray(slip)
                    ? slip[0]
                    : slip;

                const telegramUrl =
                    "https://api.telegram.org/bot" +
                    BOT_TOKEN +
                    "/sendPhoto";

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
                    body: formData,
                    headers: formData.getHeaders()
                });

                const result = await response.json();

                if (!result.ok) {
                    throw new Error(
                        result.description || "Telegram error"
                    );
                }

            } else {

                const telegramUrl =
                    "https://api.telegram.org/bot" +
                    BOT_TOKEN +
                    "/sendMessage";

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
        "IVR Telegram Backend running on port " + PORT
    );
});
