import React, { useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import './GeneracionImagenes.css';

// Función para reparar base64
const repararBase64 = (str) => {
    if (!str || typeof str !== 'string') return null;
    let normalizado = str.replace(/[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/g, '');
    normalizado = normalizado.replace(/[^A-Za-z0-9+/=]/g, '');
    const sinPadding = normalizado.replace(/=/g, '');
    normalizado = sinPadding;
    const resto = normalizado.length % 4;
    if (resto !== 0) {
        normalizado = normalizado.replace(/=+$/, '');
        const nuevoResto = normalizado.length % 4;
        if (nuevoResto !== 0) {
            normalizado += '='.repeat(4 - nuevoResto);
        }
    }
    if (normalizado.length < 50) return null;
    try {
        const muestra = normalizado.substring(0, Math.min(500, normalizado.length));
        atob(muestra);
    } catch (e) {
        let intentos = 0;
        let temp = normalizado;
        while (intentos < 10 && temp.length > 50) {
            try {
                atob(temp.substring(0, Math.min(100, temp.length)));
                normalizado = temp;
                break;
            } catch (e2) {
                temp = temp.slice(0, -1);
                const resto = temp.length % 4;
                if (resto !== 0) {
                    temp = temp.replace(/=+$/, '');
                    temp += '='.repeat(4 - resto);
                }
                intentos++;
            }
        }
        try {
            atob(normalizado.substring(0, Math.min(100, normalizado.length)));
        } catch (e3) {
            return null;
        }
    }
    return normalizado;
};

// Lista de plantillas locales - SOLO HOMBRES
const TEMPLATE_NAMES = [
    'muestra_hombre_1.jpg',
    'muestra_hombre_2.jpg',
    'muestra_hombre_3.jpg',
    'muestra_hombre_4.jpg',
    'muestra_hombre_5.jpg',
    'muestra_hombre_6.jpg',
    'muestra_hombre_7.jpg',
    'muestra_hombre_8.jpg',
    'muestra_hombre_9.jpg',
    'muestra_hombre_10.jpg',
    'muestra_hombre_11.jpg',
];

function GeneracionImagenes() {
    const [imagenSource, setImagenSource] = useState(null);
    const [previewSource, setPreviewSource] = useState(null);
    const [imagenesGeneradas, setImagenesGeneradas] = useState([]);
    const [generando, setGenerando] = useState(false);
    const [progreso, setProgreso] = useState({ completadas: 0, total: 0 });
    const [error, setError] = useState(null);

    const [cedula, setCedula] = useState('');
    const [buscandoCedula, setBuscandoCedula] = useState(false);
    const [datosPersona, setDatosPersona] = useState(null);
    const [cantidad, setCantidad] = useState(5);

    const handleSourceChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImagenSource(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewSource(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const buscarPorCedula = async () => {
        if (!cedula || cedula.length !== 10) {
            setError('Ingresa un número de cédula válido (10 dígitos)');
            return;
        }

        setBuscandoCedula(true);
        setError(null);
        setDatosPersona(null);

        try {
            const response = await fetch('https://apifirmas.firmasecuador.com/api/usuarios/consultarCedulaPublica', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cedula: cedula })
            });

            if (!response.ok) {
                throw new Error('No se encontró información para esta cédula');
            }

            const data = await response.json();
            setDatosPersona(data);

            const fotoField = data.foto || data.imagen || data.fotoBase64 || data.imagenBase64 || data.foto_base64;

            if (fotoField) {
                let base64Data = null;

                if (fotoField.startsWith('data:image/')) {
                    base64Data = fotoField;
                } else if (fotoField.includes('base64,')) {
                    const parts = fotoField.split('base64,');
                    if (parts.length === 2) {
                        const reparado = repararBase64(parts[1]);
                        if (reparado) base64Data = `data:image/jpeg;base64,${reparado}`;
                    }
                } else {
                    const reparado = repararBase64(fotoField);
                    if (reparado) base64Data = `data:image/jpeg;base64,${reparado}`;
                }

                if (base64Data) {
                    const response = await fetch(base64Data);
                    const blob = await response.blob();
                    const file = new File([blob], `cedula_${cedula}.jpg`, { type: 'image/jpeg' });

                    setImagenSource(file);
                    setPreviewSource(base64Data);
                } else {
                    setError('No se pudo procesar la foto de la cédula');
                }
            } else {
                setError('No se encontró foto en los datos de la cédula');
            }

            setBuscandoCedula(false);
        } catch (err) {
            console.error('Error buscando cédula:', err);
            setError(err.message || 'Error al buscar la cédula');
            setBuscandoCedula(false);
        }
    };

    const seleccionarTemplatesAzar = (cantidad) => {
        const indices = [];
        while (indices.length < cantidad) {
            const random = Math.floor(Math.random() * TEMPLATE_NAMES.length);
            if (!indices.includes(random)) {
                indices.push(random);
            }
        }
        return indices.map(i => TEMPLATE_NAMES[i]);
    };

    // Subir template local a Supabase para que Replicate pueda accederla
    const subirTemplateTemporal = async (templateName) => {
        try {
            // Fetch template from /public/
            const response = await fetch(`/templates/${templateName}`);
            const blob = await response.blob();

            // Subir a Supabase con nombre único
            const tempName = `temp-${Date.now()}-${templateName}`;
            const { data, error } = await supabase.storage
                .from('generacion-imagenes')
                .upload(tempName, blob, {
                    contentType: 'image/jpeg',
                    cacheControl: '3600'
                });

            if (error) throw error;

            // Obtener URL pública
            const { data: urlData } = supabase.storage
                .from('generacion-imagenes')
                .getPublicUrl(tempName);

            return urlData.publicUrl;
        } catch (err) {
            console.error(`Error subiendo template ${templateName}:`, err);
            throw err;
        }
    };

    const generarUnFaceSwap = async (sourceImage, templateName, index) => {
        try {
            // Subir source image
            const sourceFileName = `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
            const { data: sourceUpload, error: sourceError } = await supabase.storage
                .from('generacion-imagenes')
                .upload(sourceFileName, sourceImage);

            if (sourceError) throw new Error('Error al subir imagen de cara');

            // Obtener URL de source
            const { data: sourceUrl } = supabase.storage
                .from('generacion-imagenes')
                .getPublicUrl(sourceFileName);

            // Subir template temporal
            const targetUrl = await subirTemplateTemporal(templateName);

            // Llamar a la Edge Function
            const { data, error: functionError } = await supabase.functions.invoke('generar-imagen-ia', {
                body: {
                    targetImageUrl: targetUrl,
                    sourceImageUrl: sourceUrl.publicUrl
                }
            });

            if (functionError) throw functionError;
            if (data.error) throw new Error(data.error);

            return {
                url: data.imageUrl,
                template: templateName,
                index: index,
                error: null
            };
        } catch (err) {
            console.error(`Error en face swap ${index}:`, err);
            return {
                url: null,
                template: templateName,
                index: index,
                error: err.message || 'Error desconocido'
            };
        }
    };

    const generarImagenes = async () => {
        if (!imagenSource) {
            setError('Por favor busca una cédula o sube una imagen de cara');
            return;
        }

        setGenerando(true);
        setError(null);
        setImagenesGeneradas([]);
        setProgreso({ completadas: 0, total: cantidad });

        try {
            const templatesSeleccionados = seleccionarTemplatesAzar(cantidad);

            // Crear array de promesas para generación paralela
            const promesas = templatesSeleccionados.map((template, index) =>
                generarUnFaceSwap(imagenSource, template, index + 1)
            );

            // Ejecutar todas en paralelo con actualización de progreso
            let completadas = 0;

            const promises = promesas.map(async (promesa) => {
                const resultado = await promesa;
                completadas++;
                setProgreso({ completadas, total: cantidad });
                setImagenesGeneradas(prev => [...prev, resultado].sort((a, b) => a.index - b.index));
                return resultado;
            });

            await Promise.all(promises);

            setGenerando(false);
        } catch (err) {
            console.error('Error en generación por lotes:', err);
            setError(err.message || 'Error al generar las imágenes');
            setGenerando(false);
        }
    };

    const descargarImagen = (url, index) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `faceswap_${cedula || 'resultado'}_${index}.png`;
        link.click();
    };

    const descargarTodas = () => {
        imagenesGeneradas.forEach((img, idx) => {
            if (img.url) {
                setTimeout(() => {
                    descargarImagen(img.url, idx + 1);
                }, idx * 500);
            }
        });
    };

    return (
        <div className="gi-container">
            <div className="gi-header">
                <h1>🎨 Face Swap por Lotes</h1>
                <p>Genera múltiples imágenes en paralelo con diferentes poses usando IA</p>
            </div>

            {error && (
                <div className="gi-error">
                    <span>⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            <div className="gi-panel" style={{ marginBottom: '16px' }}>
                <h2>🔍 Buscar por Cédula</h2>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                    Busca automáticamente la foto de la cédula
                </p>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <input
                        type="text"
                        value={cedula}
                        onChange={(e) => setCedula(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Número de cédula (10 dígitos)"
                        maxLength={10}
                        style={{
                            flex: 1,
                            padding: '10px 14px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px',
                            outline: 'none'
                        }}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') buscarPorCedula();
                        }}
                    />
                    <button
                        onClick={buscarPorCedula}
                        disabled={buscandoCedula || cedula.length !== 10}
                        style={{
                            padding: '10px 20px',
                            background: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: buscandoCedula || cedula.length !== 10 ? 'not-allowed' : 'pointer',
                            opacity: buscandoCedula || cedula.length !== 10 ? 0.6 : 1,
                            transition: 'all 0.2s'
                        }}
                    >
                        {buscandoCedula ? '🔄 Buscando...' : '🔍 Buscar'}
                    </button>
                </div>

                {datosPersona && (
                    <div style={{
                        marginTop: '12px',
                        padding: '12px',
                        background: '#f0fdf4',
                        border: '1px solid #86efac',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#166534'
                    }}>
                        ✅ Persona encontrada: <strong>{datosPersona.nombres || 'N/A'}</strong>
                    </div>
                )}
            </div>

            <div className="gi-panel" style={{ marginBottom: '16px' }}>
                <h2>👤 Imagen de Cara</h2>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                    Foto de la persona (búscala arriba o sube manualmente)
                </p>

                <div className="gi-upload-area">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleSourceChange}
                        id="source-input"
                        style={{ display: 'none' }}
                    />
                    <label htmlFor="source-input" className="gi-upload-btn">
                        <span>📁</span>
                        <span>Seleccionar Imagen de Cara</span>
                    </label>

                    {previewSource && (
                        <div className="gi-preview">
                            <img src={previewSource} alt="Cara" />
                        </div>
                    )}
                </div>
            </div>

            <div className="gi-panel" style={{ marginBottom: '16px' }}>
                <h2>📊 Cantidad de Imágenes</h2>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                    Disponibles: {TEMPLATE_NAMES.length} plantillas (solo hombres)
                </p>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                        ¿Cuántas imágenes generar?
                    </label>
                    <input
                        type="number"
                        min="1"
                        max={TEMPLATE_NAMES.length}
                        value={cantidad}
                        onChange={(e) => setCantidad(Math.min(Math.max(1, parseInt(e.target.value) || 1), TEMPLATE_NAMES.length))}
                        style={{
                            width: '80px',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px',
                            outline: 'none',
                            textAlign: 'center'
                        }}
                    />
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                        (máximo {TEMPLATE_NAMES.length})
                    </span>
                </div>
            </div>

            <button
                onClick={generarImagenes}
                disabled={!imagenSource || generando}
                className="gi-generate-btn"
                style={{ marginTop: '20px', width: '100%' }}
            >
                {generando ? (
                    <>
                        <span className="gi-spinner"></span>
                        <span>⚡ Generando en paralelo: {progreso.completadas}/{progreso.total}</span>
                    </>
                ) : (
                    <>
                        <span>✨</span>
                        <span>Generar {cantidad} {cantidad === 1 ? 'Imagen' : 'Imágenes'} (Paralelo)</span>
                    </>
                )}
            </button>

            {imagenesGeneradas.length > 0 && (
                <div className="gi-panel" style={{ marginTop: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2>🖼️ Imágenes Generadas ({imagenesGeneradas.filter(img => img.url).length}/{cantidad})</h2>
                        {imagenesGeneradas.some(img => img.url) && (
                            <button
                                onClick={descargarTodas}
                                style={{
                                    padding: '8px 16px',
                                    background: '#059669',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                ⬇️ Descargar Todas
                            </button>
                        )}
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '16px'
                    }}>
                        {imagenesGeneradas.map((img, idx) => (
                            <div key={idx} style={{
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                background: '#fff'
                            }}>
                                {img.url ? (
                                    <>
                                        <img
                                            src={img.url}
                                            alt={`Resultado ${img.index}`}
                                            style={{ width: '100%', height: '250px', objectFit: 'cover' }}
                                        />
                                        <button
                                            onClick={() => descargarImagen(img.url, img.index)}
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                background: '#3b82f6',
                                                color: '#fff',
                                                border: 'none',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            ⬇️ Descargar #{img.index}
                                        </button>
                                    </>
                                ) : img.error ? (
                                    <div style={{
                                        padding: '20px',
                                        textAlign: 'center',
                                        color: '#ef4444',
                                        fontSize: '12px'
                                    }}>
                                        ❌ Error: {img.error}
                                    </div>
                                ) : (
                                    <div style={{
                                        padding: '20px',
                                        textAlign: 'center',
                                        color: '#9ca3af',
                                        fontSize: '12px',
                                        height: '250px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <div>
                                            <div className="gi-spinner" style={{ marginBottom: '8px' }}></div>
                                            <div>⏳ Generando...</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default GeneracionImagenes;
