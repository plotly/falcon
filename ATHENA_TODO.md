1. Remove file before merging back into Master
2. Clean up ES Lint
3. Send in bad credentials
4. Send in bad SQL Query
8. Do we want test information
9. Timeout issue.  
10.  Make timeout in seconds.  * 1000 to be milliseconds

Sample Query

SELECT count(serialnumber) as count, company FROM clean_logs where serialnumber != '' group by company  LIMIT 1000