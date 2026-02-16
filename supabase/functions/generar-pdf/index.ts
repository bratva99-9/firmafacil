import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { create } from "https://deno.land/x/djwt@v2.8/mod.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { cedula, nombres, detalles, fotoBase64, procesosJudiciales, denunciasFiscalia, datosANT, templateId, workspaceId } = await req.json()

        if (!templateId || !workspaceId) {
            throw new Error('Faltan parámetros: templateId y workspaceId son requeridos')
        }

        // Credenciales desde secretos
        const apiKey = Deno.env.get('PDF_GENERATOR_KEY')
        const apiSecret = Deno.env.get('PDF_GENERATOR_SECRET')

        if (!apiKey || !apiSecret) {
            throw new Error('Credenciales de PDF Generator API no configuradas en el servidor')
        }

        // Generar JWT para Autenticación
        // Algoritmo HS256, usando el Secret como llave
        // Claims: iss (API Key), sub (Workspace), exp (Tiempo expiración)
        const jwtPayload = {
            iss: apiKey,
            sub: workspaceId,
            exp: Math.floor(Date.now() / 1000) + 30 // 30 segundos de validez
        }

        const key = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(apiSecret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        )

        const token = await create({ alg: "HS256", typ: "JWT" }, jwtPayload, key)

        // Preparar datos para la plantilla
        const datosParaPlantilla = {
            cedula,
            nombres,
            ...detalles,
            foto: fotoBase64, // Asegúrate de que tu plantilla use este key o ajusta aquí
            procesos: procesosJudiciales,
            denuncias: denunciasFiscalia,
            ant: datosANT,
            fecha_consulta: new Date().toLocaleDateString('es-EC')
        }

        console.log(`Generando PDF con Template ${templateId} para Workspace ${workspaceId}...`)

        // 3. Validar Template ID (Si es string, buscar el ID numérico)
        let finalTemplateId = templateId;

        // Si el templateId no es un número, intentar buscarlo por nombre
        if (isNaN(parseInt(templateId))) {
            console.log(`🔍 Buscando ID numérico para la plantilla: "${templateId}"...`);
            try {
                const templatesResponse = await fetch('https://us1.pdfgeneratorapi.com/api/v4/templates', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                if (templatesResponse.ok) {
                    const templatesData = await templatesResponse.json();
                    const templateEncontrado = templatesData.response.find((t: any) => t.name === templateId);

                    if (templateEncontrado) {
                        console.log(`✅ Plantilla encontrada: ${templateEncontrado.name} (ID: ${templateEncontrado.id})`);
                        finalTemplateId = templateEncontrado.id;
                    } else {
                        console.warn(`⚠️ No se encontró ninguna plantilla con el nombre "${templateId}". Se intentará usar tal cual.`);
                        // Listar nombres disponibles para ayudar a depurar
                        console.log('Plantillas disponibles:', templatesData.response.map((t: any) => `${t.name} (${t.id})`).join(', '));
                    }
                } else {
                    console.error('❌ Error al listar plantillas:', await templatesResponse.text());
                }
            } catch (err) {
                console.error('❌ Error en la búsqueda de plantilla:', err);
            }
        } else {
            finalTemplateId = parseInt(templateId);
        }

        console.log(`ℹ️ Usando Template ID final: ${finalTemplateId}`);

        // 4. Llamar a la API de PDF Generator
        const response = await fetch('https://us1.pdfgeneratorapi.com/api/v4/documents/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json; charset=utf-8',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                template: finalTemplateId,
                format: 'pdf',
                output: 'base64',
                data: datosParaPlantilla
            })
        })

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error respuesta PDF API:', response.status, errorText);
            try {
                // Intentar parsear si es JSON
                const errorJson = JSON.parse(errorText);
                throw new Error(`Error PDF API: ${errorJson.error || errorJson.message || errorText}`);
            } catch (e) {
                throw new Error(`Error PDF API (${response.status}): ${errorText.substring(0, 200)}`);
            }
        }

        const resultado = await response.json()
        // La API devuelve { response: "base64String...", meta: {...} }

        return new Response(
            JSON.stringify({
                success: true,
                pdfBase64: resultado.response,
                meta: resultado.meta
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Error:', error.message)
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400, // Bad Request
            }
        )
    }
})
