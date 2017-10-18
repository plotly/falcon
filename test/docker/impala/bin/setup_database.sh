apt-get -y update;
apt-get -y install unzip curl;
cd / && curl https://codeload.github.com/plotly/datasets/zip/master >| plotly_datasets.zip

# unzip datasets:
unzip plotly_datasets.zip
mv datasets-master /plotly_datasets

# Strip header line from test csv:
sed -i -e "1d" /plotly_datasets/2010_alcohol_consumption_by_country.csv


# Upload to hdfs as 'impala' user
su - impala -c "hdfs dfs -put /plotly_datasets/2010_alcohol_consumption_by_country.csv /user/impala/2010_alcohol_consumption_by_country.csv"

impala-shell -f /bin/setup_test_db.sql

# To keep the container running:
while true
do
	sleep 30
	echo "Impala-test db is up and running."
done
