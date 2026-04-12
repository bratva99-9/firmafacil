
async function test(name, acceptHeader) {
  const url = `https://srienlinea.sri.gob.ec/movil-servicios/api/v1.0/deudas/porDenominacion/${encodeURIComponent(name)}/?tipoPersona=N&resultados=30`;
  const headers = {
    'Accept': acceptHeader || 'application/json, text/plain, */*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Origin': 'https://srienlinea.sri.gob.ec',
    'Referer': 'https://srienlinea.sri.gob.ec/'
  };
  try {
    const res = await fetch(url, { headers });
    console.log(`[Test] Accept: ${headers.Accept} -> Status: ${res.status}`);
    if (res.status !== 200) {
        const text = await res.text();
        console.log('Error Body:', text.substring(0, 200));
    } else {
        console.log('Success! Received data.');
    }
  } catch (e) {
    console.error('Fetch error:', e.message);
  }
}

async function runTests() {
    console.log('--- Testing SRI API ---');
    await test('BARRERA ALEX', 'application/json, text/plain, */*');
    await test('BARRERA ALEX', 'application/json');
    await test('BARRERA ALEX', '*/*');
    await test('BARRERA ALEX', 'text/plain');
}

runTests();
