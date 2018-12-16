
# Install pip and python dependencies to build livy:
curl https://repos.fedorapeople.org/repos/dchen/apache-maven/epel-apache-maven.repo >| /etc/yum.repos.d/epel-apache-maven.repo
sed -i s/\$releasever/6/g /etc/yum.repos.d/epel-apache-maven.repo
yum -y install ant asciidoc apache-maven cyrus-sasl-devel cyrus-sasl-gssapi cyrus-sasl-plain gcc gcc-c++ git krb5-devel libffi-devel libxml2-devel libxslt-devel make mysql mysql-devel openldap-devel python-devel python-setuptools python-pip python-wheel sqlite-devel gmp-devel

# Upgrade pip:
pip install -U pip wheel setuptools
pip install -r /requirements.txt

# Get livy:
git clone https://github.com/cloudera/livy.git
cd livy
export MAVEN_OPTS="-Xmx512m -XX:MaxPermSize=128m"
mvn -DskipTests clean package

# Setup livy logging directory
mkdir -p /livy/logs
