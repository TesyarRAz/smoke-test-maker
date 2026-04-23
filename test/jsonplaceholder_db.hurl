# GET with testdb queries (pre/post output)

# pre-output:postgresdb:{{dsn}}|SELECT id FROM documents limit 1
# post-output:postgresdb:{{dsn}}|SELECT id FROM documents limit 1
# screenshot
GET https://httpbin.org/get

HTTP 200
[Asserts]
status == 200

GET https://httpbin.org/anything
HTTP 200
[Asserts]
status == 200