import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import marketplaceRoutes from "./routes/marketplaceRoutes.js";
import tableRoutes from "./routes/tableRoutes.js";
import publicFormRoutes from "./routes/publicFormRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import { UPLOADS_DIR } from "./controllers/uploadController.js";
import { parseClientOrigins } from "./utils/corsOrigins.js";

// Windows/ISP DNS often fails Atlas SRV hostnames (ENOTFOUND).
// Prefer public resolvers for both resolve* and a custom Mongo lookup.
const PUBLIC_DNS = ["1.1.1.1", "8.8.8.8", "1.0.0.1"];
try {
  dns.setServers(PUBLIC_DNS);
  if (typeof dns.setDefaultResultOrder === "function") {
    dns.setDefaultResultOrder("ipv4first");
  }
} catch {
  /* ignore */
}

const atlasResolver = new dns.Resolver();
atlasResolver.setServers(PUBLIC_DNS);

/** MongoDB driver lookup that bypasses broken OS getaddrinfo for Atlas hosts. */
function atlasDnsLookup(hostname, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }

  atlasResolver.resolve4(hostname, (err, addresses) => {
    if (err || !addresses?.length) {
      // Fall back to OS resolver if public DNS fails.
      return dns.lookup(hostname, options || {}, callback);
    }

    if (options?.all) {
      callback(
        null,
        addresses.map((address) => ({ address, family: 4 })),
      );
      return;
    }

    callback(null, addresses[0], 4);
  });
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: parseClientOrigins(process.env.CLIENT_ORIGIN),
    credentials: true,
  })
);
// Page trees are larger than the default 100kb body limit.
app.use(express.json({ limit: "2mb" }));

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/projects/:projectId/tables", tableRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicFormRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/uploads", express.static(UPLOADS_DIR));
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
    await mongoose.connect(process.env.MONGODB_URI, {
      family: 4,
      serverSelectionTimeoutMS: 20000,
      lookup: atlasDnsLookup,
    });
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
