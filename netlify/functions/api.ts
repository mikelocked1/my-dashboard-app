import { Handler } from "@netlify/functions";
import express from "express";
import serverless from "serverless-http";
import { registerRoutes } from "../../server/routes";

const app = express();

// Parse JSON bodies
app.use(express.json());

// Add CORS middleware for development
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLine = `${req.method} ${req.originalUrl} ${res.statusCode} in ${duration}ms`;
    console.log(logLine);
  });

  next();
});

// Initialize routes
(async () => {
  await registerRoutes(app);
})();

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error("Server error:", err);
  
  if (!res.headersSent) {
    res.status(status).json({ message });
  }
});

// Export serverless handler
export const handler: Handler = serverless(app);