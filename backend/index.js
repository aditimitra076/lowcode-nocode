import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
// Page trees are larger than the default 100kb body limit.
app.use(express.json({ limit: "2mb" }));

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api", healthRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.warn("MONGODB_URI is not set. Database not connected.");
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Database connected!");
  } catch (error) {
    console.log("Connection failed!", error.message);
  }
};

connectDB();

app.listen(PORT, () => {
  console.log(`VisualForge Studio API Engine online at http://localhost:${PORT}`);
});

export default app;
