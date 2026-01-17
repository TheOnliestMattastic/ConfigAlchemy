# ConfigAlchemy

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)](https://github.com/TheOnliestMattastic/ConfigAlchemy)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge)](https://nodejs.org)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange?style=for-the-badge)](https://workers.cloudflare.com)
[![RapidAPI](https://img.shields.io/badge/RapidAPI-Available-red?style=for-the-badge)](https://rapidapi.com/TheOnliestMattastic/api/config-alchemy2)

A stateless, industrial-grade conversion engine for JSON, YAML, TOML, and Lua. Built for CI/CD pipelines, game engines, and Neovim power users.

## Overview

**ConfigAlchemy** is a high-performance, stateless API designed to bridge the gap between incompatible configuration formats. Whether you are automating a DevOps pipeline, converting web-data for a Lua game engine, or simply cleaning up a messy TOML file, ConfigAlchemy handles the heavy lifting with precision.

## Key Features

- **Zero-Persistence**: In-memory processing only. Your secrets never touch a disk.
- **Lua-First**: Native support for Lua Table generation (perfect for LÖVE and Neovim).
- **Validator-Integrated**: Doesn't just fail; it provides semantic hints for syntax errors.
- **High Performance**: Sub-50ms processing via Cloudflare's global edge network.

## Supported Formats

- **JSON**: Standard and minified
- **YAML**: Support for nested structures and blocks
- **TOML**: Clean, minimal configuration parsing
- **Lua**: Native Table generation with `return` syntax (output only in v1.0)

## Use Cases

- **DevOps/Automation**: Convert YAML Kubernetes manifests to JSON for API processing
- **Game Dev (LÖVE/ECS)**: Fetch JSON data from a web API and convert it instantly to a Lua table for your game engine
- **Developer Tooling**: Generate `.luarc.json` or Neovim configuration files programmatically

## Installation

```bash
npm install
```

## Development

### Local Server

```bash
npm run dev
```

Server runs on `http://localhost:8787`

### Deployment

#### Cloudflare Workers

```bash
npm run deploy
```

Requires `wrangler` to be configured. See `wrangler.toml` for settings.

#### RapidAPI

ConfigAlchemy is available on [RapidAPI](https://rapidapi.com/TheOnliestMattastic/api/config-alchemy2):

- **Basic**: $0/mo - Limited requests
- **Pro**: $5/mo - Unlimited requests with priority support
- **Ultra**: $20/mo - Enhanced features and SLA
- **Mega**: $60/mo - Dedicated support and custom endpoints

Subscribe and get your API key from your RapidAPI dashboard. Use the key in the `X-RapidAPI-Key` header.

## API Reference

### POST `/convert`

Converts config content from one format to another.

**Request:**

```json
{
  "from": "json",
  "to": "yaml",
  "content": "{\"name\": \"example\", \"version\": \"1.0.0\"}"
}
```

**Parameters:**

| Parameter | Type   | Required | Description                                       |
| --------- | ------ | -------- | ------------------------------------------------- |
| `from`    | string | Yes      | The source format (`json`, `yaml`, `toml`)        |
| `to`      | string | Yes      | The target format (`json`, `yaml`, `toml`, `lua`) |
| `content` | string | Yes      | The raw configuration string you want to convert  |

**Response (Success):**

```json
{
  "success": true,
  "result": "name: example\nversion: 1.0.0\n"
}
```

**Response (Error):**

```json
{
  "success": false,
  "error": "Failed to parse JSON: Unexpected token...",
  "code": "PARSE_JSON_FAILED",
  "format": "json"
}
```

### Error Codes

ConfigAlchemy provides specific error codes and helpful hints for debugging:

- `INVALID_BODY`: Malformed JSON request
- `INVALID_FROM`: Missing or invalid source format
- `INVALID_TO`: Missing or invalid target format
- `INVALID_CONTENT`: Missing or empty content
- `UNSUPPORTED_FROM`: Source format not supported
- `UNSUPPORTED_TO`: Target format not supported
- `PARSE_JSON_FAILED`: JSON syntax error
- `PARSE_YAML_FAILED`: YAML syntax error
- `PARSE_TOML_FAILED`: TOML syntax error
- `CONTENT_TOO_LARGE`: Content exceeds 1MB limit

## Examples

### JSON to YAML

```bash
curl -X POST http://localhost:8787/convert \
  -H "Content-Type: application/json" \
  -d '{
    "from": "json",
    "to": "yaml",
    "content": "{\"name\": \"test\", \"version\": \"1.0.0\"}"
  }'
```

### YAML to Lua Table

```bash
curl -X POST http://localhost:8787/convert \
  -H "Content-Type: application/json" \
  -d '{
    "from": "yaml",
    "to": "lua",
    "content": "database:\n  host: localhost\n  port: 5432"
  }'
```

Response:

```lua
{ ["database"] = { ["host"] = "localhost", ["port"] = 5432 } }
```

### JSON to TOML

```bash
curl -X POST http://localhost:8787/convert \
  -H "Content-Type: application/json" \
  -d '{
    "from": "json",
    "to": "toml",
    "content": "{\"package\": {\"name\": \"myapp\", \"version\": \"1.0.0\"}}"
  }'
```

## Project Structure

```
src/
  index.js          # Main application with conversion logic
wrangler.toml       # Cloudflare Workers configuration
package.json        # Dependencies and scripts
test.sh             # Comprehensive test suite
```

## Dependencies

- **hono**: Lightweight web framework
- **js-yaml**: YAML parsing and stringification
- **smol-toml**: TOML parsing and stringification

## Stability & Security

- **Stateless by Design**: We do not store, log, or cache the contents of your configurations
- **Error Handling**: Our parser returns specific error codes and helpful hints to identify syntax issues
- **Edge Deployment**: Hosted on Cloudflare Workers for 99.9% uptime and low-latency response times globally

## Roadmap

### v1.0 (Current)

- JSON, YAML, TOML input support
- JSON, YAML, TOML, Lua output support
- Comprehensive error handling with semantic hints

### v1.1 (Planned)

- Lua input parsing support
- Additional format support (CSV, INI, XML)

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

ConfigAlchemy is provided for commercial use via RapidAPI subscriptions. For custom high-volume enterprise tiers or dedicated instances, please contact the provider.

## Support

- **GitHub**: [TheOnliestMattastic/ConfigAlchemy](https://github.com/TheOnliestMattastic/ConfigAlchemy)
- **RapidAPI Support**: Contact through RapidAPI dashboard
- **Commercial inquiries**: Contact the provider through RapidAPI
