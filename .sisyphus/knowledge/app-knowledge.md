# smoke-test-maker - Knowledge Base

## Overview

**smoke-test-maker** adalah CLI tool untuk generate dan execute smoke tests dari file `.hurl` dengan integrasi database query.

- **Version**: 1.9.1
- **Language**: TypeScript
- **Package Manager**: npm (bun)
- **Build**: esbuild + tsc

## Core Features

1. **Parse .hurl files** - Eksekusi HTTP requests dari format Hurl
2. **DB Integration** - Jalankan query ke PostgreSQL, MySQL, MongoDB setelah HTTP calls
3. **Capture Variables** - Capture response values untuk digunakan di subsequent requests
4. **Output Generation** - Generate JSON/HTML output untuk setiap test case
5. **Screenshot Capture** - Generate PNG screenshots via Puppeteer
6. **GraphML Flow** - Generate flow diagram dalam format GraphML + PNG

## CLI Usage

```bash
smoke-test-maker <input.hurl> [options]
```

### Options

| Flag | Description |
|------|-------------|
| `-e, --env <path>` | Path ke .env file |
| `-o, --output-dir <path>` | Output directory (default: ./output) |
| `-s, --stop-on-failure` | Stop execution on first failure |
| `--strict` | Exit with error if any case fails |
| `-v, --variable <key=value>` | Set variable (can be repeated) |
| `-d, --very-verbose` | Print detailed debug info including DB connections |
| `--display-mode <mode>` | Display mode: vertical, horizontal, or grid |
| `--display-width <width>` | Display width in px (default: 1400) |
| `--graphml` | Generate GraphML flow diagram and PNG image |

### Auto-loading .env

Kalau tidak ada `-e` flag, tool otomatis load `.env` dari folder yang sama dengan input file.

## Project Structure

```
smoke-test-maker/
├── src/
│   ├── index.ts           # Main entry point
│   ├── cli.ts           # CLI argument parsing
│   ├── parser/
│   │   └── hurl-parser.ts      # Parse .hurl files
│   ├── executor/
│   │   └── hurl-executor.ts  # Execute HTTP requests
│   ├── generator/
│   │   ├── output-generator.ts  # Generate JSON/HTML output
│   │   ├── html-generator.ts   # Generate screenshot HTML
│   │   └── graphml-generator.ts # Generate GraphML diagrams
│   ├── processor/
│   │   └── comment-processor.ts  # Process DB queries
│   ├── connectors/
│   │   ├── index.ts         # Factory pentru DB connectors
│   │   ├── postgres.ts     # PostgreSQL connector
│   │   ├── mysql.ts        # MySQL connector
│   │   ├── mongodb.ts      # MongoDB connector
│   │   └── testdb.ts      # Test DB connector (mock)
│   ├── handler/
│   │   └── skip-handler.ts # Handle skip options
│   ├── resolver/
│   │   └── variable-resolver.ts # Resolve {{variables}}
│   └── types/
│       ├── hurl.ts         # Hurl type definitions
│       ├── output.ts       # Output type definitions
│       └── database.ts    # Database type definitions
├── dist/                  # Compiled output
├── bin/
│   └── smoke-test-maker.cjs  # CLI entry point
└── package.json
```

## Supported Database Types

- `postgres` / `postgresdb` - PostgreSQL
- `mysql` - MySQL
- `mongodb` - MongoDB
- `testdb` - Test/Mock DB (untuk development)

## Custom Comments Syntax

Dalam .hurl file,gunakan comments untuk DB integration:

```hurl
# @postgres {{DB_DSN}}
# SELECT * FROM users WHERE id = {{user_id}}

GET https://api.example.com/users/{{user_id}}
```

### Actions

| Action | Description |
|--------|-------------|
| `output` | Jalankan query dan include di output |
| `screenshot` | Trigger screenshot capture |
| `pre-output` | Query sebelum HTTP call |
| `post-output` | Query setelah HTTP call |

### Contoh .hurl File

```hurl
# @postgres {{DB_DSN}}
# SELECT id, name FROM users WHERE active = true

GET https://api.example.com/users

HTTP 200
[Captures]
name: jsonpath "$..users"
```

## Key Type Definitions

### HurlEntry

```typescript
interface HurlEntry {
  index: number;
  request: HurlRequest;
  response?: HurlResponse;
  captures?: HurlCapture[];
  asserts?: HurlAssert[];
  options?: HurlOptions;
  customComments?: CustomComment[];
  skip?: boolean;
  showHeaders?: string[];
  showScreenshot?: boolean;
  title?: string;
}
```

### CustomComment

```typescript
interface CustomComment {
  action: 'output' | 'screenshot' | 'pre-output' | 'post-output';
  dbType: 'postgres' | 'postgresdb' | 'mysql' | 'mongodb' | 'testdb';
  dsnVariable: string;
  query?: string;
}
```

## Dependencies

### Runtime
- `commander` - CLI argument parsing
- `dotenv` - .env file parsing
- `html-to-image` - HTML to PNG conversion
- `mongodb` - MongoDB driver
- `mysql2` - MySQL driver
- `pg` - PostgreSQL driver
- `pretty-print-json` - JSON formatting
- `puppeteer` - Browser automation

### Dev
- `@types/node`
- `esbuild`
- `typescript`

## Output Files

Setiap test case generate:

1. `case{N}.json` - JSON output dengan HTTP response + DB query results
2. `case{N}_screenshot.png` - Screenshot (kalau ada screenshot action)
3. `case{N}_flow.html` - HTML flow diagram (kalau menggunakan --graphml)

## Variable Resolution

Format: `{{variable_name}}`

- Resolve dari CLI `-v` flags
- Resolve dari `.env` file
- Resolve dari captured values dari sebelumnya

## Key Implementation Details

### Connector Caching

DB connectors di-cache berdasarkan DSN untuk reuse di sequential requests.

```typescript
const connectorCache = new Map<string, DatabaseConnection>();
```

### Variable Accumulation

Variables terakumulasi dari entry ke entry:

```typescript
let accumulatedVars = { ...options.variables };
for (const result of results) {
  // ...
  accumulatedVars = { ...accumulatedVars, ...result.capturedVars };
}
```

### Execution Flow

1. Parse .hurl file
2. Execute entries sequentially
3. Untuk setiap entry:
   - Jalankan HTTP request
   - Capture variables
   - Process custom comments (DB queries)
   - Generate output JSON
   - Generate screenshot (kalau ada screenshot action)
4. Print summary

## Build & Release

```bash
# Build
npm run build  # tsc

# Bundle untuk distribution
npm run bundle # esbuild

# Release
npm run release
```

## Common Issues & Solutions

1. **Connection pool** - Cek connector reuse logic
2. **Variable resolution** - Pastikan format `{{var}}` cocok
3. **DB type mapping** - `postgresdb` -> PostgreSQL connector

## Last Updated

2026-04-27