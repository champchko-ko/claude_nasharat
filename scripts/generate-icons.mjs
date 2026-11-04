import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#090d16" />
    </linearGradient>

    <!-- Border Ring Gradient -->
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#60a5fa" stop-opacity="0.9" />
      <stop offset="50%" stop-color="#3b82f6" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#1d4ed8" stop-opacity="0.9" />
    </linearGradient>

    <!-- Gold Accent Gradient -->
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>

    <!-- Cap Surface Gradient -->
    <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>

    <!-- Shield Gradient -->
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.95" />
    </linearGradient>
  </defs>

  <!-- Background Squircle -->
  <rect x="16" y="16" width="480" height="480" rx="104" fill="url(#bgGrad)" stroke="url(#borderGrad)" stroke-width="8" />

  <!-- Subtle Inner Shield / Crest Outline -->
  <path d="M 256 68 C 334 68 388 94 388 94 C 388 238 344 346 256 404 C 168 346 124 238 124 94 C 124 94 178 68 256 68 Z"
        fill="url(#shieldGrad)" stroke="#3b82f6" stroke-opacity="0.3" stroke-width="4" />

  <!-- Stars of Excellence above Cap -->
  <!-- Center Star -->
  <path d="M 256 94 L 260 106 L 273 107 L 262 116 L 266 128 L 256 121 L 246 128 L 250 116 L 239 107 L 252 106 Z" fill="url(#goldGrad)" />
  <!-- Left Star -->
  <path d="M 212 108 L 215 117 L 225 118 L 217 125 L 220 134 L 212 129 L 204 134 L 207 125 L 199 118 L 209 117 Z" fill="url(#goldGrad)" opacity="0.9" />
  <!-- Right Star -->
  <path d="M 300 108 L 303 117 L 313 118 L 305 125 L 308 134 L 300 129 L 292 134 L 295 125 L 287 118 L 297 117 Z" fill="url(#goldGrad)" opacity="0.9" />

  <!-- Graduation Cap (Mortarboard) -->
  <!-- Cap Skull / Underband -->
  <path d="M 194 216 C 194 252 222 264 256 264 C 290 264 318 252 318 216 Z" fill="#1e3a8a" />
  <path d="M 202 221 C 202 245 226 256 256 256 C 286 256 310 245 310 221 Z" fill="#0f172a" />

  <!-- Mortarboard Top (Diamond) -->
  <polygon points="256,140 384,194 256,248 128,194" fill="url(#capGrad)" />
  <polygon points="256,146 376,194 256,242 136,194" fill="#2563eb" />
  <polygon points="256,146 376,194 256,198 136,194" fill="#60a5fa" opacity="0.45" />

  <!-- Center Button -->
  <ellipse cx="256" cy="194" rx="10" ry="7" fill="url(#goldGrad)" />

  <!-- Gold Tassel Ribbon & Fringes -->
  <path d="M 256 194 Q 302 200 336 236 Q 350 258 348 298" fill="none" stroke="url(#goldGrad)" stroke-width="6" stroke-linecap="round" />
  <!-- Tassel Ring & Pendant -->
  <circle cx="348" cy="301" r="6" fill="#f59e0b" />
  <path d="M 342 306 L 354 306 L 358 336 L 338 336 Z" fill="url(#goldGrad)" />

  <!-- Open Book of Knowledge -->
  <!-- Left Page -->
  <path d="M 250 324 C 212 308 164 313 142 324 L 142 398 C 164 387 212 382 250 398 Z" fill="#f8fafc" />
  <path d="M 244 332 C 212 320 170 324 152 333 L 152 389 C 170 380 212 376 244 388 Z" fill="#e2e8f0" />
  <!-- Left Page Text Lines -->
  <line x1="166" y1="345" x2="230" y2="340" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" />
  <line x1="166" y1="358" x2="230" y2="353" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" />
  <line x1="166" y1="371" x2="216" y2="366" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" />

  <!-- Right Page -->
  <path d="M 262 324 C 300 308 348 313 370 324 L 370 398 C 348 387 300 382 262 398 Z" fill="#f8fafc" />
  <path d="M 268 332 C 300 320 342 324 360 333 L 360 389 C 342 380 300 376 268 388 Z" fill="#e2e8f0" />
  <!-- Right Page Text Lines -->
  <line x1="282" y1="340" x2="346" y2="345" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" />
  <line x1="282" y1="353" x2="346" y2="358" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" />
  <line x1="282" y1="366" x2="332" y2="371" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" />

  <!-- Book Spine Center -->
  <path d="M 250 324 L 256 320 L 262 324 L 262 400 L 256 397 L 250 400 Z" fill="url(#goldGrad)" />
</svg>`;

// Maskable version with safe area padding (384x384 emblem inside 512x512 background)
const maskableSvgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#090d16" />
    </linearGradient>

    <!-- Border Ring Gradient -->
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#60a5fa" stop-opacity="0.9" />
      <stop offset="50%" stop-color="#3b82f6" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#1d4ed8" stop-opacity="0.9" />
    </linearGradient>

    <!-- Gold Accent Gradient -->
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>

    <!-- Cap Surface Gradient -->
    <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>

    <!-- Shield Gradient -->
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.95" />
    </linearGradient>
  </defs>

  <!-- Full Bleed Background for Maskable Icons -->
  <rect x="0" y="0" width="512" height="512" fill="url(#bgGrad)" />

  <!-- Inner Content Scaled to Safe Zone (80% scale centered) -->
  <g transform="translate(51.2, 51.2) scale(0.8)">
    <!-- Inner Shield / Crest Outline -->
    <path d="M 256 68 C 334 68 388 94 388 94 C 388 238 344 346 256 404 C 168 346 124 238 124 94 C 124 94 178 68 256 68 Z"
          fill="url(#shieldGrad)" stroke="#3b82f6" stroke-opacity="0.3" stroke-width="4" />

    <!-- Stars of Excellence -->
    <path d="M 256 94 L 260 106 L 273 107 L 262 116 L 266 128 L 256 121 L 246 128 L 250 116 L 239 107 L 252 106 Z" fill="url(#goldGrad)" />
    <path d="M 212 108 L 215 117 L 225 118 L 217 125 L 220 134 L 212 129 L 204 134 L 207 125 L 199 118 L 209 117 Z" fill="url(#goldGrad)" opacity="0.9" />
    <path d="M 300 108 L 303 117 L 313 118 L 305 125 L 308 134 L 300 129 L 292 134 L 295 125 L 287 118 L 297 117 Z" fill="url(#goldGrad)" opacity="0.9" />

    <!-- Cap Skull -->
    <path d="M 194 216 C 194 252 222 264 256 264 C 290 264 318 252 318 216 Z" fill="#1e3a8a" />
    <path d="M 202 221 C 202 245 226 256 256 256 C 286 256 310 245 310 221 Z" fill="#0f172a" />

    <!-- Mortarboard Diamond -->
    <polygon points="256,140 384,194 256,248 128,194" fill="url(#capGrad)" />
    <polygon points="256,146 376,194 256,242 136,194" fill="#2563eb" />
    <polygon points="256,146 376,194 256,198 136,194" fill="#60a5fa" opacity="0.45" />

    <ellipse cx="256" cy="194" rx="10" ry="7" fill="url(#goldGrad)" />

    <path d="M 256 194 Q 302 200 336 236 Q 350 258 348 298" fill="none" stroke="url(#goldGrad)" stroke-width="6" stroke-linecap="round" />
    <circle cx="348" cy="301" r="6" fill="#f59e0b" />
    <path d="M 342 306 L 354 306 L 358 336 L 338 336 Z" fill="url(#goldGrad)" />

    <!-- Open Book -->
    <path d="M 250 324 C 212 308 164 313 142 324 L 142 398 C 164 387 212 382 250 398 Z" fill="#f8fafc" />
    <path d="M 244 332 C 212 320 170 324 152 333 L 152 389 C 170 380 212 376 244 388 Z" fill="#e2e8f0" />
    <line x1="166" y1="345" x2="230" y2="340" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" />
    <line x1="166" y1="358" x2="230" y2="353" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" />
    <line x1="166" y1="371" x2="216" y2="366" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" />

    <path d="M 262 324 C 300 308 348 313 370 324 L 370 398 C 348 387 300 382 262 398 Z" fill="#f8fafc" />
    <path d="M 268 332 C 300 320 342 324 360 333 L 360 389 C 342 380 300 376 268 388 Z" fill="#e2e8f0" />
    <line x1="282" y1="340" x2="346" y2="345" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" />
    <line x1="282" y1="353" x2="346" y2="358" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" />
    <line x1="282" y1="366" x2="332" y2="371" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" />

    <path d="M 250 324 L 256 320 L 262 324 L 262 400 L 256 397 L 250 400 Z" fill="url(#goldGrad)" />
  </g>
</svg>`;

async function run() {
  const rootDir = process.cwd();
  const publicIconsDir = path.join(rootDir, "public", "icons");
  fs.mkdirSync(publicIconsDir, { recursive: true });

  // 1. Write SVG
  const svgPath = path.join(publicIconsDir, "icon.svg");
  fs.writeFileSync(svgPath, svgContent, "utf8");
  console.log("Wrote", svgPath);

  // Also write to src/app/icon.svg
  fs.writeFileSync(path.join(rootDir, "src", "app", "icon.svg"), svgContent, "utf8");
  console.log("Wrote src/app/icon.svg");

  // Also replace public/file.svg so any cached browser / OS shortcut picking file.svg gets this icon!
  fs.writeFileSync(path.join(rootDir, "public", "file.svg"), svgContent, "utf8");
  console.log("Replaced public/file.svg with school portal logo");

  // 2. Render 512x512 PNG
  const svgBuffer = Buffer.from(svgContent);
  const p512 = path.join(publicIconsDir, "icon-512x512.png");
  await sharp(svgBuffer).resize(512, 512).png().toFile(p512);
  console.log("Rendered", p512);

  // 3. Render 192x192 PNG
  const p192 = path.join(publicIconsDir, "icon-192x192.png");
  await sharp(svgBuffer).resize(192, 192).png().toFile(p192);
  console.log("Rendered", p192);

  // Also write src/app/apple-icon.png
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(rootDir, "src", "app", "apple-icon.png"));
  console.log("Rendered src/app/apple-icon.png");

  // 4. Render 512x512 Maskable PNG
  const maskableBuffer = Buffer.from(maskableSvgContent);
  const pMaskable = path.join(publicIconsDir, "icon-512x512-maskable.png");
  await sharp(maskableBuffer).resize(512, 512).png().toFile(pMaskable);
  console.log("Rendered", pMaskable);

  // 5. Render 32x32 and 48x48 for favicon
  const p32 = path.join(publicIconsDir, "icon-32x32.png");
  await sharp(svgBuffer).resize(32, 32).png().toFile(p32);
  console.log("Rendered", p32);

  // Generate a multi-size ICO or 32x32 ICO
  // An ICO header for 32x32 PNG is a valid modern standard icon
  const png32Buffer = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  // Simple ICO container enclosing the PNG (supported by all modern Windows & browsers)
  // ICO header: 2 bytes reserved (0), 2 bytes type (1 for ICO), 2 bytes image count (1)
  // Directory entry: width (32), height (32), colors (0), reserved (0), planes (1), bpp (32), size (N), offset (22)
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0);
  icoHeader.writeUInt16LE(1, 2);
  icoHeader.writeUInt16LE(1, 4);

  const icoDirEntry = Buffer.alloc(16);
  icoDirEntry.writeUInt8(32, 0); // width
  icoDirEntry.writeUInt8(32, 1); // height
  icoDirEntry.writeUInt8(0, 2); // color count
  icoDirEntry.writeUInt8(0, 3); // reserved
  icoDirEntry.writeUInt16LE(1, 4); // color planes
  icoDirEntry.writeUInt16LE(32, 6); // bits per pixel
  icoDirEntry.writeUInt32LE(png32Buffer.length, 8); // size of image data
  icoDirEntry.writeUInt32LE(22, 12); // offset of image data

  const icoFile = Buffer.concat([icoHeader, icoDirEntry, png32Buffer]);
  fs.writeFileSync(path.join(rootDir, "public", "favicon.ico"), icoFile);
  fs.writeFileSync(path.join(rootDir, "src", "app", "favicon.ico"), icoFile);
  console.log("Wrote public/favicon.ico and src/app/favicon.ico");

  console.log("All portal icons successfully created!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
