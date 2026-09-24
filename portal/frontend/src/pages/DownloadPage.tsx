import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { ReleaseInfo } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, ShieldCheck } from 'lucide-react';

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function parseSha256File(text: string, fileNameHint: string): string | null {
  const lines = text.trim().split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^([0-9a-f]{64})\s+\*?(\S+)/i);
    if (m) {
      if (!fileNameHint || m[2].includes(fileNameHint) || m[2].endsWith('.iso')) {
        return m[1].toLowerCase();
      }
    }
    const only = line.trim().match(/^[0-9a-f]{64}$/i);
    if (only) return only[0].toLowerCase();
  }
  return null;
}

export function DownloadPage() {
  const [releases, setReleases] = useState<ReleaseInfo | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.releases().then(setReleases).catch((err) => setError(err.message));
  }, []);

  async function downloadVerified(isoUrl: string, shaUrl: string, fileName: string) {
    setBusy(true);
    setError(null);
    setStatus('Descargando suma de verificación…');
    try {
      const shaRes = await fetch(shaUrl);
      if (!shaRes.ok) throw new Error(`No se pudo obtener el hash (${shaRes.status})`);
      const shaText = await shaRes.text();
      const expected = parseSha256File(shaText, fileName);
      if (!expected) throw new Error('No se encontró un SHA-256 válido en el fichero de sumas');

      setStatus('Descargando ISO… esto puede tardar');
      const isoRes = await fetch(isoUrl);
      if (!isoRes.ok) throw new Error(`Descarga de ISO fallida (${isoRes.status})`);
      const buffer = await isoRes.arrayBuffer();

      setStatus('Comprobando SHA-256…');
      const actual = await sha256Hex(buffer);
      if (actual !== expected) {
        throw new Error(`Hash no coincide. Esperado ${expected.slice(0, 12)}…, obtenido ${actual.slice(0, 12)}…`);
      }

      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('ISO verificada y guardada.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la descarga');
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Descargar ISO</h1>
        <p className="text-muted-foreground">
          El navegador descarga el fichero, calcula SHA-256 con <code>crypto.subtle</code> y solo entonces
          ofrece guardarlo. No hace falta ejecutar <code>sha256sum</code> a mano.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {status && (
        <p role="status" className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm">
          {status}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
            ISO NEUBAT (híbrida autoinstalable)
          </CardTitle>
          <CardDescription>
            Incluye el hook de autoinstalación. Versión {releases?.neubat.version || '…'}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            disabled={busy || !releases}
            onClick={() =>
              releases &&
              downloadVerified(
                releases.neubat.iso_url,
                releases.neubat.sha256_url,
                `neubat-${releases.neubat.version}-x86_64.iso`
              )
            }
          >
            <Download className="mr-2 h-4 w-4" aria-hidden />
            Descargar y verificar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ISO oficial Arch Linux</CardTitle>
          <CardDescription>
            Base del live. Útil para instalación manual con los scripts; el hash se toma del mirror oficial.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            disabled={busy || !releases}
            onClick={() =>
              releases &&
              downloadVerified(releases.arch.iso_url, releases.arch.sha256_url, 'archlinux-x86_64.iso')
            }
          >
            <Download className="mr-2 h-4 w-4" aria-hidden />
            Descargar Arch y verificar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
