# Install maven:
wget http://mirror.olnevhost.net/pub/apache/maven/binaries/apache-maven-3.2.1-bin.tar.gz
tar xvf apache-maven-3.2.1-bin.tar.gz
export M2=/apache-maven-3.2.1/bin
export PATH=$M2:$PATH


apt-get install --assume-yes python-dev python-setuptools python-pip python-wheel libkrb5-dev

# Upgrade pip:
pip install -U pip wheel setuptools
pip install -r /bin/livy_python_requirements.txt

# Get livy:
git clone https://github.com/cloudera/livy.git
cd livy
JAVA_HOME=/usr/lib/jvm/java-8-oracle/jre MAVEN_OPTS="-Xmx512m -XX:MaxPermSize=256m" /apache-maven-3.2.1/bin/mvn -DskipTests clean package

# Setup livy logging directory
mkdir -p /livy/logs;
