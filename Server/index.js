const express = require("express");
const mongoose = require("mongoose");
dotenv = require("dotenv");
dotenv.config();

const app = express();
const port = process.env.PORT || 8000;
const mongoUri = process.env.MONGODB_URI;

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

async function startServer() {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB Atlas");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
  }
}

startServer();
