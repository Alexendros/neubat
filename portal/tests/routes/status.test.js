'use strict';

const request = require('supertest');
const app = require('../../server');
const db = require('../../lib/db');

describe('routes/status', () => {
    beforeAll(async () => {
        await db.initStorage();
    });

    test('GET /api/health responde ok', async () => {
        const res = await request(app).get('/api/health').expect(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.version).toBe('1.0.0');
    });

    test('GET /api/installations lista instalaciones', async () => {
        const create = await request(app)
            .post('/api/install')
            .send({ profile: 'base' });

        const res = await request(app).get('/api/installations').expect(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some(i => i.token === create.body.token)).toBe(true);
    });

    test('GET /api/installations/:token devuelve una instalación', async () => {
        const create = await request(app)
            .post('/api/install')
            .send({ profile: 'base' });

        const res = await request(app)
            .get(`/api/installations/${create.body.token}`)
            .expect(200);

        expect(res.body.token).toBe(create.body.token);
    });

    test('GET /api/installations/:token devuelve 404 si no existe', async () => {
        await request(app)
            .get('/api/installations/00000000000000000000000000000000')
            .expect(404);
    });
});
