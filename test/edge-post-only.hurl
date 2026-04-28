# Edge case: Entry with ONLY post-output (no pre-output)
# title:Edge-Post-Only
# post-output:testdb:sdad|SELECT 'post-only' as test_value
GET https://httpbin.org/get

HTTP 200
[Asserts]
status == 200
