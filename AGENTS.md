# ConfigAlchemy - Amp Agents Configuration

Project-specific guidance for ConfigAlchemy development.

## Project Overview

**ConfigAlchemy** is a high-performance, stateless API designed to bridge the gap between incompatible configuration formats. It's an industrial-grade conversion engine for JSON, YAML, TOML, and Lua—built for DevOps pipelines, game engines (LÖVE/ECS), and Neovim power users.

The API is deployed on Cloudflare Workers and available via RapidAPI with freemium and paid subscription tiers.

**Tech Stack:**

- Hono (lightweight web framework)
- Cloudflare Workers (serverless runtime)
- Node.js: js-yaml, smol-toml

## Current Version (v1.0)

### Supported Formats

| Format | Input | Output | Notes                                       |
| ------ | ----- | ------ | ------------------------------------------- |
| JSON   | ✓     | ✓      | Standard and minified                       |
| YAML   | ✓     | ✓      | Nested structures and blocks                |
| TOML   | ✓     | ✓      | Clean, minimal parsing                      |
| Lua    | ✗     | ✓      | Output-only in v1.0; input planned for v1.1 |

### Key Features

- **Zero-Persistence**: In-memory processing only; no disk storage of configs
- **Lua-First**: Native support for Lua Table generation (perfect for LÖVE and Neovim)
- **Validator-Integrated**: Provides semantic hints for syntax errors (not just failure)
- **High Performance**: Sub-50ms processing via Cloudflare's global edge network
- **Stateless by Design**: Secrets never touch a disk; no logs or caching of content

## Development Workflow

### Setup

```bash
npm install
npm run dev        # Local development server (http://localhost:8787)
npm run deploy     # Deploy to Cloudflare Workers
npm test           # Run unit tests
```

### Local Testing

Run the comprehensive test suite:

```bash
chmod +x test.sh
./test.sh          # Integration tests (requires dev server running)
npm test           # Unit tests
```

Or test manually:

```bash
curl -X POST http://localhost:8787/convert \
  -H "Content-Type: application/json" \
  -d '{
    "from": "json",
    "to": "yaml",
    "content": "{\"name\": \"test\", \"version\": \"1.0.0\"}"
  }'
```

### Code Standards

- **Format conversions** live in `src/index.js`
- Use `const` by default; avoid `var`
- All parsing/stringification must be wrapped in `try/catch` blocks
- Helper functions like `toLua` require WHAT/WHY/HOW/NOTE comment blocks
- Error responses must include specific error codes (`PARSE_JSON_FAILED`, etc.) and semantic hints

### API Endpoint

**POST `/convert`**

- Accepts: `from` (source format), `to` (target format), `content` (config string)
- Returns: JSON with `success`, `result`, and optional `code`/`error`
- Error codes: `INVALID_BODY`, `UNSUPPORTED_FROM`, `PARSE_YAML_FAILED`, `CONTENT_TOO_LARGE`, etc.
- Size limit: 1MB per request

### File Structure

```
src/
  index.js              # Main application (Hono routes, validation, error handling)
  index.test.js         # Unit tests (Node.js test runner)
test.sh                 # Integration test suite (bash + curl)
wrangler.toml           # Cloudflare Workers configuration
package.json            # Dependencies and npm scripts
README.md               # Public documentation
AGENTS.md               # This file (development guidance)
LICENSE                 # MIT License
.gitignore              # Standard Node.js/Cloudflare patterns
```

## Git Workflow

### Commit Format

Use conventional commits:

```
feat(format): add lua parsing support
fix(convert): handle null values in toLua
docs(readme): update API examples
refactor(validation): consolidate format checks
test(integration): add edge case for large payloads
```

### Pre-Commit Checklist

- Tests pass locally (`npm test` and `./test.sh`)
- Code follows standards (no `var`, proper error handling)
- Comments updated (WHAT/WHY/HOW/NOTE for complex logic)
- README or AGENTS.md updated if behavior changes

## Devlog

End-of-day devlog entries go in `.notes/DEVLOG.md` with timestamps:

```markdown
## [YYYY-MM-DD] [HH:MM - HH:MM]

### What I Did

- Fixed Lua string escaping in toLua function
- Added size limit validation (1MB)

### Currently Working On

- Error hint system for YAML indentation

### Next Steps

- Implement Lua input parsing for v1.1
```

## Deployment

### Cloudflare Workers

```bash
npm run deploy  # Uses wrangler.toml config
```

Requires `wrangler` CLI and authentication. See `wrangler.toml` for settings.

### RapidAPI

ConfigAlchemy is listed on RapidAPI with freemium and paid tiers:

- **Basic**: Free tier (~100 requests/month)
- **Pro**: $5/mo (unlimited requests, priority support)
- **Ultra**: $20/mo (enhanced features, SLA)
- **Mega**: $60/mo (dedicated support, custom endpoints)

[View on RapidAPI](https://rapidapi.com/TheOnliestMattastic/api/config-alchemy2)

## Known Limitations & TODOs

### v1.0 Complete

- ✓ JSON, YAML, TOML input support
- ✓ JSON, YAML, TOML, Lua output support
- ✓ Comprehensive error handling with semantic hints
- ✓ Size limit validation (1MB)
- ✓ Integration and unit test suites

### v1.1 Roadmap

- Lua input parsing support
- Additional formats (CSV, INI, XML)
- Request rate limiting per API tier
- Enhanced performance metrics

### Known Issues

- None currently documented

## Performance & Stability

- **Latency**: Sub-50ms for most conversions (via Cloudflare edge network)
- **Uptime**: 99.9% via Cloudflare Workers
- **Payload Limit**: 1MB per request
- **Error Handling**: Specific error codes + helpful hints for debugging

## Support & Contact

- **GitHub**: [TheOnliestMattastic/ConfigAlchemy](https://github.com/TheOnliestMattastic/ConfigAlchemy)
- **RapidAPI Dashboard**: Contact through RapidAPI for API issues
- **Commercial/Enterprise**: Contact provider through RapidAPI
- **Bug Reports**: Open issues on GitHub

## Testing Strategy

### Unit Tests (`src/index.test.js`)

- Tests conversion logic directly
- 30+ test cases covering valid conversions, errors, edge cases
- Run with: `npm test`

### Integration Tests (`test.sh`)

- Full HTTP endpoint testing via curl
- Tests input validation, parse errors, size limits
- ~35 test cases across 6 sections
- Run with: `./test.sh` (requires dev server)

### Coverage

- Valid conversions: JSON↔YAML, JSON↔TOML, JSON→Lua, YAML↔TOML, YAML→Lua, etc.
- Error cases: Invalid syntax, missing fields, unsupported formats
- Edge cases: Null values, nested structures, arrays, large payloads
- Validation: Type checking, size limits, format validation

## License & Terms

- **License**: MIT (see LICENSE file)
- **Commercial Use**: Available via RapidAPI subscriptions
- **Data Privacy**: Stateless; no storage or logging of request content
- **Enterprise Tiers**: Available; contact provider through RapidAPI
