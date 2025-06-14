const fs = require('fs');
const path = require('path');

// Script to sync compression experiment data from code to public directory
// This ensures the widget can access the files while maintaining a single source of truth

const sourceDir = path.join(__dirname, '../code/compression_experiments');
const destDir = path.join(__dirname, '../public/compression_experiments');

// Files to sync
const filesToSync = [
  'texts/list.json',
  'texts/kl_intro_10kb.txt',
  'texts/pi_digits_10kb.txt', 
  'texts/declaration_full.txt',
  'texts/human_mitochondrial_dna.txt',
  'texts/huffman_code_10kb.txt',
  'texts/repeated_phrase.txt'
];

console.log('Syncing compression experiment files from code to public...\n');

filesToSync.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const destPath = path.join(destDir, file);
  
  try {
    // Ensure destination directory exists
    const destDirPath = path.dirname(destPath);
    if (!fs.existsSync(destDirPath)) {
      fs.mkdirSync(destDirPath, { recursive: true });
    }
    
    // Copy file
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✓ Synced: ${file}`);
  } catch (error) {
    console.error(`✗ Failed to sync ${file}:`, error.message);
  }
});

console.log('\nSync complete! The widget will now use the latest data from the code directory.');
console.log('\nNote: Run this script after making changes to files in code/compression_experiments/texts/');