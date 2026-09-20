'use strict';

const fs = require('fs').promises;
const path = require('path');
const db = require('../../lib/db');

describe('lib/db', () => {
    beforeEach(async () => {
        await db.writeDB({ installations: [] });
    });

    test('generateToken produce 32 chars hex', () => {
        const token = db.generateToken();
        expect(token).toMatch(/^[0-9a-f]{32}$/);
    });

    test('generateMachineId produce 8 chars hex', () => {
        const id = db.generateMachineId();
        expect(id).toMatch(/^[0-9a-f]{8}$/);
    });

    test('configPathFor rechaza tokens inválidos', () => {
        expect(db.configPathFor('aabbccdd00112233445566778899aabb')).toBeTruthy();
        expect(db.configPathFor('../etc/passwd')).toBeNull();
        expect(db.configPathFor('short')).toBeNull();
    });

    test('readDB / writeDB persisten correctamente', async () => {
        await db.writeDB({ installations: [{ token: 'a' }] });
        const data = await db.readDB();
        expect(data.installations).toHaveLength(1);
        expect(data.installations[0].token).toBe('a');
    });

    test('loadProfile carga un perfil existente', async () => {
        const profile = await db.loadProfile('base');
        expect(profile).toHaveProperty('hostname');
        expect(profile).toHaveProperty('packages');
    });

    test('loadProfile falla con perfil inexistente', async () => {
        await expect(db.loadProfile('noexiste')).rejects.toThrow();
    });
});
