import type { HealthResponse, InstallRequest, InstallResponse, Installation } from '@/types';

const API_BASE = '';

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Error ${res.status}`);
  }
  return data as T;
}

export const api = {
  health: () => fetchJson<HealthResponse>('/api/health'),

  install: (body: InstallRequest) =>
    fetchJson<InstallResponse>('/api/install', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  installations: () => fetchJson<Installation[]>('/api/installations'),

  complete: (token: string, status: Installation['status'], hostname?: string) =>
    fetchJson<{ success: boolean }>('/api/complete', {
      method: 'POST',
      body: JSON.stringify({ token, status, hostname }),
    }),

  updateStatus: (token: string, status: Installation['status'], adminToken: string) =>
    fetchJson<{ success: boolean }>(`/api/admin/installations/${token}/status`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status }),
    }),

  delete: (token: string, adminToken: string) =>
    fetchJson<{ success: boolean }>(`/api/admin/installations/${token}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    }),

  reset: (token: string, adminToken: string) =>
    fetchJson<{ success: boolean }>(`/api/admin/installations/${token}/reset`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    }),
};
