import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { HomePage } from './HomePage';

function Wrapper({ children }: { children: React.ReactNode }) {
  return <BrowserRouter>{children}</BrowserRouter>;
}

describe('HomePage', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza el formulario y la lista de instalaciones', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { token: 'abc123', profile: 'base', status: 'pending', created_at: new Date().toISOString() },
      ],
    });

    render(<HomePage />, { wrapper: Wrapper });

    expect(screen.getByRole('button', { name: /Generar instalación/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('base')).toBeInTheDocument();
    });
  });

  it('crea una instalación y muestra resultados', async () => {
    (globalThis.fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          token: 'tokentest',
          machine_id: 'machine1',
          config_url: '/api/config/tokentest',
          boot_url: '/boot/tokentest',
          message: 'Creada',
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(<HomePage />, { wrapper: Wrapper });

    const button = screen.getByRole('button', { name: /Generar instalación/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('URL de arranque iPXE')).toBeInTheDocument();
      expect(screen.getByText(/boot\/tokentest/i)).toBeInTheDocument();
    });
  });
});
