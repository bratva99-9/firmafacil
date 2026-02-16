import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const REPLICATE_API_TOKEN = Deno.env.get('REPLICATE_API_TOKEN')

serve(async (req) => {
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { targetImageUrl, sourceImageUrl, prompt = "persona sosteniendo una cédula de identidad ecuatoriana" } = await req.json()

        if (!targetImageUrl || !sourceImageUrl) {
            return new Response(
                JSON.stringify({ error: 'Se requieren targetImageUrl (pose) y sourceImageUrl (cara)' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Crear predicción en Replicate usando inswapper
        const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${REPLICATE_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                version: "25bdae46f2713138640b6e8c04dc4ca18625ce95b1863936b053eee42d9ba6db",
                input: {
                    source_img: sourceImageUrl,
                    target_img: targetImageUrl,
                    face_restore: false
                }
            })
        })

        if (!replicateResponse.ok) {
            const errorText = await replicateResponse.text()
            console.error('Replicate API error:', errorText)
            return new Response(
                JSON.stringify({ error: 'Error al comunicarse con Replicate', details: errorText }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const prediction = await replicateResponse.json()

        // Esperar a que se complete la predicción
        let status = prediction.status
        let predictionId = prediction.id
        let outputUrl = null

        // Polling para verificar el estado (máximo 60 segundos)
        const maxAttempts = 60
        let attempts = 0

        while (status !== 'succeeded' && status !== 'failed' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000)) // Esperar 1 segundo

            const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
                headers: {
                    'Authorization': `Token ${REPLICATE_API_TOKEN}`,
                }
            })

            const statusData = await statusResponse.json()
            status = statusData.status

            if (status === 'succeeded') {
                outputUrl = statusData.output
                break
            } else if (status === 'failed') {
                return new Response(
                    JSON.stringify({ error: 'La generación de imagen falló', details: statusData.error }),
                    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }

            attempts++
        }

        if (!outputUrl) {
            return new Response(
                JSON.stringify({ error: 'Timeout: La generación tomó demasiado tiempo' }),
                { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({
                success: true,
                imageUrl: Array.isArray(outputUrl) ? outputUrl[0] : outputUrl,
                predictionId: predictionId
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )

    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
