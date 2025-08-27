import express, { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { createKnex } from "./knex"; // ✅ Import the async factory function

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware: log API requests (unchanged)
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // ✅ Test database connection before starting server
  let knex: Awaited<ReturnType<typeof createKnex>>;
  try {
    knex = await createKnex(); // Await the async factory
    await knex.raw("SELECT 1+1 AS result");
    console.log("✅ Database connected successfully");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1); // Stop server if DB is not connected
  }

  // Initialize preloaded doctors if using in-memory storage
  if (process.env.NODE_ENV === "development") {
    await storage.seedPreloadedDoctors();
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Server error:", err);

    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // Only setup Vite in development (unchanged)
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000");

  process.on("SIGTERM", () => {
    server.close();
  });

  process.on("SIGINT", () => {
    server.close();
  });

  server.listen(port, "0.0.0.0", () => {
    const formattedTime = new Date().toLocaleTimeString("en-US", {
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
    });

    console.log(`\n🚀 Server running on port ${port}`);
    console.log(`📱 Local: http://localhost:${port}`);
    console.log(`🌐 Network: http://0.0.0.0:${port}`);
    console.log(`⏰ Started at ${formattedTime}\n`);
  });
})();