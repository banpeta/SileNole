import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { coleccionEjemplo, mapaDe, tengo } from '../test/fixtures';
import { PantallaInicio } from './PantallaInicio';
import { ListaCategorias } from './ListaCategorias';
import { DetalleCategoria } from './DetalleCategoria';
import { PantallaFaltan } from './PantallaFaltan';

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
      />,
    );
    expect(screen.getByText(/1/)).toBeInTheDocument();
    const barra = screen.getByRole('progressbar');
    expect(barra).toHaveAttribute('aria-valuenow', '1');
    expect(barra).toHaveAttribute('aria-valuemax', '3');
  });

  it('los botones navegan a categorías y a faltan', () => {
    const onVerCategorias = vi.fn();
    const onVerFaltan = vi.fn();
    render(
      <PantallaInicio
        coleccion={coleccionEjemplo()}
        estados={mapaDe()}
        onVerCategorias={onVerCategorias}
        onVerFaltan={onVerFaltan}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /equipos/i }));
    fireEvent.click(screen.getByRole('button', { name: /faltan/i }));
    expect(onVerCategorias).toHaveBeenCalledOnce();
    expect(onVerFaltan).toHaveBeenCalledOnce();
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
    render(<DetalleCategoria categoria={cat} estados={mapaDe()} onToggle={noop} onVolver={noop} />);
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
        onVolver={noop}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Cromo 2/i }));
    expect(onToggle).toHaveBeenCalledWith('2');
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
