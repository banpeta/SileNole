import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Texto en MAYÚSCULAS para facilitar la lectura al niño (7 años).
 * Fuente: docs/01-vision-y-alcance.md (Principio 5) y
 * docs/04-especificacion-funcional.md (requisito no funcional).
 *
 * Se implementa con presentación (CSS text-transform), sin alterar el texto
 * almacenado. Aquí comprobamos que el CSS aplica la regla globalmente y que el
 * editor del JSON del catálogo queda excluido (el usuario lo edita tal cual).
 */

const css = readFileSync(resolve(process.cwd(), 'src/ui/estilos.css'), 'utf-8');

/** Cuerpo `{ ... }` de la primera regla cuyo selector coincide exactamente. */
function bloque(selector: string): string {
  const sel = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?:^|})\\s*${sel}\\s*\\{([^}]*)\\}`, 'm');
  const m = css.match(re);
  if (!m) throw new Error(`No se encontró la regla CSS para "${selector}"`);
  return m[1];
}

describe('Texto en mayúsculas (Principio 5)', () => {
  it('la app aplica text-transform: uppercase de forma global', () => {
    expect(bloque('.app')).toMatch(/text-transform:\s*uppercase/);
  });

  it('el editor del JSON del catálogo queda excluido (text-transform: none)', () => {
    expect(bloque('.editor-json')).toMatch(/text-transform:\s*none/);
  });
});
