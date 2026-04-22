# Entry 1: Simple GET request (normal entry)
GET https://httpbin.org/get
# show-header:Content-Type

HTTP 200
[Asserts]
status == 200

# Entry 2: GET request with # skip marker
# skip
GET https://httpbin.org/status/204

HTTP 204

# Entry 3: GET with custom DB query comment (will try postgres if available)
GET https://httpbin.org/uuid
# show-header:*

HTTP 200
[Asserts]
status == 200

# output:postgresdb:{db_dsn}|SELECT 1 as test
