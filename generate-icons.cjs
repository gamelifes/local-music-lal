const sharp = require('sharp');
const path = require('path');

const srcPath = path.join(__dirname, '图片设计版本对比与极简方案.png');

const sizes = [
  { dir: 'android/app/src/main/res/mipmap-mdpi', s: 48 },
  { dir: 'android/app/src/main/res/mipmap-hdpi', s: 72 },
  { dir: 'android/app/src/main/res/mipmap-xhdpi', s: 96 },
  { dir: 'android/app/src/main/res/mipmap-xxhdpi', s: 144 },
  { dir: 'android/app/src/main/res/mipmap-xxxhdpi', s: 192 },
];

const files = ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png'];

async function generate() {
  for (const { dir, s } of sizes) {
    const outDir = path.join(__dirname, dir);
    for (const f of files) {
      const outPath = path.join(outDir, f);
      await sharp(srcPath)
        .resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(outPath);
      console.log(`OK ${outPath} (${s}x${s})`);
    }
  }

  await sharp(srcPath).resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(path.join(__dirname, 'public/icon-192.png'));
  await sharp(srcPath).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(path.join(__dirname, 'public/icon-512.png'));
  console.log('OK public/icon-192.png + icon-512.png');
}

generate().catch(console.error);
