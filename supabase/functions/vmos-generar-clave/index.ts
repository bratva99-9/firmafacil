import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const AK = 'o4ObHCzichKEo0ccWAJcPspbcseBZdvU'
const SK = 'oDlzOPSEBnQj4hl59CSISaVL'
const HOST = 'api.vmoscloud.com'
const SERVICE = 'armcloud-paas'

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

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
    const respond = (data: object, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    try {
        const body = await req.json()
        const { action, padCode = 'APP5AU4BBH7BM68X' } = body
        console.log(`🚀 VMOS Action: ${action}`)

        if (action === 'generarClaveVmos') {
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

            if (!cedula) return respond({ success: false, error: 'Cédula es requerida', logs }, 400)

            log('🚀 Iniciando proceso Generar Clave VMOS...')
            log('👆 Abriendo herramienta en X=610, Y=821...')
            // Wait 10 seconds per requirements
            await tap(610, 821, 10000)

            log(`⌨️ Ingresando cédula (${cedula}) en X=501, Y=1003...`)
            await tap(501, 1003, 1000) // tap wait 1 sec, type wait 1 sec
            await type(cedula)

            log('⏳ Esperando 4 segundos adicionales...')
            await sleep(4000)

            log('👆 Tocando Registrarse en X=602, Y=1120...')
            // Wait 4 seconds per requirements 
            await tap(602, 1120, 4000)

            log('📸 Tomando captura del resultado...')
            const shot = await vmosPost('/vcpcloud/api/padApi/screenshot', { padCodes: [padCode], rotation: 0 })

            log('✅ Automatización de clave finalizada.')
            return respond({
                success: true,
                logs,
                screenshot: Array.isArray(shot?.data) ? shot.data[0]?.url : null
            })
        }

        return respond({ success: false, error: 'Accion desconocida' }, 400)
    } catch (e: any) {
        return respond({ success: false, error: e.message }, 500)
    }
})
