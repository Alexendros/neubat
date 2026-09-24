import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Cable, Download, FileJson, HardDrive, ShieldCheck } from 'lucide-react';

export function LandingPage() {
  return (
    <article className="space-y-16">
      <header className="space-y-4" aria-labelledby="cabecera-title">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          Instalación desatendida de Arch Linux
        </p>
        <h1 id="cabecera-title" className="text-4xl font-bold tracking-tight sm:text-5xl">
          NEUBAT
        </h1>
      </header>

      <section className="space-y-3" aria-labelledby="propuesta-title">
        <h2 id="propuesta-title" className="text-2xl font-semibold">
          Propuesta
        </h2>
        <p className="max-w-3xl text-lg text-muted-foreground">
          NEUBAT define en el navegador una instalación desatendida de Arch Linux y la entrega como JSON
          local, ISO verificada o URL de arranque.
        </p>
      </section>

      <section className="space-y-6" aria-labelledby="caracteristicas-title">
        <h2 id="caracteristicas-title" className="text-2xl font-semibold">
          Características
        </h2>
        <ul className="grid gap-6 md:grid-cols-3">
          <Feature
            title="Declarativa"
            text="El perfil JSON fija hostname, paquetes, locale y escritorio. El instalador no improvisa."
          />
          <Feature
            title="Disco predecible"
            text="GPT, UEFI y btrfs. LUKS2 y snapshots btrfs son opcionales y quedan en el mismo perfil."
          />
          <Feature
            title="Dos entradas"
            text="ISO híbrida para arrancar en local, o iPXE cuando el portal está en la red."
          />
        </ul>
      </section>

      <section className="space-y-6" aria-labelledby="funcionalidades-title">
        <h2 id="funcionalidades-title" className="text-2xl font-semibold">
          Funcionalidades
        </h2>
        <ul className="grid gap-6 md:grid-cols-2">
          <Feature
            icon={<FileJson className="h-5 w-5 text-primary" aria-hidden />}
            title="Asistente en el navegador"
            text="Escritorio, paquetes, teclado y cifrado. El JSON se arma aquí y se puede descargar sin Express."
          />
          <Feature
            icon={<Download className="h-5 w-5 text-primary" aria-hidden />}
            title="ISO con hash"
            text="La descarga de la ISO comprueba SHA-256 antes de guardar el fichero, si el portal publica el release."
          />
          <Feature
            icon={<Cable className="h-5 w-5 text-primary" aria-hidden />}
            title="Arranque por URL"
            text="Con el portal en marcha, iPXE encadena boot_url y la máquina instala sin USB."
          />
          <Feature
            icon={<HardDrive className="h-5 w-5 text-primary" aria-hidden />}
            title="Absorber un Arch ya instalado"
            text="Un agente local inventaría paquetes y dotfiles de una lista cerrada y los deja en el perfil."
          />
          <Feature
            icon={<ShieldCheck className="h-5 w-5 text-primary" aria-hidden />}
            title="Cuenta opcional"
            text="Registrar, guardar configuraciones y ver recomendaciones exige el portal. Armar el JSON, no."
          />
        </ul>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-8" aria-labelledby="roadmap-title">
        <h2 id="roadmap-title" className="text-2xl font-semibold">
          Roadmap
        </h2>
        <p className="text-muted-foreground">
          Hecho y en el repositorio: portal, GUI, ISO híbrida, LUKS2, snapper, firma HMAC y el agente de
          absorción.
        </p>
        <p className="text-foreground">
          El instalador iPXE real sigue necesitando el portal. El JSON descargado no arranca una máquina: iPXE
          pide <code className="font-mono text-sm">boot_url</code> para bajar kernel, initrd y la configuración.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          <li>Validar en VM el conjunto LUKS + snapper + HMAC, no solo cada pieza por separado.</li>
          <li>Rotar el keyfile de /boot tras el primer arranque.</li>
          <li>Servir un mirror iPXE propio; hoy el arranque depende del portal y del mirror de Arch.</li>
        </ul>
      </section>

      <section className="space-y-4" aria-labelledby="cierre-title">
        <h2 id="cierre-title" className="text-2xl font-semibold">
          Cierre
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          Esta página y el asistente se abren con el servidor de Vite aunque Express no esté. Registrar la
          instalación en el portal es opcional. Instalar por iPXE sigue exigiendo el portal.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/configurar">Configurar instalación</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/descargar">Descargar ISO</Link>
          </Button>
        </div>
      </section>
    </article>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon?: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <li>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {title}
          </CardTitle>
          <CardDescription>{text}</CardDescription>
        </CardHeader>
      </Card>
    </li>
  );
}
