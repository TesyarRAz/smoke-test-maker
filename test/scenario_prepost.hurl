# Entry 1: With pre-output and post-output
# pre-output:testdb:{dsn}|SELECT id, name FROM users
GET https://httpbin.org/uuid

HTTP 200

# post-output:testdb:{dsn}|SELECT id, price FROM products

# Entry 2: Just post-output
GET https://httpbin.org/ip

HTTP 200

# post-output:testdb:{dsn}|SELECT id, email FROM users
