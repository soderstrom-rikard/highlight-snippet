#!/usr/bin/env bash

## key and cert from node-forge by server.js
nodejs server-keys.js --self-tests

## cert from openssl
server_serial="0x$(openssl x509 -noout -serial -in rsa-cert2.pem | cut -d '=' -f2)"
openssl req -new                                                                        \
            -x509                                                                       \
            -config openssl-root-ca.config                                              \
            -subj '/C=SE/ST=Vaesternorrland/L=Timraa/O=Min\ faergade\ kod/CN=localhost' \
            -set_serial ${server_serial}                                                \
            -days 366                                                                   \
            -key rsa-key.pem                                                            \
            -out rsa-cert.pem

openssl x509 -text -noout -in rsa-cert.pem > rsa-cert.pem.txt
openssl asn1parse -in rsa-cert.pem -inform pem -i >> rsa-cert.pem.txt

## txt from node-forge by server.js
openssl x509 -text -noout -in rsa-cert2.pem > rsa-cert2.pem.txt
openssl asn1parse -in rsa-cert2.pem -inform pem -i >> rsa-cert2.pem.txt

## compare
diff -u rsa-cert{,2}.pem.txt || differs=$?

if [[ ${differs} -eq 0 ]]
then
    echo "=== successfully verified ==="
else
    echo "=== failed to verify ==="
fi
