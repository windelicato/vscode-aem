#!/usr/bin/env node
// run-aem-helper.js
const { AemMavenHelper } = require('./dist/aem/maven/helper'); // Updated path for new structure
const path = require('path');

// Usage: node run-aem-helper.js "<input>" [cwd] [--skip-tests] [--dry-run]
const input = process.argv[2] || '';
const cwd = process.argv[3] || process.cwd();
const extraFlags = process.argv.slice(4);

// Allow CLI overrides for skipTests and dryRun
let skipTests = false;
let dryRun = false;
if (extraFlags.includes('--skip-tests')) { skipTests = true; }
if (extraFlags.includes('--dry-run')) { dryRun = true; }

const { command, directory, error } = AemMavenHelper.buildCommand({
  cwd,
  input,
  opts: { skipTests, dryRun }
});

if (error) {
  console.error('Error:', error);
  process.exit(1);
}
console.log('Directory:', directory);
console.log('Command:', command);
