/**
 * Quick test: verify QR generation logic
 * Run: node test-qr.mjs
 */

import QRCode from 'qrcode';

// Simulate demo business
const demo = {
  id: 'biz-1',
  name: 'בית קפה לינה',
};

// Each business gets a unique URL
const url = `http://localhost:3000/join/${demo.id}`;
console.log('✓ Business ID:', demo.id);
console.log('✓ Business Name:', demo.name);
console.log('✓ Unique Join URL:', url);

// Generate QR code
QRCode.toDataURL(url, { width: 600, margin: 2 })
  .then(dataUrl => {
    console.log('✓ QR Code generated successfully');
    console.log('✓ Data URL length:', dataUrl.length, 'chars');
    console.log('\n✅ QR GENERATION WORKS\n');
    console.log('Each business gets a unique URL:');
    console.log(`  - Café Lina: http://localhost:3000/join/biz-1`);
    console.log(`  - New Business: http://localhost:3000/join/id-101`);
    console.log(`  - etc...\n`);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ QR generation failed:', err);
    process.exit(1);
  });
