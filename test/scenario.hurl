# Entry 1: Simple GET request (normal entry)
# title:TCC-01
# show-header:Content-Type
GET https://httpbin.org/get

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
# title:TCC-02: asdasd
# show-header:*
# pre-output:testdb:sdad|select * from asdsadsad
# post-output:testdb:sdad|select * from asdsadsad
# screenshot
GET https://httpbin.org/uuid?q={{binUrl}}
HTTP 200
[Asserts]
status == 200
