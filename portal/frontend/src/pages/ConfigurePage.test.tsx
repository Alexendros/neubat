import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ConfigurePage } from './ConfigurePage';
import { AuthProvider } from '@/lib/auth';

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/configurar']}>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  );
}

describe('ConfigurePage', () => {
  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:neubat');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('descarga el JSON sin POST /api/install', async () => {
    render(<ConfigurePage />, { wrapper: Wrapper });
    await userEvent.click(screen.getByRole('button', { name: 'Descargar JSON' }));

    const posts = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.filter((call) => {
      const init = call[1] as RequestInit | undefined;
      return init?.method === 'POST' && String(call[0]).includes('/api/install');
    });
    expect(posts).toHaveLength(0);
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(screen.getAllByText(/Instalar por iPXE sigue exigiendo el portal/i).length).toBeGreaterThan(0);
  });

  it('Servidor mínimo anuncia que el disco no va cifrado', async () => {
    render(<ConfigurePage />, { wrapper: Wrapper });
    await userEvent.click(screen.getByRole('radio', { name: /Servidor mínimo/i }));
    expect(screen.getByText(/no irá cifrado/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Cifrar disco/i })).not.toBeChecked();
  });

  it('Uso diario deja el cifrado marcado', async () => {
    render(<ConfigurePage />, { wrapper: Wrapper });
    expect(screen.getByRole('radio', { name: /Uso diario/i })).toBeChecked();
    expect(await screen.findByRole('checkbox', { name: /Cifrar disco/i })).toBeChecked();
  });

  it('si el portal no responde, pasa a modo local', async () => {
    render(<ConfigurePage />, { wrapper: Wrapper });
    await userEvent.click(screen.getByRole('button', { name: /Generar instalación/i }));

    await waitFor(() => {
      expect(screen.getByText(/Modo local/i)).toBeInTheDocument();
    });
    expect(URL.createObjectURL).toHaveBeenCalled();
  });
});
