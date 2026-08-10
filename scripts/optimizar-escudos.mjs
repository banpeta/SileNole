/**
 * Optimiza los escudos de los equipos y los cablea en el catálogo.
 *
 * Uso:
 *   1) npm i -D sharp        (solo la primera vez)
 *   2) Deja las imágenes de los escudos en la carpeta  escudos-fuente/
 *      con el nombre del id del equipo y cualquier extensión, por ejemplo:
 *        escudos-fuente/fc-barcelona.png
 *        escudos-fuente/real-madrid-cf.svg
 *      (ver la lista de ids abajo)
 *   3) node scripts/optimizar-escudos.mjs
 *
 * El script reduce cada imagen a 64 px de alto (WebP con transparencia),
 * la guarda en  public/escudos/<id>.webp,  y pone el campo `escudo` de esa
 * categoría en  public/coleccion.json,  subiendo la `version` del catálogo si
 * cambió algo.
 *
 * Fuente de la verdad del comportamiento: docs/03 (campo escudo) y docs/04 (HU-01).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

const DIR_FUENTE = 'escudos-fuente';
const DIR_SALIDA = 'public/escudos';
const CATALOGO = 'public/coleccion.json';
const ALTO = 64;

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('Falta "sharp". Instálalo con:  npm i -D sharp');
  process.exit(1);
}

if (!existsSync(DIR_FUENTE)) {
  console.error(`No existe la carpeta ${DIR_FUENTE}/. Crea esa carpeta y deja ahí los escudos.`);
  process.exit(1);
}
mkdirSync(DIR_SALIDA, { recursive: true });

const catalogo = JSON.parse(readFileSync(CATALOGO, 'utf8'));
const idsValidos = new Set(catalogo.categorias.map((c) => c.id));

const fuentes = readdirSync(DIR_FUENTE).filter((f) => !f.startsWith('.'));
let optimizados = 0;
for (const archivo of fuentes) {
  const id = basename(archivo, extname(archivo));
  if (!idsValidos.has(id)) {
    console.warn(`- Ignorado "${archivo}": "${id}" no es una categoría del catálogo.`);
    continue;
  }
  await sharp(join(DIR_FUENTE, archivo))
    .resize({ height: ALTO, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 90 })
    .toFile(join(DIR_SALIDA, `${id}.webp`));
  optimizados++;
  console.log(`  optimizado -> ${DIR_SALIDA}/${id}.webp`);
}

// Cablea en el catálogo el escudo de cada categoría cuyo webp ya existe.
let cambios = 0;
for (const cat of catalogo.categorias) {
  const ruta = `escudos/${cat.id}.webp`;
  if (existsSync(join(DIR_SALIDA, `${cat.id}.webp`)) && cat.escudo !== ruta) {
    cat.escudo = ruta;
    cambios++;
  }
}
if (cambios > 0) {
  catalogo.version = (catalogo.version ?? 1) + 1;
  writeFileSync(CATALOGO, JSON.stringify(catalogo, null, 2) + '\n', 'utf8');
}

console.log(
  `\nListo. ${optimizados} escudo(s) optimizado(s), ${cambios} cableado(s) en el catálogo` +
    (cambios > 0 ? ` (version ahora ${catalogo.version}).` : '.'),
);
