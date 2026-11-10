
import fs from 'fs';

const content = fs.readFileSync('/Users/facundocordoba/.gemini/antigravity/scratch/nextn/src/lib/lidimi-catalog.ts', 'utf-8');

// Simple regex to extract id, name, and img
const regex = /id:\s*"([^"]+)",\s*name:\s*"([^"]+)",[\s\S]*?img:\s*"([^"]+)"/g;
let match;
const products = [];
while ((match = regex.exec(content)) !== null) {
  products.push({ id: match[1], name: match[2], img: match[3] });
}

const imgMap = {};
products.forEach(p => {
  if (!imgMap[p.img]) imgMap[p.img] = [];
  imgMap[p.img].push(p);
});

console.log('Duplicate Images Analysis:');
for (const [img, prods] of Object.entries(imgMap)) {
  if (prods.length > 1) {
    console.log(`\nImage: ${img}`);
    prods.forEach(p => console.log(` - ${p.id}: ${p.name}`));
  }
}
