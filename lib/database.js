const fs = require('fs');
const path = require('path');

async function readEnv() {
    const envPath = path.join(__dirname, '../config.env');

    if (!fs.existsSync(envPath)) {
        return {};
    }

    const data = fs.readFileSync(envPath, 'utf-8');

    const config = {};

    data.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');

        if (key && value.length) {
            config[key.trim()] = value.join('=').trim();
        }
    });

    return config;
}

module.exports = {
    readEnv
};
