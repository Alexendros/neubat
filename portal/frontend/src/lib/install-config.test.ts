import { describe, it, expect } from 'vitest';
import { installJsonFilename, installJsonText } from './install-config';

describe('install-config', () => {
  it('serializa el cuerpo de instalación sin campos de portal', () => {
    const text = installJsonText({
      profile: 'production',
      hostname: 'equipo-1',
      desktop: 'kde',
      packages: ['git'],
      encryption: { enabled: true, method: 'keyfile' },
      snapshots: { enabled: true },
    });
    const body = JSON.parse(text);
    expect(body.hostname).toBe('equipo-1');
    expect(body.token).toBeUndefined();
    expect(body.boot_url).toBeUndefined();
    expect(installJsonFilename(body)).toBe('neubat-equipo-1.json');
  });
});
