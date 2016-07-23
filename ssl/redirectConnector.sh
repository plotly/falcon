echo "10.0.0.1\tconnector.plotly.com" >> /etc/hosts
ifconfig lo0 10.0.0.1 alias
echo "rdr pass on lo0 inet proto tcp from any to 10.0.0.1 port 80 -> 127.0.0.1 port 3000" | pfctl -ef -
