import fs from 'node:fs';
import { createHash } from 'node:crypto';
const manifest = JSON.parse(
  fs.readFileSync('config/workspace-icons-source.json', 'utf8'),
);
const source = fs.readFileSync('src/domain/workspace-seeds.ts', 'utf8');
const names = [...source.matchAll(/\['[^']+', '[^']+', '([^']+)'\]/g)]
  .map((match) => match[1])
  .sort();
if (
  manifest.family !== 'Material Symbols Rounded' ||
  manifest.fill !== 0 ||
  manifest.weight !== 400 ||
  manifest.grade !== 0 ||
  manifest.opticalSize !== 24 ||
  !/^[a-f0-9]{40}$/.test(manifest.revision)
)
  throw Error('Unexpected icon source/style');
if (
  names.length !== 22 ||
  JSON.stringify(names) !==
    JSON.stringify(manifest.icons.map((icon) => icon.name).sort())
)
  throw Error('Starter icon coverage mismatch');
for (const icon of manifest.icons) {
  const file = `public/icons/material-symbols-rounded/${icon.name}.svg`;
  if (!/^[a-z_]+$/.test(icon.name) || icon.file !== file)
    throw Error('Unexpected icon path');
  const bytes = fs.readFileSync(file),
    svg = bytes.toString('utf8');
  if (
    createHash('sha256').update(bytes).digest('hex') !== icon.sha256 ||
    !svg.startsWith('<svg ') ||
    !svg.includes('viewBox="0 -960 960 960"') ||
    /<(script|foreignObject|image|use)\b|\bon\w+=|href=/i.test(svg)
  )
    throw Error(`Invalid pinned icon: ${icon.name}`);
  const symbol = icon.symbol ?? icon.name;
  if (
    icon.source !==
    `https://raw.githubusercontent.com/google/material-design-icons/${manifest.revision}/symbols/web/${symbol}/materialsymbolsrounded/${symbol}_24px.svg`
  )
    throw Error('Unexpected icon provenance');
}
if (
  !fs
    .readFileSync('public/icons/material-symbols-rounded/LICENSE', 'utf8')
    .includes('Apache License')
)
  throw Error('Missing icon license');
console.log(
  '22 pinned self-hosted Rounded icons verified; unfilled/400/grade0/24px; two documented semantic aliases',
);
