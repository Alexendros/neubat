import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { HomePage } from './HomePage';
import { AuthProvider } from '@/lib/auth';

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BrowserRouter>{children}</BrowserRouter>
    </AuthProvider>
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Sin sesión' }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza el formulario de instalación', () => {
    render(<HomePage />, { wrapper: Wrapper });

    expect(screen.getByRole('button', { name: /Generar instalación/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Nueva instalación/i })).toBeInTheDocument();
    expect(screen.queryByText(/Instalaciones recientes/i)).not.toBeInTheDocument();
  });

  it('crea una instalación y muestra resultados', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Sin sesión' }),
      })
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
      });

    render(<HomePage />, { wrapper: Wrapper });

    const button = screen.getByRole('button', { name: /Generar instalación/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('URL de arranque iPXE')).toBeInTheDocument();
      expect(screen.getByText(/boot\/tokentest/i)).toBeInTheDocument();
    });

    const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
    const postCall = calls.find((c: unknown[]) => (c[1] as RequestInit | undefined)?.method === 'POST');
    expect(postCall).toBeTruthy();
    const body = JSON.parse((postCall![1] as RequestInit).body as string);
    expect(body.encryption).toEqual({ enabled: true, method: 'keyfile' });
    expect(body.snapshots).toEqual({ enabled: true });
  });
});
