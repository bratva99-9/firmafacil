import React, { useState, useMemo } from 'react';
import { supabase, EDGE_URL } from '../lib/supabase';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
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

// Lista de plantillas locales
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
    const [descargandoPDF, setDescargandoPDF] = useState(false);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);

    // Coordenadas PDF (Consistentes con ConsultaCedula.js)
    const pdfCoords = {
        apellidos: { x: 132, y: 102 },
        nombres: { x: 132, y: 114 },
        fecha: { x: 213, y: 176 },
        cedula: { x: 272, y: 63 },
        sexo: { x: 151, y: 204 },
        nacionalidad: { x: 187, y: 190 },
        lugarNacimiento: { x: 132, y: 140 },
        estadoCivil: { x: 179, y: 219 },
        conyuge: { x: 130, y: 227 },
        padre: { x: 27, y: 55 },
        madre: { x: 27, y: 79 },
        codigoDactilar: { x: 290, y: 30 },
        profesion: { x: 140, y: 30 },
        nivelInstruccion: { x: 27, y: 30 },
        fechaCedulacion: { x: 28, y: 114 },
        fechaExpiracion: { x: 28, y: 137 },
        foto: { x: 20, y: 190, w: 100, h: 134 }
    };

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
            setError('Ingresa un número de cédula válido');
            return;
        }

        setBuscandoCedula(true);
        setError(null);
        setDatosPersona(null);
        setPreviewSource(null);
        setImagenSource(null);
        setPdfPreviewUrl(null); // Limpiar preview anterior

        try {
            let datosFinales = {};
            let base64Foto = null; // Guardar la foto obtenida
            let dactilarEncontrado = null; // Guardar dactilar si aparece en firmasecuador

            // --- LLAMADA A FIRMAS ECUADOR (Foto y Huella) ---
            try {
                const respFoto = await fetch('https://apifirmas.firmasecuador.com/api/usuarios/consultarCedulaPublica', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cedula: cedula })
                });

                if (respFoto.ok) {
                    const dataFoto = await respFoto.json();

                    const fotoField = dataFoto.foto || dataFoto.imagen || dataFoto.fotoBase64 || dataFoto.imagenBase64 || dataFoto.foto_base64;
                    if (fotoField) {
                        let base64Data = null;
                        if (fotoField.startsWith('data:image/')) {
                            base64Data = fotoField;
                        } else if (fotoField.includes('base64,')) {
                            const parts = fotoField.split('base64,');
                            if (parts.length === 2 && parts[1]) {
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
                            base64Foto = base64Data; // Guardar para uso directo
                        }
                    }

                    // Capturar posible dactilar de firmasecuador
                    dactilarEncontrado = dataFoto.codigoDactilar || dataFoto.dactilar || dataFoto.serie || dataFoto.individualDactilar || dataFoto.huella || null;
                    datosFinales = { ...dataFoto };
                }
            } catch (e) {
                console.warn("Fallo API Firmas, intentando continuar...", e);
            }

            // --- LLAMADA A ZAMPLISOFT (Datos Completos) ---
            try {
                const zamplisoftUrl = `https://apiconsult.zampisoft.com/api/consultar?identificacion=${cedula}&token=cvZ1-zcMv-OKKh-AR29`;
                const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(zamplisoftUrl);

                const respDatos = await fetch(proxyUrl);

                if (respDatos.ok) {
                    const dataZamplisoft = await respDatos.json();

                    if (dataZamplisoft.nombre) {
                        let nombres = "";
                        let apellidos = "";

                        if (dataZamplisoft.nombre) {
                            const partes = dataZamplisoft.nombre.trim().split(' ');
                            if (partes.length >= 4) {
                                apellidos = partes.slice(0, 2).join(' ');
                                nombres = partes.slice(2).join(' ');
                            } else if (partes.length === 3) {
                                apellidos = partes.slice(0, 2).join(' ');
                                nombres = partes.slice(2).join(' ');
                            } else {
                                apellidos = dataZamplisoft.nombre;
                            }
                        }

                        let edadCalc = dataZamplisoft.edad;
                        if (!edadCalc && dataZamplisoft.fechaNacimiento) {
                            try {
                                const [d, m, y] = dataZamplisoft.fechaNacimiento.split('/');
                                const fec = new Date(y, m - 1, d);
                                const hoy = new Date();
                                edadCalc = hoy.getFullYear() - fec.getFullYear();
                            } catch (e) { }
                        }

                        // Mapeo exhaustivo de campos, incluyendo huella dactilar
                        // Priorizar el dactilar que ya encontramos si existe, sino buscar en Zamplisoft
                        const dactilarZamplisoft = dataZamplisoft.codigoDactilar ||
                            dataZamplisoft.dactilar ||
                            dataZamplisoft.serie ||
                            dataZamplisoft.individualDactilar ||
                            dataZamplisoft.huella || "";

                        // Usar el que no esté vacío
                        const dactilarFinal = dactilarEncontrado || dactilarZamplisoft || "";

                        datosFinales = {
                            ...datosFinales,
                            ...dataZamplisoft,
                            nombres: nombres,
                            apellidos: apellidos,
                            nombreCompleto: dataZamplisoft.nombre,
                            fechaNacimiento: dataZamplisoft.fechaNacimiento,
                            lugarNacimiento: dataZamplisoft.lugarNacimiento,
                            nacionalidad: dataZamplisoft.nacionalidad || 'ECUATORIANA',
                            estadoCivil: dataZamplisoft.estadoCivil,
                            conyuge: dataZamplisoft.conyuge,
                            genero: dataZamplisoft.genero,
                            profesion: dataZamplisoft.profesion,
                            instruccion: dataZamplisoft.instruccion,
                            nombrePadre: dataZamplisoft.nombrePadre,
                            nombreMadre: dataZamplisoft.nombreMadre,
                            fechaCedulacion: dataZamplisoft.fechaCedulacion,
                            codigoDactilar: dactilarFinal, // Usar el final combinado
                            edad: edadCalc
                        };
                    }
                }
            } catch (e) {
                console.error("Error consultando Zamplisoft logic:", e);
            }

            if (!datosFinales.identificacion && !datosFinales.cedula && !datosFinales.nombre) {
                throw new Error('No se encontró información en ninguna base de datos.');
            }

            datosFinales.identificacion = datosFinales.identificacion || cedula;

            setDatosPersona(datosFinales);
            setBuscandoCedula(false);

            // Generar PREVIEW automático pasando la imagen explícitamente
            if (base64Foto) {
                setTimeout(() => {
                    generarPdfCedula(true, datosFinales, base64Foto);
                }, 100);
            } else {
                setTimeout(() => {
                    generarPdfCedula(true, datosFinales, null);
                }, 100);
            }

        } catch (err) {
            console.error('Error general buscando cédula:', err);
            setError('No se encontró información para esta cédula');
            setBuscandoCedula(false);
        }
    };

    const generarPdfCedula = async (previewMode = false, datosDirectos = null, imagenDirecta = null) => {
        const info = datosDirectos || datosPersona;
        // Usar imagen pasada directamente O la del estado si no se pasa
        const fotoUsar = imagenDirecta || previewSource;

        if (!info) return;

        setDescargandoPDF(true);

        try {
            const existingPdfBytes = await fetch('/plantilla_cedula.pdf').then(res => {
                if (!res.ok) throw new Error('No se encontró la plantilla de cédula');
                return res.arrayBuffer();
            });

            // 1. Generar el PDF normal (2 páginas verticales en memoria)
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];
            const { width, height } = firstPage.getSize();
            const fontSize = 9;

            const draw = (text, valX, valYFromTop, font = undefined, page = firstPage) => {
                if (!text) return;
                page.drawText(String(text).toUpperCase(), {
                    x: valX,
                    y: height - valYFromTop,
                    size: fontSize,
                    color: rgb(0.18, 0.18, 0.18),
                    font: font,
                });
            };

            let apellidos = info.apellidos || "";
            let nombres = info.nombres || "";

            if (!apellidos && !nombres && (info.nombre || info.nombreCompleto)) {
                const full = info.nombre || info.nombreCompleto;
                const parts = full.trim().split(" ");
                if (parts.length >= 4) {
                    apellidos = parts.slice(0, 2).join(" ");
                    nombres = parts.slice(2).join(" ");
                } else if (parts.length === 3) {
                    apellidos = parts.slice(0, 2).join(" ");
                    nombres = parts.slice(2).join(" ");
                } else {
                    apellidos = full;
                }
            }

            // Página 1 (Anverso)
            draw(apellidos, pdfCoords.apellidos.x, pdfCoords.apellidos.y);
            draw(nombres, pdfCoords.nombres.x, pdfCoords.nombres.y);
            draw(info.fechaNacimiento, pdfCoords.fecha.x, pdfCoords.fecha.y);
            draw(info.identificacion || cedula, pdfCoords.cedula.x, pdfCoords.cedula.y);

            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const textoSexoInput = info.genero || info.sexo || "";
            let sexoDisplay = textoSexoInput;
            const upperSexo = textoSexoInput.toUpperCase();
            if (upperSexo.startsWith("H") || upperSexo === "MASCULINO") {
                sexoDisplay = "HOMBRE";
            } else if (upperSexo.startsWith("M") || upperSexo === "FEMENINO") {
                sexoDisplay = "MUJER";
            }
            draw(sexoDisplay, pdfCoords.sexo.x, pdfCoords.sexo.y, boldFont);

            draw(info.nacionalidad || "ECUATORIANA", pdfCoords.nacionalidad.x, pdfCoords.nacionalidad.y);

            const lugarNacimientoTexto = info.lugarNacimiento || "";
            if (lugarNacimientoTexto) {
                const partes = lugarNacimientoTexto.split('/').map(p => p.trim());
                partes.forEach((parte, index) => {
                    draw(parte, pdfCoords.lugarNacimiento.x, pdfCoords.lugarNacimiento.y + (index * 12));
                });
            }

            draw(info.estadoCivil || "", pdfCoords.estadoCivil.x, pdfCoords.estadoCivil.y);

            if ((info.estadoCivil || "").toUpperCase().includes("CASAD")) {
                const nombreConyuge = info.conyuge || "";
                if (nombreConyuge) {
                    const partsC = nombreConyuge.trim().split(" ");
                    let apC = nombreConyuge;
                    let nomC = "";
                    if (partsC.length >= 3) {
                        apC = partsC.slice(0, 2).join(" ");
                        nomC = partsC.slice(2).join(" ");
                    }
                    draw(apC, pdfCoords.conyuge.x, pdfCoords.conyuge.y);
                    if (nomC) draw(nomC, pdfCoords.conyuge.x, pdfCoords.conyuge.y + 8);
                }
            }

            // Foto
            if (fotoUsar) {
                try {
                    const base64Data = fotoUsar.split(',')[1];
                    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                    let image;
                    if (fotoUsar.includes('image/png')) {
                        image = await pdfDoc.embedPng(imageBytes);
                    } else {
                        image = await pdfDoc.embedJpg(imageBytes);
                    }
                    firstPage.drawImage(image, {
                        x: pdfCoords.foto.x,
                        y: height - pdfCoords.foto.y,
                        width: pdfCoords.foto.w,
                        height: pdfCoords.foto.h,
                    });
                } catch (e) {
                    console.warn("Error incrustando foto:", e);
                }
            }

            // Página 2 (Reverso)
            if (pages.length > 1) {
                const secondPage = pages[1];
                const { height: height2 } = secondPage.getSize();
                const draw2 = (text, valX, valYFromTop) => {
                    if (!text) return;
                    secondPage.drawText(String(text).toUpperCase(), {
                        x: valX,
                        y: height2 - valYFromTop,
                        size: fontSize,
                        color: rgb(0.18, 0.18, 0.18),
                    });
                };

                draw2(info.nombrePadre || info.padre || "", pdfCoords.padre.x, pdfCoords.padre.y);
                draw2(info.nombreMadre || info.madre || "", pdfCoords.madre.x, pdfCoords.madre.y);
                draw2(info.profesion || "", pdfCoords.profesion.x, pdfCoords.profesion.y);
                draw2(info.instruccion || info.nivelInstruccion || "", pdfCoords.nivelInstruccion.x, pdfCoords.nivelInstruccion.y);

                // Código Dactilar
                draw2(info.codigoDactilar || info.dactilar || info.individualDactilar || info.serie || "", pdfCoords.codigoDactilar.x, pdfCoords.codigoDactilar.y);

                let fCed = info.fechaCedulacion || "";
                let fExp = "";

                if (fCed && fCed.includes('/')) {
                    try {
                        const [d, m, y] = fCed.split('/');
                        fCed = `${y}-${m}-${d}`;
                        const yNum = parseInt(y);
                        if (!isNaN(yNum)) {
                            fExp = `${yNum + 10}-${m}-${d}`;
                        }
                    } catch (e) { }
                }

                draw2(fCed, pdfCoords.fechaCedulacion.x, pdfCoords.fechaCedulacion.y);
                draw2(fExp, pdfCoords.fechaExpiracion.x, pdfCoords.fechaExpiracion.y);
            }

            // 2. Crear documento final de UNA sola página horizontal (Lado a Lado)
            const filledBytes = await pdfDoc.save();
            const finalDoc = await PDFDocument.create();

            // Incrustar ambas páginas del documento generado anteriormente
            const [embeddedPage1, embeddedPage2] = await finalDoc.embedPdf(filledBytes, [0, 1]);

            // Calcular dimensiones: ancho = 2 * ancho_plantilla + margen, alto = alto_plantilla + margen
            const gap = 20; // Espacio entre anverso y reverso
            const margin = 20;
            const finalWidth = (width * 2) + gap + (margin * 2);
            const finalHeight = height + (margin * 2);

            const page = finalDoc.addPage([finalWidth, finalHeight]);

            // Dibujar Anverso (Izquierda)
            page.drawPage(embeddedPage1, {
                x: margin,
                y: margin,
            });

            // Dibujar Reverso (Derecha)
            // Verificar si existía segunda página antes de dibujarla
            if (pages.length > 1 && embeddedPage2) {
                page.drawPage(embeddedPage2, {
                    x: margin + width + gap,
                    y: margin,
                });
            }

            const finalPdfBytes = await finalDoc.save();
            const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            if (previewMode) {
                setPdfPreviewUrl(url); // Establecer URL para preview
            } else {
                const link = document.createElement('a');
                link.href = url;
                link.download = `Cedula_${info.identificacion || cedula}.pdf`;
                link.click();
            }

        } catch (error) {
            console.error('Error generando PDF:', error);
            setError('Error al generar PDF: ' + error.message);
        } finally {
            setDescargandoPDF(false);
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

    const subirTemplateTemporal = async (templateName) => {
        try {
            const response = await fetch(`/templates/${templateName}`);
            const blob = await response.blob();

            const tempName = `temp-${Date.now()}-${templateName}`;
            const { data, error } = await supabase.storage
                .from('generacion-imagenes')
                .upload(tempName, blob, {
                    contentType: 'image/jpeg',
                    cacheControl: '3600'
                });

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from('generacion-imagenes')
                .getPublicUrl(tempName);

            return urlData.publicUrl;
        } catch (err) {
            console.error(`Error subiendo template:`, err);
            throw err;
        }
    };

    const generarUnFaceSwap = async (sourceImage, templateName, index) => {
        try {
            const sourceFileName = `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
            const { data: sourceUpload, error: sourceError } = await supabase.storage
                .from('generacion-imagenes')
                .upload(sourceFileName, sourceImage);

            if (sourceError) throw new Error('Error al subir imagen');

            const { data: sourceUrl } = supabase.storage
                .from('generacion-imagenes')
                .getPublicUrl(sourceFileName);

            const targetUrl = await subirTemplateTemporal(templateName);

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
            console.error(`Error en imagen ${index}:`, err);
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
            setError('Falta imagen de cara');
            return;
        }

        setGenerando(true);
        setError(null);
        setImagenesGeneradas([]);
        setProgreso({ completadas: 0, total: cantidad });

        try {
            const templatesSeleccionados = seleccionarTemplatesAzar(cantidad);
            const resultados = [];

            for (let i = 0; i < templatesSeleccionados.length; i++) {
                setProgreso({ completadas: i, total: cantidad });

                try {
                    const resultado = await generarUnFaceSwap(imagenSource, templatesSeleccionados[i], i + 1);
                    resultados.push(resultado);
                    setImagenesGeneradas(prev => [...prev, resultado].sort((a, b) => a.index - b.index));

                    if (i < templatesSeleccionados.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 12000));
                    }
                } catch (err) {
                    resultados.push({
                        url: null,
                        template: templatesSeleccionados[i],
                        index: i + 1,
                        error: err.message
                    });
                    setImagenesGeneradas(prev => [...prev, {
                        url: null,
                        template: templatesSeleccionados[i],
                        index: i + 1,
                        error: err.message
                    }].sort((a, b) => a.index - b.index));

                    if (i < templatesSeleccionados.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 12000));
                    }
                }
            }

            setProgreso({ completadas: cantidad, total: cantidad });
            setGenerando(false);

        } catch (err) {
            console.error('Error:', err);
            setError('Error en generación');
            setGenerando(false);
        }
    };

    const descargarImagen = (url, index) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `imagen_${index}.png`;
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
            {error && (
                <div className="gi-error" style={{ marginBottom: '16px' }}>
                    ⚠️ {error}
                </div>
            )}

            <div className="gi-panel" style={{ marginBottom: '16px' }}>
                {/* Buscador Simplificado */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <input
                        type="text"
                        value={cedula}
                        onChange={(e) => setCedula(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Cédula"
                        maxLength={10}
                        style={{
                            flex: 1,
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
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
                            padding: '8px 16px',
                            background: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            cursor: buscandoCedula ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {buscandoCedula ? '...' : '🔍'}
                    </button>

                    {datosPersona && (
                        <button
                            onClick={() => generarPdfCedula(false)}
                            disabled={descargandoPDF}
                            style={{
                                padding: '8px 16px',
                                background: descargandoPDF ? '#fca5a5' : '#ef4444',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '14px',
                                cursor: descargandoPDF ? 'wait' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                            title="Descargar PDF de Cédula"
                        >
                            <span>{descargandoPDF ? '⏳' : '📥'}</span> Descargar PDF
                        </button>
                    )}
                </div>

                {/* Área Principal: Foto + Datos + Preview PDF */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

                    {/* Columna Izquierda: Oculta (Input invisible para casos remotos o compatibilidad futura) */}
                    <div style={{ display: 'none' }}>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleSourceChange}
                            id="source-input"
                        />
                    </div>

                    {/* Columna Derecha: Vista Previa PDF Automática (Ahora ocupa todo el ancho) */}
                    {pdfPreviewUrl && (
                        <div style={{
                            flex: 1,
                            minWidth: '600px', // Aumentado para acomodar el formato horizontal
                            height: '400px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: '#f8fafc',
                            position: 'relative'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                padding: '8px',
                                background: 'transparent', // Transparente para no estorbar
                                borderBottom: 'none', // Sin borde
                                fontSize: '12px',
                                fontWeight: 'bold',
                                color: '#475569',
                                display: 'flex',
                                justifyContent: 'flex-end', // Botón cerrar a la derecha
                                alignItems: 'center'
                            }}>
                                <button
                                    onClick={() => setPdfPreviewUrl(null)}
                                    style={{
                                        border: 'none',
                                        background: '#fff', // Fondo blanco para que se vea
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        borderRadius: '50%',
                                        width: '24px',
                                        height: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    ✖️
                                </button>
                            </div>
                            <iframe
                                src={`${pdfPreviewUrl}#toolbar=0&navpanes=0`}
                                title="Vista Previa PDF"
                                style={{ width: '100%', height: '100%', border: 'none' }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Controles de Generación Simplificados */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#fff', padding: '16px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#475569' }}>
                    Cantidad:
                </label>
                <input
                    type="number"
                    min="1"
                    max={TEMPLATE_NAMES.length}
                    value={cantidad}
                    onChange={(e) => setCantidad(Math.min(Math.max(1, parseInt(e.target.value) || 1), TEMPLATE_NAMES.length))}
                    style={{
                        width: '60px',
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        textAlign: 'center',
                        fontSize: '14px'
                    }}
                />
                <button
                    onClick={generarImagenes}
                    disabled={!imagenSource || generando}
                    style={{
                        flex: 1,
                        padding: '10px',
                        background: generando ? '#94a3b8' : '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: generando ? 'wait' : 'pointer',
                        transition: 'background 0.2s'
                    }}
                >
                    {generando ? (
                        <span>⏳ Procesando {progreso.completadas + 1}/{progreso.total} (espera 12s/img)...</span>
                    ) : (
                        <span>✨ Generar Imágenes</span>
                    )}
                </button>
            </div>

            {/* Resultados */}
            {imagenesGeneradas.length > 0 && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '16px', margin: 0, color: '#1e293b' }}>Resultados</h3>
                        {imagenesGeneradas.some(img => img.url) && (
                            <button
                                onClick={descargarTodas}
                                style={{
                                    padding: '6px 12px',
                                    background: '#059669',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                }}
                            >
                                ⬇️ Descargar Todo
                            </button>
                        )}
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: '12px'
                    }}>
                        {imagenesGeneradas.map((img, idx) => (
                            <div key={idx} style={{
                                borderRadius: '8px',
                                overflow: 'hidden',
                                background: '#fff',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}>
                                {img.url ? (
                                    <>
                                        <img
                                            src={img.url}
                                            alt={`Img ${img.index}`}
                                            style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }}
                                        />
                                        <button
                                            onClick={() => descargarImagen(img.url, img.index)}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                background: '#f8fafc',
                                                color: '#475569',
                                                border: 'none',
                                                borderTop: '1px solid #e2e8f0',
                                                fontSize: '12px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            ⬇️ Guardar
                                        </button>
                                    </>
                                ) : img.error ? (
                                    <div style={{
                                        padding: '20px',
                                        textAlign: 'center',
                                        color: '#ef4444',
                                        fontSize: '12px',
                                        aspectRatio: '3/4',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: '#fef2f2'
                                    }}>
                                        Error
                                    </div>
                                ) : (
                                    <div style={{
                                        aspectRatio: '3/4',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: '#f8fafc',
                                        color: '#94a3b8'
                                    }}>
                                        <div className="gi-spinner" style={{ marginBottom: '8px', width: '20px', height: '20px' }}></div>
                                        <span style={{ fontSize: '11px' }}>En cola...</span>
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
