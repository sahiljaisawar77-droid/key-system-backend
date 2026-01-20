const express = require("express");
const cors = require("cors");

const app = express();

// ================= API KEY (protects backend) =================
const API_KEY = "X7B4N2P8Q9W3Z6M55";

// ================= VALID USER KEYS (TEMP) =================
// Later you can move these to a database
const VALID_KEYS = [
  "ABC123",
  "VIP-KEY-999",
  "USER-TEST-001"
];

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= PUBLIC ROUTES =================

// Root – check if backend is running
app.get("/", (req, res) => {
  res.send("Backend running OK");
});

// Connect – simple connection test
app.get("/connect", (req, res) => {
  res.json({
    success: true,
    message: "Connected successfully"
  });
});

// ================= API KEY CHECK =================
function checkApiKey(req, res, next) {
  const clientKey = req.headers["x-api-key"];

  if (!clientKey || clientKey !== API_KEY) {
    return res.status(401).json({
      success: false,
      error: "Invalid API key"
    });
  }
  next();
}

// ================= PROTECTED ROUTES =================

// Verify user key
app.post("/verify", checkApiKey, (req, res) => {
  const { key } = req.body;

  if (!key) {
    return res.status(400).json({
      verified: false,
      error: "Key missing"
    });
  }

  if (!VALID_KEYS.includes(key)) {
    return res.json({
      verified: false
    });
  }

  res.json({
    verified: true
  });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});
