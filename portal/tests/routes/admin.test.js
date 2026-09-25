'use strict';

const request = require('supertest');
const app = require('../../server');
const db = require('../../lib/db');

const ADMIN_TOKEN = 'admin-secret-token';

describe('routes/admin', () => {
    beforeAll(async () => {
        process.env.ADMIN_TOKEN = ADMIN_TOKEN;
        await db.initStorage();
    });

    afterAll(() => {
        delete process.env.ADMIN_TOKEN;
    });

    beforeEach(async () => {
        const store = await db.readDB();
        store.installations = [];
        await db.writeDB(store);
    });

    test('GET /api/admin/installations requiere token', async () => {
        await request(app).get('/api/admin/installations').expect(401);
        await request(app)
            .get('/api/admin/installations')
            .set('Authorization', 'Bearer wrong')
            .expect(401);
    });

    test('panel admin deshabilitado si falta ADMIN_TOKEN', async () => {
        delete process.env.ADMIN_TOKEN;
        await request(app).get('/api/admin/installations').expect(503);
        process.env.ADMIN_TOKEN = ADMIN_TOKEN;
    });

    test('GET /api/admin/installations con token válido', async () => {
        const res = await request(app)
            .get('/api/admin/installations')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
            .expect(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('POST /api/admin/installations/:token/status actualiza estado', async () => {
        const create = await request(app)
            .post('/api/install')
            .send({ profile: 'base' });

        await request(app)
            .post(`/api/admin/installations/${create.body.token}/status`)
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
            .send({ status: 'completed', hostname: 'admin-test' })
            .expect(200);

        const store = await db.readDB();
        const install = store.installations.find(i => i.token === create.body.token);
        expect(install.status).toBe('completed');
        expect(install.hostname).toBe('admin-test');
    });

    test('POST /api/admin/installations/:token/reset vuelve a pending', async () => {
        const create = await request(app)
            .post('/api/install')
            .send({ profile: 'base' });

        await request(app)
            .post(`/api/admin/installations/${create.body.token}/reset`)
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
            .expect(200);

        const store = await db.readDB();
        const install = store.installations.find(i => i.token === create.body.token);
        expect(install.status).toBe('pending');
    });

    const missing = '00000000000000000000000000000000';

    test('rutas de admin responden 404 si el token no existe', async () => {
        const auth = { Authorization: `Bearer ${ADMIN_TOKEN}` };
        await request(app)
            .post(`/api/admin/installations/${missing}/status`)
            .set(auth)
            .send({ status: 'failed' })
            .expect(404);
        await request(app)
            .delete(`/api/admin/installations/${missing}`)
            .set(auth)
            .expect(404);
        await request(app)
            .post(`/api/admin/installations/${missing}/reset`)
            .set(auth)
            .expect(404);
    });

    test('status guarda el error sin cambiar el estado ni el hostname', async () => {
        const create = await request(app).post('/api/install').send({ profile: 'base' });
        const res = await request(app)
            .post(`/api/admin/installations/${create.body.token}/status`)
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
            .send({ error: 'red caída' })
            .expect(200);
        expect(res.body.installation.status).toBe('pending');
        expect(res.body.installation.error).toBe('red caída');
        expect(res.body.installation.hostname).toBeUndefined();
    });

    test('DELETE de un token no hex no intenta borrar un fichero', async () => {
        const store = await db.readDB();
        store.installations.push({
            token: 'no-es-hex',
            profile: 'base',
            status: 'pending',
            created_at: new Date().toISOString()
        });
        await db.writeDB(store);

        await request(app)
            .delete('/api/admin/installations/no-es-hex')
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
            .expect(200);

        const after = await db.readDB();
        expect(after.installations.some(i => i.token === 'no-es-hex')).toBe(false);
    });

    test('un fallo de lectura responde 500 en las cuatro rutas', async () => {
        const spy = jest.spyOn(db, 'readDB').mockRejectedValue(new Error('disco'));
        const auth = { Authorization: `Bearer ${ADMIN_TOKEN}` };
        await request(app).get('/api/admin/installations').set(auth).expect(500);
        await request(app)
            .post(`/api/admin/installations/${missing}/status`)
            .set(auth)
            .send({ status: 'failed' })
            .expect(500);
        await request(app).delete(`/api/admin/installations/${missing}`).set(auth).expect(500);
        await request(app).post(`/api/admin/installations/${missing}/reset`).set(auth).expect(500);
        spy.mockRestore();
    });

    test('DELETE /api/admin/installations/:token elimina instalación', async () => {
        const create = await request(app)
            .post('/api/install')
            .send({ profile: 'base' });

        await request(app)
            .delete(`/api/admin/installations/${create.body.token}`)
            .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
            .expect(200);

        const store = await db.readDB();
        expect(store.installations.some(i => i.token === create.body.token)).toBe(false);
    });
});
