#!/usr/bin/env node

/**
 * generate-placeholder-assets.js
 * 
 * Generates sample placeholder sprite PNG files for testing
 * Usage: node scripts/generate-placeholder-assets.js
 * 
 * This is optional - useful for testing the animation system
 * without manually creating sprite artwork.
 */

const fs = require('fs');
const path = require('path');

// Try to use canvas if available
let Canvas;
try {
  Canvas = require('canvas').Canvas;
} catch (e) {
  console.log('Note: canvas module not available. For proper PNG generation, install:');
  console.log('  npm install canvas');
  console.log('\nFor now, you can create PNGs manually using any image editor.');
  process.exit(0);
}

const assetsDir = path.join(__dirname, '..', 'public', 'assets');

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

/**
 * Generate a mouth sprite placeholder
 */
function generateMouthSprite(phoneme, width = 200, height = 150) {
  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, width, height);

  // Border
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, width, height);

  // Draw mouth shape based on phoneme
  ctx.fillStyle = '#ff69b4';
  ctx.beginPath();

  const cx = width / 2;
  const cy = height / 2;

  switch (phoneme) {
    case 'idle':
      // Neutral closed mouth
      ctx.ellipse(cx, cy, 60, 20, 0, 0, Math.PI * 2);
      break;
    case 'a':
      // Wide open A
      ctx.ellipse(cx, cy, 70, 60, 0, 0, Math.PI * 2);
      break;
    case 'e':
      // Slight smile E
      ctx.ellipse(cx, cy, 65, 35, 0, 0, Math.PI * 2);
      break;
    case 'o':
      // Rounded O
      ctx.ellipse(cx, cy, 50, 50, 0, 0, Math.PI * 2);
      break;
    case 'u':
      // Narrow U
      ctx.ellipse(cx, cy, 40, 45, 0, 0, Math.PI * 2);
      break;
    case 'm':
      // Closed M
      ctx.ellipse(cx, cy, 55, 18, 0, 0, Math.PI * 2);
      break;
    case 'f':
      // Teeth visible F
      ctx.ellipse(cx, cy, 50, 40, 0, 0, Math.PI * 2);
      break;
    case 'closed':
      // Very closed
      ctx.ellipse(cx, cy, 50, 15, 0, 0, Math.PI * 2);
      break;
  }

  ctx.fill();

  // Label
  ctx.fillStyle = '#333';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`Mouth: ${phoneme.toUpperCase()}`, cx, height - 10);

  return canvas.toBuffer('image/png');
}

/**
 * Generate an eye sprite placeholder
 */
function generateEyeSprite(state, width = 100, height = 60) {
  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, width, height);

  // Border
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;

  if (state === 'open') {
    // Open eye - white + iris + pupil
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 35, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Iris
    ctx.fillStyle = '#4a90e2';
    ctx.beginPath();
    ctx.ellipse(cx + 5, cy - 3, 18, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(cx + 8, cy - 5, 10, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shine
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(cx + 12, cy - 8, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (state === 'closed') {
    // Closed eye - horizontal line
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(10, cy);
    ctx.lineTo(width - 10, cy);
    ctx.stroke();
  }

  // Label
  ctx.fillStyle = '#333';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`Eye: ${state}`, cx, height - 8);

  return canvas.toBuffer('image/png');
}

/**
 * Generate body sprite placeholder
 */
function generateBodySprite(width = 400, height = 600) {
  const canvas = new Canvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, width, height);

  // Border
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, width, height);

  // Draw simple character silhouette
  ctx.fillStyle = '#ff9999';

  // Head
  ctx.beginPath();
  ctx.arc(width / 2, 120, 60, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillRect(width / 2 - 50, 180, 100, 150);

  // Arms
  ctx.fillRect(width / 2 - 120, 200, 70, 30);
  ctx.fillRect(width / 2 + 50, 200, 70, 30);

  // Legs
  ctx.fillRect(width / 2 - 30, 330, 25, 150);
  ctx.fillRect(width / 2 + 5, 330, 25, 150);

  // Label
  ctx.fillStyle = '#333';
  ctx.font = '18px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Character Body', width / 2, height / 2);

  return canvas.toBuffer('image/png');
}

// Generate all placeholders
const sprites = {
  'mouth_idle.png': generateMouthSprite('idle'),
  'mouth_a.png': generateMouthSprite('a'),
  'mouth_e.png': generateMouthSprite('e'),
  'mouth_o.png': generateMouthSprite('o'),
  'mouth_u.png': generateMouthSprite('u'),
  'mouth_m.png': generateMouthSprite('m'),
  'mouth_f.png': generateMouthSprite('f'),
  'mouth_closed.png': generateMouthSprite('closed'),
  'eye_open.png': generateEyeSprite('open'),
  'eye_closed.png': generateEyeSprite('closed'),
  'body.png': generateBodySprite(),
};

let count = 0;
Object.entries(sprites).forEach(([filename, buffer]) => {
  const filepath = path.join(assetsDir, filename);
  fs.writeFileSync(filepath, buffer);
  console.log(`✅ Generated: ${filename}`);
  count++;
});

console.log(`\n🎉 Generated ${count} placeholder sprites in ${assetsDir}`);
