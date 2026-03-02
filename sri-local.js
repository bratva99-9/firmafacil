// sri-local.js
// ============================================================
// Versión LOCAL del bot de generación de clave SRI.
// Corre directamente en tu PC con Playwright (navegador visible).
// ============================================================
// CONFIGURACIÓN: Crea un archivo .env.sri con estas variables:
//   TWOCAPTCHA_API_KEY=tu_llave_aqui
//   SUPABASE_URL=https://eapcqcuzfkpqngbvjtmv.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
// ============================================================
// Ejecutar: node sri-local.js

require('dotenv').config({ path: '.env.sri' })

const { chromium } = require('playwright')
const forge = require('node-forge')
const { createClient } = require('@supabase/supabase-js')

// ──────────────────────────────────────────────
// PARÁMETROS DEL PROCESO (cambia estos valores)
// ──────────────────────────────────────────────
const CEDULA = '1712345678'   // ← Cambia aquí
const CORREO = 'prueba@email.com'  // ← Cambia aquí
const CELULAR = '0991234567'   // ← Cambia aquí

// ──────────────────────────────────────────────
// CONFIG CAPTCHA
// ──────────────────────────────────────────────
const TWOCAPTCHA_API_KEY = process.env.TWOCAPTCHA_API_KEY || ''
const ANTICAPTCHA_API_KEY = process.env.ANTICAPTCHA_API_KEY || ''
const RECAPTCHA_SITE_KEY = '6LdukTQsAAAAAIcciM4GZq4ibeyplUhmWvlScuQE'
const RECAPTCHA_PAGE_URL = 'https://srienlinea.sri.gob.ec/sri-generacion-claves-web-internet/publico/datos.jsf'
const RECAPTCHA_ACTION = 'generacion_clave_web'

// ──────────────────────────────────────────────
// SUPABASE
// ──────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const delay = ms => new Promise(r => setTimeout(r, ms))

// ──────────────────────────────────────────────
// RESOLVER RECAPTCHA ENTERPRISE
// ──────────────────────────────────────────────
async function resolverRecaptchaCon2Captcha() {
    console.log('🤖 Solicitando token a 2Captcha...')
    const params = new URLSearchParams({
        key: TWOCAPTCHA_API_KEY, method: 'userrecaptcha', version: 'v3',
        action: RECAPTCHA_ACTION, min_score: '0.7',
        googlekey: RECAPTCHA_SITE_KEY, pageurl: RECAPTCHA_PAGE_URL,
        enterprise: '1', json: '1'
    })
    const resp = await fetch(`http://2captcha.com/in.php?${params}`, { method: 'POST' })
    const json = await resp.json()
    if (json.status !== 1) throw new Error(`2Captcha error: ${json.request}`)
    const taskId = json.request

    const start = Date.now()
    while (true) {
        if (Date.now() - start > 120000) throw new Error('Timeout 2Captcha')
        await delay(5000)
        const r = await (await fetch(`http://2captcha.com/res.php?key=${TWOCAPTCHA_API_KEY}&action=get&id=${taskId}&json=1`)).json()
        if (r.status === 1) {
            console.log('✅ Token recibido de 2Captcha')
            return r.request
        }
        if (r.request !== 'CAPCHA_NOT_READY') throw new Error('2Captcha fallo')
    }
}

async function resolverRecaptchaConAntiCaptcha() {
    console.log('🤖 Solicitando token a AntiCaptcha...')
    const cr = await (await fetch('https://api.anti-captcha.com/createTask', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            clientKey: ANTICAPTCHA_API_KEY,
            task: { type: 'RecaptchaV3TaskProxyless', websiteURL: RECAPTCHA_PAGE_URL, websiteKey: RECAPTCHA_SITE_KEY, minScore: 0.7, pageAction: RECAPTCHA_ACTION, isEnterprise: true }
        })
    })).json()
    if (cr.errorId !== 0) throw new Error(`AntiCaptcha error: ${cr.errorCode}`)
    const taskId = cr.taskId

    const start = Date.now()
    while (true) {
        if (Date.now() - start > 120000) throw new Error('Timeout AntiCaptcha')
        await delay(5000)
        const r = await (await fetch('https://api.anti-captcha.com/getTaskResult', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientKey: ANTICAPTCHA_API_KEY, taskId })
        })).json()
        if (r.status === 'ready') {
            console.log('✅ Token recibido de AntiCaptcha')
            return r.solution.gRecaptchaResponse
        }
    }
}

async function resolverRecaptcha() {
    if (TWOCAPTCHA_API_KEY) return await resolverRecaptchaCon2Captcha()
    if (ANTICAPTCHA_API_KEY) return await resolverRecaptchaConAntiCaptcha()
    throw new Error('Configura TWOCAPTCHA_API_KEY o ANTICAPTCHA_API_KEY en .env.sri')
}

// ──────────────────────────────────────────────
// FUNCIÓN PRINCIPAL
// ──────────────────────────────────────────────
; (async () => {
    console.log('\n🚀 Iniciando Bot SRI Local con Playwright')
    console.log('=========================================')
    console.log(`📋 Cédula: ${CEDULA} | Correo: ${CORREO} | Celular: ${CELULAR}\n`)

    // Lanzar Chrome LOCAL visible (headless: false = puedes ver lo que hace)
    const browser = await chromium.launch({
        headless: false,           // ← Cambia a true para que corra sin ventana
        slowMo: 30,                // Pequeña pausa entre acciones (ms)
        args: ['--start-maximized']
    })

    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        locale: 'es-EC',
        viewport: null,            // Usa el tamaño real de la ventana
    })

    const page = await context.newPage()

    // ── Hook: interceptar el protocolo firmaec:// ──────────────────
    await context.addInitScript(() => {
        window.interceptedFirmaLink = null
        const desc = Object.getOwnPropertyDescriptor(window.location, 'href')
        Object.defineProperty(window.location, 'href', {
            set(val) {
                if (val && String(val).startsWith('firmaec://')) {
                    window.interceptedFirmaLink = val
                } else if (desc && desc.set) {
                    desc.set.call(window.location, val)
                }
            },
            get() { return document.location.href }
        })
        const origAssign = window.location.assign.bind(window.location)
        window.location.assign = function (val) {
            if (val && String(val).startsWith('firmaec://')) {
                window.interceptedFirmaLink = val
            } else {
                origAssign(val)
            }
        }
    })

    try {
        // ── 1. Resolver CAPTCHA en paralelo mientras cargamos la página ──
        console.log('⏳ Iniciando resolución de CAPTCHA en background...')
        const captchaPromise = resolverRecaptcha()

        // ── 2. Navegar al SRI ─────────────────────────────────────────
        console.log('➡️  Navegando al SRI...')
        await page.goto(RECAPTCHA_PAGE_URL, { waitUntil: 'networkidle' })
        await page.waitForSelector('#txtCedula', { state: 'visible', timeout: 20000 })
        console.log('✅ Página SRI cargada')

        // ── 3. Simular comportamiento humano (calentamiento) ──────────
        console.log('🔥 Calentando sesión (movimientos de mouse)...')
        for (let i = 0; i < 8; i++) {
            await page.mouse.move(100 + Math.random() * 600, 100 + Math.random() * 400)
            await delay(800 + Math.random() * 400)
        }

        // ── 4. Llenar la CÉDULA ────────────────────────────────────────
        console.log('📝 Escribiendo cédula...')
        await page.click('#txtCedula')
        await page.fill('#txtCedula', '')
        await page.type('#txtCedula', CEDULA, { delay: 90 })
        await delay(500)

        // ── 5. Esperar y usar el token del servicio externo ───────────
        console.log('⏳ Esperando token de CAPTCHA externo...')
        const captchaToken = await captchaPromise

        // ── 6. Inyectar el token EN el navegador real ─────────────────
        console.log('💉 Inyectando token en la página...')
        await page.evaluate((token) => {
            // Inyectar en todos los textareas de recaptcha
            document.querySelectorAll('textarea[name="g-recaptcha-response"]')
                .forEach(t => { t.value = token })
            const byId = document.getElementById('g-recaptcha-response')
            if (byId) byId.value = token

            // Sobrescribir grecaptcha.enterprise para que la página use nuestro token
            if (window.grecaptcha?.enterprise) {
                window.grecaptcha.enterprise.execute = async () => token
                window.grecaptcha.enterprise.getResponse = () => token
            }
        }, captchaToken)

        // ── 7. Click en Registrar ──────────────────────────────────────
        console.log('🖱️  Haciendo click en Registrar...')
        await page.waitForSelector('#btnGuardarCedula', { state: 'visible', timeout: 10000 })
        await page.click('#btnGuardarCedula')

        // ── 8. Llenar datos de contacto ────────────────────────────────
        console.log('☎️  Esperando formulario de contacto...')
        await delay(2000)

        // Buscar inputs visibles de correo y celular
        const correoInputs = await page.$$('input:visible')
        for (const input of correoInputs) {
            const id = await input.getAttribute('id') || ''
            if (id.toLowerCase().includes('correo')) {
                await input.click()
                await input.fill('')
                await input.type(CORREO, { delay: 50 })
                console.log(`✅ Correo ingresado en #${id}`)
            }
            if (id.toLowerCase().includes('celular') || id.toLowerCase().includes('telefono')) {
                await input.click()
                await input.fill('')
                await input.type(CELULAR, { delay: 50 })
                console.log(`✅ Celular ingresado en #${id}`)
            }
        }

        await delay(1000)

        // ── 9. Click en Siguiente (paso 2→3) ──────────────────────────
        console.log('👆 Haciendo click en Siguiente...')
        const btnSig = await page.getByRole('button', { name: /siguiente/i }).last()
        if (btnSig) await btnSig.click()

        // ── 10. Confirmación (paso 3) ──────────────────────────────────
        await page.waitForFunction(() =>
            document.body.innerText.includes('Confirmación') ||
            document.body.innerText.includes('Datos del contribuyente'), { timeout: 8000 }
        ).catch(() => console.log('⚠️ No se detectó pantalla de Confirmación'))

        await delay(500)
        const btnSig2 = await page.getByRole('button', { name: /siguiente/i }).last()
        if (btnSig2) await btnSig2.click()

        // ── 11. Aceptar términos y firmar (paso 4) ─────────────────────
        console.log('📜 Aceptando términos...')
        await delay(2000)
        const checkbox = await page.$('input[type="checkbox"]')
        if (checkbox) {
            const checked = await checkbox.isChecked()
            if (!checked) await checkbox.click()
        }
        await delay(500)

        // ── 12. Buscar URL firmaec:// ──────────────────────────────────
        console.log('🔗 Buscando URL firmaec://')
        const firmaecUrl = await page.evaluate(() => {
            for (const a of document.querySelectorAll('a')) {
                if (a.href?.startsWith('firmaec://')) return a.href
            }
            for (const btn of document.querySelectorAll('button')) {
                const oc = btn.getAttribute('onclick') || ''
                const m = oc.match(/firmaec:\/\/[^\s'"]+/)
                if (m) return m[0]
            }
            return window.interceptedFirmaLink || null
        })

        if (!firmaecUrl) {
            console.error('❌ No se encontró URL firmaec://. El proceso se detuvo en paso 4.')
            console.log('💡 Revisa el navegador abierto para ver el estado actual.')
            return // No cerramos el navegador para que puedas verlo
        }

        console.log('✅ URL firmaec encontrada:', firmaecUrl.substring(0, 80))

        // ── 13. Extraer JWT ────────────────────────────────────────────
        const jwtMatch = firmaecUrl.match(/token=([^&]+)/)
        const firmajwt = jwtMatch?.[1]
        if (!firmajwt) throw new Error('No se pudo extraer el JWT de firmaec://')

        // ── 14. Capturar cookies de sesión ─────────────────────────────
        const cookies = await context.cookies()
        const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ')
        console.log(`🍪 ${cookies.length} cookies capturadas`)

        // ── 15. Click en Firmar solicitud ──────────────────────────────
        const btnFirmar = await page.getByRole('link', { name: /firmar/i }).first()
            .or(page.getByRole('button', { name: /firmar/i }).first())
        if (btnFirmar) await btnFirmar.click().catch(() => { })
        await delay(2000)

        // ── 16. Descargar PDF temporal del SRI ─────────────────────────
        console.log('📥 Descargando PDF del SRI...')
        const pdfResp = await fetch(
            `https://srienlinea.sri.gob.ec/sri-firmador-pdf-servicio-internet/rest/FirmadorPdf/obtenerDocumentoTemporal?token=${firmajwt}`,
            { method: 'GET', headers: { 'Cookie': cookieHeader, 'User-Agent': 'FirmaEC/5.0', 'Accept': 'application/json, */*' } }
        )
        if (!pdfResp.ok) throw new Error(`FirmadorPdf retornó ${pdfResp.status}`)
        const pdfJson = await pdfResp.json()
        const pdfBase64 = pdfJson.documento || pdfJson.pdf || pdfJson.contenido || pdfJson.archivo
        if (!pdfBase64) throw new Error('El SRI no devolvió el PDF: ' + JSON.stringify(pdfJson).substring(0, 200))
        console.log('✅ PDF descargado, longitud base64:', pdfBase64.length)

        // ── 17. Obtener certificado P12 de Supabase ────────────────────
        console.log('🔐 Cargando certificado P12 de Supabase...')
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        const { data: firmaRow } = await supabase
            .from('firmas_electronicas')
            .select('storage_path, password')
            .or(`ruc_cedula.eq.${CEDULA},nombre.eq.${CEDULA}`)
            .limit(1)
            .single()

        if (!firmaRow) throw new Error(`No se encontró firma para cédula ${CEDULA}`)

        const { data: p12Blob, error: storageErr } = await supabase.storage
            .from('firmas').download(firmaRow.storage_path)
        if (storageErr || !p12Blob) throw new Error(`Error P12: ${storageErr?.message}`)

        const p12Bytes = Buffer.from(await p12Blob.arrayBuffer())
        const p12Der = p12Bytes.toString('binary')
        const p12Asn1 = forge.asn1.fromDer(p12Der)
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, firmaRow.password)

        let privateKey = null, certChain = []
        for (const sc of p12.safeContents) {
            for (const sb of sc.safeBags) {
                if (sb.type === forge.pki.oids.pkcs8ShroudedKeyBag || sb.type === forge.pki.oids.keyBag)
                    privateKey = sb.key
                if (sb.type === forge.pki.oids.certBag && sb.cert)
                    certChain.push(sb.cert)
            }
        }
        if (!privateKey) throw new Error('No se encontró la clave privada en el P12')
        console.log('✅ P12 cargado, certificados:', certChain.length)

        // ── 18. Firmar el PDF ──────────────────────────────────────────
        console.log('✍️  Firmando PDF con PKCS#7...')
        const pdfBytes = forge.util.decode64(pdfBase64)
        const p7 = forge.pkcs7.createSignedData()
        p7.content = forge.util.createBuffer(pdfBytes)
        certChain.forEach(c => p7.addCertificate(c))
        p7.addSigner({
            key: privateKey, certificate: certChain[0],
            digestAlgorithm: forge.pki.oids.sha256,
            authenticatedAttributes: [
                { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
                { type: forge.pki.oids.messageDigest },
                { type: forge.pki.oids.signingTime, value: new Date() },
            ],
        })
        p7.sign()
        const pdfFirmadoBase64 = forge.util.encode64(forge.asn1.toDer(p7.toAsn1()).getBytes())
        console.log('✅ PDF firmado, longitud:', pdfFirmadoBase64.length)

        // ── 19. Subir PDF firmado al SRI ───────────────────────────────
        console.log('📤 Subiendo PDF firmado al SRI...')
        const uploadResp = await fetch(
            'https://srienlinea.sri.gob.ec/sri-firmador-pdf-servicio-internet/rest/FirmadorPdf/recibirDocumentoFirmado',
            {
                method: 'POST',
                headers: { 'Cookie': cookieHeader, 'User-Agent': 'FirmaEC/5.0', 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: firmajwt, pdfFirmadoBase64 })
            }
        )
        const uploadText = await uploadResp.text()
        console.log('📤 Respuesta SRI:', uploadText.substring(0, 300))

        if (uploadResp.ok) {
            console.log('\n🎉 ¡PROCESO COMPLETADO EXITOSAMENTE!')
            console.log('📧 El SRI envió las instrucciones de acceso al correo registrado.')
        } else {
            console.log('\n⚠️ El SRI respondió con error. Revisa el mensaje de arriba.')
        }

        await delay(3000) // Dar tiempo a ver el resultado en el navegador
        await browser.close()

    } catch (err) {
        console.error('\n❌ Error:', err.message)
        console.log('💡 El navegador permanece abierto para que puedas inspeccionar el estado.')
        // No cerramos el browser para poder inspeccionar
    }
})()
