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

app.post("/convert", async (c) => {
  const { from, to, content } = await c.req.json();

  try {
    // Parse 'from' into JS Object
    let data;
    if (from === "json") data = JSON.parse(content);
    if (from === "yaml") data = yaml.load(content);
    if (from === "toml") data = parseToml(content);
    if (from === "lua") {
      data = luaparse.parse(content, { wait: false });
    }

    // Stringify Object into 'to' format
    let result;
    if (to === "json") result = JSON.stringify(data, null, 2);
    if (to === "yaml") result = yaml.dump(data);
    if (to === "toml") result = stringifyToml(data);
    if (to === "lua") result = toLua(data);

    return c.json({ success: true, result });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

export default app;
