#!/bin/bash
DIR1=$(dirname "$0")

FQDN=$1

# make directories to work from
mkdir -p "$DIR1"/certs/{server,client,ca,tmp}

# Create your very own Root Certificate Authority
openssl genrsa \
  -out "$DIR1"/certs/ca/my-root-ca.key.pem \
  2048

# Self-sign your Root Certificate Authority
openssl req \
  -x509 \
  -new \
  -nodes \
  -key "$DIR1"/certs/ca/my-root-ca.key.pem \
  -days 1024 \
  -out "$DIR1"/certs/ca/my-root-ca.crt.pem \
  -subj "/C=US/ST=Utah/L=Montreal/O=Plotly/CN=connector.plot.ly"

# Create a Device Certificate
# NOTE: You MUST match CN to the domain name or ip address you want to use
openssl genrsa \
  -out "$DIR1"/certs/server/privkey.pem \
  4096

# Create a request from your Device, which your Root CA will sign
# http://security.stackexchange.com/questions/65271/can-a-csr-be-created-in-openssl-with-sha2
openssl req -new \
  -key "$DIR1"/certs/server/privkey.pem \
  -out "$DIR1"/certs/tmp/csr.pem \
  -new \
  -sha256 \
  -subj "/C=US/ST=Utah/L=Montreal/O=Plotly/CN=connector.plot.ly"

# Sign the request from Device with your Root CA
openssl x509 \
  -sha256 \
  -req -in "$DIR1"/certs/tmp/csr.pem \
  -CA "$DIR1"/certs/ca/my-root-ca.crt.pem \
  -CAkey "$DIR1"/certs/ca/my-root-ca.key.pem \
  -CAcreateserial \
  -out "$DIR1"/certs/server/cert.pem \
  -days 500

# Create a public key
openssl rsa \
  -in "$DIR1"/certs/server/privkey.pem \
  -pubout -out $DIR1certs/client/pubkey.pem

# Put things in their proper place
rsync -a "$DIR1"/certs/ca/my-root-ca.crt.pem "$DIR1"/certs/server/chain.pem
rsync -a "$DIR1"/certs/ca/my-root-ca.crt.pem "$DIR1"/certs/client/chain.pem
cat "$DIR1"/certs/server/cert.pem "$DIR1"/certs/server/chain.pem > "$DIR1"/certs/server/fullchain.pem
