require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const protect = require("./middleware/authMiddleware");

const authRoutes = require("./routes/authRoutes");
const app = express();

// ---------- ENV VALIDATION ----------
const requiredEnvs = ["MONGO_URI", "JWT_SECRET", "CLIENT_URL"];
const missing = requiredEnvs.filter((k) => !process.env[k]);
if (missing.length)
  console.warn("⚠️ Missing env vars:", missing.join(", "));
else
  console.log("✅ All required env vars present.");

// ---------- MIDDLEWARE ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ---------- REQUEST LOGGER ----------
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ---------- CORS ----------
// ---------- CORS ----------
const allowedOrigins = [
  process.env.CLIENT_URL, // GitHub Pages frontend
  "http://127.0.0.1:5500", // local dev (VS Code)
  "http://localhost:5500", // local dev (VS Code)
  "http://127.0.0.1:5501", // ✅ added for Live Server alt port
  "http://localhost:5501",  // ✅ added for Live Server alt port
  "https://codewithkaranja.github.io", // GitHub fallback
  "https://lunar-hmis-frontend.onrender.com", // HMIS frontend
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn(`🚫 Blocked CORS origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ---------- DATABASE ----------
const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ MONGO_URI is missing from environment variables!");
    return;
  }

  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    setTimeout(connectDB, 5000); // retry after 5s
  }
};
connectDB();

// ---------- ROUTES ----------
app.use("/api/auth", authRoutes);

// Example of using protected route
app.get("/api/protected", protect, (req, res) => {
  res.json({ message: "🔒 Protected route access granted", user: req.user });
});

// ---------- HEALTH CHECKS ----------
app.get("/", (req, res) => res.send("🚀 MyAuth-HMIS Server running..."));
app.get("/api", (req, res) => res.send("✅ API root is alive"));

// ---------- 404 HANDLER ----------
app.use((req, res) => {
  res.status(404).json({ message: "❌ Route not found" });
});

// ---------- START SERVER ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Base URL: ${process.env.CLIENT_URL}`);
});
