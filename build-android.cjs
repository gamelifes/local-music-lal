#!/usr/bin/env node
/**
 * build-android.js — replaces `cap sync`
 * Copies dist/ to Android assets/ (root, not public/)
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'dist');
const destDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'assets');

function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  for (const entry of fs.readdirSync(src, { withDirents: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (!fs.existsSync(srcDir)) {
  console.error('dist/ not found. Run "npm run build" first.');
  process.exit(1);
}

if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true });
}

copyDirSync(srcDir, destDir);
console.log('Copied dist/ -> ' + destDir);
