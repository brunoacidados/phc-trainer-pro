import * as Sentry from "@sentry/node";
import { createApp, APP_VERSION } from "./app.ts";
import { connectDb, disconnectDb } from "./db.ts";
import { env } from "./config/env.ts";
import { emailConfigWarning } from "./services/email.ts";

async function main(): Promise<void> {
  if (env.SENTRY_DSN) {
    Sentry.init({ dsn: env.SENTRY_DSN, environment: env.NODE_ENV, release: APP_VERSION });
    console.log("[api] Sentry ativo");
  }

  await connectDb();
  const ew = emailConfigWarning();
  if (ew) console.warn(`[email] AVISO: ${ew}`);

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(
      `[api] PHC Trainer Pro API v${APP_VERSION} em http://localhost:${env.PORT} (${env.NODE_ENV})`,
    );
  });

  const shutdown = async (sig: string) => {
    console.log(`[api] ${sig} — a encerrar…`);
    server.close();
    await disconnectDb().catch(() => undefined);
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("[api] falha no arranque:", err);
  process.exit(1);
});
