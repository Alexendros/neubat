'use strict';
/**
 * NEUBAT Portal - rutas de estado y seguimiento
 */

const express = require('express');
const db = require('../lib/db');

const router = express.Router();

// GET /api/health — health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

// GET /api/installations — últimas 50 instalaciones (más recientes primero)
router.get('/installations', async (req, res) => {
    try {
        const store = await db.readDB();
        res.json(store.installations.slice(-50).reverse());
    } catch {
        res.status(500).json({ error: 'Error interno' });
    }
});

// GET /api/installations/:token — estado de una instalación concreta
router.get('/installations/:token', async (req, res) => {
    try {
        const store = await db.readDB();
        const install = store.installations.find(i => i.token === req.params.token);
        if (!install) return res.status(404).json({ error: 'Instalación no encontrada' });
        res.json(install);
    } catch {
        res.status(500).json({ error: 'Error interno' });
    }
});

module.exports = router;
