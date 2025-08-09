const path = require('path');
const chokidar = require('chokidar');
const fs = require('fs');

const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');

// Watch for deleted TypeScript files in src
const watcher = chokidar.watch('./src', {
    ignored: (path, stats) => stats?.isFile() && !path.endsWith('.ts'), // only watch ts files in src
    persistent: true
});

watcher
    .on('unlink', tsPath => {
        const relativePath = path.relative(SRC_DIR, tsPath);
        const distPath = path.join(DIST_DIR, relativePath.replace(/\.ts$/, '.js'));

        // check file exists
        if (!fs.existsSync(distPath)) {
            return;
        }

        fs.unlink(distPath, err => {
            if (err) {
                console.error(`Error removing file: ${distPath}`, err);
            } else {
                console.log(`Successfully removed file: ${distPath}`);
            }
        });
    })
    .on('unlinkDir', dirPath => {
        const relativePath = path.relative(SRC_DIR, dirPath);
        const distPath = path.join(DIST_DIR, relativePath);

        // check dir exists
        if (!fs.existsSync(distPath)) {
            return;
        }

        fs.rmdir(distPath, { recursive: true }, err => {
            if (err) {
                console.error(`Error removing directory: ${distPath}`, err);
            } else {
                console.log(`Successfully removed directory: ${distPath}`);
            }
        });
    })