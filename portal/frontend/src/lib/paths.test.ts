import { describe, expect, it } from 'vitest';
import { LOCAL_PATHS, pathAnnouncement, pathsFromRecommendations } from './paths';

describe('caminos de instalación', () => {
  it('sin API usa los tres caminos locales', () => {
    expect(pathsFromRecommendations([]).map((path) => path.intent)).toEqual(['daily', 'develop', 'server']);
  });

  it('Uso diario cifra y Servidor mínimo no', () => {
    const daily = LOCAL_PATHS.find((path) => path.intent === 'daily');
    const server = LOCAL_PATHS.find((path) => path.intent === 'server');
    expect(daily?.encryption.enabled).toBe(true);
    expect(server?.encryption.enabled).toBe(false);
    expect(server?.desktop).toBe('none');
    expect(pathAnnouncement(daily!)).toMatch(/cifrado/);
    expect(pathAnnouncement(server!)).toMatch(/no irá cifrado/);
  });

  it('ignora Hyprland como camino principal', () => {
    const paths = pathsFromRecommendations([
      { id: 'production', intent: 'daily', title: 'Uso diario', description: 'KDE', profile: 'production', desktop: 'kde' },
      { id: 'developer', intent: 'develop', title: 'Desarrollo', description: 'GNOME', profile: 'developer', desktop: 'gnome' },
      { id: 'base', intent: 'server', title: 'Servidor mínimo', description: 'base', profile: 'base', desktop: 'none' },
      { id: 'hyprland', title: 'Hyprland', description: 'ajuste', profile: 'base', desktop: 'hyprland' },
    ]);
    expect(paths.map((path) => path.intent)).toEqual(['daily', 'develop', 'server']);
  });
});
