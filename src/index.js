import { Hono } from "hono";
import yaml from "js-yaml";
import { parse as parseToml, stringify as stringifyToml } from "smol-toml";
import luaparse from "luaparse";

const app = new Hono();

// Helper to turn a JS object into a Lua table string
const toLua = (obj) => {
  // Handle primitives
  if (obj === null) return "nil";
  if (typeof obj === "string") return `"${obj.replace(/"/g, '\\"')}"`;
  if (typeof obj !== "object") return JSON.stringify(obj);

  // Handle arrays
  if (Array.isArray(obj)) {
    const elements = obj.map((v) => toLua(v));
    return `{ ${elements.join(", ")} }`;
  }

  // Handle objects
  const parts = Object.entries(obj).map(([k, v]) => `["${k}"] = ${toLua(v)}`);
  return `{ ${parts.join(", ")} }`;
};

// Supported formats
const FORMATS = ["json", "yaml", "toml", "lua"];
const MAX_CONTENT_SIZE = 1024 * 1024; // 1MB

app.post("/convert", async (c) => {
  const body = await c.req.json().catch(() => null);

  // Validate body
  if (!body) {
    return c.json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const { from, to, content } = body;

  // Validate fields
  if (!from || typeof from !== "string") {
    return c.json(
      { success: false, error: "Missing or invalid 'from' format" },
      400,
    );
  }

  if (!to || typeof to !== "string") {
    return c.json(
      { success: false, error: "Missing or invalid 'to' format" },
      400,
    );
  }

  if (!content || typeof content !== "string") {
    return c.json(
      { success: false, error: "Missing or invalid 'content'" },
      400,
    );
  }

  // Validate formats are supported
  if (!FORMATS.includes(from)) {
    return c.json(
      { success: false, error: `Unsupported 'from' format: ${from}` },
      400,
    );
  }

  if (!FORMATS.includes(to)) {
    return c.json(
      { success: false, error: `Unsupported 'to' format: ${to}` },
      400,
    );
  }

  // Validate size
  if (content.length > MAX_CONTENT_SIZE) {
    return c.json({ success: false, error: "Content exceeds 1MB limit" }, 413);
  }

  try {
    // Parse 'from' into JS Object
    let data;
    if (from === "json") data = JSON.parse(content);
    elseif (from === "yaml") data = yaml.load(content);
    elseif (from === "toml") data = parseToml(content);
    elseif (from === "lua") {
      data = luaparse.parse(content, { wait: false });
    }

    // Stringify Object into 'to' format
    let result;
    if (to === "json") result = JSON.stringify(data, null, 2);
    elseif (to === "yaml") result = yaml.dump(data);
    elseif (to === "toml") result = stringifyToml(data);
    elseif (to === "lua") result = toLua(data);

    return c.json({ success: true, result });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 422);
  }
});

export default app;
