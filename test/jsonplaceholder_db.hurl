# GET with testdb queries (pre/post output)

# output:testdb:{dsn}|SELECT * FROM users WHERE id = 1

GET https://httpbin.org/get

HTTP 200
[Asserts]
status == 200

# post-output:testdb:{dsn}|SELECT * FROM posts WHERE userId = 1 LIMIT 5

GET https://httpbin.org/anything

HTTP 200
[Asserts]
status == 200