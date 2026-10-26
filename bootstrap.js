import { readFileSync } from 'node:fs';

// Carga .env sin dependencias externas y funciona en las versiones LTS de Node
// disponibles habitualmente en Ubuntu.
try {
  const contents = readFileSync(new URL('./.env', import.meta.url), 'utf8');
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || match[1].startsWith('#') || process.env[match[1]] !== undefined) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, '').trim();
    }
    process.env[match[1]] = value;
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

await import('./server.js');
