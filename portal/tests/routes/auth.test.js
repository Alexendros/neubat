'use strict';

const request = require('supertest');
const app = require('../../server');
const users = require('../../lib/users');
const { toArchinstallPair } = require('../../lib/archinstall');

describe('auth + account + archinstall', () => {
    beforeAll(async () => {
        await users.ensureUsersStore();
    });

    test('registro e inicio de sesión', async () => {
        const email = `user${Date.now()}@example.com`;
        const reg = await request(app)
            .post('/api/auth/register')
            .send({ email, password: 'secreto123', display_name: 'Neo' })
            .expect(201);
        expect(reg.body.user.email).toBe(email);
        expect(reg.headers['set-cookie']).toBeDefined();

        await request(app).post('/api/auth/logout').expect(200);

        const login = await request(app)
            .post('/api/auth/login')
            .send({ email, password: 'secreto123' })
            .expect(200);
        expect(login.body.user.display_name).toBe('Neo');
    });

    test('recomendaciones públicas', async () => {
        const res = await request(app).get('/api/account/recommendations').expect(200);
        expect(res.body.recommendations.length).toBeGreaterThan(0);
    });

    test('guardar config requiere sesión', async () => {
        await request(app).post('/api/account/configs').send({ name: 'x' }).expect(401);
    });

    test('toArchinstallPair genera config y creds', () => {
        const pair = toArchinstallPair({
            hostname: 'h',
            username: 'u',
            password: 'p',
            desktop: 'hyprland',
            packages: ['git'],
            timezone: 'Europe/Madrid',
            locale: 'es_ES.UTF-8',
            keyboard: 'es'
        });
        expect(pair.config.hostname).toBe('h');
        expect(pair.creds['!users'][0].username).toBe('u');
        expect(pair.desktop).toBe('hyprland');
    });

    test('releases expone URLs de ISO y hash', async () => {
        const res = await request(app).get('/api/account/releases').expect(200);
        expect(res.body.neubat.iso_url).toContain('.iso');
        expect(res.body.neubat.sha256_url).toContain('.sha256');
        expect(res.body.arch.sha256_url).toContain('sha256');
    });
});
