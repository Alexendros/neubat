import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LandingPage } from './LandingPage';
import { AuthProvider } from '@/lib/auth';

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BrowserRouter>{children}</BrowserRouter>
    </AuthProvider>
  );
}

describe('LandingPage', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('presenta el producto y enlaces principales', () => {
    render(<LandingPage />, { wrapper: Wrapper });
    expect(screen.getByRole('heading', { name: /NEUBAT: tu Arch/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Configurar instalación/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Descargar ISO/i })).toBeInTheDocument();
  });
});
