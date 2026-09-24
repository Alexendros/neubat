import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { SavedConfig, SystemCopy } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export function AccountPage() {
  const { user, loading, refresh, logout } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [configs, setConfigs] = useState<SavedConfig[]>([]);
  const [copies, setCopies] = useState<SystemCopy[]>([]);
  const [copyNote, setCopyNote] = useState('');
  const [absorbUsage, setAbsorbUsage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api.configs().then((r) => setConfigs(r.configs)).catch(() => {});
    api.copies().then((r) => {
      setCopies(r.copies);
      setCopyNote(r.note);
    }).catch(() => {});
  }, [user]);

  async function submitAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === 'login') await api.login(email, password);
      else await api.register(email, password, displayName || undefined);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación');
    }
  }

  async function createAbsorbCode() {
    const r = await api.absorbCode();
    setAbsorbUsage(r.usage);
  }

  if (loading) {
    return <p role="status">Cargando sesión…</p>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Cuenta NEUBAT</h1>
        <Card>
          <CardHeader>
            <CardTitle>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</CardTitle>
            <CardDescription>
              Guarda configuraciones, copias del sistema y recomendaciones en tu perfil.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitAuth} className="space-y-4">
              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="display">Nombre</Label>
                  <Input id="display" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full">
                {mode === 'login' ? 'Entrar' : 'Registrarme'}
              </Button>
            </form>
            <Button
              type="button"
              variant="link"
              className="mt-2 px-0"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hola, {user.display_name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/configurar">Configurar</Link>
          </Button>
          <Button type="button" variant="ghost" onClick={() => logout()}>
            Cerrar sesión
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuraciones guardadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {configs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay configuraciones.</p>
          ) : (
            configs.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.desktop || c.profile} · {c.packages?.length || 0} paquetes
                  </div>
                </div>
                <Badge variant="outline">{c.profile}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Copias del sistema</CardTitle>
          <CardDescription>{copyNote}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button type="button" onClick={createAbsorbCode}>
            Generar código de absorción
          </Button>
          {absorbUsage && (
            <p className="rounded-md border border-border bg-secondary/40 p-3 font-mono text-xs" role="status">
              {absorbUsage}
            </p>
          )}
          {copies.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <div>
                <div className="text-sm font-medium">{c.desktop}</div>
                <div className="text-xs text-muted-foreground">
                  {c.packages.length} paquetes · {c.status}
                </div>
              </div>
              {c.status === 'pending_confirmation' && (
                <Button
                  size="sm"
                  type="button"
                  onClick={async () => {
                    await api.confirmCopy(c.id);
                    const r = await api.copies();
                    setCopies(r.copies);
                  }}
                >
                  Confirmar
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
