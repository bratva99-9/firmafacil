const HOST = "api.vmoscloud.com";
const AK = "o4ObHCzichKEo0ccWAJcPspbcseBZdvU";
const SK = "oDlzOPSEBnQj4hl59CSISaVL";
const SERVICE = "armcloud-paas";
const PAD = "APP61U5MNRVZYOMN";
const crypto = require("crypto");

async function sha256hex(str) { return crypto.createHash("sha256").update(str).digest("hex"); }
function hmac(key, data) { return crypto.createHmac("sha256", key).update(data).digest(); }
function hmacHex(key, data) { return crypto.createHmac("sha256", key).update(data).digest("hex"); }

async function run() {
    // Info del PAD devuelve arrays de apps instaladas
    const bodyJson = JSON.stringify({ padCode: PAD });
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

    const res = await fetch(`https://${HOST}/vcpcloud/api/padApi/padInfo`, {
        method: "POST", body: bodyJson,
        headers: {
            "Content-Type": "application/json", "x-date": xDate, "x-host": HOST, "x-content-sha256": bodyHash,
            "Authorization": `HMAC-SHA256 Credential=${AK}/${shortDate}/${SERVICE}/request, SignedHeaders=content-type;host;x-content-sha256;x-date, Signature=${signature}`
        }
    });
    const result = await res.json();
    console.log(JSON.stringify(result, null, 2));
}
run();
