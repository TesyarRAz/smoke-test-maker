# POST, PUT, DELETE requests to JSONPlaceholder API

# Entry 2: multiple pre-output
# pre-output:testdb:{dsn}|SELECT id FROM users
# post-output:testdb:{dsn}|SELECT id FROM products
# screenshot
POST https://jsonplaceholder.typicode.com/posts
Content-Type: application/json
{
  "title": "Test Title",
  "body": "Test Body",
  "userId": 1
}
HTTP 201
[Asserts]
status == 201

PUT https://jsonplaceholder.typicode.com/posts/1
{
  "id": 1,
  "title": "Updated Title",
  "body": "Updated Body",
  "userId": 1
}
HTTP 200
[Asserts]
status == 200

DELETE https://jsonplaceholder.typicode.com/posts/1
HTTP 200
[Asserts]
status == 200
