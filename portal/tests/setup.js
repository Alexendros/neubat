const fs = require('fs');
const os = require('os');
const path = require('path');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'neubat-test-'));
process.env.NEUBAT_DATA_DIR = tmpDir;
process.env.NEUBAT_CONFIGS_DIR = path.join(tmpDir, 'configs', 'generated');
process.env.NEUBAT_USERS_DIR = path.join(tmpDir, 'users');
fs.mkdirSync(process.env.NEUBAT_CONFIGS_DIR, { recursive: true });
fs.mkdirSync(process.env.NEUBAT_USERS_DIR, { recursive: true });
