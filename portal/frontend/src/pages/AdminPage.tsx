import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import type { Installation } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Lock, MoreHorizontal, RefreshCw, Search, Trash2 } from 'lucide-react';

const statusColors: Record<Installation['status'], string> = {
  pending: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  downloaded: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export function AdminPage() {
  const [token, setToken] = useState(localStorage.getItem('neubat-admin-token') || '');
  const [loggedIn, setLoggedIn] = useState(false);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Installation['status'] | ''>('');
  const [error, setError] = useState<string | null>(null);

  async function login() {
    localStorage.setItem('neubat-admin-token', token);
    setLoading(true);
    setError(null);
    try {
      const data = await api.adminInstallations(token);
      setInstallations(data);
      setLoggedIn(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación');
      setLoggedIn(false);
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setLoading(true);
    try {
      const data = await api.adminInstallations(token);
      setInstallations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(t: string, status: Installation['status']) {
    try {
      await api.updateStatus(t, status, token);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualizando estado');
    }
  }

  async function reset(t: string) {
    try {
      await api.reset(t, token);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error reseteando');
    }
  }

  async function remove(t: string) {
    if (!confirm(`¿Eliminar instalación ${t.slice(0, 8)}…?`)) return;
    try {
      await api.delete(t, token);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando');
    }
  }

  useEffect(() => {
    if (loggedIn) refresh();
  }, [loggedIn]);

  const filtered = useMemo(() => {
    return installations
      .filter((i) => (statusFilter ? i.status === statusFilter : true))
      .filter(
        (i) =>
          i.token.toLowerCase().includes(search.toLowerCase()) ||
          (i.hostname || '').toLowerCase().includes(search.toLowerCase()) ||
          i.profile.toLowerCase().includes(search.toLowerCase())
      )
      .slice()
      .reverse();
  }, [installations, search, statusFilter]);

  if (!loggedIn) {
    return (
      <div className="mx-auto max-w-md pt-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-cyan-400" />
              Acceso al panel
            </CardTitle>
            <CardDescription>Introduce el token de administrador configurado en el servidor.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-token">Admin token</Label>
              <Input
                id="admin-token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ADMIN_TOKEN"
                onKeyDown={(e) => e.key === 'Enter' && login()}
              />
            </div>
            <Button onClick={login} className="w-full">
              Entrar
            </Button>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Panel de administración</h2>
          <p className="text-muted-foreground">Gestión de instalaciones y estados.</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refrescar
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar token, hostname o perfil"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as Installation['status'] | '')}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="pending">pending</SelectItem>
                <SelectItem value="downloaded">downloaded</SelectItem>
                <SelectItem value="completed">completed</SelectItem>
                <SelectItem value="failed">failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Hostname</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creada</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Sin resultados
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((i) => (
                    <TableRow key={i.token}>
                      <TableCell>
                        <code className="text-xs">{i.token.slice(0, 12)}…</code>
                      </TableCell>
                      <TableCell>{i.profile}</TableCell>
                      <TableCell>{i.hostname || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[i.status]}>
                          {i.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(i.created_at).toLocaleString('es-ES')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateStatus(i.token, 'pending')}>
                              Marcar pending
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(i.token, 'completed')}>
                              Marcar completed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(i.token, 'failed')}>
                              Marcar failed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => reset(i.token)}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Resetear
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => remove(i.token)}
                              className="text-red-400 focus:text-red-400"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
