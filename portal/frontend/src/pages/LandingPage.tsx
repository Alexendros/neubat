import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Cable, Download, HardDrive, ShieldCheck, Sparkles } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="space-y-16">
      <section className="space-y-6 text-center" aria-labelledby="hero-title">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">Arch Linux personalizado</p>
        <h1 id="hero-title" className="text-4xl font-bold tracking-tight sm:text-5xl">
          NEUBAT: tu Arch, tu ISO, tu red
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Configura desde el navegador una instalación desatendida de Arch Linux, descarga la ISO con
          verificación automática del hash o arranca solo con un cable Ethernet.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/configurar">Configurar instalación</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/descargar">Descargar ISO</Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link to="/cuenta">Mi cuenta</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3" aria-labelledby="features-title">
        <h2 id="features-title" className="sr-only">
          Características
        </h2>
        <Feature
          icon={<Sparkles className="h-5 w-5 text-primary" aria-hidden />}
          title="Configurador web"
          text="Paquetes, escritorio o compositor (KDE, GNOME, Hyprland, Sway…), locale y cifrado desde el navegador."
        />
        <Feature
          icon={<Cable className="h-5 w-5 text-primary" aria-hidden />}
          title="Netinstall por URL"
          text="Copia el enlace iPXE, conecta Ethernet y la máquina arranca e instala sin USB."
        />
        <Feature
          icon={<HardDrive className="h-5 w-5 text-primary" aria-hidden />}
          title="Absorbe tu sistema"
          text="Un agente local inventaría paquetes y dotfiles allowlist y los guarda en tu perfil NEUBAT."
        />
        <Feature
          icon={<Download className="h-5 w-5 text-primary" aria-hidden />}
          title="ISO con hash automático"
          text="Descarga desde el repositorio oficial; el navegador comprueba SHA-256 antes de guardar el fichero."
        />
        <Feature
          icon={<ShieldCheck className="h-5 w-5 text-primary" aria-hidden />}
          title="Cuenta y recomendaciones"
          text="Guarda configuraciones, confirma copias del sistema y aplica perfiles curados por el equipo."
        />
      </section>

      <section className="rounded-xl border border-border bg-card p-8" aria-labelledby="how-title">
        <h2 id="how-title" className="text-2xl font-semibold">
          Cómo funciona
        </h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted-foreground">
          <li>Crea una cuenta y elige un perfil recomendado o absorbe tu Arch actual.</li>
          <li>Personaliza paquetes y escritorio en el configurador.</li>
          <li>Arranca por iPXE con la URL generada, o descarga la ISO verificada.</li>
          <li>archinstall instalará la base; los scripts NEUBAT completan LUKS, snapper y el portal local.</li>
        </ol>
      </section>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{text}</CardDescription>
      </CardHeader>
      <CardContent />
    </Card>
  );
}
