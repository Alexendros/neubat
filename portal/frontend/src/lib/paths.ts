export type Intent = 'daily' | 'develop' | 'server';

export interface InstallPath {
  intent: Intent;
  title: string;
  description: string;
  profile: string;
  desktop: string;
  encryption: { enabled: boolean; method: 'keyfile' | 'passphrase' | 'interactive' };
  snapshots: { enabled: boolean };
}

/** Caminos si Express no responde. La API manda cuando hay red. */
export const LOCAL_PATHS: InstallPath[] = [
  {
    intent: 'daily',
    title: 'Uso diario',
    description: 'Escritorio KDE y disco cifrado.',
    profile: 'production',
    desktop: 'kde',
    encryption: { enabled: true, method: 'keyfile' },
    snapshots: { enabled: true },
  },
  {
    intent: 'develop',
    title: 'Desarrollo',
    description: 'Escritorio GNOME, sin cifrar el disco.',
    profile: 'developer',
    desktop: 'gnome',
    encryption: { enabled: false, method: 'keyfile' },
    snapshots: { enabled: true },
  },
  {
    intent: 'server',
    title: 'Servidor mínimo',
    description: 'Sin escritorio y sin cifrado.',
    profile: 'base',
    desktop: 'none',
    encryption: { enabled: false, method: 'keyfile' },
    snapshots: { enabled: false },
  },
];

export interface RecommendationLike {
  id: string;
  title: string;
  description: string;
  profile: string;
  desktop?: string;
  packages?: string[];
  intent?: Intent;
  encryption?: { enabled: boolean; method?: InstallPath['encryption']['method'] };
  snapshots?: { enabled: boolean };
}

export function pathsFromRecommendations(recs: RecommendationLike[]): InstallPath[] {
  const fromApi = recs
    .filter((rec): rec is RecommendationLike & { intent: Intent } =>
      rec.intent === 'daily' || rec.intent === 'develop' || rec.intent === 'server'
    )
    .map((rec) => ({
      intent: rec.intent,
      title: rec.title,
      description: rec.description,
      profile: rec.profile,
      desktop: rec.desktop || (rec.intent === 'server' ? 'none' : rec.intent === 'develop' ? 'gnome' : 'kde'),
      encryption: {
        enabled: rec.encryption?.enabled ?? rec.intent === 'daily',
        method: rec.encryption?.method || 'keyfile',
      },
      snapshots: rec.snapshots || { enabled: rec.intent !== 'server' },
    }));
  const intents = new Set(fromApi.map((path) => path.intent));
  if (intents.has('daily') && intents.has('develop') && intents.has('server')) return fromApi;
  return LOCAL_PATHS;
}

export function pathAnnouncement(path: InstallPath): string {
  const desktop =
    path.desktop === 'none' ? 'Sin escritorio' : path.desktop === 'kde' ? 'Escritorio KDE' : path.desktop === 'gnome' ? 'Escritorio GNOME' : path.desktop;
  const disk = path.encryption.enabled ? 'El disco irá cifrado.' : 'El disco no irá cifrado.';
  return `${desktop}. ${disk}`;
}
