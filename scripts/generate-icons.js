const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [192, 256, 384, 512];
const publicDir = path.join(__dirname, '..', 'public');
const appDir = path.join(__dirname, '..', 'app');
const sourceIconPath = path.join(publicDir, 'Concreexpo-large-icon.png');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Check if source icon exists
if (!fs.existsSync(sourceIconPath)) {
  console.error(`✗ Source icon not found at: ${sourceIconPath}`);
  console.error('Please ensure Concreexpo-large-icon.png exists in the public directory.');
  process.exit(1);
}

async function generateIcons() {
  console.log('Generating PWA icons from Concreexpo-large-icon.png...');
  
  // Generate PWA icons
  for (const size of sizes) {
    const outputPath = path.join(publicDir, `icon-${size}x${size}.png`);
    
    try {
      await sharp(sourceIconPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`✗ Error generating icon-${size}x${size}.png:`, error);
    }
  }
  
  // Generate favicon for Next.js app directory (multiple sizes for better quality)
  try {
    // Generate icon.png (Next.js will use this automatically)
    const faviconPath = path.join(appDir, 'icon.png');
    await sharp(sourceIconPath)
      .resize(96, 96, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(faviconPath);
    
    console.log('✓ Generated favicon (app/icon.png)');
    
    // Also generate a favicon.ico in public for direct browser access
    const faviconIcoPath = path.join(publicDir, 'favicon.ico');
    // Note: sharp doesn't support .ico directly, so we'll create a 32x32 PNG
    // Browsers will accept PNG as favicon.ico
    await sharp(sourceIconPath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(faviconIcoPath.replace('.ico', '.png'));
    
    console.log('✓ Generated favicon (public/favicon.png)');
  } catch (error) {
    console.error('✗ Error generating favicon:', error);
  }
  
  console.log('Icon generation complete!');
}

generateIcons();

