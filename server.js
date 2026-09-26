require("dotenv").config({ override: true });

const express = require("express");
const cors = require("cors");
const db = require("./config/db");
const adminAuthRoutes = require("./routes/adminAuth");

const app = express();

app.use(cors());
app.use(express.json());

// Basic test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ORIVO API is running"
  });
});

// Database health check
app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 AS db_status");

    res.json({
      success: true,
      status: "healthy",
      database: "connected",
      result: rows[0]
    });

  } catch (error) {
    console.error("Database error:", error.message);

    res.status(500).json({
      success: false,
      status: "error",
      database: "connection failed",
      error: error.message
    });
  }
});

// Admin authentication routes
app.use("/api/admin", adminAuthRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`ORIVO server running on port ${PORT}`);
});