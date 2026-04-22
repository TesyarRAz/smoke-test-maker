# GET with testdb queries (pre/post output)

# pre-output:postgres:{dsn}|SELECT id FROM users
# post-output:postgres:{dsn}|SELECT id FROM products
GET https://httpbin.org/get

HTTP 200
[Asserts]
status == 200

GET https://httpbin.org/anything
HTTP 200
[Asserts]
status == 200