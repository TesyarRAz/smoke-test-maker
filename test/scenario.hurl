# Entry 1: Simple GET request (normal entry)
GET https://httpbin.org/get
# show-header:Content-Type

HTTP 200
[Asserts]
status == 200
[Captures]
binUrl: jsonpath "$.url"

# Entry 2: GET request with # skip marker
# skip
GET https://httpbin.org/status/204

HTTP 204

# Entry 3: GET with custom DB query comment (will try postgres if available)
GET https://httpbin.org/uuid?q={{binUrl}}
# show-header:*
# screenshot
HTTP 200
[Asserts]
status == 200
