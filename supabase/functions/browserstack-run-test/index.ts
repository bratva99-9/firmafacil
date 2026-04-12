import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const AK = 'o4ObHCzichKEo0ccWAJcPspbcseBZdvU'
const SK = 'oDlzOPSEBnQj4hl59CSISaVL'
const HOST = 'api.vmoscloud.com'
const SERVICE = 'armcloud-paas'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function sha256hex(data: string): Promise<string> {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data))
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function hmacSHA256bytes(data: string, key: string | Uint8Array): Promise<Uint8Array> {
    const rawKey = typeof key === 'string' ? new TextEncoder().encode(key) : key
    const cryptoKey = await crypto.subtle.importKey('raw', rawKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data)))
}

async function hmacSHA256hex(data: string, key: string | Uint8Array): Promise<string> {
    const bytes = await hmacSHA256bytes(data, key)
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function buildVmosHeaders(bodyJson: string): Promise<Record<string, string>> {
    const now = new Date()
    const xDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
    const shortDate = xDate.substring(0, 8)
    const contentType = 'application/json'
    const bodyHash = await sha256hex(bodyJson)
    const credentialScope = `${shortDate}/${SERVICE}/request`
    const canonicalString = [`host:${HOST}`, `x-date:${xDate}`, `content-type:${contentType}`, `signedHeaders:content-type;host;x-content-sha256;x-date`, `x-content-sha256:${bodyHash}`].join('\n')
    const canonicalHash = await sha256hex(canonicalString)
    const stringToSign = ['HMAC-SHA256', xDate, credentialScope, canonicalHash].join('\n')
    const kDate = await hmacSHA256bytes(shortDate, SK)
    const kService = await hmacSHA256bytes(SERVICE, kDate)
    const kSigning = await hmacSHA256bytes('request', kService)
    const signature = await hmacSHA256hex(stringToSign, kSigning)
    const authorization = `HMAC-SHA256 Credential=${AK}/${credentialScope}, SignedHeaders=content-type;host;x-content-sha256;x-date, Signature=${signature}`
    return { 'Content-Type': contentType, 'x-date': xDate, 'x-content-sha256': bodyHash, 'x-host': HOST, 'Authorization': authorization }
}

async function vmosPost(path: string, body: object): Promise<any> {
    const bodyJson = JSON.stringify(body)
    const headers = await buildVmosHeaders(bodyJson)
    const resp = await fetch(`https://${HOST}${path}`, { method: 'POST', headers, body: bodyJson })
    const text = await resp.text()
    try { return JSON.parse(text) } catch { return { raw: text } }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// ── Mail.tm Logic ──
const MAILTM_API = 'https://api.mail.tm'

async function mailtmRequest(path: string, method = 'GET', body?: object, token?: string): Promise<any> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`${MAILTM_API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
    const text = await res.text()
    try { return JSON.parse(text) } catch { return { raw: text } }
}

const PKG = 'ec.gob.gobiernoelectronico.gobec'

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
    const respond = (data: object, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    try {
        const body = await req.json()
        const { action, padCode = 'APP5AU4BBH7BM68X' } = body
        console.log(`🚀 VMOS Action: ${action}`)

        if (action === 'info') return respond({ success: true, data: await vmosPost('/vcpcloud/api/padApi/padInfo', { padCode }) })
        if (action === 'screenshot') return respond({ success: true, data: await vmosPost('/vcpcloud/api/padApi/screenshot', { padCodes: [padCode], rotation: 0 }) })
        if (action === 'startApp') return respond({ success: true, data: await vmosPost('/vcpcloud/api/padApi/startApp', { padCodes: [padCode], pkgName: body.packageName }) })
        if (action === 'stopApp') return respond({ success: true, data: await vmosPost('/vcpcloud/api/padApi/stopApp', { padCodes: [padCode], pkgName: body.packageName }) })

        // ── MAIL.TM ACTIONS ──
        if (action === 'createEmail') {
            const domains = await mailtmRequest('/domains')
            if (!domains['hydra:member']?.[0]?.domain) return respond({ success: false, error: 'No domains available' }, 502)
            const domain = domains['hydra:member'][0].domain
            const address = `${Math.random().toString(36).substring(2, 12)}@${domain}`
            const password = 'Password123!'
            const acc = await mailtmRequest('/accounts', 'POST', { address, password })
            if (acc.error || acc.raw) return respond({ success: false, error: 'Account creation failed', detail: acc }, 502)
            const tok = await mailtmRequest('/token', 'POST', { address, password })
            return respond({ success: true, address, token: tok.token })
        }

        if (action === 'checkInbox') {
            const msgs = await mailtmRequest('/messages', 'GET', undefined, body.token)
            return respond({ success: true, messages: Array.isArray(msgs['hydra:member']) ? msgs['hydra:member'] : [] })
        }

        if (action === 'readMessage') {
            const msg = await mailtmRequest(`/messages/${body.messageId}`, 'GET', undefined, body.token)
            return respond({ success: true, message: msg })
        }

        if (action === 'runTest') {
            const cedula = body.cedula as string
            const tempEmail = body.tempEmail as { address: string, token: string }
            const logs: string[] = []
            const log = (msg: string) => { console.log(msg); logs.push(`[${new Date().toISOString().split('T')[1].slice(0, 8)}] ${msg}`) }

            if (!cedula || !tempEmail?.address) return respond({ success: false, error: 'Faltan parámetros', logs }, 400)

            const tap = async (x: number, y: number, s = 3000) => {
                await vmosPost('/vcpcloud/api/padApi/asyncCmd', { padCodes: [padCode], scriptContent: `input tap ${x} ${y}` })
                await sleep(s)
            }

            const type = async (txt: string) => {
                await vmosPost('/vcpcloud/api/padApi/asyncCmd', { padCodes: [padCode], scriptContent: `input text ${txt}` })
                await sleep(1000)
            }

            // 1. Limpieza inicial
            log('🧹 Limpieza de Descargas...')
            await vmosPost('/vcpcloud/api/padApi/asyncCmd', {
                padCodes: [padCode],
                scriptContent: 'rm -rf /sdcard/Download/*.p12* && pm clear com.android.providers.media && pm clear com.android.providers.downloads && pm clear com.android.documentsui'
            })
            await sleep(2000)

            // 2. Obtener firma
            log(`🔍 Buscando certificado para ${cedula}...`)
            const { data: firma } = await supabase.from('firmas_electronicas').select('storage_path, password').eq('nombre', cedula).single()
            if (!firma) return respond({ success: false, error: 'No existe firma', logs }, 404)

            const { data: sData } = await supabase.storage.from('firmas_p12').createSignedUrl(firma.storage_path, 300)
            if (!sData?.signedUrl) return respond({ success: false, error: 'Error URL firmado', logs }, 500)

            // 3. Subir archivo
            log('📥 Subiendo certificado...')
            await vmosPost('/vcpcloud/api/padApi/uploadFileV3', {
                padCodes: [padCode],
                url: sData.signedUrl,
                fileName: `firma_${cedula}.p12`,
                customizeFilePath: '/sdcard/Download/'
            })
            await sleep(5000)

            // 4. Iniciar App
            log('🚀 Iniciando App Gob.ec...')
            await vmosPost('/vcpcloud/api/padApi/stopApp', { padCodes: [padCode], pkgName: PKG }); await sleep(2000)
            await vmosPost('/vcpcloud/api/padApi/startApp', { padCodes: [padCode], pkgName: PKG }); await sleep(8000)

            // 5. Flujo Gob.ec (COORDINADAS EXACTAS STEP 2401)
            log('👆 Regístrate...')
            await tap(298, 2314, 4000)
            log('👆 Firma Electrónica...')
            await tap(264, 1804, 4000)
            log('👆 Buscar certificado...')
            await tap(545, 1242, 4000)
            log('📁 Seleccionar archivo...')
            await tap(531, 629, 3000)
            log('⌨️ Escribir cédula...')
            await tap(326, 933, 1500); await type(cedula)
            log('🔑 Escribir clave...')
            await tap(326, 1209, 1500); await type(firma.password)
            log('⏳ Esperando 3 segundos adicionales...')
            await sleep(3000)
            log('👆 Continuar...')
            await tap(778, 1387, 6000)

            log('📧 Ingresar correo...')
            await tap(191, 1284, 1500); await type(tempEmail.address)
            await tap(219, 1116, 1500); await type(tempEmail.address)
            log('👆 Continuar correo...')
            await tap(736, 1364, 5000)

            log('⏳ Esperando código SAU 30 segundos...')
            let code = null;
            const startWait = Date.now();
            while (Date.now() - startWait < 30000) {
                const msgs = await mailtmRequest('/messages', 'GET', undefined, tempEmail.token);
                if (msgs && Array.isArray(msgs['hydra:member']) && msgs['hydra:member'].length > 0) {
                    const sauMsg = msgs['hydra:member']
                        .filter(m => m.subject && (m.subject.includes('SAU') || m.subject.toLowerCase().includes('autenticaci') || m.from?.address?.toLowerCase().includes('autenticacion')))
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || msgs['hydra:member'][0];

                    if (sauMsg) {
                        const msgResp = await mailtmRequest(`/messages/${sauMsg.id}`, 'GET', undefined, tempEmail.token);
                        const bodyMail = msgResp?.text || msgResp?.html?.[0] || '';
                        const match = bodyMail.match(/[Cc]ódigo[:\s]+([0-9]{4,8})/) || bodyMail.match(/(?:es:|:)\s*([0-9]{6})/) || bodyMail.match(/([0-9]{6})/);
                        if (match && match[1]) {
                            code = match[1];
                            break;
                        }
                    }
                }
                await sleep(4000);
            }

            if (!code) {
                log('❌ No llegó el código SAU a tiempo (30s). Cerrando app...')
                await vmosPost('/vcpcloud/api/padApi/stopApp', { padCodes: [padCode], pkgName: PKG })
                const shot = await vmosPost('/vcpcloud/api/padApi/screenshot', { padCodes: [padCode], rotation: 0 })
                return respond({ success: false, error: 'Código agotado', logs, screenshot: Array.isArray(shot?.data) ? shot.data[0]?.url : null }, 408)
            }
            log(`✅ Código recibido en Edge: ${code}`)

            // 6. Ingreso de código y contraseña final
            log('🔢 Ingresar código...')
            await tap(247, 915, 1500); await type(code);

            log('🔑 Ingresar contraseña...')
            const newPass = 'Ecuadorlegal2026.'
            await tap(238, 1050, 1500); await type(newPass);

            log('🔑 Confirmar contraseña...')
            await tap(200, 1172, 1500); await type(newPass);

            log('⏳ Esperando 4 segundos antes de continuar...')
            await sleep(4000);

            log('👆 Continuar (Final)...')
            await tap(783, 1401, 8000)

            log('✅ Automatización finalizada.')
            const finalShot = await vmosPost('/vcpcloud/api/padApi/screenshot', { padCodes: [padCode], rotation: 0 })
            return respond({ success: true, logs, screenshot: Array.isArray(finalShot?.data) ? finalShot.data[0]?.url : null })
        }

        if (action === 'runPart2') {
            const cedula = body.cedula as string
            const logs: string[] = []
            const log = (msg: string) => { console.log(msg); logs.push(`[${new Date().toISOString().split('T')[1].slice(0, 8)}] ${msg}`) }

            const tap = async (x: number, y: number, s = 3000) => {
                await vmosPost('/vcpcloud/api/padApi/asyncCmd', { padCodes: [padCode], scriptContent: `input tap ${x} ${y}` })
                await sleep(s)
            }

            const type = async (txt: string) => {
                await vmosPost('/vcpcloud/api/padApi/asyncCmd', { padCodes: [padCode], scriptContent: `input text ${txt}` })
                await sleep(1000)
            }

            const swipe = async (x1: number, y1: number, x2: number, y2: number, duration: number, s = 3000) => {
                await vmosPost('/vcpcloud/api/padApi/asyncCmd', { padCodes: [padCode], scriptContent: `input swipe ${x1} ${y1} ${x2} ${y2} ${duration}` })
                await sleep(s)
            }

            if (!cedula) return respond({ success: false, error: 'Cédula es requerida para iniciar sesión', logs }, 400)

            log('📱 Iniciando Parte 2: Eliminación de archivo...')
            log('🚀 Abriendo app de Archivos...')
            await vmosPost('/vcpcloud/api/padApi/stopApp', { padCodes: [padCode], pkgName: 'com.android.documentsui' })
            await sleep(1500)
            await vmosPost('/vcpcloud/api/padApi/startApp', { padCodes: [padCode], pkgName: 'com.android.documentsui' })
            await sleep(6000)

            log('👆 Manteniendo presionado (2s) el archivo (293, 989)...')
            // input swipe con mismas coordenadas simula un long press
            await swipe(293, 989, 293, 989, 2000, 2000)

            log('🗑️ Tocar Eliminar (857, 152)...')
            await tap(857, 152, 2000)

            log('✅ Tocar Aceptar (815, 1280)...')
            await tap(815, 1280, 2000)

            log('🛑 Cerrando app de descargas...')
            await vmosPost('/vcpcloud/api/padApi/asyncCmd', { padCodes: [padCode], scriptContent: 'pm clear com.android.documentsui' });
            await sleep(2000);

            log('🚀 Abriendo nuevamente Gob.ec para iniciar sesión...')
            await vmosPost('/vcpcloud/api/padApi/startApp', { padCodes: [padCode], pkgName: PKG })
            await sleep(8000)

            log(`⌨️ Ingresar cédula (${cedula})...`)
            await tap(252, 1233, 1500); await type(cedula);

            log('🔑 Ingresar clave maestra...')
            await tap(219, 1495, 1500); await type('Ecuadorlegal2026.');

            log('⬇️ Ocultando teclado...')
            await vmosPost('/vcpcloud/api/padApi/asyncCmd', { padCodes: [padCode], scriptContent: 'input keyevent 4' })
            await sleep(2000);

            log('👆 Tocar Ingresar...')
            await tap(531, 1827, 4000);

            log('⏳ Esperando 10 segundos obligatorios para que cargue la pantalla del código...')
            await sleep(10000)

            // Fetching Token
            const tempEmail = body.tempEmail as { address: string, token: string }
            if (!tempEmail?.token) {
                log('⚠️ Falla de Frontend: No se envió token temporal a Part 2. Evitando lectura de SAU 2.')
            } else {
                log('⏳ Buscando el último correo SAU recién llegado (hasta 30s)...')
                let code2 = null;
                const startWait2 = Date.now();
                while (Date.now() - startWait2 < 30000) {
                    const msgs = await mailtmRequest('/messages', 'GET', undefined, tempEmail.token);
                    if (msgs && Array.isArray(msgs['hydra:member']) && msgs['hydra:member'].length > 0) {
                        // Tomar solo los correos creados DESPUÉS de darle al botón Ingresar (con 10 seg de margen por sincronización)
                        const allMsgs = msgs['hydra:member']
                            .filter(m => new Date(m.createdAt).getTime() > startWait2 - 10000)
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                        for (const sauMsg of allMsgs) {
                            const msgResp = await mailtmRequest(`/messages/${sauMsg.id}`, 'GET', undefined, tempEmail.token);
                            const rawBody = msgResp?.text || msgResp?.html?.[0] || '';
                            const cleanBody = rawBody.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').toLowerCase();

                            // Ya sabemos que es reciente (post-tap), extraemos el número de 6 dígitos de ese correo
                            const match2 = cleanBody.match(/([0-9]{6})/);
                            if (match2 && match2[1]) {
                                code2 = match2[1];
                                break;
                            }
                        }
                    }
                    if (code2) break; // romper el while si ya lo encontramos
                    await sleep(4000);
                }

                if (!code2) {
                    log('❌ No llegó el correo con el 2do código a tiempo (30s). Cerrando app...')
                    await vmosPost('/vcpcloud/api/padApi/stopApp', { padCodes: [padCode], pkgName: PKG })
                    const shot = await vmosPost('/vcpcloud/api/padApi/screenshot', { padCodes: [padCode], rotation: 0 })
                    return respond({ success: false, error: '2do Código agotado', logs, screenshot: Array.isArray(shot?.data) ? shot.data[0]?.url : null }, 408)
                }

                const timeElapsed = Date.now() - startWait2;
                if (timeElapsed < 10000) {
                    log(`⏳ Código extraído rápido. Esperando ${10000 - timeElapsed}ms extra para la UI...`)
                    await sleep(10000 - timeElapsed);
                }

                log(`✅ ÚLTIMO 2do Código detectado: ${code2}`)

                log('🔢 Ingresar 2do código en 359, 1125...')
                await tap(359, 1125, 1500); await type(code2);

                log('👆 Continuar (SAU 2)...')
                await tap(727, 1228, 4000)

                log('⏳ Esperando 4 segundos de transición a creación de PIN...')
                await sleep(4000)

                log('🔐 Ingreso PIN nuevo (123456)...')
                await tap(303, 915, 1500); await type('123456')

                log('🔐 Confirmación PIN (123456)...')
                await tap(293, 1158, 1500); await type('123456')

                log('👆 Continuar (PIN ok)...')
                await tap(559, 1397, 4000)

                log('✅ Confirmación final del PIN (526, 1223)...')
                await tap(526, 1223, 4000)

                log('📄 Tocar en Buscar Documentos (405, 1312)...')
                await tap(405, 1312, 4000)

                log('📄 Tocar documento final (452, 1078)...')
                await tap(452, 1078, 4000)

                log('📸 Tomando primera captura...')
                const shot1 = await vmosPost('/vcpcloud/api/padApi/screenshot', { padCodes: [padCode], rotation: 0 })

                log('👉 Deslizando a la página de la derecha (swipe derecha a izquierda)...')
                await swipe(800, 1000, 200, 1000, 500, 4000)

                log('📸 Tomando segunda captura...')
                const shot2 = await vmosPost('/vcpcloud/api/padApi/screenshot', { padCodes: [padCode], rotation: 0 })

                log('✅ Parte 2 finalizada.')
                return respond({
                    success: true,
                    logs,
                    screenshot: Array.isArray(shot1?.data) ? shot1.data[0]?.url : null,
                    screenshot2: Array.isArray(shot2?.data) ? shot2.data[0]?.url : null
                })
            }

            log('✅ Parte 2 finalizada sin datos finales esperados.')
            const finalShot = await vmosPost('/vcpcloud/api/padApi/screenshot', { padCodes: [padCode], rotation: 0 })
            return respond({ success: true, logs, screenshot: Array.isArray(finalShot?.data) ? finalShot.data[0]?.url : null })
        }

        return respond({ success: false, error: 'Accion desconocida' }, 400)
    } catch (e: any) {
        return respond({ success: false, error: e.message }, 500)
    }
})
