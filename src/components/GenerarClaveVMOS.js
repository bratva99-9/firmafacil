import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const GenerarClaveVMOS = ({ onBack, user }) => {
    const [cedula, setCedula] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [logMessages, setLogMessages] = useState([]);
    const [screenshotUrl, setScreenshotUrl] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!cedula || cedula.length !== 10) {
            setError('Por favor ingresa un número de cédula válido de 10 dígitos.');
            return;
        }

        setLoading(true);
        setError(null);
        setScreenshotUrl(null);
        setLogMessages([]);
        setStatus('Iniciando proceso...');

        try {
            // Configuraciones del pad: el mismo usado en browserstack-run-test
            const payload = {
                action: 'generarClaveVmos',
                cedula: cedula,
                padCode: 'APP5AU4BBH7BM68X'
            };

            const { data, error: supError } = await supabase.functions.invoke('vmos-generar-clave', {
                body: payload,
            });

            if (supError) throw new Error(supError.message);
            if (data && data.error) throw new Error(data.error);

            setStatus('¡Proceso completado con éxito!');
            if (data && data.screenshot) {
                setScreenshotUrl(data.screenshot);
            }
            if (data && data.logs) {
                setLogMessages(data.logs);
            }
        } catch (err) {
            console.error("Error al generar clave en vmos:", err);
            setError(err.message || 'Ocurrió un error al contactar al servidor.');
            setStatus('Proceso fallido.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="vmos-form-container">
            <div className="service-header" style={{ marginBottom: '20px' }}>
                <button className="back-button" onClick={onBack} style={{ marginBottom: '15px' }}>
                    ← Volver
                </button>
                <h1 className="service-title">Generar Clave de SR en Línea (VMOS)</h1>
                <p className="service-description">
                    Esta herramienta utiliza un teléfono en la nube para automatizar el ingreso de tu cédula y generar tu clave.
                </p>
            </div>

            <div className="form-card" style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Número de Cédula</label>
                        <input
                            type="text"
                            value={cedula}
                            onChange={(e) => setCedula(e.target.value)}
                            placeholder="Ej: 0912345678"
                            maxLength={10}
                            required
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #d1d5db',
                                fontSize: '16px'
                            }}
                        />
                    </div>

                    {error && (
                        <div className="error-message" style={{ color: '#dc2626', background: '#fee2e2', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="submit-button"
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'transform 0.2s ease',
                        }}
                    >
                        {loading ? 'Ejecutando automatización...' : 'Generar Clave'}
                    </button>
                </form>

                {(loading || status) && (
                    <div style={{ marginTop: '30px', padding: '20px', background: '#f3f4f6', borderRadius: '8px' }}>
                        <h3 style={{ marginTop: 0, fontSize: '16px', color: '#374151' }}>Estado: {status}</h3>

                        {loading && (
                            <div style={{ margin: '15px 0', fontSize: '14px', color: '#6b7280' }}>
                                Por favor espera, este proceso en el servidor toma aproximadamente 15-20 segundos...
                            </div>
                        )}

                        {logMessages && logMessages.length > 0 && (
                            <div style={{
                                maxHeight: '150px',
                                overflowY: 'auto',
                                background: '#1f2937',
                                color: '#a7f3d0',
                                padding: '10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontFamily: 'monospace',
                                marginTop: '15px'
                            }}>
                                {logMessages.map((log, index) => (
                                    <div key={index}>{log}</div>
                                ))}
                            </div>
                        )}

                        {screenshotUrl && (
                            <div style={{ marginTop: '20px' }}>
                                <h4 style={{ marginBottom: '10px' }}>Captura de resultado final:</h4>
                                <img src={screenshotUrl} alt="Pantalla VMOS" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GenerarClaveVMOS;
