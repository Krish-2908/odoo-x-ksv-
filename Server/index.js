const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const port = process.env.PORT || 8000;
const mongoUri = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/authRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const rfqRoutes = require("./routes/rfqRoutes");
const quotationRoutes = require("./routes/quotationRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/rfqs", rfqRoutes);
app.use("/api/quotations", quotationRoutes);

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

// Self-healing check for existing Vendor users without profiles
async function seedVendorProfiles() {
  const User = require("./models/User");
  const Vendor = require("./models/Vendor");
  try {
    const vendors = await User.find({ role: "Vendor" });
    let createdCount = 0;
    for (const u of vendors) {
      const existingProfile = await Vendor.findOne({ userId: u._id });
      if (!existingProfile) {
        await Vendor.create({
          userId: u._id,
          companyName: `${u.firstName} ${u.lastName} Corp`,
          contactEmail: u.email,
          contactPhone: u.phone,
          status: "Pending Verification",
        });
        createdCount++;
      }
    }
    if (createdCount > 0) {
      console.log(`Self-healing: Created missing Vendor profiles for ${createdCount} vendor(s).`);
    }
  } catch (err) {
    console.error("Self-healing vendor profile check failed:", err.message);
  }
}

async function startServer() {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB Atlas");
    
    // Run self-healing check
    await seedVendorProfiles();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
  }
}

startServer();
