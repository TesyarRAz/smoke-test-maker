# Fix Postgres Connector - Real Connection

## TL;DR

> Fix postgres connector agar menggunakan DSN dari variable/hurl, bukan mock.

---

## Context

### Issue
Connector postgres saat ini menggunakan mock connection string hardcoded:
```typescript
connectionString: 'postgres://mock:mock@localhost:5432/mock'
```

Seharusnya menggunakan DSN yang diberikan dari:
1. Parameter ke `connect(connectionString)`
2. Atau dari environment `DATABASE_URL`
3. Atau fallback ke default

---

## TODOs

- [x] 1. Update PostgresConnector.connect() untuk accept connection string

  **What to do**:
  - File: `src/connectors/postgres.ts`
  - Parameters: `connectionString?: string`
  - Fallback: env `DATABASE_URL` → default `postgres://postgres:postgres@localhost:5432/postgres`
  - Test koneksi dengan `SELECT 1`

- [x] 2. Update index.ts untuk pass DSN ke connector

  **What to do**:
  - File: `src/index.ts`
  - Pass `dsn` dari resolved variable ke `connector.connect(dsn)`

---

## Done Criteria

- [x] Connector menggunakan real DSN
- [x] Build passes