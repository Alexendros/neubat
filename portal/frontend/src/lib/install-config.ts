import type { InstallRequest } from '@/types';

export function installJsonFilename(body: InstallRequest) {
  const raw = (body.hostname || 'config').toLowerCase();
  const safe = raw.replace(/[^a-z0-9-]+/g, '').replace(/^-+|-+$/g, '') || 'config';
  return `neubat-${safe}.json`;
}

export function installJsonText(body: InstallRequest) {
  return `${JSON.stringify(body, null, 2)}\n`;
}

/** Descarga el cuerpo de instalación en el navegador, sin POST ni Express. */
export function downloadInstallJson(body: InstallRequest, doc: Document = document) {
  const blob = new Blob([installJsonText(body)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = doc.createElement('a');
  a.href = url;
  a.download = installJsonFilename(body);
  a.rel = 'noopener';
  doc.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
