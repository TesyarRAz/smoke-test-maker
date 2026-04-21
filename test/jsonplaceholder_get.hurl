# GET requests to JSONPlaceholder API

GET https://jsonplaceholder.typicode.com/posts

HTTP 200
[Asserts]
status == 200

GET https://jsonplaceholder.typicode.com/posts/1

HTTP 200
[Asserts]
status == 200

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
