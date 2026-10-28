import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, r, g, b, a = 255) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(6, 9); // RGBA color type
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Scanlines with blue/indigo gradient and smartphone frame
  const scanlines = [];
  for (let y = 0; y < height; y++) {
    scanlines.push(0); // filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const cx = x - width / 2;
      const cy = y - height / 2;
      const dist = Math.sqrt(cx * cx + cy * cy);
      const isCenter = dist < width * 0.35;
      
      if (isCenter) {
        // Vibrant blue/purple gradient
        const t = (x + y) / (width + height);
        scanlines.push(Math.floor(59 * (1 - t) + 139 * t)); // R
        scanlines.push(Math.floor(130 * (1 - t) + 92 * t)); // G
        scanlines.push(Math.floor(246 * (1 - t) + 246 * t)); // B
        scanlines.push(255); // Alpha
      } else {
        // Dark background plate
        scanlines.push(24);
        scanlines.push(24);
        scanlines.push(27);
        scanlines.push(255);
      }
    }
  }

  const rawBuffer = Buffer.from(scanlines);
  const compressedData = zlib.deflateSync(rawBuffer);
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeInt32BE(crc, 8 + len);
  return chunk;
}

// Simple CRC32 implementation
function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }

  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return crc ^ -1;
}

const iconsDir = path.resolve(process.cwd(), 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

fs.writeFileSync(path.join(iconsDir, 'icon16.png'), createPNG(16, 16));
fs.writeFileSync(path.join(iconsDir, 'icon32.png'), createPNG(32, 32));
fs.writeFileSync(path.join(iconsDir, 'icon48.png'), createPNG(48, 48));
fs.writeFileSync(path.join(iconsDir, 'icon128.png'), createPNG(128, 128));

console.log('Generated extension icons: 16x16, 32x32, 48x48, 128x128 in icons/');
