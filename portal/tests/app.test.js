'use strict';

const request = require('supertest');
const app = require('../server');
const db = require('../lib/db');

describe('app integration', () => {
    beforeAll(async () => {
        await db.initStorage();
    });

    test('flujo completo: crear → descargar → completar', async () => {
        const create = await request(app)
            .post('/api/install')
            .send({ profile: 'base', hostname: 'integration', username: 'neo' })
            .expect(200);

        const token = create.body.token;

        await request(app)
            .get(`/api/config/${token}`)
            .expect(200)
            .then(res => {
                expect(res.body.hostname).toBe('integration');
                expect(res.body.username).toBe('neo');
            });

        await request(app)
            .post('/api/complete')
            .send({ token, status: 'completed', hostname: 'integration-done' })
            .expect(200);

        const status = await request(app)
            .get(`/api/installations/${token}`)
            .expect(200);

        expect(status.body.status).toBe('completed');
        expect(status.body.hostname).toBe('integration-done');
    });

    test('rutas SPA sirven index.html', async () => {
        const res = await request(app).get('/').expect(200);
        expect(res.text).toContain('NEUBAT');
    });

    test('/admin sirve admin.html', async () => {
        const res = await request(app).get('/admin').expect(200);
        expect(res.text).toContain('Admin');
    });

    test('API 404 devuelve JSON', async () => {
        const res = await request(app).get('/api/noexiste').expect(404);
        expect(res.body).toHaveProperty('error');
    });

    test('rate limiting bloquea tras 100 req /api', async () => {
        const reqs = [];
        for (let i = 0; i < 102; i++) {
            reqs.push(request(app).get('/api/health'));
        }
        const responses = await Promise.all(reqs);
        expect(responses.some(r => r.status === 429)).toBe(true);
    });
});
