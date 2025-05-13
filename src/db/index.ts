import * as schema from "./drizzle/schema";
import * as relations from "./drizzle/relations";
import * as chatSchema from "./drizzle/chat-schema";
import * as midtermSchema from "./drizzle/midterm-schema";
import * as finalSchema from "./drizzle/final-schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, {
  schema: {
    ...schema,
    ...relations,
    ...chatSchema,
    ...midtermSchema,
    ...finalSchema,
  },
});

export default db;
