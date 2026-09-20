import { Brand } from './Brand';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, LayoutDashboard, Shield } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Brand admin={isAdmin} />
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Instalador
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin">
                <Shield className="mr-2 h-4 w-4" />
                Admin
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="/wiki.html">
                <BookOpen className="mr-2 h-4 w-4" />
                Wiki
              </a>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>

      <footer className="border-t border-border py-4 text-center text-sm text-muted-foreground">
        NEUBAT v1.0.0 · GPL-3.0 · <a href="/wiki.html" className="text-cyan-400 hover:underline">Wiki</a>
      </footer>
    </div>
  );
}
