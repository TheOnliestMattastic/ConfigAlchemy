import { test } from "node:test";
import assert from "node:assert";
import app from "./index.js";

// =============================================================================
// CONFIGALCHEMY UNIT TESTS
// =============================================================================
// WHAT: Unit tests for conversion logic and error handling
// WHY:  Validates core functionality works before integration testing
// HOW:  Uses Node.js built-in test runner with assertions
// NOTE: Run with: npm test
// =============================================================================

// Helper to make POST requests to Hono app
async function postConvert(from, to, content) {
  const req = new Request("http://localhost/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, content }),
  });

  const res = await app.fetch(req);
  return {
    status: res.status,
    body: await res.json(),
  };
}

// =============================================================================
// VALID CONVERSION TESTS
// =============================================================================

test("JSON to YAML conversion", async () => {
  const content = '{"name": "test", "version": "1.0.0"}';
  const res = await postConvert("json", "yaml", content);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.match(res.body.result, /name: test/);
  assert.match(res.body.result, /version: 1.0.0/);
});

test("JSON to TOML conversion", async () => {
  const content = '{"database": {"host": "localhost", "port": 5432}}';
  const res = await postConvert("json", "toml", content);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.match(res.body.result, /host = "localhost"/);
});

test("JSON to Lua conversion with array", async () => {
  const content = '{"items": [1, 2, 3], "active": true}';
  const res = await postConvert("json", "lua", content);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.match(res.body.result, /1, 2, 3/);
});

test("YAML to JSON conversion", async () => {
  const content = "name: test\nversion: 1.0.0";
  const res = await postConvert("yaml", "json", content);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  const parsed = JSON.parse(res.body.result);
  assert.strictEqual(parsed.name, "test");
  assert.strictEqual(parsed.version, "1.0.0");
});

test("TOML to JSON conversion", async () => {
  const content = '[section]\nkey = "value"';
  const res = await postConvert("toml", "json", content);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  const parsed = JSON.parse(res.body.result);
  assert.deepStrictEqual(parsed.section, { key: "value" });
});

test("Lua to JSON conversion", async () => {
  const content = "{name = 'test', active = true}";
  const res = await postConvert("lua", "json", content);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
});

test("Identity conversion (JSON to JSON)", async () => {
  const content = '{"key": "value", "number": 42}';
  const res = await postConvert("json", "json", content);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  const parsed = JSON.parse(res.body.result);
  assert.strictEqual(parsed.key, "value");
  assert.strictEqual(parsed.number, 42);
});

// =============================================================================
// COMPLEX DATA STRUCTURE TESTS
// =============================================================================

test("Nested objects in JSON to Lua", async () => {
  const content =
    '{"user": {"profile": {"name": "Alice", "age": 30}}}';
  const res = await postConvert("json", "lua", content);

  assert.strictEqual(res.status, 200);
  assert.match(res.body.result, /Alice/);
  assert.match(res.body.result, /30/);
});

test("Null values in JSON to Lua", async () => {
  const content = '{"value": null, "active": true}';
  const res = await postConvert("json", "lua", content);

  assert.strictEqual(res.status, 200);
  assert.match(res.body.result, /nil/);
});

test("String escaping in Lua conversion", async () => {
  const content = '{"message": "Hello \\"World\\""}';
  const res = await postConvert("json", "lua", content);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
});

test("Array conversion to Lua", async () => {
  const content = '{"list": [1, 2, 3], "names": ["a", "b"]}';
  const res = await postConvert("json", "lua", content);

  assert.strictEqual(res.status, 200);
  assert.match(res.body.result, /1, 2, 3/);
});

// =============================================================================
// VALIDATION ERROR TESTS
// =============================================================================

test("Missing 'from' field returns INVALID_FROM", async () => {
  const req = new Request("http://localhost/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to: "yaml", content: "{}" }),
  });

  const res = await app.fetch(req);
  const body = await res.json();

  assert.strictEqual(res.status, 400);
  assert.strictEqual(body.code, "INVALID_FROM");
});

test("Missing 'to' field returns INVALID_TO", async () => {
  const req = new Request("http://localhost/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from: "json", content: "{}" }),
  });

  const res = await app.fetch(req);
  const body = await res.json();

  assert.strictEqual(res.status, 400);
  assert.strictEqual(body.code, "INVALID_TO");
});

test("Missing 'content' field returns INVALID_CONTENT", async () => {
  const req = new Request("http://localhost/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from: "json", to: "yaml" }),
  });

  const res = await app.fetch(req);
  const body = await res.json();

  assert.strictEqual(res.status, 400);
  assert.strictEqual(body.code, "INVALID_CONTENT");
});

test("Empty content string returns INVALID_CONTENT", async () => {
  const res = await postConvert("json", "yaml", "");

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.code, "INVALID_CONTENT");
});

test("Unsupported 'from' format returns UNSUPPORTED_FROM", async () => {
  const res = await postConvert("xml", "json", "{}");

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.code, "UNSUPPORTED_FROM");
});

test("Unsupported 'to' format returns UNSUPPORTED_TO", async () => {
  const res = await postConvert("json", "protobuf", "{}");

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.code, "UNSUPPORTED_TO");
});

// =============================================================================
// PARSE ERROR TESTS
// =============================================================================

test("Invalid JSON syntax returns PARSE_JSON_FAILED", async () => {
  const res = await postConvert("json", "yaml", "{invalid}");

  assert.strictEqual(res.status, 422);
  assert.strictEqual(res.body.code, "PARSE_JSON_FAILED");
  assert.match(res.body.error, /Failed to parse JSON/);
});

test("Invalid YAML syntax returns PARSE_YAML_FAILED", async () => {
  const res = await postConvert("yaml", "json", "key1: value\n\t key2: value");

  assert.strictEqual(res.status, 422);
  assert.strictEqual(res.body.code, "PARSE_YAML_FAILED");
});

test("Invalid TOML syntax returns PARSE_TOML_FAILED", async () => {
  const res = await postConvert("toml", "json", "invalid = ");

  assert.strictEqual(res.status, 422);
  assert.strictEqual(res.body.code, "PARSE_TOML_FAILED");
});

// =============================================================================
// MALFORMED REQUEST TESTS
// =============================================================================

test("Invalid JSON body returns INVALID_BODY", async () => {
  const req = new Request("http://localhost/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "not valid json",
  });

  const res = await app.fetch(req);
  const body = await res.json();

  assert.strictEqual(res.status, 400);
  assert.strictEqual(body.code, "INVALID_BODY");
});

// =============================================================================
// RESPONSE STRUCTURE TESTS
// =============================================================================

test("Successful response has required fields", async () => {
  const res = await postConvert("json", "yaml", '{"test": 1}');

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.result);
  assert.strictEqual(typeof res.body.result, "string");
});

test("Error response has code and error message", async () => {
  const res = await postConvert("xml", "json", "{}");

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
  assert.ok(res.body.code);
  assert.ok(res.body.error);
  assert.strictEqual(typeof res.body.error, "string");
});

// =============================================================================
// SIZE LIMIT TESTS
// =============================================================================

test("Content exceeding 1MB returns CONTENT_TOO_LARGE", async () => {
  const largeContent = '{"data": "' + "x".repeat(1100000) + '"}';
  const res = await postConvert("json", "yaml", largeContent);

  assert.strictEqual(res.status, 413);
  assert.strictEqual(res.body.code, "CONTENT_TOO_LARGE");
  assert.match(res.body.error, /1MB/);
});
