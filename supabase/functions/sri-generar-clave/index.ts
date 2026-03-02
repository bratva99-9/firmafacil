import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import puppeteer from "npm:puppeteer-core@22.6.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import forge from "npm:node-forge@1.3.1"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configuración de resolución de captchas
const ANTICAPTCHA_API_KEY = Deno.env.get('ANTICAPTCHA_API_KEY') || ''
const TWOCAPTCHA_API_KEY = Deno.env.get('TWOCAPTCHA_API_KEY') || ''

// Datos del reCAPTCHA Enterprise del portal SRI Generar Clave
// SiteKey extraída por análisis directo del HTML del portal el 2026-03-01
const RECAPTCHA_SITE_KEY = "6LdukTQsAAAAAIcciM4GZq4ibeyplUhmWvlScuQE"
const RECAPTCHA_PAGE_URL = "https://srienlinea.sri.gob.ec/sri-generacion-claves-web-internet/publico/datos.jsf"
const RECAPTCHA_ACTION = "generacion_clave_web" // pageAction real extraída del JS del portal

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function resolverRecaptcha() {
    if (TWOCAPTCHA_API_KEY) {
        console.log("🤖 Intentando con 2Captcha...")
        try {
            return await resolverRecaptchaCon2Captcha()
        } catch (e: any) {
            console.warn("⚠️ 2Captcha falló:", e.message)
            console.log("🔄 Intentando con método alternativo...")
        }
    }

    if (ANTICAPTCHA_API_KEY) {
        console.log("🤖 Usando AntiCaptcha para resolver captcha...")
        try {
            return await resolverRecaptchaConAntiCaptcha()
        } catch (e: any) {
            console.warn("⚠️ AntiCaptcha falló:", e.message)
        }
    }

    throw new Error("Falta configurar ANTICAPTCHA_API_KEY o TWOCAPTCHA_API_KEY en Supabase, o los servicios fallaron.")
}

async function resolverRecaptchaConAntiCaptcha() {
    const createTaskBody = {
        clientKey: ANTICAPTCHA_API_KEY,
        task: {
            type: "RecaptchaV3TaskProxyless",
            websiteURL: RECAPTCHA_PAGE_URL,
            websiteKey: RECAPTCHA_SITE_KEY,
            minScore: 0.7,
            pageAction: RECAPTCHA_ACTION,
            isEnterprise: true  // ⚠️ CRITICO: El SRI usa reCAPTCHA Enterprise (enterprise.js)
        },
    }

    const createResp = await fetch("https://api.anti-captcha.com/createTask", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(createTaskBody),
    })

    if (!createResp.ok) throw new Error(`HTTP ${createResp.status}`)
    const createJson: any = await createResp.json()
    if (createJson.errorId !== 0) throw new Error(`Error AntiCaptcha: ${createJson.errorCode}`)
    const taskId = createJson.taskId

    const start = Date.now()
    while (true) {
        if (Date.now() - start > 120000) throw new Error("Timeout AntiCaptcha")
        await delay(5000)

        const statusResp = await fetch("https://api.anti-captcha.com/getTaskResult", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clientKey: ANTICAPTCHA_API_KEY, taskId }),
        })
        const statusJson: any = await statusResp.json()

        if (statusJson.status === "ready") {
            const token = statusJson.solution?.gRecaptchaResponse
            console.log("✅ Captcha resuelto vía AntiCaptcha (Score 0.7+).")
            return token
        }
    }
}

async function resolverRecaptchaCon2Captcha() {
    // 2Captcha para reCAPTCHA Enterprise (enterprise=1 es CRITICO)
    const inParams = new URLSearchParams({
        key: TWOCAPTCHA_API_KEY, method: 'userrecaptcha', version: 'v3',
        action: RECAPTCHA_ACTION, min_score: '0.7',
        googlekey: RECAPTCHA_SITE_KEY, pageurl: RECAPTCHA_PAGE_URL,
        enterprise: '1', // ⚠️ CRITICO: El SRI usa enterprise.js no api.js
        json: '1'
    })
    const inResp = await fetch(`http://2captcha.com/in.php?${inParams.toString()}`, { method: 'POST' })
    const inJson: any = await inResp.json()
    if (inJson.status !== 1) throw new Error(`2Captcha in.php error: ${inJson.request}`)
    const taskId = inJson.request

    const start = Date.now()
    while (true) {
        if (Date.now() - start > 120000) throw new Error("Timeout 2Captcha")
        await delay(5000)
        const resParams = new URLSearchParams({ key: TWOCAPTCHA_API_KEY, action: 'get', id: taskId, json: '1' })
        const resResp = await fetch(`http://2captcha.com/res.php?${resParams.toString()}`)
        const resJson: any = await resResp.json()

        if (resJson.status === 1) {
            console.log("✅ Captcha resuelto vía 2Captcha (Score 0.7+).")
            return resJson.request
        }
        if (resJson.request !== 'CAPCHA_NOT_READY') throw new Error(`2Captcha res.php error`)
    }
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const body = await req.json()
        const { cedula, correo, celular } = body

        if (!cedula || !correo || !celular) {
            return new Response(JSON.stringify({ success: false, error: 'Faltan parámetros: cedula, correo, celular' }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const BROWSERLESS_API_KEY = Deno.env.get('BROWSERLESS_TOKEN')
        if (!BROWSERLESS_API_KEY) {
            throw new Error("La variable BROWSERLESS_TOKEN no está configurada en los secretos de Supabase.")
        }

        console.log(`🚀 Iniciando generación clave celular para ${cedula} con Browserless...`)

        let browser;
        try {
            console.log("-> Conectando a Browserless WS...")
            browser = await puppeteer.connect({
                browserWSEndpoint: `wss://chrome.browserless.io?token=${BROWSERLESS_API_KEY}`
            })
            console.log("-> Conectado a Browserless!")
        } catch (err) {
            console.error("No se pudo conectar a browserless", err)
            throw new Error("No se pudo conectar al motor de navegación en la nube.")
        }

        const page = await browser.newPage()
        await page.setViewport({ width: 1280, height: 800 })
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        })

        let logTracking = "Iniciando...\n";

        try {
            // Sobreescribir las properties de window location para atrapar la llamada firmaec:// al final
            logTracking += "Inyectando hooks...\n";
            await page.evaluateOnNewDocument(() => {
                (window as any).interceptedFirmaLink = null

                const setHref = Object.getOwnPropertyDescriptor(window.location, 'href')?.set
                Object.defineProperty(window.location, 'href', {
                    set: function (val) {
                        if (val && typeof val === 'string' && val.startsWith('firmaec://')) {
                            (window as any).interceptedFirmaLink = val
                        } else {
                            if (setHref) setHref.call(window.location, val)
                        }
                    },
                    get: function () {
                        return document.location.href
                    }
                })

                const originalAssign = window.location.assign
                window.location.assign = function (val: string | URL) {
                    if (val && typeof val === 'string' && val.startsWith('firmaec://')) {
                        (window as any).interceptedFirmaLink = val
                    } else {
                        originalAssign.call(window.location, val)
                    }
                }
            })

            logTracking += "Disparando resolución de Captcha de fondo...\n";
            console.log("🤖 Solicitando solución de reCAPTCHA a servidores anticaptcha en background...")
            const captchaPromise = resolverRecaptcha(); // Empieza a resolver mientras navegamos

            logTracking += "Navegando a SRI...\n";
            console.log("➡️ Navegando al SRI...")
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => null),
                page.goto("https://srienlinea.sri.gob.ec/sri-generacion-claves-web-internet/publico/datos.jsf")
            ]);

            // 1. Calentamiento Humano (deja que reCAPTCHA Enterprise cargue y perfile el usuario)
            console.log("🔥 Calentando sesión anti-bot (10s)...");
            logTracking += "Esperando a #txtCedula para calentar score de reCAPTCHA...\n";
            await page.waitForSelector('#txtCedula', { visible: true, timeout: 20000 });

            // Simular lectura de pantalla y movimiento errático
            for (let i = 0; i < 10; i++) {
                await page.mouse.move(100 + Math.random() * 400, 100 + Math.random() * 400);
                await new Promise(r => setTimeout(r, 1000));
            }

            // 2. Llenar Cédula con hardware key events
            console.log("📝 Llenando Cédula...");
            logTracking += "Ingresando cédula físicamente...\n";
            await page.click('#txtCedula');
            await page.evaluate(() => { (document.querySelector('#txtCedula') as HTMLInputElement).value = ''; });
            await page.type('#txtCedula', cedula, { delay: 95 });
            await new Promise(r => setTimeout(r, 500));

            // 3. 🔑 Generar token reCAPTCHA Enterprise DENTRO de Puppeteer (misma IP de Browserless)
            //    Esto es crítico: el token generado aquí está vinculado a la sesión/IP del navegador
            //    que el SRI usará para verificar → puntaje real
            logTracking += "Generando token reCAPTCHA Enterprise desde el navegador...\n";
            console.log("🔑 Ejecutando grecaptcha.enterprise.execute() en el navegador de Browserless...");

            const captchaToken = await page.evaluate(async (siteKey: string, action: string) => {
                // Esperar a que reCAPTCHA Enterprise esté listo
                let attempts = 0;
                while (!(window as any).grecaptcha?.enterprise?.execute && attempts < 30) {
                    await new Promise(r => setTimeout(r, 500));
                    attempts++;
                }
                if (!(window as any).grecaptcha?.enterprise?.execute) {
                    throw new Error("grecaptcha.enterprise no está disponible en la página");
                }
                const token = await (window as any).grecaptcha.enterprise.execute(siteKey, { action });
                return token;
            }, "6LdukTQsAAAAAIcciM4GZq4ibeyplUhmWvlScuQE", "generacion_clave_web");

            console.log("✅ Token generado in-page (longitud):", captchaToken?.length);

            logTracking += "Inyectando Token del bot reCAPTCHA...\n";
            console.log("💉 Inyectando Token en Primefaces...");
            await page.evaluate((token: string) => {
                const textareas = document.querySelectorAll('textarea[name="g-recaptcha-response"]')
                textareas.forEach(t => { (t as HTMLTextAreaElement).value = token })
                const byId = document.getElementById('g-recaptcha-response') as HTMLTextAreaElement
                if (byId) byId.value = token
                // Sobrescribir getResponse de Enterprise
                if ((window as any).grecaptcha?.enterprise) {
                    (window as any).grecaptcha.enterprise.getResponse = function () { return token; };
                }
            }, captchaToken);

            // 4. Asegurarse de que el botón de Registrar esté listo y clicar
            logTracking += "Esperando a #btnGuardarCedula...\n";
            console.log("🖱️ Haciendo click en Registrar...");

            await page.waitForSelector('#btnGuardarCedula', { visible: true, timeout: 10000 });
            await page.click('#btnGuardarCedula');

            // 5. Esperar al formulario de Contacto
            logTracking += "Esperando formulario de Contacto...\n";
            console.log("☎️ Llenando Datos de Contacto...");

            // Damos tiempo a la carga AJAX de los campos de correo
            await new Promise(r => setTimeout(r, 1500));

            // Extraer IDs dinámicos de los inputs de contacto
            const idsContacto = await page.evaluate(() => {
                const inputs = Array.from(document.querySelectorAll('input')).filter(i => i.offsetWidth > 0);
                const correos = inputs.filter(i => i.id.toLowerCase().includes('correo')).map(i => i.id);
                const tels = inputs.filter(i => i.id.toLowerCase().includes('celular') || i.id.toLowerCase().includes('telefono')).map(i => i.id);
                return { correos, tels };
            });

            // Usamos tipeo físico humano (fundamental para PrimeFaces)
            for (const id of idsContacto.correos) {
                await page.click(`#${id.replace(/:/g, '\\:')}`);
                await page.evaluate((selector) => { (document.querySelector(selector) as HTMLInputElement).value = '' }, `#${id.replace(/:/g, '\\:')}`);
                await page.type(`#${id.replace(/:/g, '\\:')}`, correo, { delay: 50 });
            }

            for (const id of idsContacto.tels) {
                await page.click(`#${id.replace(/:/g, '\\:')}`);
                await page.evaluate((selector) => { (document.querySelector(selector) as HTMLInputElement).value = '' }, `#${id.replace(/:/g, '\\:')}`);
                await page.type(`#${id.replace(/:/g, '\\:')}`, celular, { delay: 50 });
            }

            await new Promise(r => setTimeout(r, 1000));

            // Click en botón Siguiente (Paso 2->3)
            logTracking += "Click en botón Siguiente de contactos...\n";
            const btnSiguiente1 = await page.evaluateHandle(() => {
                const btns = Array.from(document.querySelectorAll('button')).filter(b => b.offsetWidth > 0);
                return btns.find(b => b.textContent && b.textContent.toLowerCase().includes('siguiente'));
            });
            if (btnSiguiente1 && btnSiguiente1.asElement()) {
                await btnSiguiente1.click();
            }

            // 6. Pantalla Paso 3: Confirmación
            logTracking += "Esperando paso 3 Confirmación...\n";
            console.log("✅ En fase de Confirmación...");

            // Esperamos que PrimeFaces pinte el nuevo texto de la pantalla 3 (Datos del contribuyente o Confirmar)
            await page.waitForFunction(() => {
                return document.body.innerText.includes('Confirmación') || document.body.innerText.includes('Datos del contribuyente');
            }, { timeout: 8000 }).catch(() => console.log("Timeout esperando Confirmación visual"));

            await new Promise(r => setTimeout(r, 500));
            // Clickeamos el Siguiente de la Confirmación (Paso 3->4)
            const btnSiguiente2 = await page.evaluateHandle(() => {
                const btns = Array.from(document.querySelectorAll('button')).filter(b => b.offsetWidth > 0);
                const btnSiguientes = btns.filter(b => b.textContent && b.textContent.toLowerCase().includes('siguiente'));
                // El último suele ser el visible de la pantalla activa en PrimeFaces
                return btnSiguientes[btnSiguientes.length - 1];
            });
            if (btnSiguiente2 && btnSiguiente2.asElement()) {
                await btnSiguiente2.click();
            }

            // 7. Pantalla Paso 4: Firma Electrónica
            logTracking += "Esperando paso 4 Firma...\n";
            console.log("✍️ En fase de Generar Firma...");

            await page.waitForFunction(() => {
                const check = document.querySelector('input[type="checkbox"]');
                return check?.getBoundingClientRect().width || document.body.innerText.includes('Términos') || document.body.innerText.includes('Firma electrónica');
            }, { timeout: 8000 }).catch(() => console.log("Timeout esperando Check Términos visual"));

            await new Promise(r => setTimeout(r, 500));

            // Aquí aceptamos términos usando click nativo
            const checkBox = await page.evaluateHandle(() => {
                const checkTerminos = document.querySelector('input[type="checkbox"]');
                if (checkTerminos && !(checkTerminos as HTMLInputElement).checked) {
                    return checkTerminos;
                }
                return null;
            });
            if (checkBox && checkBox.asElement()) {
                await checkBox.click();
            }

            await new Promise(r => setTimeout(r, 500));

            await new Promise(r => setTimeout(r, 500));

            // 7b. Extraer el link firmaec:// del button antes de dar click
            logTracking += "Extrayendo link firmaec:// del botón...\n";
            const firmaecUrl = await page.evaluate(() => {
                const allLinks = Array.from(document.querySelectorAll('a'));
                const firmaLink = allLinks.find(a => a.href && a.href.startsWith('firmaec://'));
                if (firmaLink) return firmaLink.href;
                // Buscar también en botones con onclick
                const allBtns = Array.from(document.querySelectorAll('button'));
                for (const btn of allBtns) {
                    const oc = btn.getAttribute('onclick') || '';
                    const match = oc.match(/firmaec:\/\/[^'"\s]+/);
                    if (match) return match[0];
                }
                return null;
            });

            if (!firmaecUrl) {
                throw new Error("No se encontró el link firmaec:// en el Paso 4");
            }
            console.log("🔗 URL firmaec encontrada:", firmaecUrl.substring(0, 100));

            // Extraer JWT del link firmaec://
            const jwtMatch = firmaecUrl.match(/token=([^&]+)/);
            const firmajwt = jwtMatch ? jwtMatch[1] : null;
            if (!firmajwt) throw new Error("No se pudo extraer el JWT del link firmaec://");

            // Capturar cookies de la sesión de Puppeteer (las mismas que usa el SRI)
            const cookies = await page.cookies();
            const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
            console.log("🍪 Cookies de sesión capturadas:", cookies.length, "cookies");

            // Click en Firmar solicitud para completar el lado SRI del flujo
            logTracking += "Click en botón Firmar solicitud...\n";
            const btnFirmar = await page.evaluateHandle(() => {
                return Array.from(document.querySelectorAll('a,button'))
                    .find(el => el.textContent?.toLowerCase().includes('firmar'));
            });
            if (btnFirmar && btnFirmar.asElement()) {
                // No esperamos que navegue, solo queremos que el SRI procese
                await btnFirmar.click().catch(() => { });
            }
            await new Promise(r => setTimeout(r, 2000));

            // 📥 Paso 8: Descargar el PDF temporal del SRI (mismas cookies de sesión)
            logTracking += "Descargando PDF temporal del SRI...\n";
            console.log("📥 Descargando PDF temporal con JWT y cookies de sesión...");

            const pdfResp = await fetch(
                `https://srienlinea.sri.gob.ec/sri-en-linea/rest/FirmadorPdf/obtenerDocumentoTemporal?token=${firmajwt}`,
                {
                    method: 'GET',
                    headers: {
                        'Cookie': cookieHeader,
                        'User-Agent': 'FirmaEC/5.0 (Windows NT 10.0; Win64; x64)',
                        'Accept': 'application/json, application/octet-stream, */*',
                        'Origin': 'https://srienlinea.sri.gob.ec',
                        'Referer': 'https://srienlinea.sri.gob.ec/sri-generacion-claves-web-internet/publico/datos.jsf',
                    }
                }
            );

            console.log("📥 Status obtenerDocumentoTemporal:", pdfResp.status);

            if (!pdfResp.ok) {
                const errText = await pdfResp.text();
                throw new Error(`FirmadorPdf retornó ${pdfResp.status}: ${errText.substring(0, 300)}`);
            }

            const pdfJson: any = await pdfResp.json();
            const pdfBase64 = pdfJson.documento || pdfJson.pdf || pdfJson.contenido || pdfJson.archivo || null;
            if (!pdfBase64) throw new Error("El SRI no devolver el PDF en la respuesta: " + JSON.stringify(pdfJson).substring(0, 300));

            console.log("✅ PDF temporal obtenido (longitud base64):", pdfBase64.length);

            // 🔐 Paso 9: Obtener el P12 de Supabase Storage
            logTracking += "Cargando certificado P12 de Supabase...\n";
            const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
            const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
            const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

            // Buscar el certificado de la cédula en la tabla (acepta cédula o RUC)
            const cedulaBase = cedula.length === 13 ? cedula.substring(0, 10) : cedula;
            const { data: firmaRow } = await supabase
                .from('firmas_electronicas')
                .select('storage_path, password')
                .or(`ruc_cedula.eq.${cedulaBase},ruc_cedula.eq.${cedulaBase}001,nombre.eq.${cedulaBase}`)
                .limit(1)
                .single();

            if (!firmaRow) throw new Error(`No se encontró la firma electrónica para la cédula ${cedula}`);

            const { data: p12Blob, error: storageErr } = await supabase.storage
                .from('firmas')
                .download(firmaRow.storage_path);

            if (storageErr || !p12Blob) throw new Error(`Error al descargar el P12: ${storageErr?.message}`);

            const p12ArrayBuffer = await p12Blob.arrayBuffer();
            const p12Der = String.fromCharCode(...new Uint8Array(p12ArrayBuffer));
            const p12Asn1 = forge.asn1.fromDer(p12Der);
            const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, firmaRow.password);

            // Extraer clave privada y certificado
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
            if (!privateKey) throw new Error("No se pudo extraer la clave privada del P12");
            console.log("✅ P12 cargado. Certificados:", certChain.length);

            // ✍️ Paso 10: Firmar el PDF con PKCS#7 / PAdES
            logTracking += "Firmando PDF con P12...\n";
            const pdfBytes = forge.util.decode64(pdfBase64);

            // Crear el contenedor PKCS#7 para firma digital
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

            const pdfFirmadoDer = forge.asn1.toDer(p7.toAsn1()).getBytes();
            const pdfFirmadoBase64 = forge.util.encode64(pdfFirmadoDer);
            console.log("✅ PDF firmado (longitud base64):", pdfFirmadoBase64.length);

            // 📤 Paso 11: Subir PDF firmado al SRI
            logTracking += "Subiendo PDF firmado al SRI...\n";
            const uploadResp = await fetch(
                'https://srienlinea.sri.gob.ec/sri-en-linea/rest/FirmadorPdf/recibirDocumentoFirmado',
                {
                    method: 'POST',
                    headers: {
                        'Cookie': cookieHeader,
                        'User-Agent': 'FirmaEC/5.0 (Windows NT 10.0; Win64; x64)',
                        'Content-Type': 'application/json',
                        'Accept': 'application/json, */*',
                        'Origin': 'https://srienlinea.sri.gob.ec',
                    },
                    body: JSON.stringify({
                        token: firmajwt,
                        pdfFirmadoBase64: pdfFirmadoBase64,
                    })
                }
            );

            console.log("📤 Status recibirDocumentoFirmado:", uploadResp.status);
            const uploadText = await uploadResp.text();
            console.log("📤 Respuesta SRI:", uploadText.substring(0, 500));

            if (browser) await browser.close();

            return new Response(JSON.stringify({
                success: uploadResp.ok,
                message: uploadResp.ok
                    ? '✅ Clave generada exitosamente. El SRI ha enviado las instrucciones a tu correo electrónico.'
                    : '⚠️ El SRI no confirmó la firma. Revisa el correo o intenta más tarde.',
                sriResponse: uploadText.substring(0, 1000),
                firmaecUrl: firmaecUrl,
            }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        } catch (botErr: any) {
            console.error("❌ El bot murió en medio de la operación:")
            console.error("🔖 Historial de acciones antes de morir:\n" + logTracking)
            if (browser) await browser.close()
            throw new Error(`Browserless abortó la navegación: ${botErr?.message}\nÚltimo paso: \n${logTracking}`)
        }

    } catch (error: any) {
        console.error("Error global en sri-generar-clave:", error)
        return new Response(JSON.stringify({ success: false, error: error.message || error.toString() }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
