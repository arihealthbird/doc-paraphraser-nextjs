#!/usr/bin/env node

// Check if environment variables are properly configured

require('dotenv').config({ path: '.env.local' });

console.log('Environment Check:');
console.log('==================');

const checks = {
  'DATABASE_URL': process.env.DATABASE_URL,
  'OPENROUTER_API_KEY': process.env.OPENROUTER_API_KEY,
};

let allGood = true;

for (const [key, value] of Object.entries(checks)) {
  if (!value || value === 'your_openrouter_api_key_here') {
    console.log(`❌ ${key}: NOT SET or using placeholder`);
    allGood = false;
  } else {
    const preview = value.substring(0, 10) + '...';
    console.log(`✅ ${key}: ${preview}`);
  }
}

console.log('==================');
if (allGood) {
  console.log('✅ All environment variables are set!');
  process.exit(0);
} else {
  console.log('❌ Some environment variables are missing!');
  console.log('\nMake sure you have a .env.local file with:');
  console.log('DATABASE_URL=your_neon_database_url');
  console.log('OPENROUTER_API_KEY=your_actual_api_key');
  process.exit(1);
}
