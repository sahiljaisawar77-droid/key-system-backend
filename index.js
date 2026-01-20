require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// create table if not exists
pool.query(`
CREATE TABLE IF NOT EXISTS keys (
  id SERIAL PRIMARY KEY,
  license_key TEXT UNIQUE,
  device_id TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`);

app.get("/get-key", async (req, res) => {
  const key = "KEY-" + uuidv4().slice(0, 8).toUpperCase();
  const expires = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours

  await pool.query(
    "INSERT INTO keys (license_key, expires_at) VALUES ($1, $2)",
    [key, expires]
  );

  res.send(`
    <h3>Your Key</h3>
    <b>${key}</b><br/>
    Valid for 12 hours
  `);
});

app.post("/verify", async (req, res) => {
  const { key, device_id } = req.body;

  const result = await pool.query(
    "SELECT * FROM keys WHERE license_key=$1",
    [key]
  );

  if (result.rows.length === 0) {
    return res.json({ status: "invalid" });
  }

  const data = result.rows[0];

  if (new Date() > data.expires_at) {
    return res.json({ status: "expired" });
  }

  if (data.device_id && data.device_id !== device_id) {
    return res.json({ status: "device_mismatch" });
  }

  if (!data.device_id) {
    await pool.query(
      "UPDATE keys SET device_id=$1 WHERE license_key=$2",
      [device_id, key]
    );
  }

  res.json({ status: "valid", expires_at: data.expires_at });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on " + PORT));
