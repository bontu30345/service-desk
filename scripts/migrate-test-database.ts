import { spawnSync } from "node:child_process";
import path from "node:path";
import {
  getConfiguredTestDatabaseUrl,
  validateDedicatedTestDatabaseUrl,
} from "../tests/integration/database-target";

let testDatabaseUrl: string | undefined;

try {
  testDatabaseUrl = getConfiguredTestDatabaseUrl();
  validateDedicatedTestDatabaseUrl(
    testDatabaseUrl,
    process.env.DATABASE_URL,
  );
} catch (error) {
  if (error instanceof Error) {
    console.error(`Refusing test database migration: ${error.message}`);
  } else {
    console.error("Refusing test database migration due to invalid configuration.");
  }
  process.exit(1);
}

if (!testDatabaseUrl) {
  console.error("Refusing test database migration: test database URL is missing.");
  process.exit(1);
}

const prismaCliPath = path.resolve("node_modules/prisma/build/index.js");
const result = spawnSync(
  process.execPath,
  [prismaCliPath, "migrate", "deploy"],
  {
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
    stdio: "inherit",
  },
);

if (result.error) {
  console.error("Failed to start Prisma test database migration.", result.error);
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
