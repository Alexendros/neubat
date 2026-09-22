'use strict';

const request = require('supertest');
const app = require('../../server');
const db = require('../../lib/db');

describe('routes/install', () => {
    beforeAll(async () => {
        await db.initStorage();
    });

    beforeEach(async () => {
        const store = await db.readDB();
        store.installations = [];
        await db.writeDB(store);
    });

    test('POST /api/install crea una instalación', async () => {
        const res = await request(app)
            .post('/api/install')
            .send({ profile: 'base', hostname: 'test1' })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.token).toMatch(/^[0-9a-f]{32}$/);
        expect(res.body.boot_url).toMatch(/^\/boot\//);
    });

    test('POST /api/install rechaza perfil desconocido', async () => {
        await request(app)
            .post('/api/install')
            .send({ profile: 'noexiste' })
            .expect(400);
    });

    test('GET /api/config/:token devuelve la configuración', async () => {
        const create = await request(app)
            .post('/api/install')
            .send({ profile: 'base', hostname: 'test2' });

        const res = await request(app)
            .get(create.body.config_url)
            .expect(200);

        expect(res.body.hostname).toBe('test2');
        expect(res.body.token).toBe(create.body.token);
    });

    test('GET /api/config/:token cambia estado a downloaded', async () => {
        const create = await request(app)
            .post('/api/install')
            .send({ profile: 'base' });

        await request(app).get(create.body.config_url).expect(200);
        const store = await db.readDB();
        const install = store.installations.find(i => i.token === create.body.token);
        expect(install.status).toBe('downloaded');
    });

    test('POST /api/complete marca instalación como completada', async () => {
        const create = await request(app)
            .post('/api/install')
            .send({ profile: 'base' });

        await request(app)
            .post('/api/complete')
            .send({ token: create.body.token, status: 'completed', hostname: 'test2' })
            .expect(200);

        const store = await db.readDB();
        const install = store.installations.find(i => i.token === create.body.token);
        expect(install.status).toBe('completed');
        expect(install.hostname).toBe('test2');
    });

    test('GET /boot/:token devuelve script iPXE', async () => {
        const create = await request(app)
            .post('/api/install')
            .send({ profile: 'base' });

        const res = await request(app)
            .get(create.body.boot_url)
            .expect(200)
            .expect('Content-Type', 'text/plain; charset=utf-8');

        expect(res.text).toContain('#!ipxe');
        expect(res.text).toContain(`neubat_token=${create.body.token}`);
    });

    test('POST /api/install acepta opciones de cifrado', async () => {
        const create = await request(app)
            .post('/api/install')
            .send({
                profile: 'base',
                hostname: 'test-encrypted',
                encryption: { enabled: true, method: 'passphrase', passphrase: 'secreto' }
            })
            .expect(200);

        const res = await request(app).get(create.body.config_url).expect(200);
        expect(res.body.encryption.enabled).toBe(true);
        expect(res.body.encryption.method).toBe('passphrase');
        expect(res.body.encryption.passphrase).toBe('secreto');
    });

    test('POST /api/install permite sobreescribir contraseña', async () => {
        const create = await request(app)
            .post('/api/install')
            .send({ profile: 'base', password: 'custom-password' })
            .expect(200);

        const res = await request(app).get(create.body.config_url).expect(200);
        expect(res.body.password).toBe('custom-password');
    });

    test('GET /boot/:token inválido devuelve 404', async () => {
        await request(app).get('/boot/00000000000000000000000000000000').expect(404);
    });
});
