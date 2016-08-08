#!/bin/bash
echo "this is the script"
FQDN=$1

# make directories to work from
mkdir -p ./ssl/certs/{server,client,ca,tmp}

# Create your very own Root Certificate Authority
openssl genrsa \
  -out ./ssl/certs/ca/my-root-ca.key.pem \
  2048

# Self-sign your Root Certificate Authority
openssl req \
  -x509 \
  -new \
  -nodes \
  -key ./ssl/certs/ca/my-root-ca.key.pem \
  -days 1024 \
  -out ./ssl/certs/ca/my-root-ca.crt.pem \
  -subj "/C=US/ST=Utah/L=Montreal/O=Plotly/CN=connector.plot.ly"

# Create a Device Certificate
# NOTE: You MUST match CN to the domain name or ip address you want to use
openssl genrsa \
  -out ./ssl/certs/server/privkey.pem \
  4096

# Create a request from your Device, which your Root CA will sign
# http://security.stackexchange.com/questions/65271/can-a-csr-be-created-in-openssl-with-sha2
openssl req -new \
  -key ./ssl/certs/server/privkey.pem \
  -out ./ssl/certs/tmp/csr.pem \
  -new \
  -sha256 \
  -subj "/C=US/ST=Utah/L=Montreal/O=Plotly/CN=connector.plot.ly"

# Sign the request from Device with your Root CA
openssl x509 \
  -sha256 \
  -req -in ./ssl/certs/tmp/csr.pem \
  -CA ./ssl/certs/ca/my-root-ca.crt.pem \
  -CAkey ./ssl/certs/ca/my-root-ca.key.pem \
  -CAcreateserial \
  -out ./ssl/certs/server/cert.pem \
  -days 500

# Create a public key
openssl rsa \
  -in ./ssl/certs/server/privkey.pem \
  -pubout -out ./ssl/certs/client/pubkey.pem

# Put things in their proper place
rsync -a ./ssl/certs/ca/my-root-ca.crt.pem ./ssl/certs/server/chain.pem
rsync -a ./ssl/certs/ca/my-root-ca.crt.pem ./ssl/certs/client/chain.pem
cat ./ssl/certs/server/cert.pem ./ssl/certs/server/chain.pem > ./ssl/certs/server/fullchain.pem
