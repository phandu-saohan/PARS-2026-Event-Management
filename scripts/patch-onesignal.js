import fs from 'fs/promises';
import path from 'path';

async function main() {
  const url = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js';
  console.log(`Fetching ${url}...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }
  let code = await response.text();
  
  console.log(`Original code size: ${code.length} bytes`);
  
  // We replace the setTimeout wrapper around the message listener registrations
  // Original is: setTimeout(()=>{Ct.F() ... await Kt(t.notification)}),0)
  // We will convert it to an IIFE: (()=>{Ct.F() ... await Kt(t.notification)})()
  
  const targetStart = 'setTimeout(()=>{Ct.F()';
  const replacementStart = '(()=>{Ct.F()';
  
  if (!code.includes(targetStart)) {
    throw new Error(`Could not find target start: "${targetStart}"`);
  }
  
  code = code.replace(targetStart, replacementStart);
  
  const targetEnd = 'await Kt(t.notification)})},0)';
  const replacementEnd = 'await Kt(t.notification)})})()';
  
  if (!code.includes(targetEnd)) {
    throw new Error(`Could not find target end: "${targetEnd}"`);
  }
  
  code = code.replace(targetEnd, replacementEnd);
  
  const outputPath = path.join(process.cwd(), 'public', 'OneSignalSDK.sw.js');
  await fs.writeFile(outputPath, code, 'utf-8');
  console.log(`Successfully wrote patched file to ${outputPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
