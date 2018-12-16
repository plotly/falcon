apt-get update
apt-get install --assume-yes software-properties-common python-software-properties git
add-apt-repository ppa:webupd8team/java -y
apt-get update

echo debconf shared/accepted-oracle-license-v1-1 select true | sudo debconf-set-selections
echo debconf shared/accepted-oracle-license-v1-1 seen true | sudo debconf-set-selections
sudo apt-get install --assume-yes oracle-java8-installer
export JAVA_HOME=/usr/lib/jvm/java-8-oracle
