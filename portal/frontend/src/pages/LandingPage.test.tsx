import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LandingPage } from './LandingPage';
import { AuthProvider } from '@/lib/auth';

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  );
}

describe('LandingPage', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('presenta las secciones en orden y no llama a la API', () => {
    render(<LandingPage />, { wrapper: Wrapper });

    const headings = screen.getAllByRole('heading').map((node) => node.textContent);
    expect(headings).toEqual([
      'NEUBAT',
      'Propuesta',
      'Características',
      'Funcionalidades',
      'Roadmap',
      'Cierre',
    ]);
    expect(screen.getByRole('link', { name: /Configurar instalación/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Descargar ISO/i })).toBeInTheDocument();
    expect(screen.getByText(/sigue necesitando el portal/i)).toBeInTheDocument();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
