import assert from "node:assert/strict";
import test from "node:test";
import { Pool } from "pg";
import {
  readTestDatabaseUrlFile,
  validateDedicatedTestDatabaseUrl,
} from "./database-target";

test("configured connection reaches the dedicated test database", async () => {
  const testDatabaseUrl = readTestDatabaseUrlFile();
  const target = validateDedicatedTestDatabaseUrl(
    testDatabaseUrl,
    process.env.DATABASE_URL,
  );
  const pool = new Pool({
    connectionString: testDatabaseUrl,
    max: 1,
    connectionTimeoutMillis: 5_000,
  });

  try {
    const result = await pool.query<{ database_name: string }>(
      "SELECT current_database() AS database_name",
    );
    assert.equal(result.rows[0]?.database_name, target.database);
  } finally {
    await pool.end();
  }
});
