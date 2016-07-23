# make directories to work from
mkdir -p ssl/certs/{server,client,ca}

# Create a personal key
openssl genrsa \
  -out ssl/certs/server/privkey.pem \
  2048

# Create a csr
openssl req -new \
  -key ssl/certs/server/privkey.pem \
  -out ssl/certs/server/csr.pem \
  -subj "/C=US/ST=Utah/L=Lehi/O=Plotly Inc/CN=connector.plotly.com" #DigiCert's location
