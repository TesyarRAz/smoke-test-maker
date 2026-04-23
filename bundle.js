import { execSync } from 'child_process';

console.log('Building TypeScript...');
execSync('bun run build', { stdio: 'inherit' });

console.log('Bundling with esbuild...');
execSync('npx esbuild src/index.ts --bundle --platform=node --format=cjs --outfile=bin/smoke-test-maker.cjs', { stdio: 'inherit' });

console.log('Done! Run: node bin/smoke-test-maker.cjs <file.hurl>');
