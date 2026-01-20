require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");

// 🔐 Read secrets from Render Environment
const DATABASE_URL = process.env.DATABASE_URL;
const APP_API_KEY = process.env.APP_API_KEY;

const app = express();
app.use(cors());
app.use(express.json());

// 🗄️ PostgreSQL connection
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 📦 Create table if not exists
pool.query(`
CREATE TABLE IF NOT EXISTS keys (
  id SERIAL PRIMARY KEY,
  license_key TEXT UNIQUE,
  device_id TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`);

// 🔑 GET KEY (used after ads / shortener)
app.get("/get-key", async (req, res) => {
  try {
    const key = "KEY-" + uuidv4().slice(0, 8).toUpperCase();
    const expires = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours

    await pool.query(
      "INSERT INTO keys (license_key, expires_at) VALUES ($1, $2)",
      [key, expires]
    );

    res.send(`
      <h3>Your Key</h3>
      <b>${key}</b><br/>
      <small>Valid for 12 hours</small>
    `);
  } catch (err) {
    res.status(500).send("Error generating key");
  }
});

// ✅ VERIFY KEY (used by APK login page)
app.post("/verify", async (req, res) => {
  try {
    const { api_key, key, device_id } = req.body;

    // 🔐 App API key check
    if (!api_key || api_key !== APP_API_KEY) {
      return res.json({ status: "unauthorized_app" });
    }

    // 🔎 Check user key
    const result = await pool.query(
      "SELECT * FROM keys WHERE license_key=$1",
      [key]
    );

    if (result.rows.length === 0) {
      return res.json({ status: "invalid" });
    }

    const data = result.rows[0];

    // ⏰ Expiry check
    if (new Date() > data.expires_at) {
      return res.json({ status: "expired" });
    }

    // 📵 Device binding check
    if (data.device_id && data.device_id !== device_id) {
      return res.json({ status: "device_mismatch" });
    }

    // 🔒 First-time bind device
    if (!data.device_id) {
      await pool.query(
        "UPDATE keys SET device_id=$1 WHERE license_key=$2",
        [device_id, key]
      );
    }

    // ✅ Success
    res.json({
      status: "valid",
      expires_at: data.expires_at
    });

  } catch (err) {
    res.status(500).json({ status: "server_error" });
  }
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
