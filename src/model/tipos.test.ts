import { describe, it, expect } from 'vitest';
import { etiquetaVisible, type Cromo } from './tipos';

describe('etiquetaVisible', () => {
  it('devuelve la etiqueta si existe', () => {
    const c: Cromo = { numero: 'real-betis-5', etiqueta: '5', nombre: null, orden: 1 };
    expect(etiquetaVisible(c)).toBe('5');
  });

  it('usa el número si no hay etiqueta', () => {
    const c: Cromo = { numero: 'F12', nombre: null, orden: 1 };
    expect(etiquetaVisible(c)).toBe('F12');
  });
});
