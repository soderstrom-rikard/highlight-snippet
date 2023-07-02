var forge = require('node-forge');

cert_dn = [{
    name: 'countryName',
    value: 'SE'
}, {
    shortName: 'ST',
    value: 'Vaesternorrland',
    valueTagClass: forge.asn1.Type.UTF8
}, {
    name: 'localityName',
    value: 'Timraa',
    valueTagClass: forge.asn1.Type.UTF8
}, {
    name: 'organizationName',
    value: 'Min faergade kod',
    valueTagClass: forge.asn1.Type.UTF8
}, {
    name: 'commonName',
    value: 'localhost',
    valueTagClass: forge.asn1.Type.UTF8
}];

createExtensions = (authorityKeyIdentifierInHex) => [{
    name: 'subjectKeyIdentifier'
}, {
    name: 'authorityKeyIdentifier',
    value: forge.asn1.create(
        forge.asn1.Class.UNIVERSAL,
        forge.asn1.Type.SEQUENCE,
        true,
        [
            forge.asn1.create(
                forge.asn1.Class.CONTEXT_SPECIFIC,
                forge.asn1.Type.NONE,
                false,
                authorityKeyIdentifierInHex)
        ])
}, {
    name: 'basicConstraints',
    cA: true,
    critical: true
}, {
    name: 'keyUsage',
    digitalSignature: true,
    keyEncipherment: true
}, {
    name: 'extKeyUsage',
    serverAuth: true,
    clientAuth: true
}];

function createCertificate(publicKey)
{
    // create a certification request (CSR)
    var cert = forge.pki.createCertificate();
    cert.publicKey = publicKey;
    cert.serialNumber = '00' + forge.util.bytesToHex(forge.random.getBytes(20))
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

    cert.setSubject(cert_dn);
    cert.setIssuer(cert_dn);

    //       0414 8456B680AF96EBE12FD65AF8123A230DD1739EEE:X509v3 Subject Key Identifier
    //  3016 8014 8456B680AF96EBE12FD65AF8123A230DD1739EEE:X509v3 Authority Key Identifier
    cert.setExtensions(createExtensions(cert.generateSubjectKeyIdentifier().bytes()));
    return cert;
}

async function create()
{
    // generate a key pair
    console.log("generating key pair, test mode", inTestMode);
    const rsa_keypair = await forge.pki.rsa.generateKeyPair(4096);
    cert = createCertificate(rsa_keypair.publicKey);
    cert.sign(rsa_keypair.privateKey, forge.md.sha256.create());

    // convert a Forge key and certificate to PEM
    const obj = {
        privateKey: forge.pki.privateKeyToPem(rsa_keypair.privateKey),
        x509Certificate: forge.pki.certificateToPem(cert)
    };

    if (inTestMode)
    {
        console.log("[test] extracting generated data to disk", rsa_keypair);
        var fs = require('fs');
        fs.writeFileSync('rsa-key.pem', obj.privateKey);
        fs.writeFileSync('rsa-cert2.pem', obj.x509Certificate);
    }

    return obj;
}

const inTestMode = -1 != process.argv.findIndex((elem) => { return '--self-tests' == elem });

if (inTestMode)
{
    create();
}

module.exports = {
    create
};
