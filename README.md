# ConfigAlchemy

A lightweight config file format converter API. Converts between JSON, YAML, TOML, and Lua formats.

## Features

- Convert between JSON, YAML, TOML, and Lua
- Built with Hono for fast, lightweight request handling
- Deploy to Cloudflare Workers
- Simple REST API interface
- Available on RapidAPI with freemium pricing

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

ConfigAlchemy is available on [RapidAPI](https://rapidapi.com) with a freemium pricing model:

- **Free Tier**: 100 requests/month
- **Pro Tier**: Unlimited requests with priority support
- **Enterprise**: Custom pricing for high-volume use cases

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

- `from` (string): Source format (`json`, `yaml`, `toml`, `lua`)
- `to` (string): Target format (`json`, `yaml`, `toml`, `lua`)
- `content` (string): Config content to convert

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
  "error": "Invalid JSON"
}
```

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

### YAML to TOML

```bash
curl -X POST http://localhost:8787/convert \
  -H "Content-Type: application/json" \
  -d '{
    "from": "yaml",
    "to": "toml",
    "content": "name: test\nversion: 1.0.0"
  }'
```

## Project Structure

```
src/
  index.js          # Main application file with conversion logic
wrangler.toml       # Cloudflare Workers configuration
package.json        # Dependencies and scripts
```

## Dependencies

- **hono**: Web framework
- **js-yaml**: YAML parsing and stringification
- **smol-toml**: TOML parsing and stringification
- **luaparse**: Lua parsing

## Notes

- The Lua output format uses `["key"] = value` syntax for all keys
- Input validation and error handling are implemented for all format conversions
- See `AGENTS.md` for development workflow and known issues

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

## Support

- **Issues & Bugs**: Open an issue on GitHub
- **RapidAPI Support**: Contact through RapidAPI dashboard
- **Commercial inquiries**: [Contact us](#)
