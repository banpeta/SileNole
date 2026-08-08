import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from './App';
import { RepositorioEnMemoria } from '../data/repositorio';
import { coleccionEjemplo } from '../test/fixtures';

/**
 * Test de integración de la app: navegación + marcado + guardado automático.
 * Fuente: docs/04-especificacion-funcional.md (HU-01..HU-06).
 *
 * Se inyecta un repositorio en memoria y una semilla, para no depender de
 * IndexedDB ni de la red en el test.
 */

const semilla = () => Promise.resolve(coleccionEjemplo());

describe('App — flujo de consulta y marcado', () => {
  it('marca un cromo y el progreso total se actualiza', async () => {
    const repo = new RepositorioEnMemoria();
    render(<App repo={repo} cargarSemilla={semilla} />);

    // Inicio: al principio no tiene ninguno (0 de 3).
    await waitFor(() => expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0'));

    // Ir a los equipos y abrir el Equipo A.
    fireEvent.click(screen.getByRole('button', { name: /equipos/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Equipo A/ }));

    // Tocar el cromo 1 → pasa a "lo tengo".
    fireEvent.click(await screen.findByRole('button', { name: /Cromo 1/i }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Cromo 1.*lo tengo/i })).toBeInTheDocument(),
    );

    // Volver al inicio (mediante el título de la cabecera): ahora tiene 1.
    fireEvent.click(screen.getByRole('button', { name: /SileNole/i }));
    await waitFor(() => expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1'));
  });

  it('registra repes y aparecen en "Para cambiar" (HU-08)', async () => {
    const repo = new RepositorioEnMemoria();
    render(<App repo={repo} cargarSemilla={semilla} />);
    await screen.findByRole('progressbar');

    // Marcar el cromo 1 y sumarle 2 repes.
    fireEvent.click(screen.getByRole('button', { name: /equipos/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Equipo A/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Cromo 1(,|$)/i }));
    fireEvent.click(await screen.findByRole('button', { name: /añadir un repetido/i }));
    fireEvent.click(screen.getByRole('button', { name: /añadir un repetido/i }));

    // Se guarda con repes = 2.
    await waitFor(async () =>
      expect((await repo.cargarEstados()).find((e) => e.numero === '1')?.repes).toBe(2),
    );

    // Aparece en "Para cambiar".
    fireEvent.click(screen.getByRole('button', { name: /SileNole/i }));
    fireEvent.click(await screen.findByRole('button', { name: /cambiar/i }));
    expect(await screen.findByText(/x\s*2/i)).toBeInTheDocument();
  });

  it('el estado persiste al reabrir la app (guardado automático, HU-06)', async () => {
    const repo = new RepositorioEnMemoria();

    // Primera sesión: marcar el cromo 1.
    const primera = render(<App repo={repo} cargarSemilla={semilla} />);
    await screen.findByRole('progressbar');
    fireEvent.click(screen.getByRole('button', { name: /equipos/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Equipo A/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Cromo 1/i }));
    await waitFor(async () => expect((await repo.cargarEstados()).some((e) => e.numero === '1' && e.tenido)).toBe(true));
    primera.unmount();

    // Segunda sesión con el mismo repositorio: el progreso ya es 1.
    render(<App repo={repo} cargarSemilla={semilla} />);
    await waitFor(() => expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1'));
  });
});
