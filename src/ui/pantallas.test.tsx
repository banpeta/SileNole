import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { coleccionEjemplo, mapaDe, tengo } from '../test/fixtures';
import { PantallaInicio } from './PantallaInicio';
import { ListaCategorias } from './ListaCategorias';
import { DetalleCategoria } from './DetalleCategoria';
import { PantallaFaltan } from './PantallaFaltan';
import { PantallaParaCambiar } from './PantallaParaCambiar';
import { PantallaEditarCatalogo } from './PantallaEditarCatalogo';
import { PantallaSincronizar } from './PantallaSincronizar';
import { esCodigoValido } from '../data/codigoColeccion';

/**
 * Tests de las pantallas de consulta y marcado.
 * Fuente: docs/04-especificacion-funcional.md (HU-01 a HU-05).
 * Los componentes son presentacionales: reciben datos y callbacks por props.
 */

const noop = () => {};

describe('PantallaInicio — HU-04', () => {
  it('muestra el progreso total "X de Y"', () => {
    render(
      <PantallaInicio
        coleccion={coleccionEjemplo()}
        estados={mapaDe(tengo('1'))}
        onVerCategorias={noop}
        onVerFaltan={noop}
        onVerCambiar={noop}
        onVerEditar={noop}
        onVerSincronizar={noop}
      />,
    );
    expect(screen.getByText(/1/)).toBeInTheDocument();
    const barra = screen.getByRole('progressbar');
    expect(barra).toHaveAttribute('aria-valuenow', '1');
    expect(barra).toHaveAttribute('aria-valuemax', '3');
  });

  it('los botones navegan a categorías, faltan, cambios y editar', () => {
    const onVerCategorias = vi.fn();
    const onVerFaltan = vi.fn();
    const onVerCambiar = vi.fn();
    const onVerEditar = vi.fn();
    const onVerSincronizar = vi.fn();
    render(
      <PantallaInicio
        coleccion={coleccionEjemplo()}
        estados={mapaDe()}
        onVerCategorias={onVerCategorias}
        onVerFaltan={onVerFaltan}
        onVerCambiar={onVerCambiar}
        onVerEditar={onVerEditar}
        onVerSincronizar={onVerSincronizar}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /equipos/i }));
    fireEvent.click(screen.getByRole('button', { name: /faltan/i }));
    fireEvent.click(screen.getByRole('button', { name: /cambiar/i }));
    fireEvent.click(screen.getByRole('button', { name: /editar cat/i }));
    fireEvent.click(screen.getByRole('button', { name: /sincronizar/i }));
    expect(onVerCategorias).toHaveBeenCalledOnce();
    expect(onVerFaltan).toHaveBeenCalledOnce();
    expect(onVerCambiar).toHaveBeenCalledOnce();
    expect(onVerEditar).toHaveBeenCalledOnce();
    expect(onVerSincronizar).toHaveBeenCalledOnce();
  });
});

describe('ListaCategorias — HU-01', () => {
  it('muestra cada categoría con su progreso', () => {
    render(
      <ListaCategorias
        coleccion={coleccionEjemplo()}
        estados={mapaDe(tengo('1'))}
        onAbrir={noop}
        onVolver={noop}
      />,
    );
    expect(screen.getByText('Equipo A')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument();
    expect(screen.getByText('0/1')).toBeInTheDocument();
  });

  it('marca la categoría completa', () => {
    render(
      <ListaCategorias
        coleccion={coleccionEjemplo()}
        estados={mapaDe(tengo('1'), tengo('2'))}
        onAbrir={noop}
        onVolver={noop}
      />,
    );
    expect(screen.getByLabelText(/completa/i)).toBeInTheDocument();
  });

  it('al pulsar una categoría llama a onAbrir con su id', () => {
    const onAbrir = vi.fn();
    render(
      <ListaCategorias
        coleccion={coleccionEjemplo()}
        estados={mapaDe()}
        onAbrir={onAbrir}
        onVolver={noop}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Equipo A/ }));
    expect(onAbrir).toHaveBeenCalledWith('a');
  });
});

describe('DetalleCategoria — HU-02/HU-03', () => {
  const categoria = coleccionEjemplo().categorias[0];

  it('muestra los cromos, distinguiendo "lo tengo" de "me falta"', () => {
    render(
      <DetalleCategoria
        categoria={categoria}
        estados={mapaDe(tengo('1'))}
        onToggle={noop}
        onAjustarRepes={noop}
        onVolver={noop}
      />,
    );
    expect(screen.getByRole('button', { name: /Cromo 1.*lo tengo/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /Cromo 2.*me falta/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('muestra la etiqueta impresa, no el identificador interno', () => {
    const cat = {
      id: 'x',
      nombre: 'X',
      tipo: 'equipo' as const,
      orden: 1,
      color: null,
      cromos: [{ numero: 'x-18A', etiqueta: '18A', nombre: null, orden: 1 }],
    };
    render(
      <DetalleCategoria
        categoria={cat}
        estados={mapaDe()}
        onToggle={noop}
        onAjustarRepes={noop}
        onVolver={noop}
      />,
    );
    expect(screen.getByRole('button', { name: /Cromo 18A/ })).toBeInTheDocument();
    expect(screen.getByText('18A')).toBeInTheDocument();
    expect(screen.queryByText('x-18A')).not.toBeInTheDocument();
  });

  it('al tocar un cromo llama a onToggle con su número', () => {
    const onToggle = vi.fn();
    render(
      <DetalleCategoria
        categoria={categoria}
        estados={mapaDe()}
        onToggle={onToggle}
        onAjustarRepes={noop}
        onVolver={noop}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Cromo 2(,|$)/i }));
    expect(onToggle).toHaveBeenCalledWith('2');
  });

  // HU-08: gestión de repes
  it('solo muestra el control de repes en los cromos que se tienen', () => {
    render(
      <DetalleCategoria
        categoria={categoria}
        estados={mapaDe(tengo('1'))}
        onToggle={noop}
        onAjustarRepes={noop}
        onVolver={noop}
      />,
    );
    // El cromo 1 (tenido) muestra sus controles de repes; el 2 (falta) no.
    expect(screen.getByRole('button', { name: /añadir un repetido.*1/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /añadir un repetido.*2/i })).not.toBeInTheDocument();
  });

  it('muestra el número de repes y permite sumar y restar', () => {
    const onAjustarRepes = vi.fn();
    render(
      <DetalleCategoria
        categoria={categoria}
        estados={mapaDe(tengo('1', 2))}
        onToggle={noop}
        onAjustarRepes={onAjustarRepes}
        onVolver={noop}
      />,
    );
    expect(screen.getByLabelText(/2 repetidos/i)).toBeInTheDocument(); // repes actuales
    fireEvent.click(screen.getByRole('button', { name: /añadir un repetido/i }));
    expect(onAjustarRepes).toHaveBeenCalledWith('1', 1);
    fireEvent.click(screen.getByRole('button', { name: /quitar un repetido/i }));
    expect(onAjustarRepes).toHaveBeenCalledWith('1', -1);
  });
});

describe('PantallaParaCambiar — HU-08', () => {
  it('lista los cromos con repes, con su cantidad y categoría', () => {
    render(
      <PantallaParaCambiar
        coleccion={coleccionEjemplo()}
        estados={mapaDe(tengo('1', 2), tengo('2', 0))}
        onVolver={noop}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Equipo A' })).toBeInTheDocument();
    // El cromo 1 tiene 2 repes; el 2 tiene 0 y no debe aparecer.
    expect(screen.getByText(/x\s*2/i)).toBeInTheDocument();
  });

  it('muestra un mensaje cuando no hay repes', () => {
    render(
      <PantallaParaCambiar
        coleccion={coleccionEjemplo()}
        estados={mapaDe(tengo('1', 0))}
        onVolver={noop}
      />,
    );
    expect(screen.getByText(/no tienes repes/i)).toBeInTheDocument();
  });
});

describe('PantallaEditarCatalogo — HU-07', () => {
  it('muestra el JSON del catálogo actual en el área de edición', () => {
    render(
      <PantallaEditarCatalogo
        coleccion={coleccionEjemplo()}
        onImportar={() => Promise.resolve({ ok: true })}
        onVolver={noop}
      />,
    );
    const area = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(area.value).toContain('"id": "ejemplo"');
  });

  it('si el texto no es JSON válido, avisa y no llama a onImportar', async () => {
    const onImportar = vi.fn();
    render(
      <PantallaEditarCatalogo
        coleccion={coleccionEjemplo()}
        onImportar={onImportar}
        onVolver={noop}
      />,
    );
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'esto no es json' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    expect(await screen.findByText(/no es un json válido/i)).toBeInTheDocument();
    expect(onImportar).not.toHaveBeenCalled();
  });

  it('con JSON válido llama a onImportar y muestra confirmación', async () => {
    const onImportar = vi.fn().mockResolvedValue({ ok: true });
    render(
      <PantallaEditarCatalogo
        coleccion={coleccionEjemplo()}
        onImportar={onImportar}
        onVolver={noop}
      />,
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: JSON.stringify(coleccionEjemplo()) },
    });
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    expect(await screen.findByText(/guardado/i)).toBeInTheDocument();
    expect(onImportar).toHaveBeenCalledOnce();
  });

  it('si onImportar devuelve errores, los muestra', async () => {
    const onImportar = vi.fn().mockResolvedValue({ ok: false, errores: ['Número duplicado: "5".'] });
    render(
      <PantallaEditarCatalogo
        coleccion={coleccionEjemplo()}
        onImportar={onImportar}
        onVolver={noop}
      />,
    );
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: JSON.stringify(coleccionEjemplo()) },
    });
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    expect(await screen.findByText(/Número duplicado/i)).toBeInTheDocument();
  });
});

describe('PantallaFaltan — HU-05', () => {
  it('lista solo los que faltan, agrupados por categoría', () => {
    render(
      <PantallaFaltan
        coleccion={coleccionEjemplo()}
        estados={mapaDe(tengo('1'))}
        onVolver={noop}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Equipo A' })).toBeInTheDocument();
    expect(screen.getByText(/Jugador Dos/)).toBeInTheDocument();
    expect(screen.queryByText(/Jugador Uno/)).not.toBeInTheDocument();
  });

  it('muestra mensaje de colección completa cuando no falta nada', () => {
    render(
      <PantallaFaltan
        coleccion={coleccionEjemplo()}
        estados={mapaDe(tengo('1'), tengo('2'), tengo('3'))}
        onVolver={noop}
      />,
    );
    expect(screen.getByText(/completa/i)).toBeInTheDocument();
  });
});

describe('PantallaSincronizar — HU-09', () => {
  const props = {
    codigo: null,
    sincronizando: false,
    pendiente: false,
    onActivar: noop,
    onEmparejar: noop,
    onSincronizar: noop,
    onVolver: noop,
  };

  it('sin código, ofrece activar la sincronización', () => {
    const onActivar = vi.fn();
    render(<PantallaSincronizar {...props} onActivar={onActivar} />);
    expect(screen.getByText(/desactivada/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /activar/i }));
    expect(onActivar).toHaveBeenCalledOnce();
  });

  it('con código, lo muestra y permite sincronizar ahora', () => {
    const onSincronizar = vi.fn();
    const codigo = '11111111-1111-4111-8111-111111111111';
    render(
      <PantallaSincronizar {...props} codigo={codigo} onSincronizar={onSincronizar} />,
    );
    expect(screen.getByLabelText(/tu código/i)).toHaveValue(codigo);
    expect(screen.getByText(/al día/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /sincronizar ahora/i }));
    expect(onSincronizar).toHaveBeenCalledOnce();
  });

  it('muestra "pendiente" cuando hay cambios sin subir', () => {
    render(<PantallaSincronizar {...props} codigo="11111111-1111-4111-8111-111111111111" pendiente />);
    expect(screen.getByText(/pendiente/i)).toBeInTheDocument();
  });

  it('rechaza un código con formato inválido y no llama a onEmparejar', () => {
    const onEmparejar = vi.fn();
    render(<PantallaSincronizar {...props} onEmparejar={onEmparejar} />);
    fireEvent.change(screen.getByLabelText(/pegar código/i), { target: { value: 'no-es-uuid' } });
    fireEvent.click(screen.getByRole('button', { name: /emparejar/i }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(onEmparejar).not.toHaveBeenCalled();
  });

  it('empareja con un código válido', () => {
    const onEmparejar = vi.fn();
    const codigo = '22222222-2222-4222-8222-222222222222';
    render(<PantallaSincronizar {...props} onEmparejar={onEmparejar} />);
    fireEvent.change(screen.getByLabelText(/pegar código/i), { target: { value: codigo } });
    fireEvent.click(screen.getByRole('button', { name: /emparejar/i }));
    expect(onEmparejar).toHaveBeenCalledWith(codigo);
    expect(esCodigoValido(codigo)).toBe(true);
  });
});
