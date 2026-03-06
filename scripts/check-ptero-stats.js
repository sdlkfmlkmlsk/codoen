const fs = require('fs');
const path = require('path');
const https = require('https');

function parseEnv(content) {
    const env = {};
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length > 1) {
            env[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
    });
    return env;
}

async function run() {
    try {
        const envPath = path.join(process.cwd(), '.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const env = parseEnv(envContent);

        const baseUrl = env.PTERO_URL;
        const appKey = env.PTERO_API_KEY;
        const clientKey = env.PTERO_ADMIN_CLIENT_TOKEN;
        const identifier = "f6624683"; 

        const fetchJSON = (url, key) => new Promise((resolve, reject) => {
            https.get(url, {
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                }
            }, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                   try { resolve(JSON.parse(data)); } catch(e) { reject(new Error("Non-JSON response (status " + res.statusCode + "): " + data.substring(0, 500))); }
                });
            }).on('error', reject);
        });

        console.log("1. Fetching App API details for " + identifier);
        const appRes = await fetchJSON(`${baseUrl}/api/application/servers?filter[uuidShort]=${identifier}`, appKey);
        const uuid = appRes.data[0].attributes.uuid;
        console.log("UUID:", uuid);

        console.log("2. Fetching Client Resources for " + uuid);
        const stats = await fetchJSON(`${baseUrl}/api/client/servers/${uuid}/resources`, clientKey);

        console.log("RESULT_START");
        console.log(JSON.stringify(stats, null, 2));
        console.log("RESULT_END");

    } catch (e) {
        console.error("Error:", e.message);
    }
}

run();
