const express = require("express");
const app = express();

app.use(express.json());

// Home route (VERY IMPORTANT)
app.get("/", (req, res) => {
  res.send("Backend running OK");
});

// Connect route
app.get("/connect", (req, res) => {
  res.json({
    success: true,
    message: "Connected"
  });
});

// Verify route (GET)
app.get("/verify", (req, res) => {
  res.json({
    verified: true
  });
});

// Verify route (POST)
app.post("/verify", (req, res) => {
  const { key } = req.body;

  if (!key) {
    return res.status(400).json({
      verified: false,
      error: "Key missing"
    });
  }

  res.json({
    verified: true,
    key: key
  });
});

// Get key route
app.get("/get-key", (req, res) => {
  res.json({
    key: "TEST-KEY-123"
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
