# Edge case: Entry with skip marker (should still execute DB queries, but skip output)
# skip
# title:Edge-Skip-With-DB
# pre-output:testdb:sdad|SELECT 'skip-pre' as test_value
# post-output:testdb:sdad|SELECT 'skip-post' as test_value
GET https://httpbin.org/status/204

HTTP 204
