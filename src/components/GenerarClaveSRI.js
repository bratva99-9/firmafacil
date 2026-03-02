import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

function GenerarClaveSRI() {
    const [cedula, setCedula] = useState('');
    const [correo, setCorreo] = useState('');
    const [celular, setCelular] = useState('');
    const [cargando, setCargando] = useState(false);
    const [paso, setPaso] = useState('');
    const [resultado, setResultado] = useState(null);
    const [error, setError] = useState('');

    const handleGenerar = async () => {
        if (!cedula || !correo || !celular) {
            setError("Todos los campos son obligatorios.");
            return;
        }

        try {
            setCargando(true);
            setError('');
            setResultado(null);
            setPaso('Conectando al motor de navegación en la nube (Browserless)...');

            // 1. Llamar a Edge Function
            const { data, error: invokeError } = await supabase.functions.invoke('sri-generar-clave', {
                body: { cedula, correo, celular }
            });

            if (invokeError) throw new Error(invokeError.message);
            if (!data || (!data.success && !data.screenshotBase64)) throw new Error(data?.error || "Error desconocido en el servidor");

            if (!data.success) {
                setResultado(data);
                throw new Error(data.error || "El robot falló en la mitad del proceso.");
            }

            setPaso('¡Enlace interceptado con éxito! Desempaquetando...');
            const firmaLink = data.firmaec_link; // ej: firmaec://sriGeneracionClave/firmar?token=...&razon=...

            // Extraemos parámetros
            let token = '', razon = '', decoded = null;
            if (firmaLink) {
                const urlParams = new URLSearchParams(firmaLink.split('?')[1]);
                token = urlParams.get('token');
                razon = urlParams.get('razon');

                setPaso(`Decodificando el JWT...`);
                try {
                    const base64Url = token.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
                    decoded = JSON.parse(jsonPayload);
                } catch (e) {
                    console.warn("No se pudo decodificar JWT nativamente", e);
                }
            }

            setResultado({
                ...data,
                link: firmaLink,
                token: token,
                razon: razon,
                decodedToken: decoded
            });

            setPaso('Listo. Fases automatizadas terminadas con éxito.');

        } catch (err) {
            console.error(err);
            setError(err.message || 'Error al generar la solicitud');
            setPaso('');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div style={{ maxWidth: 600, margin: '20px auto', fontFamily: 'sans-serif' }}>
            <h2 style={{ color: '#4338ca', marginBottom: 20 }}>🔑 Generador 100% Automático de Claves SRI</h2>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 20 }}>
                Esta herramienta usa Browserless para evadir JSF y extraer el JWT oculto del SRI para firmar el documento directamente en memoria.
            </p>

            <div style={{ background: '#f8fafc', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 15 }}>
                {/* Inputs ... conservados exactos para no borrar código */}
                <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 5 }}>Cédula</label>
                    <input type="text" value={cedula} onChange={e => setCedula(e.target.value)} placeholder="0914018742" style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 5 }}>Correo Electrónico</label>
                    <input type="email" value={correo} onChange={e => setCorreo(e.target.value)} placeholder="correo@ejemplo.com" style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 5 }}>Celular / Teléfono</label>
                    <input type="tel" value={celular} onChange={e => setCelular(e.target.value)} placeholder="0999999999" style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, boxSizing: 'border-box' }} />
                </div>

                {error && (
                    <div style={{ background: '#fef2f2', color: '#b91c1c', padding: 10, borderRadius: 6, fontSize: 13, border: '1px solid #fca5a5' }}>
                        <strong>Error:</strong> {error}
                    </div>
                )}

                <button
                    onClick={handleGenerar}
                    disabled={cargando}
                    style={{
                        background: '#4f46e5', color: 'white', border: 'none', padding: '12px', borderRadius: 6,
                        fontWeight: 'bold', cursor: cargando ? 'not-allowed' : 'pointer', opacity: cargando ? 0.7 : 1
                    }}
                >
                    {cargando ? '⌛ Procesando la Magia SRI (Tomará 30 segs)...' : '🚀 Iniciar Extracción Mágica del SRI'}
                </button>

                {paso && (
                    <div style={{ fontSize: 12, color: '#047857', fontWeight: 'bold', background: '#ecfdf5', padding: 10, borderRadius: 6, border: '1px solid #6ee7b7' }}>
                        {paso}
                    </div>
                )}
            </div>

            {resultado && resultado.screenshotBase64 && (
                <div style={{ marginTop: 20, background: '#1e293b', color: '#f8fafc', padding: 20, borderRadius: 8, fontSize: 12 }}>
                    <h3 style={{ color: resultado.success ? '#10b981' : '#ef4444', marginTop: 0 }}>📸 Debug: Pantalla capturada por el Bot (Fase {resultado.fase})</h3>
                    <p>{resultado.success ? '¡Así se vio la pantalla de éxito antes de capturar el link!' : '¡Oops! El bot se quedó atascado aquí:'}</p>
                    <img
                        src={`data:image/png;base64,${resultado.screenshotBase64}`}
                        alt="Screenshot SRI"
                        style={{ width: '100%', borderRadius: 8, border: '2px solid #334155' }}
                    />
                    {resultado.html && (
                        <details style={{ marginTop: 10 }}>
                            <summary style={{ cursor: 'pointer', color: '#94a3b8' }}>Ver extracto de código fuente HTML (Hacer clic)</summary>
                            <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', color: '#cbd5e1', background: '#0f172a', padding: 10, marginTop: 10, maxHeight: 200, overflowY: 'auto' }}>
                                {resultado.html}
                            </pre>
                        </details>
                    )}
                </div>
            )}

            {resultado && resultado.success && resultado.link && (
                <div style={{ marginTop: 20, background: '#1e293b', color: '#f8fafc', padding: 20, borderRadius: 8, fontSize: 12, overflowX: 'auto' }}>
                    <h3 style={{ color: '#818cf8', marginTop: 0 }}>🕵️ Datos Extraídos del SRI</h3>
                    <p><strong>Enlace Oculto:</strong><br />{resultado.link}</p>
                    <p><strong>Token JWT:</strong><br />{resultado.token?.substring(0, 100)}...</p>
                    <p><strong>Razón (PDF SRI):</strong> {resultado.razon}</p>
                    <hr style={{ borderColor: '#334155' }} />
                    <h4 style={{ color: '#34d399' }}>📦 Carga útil del JWT (Decodificada):</h4>
                    <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', color: '#fbbf24' }}>
                        {JSON.stringify(resultado.decodedToken, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}

export default GenerarClaveSRI;
