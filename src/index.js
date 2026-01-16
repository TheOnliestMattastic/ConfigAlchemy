import { Hono } from "hono";
import yaml from "js-yaml";
import { parse as parseToml, stringify as stringifyToml } from "smol-toml";
import luaparse from "luaparse";

const app = new Hono();

// Helper to turn a JS Object into a Lua table string
const toLua = (obj) => {
  if (typeof obj !== "object" || obj === null) return JSON.stringify(obj);
  const parts = Object.entries(obj).map(([k, v]) => `["${k}"] = ${toLua(v)}`);
  return `{ ${parts.join(", ")} }`;
};


