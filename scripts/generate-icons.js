import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, r, g, b, isMaskable = false) {
  // Simple PNG generator with solid color and subtle inner emblem
  const rowBytes = width * 4 + 1; // +1 filter byte per row
  const rawData = Buffer.alloc(rowBytes * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = isMaskable ? width * 0.35 : width * 0.42;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Check if inside circle
      if (dist < radius) {
        // Deep blue inner background with gold/orange accent symbol
        const isInnerRing = Math.abs(dist - radius * 0.7) < width * 0.05;
        const isLetter = Math.abs(dx) < width * 0.08 && Math.abs(dy) < height * 0.25;
        const isLetterCross = Math.abs(dy) < height * 0.06 && Math.abs(dx) < width * 0.18;

        if (isLetter || isLetterCross || isInnerRing) {
          // Warm Orange accent (#ea580c)
          rawData[pxOffset] = 234;
          rawData[pxOffset + 1] = 88;
          rawData[pxOffset + 2] = 12;
          rawData[pxOffset + 3] = 255;
        } else {
          // Deep Blue / Navy (#0f172a)
          rawData[pxOffset] = 15;
          rawData[pxOffset + 1] = 23;
          rawData[pxOffset + 2] = 42;
          rawData[pxOffset + 3] = 255;
        }
      } else {
        if (isMaskable) {
          // Full-bleed background for maskable
          rawData[pxOffset] = 15;
          rawData[pxOffset + 1] = 23;
          rawData[pxOffset + 2] = 42;
          rawData[pxOffset + 3] = 255;
        } else {
          // Transparent outside circle
          rawData[pxOffset] = 0;
          rawData[pxOffset + 1] = 0;
          rawData[pxOffset + 2] = 0;
          rawData[pxOffset + 3] = 0;
        }
      }
    }
  }

  // Deflate compressed data
  const compressed = zlib.deflateSync(rawData);

  // Helper for CRC32
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // Color type: RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT chunk
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate PWA icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, 15, 23, 42, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, 15, 23, 42, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, 15, 23, 42, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, 15, 23, 42, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPNG(48, 48, 15, 23, 42, false));

// Also generate icon.svg
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="128" fill="#0f172a" />
  <circle cx="256" cy="256" r="180" stroke="#ea580c" stroke-width="24" stroke-dasharray="8 8" />
  <path d="M210 160H302M256 160V352M210 352H302" stroke="#ea580c" stroke-width="36" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="256" cy="110" r="14" fill="#38bdf8" />
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svg);

console.log('Successfully generated all PWA icons & icon.svg in /public');
