#!/bin/bash
set -e

clickhouse-server --config-file=/etc/clickhouse-server/config.xml &

# Wait for ClickHouse server to be ready
until $(curl --output /dev/null --silent --head --fail http://localhost:8123); do
  echo -e -n '.'
  sleep 2.5
done

clickhouse-client --query="CREATE DATABASE plotly";

clickhouse-client --database=plotly --query="CREATE TABLE consumption (location String, alcohol Float32) ENGINE = Memory";

cat /2010_alcohol_consumption_by_country.csv | clickhouse-client --database=plotly --query="INSERT INTO consumption FORMAT CSV";

# Keep ClickHouse server alive
while true
do
	sleep 30
done
