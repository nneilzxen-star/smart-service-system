const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, 'backend', '.env');
const examplePath = path.join(root, 'backend', '.env.example');

if (!fs.existsSync(envPath)) {
  fs.copyFileSync(examplePath, envPath);
  console.log('Created backend/.env from the project defaults.');
} else {
  console.log('Kept the existing backend/.env unchanged.');
}

const current = fs.readFileSync(envPath, 'utf8');
const placeholder = 'replace_with_a_unique_random_secret_of_at_least_32_chars';
if (current.includes(placeholder)) {
  fs.writeFileSync(envPath, current.replace(placeholder, crypto.randomBytes(48).toString('hex')));
  console.log('Generated a private JWT signing secret in backend/.env.');
}
