const https = require('https');
const crypto = require('crypto');

const apiKey = "1037e1104a42ab46f120ca69c57ea245006dcf8fcb5881506c17ac75447e3e38";
const apiSecret = "6201a4121215c681bb25431547d524ed469645075046b486484684e22222a7aa";
const workspaceId = "dawn-paper-8025";
const templateId = 1596411; // ID Numérico confirmado

function base64UrlEncode(str) {
    return Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function generateJWT() {
    const header = { alg: "HS256", typ: "JWT" };
    const payload = { iss: apiKey, sub: workspaceId, exp: Math.floor(Date.now() / 1000) + 30 };
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signature = crypto.createHmac('sha256', apiSecret).update(encodedHeader + '.' + encodedPayload).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function testGeneration(token) {
    console.log(`🚀 Intentando generar PDF con Template ID: ${templateId}...`);

    // Payload mínimo para borrar variables de error de datos
    const pdfData = JSON.stringify({
        template: templateId,
        format: 'pdf',
        output: 'base64',
        data: {
            "nombres": "Prueba Debug",
            "cedula": "1234567890"
        }
    });

    const options = {
        hostname: 'us1.pdfgeneratorapi.com',
        path: '/api/v4/documents/generate',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Content-Length': pdfData.length
        }
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log(`Status Code: ${res.statusCode}`);
            if (res.statusCode === 200) {
                console.log("✅ ¡Generación EXITOSA con payload mínimo!");
                const json = JSON.parse(data);
                console.log("Meta:", json.meta);
            } else {
                console.error("❌ Falló la generación:");
                console.error(data);
            }
        });
    });

    req.on('error', (e) => console.error(`❌ Error de conexión: ${e.message}`));
    req.write(pdfData);
    req.end();
}

try {
    const token = generateJWT();
    testGeneration(token);
} catch (e) {
    console.error("Error:", e);
}
