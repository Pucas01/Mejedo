const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeImage(inputPath, outputPath, quality = 80) {
  try {
    // Simple conversion to WebP without color space manipulation
    const info = await sharp(inputPath, { failOnError: false })
      .webp({ quality, force: true })
      .toFile(outputPath);

    const originalSize = fs.statSync(inputPath).size;
    const newSize = info.size;
    const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);

    console.log(`✓ ${path.basename(inputPath)}: ${(originalSize / 1024 / 1024).toFixed(2)} MB → ${(newSize / 1024 / 1024).toFixed(2)} MB (${savings}% smaller)`);
    return { success: true, originalSize, newSize };
  } catch (error) {
    console.error(`✗ Failed to optimize ${inputPath}:`, error.message);
    return { success: false, error };
  }
}

async function main() {
  console.log('🖼️  Starting image optimization...\n');

  const imagesToOptimize = [
    // Background image
    {
      input: 'public/LaptopSHQ.png',
      output: 'public/LaptopSHQ.webp',
      quality: 85 // Higher quality for background
    },
    // TikTok thumbnails
    {
      input: 'public/tiktoks/TetoTiktok.png',
      output: 'public/tiktoks/TetoTiktok.webp',
      quality: 80
    },
    {
      input: 'public/tiktoks/EvaTiktok.png',
      output: 'public/tiktoks/EvaTiktok.webp',
      quality: 80
    },
    {
      input: 'public/tiktoks/SenkuTiktok.png',
      output: 'public/tiktoks/SenkuTiktok.webp',
      quality: 80
    },
    {
      input: 'public/tiktoks/RezeTiktok.png',
      output: 'public/tiktoks/RezeTiktok.webp',
      quality: 80
    },
    {
      input: 'public/tiktoks/GokuTiktok.png',
      output: 'public/tiktoks/GokuTiktok.webp',
      quality: 80
    }
  ];

  let totalOriginal = 0;
  let totalNew = 0;
  let successCount = 0;

  for (const image of imagesToOptimize) {
    if (!fs.existsSync(image.input)) {
      console.log(`⚠ Skipping ${image.input} (file not found)`);
      continue;
    }

    const result = await optimizeImage(image.input, image.output, image.quality);
    if (result.success) {
      totalOriginal += result.originalSize;
      totalNew += result.newSize;
      successCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Optimized: ${successCount}/${imagesToOptimize.length} images`);
  console.log(`   Total size: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB → ${(totalNew / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Savings: ${((totalOriginal - totalNew) / 1024 / 1024).toFixed(2)} MB (${((totalOriginal - totalNew) / totalOriginal * 100).toFixed(1)}%)`);
  console.log('\n✨ Done!');
}

main();
