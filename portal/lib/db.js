'use strict';
/**
 * NEUBAT Portal - persistencia JSON y utilidades compartidas
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const PORTAL_ROOT = path.join(__dirname, '..');
const CONFIG_DIR = path.join(PORTAL_ROOT, 'configs', 'generated');
const PROFILES_DIR = path.join(PORTAL_ROOT, '..', 'configs');
const DB_PATH = path.join(PORTAL_ROOT, 'data', 'installations.json');

async function initStorage() {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    try {
        await fs.access(DB_PATH);
    } catch {
        await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
        await writeDB({ installations: [] });
    }
}

function generateToken() {
    return crypto.randomBytes(16).toString('hex');
}

function generateMachineId() {
    return crypto.randomBytes(4).toString('hex');
}

async function readDB() {
    const data = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(data);
}

async function writeDB(data) {
    const tmp = `${DB_PATH}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2));
    await fs.rename(tmp, DB_PATH);
}

async function loadProfile(profile) {
    const profilePath = path.join(PROFILES_DIR, `${profile}.json`);
    return JSON.parse(await fs.readFile(profilePath, 'utf8'));
}

function configPathFor(token) {
    // Defensa contra path traversal: el token es hex de 32 chars
    if (!/^[0-9a-f]{32}$/.test(token)) return null;
    return path.join(CONFIG_DIR, `${token}.json`);
}

module.exports = {
    PORTAL_ROOT,
    CONFIG_DIR,
    DB_PATH,
    initStorage,
    generateToken,
    generateMachineId,
    readDB,
    writeDB,
    loadProfile,
    configPathFor
};
