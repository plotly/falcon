import sys
from pyspark import SparkContext, SparkConf, HiveContext, SQLContext

if __name__ == '__main__':
    conf = SparkConf().setAppName("Plotly Exports")
    sc = HiveContext(conf=conf)
    hive_context = SQLContext(sc)
    print '=== Creating Database ==='
    hive_context.sql('CREATE DATABASE PLOTLY')
    hive_context.sql('USE PLOTLY')

    print '=== Creating Table ==='
    hive_context.sql("CREATE TABLE ALCOHOL "
                     "(LOCATION STRING, ALCOHOL FLOAT) ROW FORMAT "
                     "DELIMITED FIELDS TERMINATED BY ',' ")
    print "=== loading data into table ==="
    hive_context.sql("LOAD DATA LOCAL INPATH "
                     "'/plotly_datasets/2010_alcohol_consumption_by_country.csv' "
                     "OVERWRITE INTO TABLE ALCOHOL")
    sys.exit()
