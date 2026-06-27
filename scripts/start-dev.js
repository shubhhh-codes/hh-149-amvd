const { spawn } = require('child_process');
const os = require('os');

// Find the local network IP address
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '0.0.0.0';
}

const ip = getLocalIp();

// Spawn the next dev process
const child = spawn('npx', ['next', 'dev', '-H', '0.0.0.0'], {
  stdio: ['inherit', 'pipe', 'inherit'], // Pipe stdout so we can intercept it
  shell: true,
  env: { ...process.env, FORCE_COLOR: '1' } // Preserve console colors
});

child.stdout.on('data', (data) => {
  let output = data.toString();
  // Replace the misleading 0.0.0.0 with the actual IP address
  output = output.replace(/http:\/\/0\.0\.0\.0:/g, `http://${ip}:`);
  process.stdout.write(output);
});

// Automatically forward port 3000 to connected USB devices for local testing
const { exec } = require('child_process');
const adbPath = require('fs').existsSync('C:\\adb\\platform-tools\\adb.exe') 
  ? 'C:\\adb\\platform-tools\\adb.exe' 
  : 'adb';

exec(`${adbPath} reverse tcp:3000 tcp:3000`, (error, stdout, stderr) => {
  if (!error) {
    console.log('\n📱 USB Debugging: Port 3000 successfully forwarded to Android device! (http://localhost:3000)\n');
  }
});

child.on('close', (code) => {
  process.exit(code);
});
