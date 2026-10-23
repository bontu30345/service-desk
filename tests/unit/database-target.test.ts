import assert from "node:assert/strict";
import test from "node:test";
import {
  parseTestEnvironmentFile,
  validateDedicatedTestDatabaseUrl,
} from "../integration/database-target";

const developmentUrl =
  "postgresql://dev-user:dev-password@localhost:5432/service_desk_db";
const dedicatedTestUrl =
  "postgresql://test-user:test-password@localhost:5432/service_desk_test";

test("database target guard accepts a distinct dedicated test database", () => {
  assert.deepEqual(
    validateDedicatedTestDatabaseUrl(dedicatedTestUrl, developmentUrl),
    {
      host: "localhost",
      port: 5432,
      database: "service_desk_test",
    },
  );
});

test("database target guard accepts credentialed postgresql URLs with supported query options", () => {
  assert.deepEqual(
    validateDedicatedTestDatabaseUrl(
      "  postgresql://test-user:test-password@localhost:5432/service_desk_test?schema=public  ",
      developmentUrl,
    ),
    {
      host: "localhost",
      port: 5432,
      database: "service_desk_test",
    },
  );
});

test("database target guard continues accepting the postgres protocol", () => {
  assert.deepEqual(
    validateDedicatedTestDatabaseUrl(
      "postgres://test-user:test-password@localhost:5432/service_desk_test",
      developmentUrl,
    ),
    {
      host: "localhost",
      port: 5432,
      database: "service_desk_test",
    },
  );
});

test("database target guard rejects missing and malformed URLs without revealing them", () => {
  assert.throws(
    () => validateDedicatedTestDatabaseUrl(undefined, developmentUrl),
    /SERVICE_DESK_TEST_DATABASE_URL is not configured/,
  );
  assert.throws(
    () =>
      validateDedicatedTestDatabaseUrl(
        "not-a-database-url",
        developmentUrl,
      ),
    /must be a valid PostgreSQL connection URL/,
  );
  assert.throws(
    () =>
      validateDedicatedTestDatabaseUrl(
        "mysql://test-user:test-password@localhost:5432/service_desk_test",
        developmentUrl,
      ),
    /must use a PostgreSQL protocol/,
  );
  assert.throws(
    () => validateDedicatedTestDatabaseUrl(dedicatedTestUrl, undefined),
    /DATABASE_URL is not configured/,
  );
});

test("test env file accepts only the dedicated URL and cannot override development configuration", () => {
  assert.equal(
    parseTestEnvironmentFile(
      "# Dedicated test connection\nSERVICE_DESK_TEST_DATABASE_URL=\"postgresql://test-user:test-password@localhost:5432/service_desk_test\"\n",
    ),
    "postgresql://test-user:test-password@localhost:5432/service_desk_test",
  );
  assert.throws(
    () =>
      parseTestEnvironmentFile(
        "DATABASE_URL=postgresql://attacker:secret@localhost:5432/other\n",
      ),
    /may contain only one SERVICE_DESK_TEST_DATABASE_URL setting/,
  );
  assert.throws(
    () =>
      parseTestEnvironmentFile(
        "SERVICE_DESK_TEST_DATABASE_URL=one\nSERVICE_DESK_TEST_DATABASE_URL=two\n",
      ),
    /may contain only one SERVICE_DESK_TEST_DATABASE_URL setting/,
  );
});

test("database target guard refuses development and non-dedicated database targets", () => {
  assert.throws(
    () =>
      validateDedicatedTestDatabaseUrl(
        "postgresql://test-user:test-password@localhost:5432/service_desk_db",
        developmentUrl,
      ),
    /must be named service_desk_test/,
  );
  assert.throws(
    () =>
      validateDedicatedTestDatabaseUrl(
        "postgresql://test-user:test-password@localhost:5432/other_database",
        developmentUrl,
      ),
    /must be named service_desk_test/,
  );
  assert.throws(
    () =>
      validateDedicatedTestDatabaseUrl(
        "postgresql://test-user:test-password@localhost:5432/service_desk_test",
        "postgresql://dev-user:dev-password@localhost:5432/service_desk_test",
      ),
    /matches the development database/,
  );
});

test("database target guard rejects a shared host, port, and database despite different credentials", () => {
  assert.throws(
    () =>
      validateDedicatedTestDatabaseUrl(
        "postgresql://different-user:different-password@localhost:5432/service_desk_test",
        "postgresql://dev-user:dev-password@localhost:5432/service_desk_test",
      ),
    /matches the development database/,
  );
});
