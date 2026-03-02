const { createClient } = require('@supabase/supabase-js');
const forge = require('node-forge');

// 1. Datos Extraídos del Browser SubAgent (JWT y Cookies de sesión SRI)
const jwt = "eyJhbGciOiJIUzUxMiJ9.eyJjZWR1bGEiOiIxMjA1NjUxMzI0Iiwic2lzdGVtYSI6InNyaUdlbmVyYWNpb25DbGF2ZSIsImlkcyI6IjYxMjM1OTU0IiwiZXhwIjoxNzcyMzQ5Mjc1fQ.FpmFkD5LiqkHl17F5NFrXLZKq_U6NsfBa2mseniikCCgz1Iiffr3rBPkFMlSLDaMjaOFMBd7gFrR0wj5xGPLRw";
const cedula = "1205651324";
const cookieHeader = "JSESSIONID=zUt0uQbLMMBdkgcNQFJx3ncF52stdFf66KQN-Rf0.sriinternet38i2; _ga=GA1.3.216400554.1767533978; _ga_Z0QD1W5QPG=GS2.3.s1767533978$o1$g1$t1767536638$j38$l0$h0; rxVisitor4tn0mh4k=17723390396908SDO73F6O9F3QDPHK8JUMHE3O5CDFC78; dtCookie4tn0mh4k=v_4_srv_11_sn_1DC3DC5728622F4B9A67A9B3DF9310D6_perc_100000_ol_0_mul_1_app-3A34a71c252bf77eda_1_app-3Acdb5568402318bfc_0_rcs-3Acss_0; dtSa4tn0mh4k=-; rxvt4tn0mh4k=1772350798392|1772339039692; dtPC4tn0mh4k=11$548884926_555h-vPMEHRNNRNMAUPUIHCRCJOCOPBDRWKJOS-0e0";

// 2. Config Supabase (Asegúrate de tener SUPABASE_SERVICE_ROLE_KEY en tus env vars)
const SUPABASE_URL = "https://eapcqcuzfkpqngbvjtmv.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
    console.error("❌ ERROR: Falta la variable de entorno SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testFirmador() {
    console.log("🚀 Iniciando Test Aislado del FirmadorPdf (Node.js)...");

    try {
        // --- PASO 1: Descargar PDF sin firmar ---
        console.log("\n[1] Descargando documento temporal del SRI...");
        const pdfResp = await fetch(
            `https://srienlinea.sri.gob.ec/sri-en-linea/rest/FirmadorPdf/obtenerDocumentoTemporal?token=${jwt}`,
            {
                method: 'GET',
                headers: {
                    'Cookie': cookieHeader,
                    'User-Agent': 'FirmaEC/5.0 (Windows NT 10.0; Win64; x64)',
                    'Origin': 'https://srienlinea.sri.gob.ec',
                    'Referer': 'https://srienlinea.sri.gob.ec/sri-generacion-claves-web-internet/publico/datos.jsf',
                }
            }
        );

        console.log("📡 Status obtenerDocumentoTemporal:", pdfResp.status);
        if (!pdfResp.ok) throw new Error(`Fallo GET: ${pdfResp.status} ${await pdfResp.text()}`);

        const pdfJson = await pdfResp.json();
        const pdfBase64 = pdfJson.documento || pdfJson.pdf || pdfJson.contenido || pdfJson.archivo;
        if (!pdfBase64) throw new Error("No hay documento base64 en la respuesta.");
        console.log("✅ PDF obtenido. Longitud base64:", pdfBase64.length);

        // --- PASO 2: Obtener P12 de Supabase ---
        console.log("\n[2] Obteniendo certificado P12 desde Supabase Storage...");
        const { data: firmaRow, error: dbErr } = await supabase
            .from('firmas_electronicas')
            .select('storage_path, password')
            .or(`ruc_cedula.eq.${cedula},ruc_cedula.eq.${cedula}001,nombre.eq.${cedula}`)
            .limit(1)
            .single();

        if (dbErr || !firmaRow) throw new Error(`No se encontró P12 para la cédula ${cedula}: ${dbErr?.message}`);
        console.log("✅ Firma encontrada:", firmaRow.storage_path);

        const { data: p12Blob, error: storageErr } = await supabase.storage
            .from('firmas')
            .download(firmaRow.storage_path);
        if (storageErr) throw new Error(`Error al descargar P12: ${storageErr.message}`);

        // --- PASO 3: Firmar con node-forge (PKCS#7) ---
        console.log("\n[3] Firmando PDF...");
        const p12Buffer = Buffer.from(await p12Blob.arrayBuffer());
        const p12Asn1 = forge.asn1.fromDer(p12Buffer.toString('binary'));
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, firmaRow.password);

        let privateKey = null;
        let certChain = [];
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
        if (!privateKey) throw new Error("No se pudo extraer la clave privada.");

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
        console.log("✅ PDF Firmado con éxito. Longitud base64:", pdfFirmadoBase64.length);

        // --- PASO 4: Subir PDF Firmado al SRI ---
        console.log("\n[4] Subiendo PDF firmado al SRI (recibirDocumentoFirmado)...");
        const uploadResp = await fetch(
            'https://srienlinea.sri.gob.ec/sri-en-linea/rest/FirmadorPdf/recibirDocumentoFirmado',
            {
                method: 'POST',
                headers: {
                    'Cookie': cookieHeader,
                    'User-Agent': 'FirmaEC/5.0 (Windows NT 10.0; Win64; x64)',
                    'Content-Type': 'application/json',
                    'Origin': 'https://srienlinea.sri.gob.ec',
                },
                body: JSON.stringify({
                    token: jwt,
                    pdfFirmadoBase64: pdfFirmadoBase64,
                })
            }
        );

        console.log("📡 Status recibirDocumentoFirmado:", uploadResp.status);
        const respText = await uploadResp.text();
        console.log("📄 Respuesta del SRI:", respText);

    } catch (err) {
        console.error("\n❌ ERROR DURANTE EL TEST:", err.message);
    }
}

testFirmador();
