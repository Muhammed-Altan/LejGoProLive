// Lightweight test script for /api/availability
// Usage: node scripts/test-availability.js "2025-10-25" "2025-10-28"
const fetch = require('node-fetch');

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node scripts/test-availability.js <startDate> <endDate>');
    process.exit(1);
  }
  const [startDate, endDate] = args;
  const url = `http://localhost:3000/api/availability?startDate=${encodeURIComponent(new Date(startDate).toISOString())}&endDate=${encodeURIComponent(new Date(endDate).toISOString())}`;
  console.log('Calling', url);
  try {
    const res = await fetch(url);
    const json = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Error calling availability endpoint:', err);
  }
}

main();
