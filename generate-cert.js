const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
  console.log("Checking for 'selfsigned' package...");
  try {
    require.resolve('selfsigned');
  } catch (e) {
    console.log("Installing 'selfsigned' package to generate SSL certificates...");
    try {
      execSync('npm install --no-save selfsigned', { stdio: 'inherit' });
    } catch (err) {
      console.error("Failed to install selfsigned package. Attempting to install globally or fallback...", err);
      execSync('npm install -g selfsigned', { stdio: 'inherit' });
    }
  }

  const selfsigned = require('selfsigned');
  const os = require('os');

  // Get local IPs
  const interfaces = os.networkInterfaces();
  const ips = ['localhost', '127.0.0.1'];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }

  console.log("Generating SSL certificate for IPs:", ips);

  const primaryIp = ips.find(ip => ip !== 'localhost' && ip !== '127.0.0.1') || 'localhost';
  const attrs = [{ name: 'commonName', value: primaryIp }];
  
  try {
    // Generate cert using await since it returns a Promise in selfsigned v2
    const pems = await selfsigned.generate(attrs, {
      keySize: 2048,
      days: 365,
      algorithm: 'sha256',
      extensions: [
        {
          name: 'subjectAltName',
          altNames: ips.map(ip => {
            const isIp = ip.match(/^\d+\.\d+\.\d+\.\d+$/);
            return isIp 
              ? { type: 7, ip: ip } 
              : { type: 2, value: ip };
          })
        }
      ]
    });

    fs.writeFileSync(path.join(__dirname, 'key.pem'), pems.private);
    fs.writeFileSync(path.join(__dirname, 'cert.pem'), pems.cert);
    console.log("SSL Certificates (key.pem and cert.pem) generated successfully!");
  } catch (err) {
    console.error("Failed to generate SSL certificate:", err);
  }
}

main();
