
async function diagnostic() {
    const PROXY_URL = 'https://eapcqcuzfkpqngbvjtmv.functions.supabase.co/sri-denominacion-proxy';
    const names = ['BARRERA ALEZ', 'BARRIOS MARIO'];
    
    console.log('--- DIAGNÓSTICO DE PROXY SUPABASE ---');
    
    for (const name of names) {
        const url = `${PROXY_URL}?denominacion=${encodeURIComponent(name)}`;
        console.log(`\nProbando con: "${name}"`);
        console.log(`URL de llamada: ${url}`);
        
        try {
            const start = Date.now();
            const res = await fetch(url);
            const duration = Date.now() - start;
            console.log(`Status: ${res.status} (${duration}ms)`);
            
            const data = await res.json();
            if (data.success === false) {
                console.log('❌ Error del Proxy:', data.error);
                console.log('Detalle Técnico:', data.details ? data.details.substring(0, 200) : 'N/A');
                console.log('URL Enviada al SRI:', data.sentUrl || 'N/A');
            } else {
                console.log('✅ ÉXITO! Resultados obtenidos:', Array.isArray(data) ? data.length : 'No es array');
                if (Array.isArray(data) && data.length > 0) {
                    console.log('Primer resultado:', data[0].nombreComercial);
                }
            }
        } catch (e) {
            console.error('Error de red:', e.message);
        }
    }
}

diagnostic();
