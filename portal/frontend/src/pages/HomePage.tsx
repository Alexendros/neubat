import { useState } from 'react';
import { api } from '@/lib/api';
import type { InstallRequest, InstallResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, Copy, Terminal, Wifi, Shield, History } from 'lucide-react';

export function HomePage() {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<InstallResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enableEncryption, setEnableEncryption] = useState(true);
  const [encryptionMethod, setEncryptionMethod] = useState<'keyfile' | 'passphrase'>('keyfile');
  const [enableSnapshots, setEnableSnapshots] = useState(true);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    const form = new FormData(e.currentTarget);
    const body: InstallRequest = {
      profile: form.get('profile') as string,
      hostname: (form.get('hostname') as string) || undefined,
      username: (form.get('username') as string) || undefined,
      packages: (form.get('packages') as string)
        .split(/\s+/)
        .filter(Boolean),
    };

    if (enableEncryption) {
      body.encryption = { enabled: true, method: encryptionMethod };
    }
    if (enableSnapshots) {
      body.snapshots = { enabled: true };
    }

    try {
      const data = await api.install(body);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSubmitting(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
  }

  const base = window.location.origin;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <section className="lg:col-span-2 space-y-6" aria-labelledby="install-heading">
        <div className="space-y-2">
          <h2 id="install-heading" className="text-3xl font-bold tracking-tight">
            Nueva instalación
          </h2>
          <p className="text-muted-foreground">
            Configura el sistema, obtén tu URL única y arranca por iPXE. Sin USB, sin intervención.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-cyan-400" />
              Formulario de despliegue
            </CardTitle>
            <CardDescription>Elige perfil, hostname opcional y paquetes extra.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profile">Perfil</Label>
                  <Select name="profile" defaultValue="production">
                    <SelectTrigger id="profile">
                      <SelectValue placeholder="Selecciona perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Producción (KDE + servicios)</SelectItem>
                      <SelectItem value="developer">Desarrollo (GNOME + toolchains)</SelectItem>
                      <SelectItem value="base">Base (mínimo, sin GUI)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hostname">Hostname</Label>
                  <Input id="hostname" name="hostname" placeholder="mi-equipo" pattern="[a-z0-9-]+" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username">Usuario</Label>
                  <Input id="username" name="username" placeholder="neubat" pattern="[a-z_][a-z0-9_-]*" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packages">Paquetes adicionales</Label>
                  <Input id="packages" name="packages" placeholder="htop btop firefox" />
                </div>
              </div>

              <div className="rounded-md border border-border bg-secondary/30 p-4 space-y-4">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-cyan-400" />
                  Opciones avanzadas
                </h3>

                <div className="flex items-start gap-3">
                  <input
                    id="enable-encryption"
                    type="checkbox"
                    checked={enableEncryption}
                    onChange={(e) => setEnableEncryption(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-border bg-background text-cyan-400 focus:ring-cyan-400"
                  />
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="enable-encryption" className="font-normal">
                      Cifrar disco con LUKS2
                    </Label>
                    {enableEncryption && (
                      <Select
                        value={encryptionMethod}
                        onValueChange={(v) => setEncryptionMethod(v as 'keyfile' | 'passphrase')}
                      >
                        <SelectTrigger className="w-full sm:w-64" aria-label="Método de cifrado">
                          <SelectValue placeholder="Método de arranque" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="keyfile">
                            Keyfile en /boot (desatendido)
                          </SelectItem>
                          <SelectItem value="passphrase">
                            Passphrase (más seguro, interactivo)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {enableEncryption
                        ? encryptionMethod === 'keyfile'
                          ? 'Arranque zero-touch. Cambia la llave tras la instalación para mayor seguridad física.'
                          : 'El arranque pedirá la contraseña en cada reinicio. Rompe el despliegue desatendido.'
                        : 'Las particiones raíz y home se formatearán sin cifrado.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    id="enable-snapshots"
                    type="checkbox"
                    checked={enableSnapshots}
                    onChange={(e) => setEnableSnapshots(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-border bg-background text-cyan-400 focus:ring-cyan-400"
                  />
                  <div>
                    <Label htmlFor="enable-snapshots" className="font-normal flex items-center gap-2">
                      <History className="h-3.5 w-3.5" />
                      Snapshots btrfs automáticos
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Instala snapper + snap-pac para snapshots pre/post actualización y rollback.
                    </p>
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Generando...' : 'Generar instalación'}
              </Button>
            </form>

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400"
              >
                {error}
              </div>
            )}

            {result && (
              <div
                role="status"
                className="mt-4 space-y-3 rounded-md border border-emerald-500/20 bg-emerald-500/10 p-4"
              >
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Instalación creada</span>
                </div>
                <CopyField label="Token" value={result.token} onCopy={copy} />
                <CopyField label="URL de arranque iPXE" value={base + result.boot_url} onCopy={copy} />
                <CopyField label="URL de configuración" value={base + result.config_url} onCopy={copy} />
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <aside className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-cyan-400" />
              ¿Cómo arrancar?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Crea una instalación.</p>
            <p>2. Configura iPXE para hacer chain a la URL de arranque.</p>
            <p>3. La máquina descargará el perfil e instalará Arch automáticamente.</p>
            <p>
              Las instalaciones registradas solo son visibles en el{' '}
              <a href="/admin" className="text-primary underline-offset-4 hover:underline">
                panel de administración
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function CopyField({ label, value, onCopy }: { label: string; value: string; onCopy: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2 rounded-md border border-border bg-background p-2">
        <code className="flex-1 truncate text-xs font-mono">{value}</code>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => onCopy(value)}
          aria-label={`Copiar ${label}`}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
