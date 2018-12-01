# Additional Resources
The following is a link to AWS Athena documentation on setting up an athena table and database

[AWS Athean](https://docs.aws.amazon.com/athena/latest/ug/getting-started.html)

In addition, there is a live tutorial built into the AWS Athena Console that provides
step by step instructions with pictures on how to create a database and table (including 
sample data)

# Setup
The following is the high level instructions for setting up an Athena Database and Table.

## Requirements:
1. A valid AWS Account and access to the AWS Console
2. Experience working within the AWS Console
3. Experience creating S3 Buckets and pushing content to it
4. Experience with AWS IAMs for creating users and roles


## Instructions:
1. If you don't already have an S3 bucket create an S3 bucket and copy the athena-sample.csv to it
2. In the AWS Console Select Athena Service
3. If this is your first time create a database with Athena click on Getting Started
4. Click on Create Table
5. It will give you the option for Automatically (with Glue) or Manually.  Choose Manually
6. For Database choose Create a new database
7. Enter in Database Name, Tablet Name,  and the S3 Location where you uploaded the CSV file and then Next
8. Choose CSV for the option and Click on Next
9. Add the following 4 columns with the following information and then click on Next:
i. location - string
ii. alcohol - double,
10. Skip adding Partitions and click on Create Table
11. It will generate Create External Skip (see sample below).  Click on Run Query (this will create table)

```sql
CREATE EXTERNAL TABLE IF NOT EXISTS alcohol_consumption_by_country_2010 (
  `location` string,
  `alcohol` double, 
)
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe'
WITH SERDEPROPERTIES (
  'serialization.format' = ',',
  'field.delim' = ','
) LOCATION 's3://plot.ly-athena/test-csv/'
TBLPROPERTIES ('has_encrypted_data'='false');
```
12. Run sample SQL to see the results ( select * from alcohol_consumption_by_country_2010 ) and it should return sample data