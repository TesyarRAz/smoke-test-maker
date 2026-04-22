# GET requests to JSONPlaceholder API

# pre-output:testdb:{dsn}|SELECT id FROM users
# post-output:testdb:{dsn}|SELECT id FROM products WHERE id = '{{id}}'
# screenshot
GET https://jsonplaceholder.typicode.com/posts
HTTP 200
[Asserts]
status == 200
[Captures]
id: jsonpath "$[0].id"

# pre-output:testdb:{dsn}|SELECT id FROM users
# post-output:testdb:{dsn}|SELECT id FROM products
# screenshot
GET https://jsonplaceholder.typicode.com/posts/1
HTTP 200
[Asserts]
status == 200
[Captures]
id: jsonpath "$.id"

GET https://jsonplaceholder.typicode.com/posts/1/comments

HTTP 200
[Asserts]
status == 200

GET https://jsonplaceholder.typicode.com/comments?postId=1

HTTP 200
[Asserts]
status == 200

GET https://jsonplaceholder.typicode.com/users/1

HTTP 200
[Asserts]
status == 200

GET https://jsonplaceholder.typicode.com/posts?userId=1

HTTP 200
[Asserts]
status == 200
