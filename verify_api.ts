import { create } from "https://deno.land/x/djwt@v2.8/mod.ts";

const apiKey = "1037e1104a42ab46f120ca69c57ea245006dcf8fcb5881506c17ac75447e3e38";
const apiSecret = "6201a4121215c681bb25431547d524ed469645075046b486484684e22222a7aa";
const workspaceId = "dawn-paper-8025";
const templateName = "proud-frost-2145";

async function main() {
    console.log("🚀 Iniciando prueba de conexión con PDF Generator API...");

    try {
        const jwtPayload = {
            iss: apiKey,
            sub: workspaceId,
            exp: Math.floor(Date.now() / 1000) + 30 // 30 segundos
        };

        const key = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(apiSecret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );

        const token = await create({ alg: "HS256", typ: "JWT" }, jwtPayload, key);
        console.log("🔑 Token JWT generado correctamente.");

        // 1. Listar Templates
        console.log("🔍 Consultando lista de plantillas...");
        const response = await fetch('https://us1.pdfgeneratorapi.com/api/v4/templates', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        console.log(`✅ Respuesta exitosa. Total plantillas: ${data.response?.length || 0}`);

        if (data.response && data.response.length > 0) {
            console.log("📋 Plantillas disponibles:");
            data.response.forEach((t: any) => {
                console.log(`   - ID: ${t.id} | Nombre: "${t.name}" | Access: ${t.access}`);
            });

            const found = data.response.find((t: any) => t.name === templateName);
            if (found) {
                console.log(`\n🎉 ¡PLANTILLA ENCONTRADA! ID: ${found.id}`);
            } else {
                console.error(`\n❌ La plantilla con nombre "${templateName}" NO fue encontrada en la lista.`);
            }
        } else {
            console.warn("⚠️ No se encontraron plantillas en este workspace.");
        }

    } catch (error) {
        console.error("❌ Error durante la prueba:", error.message);
    }
}

main();
