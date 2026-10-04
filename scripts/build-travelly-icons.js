import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

function getTravellySvg({
  width = 512,
  height = 512,
  bgType = 'transparent', // 'transparent' | 'white-rounded' | 'white-full' | 'white-square'
  scale = 1.0,
}) {
  const rx = bgType === 'white-rounded' ? Math.round(512 * 0.22) : 0;
  const showBg = bgType !== 'transparent';

  // Base canvas 512x512
  const scaledTransform = scale !== 1.0
    ? `transform="translate(${256 * (1 - scale)}, ${256 * (1 - scale)}) scale(${scale})"`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${width}" height="${height}">
  <defs>
    <!-- Cyan to Deep Ocean Gradient for Compass Outer Ring -->
    <linearGradient id="compassRing" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0ea5e9" />
      <stop offset="35%" stop-color="#0284c7" />
      <stop offset="70%" stop-color="#0369a1" />
      <stop offset="100%" stop-color="#075985" />
    </linearGradient>

    <!-- Warm Amber to Bright Orange for Orbit Swoosh & Airplane -->
    <linearGradient id="swooshOrange" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ea580c" />
      <stop offset="30%" stop-color="#f97316" />
      <stop offset="70%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#fbbf24" />
    </linearGradient>

    <linearGradient id="needleGoldLight" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#fde047" />
    </linearGradient>

    <linearGradient id="needleGoldDark" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ea580c" />
      <stop offset="100%" stop-color="#f97316" />
    </linearGradient>

    <linearGradient id="needleBlueLight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>

    <linearGradient id="needleBlueDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0369a1" />
      <stop offset="100%" stop-color="#0c4a6e" />
    </linearGradient>
  </defs>

  ${showBg ? `<rect width="512" height="512" rx="${rx}" fill="#ffffff" />` : ''}

  <g id="travelly-symbol" ${scaledTransform}>
    <!-- Globe Grid Lines (Under Compass) -->
    <g opacity="0.85" stroke="#0ea5e9" stroke-width="3" fill="none">
      <path d="M 125,295 C 160,265 240,245 320,265 C 345,272 365,285 375,300" stroke-width="3" stroke-linecap="round" />
      <path d="M 155,360 C 190,340 250,335 315,355" stroke-width="2.5" stroke-linecap="round" />
      <path d="M 130,225 C 165,195 245,185 315,200" stroke-width="2.5" stroke-linecap="round" />
      <path d="M 235,140 C 175,200 175,320 235,405" stroke-width="2.5" />
      <path d="M 285,155 C 325,215 325,325 280,395" stroke-width="2.5" />
    </g>

    <!-- Compass Outer Ring & Dial -->
    <path d="M 235,130 A 145,145 0 0,0 95,275 A 145,145 0 0,0 230,420 A 145,145 0 0,0 375,325"
          fill="none" stroke="url(#compassRing)" stroke-width="24" stroke-linecap="round" />

    <path d="M 265,130 A 145,145 0 0,1 380,240"
          fill="none" stroke="url(#compassRing)" stroke-width="24" stroke-linecap="round" />

    <circle cx="238" cy="275" r="118" fill="none" stroke="#0284c7" stroke-width="4.5" opacity="0.6" />

    <!-- Dial Tick Marks -->
    <g stroke="#0369a1" stroke-width="3" stroke-linecap="round" opacity="0.8">
      <line x1="238" y1="135" x2="238" y2="150" />
      <line x1="238" y1="400" x2="238" y2="415" />
      <line x1="100" y1="275" x2="115" y2="275" />
      <line x1="360" y1="275" x2="375" y2="275" />
      <line x1="140" y1="177" x2="151" y2="188" />
      <line x1="140" y1="373" x2="151" y2="362" />
      <line x1="336" y1="373" x2="325" y2="362" />
    </g>

    <!-- Compass North "N" Indicator -->
    <text x="238" y="168" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          font-weight="900" font-size="28" fill="#0284c7" text-anchor="middle">N</text>

    <!-- Sweeping Orbital Path (Orange Swoosh) -->
    <path d="M 38,348 C 30,378 55,410 95,424 C 160,446 250,432 315,395 C 385,355 425,290 410,215 C 400,165 365,130 330,122 C 275,108 205,145 175,190 C 150,228 152,275 180,312 C 215,358 275,372 328,348 C 385,322 418,260 410,202"
          fill="none" stroke="url(#swooshOrange)" stroke-width="26" stroke-linecap="round" stroke-linejoin="round" />

    <path d="M 188,145 C 248,118 335,130 378,175 C 420,220 422,285 385,335 C 345,385 270,398 210,380"
          fill="none" stroke="#f59e0b" stroke-width="7" stroke-linecap="round" opacity="0.9" />

    <!-- Central 4-Faceted Compass Needle -->
    <g id="needle">
      <polygon points="238,275 220,260 308,198" fill="url(#needleGoldLight)" />
      <polygon points="238,275 256,290 308,198" fill="url(#needleGoldDark)" />

      <polygon points="238,275 220,260 168,352" fill="url(#needleBlueLight)" />
      <polygon points="238,275 256,290 168,352" fill="url(#needleBlueDark)" />

      <circle cx="238" cy="275" r="14" fill="#ffffff" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.15))" />
      <circle cx="238" cy="275" r="6" fill="#0284c7" />
    </g>

    <!-- Ascending Airplane (Top Right) -->
    <g transform="translate(425, 105) rotate(42) scale(1.15)" fill="url(#needleGoldDark)">
      <path d="M 0,-48 C 4,-48 8,-35 8,-10 L 8,30 L 3,42 L -3,42 L -8,30 L -8,-10 C -8,-35 -4,-48 0,-48 Z" />
      <path d="M 0,-12 L 46,14 L 46,22 L 8,15 L 8,30 L -8,30 L -8,15 L -46,22 L -46,14 Z" />
      <path d="M 0,28 L 18,39 L 18,44 L 4,40 L 0,42 L -4,40 L -18,44 L -18,39 Z" />
      <path d="M -3,-38 C -1,-40 1,-40 3,-38 L 4,-33 L -4,-33 Z" fill="#fde047" opacity="0.8" />
    </g>
  </g>
</svg>`;
}

// Full horizontal logo with Travelly typography for brand / header
function getTravellyHorizontalSvg(isDark = false) {
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subColor = isDark ? '#94a3b8' : '#64748b';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 90" width="380" height="90" fill="none">
  <!-- Symbol scaled and shifted to left -->
  <g transform="translate(-10, -10) scale(0.21)">
    <use href="#travelly-symbol" />
  </g>
  <!-- Re-inject symbol defs -->
  <defs>
    <linearGradient id="compassRing" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0ea5e9" />
      <stop offset="35%" stop-color="#0284c7" />
      <stop offset="70%" stop-color="#0369a1" />
      <stop offset="100%" stop-color="#075985" />
    </linearGradient>
    <linearGradient id="swooshOrange" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ea580c" />
      <stop offset="30%" stop-color="#f97316" />
      <stop offset="70%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#fbbf24" />
    </linearGradient>
    <linearGradient id="needleGoldLight" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#fde047" />
    </linearGradient>
    <linearGradient id="needleGoldDark" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ea580c" />
      <stop offset="100%" stop-color="#f97316" />
    </linearGradient>
    <linearGradient id="needleBlueLight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    <linearGradient id="needleBlueDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0369a1" />
      <stop offset="100%" stop-color="#0c4a6e" />
    </linearGradient>
  </defs>

  <g transform="translate(10, 8) scale(0.17)">
    <!-- Globe Grid Lines -->
    <g opacity="0.85" stroke="#0ea5e9" stroke-width="3" fill="none">
      <path d="M 125,295 C 160,265 240,245 320,265 C 345,272 365,285 375,300" stroke-width="3" stroke-linecap="round" />
      <path d="M 155,360 C 190,340 250,335 315,355" stroke-width="2.5" stroke-linecap="round" />
      <path d="M 130,225 C 165,195 245,185 315,200" stroke-width="2.5" stroke-linecap="round" />
      <path d="M 235,140 C 175,200 175,320 235,405" stroke-width="2.5" />
      <path d="M 285,155 C 325,215 325,325 280,395" stroke-width="2.5" />
    </g>
    <!-- Compass Track -->
    <path d="M 235,130 A 145,145 0 0,0 95,275 A 145,145 0 0,0 230,420 A 145,145 0 0,0 375,325" fill="none" stroke="url(#compassRing)" stroke-width="24" stroke-linecap="round" />
    <path d="M 265,130 A 145,145 0 0,1 380,240" fill="none" stroke="url(#compassRing)" stroke-width="24" stroke-linecap="round" />
    <circle cx="238" cy="275" r="118" fill="none" stroke="#0284c7" stroke-width="4.5" opacity="0.6" />
    <!-- Ticks -->
    <g stroke="#0369a1" stroke-width="3" stroke-linecap="round" opacity="0.8">
      <line x1="238" y1="135" x2="238" y2="150" /><line x1="238" y1="400" x2="238" y2="415" />
      <line x1="100" y1="275" x2="115" y2="275" /><line x1="360" y1="275" x2="375" y2="275" />
    </g>
    <text x="238" y="168" font-family="-apple-system, sans-serif" font-weight="900" font-size="28" fill="#0284c7" text-anchor="middle">N</text>
    <!-- Orbit Swoosh -->
    <path d="M 38,348 C 30,378 55,410 95,424 C 160,446 250,432 315,395 C 385,355 425,290 410,215 C 400,165 365,130 330,122 C 275,108 205,145 175,190 C 150,228 152,275 180,312 C 215,358 275,372 328,348 C 385,322 418,260 410,202" fill="none" stroke="url(#swooshOrange)" stroke-width="26" stroke-linecap="round" />
    <!-- Needle -->
    <polygon points="238,275 220,260 308,198" fill="url(#needleGoldLight)" />
    <polygon points="238,275 256,290 308,198" fill="url(#needleGoldDark)" />
    <polygon points="238,275 220,260 168,352" fill="url(#needleBlueLight)" />
    <polygon points="238,275 256,290 168,352" fill="url(#needleBlueDark)" />
    <circle cx="238" cy="275" r="14" fill="#ffffff" />
    <circle cx="238" cy="275" r="6" fill="#0284c7" />
    <!-- Airplane -->
    <g transform="translate(425, 105) rotate(42) scale(1.15)" fill="url(#needleGoldDark)">
      <path d="M 0,-48 C 4,-48 8,-35 8,-10 L 8,30 L 3,42 L -3,42 L -8,30 L -8,-10 C -8,-35 -4,-48 0,-48 Z" />
      <path d="M 0,-12 L 46,14 L 46,22 L 8,15 L 8,30 L -8,30 L -8,15 L -46,22 L -46,14 Z" />
      <path d="M 0,28 L 18,39 L 18,44 L 4,40 L 0,42 L -4,40 L -18,44 L -18,39 Z" />
    </g>
  </g>

  <!-- Brand Typography -->
  <text x="100" y="48" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="900" letter-spacing="1" fill="${textColor}">
    Travelly
  </text>
  <text x="102" y="68" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" letter-spacing="2" fill="${subColor}" text-transform="uppercase">
    Global Journey Awaits
  </text>
</svg>`;
}

// Function to construct standard multi-resolution ICO file from PNG buffers
function createIco(pngBuffers) {
  // pngBuffers: array of { width, height, buffer }
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(count, 4); // count

  const dirEntries = [];
  let currentOffset = 6 + count * 16;

  for (const img of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bit count
    entry.writeUInt32LE(img.buffer.length, 8); // size
    entry.writeUInt32LE(currentOffset, 12); // offset
    dirEntries.push(entry);
    currentOffset += img.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map(p => p.buffer)]);
}

async function buildAllIcons() {
  const iconsDir = path.resolve('public/icons');
  const brandDir = path.resolve('public/brand');
  const publicDir = path.resolve('public');

  fs.mkdirSync(iconsDir, { recursive: true });
  fs.mkdirSync(brandDir, { recursive: true });

  console.log('Rendering Travelly icons with sharp...');

  // Standard "any" sizes (symbol on a white rounded square)
  const standardSizes = [48, 72, 96, 128, 144, 152, 192, 256, 384, 512];
  for (const size of standardSizes) {
    const svg = getTravellySvg({ width: size, height: size, bgType: 'white-rounded', scale: 0.88 });
    const pngBuffer = await sharp(Buffer.from(svg))
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toBuffer();
    fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), pngBuffer);
    console.log(`Saved /icons/icon-${size}.png (${size}x${size})`);
  }

  // Maskable icons: full-bleed white, symbol inside safe zone (72% scale)
  for (const size of [192, 512]) {
    const svg = getTravellySvg({ width: size, height: size, bgType: 'white-full', scale: 0.72 });
    const pngBuffer = await sharp(Buffer.from(svg))
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toBuffer();
    fs.writeFileSync(path.join(iconsDir, `maskable-${size}.png`), pngBuffer);
    console.log(`Saved /icons/maskable-${size}.png (${size}x${size})`);
  }

  // Apple touch icon: 180x180 opaque white background
  const appleSvg = getTravellySvg({ width: 180, height: 180, bgType: 'white-square', scale: 0.88 });
  const appleBuffer = await sharp(Buffer.from(appleSvg))
    .resize(180, 180)
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), appleBuffer);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleBuffer);
  console.log('Saved /icons/apple-touch-icon.png (180x180)');

  // Play Store icon: 512x512 opaque white background, square corners
  const playstoreSvg = getTravellySvg({ width: 512, height: 512, bgType: 'white-square', scale: 0.88 });
  const playstoreBuffer = await sharp(Buffer.from(playstoreSvg))
    .resize(512, 512)
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(iconsDir, 'playstore-512.png'), playstoreBuffer);
  console.log('Saved /icons/playstore-512.png (512x512)');

  // Favicons: 16x16, 32x32 transparent
  const fav16Svg = getTravellySvg({ width: 16, height: 16, bgType: 'transparent', scale: 1.0 });
  const fav16Buffer = await sharp(Buffer.from(fav16Svg))
    .resize(16, 16)
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(iconsDir, 'favicon-16.png'), fav16Buffer);

  const fav32Svg = getTravellySvg({ width: 32, height: 32, bgType: 'transparent', scale: 1.0 });
  const fav32Buffer = await sharp(Buffer.from(fav32Svg))
    .resize(32, 32)
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(iconsDir, 'favicon-32.png'), fav32Buffer);
  console.log('Saved /icons/favicon-16.png and /icons/favicon-32.png');

  // Multi-res favicon.ico (16, 32, 48)
  const fav48Svg = getTravellySvg({ width: 48, height: 48, bgType: 'transparent', scale: 1.0 });
  const fav48Buffer = await sharp(Buffer.from(fav48Svg)).resize(48, 48).png().toBuffer();
  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: fav16Buffer },
    { width: 32, height: 32, buffer: fav32Buffer },
    { width: 48, height: 48, buffer: fav48Buffer },
  ]);
  fs.writeFileSync(path.join(iconsDir, 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('Saved /icons/favicon.ico and /public/favicon.ico');

  // logo-symbol-transparent.png: 512x512
  const transSvg = getTravellySvg({ width: 512, height: 512, bgType: 'transparent', scale: 1.0 });
  const transBuffer = await sharp(Buffer.from(transSvg))
    .resize(512, 512)
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(iconsDir, 'logo-symbol-transparent.png'), transBuffer);
  fs.writeFileSync(path.join(brandDir, 'logo-symbol-transparent.png'), transBuffer);
  console.log('Saved logo-symbol-transparent.png');

  // Also sync root PWA icons
  fs.copyFileSync(path.join(iconsDir, 'icon-192.png'), path.join(publicDir, 'pwa-192x192.png'));
  fs.copyFileSync(path.join(iconsDir, 'icon-512.png'), path.join(publicDir, 'pwa-512x512.png'));
  fs.copyFileSync(path.join(iconsDir, 'maskable-512.png'), path.join(publicDir, 'pwa-maskable-512x512.png'));
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), transSvg);

  // Brand vector files in /public/brand/
  fs.writeFileSync(path.join(brandDir, 'travelly-symbol.svg'), transSvg);
  fs.writeFileSync(path.join(brandDir, 'travelly-logo.svg'), getTravellyHorizontalSvg(false));
  fs.writeFileSync(path.join(brandDir, 'travelly-logo-dark.svg'), getTravellyHorizontalSvg(true));
  console.log('Saved brand assets in /public/brand/');

  console.log('All Travelly icons and brand assets generated successfully!');
}

buildAllIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
