
1. Send in bad credentials.  Bad AWS Credentials.  Bad S3 Bucket.  Bad 
2. Send in bad SQL
3. What happens when query times out

10.  Make timeout in seconds.  * 1000 to be milliseconds

1. Remove file before merging back into Master
Sample Query

SELECT count(serialnumber) as count, company FROM clean_logs where serialnumber != '' group by company  LIMIT 1000