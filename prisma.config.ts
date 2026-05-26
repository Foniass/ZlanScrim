import { defineConfig } from "@prisma/config";
import { config as loadEnv } from "dotenv";

// Load env files so DATABASE_URL is available for migration commands.
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  },
});
