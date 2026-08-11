import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { App } from './App';
import { RepositorioEnMemoria } from '../data/repositorio';
import type { CrearCanal } from '../data/tiempoReal';
import { coleccionEjemplo } from '../test/fixtures';

/**
 * Test de integración de la app: navegación + marcado + guardado automático.
 * Fuente: docs/04-especificacion-funcional.md (HU-01..HU-06).
 *
 * Se inyecta un repositorio en memoria y una semilla, para no depender de
 * IndexedDB ni de la red en el test.
 */

const semilla = () => Promise.resolve(coleccionEjemplo());

// El código de sincronización se guarda en localStorage; lo limpiamos para
// que cada test parta de "sin sincronización".
beforeEach(() => localStorage.clear());

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

  it('importa un catálogo editado y conserva el progreso (HU-07)', async () => {
    const repo = new RepositorioEnMemoria();
    render(<App repo={repo} cargarSemilla={semilla} />);
    await screen.findByRole('progressbar');

    // Marcar el cromo 1 (Equipo A).
    fireEvent.click(screen.getByRole('button', { name: /equipos/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Equipo A/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Cromo 1(,|$)/i }));
    fireEvent.click(screen.getByRole('button', { name: /SileNole/i }));

    // Ir a editar catálogo y renombrar el Equipo A -> "Equipo Renombrado".
    fireEvent.click(await screen.findByRole('button', { name: /editar cat/i }));
    const nuevo = coleccionEjemplo();
    nuevo.categorias[0].nombre = 'Equipo Renombrado';
    fireEvent.change(screen.getByRole('textbox'), { target: { value: JSON.stringify(nuevo) } });
    fireEvent.click(screen.getByRole('button', { name: /validar y guardar/i }));
    expect(await screen.findByText(/guardado/i)).toBeInTheDocument();

    // El cambio se refleja y el progreso se conserva (1 de 3).
    fireEvent.click(screen.getByRole('button', { name: /SileNole/i }));
    await waitFor(() => expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1'));
    fireEvent.click(screen.getByRole('button', { name: /equipos/i }));
    expect(await screen.findByText('Equipo Renombrado')).toBeInTheDocument();
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

  it('activa la sincronización y sube el progreso local a la nube (HU-09)', async () => {
    const local = new RepositorioEnMemoria();
    const remoto = new RepositorioEnMemoria();
    render(<App repo={local} cargarSemilla={semilla} crearRemoto={() => remoto} />);
    await screen.findByRole('progressbar');

    // Marcar el cromo 1 (Equipo A) y volver al inicio.
    fireEvent.click(screen.getByRole('button', { name: /equipos/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Equipo A/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Cromo 1(,|$)/i }));
    fireEvent.click(screen.getByRole('button', { name: /SileNole/i }));

    // Ir a Sincronizar y activar (genera un código).
    fireEvent.click(await screen.findByRole('button', { name: /sincronizar/i }));
    fireEvent.click(await screen.findByRole('button', { name: /activar/i }));

    // El auto-sync sube el estado local a la nube.
    await waitFor(async () =>
      expect((await remoto.cargarEstados()).some((e) => e.numero === '1' && e.tenido)).toBe(true),
    );
  });

  it('con un código emparejado, al arrancar baja lo de la nube y lo fusiona', async () => {
    const local = new RepositorioEnMemoria();
    const remoto = new RepositorioEnMemoria();
    // La nube ya tiene el cromo 2 marcado (de otro dispositivo).
    await remoto.guardarEstado({ numero: '2', tenido: true, repes: 0, actualizado: '2026-08-09T10:00:00.000Z' });
    // Este dispositivo ya está emparejado.
    localStorage.setItem('silenole:codigo', '33333333-3333-4333-8333-333333333333');

    render(<App repo={local} cargarSemilla={semilla} crearRemoto={() => remoto} />);

    // Tras el sync de arranque, el progreso local refleja el cromo 2 de la nube.
    await waitFor(() => expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1'));
  });
});

describe('App — sincronización en tiempo real (HU-09, ADR-010)', () => {
  const CODIGO = '55555555-5555-4555-8555-555555555555';

  /** Doble del canal: captura el callback de recepción y cuenta las emisiones. */
  function canalFalso() {
    const estado = { recibir: null as null | (() => void), emit: 0, cerrado: false };
    const crear: CrearCanal = (_codigo, alRecibir) => {
      estado.recibir = alRecibir;
      return {
        emitir: () => {
          estado.emit++;
        },
        cerrar: () => {
          estado.cerrado = true;
        },
      };
    };
    return { estado, crear };
  }

  it('sube un cambio local automáticamente y avisa por el canal (sin pulsar nada)', async () => {
    localStorage.setItem('silenole:codigo', CODIGO);
    const local = new RepositorioEnMemoria();
    const remoto = new RepositorioEnMemoria();
    const canal = canalFalso();
    render(
      <App
        repo={local}
        cargarSemilla={semilla}
        crearRemoto={() => remoto}
        crearCanal={canal.crear}
        retardoSyncMs={10}
      />,
    );
    await screen.findByRole('progressbar');

    // Marcar el cromo 1 SIN ir a la pantalla de Sincronizar.
    fireEvent.click(screen.getByRole('button', { name: /equipos/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Equipo A/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Cromo 1(,|$)/i }));

    // Se sube solo a la nube (auto-push tras el retardo)...
    await waitFor(async () =>
      expect((await remoto.cargarEstados()).some((e) => e.numero === '1' && e.tenido)).toBe(true),
    );
    // ...y se emite el aviso de tiempo real a los demás dispositivos.
    await waitFor(() => expect(canal.estado.emit).toBeGreaterThan(0));
  });

  it('baja un cambio remoto al recibir un aviso, sin pulsar nada', async () => {
    localStorage.setItem('silenole:codigo', CODIGO);
    const local = new RepositorioEnMemoria();
    const remoto = new RepositorioEnMemoria();
    const canal = canalFalso();
    render(
      <App
        repo={local}
        cargarSemilla={semilla}
        crearRemoto={() => remoto}
        crearCanal={canal.crear}
        retardoSyncMs={10}
      />,
    );
    await waitFor(() =>
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0'),
    );
    // El canal ya está suscrito (tenemos el callback de recepción).
    await waitFor(() => expect(canal.estado.recibir).not.toBeNull());

    // Otro dispositivo marca el cromo 1 en la nube y emite el aviso.
    await remoto.guardarEstado({
      numero: '1',
      tenido: true,
      repes: 0,
      actualizado: '2026-08-11T12:00:00.000Z',
    });
    await act(async () => {
      canal.estado.recibir!();
    });

    // La app baja y fusiona el cambio automáticamente (progreso pasa a 1).
    await waitFor(() =>
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1'),
    );
  });
});
