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

const getFormatHint = (format, error) => {
  const hints = {
    json: error.includes("Unexpected token")
      ? " Check for trailing commas or unquoted keys."
      : "",
    yaml: error.includes("bad indentation")
      ? " Check YAML indentation (use spaces, not tabs)."
      : "",
    toml: error.includes("Expected")
      ? " Check for missing quotes around strings."
      : "",
    lua: error.includes("unexpected symbol")
      ? " Check Lua table syntax { key = value }."
      : "",
  };
  return hints[format] || "";
};

app.post("/convert", async (c) => {
  const body = await c.req.json().catch(() => null);

  // Validate 'body'
  if (!body) {
    return c.json(
      {
        success: false,
        error: "Invalid JSON body",
        code: "INVALID_BODY",
      },
      400,
    );
  }

  const { from, to, content } = body;

  // Validate 'from'
  if (!from || typeof from !== "string") {
    return c.json(
      {
        success: false,
        error:
          "Missing or invalid 'from' format. Expected: json, yaml, toml, or lua",
        code: "INVALID_FROM",
      },
      400,
    );
  }

  if (!FORMATS.includes(from)) {
    return c.json(
      {
        success: false,
        error: `Unsupported 'from' format: ${from}`,
        code: "UNSUPPORTED_FROM",
      },
      400,
    );
  }

  // Validate 'to'
  if (!to || typeof to !== "string") {
    return c.json(
      {
        success: false,
        error:
          "Missing or invalid 'to' format. Expected: json, yaml, toml, or lua",
        code: "INVALID_TO",
      },
      400,
    );
  }

  if (!FORMATS.includes(to)) {
    return c.json(
      {
        success: false,
        error: `Unsupported format: '${to}'. Supported: ${FORMATS.join(", ")}`,
        code: "UNSUPPORTED_TO",
      },
      400,
    );
  }

  if (!content || typeof content !== "string") {
    return c.json(
      {
        success: false,
        error: "Missing or invalid 'content'. Expected non-empty string",
        code: "INVALID_CONTENT",
      },
      400,
    );
  }

  // Validate size
  if (content.length > MAX_CONTENT_SIZE) {
    return c.json(
      {
        success: false,
        error: `Content exceeds 1MB limit (${(content.length / 1024 / 1024).toFixed(2)}MB)`,
        code: "CONTENT_TOO_LARGE",
      },
      413,
    );
  }

  try {
    // Parse 'from' into JS Object
    let data;
    try {
      if (from === "json") data = JSON.parse(content);
      else if (from === "yaml") data = yaml.load(content);
      else if (from === "toml") data = parseToml(content);
      else if (from === "lua") data = luaparse.parse(content, { wait: false });
    } catch (parseErr) {
      const hint = getFormatHint(from, parseErr.message);
      return c.json(
        {
          success: false,
          error: `Failed to parse ${from.toUpperCase()}:
          ${parseErr.message}${hint}`,
          code: `PARSE_${from.toUpperCase()}_FAILED`,
          format: from,
        },
        422,
      );
    }

    // Stringify Object into 'to' format
    let result;
    try {
      if (to === "json") result = JSON.stringify(data, null, 2);
      else if (to === "yaml") result = yaml.dump(data);
      else if (to === "toml") result = stringifyToml(data);
      else if (to === "lua") result = toLua(data);
    } catch (stringifyErr) {
      return c.json(
        {
          success: false,
          error: `Failed to convert to ${to.toUpperCase()}:
          ${stringifyErr.message}`,
          code: `STRINGIFY_${to.toUpperCase()}_FAILED`,
          conversion: `${from} -> ${to}`,
        },
        422,
      );
    }

    return c.json({ success: true, result });
  } catch (err) {
    return c.json(
      {
        success: false,
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      },
      500,
    );
  }
});

export default app;
