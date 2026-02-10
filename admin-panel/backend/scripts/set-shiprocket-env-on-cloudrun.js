#!/usr/bin/env node
/**
 * Reads SHIPROCKET_* from backend .env and sets them on Cloud Run via --env-vars-file.
 * Writes YAML so special characters in the password are preserved.
 * Run from admin-panel/backend: node scripts/set-shiprocket-env-on-cloudrun.js
 * Requires: gcloud CLI installed and authenticated.
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const backendDir = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(backendDir, '.env') });

const email = (process.env.SHIPROCKET_EMAIL || process.env.SHIPROCKET_USERNAME || '').trim();
const password = (process.env.SHIPROCKET_PASSWORD || '').trim();
const pickup = (process.env.SHIPROCKET_PICKUP_LOCATION || 'warehouse').trim();

if (!email || !password) {
  console.error('Missing credentials in .env:');
  console.error('  SHIPROCKET_EMAIL (or SHIPROCKET_USERNAME):', email ? 'set' : 'missing');
  console.error('  SHIPROCKET_PASSWORD:', password ? 'set' : 'missing');
  process.exit(1);
}

// YAML format required by gcloud --env-vars-file. Double-quote values so $^%! etc. are literal.
function yamlEscape(s) {
  const str = String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${str}"`;
}

const yaml = [
  `SHIPROCKET_EMAIL: ${yamlEscape(email)}`,
  `SHIPROCKET_PASSWORD: ${yamlEscape(password)}`,
  `SHIPROCKET_PICKUP_LOCATION: ${yamlEscape(pickup)}`,
].join('\n');

const envFile = path.join(backendDir, '.env.cloudrun-shiprocket.yaml');
const serviceName = 'admin-panel-backend';
const region = 'us-central1';

try {
  fs.writeFileSync(envFile, yaml, 'utf8');
  console.log('Setting Shiprocket credentials on Cloud Run from .env (via YAML file)...');
  console.log('  Service:', serviceName);
  console.log('  Region:', region);
  console.log('  SHIPROCKET_EMAIL:', email.substring(0, 5) + '...');
  console.log('');

  execSync(
    `gcloud run services update ${serviceName} --region ${region} --env-vars-file "${envFile}"`,
    { stdio: 'inherit', shell: true }
  );

  console.log('');
  console.log('Done. Wait a few seconds, then try "Create Shiprocket Order" on the live admin panel.');
} catch (e) {
  process.exit(e.status || 1);
} finally {
  try {
    fs.unlinkSync(envFile);
  } catch (_) {}
}
