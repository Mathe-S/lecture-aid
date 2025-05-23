import * as dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config();
console.log(process.env.DATABASE_URL);

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/drizzle/**.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
