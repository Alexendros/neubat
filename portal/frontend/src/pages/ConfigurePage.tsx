import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { InstallRequest, InstallResponse, Recommendation } from '@/types';
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
import { CheckCircle, Copy, History, Shield, Terminal } from 'lucide-react';

const DESKTOPS = [
  { value: 'none', label: 'Sin escritorio' },
  { value: 'kde', label: 'KDE Plasma' },
  { value: 'gnome', label: 'GNOME' },
  { value: 'xfce', label: 'Xfce' },
  { value: 'hyprland', label: 'Hyprland' },
  { value: 'sway', label: 'Sway' },
  { value: 'i3', label: 'i3' },
  { value: 'niri', label: 'niri' },
];

const PACKAGE_GROUPS: Record<string, string[]> = {
  base: ['base-devel', 'git', 'vim', 'htop', 'reflector'],
  red: ['networkmanager', 'openssh', 'wireguard-tools'],
  desarrollo: ['nodejs', 'npm', 'python', 'go', 'rust'],
  multimedia: ['firefox', 'vlc', 'pipewire', 'wireplumber'],
};

export function ConfigurePage() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<InstallResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enableEncryption, setEnableEncryption] = useState(true);
  const [encryptionMethod, setEncryptionMethod] = useState<'keyfile' | 'prompt'>('keyfile');
  const [enableSnapshots, setEnableSnapshots] = useState(true);
  const [desktop, setDesktop] = useState('kde');
  const [selectedPackages, setSelectedPackages] = useState<string[]>(['git', 'htop']);
  const [packageQuery, setPackageQuery] = useState('');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [saveName, setSaveName] = useState('');

  useEffect(() => {
    api.recommendations().then((r) => setRecommendations(r.recommendations)).catch(() => {});
  }, []);

  const catalog = useMemo(() => Object.values(PACKAGE_GROUPS).flat(), []);
  const filteredCatalog = catalog.filter((p) => p.includes(packageQuery.toLowerCase()));

  function togglePackage(pkg: string) {
    setSelectedPackages((prev) =>
      prev.includes(pkg) ? prev.filter((x) => x !== pkg) : [...prev, pkg]
    );
  }

  function applyRecommendation(rec: Recommendation) {
    if (rec.desktop) setDesktop(rec.desktop);
    if (rec.packages?.length) setSelectedPackages(rec.packages);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    const form = new FormData(e.currentTarget);
    const extra = ((form.get('packages_extra') as string) || '')
      .split(/\s+/)
      .filter(Boolean);
    const body: InstallRequest = {
      profile: (form.get('profile') as string) || 'base',
      hostname: (form.get('hostname') as string) || undefined,
      username: (form.get('username') as string) || undefined,
      desktop,
      packages: [...new Set([...selectedPackages, ...extra])],
      locale: (form.get('locale') as string) || 'es_ES.UTF-8',
      keyboard: (form.get('keyboard') as string) || 'es',
      timezone: (form.get('timezone') as string) || 'Europe/Madrid',
    };
    if (enableEncryption) {
      body.encryption = {
        enabled: true,
        method: encryptionMethod === 'prompt' ? 'interactive' : 'keyfile',
      };
    }
    if (enableSnapshots) body.snapshots = { enabled: true };

    try {
      const data = await api.install(body);
      setResult(data);
      if (user && saveName.trim()) {
        await api.saveConfig({ name: saveName.trim(), ...body });
      }
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
      <section className="lg:col-span-2 space-y-6" aria-labelledby="config-heading">
        <div className="space-y-2">
          <h1 id="config-heading" className="text-3xl font-bold tracking-tight">
            Configurar instalación
          </h1>
          <p className="text-muted-foreground">
            Elige escritorio, paquetes y opciones. Genera una URL iPXE o guarda el perfil en tu cuenta.
          </p>
          {!user && (
            <p className="text-sm text-muted-foreground" role="status">
              Puedes generar una instalación sin sesión.{' '}
              <Link className="text-primary underline-offset-4 hover:underline" to="/cuenta">
                Inicia sesión
              </Link>{' '}
              para guardar configuraciones y absorciones.
            </p>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-primary" aria-hidden />
              Formulario
            </CardTitle>
            <CardDescription>Los campos alimentan archinstall y los scripts NEUBAT.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profile">Perfil base</Label>
                  <Select name="profile" defaultValue="production">
                    <SelectTrigger id="profile">
                      <SelectValue placeholder="Perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Producción</SelectItem>
                      <SelectItem value="developer">Desarrollo</SelectItem>
                      <SelectItem value="base">Base</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desktop">Escritorio / WM</Label>
                  <Select value={desktop} onValueChange={setDesktop}>
                    <SelectTrigger id="desktop">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DESKTOPS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hostname">Hostname</Label>
                  <Input id="hostname" name="hostname" placeholder="mi-equipo" pattern="[a-z0-9-]+" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Usuario</Label>
                  <Input id="username" name="username" placeholder="neubat" pattern="[a-z_][a-z0-9_-]*" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="locale">Locale</Label>
                  <Input id="locale" name="locale" defaultValue="es_ES.UTF-8" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keyboard">Teclado</Label>
                  <Input id="keyboard" name="keyboard" defaultValue="es" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona horaria</Label>
                  <Input id="timezone" name="timezone" defaultValue="Europe/Madrid" />
                </div>
              </div>

              <fieldset className="space-y-3 rounded-md border border-border p-4">
                <legend className="px-1 text-sm font-medium">Paquetes del repositorio</legend>
                <Label htmlFor="pkg-search">Buscar</Label>
                <Input
                  id="pkg-search"
                  value={packageQuery}
                  onChange={(e) => setPackageQuery(e.target.value)}
                  placeholder="firefox, git…"
                />
                <div className="flex flex-wrap gap-2" role="group" aria-label="Catálogo de paquetes">
                  {filteredCatalog.map((pkg) => {
                    const on = selectedPackages.includes(pkg);
                    return (
                      <Button
                        key={pkg}
                        type="button"
                        size="sm"
                        variant={on ? 'default' : 'outline'}
                        aria-pressed={on}
                        onClick={() => togglePackage(pkg)}
                      >
                        {pkg}
                      </Button>
                    );
                  })}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packages_extra">Paquetes adicionales (espacio)</Label>
                  <Input id="packages_extra" name="packages_extra" placeholder="btop ripgrep" />
                </div>
              </fieldset>

              <div className="rounded-md border border-border bg-secondary/30 p-4 space-y-4">
                <h2 className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" aria-hidden />
                  Opciones avanzadas
                </h2>
                <div className="flex items-start gap-3">
                  <input
                    id="enable-encryption"
                    type="checkbox"
                    checked={enableEncryption}
                    onChange={(e) => setEnableEncryption(e.target.checked)}
                    className="mt-1 h-4 w-4"
                  />
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="enable-encryption" className="font-normal">
                      Cifrar disco con LUKS2
                    </Label>
                    {enableEncryption && (
                      <Select
                        value={encryptionMethod}
                        onValueChange={(v) => setEncryptionMethod(v as 'keyfile' | 'prompt')}
                      >
                        <SelectTrigger className="w-full sm:w-64" aria-label="Método de cifrado">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="keyfile">Keyfile en /boot</SelectItem>
                          <SelectItem value="prompt">Frase interactiva al arrancar</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <input
                    id="enable-snapshots"
                    type="checkbox"
                    checked={enableSnapshots}
                    onChange={(e) => setEnableSnapshots(e.target.checked)}
                    className="mt-1 h-4 w-4"
                  />
                  <Label htmlFor="enable-snapshots" className="font-normal flex items-center gap-2">
                    <History className="h-3.5 w-3.5" aria-hidden />
                    Snapshots btrfs
                  </Label>
                </div>
              </div>

              {user && (
                <div className="space-y-2">
                  <Label htmlFor="save-name">Guardar en mi cuenta como (opcional)</Label>
                  <Input
                    id="save-name"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="mi-laptop-hyprland"
                  />
                </div>
              )}

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Generando…' : 'Generar instalación'}
              </Button>
            </form>

            {error && (
              <div role="alert" className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {result && (
              <div role="status" className="mt-4 space-y-3 rounded-md border border-primary/30 bg-primary/10 p-4">
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle className="h-5 w-5" aria-hidden />
                  <span className="font-medium">Instalación creada</span>
                </div>
                <CopyField label="Token" value={result.token} onCopy={copy} />
                <CopyField label="URL de arranque iPXE" value={base + result.boot_url} onCopy={copy} />
                <CopyField label="URL de configuración" value={base + result.config_url} onCopy={copy} />
                <p className="text-sm text-muted-foreground">
                  También puedes{' '}
                  <Link className="text-primary underline-offset-4 hover:underline" to="/descargar">
                    descargar la ISO
                  </Link>{' '}
                  con verificación de hash.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <aside className="space-y-6" aria-label="Recomendaciones">
        <Card>
          <CardHeader>
            <CardTitle>Recomendaciones del equipo</CardTitle>
            <CardDescription>Perfiles curados como punto de partida.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map((rec) => (
              <div key={rec.id} className="rounded-md border border-border p-3">
                <h3 className="font-medium">{rec.title}</h3>
                <p className="text-xs text-muted-foreground">{rec.description}</p>
                <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => applyRecommendation(rec)}>
                  Aplicar
                </Button>
              </div>
            ))}
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
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onCopy(value)} aria-label={`Copiar ${label}`}>
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
