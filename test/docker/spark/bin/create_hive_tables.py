import sys
from pyspark import SparkContext, SparkConf, HiveContext, SQLContext

if __name__ == '__main__':
    conf = SparkConf().setAppName("Plotly Exports")
    sc = SparkContext(conf=conf)
    hive_context = HiveContext(sc)
    print '=== Creating Database ==='
    hive_context.sql('CREATE DATABASE PLOTLY')
    hive_context.sql('USE PLOTLY')

    print '=== Creating Table ==='
    hive_context.sql("CREATE TABLE ALCOHOL_CONSUMPTION_BY_COUNTRY_2010 "
                     "(LOCATION STRING, ALCOHOL DOUBLE) ROW FORMAT "
                     "DELIMITED FIELDS TERMINATED BY ',' "
                     "TBLPROPERTIES (\"skip.header.line.count\"=\"1\")")
    print "=== loading data into table ==="
    hive_context.sql("LOAD DATA LOCAL INPATH "
                     "'/plotly_datasets/2010_alcohol_consumption_by_country.csv' "
                     "OVERWRITE INTO TABLE ALCOHOL_CONSUMPTION_BY_COUNTRY_2010")
    sys.exit()
