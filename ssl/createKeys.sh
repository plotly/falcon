#!/bin/bash
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
  -subj "/C=US/ST=Utah/L=Leivi/O=DigiCert/CN=connector.plot.ly"

# Create a Device Certificate
# NOTE: You MUST match CN to the domain name or ip address you want to use
openssl genrsa \
  -out ./ssl/certs/server/privkey.pem \
  2048

# Create a request from your Device, which your Root CA will sign
openssl req -new \
  -key ./ssl/certs/server/privkey.pem \
  -out ./ssl/certs/tmp/csr.pem \
  -subj "/C=US/ST=Utah/L=Leivi/O=DigiCert/CN=connector.plot.ly"

# Sign the request from Device with your Root CA
openssl x509 \
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

# # Generate a private key
# openssl genrsa -des3 -out ./ssl/certs/server/server.key.pem 1024
#
# # Generate a CSR
# openssl req -new \
#   -key ./ssl/certs/server/server.key.pem \
#   -out ./ssl/certs/server/server.csr.pem \
#   -subj "/C=US/ST=Utah/L=Leivi/O=DigiCert/CN=connector.plot.ly"
#
# # Remove Passphrase from key
# cp ./ssl/certs/server/server.key.pem ./ssl/certs/server/server.key.org.pem openssl rsa -in ./ssl/certs/server/server.key.org.pem -out ./ssl/certs/server/server.key.pem
#
# Generate self signed certificate
# openssl x509 -req -days 365 -in ./ssl/certs/server/server.csr.pem -signkey ./ssl/certs/server/server.key.pem -out ./ssl/certs/server/server.crt.pem
