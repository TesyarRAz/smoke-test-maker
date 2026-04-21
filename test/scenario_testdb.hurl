# Entry 1: Simple GET (normal)
GET https://httpbin.org/get

HTTP 200

# Entry 2: With testdb output
GET https://httpbin.org/uuid

HTTP 200

# output:testdb:{dsn}|SELECT id, name FROM users
