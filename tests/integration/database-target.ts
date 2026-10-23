import { readFileSync } from "node:fs";
import path from "node:path";

export const dedicatedTestDatabaseName = "service_desk_test";

export type DatabaseTarget = {
  host: string;
  port: number;
  database: string;
};

export function parseTestEnvironmentFile(contents: string): string | undefined {
  let testUrl: string | undefined;
  let foundTestUrl = false;

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = /^SERVICE_DESK_TEST_DATABASE_URL\s*=\s*(.*)$/.exec(line);
    if (!match || foundTestUrl) {
      throw new Error(
        ".env.test.local may contain only one SERVICE_DESK_TEST_DATABASE_URL setting.",
      );
    }
    foundTestUrl = true;

    let value = match[1]?.trim() ?? "";
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    testUrl = value || undefined;
  }

  return testUrl;
}

export function getConfiguredTestDatabaseUrl(
  environment: NodeJS.ProcessEnv = process.env,
  workingDirectory = process.cwd(),
): string | undefined {
  const fromEnvironment = environment.SERVICE_DESK_TEST_DATABASE_URL;
  if (fromEnvironment) return fromEnvironment;

  let contents: string;
  try {
    contents = readFileSync(
      path.join(workingDirectory, ".env.test.local"),
      "utf8",
    );
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return undefined;
    }
    throw new Error("Could not read .env.test.local.");
  }

  return parseTestEnvironmentFile(contents);
}

export function readTestDatabaseUrlFile(
  workingDirectory = process.cwd(),
): string | undefined {
  let contents: string;
  try {
    contents = readFileSync(
      path.join(workingDirectory, ".env.test.local"),
      "utf8",
    );
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return undefined;
    }
    throw new Error("Could not read .env.test.local.");
  }

  return parseTestEnvironmentFile(contents);
}

function parsePostgresTarget(
  value: string | undefined,
  label: string,
): DatabaseTarget {
  if (!value?.trim()) {
    throw new Error(`${label} is not configured.`);
  }

  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error(`${label} must be a valid PostgreSQL connection URL.`);
  }

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error(`${label} must use a PostgreSQL protocol.`);
  }
  if (!url.hostname) {
    throw new Error(`${label} must identify a database host.`);
  }
  if (!url.pathname || url.pathname === "/") {
    throw new Error(`${label} must identify a PostgreSQL database.`);
  }

  let database: string;
  try {
    database = decodeURIComponent(url.pathname.slice(1));
  } catch {
    throw new Error(`${label} has an invalid database name.`);
  }
  if (!database || database.includes("/")) {
    throw new Error(`${label} has an invalid database name.`);
  }

  return {
    host: url.hostname.toLowerCase(),
    port: url.port ? Number(url.port) : 5432,
    database,
  };
}

export function validateDedicatedTestDatabaseUrl(
  testDatabaseUrl: string | undefined,
  developmentDatabaseUrl: string | undefined,
): DatabaseTarget {
  const testTarget = parsePostgresTarget(
    testDatabaseUrl,
    "SERVICE_DESK_TEST_DATABASE_URL",
  );
  const developmentTarget = parsePostgresTarget(
    developmentDatabaseUrl,
    "DATABASE_URL",
  );

  if (testTarget.database !== dedicatedTestDatabaseName) {
    throw new Error(
      `The integration test database must be named ${dedicatedTestDatabaseName}.`,
    );
  }

  if (
    testTarget.host === developmentTarget.host &&
    testTarget.port === developmentTarget.port &&
    testTarget.database === developmentTarget.database
  ) {
    throw new Error(
      "The integration test database target matches the development database.",
    );
  }

  return testTarget;
}
