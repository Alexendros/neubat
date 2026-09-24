'use strict';
/**
 * Autenticación de operador (ADMIN_TOKEN).
 */

function requireAdmin(req, res, next) {
    if (!process.env.ADMIN_TOKEN) {
        return res.status(503).json({ error: 'Panel de administración no configurado (falta ADMIN_TOKEN)' });
    }
    const header = req.headers.authorization || '';
    const token = header.replace(/^Bearer\s+/i, '');
    if (token !== process.env.ADMIN_TOKEN) {
        res.set('WWW-Authenticate', 'Bearer');
        return res.status(401).json({ error: 'No autorizado' });
    }
    next();
}

module.exports = { requireAdmin };
