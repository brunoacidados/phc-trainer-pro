import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { corsOrigins } from "./config/env.ts";
import { dbReady } from "./db.ts";
import { authRouter } from "./routes/auth.ts";
import { progressRouter } from "./routes/progress.ts";
import { teamsRouter } from "./routes/teams.ts";
import { aiRouter } from "./routes/ai.ts";
import { metaRouter } from "./routes/meta.ts";
import { errorHandler, notFoundHandler } from "./middleware/error.ts";

export const APP_VERSION = "6.0.0-alpha.6";

export function createApp(): express.Express {
  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(
    cors({
      origin(origin, cb) {
        // sem Origin (curl, healthchecks) → permite; com Origin → allowlist
        if (!origin || corsOrigins.includes(origin) || corsOrigins.includes("*")) cb(null, true);
        else cb(new Error(`Origem não permitida: ${origin}`));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "3mb" }));
  app.use(cookieParser());

  app.use(
    "/api",
    rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: "draft-7", legacyHeaders: false }),
  );
  const authLimiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: 30,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  });
  const aiLimiter = rateLimit({
    windowMs: 60_000,
    limit: 40,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  });

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "phc-trainer-api", version: APP_VERSION, mongo: dbReady() });
  });

  app.use("/api/auth", authLimiter, authRouter);
  app.use("/api/progress", progressRouter);
  app.use("/api/teams", teamsRouter);
  app.use("/api/ai", aiLimiter, aiRouter);
  app.use("/api/meta", metaRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
