# Fetch Plotly master datasets to $HOME.
apt-get install unzip
cd && curl https://codeload.github.com/plotly/datasets/zip/master >| plotly_datasets.zip

# unzip datasets:
unzip plotly_datasets.zip
mv datasets-master /plotly_datasets

# Strip header line from test csv:
sed -i -e "1d" /plotly_datasets/2010_alcohol_consumption_by_country.csv

# create table
spark-submit /bin/create_hive_tables.py
