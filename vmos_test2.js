const HOST = "api.vmoscloud.com";
const AK = "o4ObHCzichKEo0ccWAJcPspbcseBZdvU";
const SK = "oDlzOPSEBnQj4hl59CSISaVL";
const SERVICE = "armcloud-paas";
const PAD = "ATP25102002JRNCM";
const crypto = require("crypto");

async function sha256hex(str) { return crypto.createHash("sha256").update(str).digest("hex"); }
function hmac(key, data) { return crypto.createHmac("sha256", key).update(data).digest(); }
function hmacHex(key, data) { return crypto.createHmac("sha256", key).update(data).digest("hex"); }

async function vmosPost(path, body) {
    const bodyJson = JSON.stringify(body);
    const xDate = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const shortDate = xDate.substring(0, 8);
    const bodyHash = await sha256hex(bodyJson);
    const stringToSign = [
        "HMAC-SHA256", xDate, `${shortDate}/${SERVICE}/request`,
        await sha256hex([`host:${HOST}`, `x-date:${xDate}`, `content-type:application/json`, `signedHeaders:content-type;host;x-content-sha256;x-date`, `x-content-sha256:${bodyHash}`].join("\n"))
    ].join("\n");
    const kDate = hmac(SK, shortDate);
    const kService = hmac(kDate, SERVICE);
    const kSigning = hmac(kService, "request");
    const signature = hmacHex(kSigning, stringToSign);
    const res = await fetch(`https://${HOST}${path}`, {
        method: "POST", body: bodyJson,
        headers: {
            "Content-Type": "application/json", "x-date": xDate, "x-host": HOST, "x-content-sha256": bodyHash,
            "Authorization": `HMAC-SHA256 Credential=${AK}/${shortDate}/${SERVICE}/request, SignedHeaders=content-type;host;x-content-sha256;x-date, Signature=${signature}`
        }
    });
    return await res.json();
}

async function cmd(script) {
    const res = await vmosPost("/vcpcloud/api/padApi/asyncCmd", { padCodes: [PAD], scriptContent: script });
    return res;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
    console.log("=== DIAGNÓSTICO VMOS S23 Ultra ===\n");

    // 1. IP pública del dispositivo
    console.log("1. IP PÚBLICA:");
    await cmd("curl -s ifconfig.me && echo ''");
    await sleep(3000);

    // 2. Ubicación geográfica
    console.log("2. GEOLOCALIZACIÓN:");
    await cmd("curl -s ipinfo.io");
    await sleep(3000);

    // 3. DNS resolution de Gob.ec
    console.log("3. DNS GOB.EC:");
    await cmd("nslookup gob.ec");
    await sleep(2000);

    // 4. Ping al servidor de Gob.ec
    console.log("4. PING GOB.EC:");
    await cmd("ping -c 3 gob.ec");
    await sleep(5000);

    // 5. Conectividad HTTPS al API de Gob.ec
    console.log("5. CURL GOB.EC:");
    await cmd("curl -s -o /dev/null -w '%{http_code} %{time_total}s' https://www.gob.ec");
    await sleep(5000);

    // 6. Verificar si hay proxy/VPN
    console.log("6. NETWORK CONFIG:");
    await cmd("ip route show");
    await sleep(1000);

    // 7. Certificados SSL
    console.log("7. SSL CHECK:");
    await cmd("curl -v --connect-timeout 5 https://www.registrocivil.gob.ec 2>&1 | head -20");
    await sleep(5000);

    // 8. getprop - info del dispositivo
    console.log("8. DEVICE INFO:");
    await cmd("getprop ro.product.model && getprop ro.build.fingerprint && getprop gsm.operator.alpha");
    await sleep(2000);

    // Los resultados de asyncCmd no se devuelven directamente.
    // Necesitamos otra estrategia: escribir resultados a un archivo y leerlo.
    console.log("\n=== GUARDANDO RESULTADOS EN ARCHIVO ===");
    await cmd("curl -s ifconfig.me > /sdcard/Download/diag.txt 2>&1");
    await sleep(3000);
    await cmd("echo '---' >> /sdcard/Download/diag.txt && curl -s ipinfo.io >> /sdcard/Download/diag.txt 2>&1");
    await sleep(3000);
    await cmd("echo '---' >> /sdcard/Download/diag.txt && curl -s -o /dev/null -w 'HTTP:%{http_code} TIME:%{time_total}s' https://www.gob.ec >> /sdcard/Download/diag.txt 2>&1");
    await sleep(5000);
    await cmd("echo '---' >> /sdcard/Download/diag.txt && getprop ro.product.model >> /sdcard/Download/diag.txt && getprop gsm.operator.alpha >> /sdcard/Download/diag.txt");
    await sleep(1000);

    // Leer el archivo con ADB
    console.log("\n=== LEYENDO DIAGNÓSTICO ===");
    const adbRes = await vmosPost("/vcpcloud/api/padApi/adb", {
        padCodes: [PAD],
        command: "shell cat /sdcard/Download/diag.txt"
    });
    console.log("ADB RESULT:", JSON.stringify(adbRes?.data, null, 2));

    console.log("\n=== FIN DIAGNÓSTICO ===");
}
run();
