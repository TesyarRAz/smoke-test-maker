# Entry 1: pre-output + process + post-output
# pre-output:testdb:{dsn}|SELECT id, name FROM users
GET https://httpbin.org/uuid

HTTP 200

# post-output:testdb:{dsn}|SELECT id, price FROM products

# Entry 2: multiple pre-output
# pre-output:testdb:{dsn}|SELECT id FROM users
# pre-output:testdb:{dsn}|SELECT id FROM products
# screenshot
GET https://httpbin.org/ip

HTTP 200

# post-output:testdb:{dsn}|SELECT id FROM orders
