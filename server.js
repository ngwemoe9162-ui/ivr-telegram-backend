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


// ===============================
// HEALTH CHECK
// ===============================

app.get("/", (req, res) => {
    res.json({
        status: "online",
        service: "IVR Telegram Backend"
    });
});


// ===============================
// HTML ESCAPE
// ===============================

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}


// ===============================
// GET FORM FIELD
// ===============================

function getField(value) {
    if (Array.isArray(value)) {
        return value[0] || "";
    }

    return value || "";
}


// ===============================
// RECEIVE ORDER
// ===============================

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

            // ===============================
            // ORDER DATA
            // ===============================

            const game = getField(fields.game);

            const playerId = getField(fields.playerId);

            const zoneId = getField(fields.zoneId);

            const packageName = getField(fields.package);

            const price = getField(fields.price);

            const payment = getField(fields.payment);

            const accountHolder = getField(fields.accountHolder);

            const targetPhone = getField(fields.targetPhone);


            // ===============================
            // ORDER ID
            // ===============================

            const orderId =
                "IVR-" + Date.now().toString().slice(-8);


            // ===============================
            // DATE & TIME
            // ===============================

            const dateTime = new Date().toLocaleString("en-US", {
                timeZone: "Asia/Yangon"
            });


          // ===============================
// TELEGRAM MESSAGE
// ===============================

let message = "";

message += "🎮 <b>NEW IVR TOP-UP ORDER</b>\\n";
message += "━━━━━━━━━━━━━━━━━━\\n\\n";

message += "🆔 <b>Order ID:</b> <code>" + escapeHtml(orderId) + "</code>\\n\\n";

message += "🎮 <b>Game:</b> " + escapeHtml(game) + "\\n\\n";

message += "👤 <b>Player ID:</b> <code>" + escapeHtml(playerId) + "</code>\\n";

if (zoneId) {
    message += "🌐 <b>Zone ID:</b> <code>" + escapeHtml(zoneId) + "</code>\\n";
}

message += "\\n";

message += "💎 <b>Package:</b> " + escapeHtml(packageName) + "\\n\\n";

message += "💰 <b>Amount:</b> " + escapeHtml(price) + " Ks\\n\\n";

message += "💳 <b>Payment:</b> " + escapeHtml(payment) + "\\n\\n";

message += "👤 <b>Account Holder:</b> " + escapeHtml(accountHolder) + "\\n\\n";

message += "📱 <b>Payment Phone:</b> " + escapeHtml(targetPhone) + "\\n\\n";

message += "🕐 <b>Date:</b> " + escapeHtml(dateTime) + "\\n\\n";

message += "━━━━━━━━━━━━━━━━━━\\n";
message += "📎 <i>Payment slip attached below.</i>";
