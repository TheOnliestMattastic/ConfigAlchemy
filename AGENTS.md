# ConfigAlchemy - Amp Agents Configuration

Project-specific guidance for ConfigAlchemy development.

## Project Overview

ConfigAlchemy is a lightweight config file format converter API built with Hono. It converts between JSON, YAML, TOML, and Lua formats.

**Tech Stack:**

- Hono (web framework)
- Cloudflare Workers (runtime)
- Node.js dependencies: js-yaml, smol-toml, luaparse

## Development Workflow

### Setup

```bash
npm install
npm run dev        # Local development server
npm run deploy     # Deploy to Cloudflare Workers (requires wrangler setup)
```

### Code Standards

- **Format conversions** live in `src/index.js`
- Use `const` by default; avoid `var`
- Helper functions like `toLua` should be clearly documented with input/output examples
- All parsing/stringification should be wrapped in `try/catch` blocks

### Testing Workflow

Test the `/convert` endpoint locally:

```bash
curl -X POST http://localhost:8787/convert \
  -H "Content-Type: application/json" \
  -d '{
    "from": "json",
    "to": "yaml",
    "content": "{\"name\": \"test\", \"version\": \"1.0.0\"}"
  }'
```

## Git Workflow

Follow the standard `.gitignore` and `.notes` conventions from personal AGENTS.md.

**Commit format:**

- `feat(format): add lua parsing support`
- `fix(convert): handle null values in toLua`
- `docs(readme): update API examples`

## Devlog

End-of-day devlog entries go in `.notes/DEVLOG.md` with timestamps.

## Next Steps for Development

3. Add input validation for request parameters (`from`, `to`, `content`)
4. Add comprehensive error handling for unsupported format combinations
5. Create unit tests for each format conversion
