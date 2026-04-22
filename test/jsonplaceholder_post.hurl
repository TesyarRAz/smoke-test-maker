# TCC-01: multiple pre-output
# pre-output:postgres:{dsn}|SELECT id FROM users
# post-output:postgres:{dsn}|SELECT id FROM products
# screenshot
POST {{BASE_URL}}/posts
Content-Type: application/json
{
  "title": "Test Title",
  "body": "Test Body",
  "userId": 1
}
HTTP 201
[Asserts]
status == 201

PUT {{BASE_URL}}/posts/1
{
  "id": 1,
  "title": "Updated Title",
  "body": "Updated Body",
  "userId": 1
}
HTTP 200
[Asserts]
status == 200

DELETE {{BASE_URL}}/posts/1
HTTP 200
[Asserts]
status == 200
