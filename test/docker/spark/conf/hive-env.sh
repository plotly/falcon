# Thanks to https://community.hortonworks.com/questions/9079/remote-debug-hiveserver2.html
# Enable remote debugging of hiveserver2.
if [ "$SERVICE" = "hiveserver2" ]; then
  export HADOOP_OPTS="$HADOOP_OPTS -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=8001"
fi

