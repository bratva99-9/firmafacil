import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import forge from "npm:node-forge@1.3.1"

// 1. Datos Extraídos del Browser SubAgent
const jwt = "eyJhbGciOiJIUzUxMiJ9.eyJjZWR1bGEiOiIxMjA1NjUxMzI0Iiwic2lzdGVtYSI6InNyaUdlbmVyYWNpb25DbGF2ZSIsImlkcyI6IjYxMjM1OTMxIiwiZXhwIjoxNzcyMzQ3NjEzfQ.N4qSnCO3Ioy5powpp76t_5nxwAakzxAxi4aCMeKqCU2Rr4ch1cRa3_Hw_GDSE7i213d6uTb9xSmaIs5_Ovrqlg";
const ruc = "1205651324001";
const cookieHeader = "JSESSIONID=3Fl6juOZB8HVZfFrUcoPsGNwTb0xQ9M5uW4AfOkR.sriinternet38i2; _ga=GA1.3.216400554.1767533978; _ga_Z0QD1W5QPG=GS2.3.s1767533978$o1$g1$t1767536638$j38$l0$h0; rxVisitor4tn0mh4k=17723390396908SDO73F6O9F3QDPHK8JUMHE3O5CDFC78; dtCookie4tn0mh4k=v_4_srv_11_sn_1DC3DC5728622F4B9A67A9B3DF9310D6_perc_100000_ol_0_mul_1_app-3A34a71c252bf77eda_1_app-3Acdb5568402318bfc_0_rcs-3Acss_0; dtSa4tn0mh4k=-; rxvt4tn0mh4k=1772349129927|1772339039692; dtPC4tn0mh4k=11$547260422_59h-vPMEHRNNRNMAUPUIHCRCJOCOPBDRWKJOS-0e0";

// 2. Config Supabase
const SUPABASE_URL = "https://eapcqcuzfkpqngbvjtmv.supabase.co"
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY // Requeriremos correr con env vars
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function testFirmador() {
    console.log("Iniciando Test Aislado del FirmadorPdf...");

    try {
        // --- PASO 1: Descargar PDF sin firmar ---
        console.log("\n[1] Llamando a obtenerDocumentoTemporal...");
        const pdfResp = await fetch(
            `https://srienlinea.sri.gob.ec/sri-firmador-pdf-servicio-internet/rest/FirmadorPdf/obtenerDocumentoTemporal?token=${jwt}`,
            {
                method: 'GET',
                headers: {
                    'Cookie': cookieHeader,
                    'User-Agent': 'FirmaEC/5.0 (Windows NT 10.0; Win64; x64)',
                    'Origin': 'https://srienlinea.sri.gob.ec',
                }
            }
        );

        console.log("Status:", pdfResp.status);
        if (!pdfResp.ok) throw new Error("Fallo GET: " + await pdfResp.text());

        const pdfJson = await pdfResp.json();
        const pdfBase64 = pdfJson.documento || pdfJson.pdf || pdfJson.contenido || pdfJson.archivo;
        if (!pdfBase64) throw new Error("No hay documento base64 en la respuesta: " + JSON.stringify(pdfJson).substring(0, 100));
        console.log("PDF obtenido. Longitud base64:", pdfBase64.length);

        // --- PASO 2: Obtener P12 de Supabase ---
        console.log("\n[2] Obteniendo P12 de Supabase...");
        const { data: firmaRow } = await supabase
            .from('firmas_electronicas')
            .select('storage_path, password')
            .eq('ruc_cedula', ruc)
            .single();

        if (!firmaRow) throw new Error("No se encontró P12 para el RUC " + ruc);
        console.log("Encontrado P12 en storage:", firmaRow.storage_path);

        const { data: p12Blob, error: storageErr } = await supabase.storage.from('firmas').download(firmaRow.storage_path);
        if (storageErr) throw new Error("Error storage: " + storageErr.message);

        // --- PASO 3: Firmar con node-forge ---
        console.log("\n[3] Firmando PDF...");
        const p12ArrayBuffer = await p12Blob.arrayBuffer();
        const p12Der = String.fromCharCode(...new Uint8Array(p12ArrayBuffer));
        const p12Asn1 = forge.asn1.fromDer(p12Der);
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, firmaRow.password);

        let privateKey: any = null;
        let certChain: any[] = [];
        for (const safeContent of p12.safeContents) {
            for (const safeBag of safeContent.safeBags) {
                if (safeBag.type === forge.pki.oids.pkcs8ShroudedKeyBag || safeBag.type === forge.pki.oids.keyBag) {
                    privateKey = safeBag.key;
                }
                if (safeBag.type === forge.pki.oids.certBag && safeBag.cert) {
                    certChain.push(safeBag.cert);
                }
            }
        }

        const pdfBytes = forge.util.decode64(pdfBase64);
        const p7 = forge.pkcs7.createSignedData();
        p7.content = forge.util.createBuffer(pdfBytes);
        certChain.forEach(c => p7.addCertificate(c));
        p7.addSigner({
            key: privateKey,
            certificate: certChain[0],
            digestAlgorithm: forge.pki.oids.sha256,
            authenticatedAttributes: [
                { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
                { type: forge.pki.oids.messageDigest },
                { type: forge.pki.oids.signingTime, value: new Date() },
            ],
        });
        p7.sign();

        const pdfFirmadoBase64 = forge.util.encode64(forge.asn1.toDer(p7.toAsn1()).getBytes());
        console.log("PDF Firmado. Longitud base64:", pdfFirmadoBase64.length);

        // --- PASO 4: Subir PDF Firmado ---
        console.log("\n[4] Subiendo PDF Firmado al SRI...");
        const uploadResp = await fetch(
            'https://srienlinea.sri.gob.ec/sri-firmador-pdf-servicio-internet/rest/FirmadorPdf/recibirDocumentoFirmado',
            {
                method: 'POST',
                headers: {
                    'Cookie': cookieHeader,
                    'User-Agent': 'FirmaEC/5.0 (Windows NT 10.0; Win64; x64)',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: jwt,
                    pdfFirmadoBase64: pdfFirmadoBase64,
                })
            }
        );

        console.log("Status Subida:", uploadResp.status);
        console.log("Respuesta:", await uploadResp.text());

    } catch (err) {
        console.error("❌ ERROR DURANTE TEST:", err);
    }
}

testFirmador();
