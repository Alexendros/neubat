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
