'use strict';
/**
 * NEUBAT Portal - rutas de creación y entrega de configuraciones de instalación
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const db = require('../lib/db');

const router = express.Router();
const bootRouter = express.Router();

// Mirror base para el netboot iPXE (configurable para mirrors/cachés locales;
// útil cuando el firmware iPXE no tiene HTTPS compilado)
const BOOT_BASE_URL = process.env.NEUBAT_MIRROR_BASE || 'https://geo.mirror.pkgbuild.com/iso/latest';

// POST /api/install — crear nueva instalación
router.post('/install', async (req, res) => {
    try {
        const { profile = 'production', hostname, username, desktop, packages = [] } = req.body;

        const token = db.generateToken();
        const machineId = db.generateMachineId();

        let baseProfile;
        try {
            baseProfile = await db.loadProfile(profile);
        } catch {
            return res.status(400).json({ error: `Perfil desconocido: ${profile}` });
        }

        const config = {
            ...baseProfile,
            token,
            machine_id: machineId,
            hostname: hostname || `${baseProfile.hostname}-${machineId}`,
            username: username || baseProfile.username,
            desktop: desktop || baseProfile.desktop,
            packages: [...new Set([...(baseProfile.packages || []), ...packages])],
            created_at: new Date().toISOString(),
            status: 'pending'
        };

        const configPath = db.configPathFor(token);
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));

        const store = await db.readDB();
        store.installations.push({
            token,
            machine_id: machineId,
            profile,
            status: 'pending',
            created_at: config.created_at
        });
        await db.writeDB(store);

        res.json({
            success: true,
            token,
            machine_id: machineId,
            config_url: `/api/config/${token}`,
            boot_url: `/boot/${token}`,
            message: 'Configuración creada. Use boot_url para iniciar la instalación por red.'
        });
    } catch (error) {
        console.error('Error creando instalación:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// GET /api/config/:token — configuración consumida por el instalador
router.get('/config/:token', async (req, res) => {
    try {
        const configPath = db.configPathFor(req.params.token);
        if (!configPath) return res.status(400).json({ error: 'Token inválido' });

        const config = JSON.parse(await fs.readFile(configPath, 'utf8'));

        const store = await db.readDB();
        const install = store.installations.find(i => i.token === req.params.token);
        if (install && install.status === 'pending') {
            install.status = 'downloaded';
            install.downloaded_at = new Date().toISOString();
            await db.writeDB(store);
        }

        res.json(config);
    } catch {
        res.status(404).json({ error: 'Configuración no encontrada' });
    }
});

// POST /api/complete — el instalador notifica el resultado
router.post('/complete', async (req, res) => {
    try {
        const { token, status, hostname, error } = req.body;

        const store = await db.readDB();
        const install = store.installations.find(i => i.token === token);
        if (!install) return res.status(404).json({ error: 'Instalación no encontrada' });

        install.status = status || 'completed';
        install.completed_at = new Date().toISOString();
        if (hostname) install.hostname = hostname;
        if (error) install.error = error;

        await db.writeDB(store);
        res.json({ success: true });
    } catch (err) {
        console.error('Error actualizando estado:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// GET /boot/:token — script iPXE personalizado para arranque por red
bootRouter.get('/:token', async (req, res) => {
    const configPath = db.configPathFor(req.params.token);
    try {
        if (!configPath) throw new Error('token inválido');
        await fs.access(configPath);
    } catch {
        return res.status(404).type('text/plain').send('#!ipxe\necho Configuracion no encontrada\nshell\n');
    }

    const script = `#!ipxe
dhcp
set base-url ${BOOT_BASE_URL}
kernel \${base-url}/arch/boot/x86_64/vmlinuz-linux initrd=initramfs-linux.img archiso_http_srv=\${base-url}/arch/ ip=dhcp net.ifnames=0 console=ttyS0 neubat_token=${req.params.token}
initrd \${base-url}/arch/boot/x86_64/initramfs-linux.img
boot
`;
    res.type('text/plain').send(script);
});

module.exports = { router, bootRouter };
