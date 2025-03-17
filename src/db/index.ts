import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./drizzle/schema";
import * as relations from "./drizzle/relations";
import * as chatSchema from "./drizzle/chat-schema";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client, {
  schema: {
    ...schema,
    ...relations,
    ...chatSchema,
  },
});

export default db;
