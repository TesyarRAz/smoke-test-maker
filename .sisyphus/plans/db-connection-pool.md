# DB Connection Pool - Reuse Connections

## TL;DR

Gunakan connection pool yang di-cache per unique DSN. Jangan create/disconnect per case.

---

## Context

### Issue
Setiap case buat koneksi baru → inefficient

### Solution
1. Parse semua entry, collect unique DSN
2. Buat pool sekali per unique DSN  
3. Simpan di map: `DsnKey → Connector`
4. Reuse pool per case

---

## TODOs

- [x] 1. Create connection pool manager di src/index.ts

  Collect DSNs upfront, create pools, store in Map

- [x] 2. Modify comment-processor untuk accept map

  Accept connector map instead of creating new

- [x] 3. Cleanup: disconnect all pools at end

---

## Done Criteria

- [x] Unique DSN → single connection pool
- [x] Build passes