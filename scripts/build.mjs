// ============================================================================
// CineMatch — static build script
// ----------------------------------------------------------------------------
// CineMatch has no bundler. "Building" simply copies the files the browser
// needs into ./dist so hosts such as Render can publish that folder.
//
// Optional: if the TMDB_API_KEY environment variable is set (e.g. in the Render
// dashboard > Environment), dist/config.js is generated with that key, so the
// real key never has to be committed to git.
// ============================================================================

import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

const FILES = [
    'index.html',
    'styles.css',
    'main.js',
    'tmdbApi.js',
    'storage.js',
    'config.js'
];
const DIRS = ['images'];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const file of FILES) {
    const source = join(root, file);
    if (!existsSync(source)) {
        console.error(`Build failed: missing required file "${file}".`);
        process.exit(1);
    }
    await cp(source, join(dist, file));
}

for (const dir of DIRS) {
    await cp(join(root, dir), join(dist, dir), { recursive: true });
}

// Local builds: load TMDB_API_KEY from a git-ignored .env file (Node >= 20.12).
// On Render the variable is already provided by the dashboard's Environment tab.
const envFile = join(root, '.env');
if (!process.env.TMDB_API_KEY && existsSync(envFile) && typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(envFile);
}

const apiKey = process.env.TMDB_API_KEY;
if (apiKey && apiKey.trim() !== 'YOUR_TMDB_API_KEY_HERE') {
    await writeFile(
        join(dist, 'config.js'),
        `export const API_KEY = ${JSON.stringify(apiKey.trim())};\n`
    );
    console.log('dist/config.js generated from TMDB_API_KEY environment variable.');
} else {
    console.warn(
        'TMDB_API_KEY is not set - dist/config.js was copied as-is. ' +
        'Set it in Render > Environment so the live site can load movies.'
    );
}

console.log('CineMatch build complete -> dist/');
