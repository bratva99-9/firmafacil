const https = require('https');
const crypto = require('crypto');

const apiKey = "1037e1104a42ab46f120ca69c57ea245006dcf8fcb5881506c17ac75447e3e38";
const apiSecret = "6201a4121215c681bb25431547d524ed469645075046b486484684e22222a7aa";
const workspaceId = "dawn-paper-8025";
const templateName = "proud-frost-2145";

// Función para cifrar en Base64Url
function base64UrlEncode(str) {
    return Buffer.from(str)
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function generateJWT() {
    const header = {
        alg: "HS256",
        typ: "JWT"
    };

    const payload = {
        iss: apiKey,
        sub: workspaceId,
        exp: Math.floor(Date.now() / 1000) + 30 // 30 segundos
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));

    const signature = crypto
        .createHmac('sha256', apiSecret)
        .update(encodedHeader + '.' + encodedPayload)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function makeRequest(token) {
    const options = {
        hostname: 'us1.pdfgeneratorapi.com',
        path: '/api/v4/templates',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    };

    const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    const json = JSON.parse(data);
                    console.log(`✅ Conexión exitosa. Status: ${res.statusCode}`);

                    if (json.response && Array.isArray(json.response)) {
                        console.log(`📋 Total plantillas: ${json.response.length}`);

                        // Buscar la plantilla específica
                        const found = json.response.find(t => t.id === 1596411 || t.name === "Cedula03");

                        if (found) {
                            console.log("\n✅ PLANTILLA ENCONTRADA:");
                            console.log(`   ID: ${found.id}`);
                            console.log(`   Nombre: ${found.name}`);
                            console.log(`   Workspace ID (en plantilla): ${found.workspace ? found.workspace.id : 'N/A'}`);
                            console.log(`   Workspace Identifier (en plantilla): ${found.workspace ? found.workspace.identifier : 'N/A'}`);
                            console.log(`   Owner: ${found.owner ? found.owner.name : 'N/A'}`);

                            // Si no hay objeto workspace, imprimir claves para ver qué hay
                            if (!found.workspace) {
                                console.log("   Claves disponibles:", Object.keys(found));
                            }
                        } else {
                            console.log("\n⚠️ Plantilla 'Cedula03' (1596411) NO encontrada.");
                            console.log("   Plantillas disponibles:");
                            json.response.forEach(t => {
                                console.log(`   - [${t.id}] ${t.name}`);
                            });
                        }
                    } else {
                        console.log('⚠️ Respuesta JSON inesperada:', json);
                    }
                } catch (e) {
                    console.error('Error parseando JSON:', e);
                }
            } else {
                console.error(`❌ Error HTTP ${res.statusCode}: ${data}`);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`❌ Error de conexión: ${e.message}`);
    });

    req.end();
}

console.log("🚀 Iniciando prueba PDF Generator API (Node.js)...");
try {
    const token = generateJWT();
    console.log("🔑 JWT Generado.");
    makeRequest(token);
} catch (e) {
    console.error("Error generando token:", e);
}
