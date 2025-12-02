import { createWriteStream } from 'fs';
import { readdir, stat } from 'fs/promises';
import { join, relative } from 'path';
import archiver from 'archiver';

const browser = process.argv[2] || 'chrome';
const DIST_DIR = `dist-${browser}`;
const OUTPUT_FILE = `torn-thread-notifier-${browser}.zip`;

async function getAllFiles(dir, fileList = []) {
  const files = await readdir(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const fileStat = await stat(filePath);

    if (fileStat.isDirectory()) {
      await getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }

  return fileList;
}

async function createZip() {
  console.log(`Creating ${browser} extension package...`);

  const output = createWriteStream(OUTPUT_FILE);
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log(`✓ Package created: ${OUTPUT_FILE} (${archive.pointer()} bytes)`);
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Add all files from dist directory
    archive.directory(DIST_DIR, false);

    archive.finalize();
  });
}

createZip().catch((err) => {
  console.error('Error creating package:', err);
  process.exit(1);
});
