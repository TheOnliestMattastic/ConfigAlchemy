import { Hono } from "hono";
import { cors } from "hono/cors";
import yaml from "js-yaml";
import { parse as parseToml, stringify as stringifyToml } from "smol-toml";
import luaparse from "luaparse";

const app = new Hono();

// =============================================================================
// TO_LUA CONVERTER
// -----------------------------------------------------------------------------
// WHAT: Recursively converts JavaScript objects/arrays into Lua table syntax
// WHY:  Lua requires specific formatting for tables; this ensures valid output
// HOW:  Handles primitives first, then arrays (positional), then objects (key=value)
// NOTE: Escapes quotes in strings; null becomes nil; uses 1-based indexing for arrays
// -----------------------------------------------------------------------------

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

// =============================================================================
// CONFIGURATION
// -----------------------------------------------------------------------------

const FORMATS = ["json", "yaml", "toml", "lua"];
const MAX_CONTENT_SIZE = 1024 * 1024; // 1MB

// =============================================================================
// ERROR HINT GENERATOR
// -----------------------------------------------------------------------------
// WHAT: Provides format-specific error hints based on error message patterns
// WHY:  Helps users fix common mistakes without deep debugging
// HOW:  Matches error keywords (Unexpected token, bad indentation) to hints
// NOTE: Returns empty string if no hint matches; keeps errors concise
// -----------------------------------------------------------------------------

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

// =============================================================================
// POST /CONVERT ENDPOINT
// -----------------------------------------------------------------------------
// WHAT: Main API endpoint that converts config files between formats
// WHY:  Provides single entry point for all conversion requests
// HOW:  Validates input, parses source, converts to target, with error handling
// NOTE: Returns JSON with success flag, result/error, and error codes for RapidAPI
// -----------------------------------------------------------------------------

app.use("/convert", cors());

app.post("/convert", async (c) => {
  const rapidSecret = c.req.header("x-rapidapi-proxy-secret");
  if (rapidSecret !== "52b69850-f3af-11f0-8b51-f73a198fecf8") {
    return c.json({ error: "Unauthorized access. Please use RapidAPI." }, 401);
  }
  const body = await c.req.json().catch(() => null);

  // Validate request body is valid JSON
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

  // ---------------------------------------------------------------------------
  // INPUT VALIDATION
  // ---------------------------------------------------------------------------

  // Validate 'from' format parameter exists and is string
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

  // Validate 'from' is in supported formats list
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

  // Validate 'to' format parameter exists and is string
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

  // Validate 'to' is in supported formats list
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

  // Validate 'content' exists and is non-empty string
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

  // Validate content size doesn't exceed 1MB limit
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

  if (from === "lua") {
    return c.json(
      {
        success: false,
        error: "Lua input parsing is currently disabled (Coming Soon).",
        code: "UNSUPPORTED_FROM_LUA",
      },
      400,
    );
  }

  // ===========================================================================
  // FORMAT CONVERSION LOGIC
  // ---------------------------------------------------------------------------

  try {
    // Parse source format into JavaScript object
    let data;
    try {
      if (from === "json") data = JSON.parse(content);
      else if (from === "yaml") data = yaml.load(content);
      else if (from === "toml") data = parseToml(content);
      // else if (from === "lua") data = luaparse.parse(content, { wait: false });
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

    // Convert JavaScript object to target format
    let result;
    try {
      if (to === "json") result = JSON.stringify(data, null, 2);
      else if (to === "yaml") result = yaml.dump(data);
      else if (to === "toml") result = stringifyToml(data);
      else if (to === "lua") {
        result = "return " + toLua(data);
      }
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
    // Catch unexpected errors not covered by format-specific handlers
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
