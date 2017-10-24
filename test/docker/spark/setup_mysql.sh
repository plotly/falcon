sudo apt-get update
export DEBIAN_FRONTEND=noninteractive
apt-get -y install mysql-server mysql-client libmysql-java

ln -s /usr/share/java/mysql.jar $HIVE_HOME/lib;
service mysql restart
mysql -e'CREATE DATABASE hive;'
mysql -e'use hive;'
# mysql -e'SOURCE $HIVE_HOME/scripts/metastore/upgrade/mysql/hive-schema-2.2.0.mysql.sql;'
mysql -e'GRANT ALL PRIVILEGES ON *.* TO hive@"%" IDENTIFIED BY "hive"; flush privileges;';
mysql -e'GRANT ALL PRIVILEGES ON *.* TO hive@"localhost" IDENTIFIED BY "hive"; flush privileges;';
# Fix any conflicting host tables:
mysql -e'use mysql; repair table host use_frm;';
service mysql restart
/hive/bin/schematool -dbType mysql -initSchema -verbose;
