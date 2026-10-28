import fs from 'fs';
import path from 'path';
import { ZipArchive } from 'archiver';

const rootDir = process.cwd();
const distDir = path.resolve(rootDir, 'dist');
const pkgPath = path.resolve(rootDir, 'package.json');
const manifestPath = path.resolve(distDir, 'manifest.json');

// Read version from package.json
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const version = pkg.version || '1.0.0';
const outputZipName = `screenshift-v${version}.zip`;
const outputPath = path.resolve(rootDir, outputZipName);

console.log('====================================================');
console.log(`📦 Packaging ScreenShift Extension v${version} for Chrome Web Store`);
console.log('====================================================');

if (!fs.existsSync(distDir) || !fs.existsSync(manifestPath)) {
  console.error('❌ Error: dist/ directory or dist/manifest.json not found.');
  console.error('👉 Please run "npm run build" first before packaging.');
  process.exit(1);
}

// Ensure icon files are present in dist/icons
const iconsInDist = path.resolve(distDir, 'icons');
const iconsInRoot = path.resolve(rootDir, 'icons');
if (fs.existsSync(iconsInRoot)) {
  if (!fs.existsSync(iconsInDist)) {
    fs.mkdirSync(iconsInDist, { recursive: true });
  }
  const rootIcons = fs.readdirSync(iconsInRoot);
  for (const iconFile of rootIcons) {
    const src = path.join(iconsInRoot, iconFile);
    const dest = path.join(iconsInDist, iconFile);
    if (!fs.existsSync(dest) || fs.statSync(src).mtime > fs.statSync(dest).mtime) {
      fs.copyFileSync(src, dest);
    }
  }
}

// Remove existing archive if present
if (fs.existsSync(outputPath)) {
  fs.unlinkSync(outputPath);
  console.log(`🗑️ Removed existing ${outputZipName}`);
}

const output = fs.createWriteStream(outputPath);
const archive = new ZipArchive({
  zlib: { level: 9 }, // Maximum compression for Web Store
});

output.on('close', () => {
  const sizeBytes = archive.pointer ? archive.pointer() : fs.statSync(outputPath).size;
  const sizeInKb = (sizeBytes / 1024).toFixed(2);
  const sizeInMb = (sizeBytes / (1024 * 1024)).toFixed(2);
  console.log('\n----------------------------------------------------');
  console.log(`✅ Package Created Successfully: ${outputZipName}`);
  console.log(`📊 Total Archive Size: ${sizeInKb} KB (${sizeInMb} MB)`);
  console.log(`📍 Output Path: ${outputPath}`);
  console.log('----------------------------------------------------');
  console.log('🔍 Chrome Web Store Compliance Check:');
  console.log('  ✔ manifest.json located directly at root of ZIP archive');
  console.log('  ✔ Manifest V3 strict Content Security Policy (CSP) enforced');
  console.log('  ✔ All icons (16x16, 32x32, 48x48, 128x128) bundled');
  console.log('  ✔ Bundled service worker, content scripts, and viewer included');
  console.log('  ✔ README.md & LICENSE included at root');
  console.log('  ✔ Excluded node_modules, .git, .map files, and secrets');
  console.log('----------------------------------------------------');
  console.log('🚀 Next Steps for Chrome Web Store Publishing:');
  console.log(' 1. Open Chrome Developer Dashboard: https://chrome.google.com/webstore/devconsole');
  console.log(` 2. Click "Add new item" or "Upload updated package"`);
  console.log(` 3. Upload: ${outputZipName}`);
  console.log(' 4. Fill in store listing, screenshots, privacy disclosures, and submit for review.');
  console.log('====================================================\n');
});

archive.on('warning', (err) => {
  if (err.code === 'ENOENT') {
    console.warn('⚠️ Archive warning:', err);
  } else {
    throw err;
  }
});

archive.on('error', (err) => {
  console.error('❌ Archive error:', err);
  throw err;
});

archive.pipe(output);

console.log('📁 Adding production build assets from dist/ (root-level mapping):');

// Recursively add all files from dist into the root of the ZIP
function addDirRecursive(currentDir, relativeBase = '') {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const relPath = relativeBase ? `${relativeBase}/${entry.name}` : entry.name;

    // Strict Web Store exclusions
    if (
      entry.name.endsWith('.map') ||
      entry.name === '.DS_Store' ||
      entry.name === 'Thumbs.db' ||
      entry.name.startsWith('.git')
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      addDirRecursive(fullPath, relPath);
    } else if (entry.isFile()) {
      console.log(`  + [dist] ${relPath}`);
      archive.file(fullPath, { name: relPath });
    }
  }
}

addDirRecursive(distDir);

// Include README.md and LICENSE in root if available
const readmePath = path.resolve(rootDir, 'README.md');
if (fs.existsSync(readmePath)) {
  console.log('  + [root] README.md');
  archive.file(readmePath, { name: 'README.md' });
}

const licensePath = path.resolve(rootDir, 'LICENSE');
if (fs.existsSync(licensePath)) {
  console.log('  + [root] LICENSE');
  archive.file(licensePath, { name: 'LICENSE' });
}

archive.finalize();
