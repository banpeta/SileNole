import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RepositorioIndexedDB } from '../data/repositorioIndexedDB';
import type { ColeccionRepository } from '../data/repositorio';
import { RepositorioCompuesto } from '../data/repositorioCompuesto';
import { crearRepositorioSupabase, crearCanalSupabase } from '../data/supabaseCliente';
import type { CanalTiempoReal, CrearCanal } from '../data/tiempoReal';
import {
  generarCodigo,
  guardarCodigo,
  leerCodigo,
  normalizarCodigo,
} from '../data/codigoColeccion';
import { cargarSemillaDesdePublic, type CargarSemilla } from './servicio';
import { useSileNole } from './useSileNole';
import { PantallaInicio } from '../ui/PantallaInicio';
import { ListaCategorias } from '../ui/ListaCategorias';
import { DetalleCategoria } from '../ui/DetalleCategoria';
import { PantallaFaltan } from '../ui/PantallaFaltan';
import { PantallaParaCambiar } from '../ui/PantallaParaCambiar';
import { PantallaEditarCatalogo } from '../ui/PantallaEditarCatalogo';
import { PantallaSincronizar } from '../ui/PantallaSincronizar';

type Vista =
  | { nombre: 'inicio' }
  | { nombre: 'categorias' }
  | { nombre: 'detalle'; categoriaId: string }
  | { nombre: 'faltan' }
  | { nombre: 'cambiar' }
  | { nombre: 'editar' }
  | { nombre: 'sincronizar' };

/**
 * Construye el repositorio remoto para un código (inyectable para tests).
 * Puede ser síncrono (tests) o asíncrono (Supabase, que se carga de forma
 * diferida): la app acepta ambos.
 */
export type CrearRemoto = (
  codigo: string,
) => (ColeccionRepository | null) | Promise<ColeccionRepository | null>;

interface Props {
  /** Repositorio LOCAL de datos. Por defecto IndexedDB (inyectable para tests). */
  repo?: ColeccionRepository;
  /** Origen de la semilla del catálogo (inyectable para tests). */
  cargarSemilla?: CargarSemilla;
  /** Fábrica del repositorio remoto (por defecto Supabase; inyectable para tests). */
  crearRemoto?: CrearRemoto;
  /** Fábrica del canal de tiempo real (por defecto Supabase; inyectable para tests). */
  crearCanal?: CrearCanal;
  /** Retardo (ms) del auto-sync tras un cambio local. Bajarlo en tests. */
  retardoSyncMs?: number;
}

export function App({
  repo,
  cargarSemilla = cargarSemillaDesdePublic,
  crearRemoto = crearRepositorioSupabase,
  crearCanal = crearCanalSupabase,
  retardoSyncMs = 800,
}: Props = {}) {
  const local = useMemo(() => repo ?? new RepositorioIndexedDB(), [repo]);
  const [codigo, setCodigo] = useState<string | null>(() => leerCodigo());
  const [remoto, setRemoto] = useState<ColeccionRepository | null>(null);

  // El remoto (Supabase) se construye de forma asíncrona porque su cliente se
  // carga de forma diferida. Sin código, no hay remoto.
  useEffect(() => {
    let vivo = true;
    if (!codigo) {
      setRemoto(null);
      return;
    }
    Promise.resolve(crearRemoto(codigo)).then((r) => {
      if (vivo) setRemoto(r);
    });
    return () => {
      vivo = false;
    };
  }, [codigo, crearRemoto]);

  // La app siempre habla con un repositorio compuesto (local + remoto opcional).
  // Sin remoto, el compuesto es transparente (modo local).
  const repositorio = useMemo(
    () => new RepositorioCompuesto(local, remoto),
    [local, remoto],
  );

  const canalRef = useRef<CanalTiempoReal | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Callback estable que useSileNole invoca en cada cambio del usuario; apunta
  // (vía ref) a la auto-subida, definida más abajo.
  const alCambioLocalRef = useRef<() => void>(() => {});

  const { cargando, error, coleccion, estados, alternar, ajustarRepes, importarCatalogo, recargar } =
    useSileNole(repositorio, cargarSemilla, () => alCambioLocalRef.current());
  const [vista, setVista] = useState<Vista>({ nombre: 'inicio' });
  const [sincronizando, setSincronizando] = useState(false);
  const [pendiente, setPendiente] = useState(false);

  const sincronizar = useCallback(
    async (opciones?: { emitir?: boolean }) => {
      if (!codigo) return;
      setSincronizando(true);
      try {
        await repositorio.sincronizar();
        await recargar();
        // Avisar a los demás dispositivos solo cuando el disparo es local.
        if (opciones?.emitir) canalRef.current?.emitir();
      } finally {
        setPendiente(repositorio.pendiente);
        setSincronizando(false);
      }
    },
    [codigo, repositorio, recargar],
  );

  // Auto-subida: tras un cambio del usuario, sube (con retardo para agrupar
  // toques seguidos) y emite el aviso de tiempo real.
  const programarPush = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void sincronizar({ emitir: true }), retardoSyncMs);
  }, [sincronizar, retardoSyncMs]);
  useEffect(() => {
    alCambioLocalRef.current = programarPush;
  }, [programarPush]);
  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  // Sincroniza al arrancar (si hay código) y al recuperar la red (sin emitir).
  useEffect(() => {
    if (!codigo) return;
    void sincronizar();
    const alReconectar = () => void sincronizar();
    window.addEventListener('online', alReconectar);
    return () => window.removeEventListener('online', alReconectar);
  }, [codigo, sincronizar]);

  // Tiempo real: suscripción al canal del código. Al recibir un aviso de otro
  // dispositivo, baja los cambios (sin volver a emitir, para no hacer bucle).
  useEffect(() => {
    if (!codigo || !remoto) return;
    let vivo = true;
    let canal: CanalTiempoReal | null = null;
    Promise.resolve(crearCanal(codigo, () => void sincronizar({ emitir: false }))).then((c) => {
      if (!vivo) {
        c?.cerrar();
        return;
      }
      canal = c;
      canalRef.current = c;
    });
    return () => {
      vivo = false;
      canal?.cerrar();
      canalRef.current = null;
    };
  }, [codigo, remoto, crearCanal, sincronizar]);

  const activarSync = useCallback(() => {
    const nuevo = generarCodigo();
    guardarCodigo(nuevo);
    setCodigo(nuevo);
  }, []);

  const emparejar = useCallback((entrada: string) => {
    const normalizado = normalizarCodigo(entrada);
    guardarCodigo(normalizado);
    setCodigo(normalizado);
  }, []);

  return (
    <div className="app">
      <header className="cabecera">
        <button className="titulo" onClick={() => setVista({ nombre: 'inicio' })}>
          SileNole
        </button>
      </header>
      <main>
        {error && <p className="error">No se pudo cargar la colección: {error}</p>}
        {cargando && !error && <p className="cargando">Cargando…</p>}
        {!cargando && coleccion && (
          <>
            {vista.nombre === 'inicio' && (
              <PantallaInicio
                coleccion={coleccion}
                estados={estados}
                onVerCategorias={() => setVista({ nombre: 'categorias' })}
                onVerFaltan={() => setVista({ nombre: 'faltan' })}
                onVerCambiar={() => setVista({ nombre: 'cambiar' })}
                onVerEditar={() => setVista({ nombre: 'editar' })}
                onVerSincronizar={() => setVista({ nombre: 'sincronizar' })}
              />
            )}
            {vista.nombre === 'categorias' && (
              <ListaCategorias
                coleccion={coleccion}
                estados={estados}
                onAbrir={(categoriaId) => setVista({ nombre: 'detalle', categoriaId })}
                onVolver={() => setVista({ nombre: 'inicio' })}
              />
            )}
            {vista.nombre === 'detalle' &&
              (() => {
                const categoria = coleccion.categorias.find((c) => c.id === vista.categoriaId);
                if (!categoria) return null;
                return (
                  <DetalleCategoria
                    categoria={categoria}
                    estados={estados}
                    onToggle={alternar}
                    onAjustarRepes={ajustarRepes}
                    onVolver={() => setVista({ nombre: 'categorias' })}
                  />
                );
              })()}
            {vista.nombre === 'faltan' && (
              <PantallaFaltan
                coleccion={coleccion}
                estados={estados}
                onVolver={() => setVista({ nombre: 'inicio' })}
              />
            )}
            {vista.nombre === 'cambiar' && (
              <PantallaParaCambiar
                coleccion={coleccion}
                estados={estados}
                onVolver={() => setVista({ nombre: 'inicio' })}
              />
            )}
            {vista.nombre === 'editar' && (
              <PantallaEditarCatalogo
                coleccion={coleccion}
                onImportar={importarCatalogo}
                onVolver={() => setVista({ nombre: 'inicio' })}
              />
            )}
            {vista.nombre === 'sincronizar' && (
              <PantallaSincronizar
                codigo={codigo}
                sincronizando={sincronizando}
                pendiente={pendiente}
                onActivar={activarSync}
                onEmparejar={emparejar}
                onSincronizar={() => void sincronizar({ emitir: true })}
                onVolver={() => setVista({ nombre: 'inicio' })}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
