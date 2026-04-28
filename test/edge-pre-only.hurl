# Edge case: Entry with ONLY pre-output (no post-output)
# title:Edge-Pre-Only
# pre-output:testdb:sdad|SELECT 'pre-only' as test_value
GET https://httpbin.org/get

HTTP 200
[Asserts]
status == 200
