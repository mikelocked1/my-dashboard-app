import express from "express";
import bodyParser from "body-parser";
import { db } from "./firebaseAdmin.js";

const app = express();
app.use(bodyParser.json());

// ✅ Health check route (NEW)
app.get("/", (req, res) => {
  res.send("SmartCare Backend is running 🚀");
});

// Health data route
app.post("/api/health-data", async (req, res) => {
  try {
    const { userId, type, value, unit, timestamp } = req.body;

    await db.collection("healthData").add({
      userId,
      type,
      value,
      unit,
      timestamp: new Date(timestamp),
    });

    res.status(200).json({ message: "Health data stored in Firestore!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save health data" });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
