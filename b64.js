const fs = require('fs');
const path = require('path');

const files = [
    'c:/Users/shyam.BATCONSOLE/Desktop/Antigravity/details/six_api_creds/CH56655-api2026hack38/signed-certificate.pem',
    'c:/Users/shyam.BATCONSOLE/Desktop/Antigravity/details/six_api_creds/CH56655-api2026hack38/private-key.pem',
    'c:/Users/shyam.BATCONSOLE/Desktop/Antigravity/details/six_api_creds/six_server_ca.pem'
];

files.forEach(f => {
    if (fs.existsSync(f)) {
        console.log(`\n### ${path.basename(f)}`);
        console.log(fs.readFileSync(f).toString('base64'));
    } else {
        console.log(`\n### MISSING: ${f}`);
    }
});
