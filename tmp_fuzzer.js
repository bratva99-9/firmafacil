async function test(path, query) {
  const url = `https://srienlinea.sri.gob.ec/movil-servicios/api/v1.0/${path}/${encodeURIComponent(query)}/?tipoPersona=N&resultados=10`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) return;
    const d = await r.json();
    if (Array.isArray(d) && d.length > 0) {
      console.log(`[EXITO] ${path} | ${query} -> ${d.length} resultados. Ejemplo: ${d[0].razonSocial}`);
    }
  } catch (e) {}
}

async function start() {
  const qs = ['BARRERA', '%BARRERA', 'BARRERA%', '_BARRERA', '*BARRERA*', 'BARRERA ALEX', 'ALEXIS BARRERA'];
  const eps = ['deudas/porDenominacion', 'ruc/porDenominacion', 'contribuyente/porDenominacion'];
  console.log('--- INICIANDO FUZZING DIRECTO SRI ---');
  for (const e of eps) {
    for (const q of qs) {
      await test(e, q);
    }
  }
  console.log('--- FIN DE PRUEBAS ---');
}
start();
