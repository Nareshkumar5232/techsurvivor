import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { logger } from "./lib/logger.js";

const env = loadEnv();
const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`Tech Survivor API listening on port ${env.PORT} (${env.NODE_ENV})`);
});
