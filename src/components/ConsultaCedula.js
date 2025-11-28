import React, { useState, useRef, useEffect } from 'react';
import { consultarCedula as consultarCedulaZamplisoft, obtenerCedulaDesdeCache, guardarCedulaEnCache, supabase } from '../lib/supabase';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Componente para mostrar foto con manejo de errores sin loops
function FotoComponent({ imageSrc, base64Reparado }) {
  const [srcActual, setSrcActual] = useState(imageSrc);
  const [haFallado, setHaFallado] = useState(false);
  const intentadoRef = useRef(false);
  
  const manejarError = (e) => {
    // Prevenir loops infinitos - solo intentar una vez
    if (intentadoRef.current || haFallado) {
      e.target.style.display = 'none';
      e.target.onerror = null; // Remover el handler para evitar más intentos
      return;
    }
    
    intentadoRef.current = true;
    setHaFallado(true);
    
    // Intentar con PNG solo una vez si tenemos el base64 reparado
    if (base64Reparado && !imageSrc.includes('png')) {
      const nuevoSrc = `data:image/png;base64,${base64Reparado}`;
      // Usar un nuevo elemento img para evitar loops
      setTimeout(() => {
        setSrcActual(nuevoSrc);
        intentadoRef.current = false; // Resetear para el nuevo intento
        setHaFallado(false);
      }, 300);
    } else {
      e.target.style.display = 'none';
      e.target.onerror = null;
    }
  };
  
  return (
    <div className="cc-photo-section">
      <div className="cc-photo-container">
        <img 
          key={srcActual} // Key para forzar re-render cuando cambia el src
          src={srcActual}
          alt="Foto de cédula" 
          className="cc-photo"
          onError={manejarError}
          onLoad={() => {
            // Si carga exitosamente, resetear flags
            intentadoRef.current = false;
            setHaFallado(false);
          }}
        />
        <div className="cc-photo-label">Foto de Cédula</div>
      </div>
    </div>
  );
}

export default function ConsultaCedula() {
  const [cedula, setCedula] = useState('');
  const [token, setToken] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [datos, setDatos] = useState(null);
  const [infoToken, setInfoToken] = useState(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenStatus, setTokenStatus] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [tokenExpiryMs, setTokenExpiryMs] = useState(null);
  const [edadInfo, setEdadInfo] = useState(null);
  const [edadError, setEdadError] = useState('');
  const [fuenteDatos, setFuenteDatos] = useState('');
  const [datosZamplisoft, setDatosZamplisoft] = useState(null);
  const [denunciasFiscalia, setDenunciasFiscalia] = useState(null);
  const [denunciasError, setDenunciasError] = useState('');
  const [denunciasCargando, setDenunciasCargando] = useState(false);
  const [procesosJudiciales, setProcesosJudiciales] = useState(null);
  const [procesosError, setProcesosError] = useState('');
  const [procesosCargando, setProcesosCargando] = useState(false);
  const [procesosDenunciante, setProcesosDenunciante] = useState(null);
  const [procesosDenuncianteError, setProcesosDenuncianteError] = useState('');
  const [procesosDenuncianteCargando, setProcesosDenuncianteCargando] = useState(false);
  const [actuacionesExpandidas, setActuacionesExpandidas] = useState(new Set());
  const [seccionesExpandidas, setSeccionesExpandidas] = useState(new Set(['01', '02', '03', '04', '05', '06', '07', '08']));
  const [descargandoPDF, setDescargandoPDF] = useState(false);
  const expedienteRef = useRef(null);

  // Función para alternar el estado de una sección
  const toggleSeccion = (numeroSeccion) => {
    setSeccionesExpandidas(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(numeroSeccion)) {
        nuevo.delete(numeroSeccion);
      } else {
        nuevo.add(numeroSeccion);
      }
      return nuevo;
    });
  };

  // Función para descargar el expediente como PDF
  const descargarPDF = async () => {
    if (!expedienteRef.current || (!datos && !datosZamplisoft)) {
      alert('No hay información para descargar');
      return;
    }

    setDescargandoPDF(true);

    try {
      // Expandir todas las secciones temporalmente para capturar todo el contenido
      const seccionesOriginales = new Set(seccionesExpandidas);
      setSeccionesExpandidas(new Set(['01', '02', '03', '04', '05', '06', '07', '08']));

      // Esperar un momento para que las secciones se expandan
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capturar el contenido del expediente
      const canvas = await html2canvas(expedienteRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: expedienteRef.current.scrollWidth,
        height: expedienteRef.current.scrollHeight,
      });

      // Restaurar el estado original de las secciones
      setSeccionesExpandidas(seccionesOriginales);

      // Calcular dimensiones del PDF
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      // Crear PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      // Agregar la primera página
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Agregar páginas adicionales si es necesario
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generar nombre del archivo
      const cedulaNum = datos?.cedula || datosZamplisoft?.cedula || 'N/A';
      const nombreArchivo = `Expediente_${cedulaNum}_${new Date().toISOString().split('T')[0]}.pdf`;

      // Descargar el PDF
      pdf.save(nombreArchivo);

    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor, intenta nuevamente.');
    } finally {
      setDescargandoPDF(false);
    }
  };

  const TOKEN_USER = '0993391174001';
  const TOKEN_PASSWORD = '0993391174001';
  const TOKEN_BUFFER_MS = 60 * 1000;

  // Función robusta para reparar base64 (similar a base64.guru/tools/repair)
  const repararBase64 = (str) => {
    if (!str || typeof str !== 'string') return null;
    
    // Paso 1: Normalizar - eliminar todos los espacios en blanco
    let normalizado = str.replace(/[\s\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/g, '');
    
    // Paso 2: Eliminar caracteres no válidos en base64
    // Base64 válido: A-Z, a-z, 0-9, +, /, = (solo al final)
    normalizado = normalizado.replace(/[^A-Za-z0-9+/=]/g, '');
    
    // Paso 3: Eliminar padding incorrecto en medio del string
    // El padding (=) solo debe estar al final
    // Primero, eliminar todos los = que no estén al final
    const sinPadding = normalizado.replace(/=/g, '');
    const soloPadding = normalizado.length - sinPadding.length;
    normalizado = sinPadding;
    
    // Paso 4: Corregir padding al final
    // Base64 debe tener longitud múltiplo de 4
    const resto = normalizado.length % 4;
    if (resto !== 0) {
      // Eliminar padding existente y recalcular
      normalizado = normalizado.replace(/=+$/, '');
      const nuevoResto = normalizado.length % 4;
      if (nuevoResto !== 0) {
        normalizado += '='.repeat(4 - nuevoResto);
      }
    }
    
    // Paso 5: Validar longitud mínima
    if (normalizado.length < 50) {
      return null;
    }
    
    // Paso 6: Validar que sea decodificable
    try {
      // Intentar decodificar una muestra más grande para validar
      const muestra = normalizado.substring(0, Math.min(500, normalizado.length));
      atob(muestra);
    } catch (e) {
      // Si falla, intentar estrategias adicionales
      
      // Estrategia A: Eliminar caracteres al final que puedan estar corruptos
      let intentos = 0;
      let temp = normalizado;
      while (intentos < 10 && temp.length > 50) {
        try {
          atob(temp.substring(0, Math.min(100, temp.length)));
          normalizado = temp;
          break;
        } catch (e2) {
          temp = temp.slice(0, -1);
          // Recalcular padding
          const resto = temp.length % 4;
          if (resto !== 0) {
            temp = temp.replace(/=+$/, '');
            temp += '='.repeat(4 - resto);
          }
          intentos++;
        }
      }
      
      // Validar una vez más
      try {
        atob(normalizado.substring(0, Math.min(100, normalizado.length)));
      } catch (e3) {
        return null;
      }
    }
    
    return normalizado;
  };

  // Función para decodificar JWT y verificar expiración
  const verificarToken = (tok) => {
    try {
      const parts = tok.split('.');
      if (parts.length !== 3) {
        return { valido: false, mensaje: 'Formato de token inválido' };
      }
      
      const payload = JSON.parse(atob(parts[1]));
      const ahora = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < ahora) {
        const fechaExpiracion = new Date(payload.exp * 1000);
        return { 
          valido: false, 
          expirado: true,
          mensaje: `Token expirado el ${fechaExpiracion.toLocaleString()}` 
        };
      }
      
      return { valido: true, payload };
    } catch (e) {
      return { valido: false, mensaje: 'Error al decodificar el token' };
    }
  };

  const formatearTiempoRestante = (expMs) => {
    if (!expMs) return 'Desconocido';
    const restante = expMs - Date.now();
    if (restante <= 0) return 'Expirado';
    const horas = Math.floor(restante / 3600000);
    const minutos = Math.floor((restante % 3600000) / 60000);
    return `${horas}h ${minutos}m`;
  };

  const prepararInfoToken = (tok) => {
    if (!tok) {
      setInfoToken(null);
      setTokenExpiryMs(null);
      return { valido: false, mensaje: 'Ingresa el token (x-token)' };
    }

    const validacionToken = verificarToken(tok);
    if (!validacionToken.valido) {
      setInfoToken(null);
      setTokenExpiryMs(null);
      return validacionToken;
    }

    if (validacionToken.payload) {
      const exp = validacionToken.payload.exp;
      const expMs = exp ? exp * 1000 : null;
      const expiraEn = formatearTiempoRestante(expMs);
      setTokenExpiryMs(expMs);
      setInfoToken(expiraEn === 'Expirado' ? null : { expiraEn });
    } else {
      setInfoToken(null);
      setTokenExpiryMs(null);
    }

    return { valido: true };
  };

  const obtenerEdadExtendida = () => {
    if (!datos && !edadInfo) return null;
    return datos?.edad ?? edadInfo?.edad ?? edadInfo?.Edad ?? edadInfo?.data?.edad ?? null;
  };

  const construirFoto = () => {
    if (!datos) return null;
    const fotoField =
      datos.fotoBase64 ||
      datos.foto_base64 ||
      datos.imagenBase64 ||
      datos.imagen ||
      datos.foto ||
      datos.fotoCedula ||
      datos.foto_cedula;

    if (!fotoField || typeof fotoField !== 'string') {
      return null;
    }

    let base64Reparado = null;
    let imageSrc = null;

    if (fotoField.startsWith('data:image/')) {
      const base64Part = fotoField.split('base64,')[1];
      if (base64Part) {
        base64Reparado = repararBase64(base64Part);
        if (base64Reparado) {
          const mimeMatch = fotoField.match(/data:image\/([^;]+)/);
          const mimeType = mimeMatch ? mimeMatch[1] : 'jpeg';
          imageSrc = `data:image/${mimeType};base64,${base64Reparado}`;
        }
      }
    } else if (fotoField.includes('base64,')) {
      const base64Part = fotoField.split('base64,')[1];
      if (base64Part) {
        base64Reparado = repararBase64(base64Part);
        if (base64Reparado) {
          imageSrc = `data:image/jpeg;base64,${base64Reparado}`;
        }
      }
    } else {
      base64Reparado = repararBase64(fotoField);
      if (base64Reparado) {
        imageSrc = `data:image/jpeg;base64,${base64Reparado}`;
      }
    }

    if (!imageSrc || !base64Reparado) {
      return null;
    }

    return { imageSrc, base64Reparado };
  };

  const renderFotoCedula = () => {
    const foto = construirFoto();
    if (!foto) {
      return (
        <div className="cc-photo-placeholder">
          <span>Sin imagen disponible</span>
        </div>
      );
    }
    return <FotoComponent imageSrc={foto.imageSrc} base64Reparado={foto.base64Reparado} />;
  };

  const solicitarToken = async () => {
    setTokenLoading(true);
    setTokenStatus('Generando token…');
    setTokenError('');
    try {
      const response = await fetch('https://apifirmas.firmasecuador.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user: TOKEN_USER,
          password: TOKEN_PASSWORD
        })
      });

      if (!response.ok) {
        const texto = await response.text();
        throw new Error(texto || `Error ${response.status} al solicitar el token`);
      }

      const data = await response.json();
      const nuevoToken = data.token || data.accessToken || data?.data?.token;

      if (!nuevoToken) {
        throw new Error('La respuesta no incluyó el token (x-token).');
      }

      setToken(nuevoToken);
      const validacion = prepararInfoToken(nuevoToken);
      if (!validacion.valido) {
        throw new Error(validacion.mensaje || 'Token recibido, pero no se pudo validar.');
      }
      setTokenStatus('Token listo.');
      setDatos(null);
      setError('');
      return nuevoToken;
    } catch (err) {
      setTokenStatus('');
      setTokenError(err.message || 'No se pudo obtener el token.');
      throw err;
    } finally {
      setTokenLoading(false);
    }
  };

  const asegurarTokenValido = async () => {
    const ahora = Date.now();
    if (token && tokenExpiryMs && ahora < tokenExpiryMs - TOKEN_BUFFER_MS) {
      prepararInfoToken(token);
      return token;
    }
    return await solicitarToken();
  };

  useEffect(() => {
    asegurarTokenValido().catch(() => {
      // errores ya manejados en solicitarToken
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Función para parsear el HTML de denuncias y extraer datos estructurados
  const parsearDenunciasHTML = (html) => {
    if (!html || html.length === 0) {
      return { denuncias: [], mensaje: 'No se encontraron denuncias registradas', error: null };
    }

    // Detectar bloqueo de Incapsula
    if (html.includes('Incapsula') || html.includes('incident ID') || html.includes('_Incapsula_Resource')) {
      return { 
        denuncias: [], 
        mensaje: 'El sistema de fiscalía está protegido y bloquea el acceso automático. Se requiere acceso directo desde el navegador.',
        error: 'BLOQUEO_INCAPSULA'
      };
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Buscar todas las secciones de denuncias (cada una tiene dos tablas: datos principales y sujetos)
      const divsGenerales = doc.querySelectorAll('div.general');
      const denuncias = [];
      
      divsGenerales.forEach((divGeneral) => {
        const tablas = divGeneral.querySelectorAll('table');
        
        if (tablas.length >= 2) {
          // Primera tabla: Datos principales de la denuncia
          const tablaPrincipal = tablas[0];
          const tablaSujetos = tablas[1];
          
          const denuncia = {
            numeroNoticia: '',
            lugar: '',
            fecha: '',
            hora: '',
            digitador: '',
            estado: '',
            numeroOficio: '',
            delito: '',
            unidad: '',
            fiscalia: '',
            sujetos: []
          };
          
          // Extraer número de noticia del encabezado
          const thEncabezado = tablaPrincipal.querySelector('thead th');
          if (thEncabezado) {
            const textoEncabezado = thEncabezado.textContent.trim();
            const match = textoEncabezado.match(/Nro\.\s*(\d+)/i);
            if (match) {
              denuncia.numeroNoticia = match[1];
            }
          }
          
          // Extraer datos de las filas de la tabla principal
          // NOTA: La primera fila tiene la imagen en celda 0 (rowspan="6"), las siguientes filas no tienen esa celda
          const filas = tablaPrincipal.querySelectorAll('tbody tr');
          let esPrimeraFila = true;
          
          filas.forEach((fila) => {
            const celdas = fila.querySelectorAll('td');
            
            // Primera fila: tiene 5 celdas (imagen + 4 datos)
            // Estructura: [imagen, "LUGAR", valor_lugar, "FECHA", valor_fecha]
            if (esPrimeraFila && celdas.length >= 5) {
              const etiqueta1 = celdas[1]?.textContent?.trim() || '';
              const valor1 = celdas[2]?.textContent?.trim() || '';
              const etiqueta2 = celdas[3]?.textContent?.trim() || '';
              const valor2 = celdas[4]?.textContent?.trim() || '';
              
              if (etiqueta1.includes('LUGAR')) denuncia.lugar = valor1;
              if (etiqueta2.includes('FECHA')) denuncia.fecha = valor2;
              
              esPrimeraFila = false;
            }
            // Segunda fila: tiene 4 celdas (sin imagen por rowspan)
            // Estructura: ["HORA", valor_hora, "DIGITADOR", valor_digitador]
            else if (!esPrimeraFila && celdas.length >= 4) {
              const etiqueta1 = celdas[0]?.textContent?.trim() || '';
              const valor1 = celdas[1]?.textContent?.trim() || '';
              const etiqueta2 = celdas[2]?.textContent?.trim() || '';
              const valor2 = celdas[3]?.textContent?.trim() || '';
              
              if (etiqueta1.includes('HORA')) denuncia.hora = valor1;
              if (etiqueta2.includes('DIGITADOR')) denuncia.digitador = valor2;
              
              if (etiqueta1.includes('ESTADO') || etiqueta1.includes('ESTADO:')) {
                denuncia.estado = valor1;
              }
              if (etiqueta2.includes('Nro. OFICIO') || etiqueta2.includes('Nro. OFICIO:')) {
                denuncia.numeroOficio = valor2;
              }
            }
            // Filas con colspan (DELITO, UNIDAD)
            else if (celdas.length >= 2) {
              const etiqueta = celdas[0]?.textContent?.trim() || '';
              const valor = celdas[1]?.textContent?.trim() || '';
              
              if (etiqueta.includes('ESTADO') || etiqueta.includes('ESTADO:')) {
                denuncia.estado = valor || denuncia.estado;
              }
              if (etiqueta.includes('Nro. OFICIO') || etiqueta.includes('Nro. OFICIO:')) {
                denuncia.numeroOficio = valor || denuncia.numeroOficio;
              }
              if (etiqueta.includes('DELITO') || etiqueta.includes('DELITO:')) {
                // El delito puede estar en valor o en celdas[1] si hay colspan
                const delitoValor = valor || celdas[1]?.textContent?.trim() || '';
                if (delitoValor) denuncia.delito = delitoValor;
              }
              if (etiqueta.includes('UNIDAD') || etiqueta.includes('UNIDAD:')) {
                // La unidad puede estar en valor o en celdas[1] si hay colspan
                const unidadValor = valor || celdas[1]?.textContent?.trim() || '';
                if (unidadValor) denuncia.unidad = unidadValor;
                
                // Buscar fiscalía en el texto completo de la fila
                const textoCompleto = fila.textContent || '';
                if (textoCompleto.includes('FISCALIA') || textoCompleto.includes('FISCALIA:')) {
                  const matchFiscalia = textoCompleto.match(/FISCALIA[:\s]+([^<]+)/i);
                  if (matchFiscalia) {
                    denuncia.fiscalia = matchFiscalia[1].replace(/Este es mi caso.*/i, '').replace(/input.*/i, '').trim();
                  }
                }
              }
            }
          });
          
          // Extraer sujetos de la segunda tabla
          if (tablaSujetos) {
            const filasSujetos = tablaSujetos.querySelectorAll('tbody tr');
            filasSujetos.forEach((fila) => {
              const celdas = fila.querySelectorAll('td');
              if (celdas.length >= 3) {
                const cedula = celdas[0]?.textContent?.trim() || '';
                const nombres = celdas[1]?.textContent?.trim() || '';
                const estado = celdas[2]?.textContent?.trim() || '';
                
                if (nombres && estado) {
                  denuncia.sujetos.push({
                    cedula: cedula || 'N/A',
                    nombres: nombres,
                    estado: estado
                  });
                }
              }
            });
          }
          
          // Solo agregar si tiene al menos número de noticia o delito
          if (denuncia.numeroNoticia || denuncia.delito) {
            denuncias.push(denuncia);
          }
        }
      });
      
      if (denuncias.length > 0) {
        return { 
          denuncias, 
          mensaje: `Se encontraron ${denuncias.length} denuncia(s) registrada(s)`, 
          error: null 
        };
      }
      
      return { denuncias: [], mensaje: 'No se encontraron denuncias registradas para esta cédula', error: null };
    } catch (error) {
      console.error('Error al parsear HTML de denuncias:', error);
      return { denuncias: [], mensaje: 'Error al procesar la información de denuncias', error: 'PARSEO_ERROR' };
    }
  };

  // Función para consultar procesos judiciales
  const consultarProcesosJudiciales = async (cedulaNum) => {
    setProcesosCargando(true);
    setProcesosError('');
    setProcesosJudiciales(null);
    
    try {
      console.log('🔍 Consultando procesos judiciales para cédula:', cedulaNum);
      
      // Intentar primero desde el cliente (navegador)
      const url = 'https://api.funcionjudicial.gob.ec/EXPEL-CONSULTA-CAUSAS-SERVICE/api/consulta-causas/informacion/buscarCausas?page=1&size=10';
      
      // Payload para buscar como demandado
      const payloadDemandado = {
        page: 1,
        size: 10,
        numeroCausa: '',
        actor: {
          cedulaActor: '',
          nombreActor: ''
        },
        demandado: {
          cedulaDemandado: cedulaNum,
          nombreDemandado: ''
        },
        first: 1,
        numeroFiscalia: '',
        pageSize: 10,
        provincia: '',
        recaptcha: 'verdad'
      };
      
      // Payload para buscar como actor
      const payloadActor = {
        ...payloadDemandado,
        actor: {
          cedulaActor: cedulaNum,
          nombreActor: ''
        },
        demandado: {
          cedulaDemandado: '',
          nombreDemandado: ''
        }
      };
      
      let procesosCompletos = [];
      
      let hayErrorCORS = false;
      
      // Consultar como demandado
      try {
        console.log('📋 Consultando como DEMANDADO...');
        console.log('📤 Payload demandado:', JSON.stringify(payloadDemandado, null, 2));
        
        const responseDemandado = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
            'Origin': 'https://procesosjudiciales.funcionjudicial.gob.ec',
            'Referer': 'https://procesosjudiciales.funcionjudicial.gob.ec/'
          },
          body: JSON.stringify(payloadDemandado),
          mode: 'cors'
        });
        
        console.log('📊 Respuesta demandado:', responseDemandado.status, responseDemandado.statusText);
        console.log('📊 Headers respuesta:', Object.fromEntries(responseDemandado.headers.entries()));
        
        if (responseDemandado.ok) {
          const dataDemandado = await responseDemandado.json();
          console.log('📦 Datos demandado recibidos (tipo):', typeof dataDemandado, Array.isArray(dataDemandado));
          console.log('📦 Datos demandado completos:', JSON.stringify(dataDemandado, null, 2));
          
          // La API devuelve un array directamente según PowerShell
          let procesosArray = [];
          if (Array.isArray(dataDemandado)) {
            procesosArray = dataDemandado;
          } else if (dataDemandado && Array.isArray(dataDemandado.content)) {
            procesosArray = dataDemandado.content;
          } else if (dataDemandado && Array.isArray(dataDemandado.data)) {
            procesosArray = dataDemandado.data;
          } else if (dataDemandado && Array.isArray(dataDemandado.procesos)) {
            procesosArray = dataDemandado.procesos;
          } else {
            console.warn('⚠️ Formato de respuesta inesperado:', dataDemandado);
          }
          
          if (procesosArray.length > 0) {
            console.log(`✅ Encontrados ${procesosArray.length} procesos como DEMANDADO`);
            procesosCompletos.push(...procesosArray.map(p => ({ ...p, rol: 'DEMANDADO' })));
          } else {
            console.log('ℹ️ No se encontraron procesos como DEMANDADO (array vacío o sin datos)');
          }
        } else {
          const errorText = await responseDemandado.text();
          console.error('⚠️ Error en respuesta demandado:', responseDemandado.status, errorText);
        }
      } catch (err) {
        console.error('❌ Error consultando como demandado:', err);
        if (err.message && (err.message.includes('CORS') || err.message.includes('Failed to fetch') || err.name === 'TypeError')) {
          hayErrorCORS = true;
          console.log('🔄 Error de CORS detectado en consulta demandado');
        }
      }
      
      // Consultar como actor
      try {
        console.log('📋 Consultando como ACTOR...');
        console.log('📤 Payload actor:', JSON.stringify(payloadActor, null, 2));
        
        const responseActor = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
            'Origin': 'https://procesosjudiciales.funcionjudicial.gob.ec',
            'Referer': 'https://procesosjudiciales.funcionjudicial.gob.ec/'
          },
          body: JSON.stringify(payloadActor),
          mode: 'cors'
        });
        
        console.log('📊 Respuesta actor:', responseActor.status, responseActor.statusText);
        console.log('📊 Headers respuesta:', Object.fromEntries(responseActor.headers.entries()));
        
        if (responseActor.ok) {
          const dataActor = await responseActor.json();
          console.log('📦 Datos actor recibidos (tipo):', typeof dataActor, Array.isArray(dataActor));
          console.log('📦 Datos actor completos:', JSON.stringify(dataActor, null, 2));
          
          // La API devuelve un array directamente según PowerShell
          let procesosArray = [];
          if (Array.isArray(dataActor)) {
            procesosArray = dataActor;
          } else if (dataActor && Array.isArray(dataActor.content)) {
            procesosArray = dataActor.content;
          } else if (dataActor && Array.isArray(dataActor.data)) {
            procesosArray = dataActor.data;
          } else if (dataActor && Array.isArray(dataActor.procesos)) {
            procesosArray = dataActor.procesos;
          } else {
            console.warn('⚠️ Formato de respuesta inesperado:', dataActor);
          }
          
          if (procesosArray.length > 0) {
            console.log(`✅ Encontrados ${procesosArray.length} procesos como ACTOR`);
            procesosCompletos.push(...procesosArray.map(p => ({ ...p, rol: 'ACTOR' })));
          } else {
            console.log('ℹ️ No se encontraron procesos como ACTOR (array vacío o sin datos)');
          }
        } else {
          const errorText = await responseActor.text();
          console.error('⚠️ Error en respuesta actor:', responseActor.status, errorText);
        }
      } catch (err) {
        console.error('❌ Error consultando como actor:', err);
        if (err.message && (err.message.includes('CORS') || err.message.includes('Failed to fetch') || err.name === 'TypeError')) {
          hayErrorCORS = true;
          console.log('🔄 Error de CORS detectado en consulta actor');
        }
      }
      
      // Si hubo error de CORS, usar Edge Function
      if (hayErrorCORS) {
        console.log('🔄 Error de CORS detectado, usando Edge Function...');
        await consultarProcesosJudicialesConProxy(cedulaNum);
        return;
      }
      
      console.log('📊 Total procesos encontrados:', procesosCompletos.length);
      
      // Eliminar duplicados por idJuicio
      const procesosUnicos = procesosCompletos.filter((proceso, index, self) =>
        index === self.findIndex(p => p.idJuicio === proceso.idJuicio)
      );
      
      console.log('📊 Procesos únicos después de eliminar duplicados:', procesosUnicos.length);
      console.log('📋 Procesos únicos:', procesosUnicos);
      
      // Siempre establecer el estado, incluso si no hay procesos
      setProcesosJudiciales({
        procesos: procesosUnicos,
        mensaje: procesosUnicos.length > 0 
          ? `Se encontraron ${procesosUnicos.length} proceso(s) judicial(es)` 
          : 'No se encontraron procesos judiciales registrados para esta cédula'
      });
      
      console.log('✅ Estado de procesos judiciales actualizado:', {
        procesos: procesosUnicos.length,
        mensaje: procesosUnicos.length > 0 
          ? `Se encontraron ${procesosUnicos.length} proceso(s) judicial(es)` 
          : 'No se encontraron procesos judiciales registrados para esta cédula'
      });
      
    } catch (err) {
      console.error('❌ Error al consultar procesos judiciales:', err);
      
      // Si es error de CORS, intentar con Edge Function
      if (err.message && (err.message.includes('CORS') || err.message.includes('Failed to fetch') || err.name === 'TypeError')) {
        console.log('🔄 Error de CORS detectado, intentando con Edge Function...');
        await consultarProcesosJudicialesConProxy(cedulaNum);
        return;
      }
      
      setProcesosError(err.message || 'No se pudieron obtener los procesos judiciales. Verifica tu conexión e intenta nuevamente.');
    } finally {
      setProcesosCargando(false);
    }
  };

  // Función para consultar procesos judiciales usando Edge Function de Supabase
  const consultarProcesosJudicialesConProxy = async (cedulaNum) => {
    try {
      console.log('🔄 Consultando procesos judiciales vía Edge Function...');
      
      let procesosCompletos = [];
      
      // Consultar como demandado
      try {
        const { data: dataDemandado, error: errorDemandado } = await supabase.functions.invoke('procesos-judiciales', {
          body: { cedula: cedulaNum, tipo: 'demandado' }
        });
        
        if (errorDemandado) {
          console.error('❌ Error consultando como demandado (proxy):', errorDemandado);
        } else if (dataDemandado && dataDemandado.success && Array.isArray(dataDemandado.data) && dataDemandado.data.length > 0) {
          console.log(`✅ Encontrados ${dataDemandado.data.length} procesos como DEMANDADO (vía proxy)`);
          procesosCompletos.push(...dataDemandado.data.map(p => ({ ...p, rol: 'DEMANDADO' })));
        }
      } catch (err) {
        console.error('❌ Error consultando como demandado (proxy):', err);
      }
      
      // Consultar como actor
      try {
        const { data: dataActor, error: errorActor } = await supabase.functions.invoke('procesos-judiciales', {
          body: { cedula: cedulaNum, tipo: 'actor' }
        });
        
        if (errorActor) {
          console.error('❌ Error consultando como actor (proxy):', errorActor);
        } else if (dataActor && dataActor.success && Array.isArray(dataActor.data) && dataActor.data.length > 0) {
          console.log(`✅ Encontrados ${dataActor.data.length} procesos como ACTOR (vía proxy)`);
          procesosCompletos.push(...dataActor.data.map(p => ({ ...p, rol: 'ACTOR' })));
        }
      } catch (err) {
        console.error('❌ Error consultando como actor (proxy):', err);
      }
      
      // Eliminar duplicados
      const procesosUnicos = procesosCompletos.filter((proceso, index, self) =>
        index === self.findIndex(p => p.idJuicio === proceso.idJuicio)
      );
      
      setProcesosJudiciales({
        procesos: procesosUnicos,
        mensaje: procesosUnicos.length > 0 
          ? `Se encontraron ${procesosUnicos.length} proceso(s) judicial(es)` 
          : 'No se encontraron procesos judiciales registrados para esta cédula'
      });
      
      setProcesosError(''); // Limpiar errores si funcionó
      
    } catch (err) {
      console.error('❌ Error al consultar procesos judiciales (proxy):', err);
      setProcesosError('No se pudieron obtener los procesos judiciales. Verifica tu conexión e intenta nuevamente.');
    } finally {
      setProcesosCargando(false);
    }
  };

  // Función para consultar procesos judiciales como denunciante/afectado (por nombre completo)
  const consultarProcesosDenunciante = async (nombreCompleto) => {
    if (!nombreCompleto || nombreCompleto.trim().length === 0) {
      console.log('⚠️ No hay nombre completo para consultar procesos como denunciante');
      return;
    }

    setProcesosDenuncianteCargando(true);
    setProcesosDenuncianteError('');
    setProcesosDenunciante(null);

    try {
      console.log('🔍 Consultando procesos judiciales como DENUNCIANTE/AFECTADO para:', nombreCompleto);

      const { data, error } = await supabase.functions.invoke('procesos-judiciales', {
        body: { nombreCompleto: nombreCompleto.trim(), tipo: 'denunciante' }
      });

      if (error) {
        console.error('❌ Error consultando como denunciante:', error);
        setProcesosDenuncianteError(error.message || 'No se pudieron obtener los procesos como denunciante/afectado.');
      } else if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
        console.log(`✅ Encontrados ${data.data.length} procesos como DENUNCIANTE/AFECTADO`);
        setProcesosDenunciante({
          procesos: data.data.map(p => ({ ...p, rol: 'DENUNCIANTE/AFECTADO' })),
          mensaje: `Se encontraron ${data.data.length} proceso(s) donde la persona es denunciante o afectado`
        });
      } else {
        setProcesosDenunciante({
          procesos: [],
          mensaje: 'No se encontraron procesos donde la persona sea denunciante o afectado'
        });
      }
    } catch (err) {
      console.error('❌ Error al consultar procesos como denunciante:', err);
      setProcesosDenuncianteError('No se pudieron obtener los procesos como denunciante/afectado. Verifica tu conexión e intenta nuevamente.');
    } finally {
      setProcesosDenuncianteCargando(false);
    }
  };

  // Función para consultar denuncias de fiscalía usando Edge Function de Supabase
  const consultarDenunciasFiscalia = async (cedulaNum) => {
    setDenunciasCargando(true);
    setDenunciasError('');
    setDenunciasFiscalia(null);
    
    try {
      console.log('🔍 Consultando denuncias de fiscalía para cédula:', cedulaNum);
      
      // Intentar primero desde el cliente (navegador) para evitar bloqueos de Incapsula
      const businfo = `a:1:{i:0;s:10:"${cedulaNum}";}`;
      const urlFiscalia = `https://www.gestiondefiscalias.gob.ec/siaf/comunes/noticiasdelito/info_mod.php?businfo=${encodeURIComponent(businfo)}`;
      
      let html = null;
      let usarEdgeFunction = false;
      
      try {
        // Intentar petición directa desde el cliente
        console.log('🌐 Intentando petición directa desde el navegador...');
        const responseDirecta = await fetch(urlFiscalia, {
          method: 'GET',
          mode: 'cors',
          credentials: 'include',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.9',
            'Referer': 'https://www.gestiondefiscalias.gob.ec/siaf/informacion/web/noticiasdelito/index.php',
          }
        });
        
        if (responseDirecta.ok) {
          html = await responseDirecta.text();
          console.log('✅ Petición directa exitosa');
        } else {
          throw new Error(`Status: ${responseDirecta.status}`);
        }
      } catch (errorDirecto) {
        console.log('⚠️ Petición directa falló, usando Edge Function:', errorDirecto.message);
        usarEdgeFunction = true;
      }
      
      // Si la petición directa falló, usar Edge Function
      if (usarEdgeFunction || !html) {
        const { data, error } = await supabase.functions.invoke('fiscalia-denuncias', {
          body: { cedula: cedulaNum }
        });

        if (error) {
          throw new Error(error.message || 'Error al invocar la función de fiscalía');
        }

        if (!data || !data.success) {
          if (data?.error === 'BLOQUEO_INCAPSULA') {
            // Mostrar mensaje más útil al usuario
            setDenunciasError('El sistema de fiscalía está protegido por Incapsula y bloquea el acceso automático. Por favor, consulta las denuncias directamente en: https://www.gestiondefiscalias.gob.ec/siaf/informacion/web/noticiasdelito/index.php');
            setDenunciasFiscalia(null);
          } else {
            throw new Error(data?.error || 'Error al consultar denuncias');
          }
          return;
        }

        html = data.html;
        console.log('📄 Respuesta HTML de fiscalía (Edge Function):', html.substring(0, 1000));
      }
      
      // Parsear el HTML para extraer información de denuncias
      const denunciasParseadas = parsearDenunciasHTML(html);
      
      // Si hay un error de bloqueo, mostrar mensaje específico
      if (denunciasParseadas.error === 'BLOQUEO_INCAPSULA') {
        setDenunciasError('El sistema de fiscalía está protegido y bloquea el acceso automático. Por favor, consulta las denuncias directamente en: https://www.gestiondefiscalias.gob.ec/siaf/informacion/web/noticiasdelito/index.php');
        setDenunciasFiscalia(null);
      } else {
        setDenunciasFiscalia(denunciasParseadas);
      }
      
    } catch (err) {
      console.error('❌ Error al consultar denuncias:', err);
      // Si es un error de CORS, dar instrucciones más claras
      if (err.message.includes('CORS') || err.message.includes('Failed to fetch')) {
        setDenunciasError('No se puede acceder directamente a la API de fiscalía debido a restricciones de seguridad. El sistema está protegido y requiere acceso manual desde el navegador.');
      } else {
        setDenunciasError(err.message || 'No se pudieron obtener las denuncias. Verifica tu conexión e intenta nuevamente.');
      }
    } finally {
      setDenunciasCargando(false);
    }
  };

  const consultar = async (e) => {
    e.preventDefault();
    setError('');
    setDatos(null);
    setEdadInfo(null);
    setEdadError('');
    setFuenteDatos('');
    setDatosZamplisoft(null);
    setDenunciasFiscalia(null);
    setDenunciasError('');
    setDenunciasCargando(false);
    setProcesosJudiciales(null);
    setProcesosError('');
    setProcesosCargando(false);
    setProcesosDenunciante(null);
    setProcesosDenuncianteError('');
    setProcesosDenuncianteCargando(false);
    
    const ced = cedula.trim();
    
    if (!/^\d{10}$/.test(ced)) {
      setError('Ingresa una cédula válida (10 dígitos)');
      return;
    }
    
    let tokActual = token;
    try {
      tokActual = await asegurarTokenValido();
    } catch (err) {
      setError(err.message || 'No se pudo generar el token');
      return;
    }
    
    const validacionToken = prepararInfoToken(tokActual);
    if (!validacionToken.valido) {
      setError(`⚠️ ${validacionToken.mensaje}`);
      return;
    }
    
    setCargando(true);
    try {
      // PASO 1: Consultar Zamplisoft (con caché)
      let datosZamplisoftTemp = null;
      let desdeCacheZamplisoft = false;
      
      try {
        console.log('🔍 Consultando cédula en Zamplisoft (con caché)...');
        const resultadoZamplisoft = await consultarCedulaZamplisoft(ced);
        
        if (resultadoZamplisoft && resultadoZamplisoft.success) {
          datosZamplisoftTemp = resultadoZamplisoft.data;
          desdeCacheZamplisoft = resultadoZamplisoft.desdeCache || false;
          // Guardar en estado con cédula incluida
          setDatosZamplisoft({
            ...datosZamplisoftTemp,
            cedula: ced
          });
          console.log(`✅ Datos de Zamplisoft obtenidos ${desdeCacheZamplisoft ? 'desde caché' : 'desde API'}`);
          
          // Actualizar mensaje de fuente de datos
          if (desdeCacheZamplisoft) {
            setFuenteDatos('Datos obtenidos desde caché seguro (sin consumo adicional).');
          } else {
            setFuenteDatos('Datos consultados en vivo y almacenados automáticamente.');
          }
        }
      } catch (zamError) {
        console.warn('⚠️ Error al consultar Zamplisoft (continuando con API de firmasecuador):', zamError);
        setFuenteDatos('');
        // No bloqueamos el flujo si falla Zamplisoft
      }

      // PASO 2: Consultar API de firmasecuador (tiene más datos como foto)
      const url = "https://apifirmas.firmasecuador.com/api/usuarios/consultarCedula";
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-token': tokActual
        },
        body: JSON.stringify({
          cedula: ced
        })
      });

      if (!response.ok) {
        let errorMessage = `Error ${response.status}`;
        
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else {
            errorMessage = JSON.stringify(errorData);
          }
        } catch {
          const errorText = await response.text();
          if (errorText) {
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.error || errorJson.message || errorText;
            } catch {
              errorMessage = errorText || response.statusText;
            }
          }
        }
        
        if (response.status === 403) {
          errorMessage = `❌ Acceso denegado: ${errorMessage}. Verifica que el token sea válido y no esté expirado.`;
        }
        
        throw new Error(errorMessage);
      }

      const resultado = await response.json();
      
      // PASO 3: Combinar datos de ambas fuentes (priorizar firmasecuador, complementar con Zamplisoft)
      // Primero guardar TODOS los campos del resultado de firmasecuador
      const datosCombinados = {
        ...resultado, // Esto incluye TODOS los campos: foto, huella, etc.
        // Si firmasecuador no tiene algunos campos, usar los de Zamplisoft
        nombres: resultado.nombres || datosZamplisoftTemp?.nombres || '',
        apellidos: resultado.apellidos || datosZamplisoftTemp?.apellidos || '',
        nacionalidad: resultado.nacionalidad || datosZamplisoftTemp?.nacionalidad || 'Ecuatoriana',
        provincia: resultado.provincia || datosZamplisoftTemp?.provincia || '',
        ciudad: resultado.ciudad || datosZamplisoftTemp?.ciudad || '',
        parroquia: resultado.parroquia || datosZamplisoftTemp?.parroquia || '',
        direccion: resultado.direccion || datosZamplisoftTemp?.direccion || '',
        estadoCivil: resultado.estadoCivil || datosZamplisoftTemp?.estadoCivil || '',
        genero: resultado.genero || datosZamplisoftTemp?.genero || '',
        fechaNacimiento: resultado.fechaNacimiento || datosZamplisoftTemp?.fechaNacimiento || '',
        lugarNacimiento: resultado.lugarNacimiento || datosZamplisoftTemp?.lugarNacimiento || '',
        edad: resultado.edad || datosZamplisoftTemp?.edad || '',
        fechaCedulacion: resultado.fechaCedulacion || datosZamplisoftTemp?.fechaCedulacion || '',
        nombreMadre: resultado.nombreMadre || datosZamplisoftTemp?.nombreMadre || '',
        nombrePadre: resultado.nombrePadre || datosZamplisoftTemp?.nombrePadre || '',
        instruccion: resultado.instruccion || datosZamplisoftTemp?.instruccion || '',
        profesion: resultado.profesion || datosZamplisoftTemp?.profesion || '',
        conyuge: resultado.conyuge || datosZamplisoftTemp?.conyuge || ''
      };
      
      console.log('📋 Todos los datos recibidos de firmasecuador:', resultado);
      setDatos(datosCombinados);

      // PASO 4: Si Zamplisoft no estaba en caché y tenemos datos nuevos, guardarlos
      if (datosZamplisoftTemp && !desdeCacheZamplisoft) {
        try {
          console.log('💾 Guardando datos de Zamplisoft en caché...');
          await guardarCedulaEnCache(ced, datosZamplisoftTemp);
          console.log('✅ Datos guardados en caché exitosamente');
          if (!fuenteDatos) {
            setFuenteDatos('Datos consultados en vivo y almacenados automáticamente.');
          }
        } catch (cacheError) {
          console.warn('⚠️ Error al guardar en caché (no crítico):', cacheError);
        }
      }

      // PASO 5: Consultar edad adicional
      try {
        const edadResponse = await fetch('https://apifirmas.firmasecuador.com/api/usuarios/consultarEdad', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-token': tokActual
          },
          body: JSON.stringify({ cedula: ced })
        });

        if (!edadResponse.ok) {
          throw new Error(`Edad: ${edadResponse.status}`);
        }

        const edadData = await edadResponse.json();
        setEdadInfo(edadData);
      } catch (edadErr) {
        setEdadError(edadErr.message || 'No se pudo obtener la edad adicional.');
      }

      // PASO 6: Consultar denuncias de fiscalía (en paralelo, no bloquea)
      consultarDenunciasFiscalia(ced).catch(() => {
        // Errores ya manejados en la función
      });
      
      // Consultar procesos judiciales (como actor/demandado)
      consultarProcesosJudiciales(ced).catch(() => {
        // Errores ya manejados en la función
      });
      
      // PASO 7: Construir nombre completo y consultar procesos como denunciante/afectado
      // Obtener nombres y apellidos de los datos combinados
      const nombresFinal = datosCombinados.nombres || '';
      const apellidosFinal = datosCombinados.apellidos || '';
      const nombreCompleto = apellidosFinal && nombresFinal 
        ? `${apellidosFinal} ${nombresFinal}`.trim().toUpperCase()
        : (datosZamplisoftTemp?.nombre || resultado?.nombre || '').trim().toUpperCase();
      
      // Consultar procesos como denunciante/afectado (por nombre completo)
      if (nombreCompleto && nombreCompleto.length > 0) {
        consultarProcesosDenunciante(nombreCompleto).catch(() => {
          // Errores ya manejados en la función
        });
      }
    } catch (e) {
      setError(e.message || 'Error al consultar la cédula');
      setFuenteDatos('');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="cc-container">
      <style>{`
        .cc-form { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
        .cc-form-row { display: grid; grid-template-columns: 1fr auto; gap: 6px; }
        .cc-input-group { display: flex; flex-direction: column; gap: 4px; }
        .cc-input-label { font-size: 11px; color: #6b7280; font-weight: 600; }
        .cc-input { padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; }
        .cc-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1); }
        .cc-btn { border: 1px solid #a5b4fc; background: #eef2ff; color: #3730a3; border-radius: 6px; padding: 6px 10px; font-weight: 700; font-size: 12px; cursor: pointer; }
        .cc-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .cc-empty { padding: 6px 8px; background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; border-radius: 6px; font-size: 12px; margin-bottom: 8px; }
        .cc-success { padding: 6px 8px; background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; border-radius: 6px; font-size: 12px; margin-bottom: 8px; }
        .cc-result { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
        .cc-title { font-size: 16px; font-weight: 800; margin: 0 0 6px; }
        .cc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; }
        .cc-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px; background: #fafafa; }
        .cc-label { font-size: 11px; color: #6b7280; margin: 0; }
        .cc-value { font-size: 13px; font-weight: 700; color: #111827; margin: 2px 0 0; }
        .cc-section { margin-top: 12px; }
        .cc-section h4 { margin: 0 0 6px; font-size: 13px; font-weight: 800; color: #111827; }
        .cc-badge { font-size: 11px; font-weight: 700; border: 1px solid #e5e7eb; border-radius: 999px; padding: 4px 8px; display: inline-block; margin: 2px 4px 2px 0; }
        .cc-badge.ok { background: #ecfdf5; color: #065f46; border-color: #a7f3d0; }
        .cc-info-token { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 8px; font-size: 11px; margin-bottom: 8px; color: #1e40af; }
        .cc-info-token strong { display: block; margin-bottom: 4px; }
        .cc-info-token span { display: inline-block; margin-right: 8px; }
        .cc-photo-section { margin-top: 12px; text-align: center; }
        .cc-photo-container { display: inline-block; border: 2px solid #e5e7eb; border-radius: 8px; padding: 8px; background: #fafafa; }
        .cc-photo { max-width: 100%; max-height: 400px; border-radius: 4px; display: block; }
        .cc-photo-label { font-size: 12px; color: #6b7280; margin-top: 6px; font-weight: 600; }
        
        /* Contenedor principal */
        .cc-container {
          padding: 8px;
          max-width: 100%;
        }
        
        /* Contenedor principal - responsive */
        @media (max-width: 768px) {
          .cc-container {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          
          .cc-title {
            padding: 0 8px;
            margin: 8px 0 8px 0 !important;
          }
          
          .cc-form {
            padding: 0 8px;
            margin-bottom: 8px !important;
          }
          
          .cc-form-row {
            gap: 4px;
          }
          
          .cc-info-token {
            margin: 0 8px 8px 8px;
          }
          
          .cc-empty,
          .cc-success {
            margin: 0 8px 8px 8px;
          }
        }
        
        /* Estilos de expediente policial */
        .cc-expediente-policial { 
          background: #ffffff; 
          border: 3px solid #1a1a1a; 
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15); 
          margin-top: 16px;
          position: relative;
          overflow: hidden;
        }
        .cc-expediente-policial::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #dc2626 0%, #991b1b 50%, #dc2626 100%);
        }
        
        /* Header del expediente */
        .cc-exp-header {
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
          color: #ffffff;
          padding: 14px 18px;
          border-bottom: 2px solid #dc2626;
        }
        .cc-exp-header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .cc-exp-badge {
          background: #dc2626;
          color: #ffffff;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .cc-exp-fecha {
          font-size: 10px;
          color: #d1d5db;
          font-weight: 600;
        }
        .cc-exp-title {
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          text-align: center;
        }
        
        /* Sección principal con foto */
        .cc-exp-main {
          display: flex;
          gap: 16px;
          padding: 16px 18px;
          background: #f9fafb;
          border-bottom: 2px solid #e5e7eb;
        }
        .cc-exp-photo-section {
          flex: 0 0 160px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .cc-exp-photo-section .cc-photo-section {
          width: 100%;
          margin: 0;
        }
        .cc-exp-photo-section .cc-photo-container {
          border: 2px solid #1a1a1a;
          border-radius: 6px;
          padding: 8px;
          background: #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .cc-exp-photo-info {
          margin-top: 8px;
          text-align: center;
        }
        .cc-exp-photo-label {
          font-size: 9px;
          font-weight: 800;
          color: #6b7280;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 3px;
        }
        .cc-exp-photo-id {
          font-size: 12px;
          font-weight: 700;
          color: #111827;
        }
        .cc-exp-identity {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .cc-exp-name {
          font-size: 24px;
          font-weight: 900;
          color: #111827;
          margin-bottom: 6px;
          letter-spacing: 0.5px;
        }
        .cc-exp-subtitle {
          font-size: 9px;
          font-weight: 700;
          color: #6b7280;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        .cc-exp-quick-info {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        .cc-exp-quick-item {
          background: #ffffff;
          border: 1.5px solid #e5e7eb;
          border-radius: 4px;
          padding: 8px 10px;
        }
        .cc-exp-quick-label {
          display: block;
          font-size: 8px;
          font-weight: 800;
          color: #9ca3af;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 3px;
        }
        .cc-exp-quick-value {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: #111827;
        }
        
        /* Secciones del expediente */
        .cc-exp-section {
          border-bottom: 2px solid #e5e7eb;
          background: #ffffff;
        }
        .cc-exp-section:last-of-type {
          border-bottom: none;
        }
        .cc-exp-section-header {
          background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
          color: #ffffff;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 2px solid #111827;
          cursor: pointer;
          user-select: none;
          transition: background 0.2s ease;
        }
        .cc-exp-section-header:hover {
          background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
        }
        .cc-exp-section-toggle {
          margin-left: auto;
          font-size: 16px;
          transition: transform 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
        }
        .cc-exp-section-toggle.expanded {
          transform: rotate(180deg);
        }
        .cc-exp-section-content {
          padding: 16px 18px;
          transition: max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease;
          overflow: hidden;
          max-height: 10000px;
          opacity: 1;
        }
        .cc-exp-section-content.collapsed {
          max-height: 0 !important;
          padding: 0 18px !important;
          opacity: 0;
          overflow: hidden;
        }
        .cc-exp-section-number {
          background: #dc2626;
          color: #ffffff;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 900;
          flex-shrink: 0;
        }
        .cc-exp-section-title {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin: 0;
        }
        .cc-exp-section-content {
          padding: 16px 18px;
        }
        .cc-exp-data-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .cc-exp-data-item {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-left: 3px solid #dc2626;
          padding: 10px 12px;
          border-radius: 4px;
        }
        .cc-exp-data-item.full-width {
          grid-column: 1 / -1;
        }
        .cc-exp-data-label {
          font-size: 9px;
          font-weight: 800;
          color: #6b7280;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .cc-exp-data-value {
          font-size: 13px;
          font-weight: 700;
          color: #111827;
          line-height: 1.3;
        }
        
        /* Footer del expediente */
        .cc-exp-footer {
          background: #f9fafb;
          padding: 12px 18px;
          text-align: center;
          border-top: 2px solid #e5e7eb;
        }
        .cc-exp-footer-line {
          height: 1px;
          background: #d1d5db;
          margin-bottom: 8px;
        }
        .cc-exp-footer-text {
          font-size: 9px;
          font-weight: 700;
          color: #6b7280;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        
        @media (max-width: 768px) {
          /* Contenedor principal sin padding en móvil */
          .cc-container {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          
          .cc-expediente-policial {
            margin: 0 !important;
            border-left: none !important;
            border-right: none !important;
            border-radius: 0 !important;
            border-width: 2px !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          
          .cc-exp-header {
            padding: 10px 12px !important;
            margin: 0 !important;
          }
          
          .cc-exp-main {
            flex-direction: column;
            padding: 10px 12px !important;
            gap: 10px;
            margin: 0 !important;
          }
          
          .cc-exp-photo-section {
            flex: 0 0 auto;
            width: 100%;
            margin: 0 !important;
          }
          
          .cc-exp-photo-section .cc-photo-container {
            max-width: 120px;
            margin: 0 auto;
            padding: 6px !important;
          }
          
          .cc-exp-name {
            font-size: 18px !important;
            margin: 0 !important;
          }
          
          .cc-exp-quick-info {
            grid-template-columns: 1fr !important;
            gap: 6px !important;
            margin: 0 !important;
          }
          
          .cc-exp-quick-item {
            padding: 6px 8px !important;
            margin: 0 !important;
          }
          
          .cc-exp-section {
            margin: 0 !important;
            border-left: none !important;
            border-right: none !important;
          }
          
          .cc-exp-section-header {
            padding: 8px 12px !important;
            margin: 0 !important;
          }
          
          .cc-exp-section-content {
            padding: 10px 12px !important;
            margin: 0 !important;
          }
          
          .cc-exp-data-grid {
            grid-template-columns: 1fr !important;
            gap: 6px !important;
            margin: 0 !important;
          }
          
          .cc-exp-data-item {
            padding: 6px 8px !important;
            margin: 0 !important;
          }
          
          .cc-exp-footer {
            padding: 8px 12px !important;
            margin: 0 !important;
          }
          
          /* Contenedores de denuncias en móvil */
          .cc-denuncia-container {
            margin: 0 0 16px 0 !important;
            border-left: none !important;
            border-right: none !important;
            border-radius: 0 !important;
            border-width: 1px !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          
          .cc-denuncia-container > div:first-child {
            padding: 10px 12px !important;
            margin: 0 !important;
          }
          
          .cc-denuncia-container > div:last-child {
            padding: 10px 12px !important;
            margin: 0 !important;
          }
          
          /* Procesos judiciales en móvil */
          .cc-proceso-container {
            margin: 0 0 16px 0 !important;
            border-left: none !important;
            border-right: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          
          .cc-proceso-container > div {
            padding: 10px 12px !important;
            margin: 0 !important;
          }
        }
      `}</style>

      <h3 className="cc-title">Consultar Cédula</h3>

      {tokenStatus && (
        <div className="cc-success">{tokenStatus}</div>
      )}
      {tokenError && (
        <div className="cc-empty">{tokenError}</div>
      )}
      {fuenteDatos && !error && (
        <div className="cc-success">{fuenteDatos}</div>
      )}
      <form className="cc-form" onSubmit={consultar}>
        <div className="cc-form-row">
          <div className="cc-input-group" style={{ margin: 0 }}>
            <label className="cc-input-label">Número de Cédula</label>
            <input 
              className="cc-input" 
              value={cedula} 
              onChange={(e) => setCedula(e.target.value)} 
              placeholder="Ej. 0958424587" 
              maxLength="10"
            />
          </div>
          <button className="cc-btn" type="submit" disabled={cargando || tokenLoading} style={{ alignSelf: 'flex-end' }}>
            {cargando ? 'Consultando…' : 'Consultar'}
          </button>
        </div>
      </form>

      {infoToken && (
        <div className="cc-info-token">
          <strong>🔐 Token automático</strong>
          <span>Expira en: {infoToken.expiraEn}</span>
        </div>
      )}
      
      {error && <div className="cc-empty">{error}</div>}
      
      {/* Botón para descargar PDF */}
      {(datos || datosZamplisoft) && (
        <div style={{ marginBottom: '12px', textAlign: 'right' }}>
          <button
            onClick={descargarPDF}
            disabled={descargandoPDF}
            style={{
              background: descargandoPDF ? '#9ca3af' : '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: descargandoPDF ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              if (!descargandoPDF) {
                e.target.style.background = '#b91c1c';
              }
            }}
            onMouseLeave={(e) => {
              if (!descargandoPDF) {
                e.target.style.background = '#dc2626';
              }
            }}
          >
            {descargandoPDF ? (
              <>
                <span>⏳</span>
                <span>Generando PDF...</span>
              </>
            ) : (
              <>
                <span>📄</span>
                <span>Descargar Expediente PDF</span>
              </>
            )}
          </button>
        </div>
      )}
      
      {(datos || datosZamplisoft) && (() => {
        const edadDetallada = obtenerEdadExtendida();
        
        // Función para separar nombres y apellidos si vienen juntos
        const separarNombreCompleto = (nombreCompleto) => {
          if (!nombreCompleto) return { nombres: '', apellidos: '' };
          const partes = nombreCompleto.trim().split(' ').filter(p => p);
          if (partes.length <= 2) {
            return { nombres: nombreCompleto, apellidos: '' };
          }
          // Los primeros 2 elementos son apellidos, el resto son nombres
          const apellidos = partes.slice(0, 2).join(' ');
          const nombres = partes.slice(2).join(' ');
          return { nombres, apellidos };
        };
        
        // Priorizar nombres y apellidos de Zamplisoft (ya están separados correctamente)
        // Si no están disponibles, intentar separar del nombre completo
        let nombresFinal = datosZamplisoft?.nombres || '';
        let apellidosFinal = datosZamplisoft?.apellidos || '';
        
        // Si Zamplisoft no tiene nombres/apellidos separados, pero tiene nombre completo, separarlo
        if (!nombresFinal && !apellidosFinal && datosZamplisoft?.nombre) {
          const separados = separarNombreCompleto(datosZamplisoft.nombre);
          nombresFinal = separados.nombres;
          apellidosFinal = separados.apellidos;
        }
        
        // Si firmasecuador tiene nombre completo y no tenemos nombres/apellidos, separarlo
        if (!nombresFinal && !apellidosFinal && datos?.nombre) {
          const separados = separarNombreCompleto(datos.nombre);
          nombresFinal = separados.nombres;
          apellidosFinal = separados.apellidos;
        }
        
        // Si firmasecuador tiene nombres/apellidos separados y no tenemos, usarlos
        if (!nombresFinal) nombresFinal = datos?.nombres || '';
        if (!apellidosFinal) apellidosFinal = datos?.apellidos || '';
        
        // Combinar datos: priorizar datos de firmasecuador, pero usar nombres/apellidos procesados
        const datosCompletos = {
          ...datosZamplisoft,
          ...datos, // Los datos de firmasecuador tienen prioridad
          // Usar nombres y apellidos correctamente separados
          nombres: nombresFinal,
          apellidos: apellidosFinal,
          // Asegurar que tenemos todos los campos de Zamplisoft
          nombrePadre: datos?.nombrePadre || datosZamplisoft?.nombrePadre || '',
          nombreMadre: datos?.nombreMadre || datosZamplisoft?.nombreMadre || '',
          instruccion: datos?.instruccion || datosZamplisoft?.instruccion || '',
          profesion: datos?.profesion || datosZamplisoft?.profesion || '',
          conyuge: datos?.conyuge || datosZamplisoft?.conyuge || '',
          lugarNacimiento: datos?.lugarNacimiento || datosZamplisoft?.lugarNacimiento || '',
          fechaCedulacion: datos?.fechaCedulacion || datosZamplisoft?.fechaCedulacion || '',
          cedula: datos?.cedula || datosZamplisoft?.cedula || cedula
        };
        
        const nombrePrincipal =
          `${datosCompletos.nombres || ''} ${datosCompletos.apellidos || ''}`.trim() ||
          datosCompletos.nombre ||
          'Sin registro';
            
            return (
          <div className="cc-expediente-policial" ref={expedienteRef}>
            {/* Header del expediente */}
            <div className="cc-exp-header">
              <div className="cc-exp-header-top">
                <div className="cc-exp-badge">EXPEDIENTE N° {datosCompletos.cedula || 'N/A'}</div>
                <div className="cc-exp-fecha">{new Date().toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
              </div>
              <div className="cc-exp-title">REGISTRO DE IDENTIDAD CIVIL</div>
            </div>

            {/* Foto y datos principales */}
            <div className="cc-exp-main">
              <div className="cc-exp-photo-section">
                {renderFotoCedula()}
                <div className="cc-exp-photo-info">
                  <div className="cc-exp-photo-label">FOTO IDENTIFICACIÓN</div>
                  <div className="cc-exp-photo-id">C.I. {datosCompletos.cedula || 'N/A'}</div>
                </div>
              </div>
              
              <div className="cc-exp-identity">
                <div className="cc-exp-name">{nombrePrincipal}</div>
                <div className="cc-exp-subtitle">IDENTIFICACIÓN PERSONAL</div>
                
                <div className="cc-exp-quick-info">
                  <div className="cc-exp-quick-item">
                    <span className="cc-exp-quick-label">CÉDULA</span>
                    <span className="cc-exp-quick-value">{datosCompletos.cedula || 'N/A'}</span>
                  </div>
                  <div className="cc-exp-quick-item">
                    <span className="cc-exp-quick-label">EDAD</span>
                    <span className="cc-exp-quick-value">{edadDetallada || datosCompletos.edad || 'N/A'} {edadDetallada || datosCompletos.edad ? 'años' : ''}</span>
                  </div>
                  <div className="cc-exp-quick-item">
                    <span className="cc-exp-quick-label">GÉNERO</span>
                    <span className="cc-exp-quick-value">{datosCompletos.genero || 'N/A'}</span>
                  </div>
                  <div className="cc-exp-quick-item">
                    <span className="cc-exp-quick-label">ESTADO</span>
                    <span className="cc-exp-quick-value">{datosCompletos.estado || 'Activo'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 1: Datos Personales Completos */}
            <div className="cc-exp-section">
              <div 
                className="cc-exp-section-header"
                onClick={() => toggleSeccion('01')}
              >
                <span className="cc-exp-section-number">01</span>
                <h3 className="cc-exp-section-title">DATOS PERSONALES</h3>
                <span className={`cc-exp-section-toggle ${seccionesExpandidas.has('01') ? 'expanded' : ''}`}>
                  ▼
                </span>
              </div>
              <div className={`cc-exp-section-content ${seccionesExpandidas.has('01') ? '' : 'collapsed'}`}>
                <div className="cc-exp-data-grid">
                  <div className="cc-exp-data-item">
                    <div className="cc-exp-data-label">NOMBRES COMPLETOS</div>
                    <div className="cc-exp-data-value">{datosCompletos.nombres || 'N/A'}</div>
                  </div>
                  <div className="cc-exp-data-item">
                    <div className="cc-exp-data-label">APELLIDOS COMPLETOS</div>
                    <div className="cc-exp-data-value">{datosCompletos.apellidos || 'N/A'}</div>
                  </div>
                  <div className="cc-exp-data-item">
                    <div className="cc-exp-data-label">FECHA DE NACIMIENTO</div>
                    <div className="cc-exp-data-value">{datosCompletos.fechaNacimiento || 'N/A'}</div>
                  </div>
                  <div className="cc-exp-data-item">
                    <div className="cc-exp-data-label">LUGAR DE NACIMIENTO</div>
                    <div className="cc-exp-data-value">{datosCompletos.lugarNacimiento || 'N/A'}</div>
                  </div>
                  <div className="cc-exp-data-item">
                    <div className="cc-exp-data-label">EDAD</div>
                    <div className="cc-exp-data-value">{edadDetallada || datosCompletos.edad || 'N/A'} {edadDetallada || datosCompletos.edad ? 'años' : ''}</div>
                  </div>
                  <div className="cc-exp-data-item">
                    <div className="cc-exp-data-label">GÉNERO</div>
                    <div className="cc-exp-data-value">{datosCompletos.genero || 'N/A'}</div>
                  </div>
                  <div className="cc-exp-data-item">
                    <div className="cc-exp-data-label">ESTADO CIVIL</div>
                    <div className="cc-exp-data-value">{datosCompletos.estadoCivil || 'N/A'}</div>
                  </div>
                  <div className="cc-exp-data-item">
                    <div className="cc-exp-data-label">NACIONALIDAD</div>
                    <div className="cc-exp-data-value">{datosCompletos.nacionalidad || 'Ecuatoriana'}</div>
                  </div>
                  <div className="cc-exp-data-item">
                    <div className="cc-exp-data-label">FECHA DE CEDULACIÓN</div>
                    <div className="cc-exp-data-value">{datosCompletos.fechaCedulacion || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 2: Información Familiar */}
            <div className="cc-exp-section">
              <div 
                className="cc-exp-section-header"
                onClick={() => toggleSeccion('02')}
              >
                <span className="cc-exp-section-number">02</span>
                <h3 className="cc-exp-section-title">INFORMACIÓN FAMILIAR</h3>
                <span className={`cc-exp-section-toggle ${seccionesExpandidas.has('02') ? 'expanded' : ''}`}>
                  ▼
                </span>
              </div>
              <div className={`cc-exp-section-content ${seccionesExpandidas.has('02') ? '' : 'collapsed'}`}>
                <div className="cc-exp-data-grid">
                  <div className="cc-exp-data-item full-width">
                    <div className="cc-exp-data-label">NOMBRE DEL PADRE</div>
                    <div className="cc-exp-data-value">{datosCompletos.nombrePadre || 'N/A'}</div>
                  </div>
                  <div className="cc-exp-data-item full-width">
                    <div className="cc-exp-data-label">NOMBRE DE LA MADRE</div>
                    <div className="cc-exp-data-value">{datosCompletos.nombreMadre || 'N/A'}</div>
                  </div>
                  {datosCompletos.conyuge && (
                    <div className="cc-exp-data-item full-width">
                      <div className="cc-exp-data-label">CÓNYUGE</div>
                      <div className="cc-exp-data-value">{datosCompletos.conyuge}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sección 3: Ubicación y Domicilio */}
            <div className="cc-exp-section">
              <div 
                className="cc-exp-section-header"
                onClick={() => toggleSeccion('03')}
              >
                <span className="cc-exp-section-number">03</span>
                <h3 className="cc-exp-section-title">UBICACIÓN Y DOMICILIO</h3>
                <span className={`cc-exp-section-toggle ${seccionesExpandidas.has('03') ? 'expanded' : ''}`}>
                  ▼
                </span>
              </div>
              <div className={`cc-exp-section-content ${seccionesExpandidas.has('03') ? '' : 'collapsed'}`}>
                <div className="cc-exp-data-grid">
                  <div className="cc-exp-data-item">
                    <div className="cc-exp-data-label">PROVINCIA</div>
                    <div className="cc-exp-data-value">{datosCompletos.provincia || 'N/A'}</div>
                  </div>
                  <div className="cc-exp-data-item">
                    <div className="cc-exp-data-label">CIUDAD</div>
                    <div className="cc-exp-data-value">{datosCompletos.ciudad || 'N/A'}</div>
                  </div>
                  <div className="cc-exp-data-item">
                    <div className="cc-exp-data-label">PARROQUIA</div>
                    <div className="cc-exp-data-value">{datosCompletos.parroquia || 'N/A'}</div>
                  </div>
                  <div className="cc-exp-data-item full-width">
                    <div className="cc-exp-data-label">DIRECCIÓN COMPLETA</div>
                    <div className="cc-exp-data-value">{datosCompletos.direccion || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 4: Información Académica y Profesional */}
            <div className="cc-exp-section">
              <div 
                className="cc-exp-section-header"
                onClick={() => toggleSeccion('04')}
              >
                <span className="cc-exp-section-number">04</span>
                <h3 className="cc-exp-section-title">INFORMACIÓN ACADÉMICA Y PROFESIONAL</h3>
                <span className={`cc-exp-section-toggle ${seccionesExpandidas.has('04') ? 'expanded' : ''}`}>
                  ▼
                </span>
              </div>
              <div className={`cc-exp-section-content ${seccionesExpandidas.has('04') ? '' : 'collapsed'}`}>
                <div className="cc-exp-data-grid">
                  <div className="cc-exp-data-item">
                    <div className="cc-exp-data-label">NIVEL DE INSTRUCCIÓN</div>
                    <div className="cc-exp-data-value">{datosCompletos.instruccion || 'N/A'}</div>
                  </div>
                  <div className="cc-exp-data-item">
                    <div className="cc-exp-data-label">PROFESIÓN</div>
                    <div className="cc-exp-data-value">{datosCompletos.profesion || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 5: Información Biométrica y Adicional */}
            <div className="cc-exp-section">
              <div 
                className="cc-exp-section-header"
                onClick={() => toggleSeccion('05')}
              >
                <span className="cc-exp-section-number">05</span>
                <h3 className="cc-exp-section-title">INFORMACIÓN BIOMÉTRICA Y ADICIONAL</h3>
                <span className={`cc-exp-section-toggle ${seccionesExpandidas.has('05') ? 'expanded' : ''}`}>
                  ▼
                </span>
              </div>
              <div className={`cc-exp-section-content ${seccionesExpandidas.has('05') ? '' : 'collapsed'}`}>
                <div className="cc-exp-data-grid">
                  {(datosCompletos.huella || datosCompletos.huellaDigital || datosCompletos.codigoHuella || datosCompletos.huellaDactilar) && (
                    <div className="cc-exp-data-item full-width">
                      <div className="cc-exp-data-label">CÓDIGO DE HUELLA DACTILAR</div>
                      <div className="cc-exp-data-value" style={{ fontFamily: 'monospace', fontSize: '14px', wordBreak: 'break-all' }}>
                        {datosCompletos.huella || datosCompletos.huellaDigital || datosCompletos.codigoHuella || datosCompletos.huellaDactilar}
                      </div>
                    </div>
                  )}
                  {Object.entries(datosCompletos).filter(([key, value]) => {
                    // Excluir campos ya mostrados y campos de imagen
                    const camposExcluidos = [
                      'nombres', 'apellidos', 'nombre', 'cedula', 'fechaNacimiento', 'edad', 'genero',
                      'estadoCivil', 'nacionalidad', 'provincia', 'ciudad', 'parroquia', 'direccion',
                      'estado', 'lugarNacimiento', 'fechaCedulacion', 'nombreMadre', 'nombrePadre',
                      'instruccion', 'profesion', 'conyuge',
                      'foto', 'fotoBase64', 'foto_base64', 'imagen', 'imagenBase64', 'fotoCedula',
                      'huella', 'huellaDigital', 'codigoHuella', 'huellaDactilar', // Ya mostrados arriba
                      'html', 'raw', 'denuncias', 'mensaje' // Campos de denuncias
                    ];
                    if (camposExcluidos.includes(key)) return false;
                    if (!value || typeof value === 'object') return false;
                    const strValue = String(value).trim();
                    if (strValue.length === 0) return false;
                    // Excluir si parece ser HTML completo
                    if (strValue.includes('<!DOCTYPE') || strValue.includes('<html') || strValue.includes('<body')) return false;
                    // Excluir si contiene muchas etiquetas HTML
                    const tagCount = (strValue.match(/<[^>]+>/g) || []).length;
                    if (tagCount > 5) return false;
                    return true;
                  }).map(([key, value]) => {
                    // Limpiar HTML básico si existe
                    let cleanValue = String(value).trim();
                    // Remover etiquetas HTML simples pero mantener el texto
                    cleanValue = cleanValue.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                    return (
                      <div className="cc-exp-data-item" key={key}>
                        <div className="cc-exp-data-label">{key.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}</div>
                        <div className="cc-exp-data-value">{cleanValue}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sección 6: Denuncias de Fiscalía */}
            {(datos || datosZamplisoft) && (
              <div className="cc-exp-section">
                <div 
                  className="cc-exp-section-header"
                  onClick={() => toggleSeccion('06')}
                >
                  <span className="cc-exp-section-number">06</span>
                  <h3 className="cc-exp-section-title">DENUNCIAS Y NOTICIAS DE DELITO</h3>
                  <span className={`cc-exp-section-toggle ${seccionesExpandidas.has('06') ? 'expanded' : ''}`}>
                    ▼
                  </span>
                </div>
                <div className={`cc-exp-section-content ${seccionesExpandidas.has('06') ? '' : 'collapsed'}`}>
                  {denunciasCargando && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                      <div style={{ marginBottom: '8px' }}>Consultando denuncias...</div>
                      <div style={{ fontSize: '12px' }}>Buscando información en el sistema de fiscalía</div>
              </div>
            )}
                  {denunciasError && (
                    <>
                      {denunciasError.includes('Incapsula') || denunciasError.includes('bloquea el acceso automático') ? (
                        <div className="cc-exp-data-item full-width" style={{ background: '#fffbeb', borderLeftColor: '#f59e0b', padding: '16px' }}>
                          <div className="cc-exp-data-label" style={{ color: '#92400e', marginBottom: '12px' }}>
                            ⚠️ CONSULTA DIRECTA REQUERIDA
                          </div>
                          <div className="cc-exp-data-value" style={{ color: '#78350f', marginBottom: '16px', fontSize: '13px', lineHeight: '1.6' }}>
                            El sistema de fiscalía está protegido y requiere acceso directo desde el navegador. 
                            Se muestra la consulta embebida a continuación:
                          </div>
                          <div style={{ 
                            width: '100%', 
                            height: '600px', 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: '#fff'
                          }}>
                            <iframe
                              src={`https://www.gestiondefiscalias.gob.ec/siaf/comunes/noticiasdelito/info_mod.php?businfo=${encodeURIComponent(`a:1:{i:0;s:10:"${cedula}";}`)}`}
                              style={{
                                width: '100%',
                                height: '100%',
                                border: 'none'
                              }}
                              title="Consulta de denuncias de fiscalía"
                              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                            />
                          </div>
                          <div style={{ marginTop: '12px', fontSize: '11px', color: '#6b7280', textAlign: 'center' }}>
                            Si el iframe no carga, puedes consultar directamente en:{' '}
                            <a 
                              href={`https://www.gestiondefiscalias.gob.ec/siaf/informacion/web/noticiasdelito/index.php`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#3b82f6', textDecoration: 'underline' }}
                            >
                              Sistema de Fiscalía
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="cc-exp-data-item full-width" style={{ background: '#fef2f2', borderLeftColor: '#ef4444' }}>
                          <div className="cc-exp-data-label" style={{ color: '#dc2626' }}>ERROR AL CONSULTAR</div>
                          <div className="cc-exp-data-value" style={{ color: '#991b1b' }}>{denunciasError}</div>
              </div>
            )}
                    </>
                  )}
                  {denunciasFiscalia && !denunciasCargando && (
                    <>
                      {denunciasFiscalia.mensaje && (
                        <div className="cc-exp-data-item full-width">
                          <div className="cc-exp-data-label">INFORMACIÓN</div>
                          <div className="cc-exp-data-value">{denunciasFiscalia.mensaje}</div>
              </div>
            )}
                      {denunciasFiscalia.denuncias && denunciasFiscalia.denuncias.length > 0 && (
                        <div style={{ width: '100%' }}>
                          {denunciasFiscalia.denuncias.map((denuncia, index) => {
                            // Determinar el rol de la persona consultada en esta denuncia
                            const cedulaConsultada = cedula.trim();
                            const sujetoConsultado = denuncia.sujetos?.find(s => 
                              s.cedula === cedulaConsultada || 
                              s.cedula.replace(/\s/g, '') === cedulaConsultada
                            );
                            
                            let rolPersona = null;
                            let colorRol = '#6b7280';
                            let bgColorRol = '#f3f4f6';
                            
                            if (sujetoConsultado) {
                              if (sujetoConsultado.estado === 'DENUNCIANTE') {
                                rolPersona = 'DENUNCIANTE';
                                colorRol = '#065f46';
                                bgColorRol = '#d1fae5';
                              } else if (sujetoConsultado.estado === 'SOSPECHOSO') {
                                rolPersona = 'SOSPECHOSO';
                                colorRol = '#991b1b';
                                bgColorRol = '#fee2e2';
                              } else if (sujetoConsultado.estado === 'VICTIMA') {
                                rolPersona = 'VÍCTIMA';
                                colorRol = '#1e40af';
                                bgColorRol = '#dbeafe';
                              }
                            }
                            
                            return (
                              <div 
                                key={index} 
                                className="cc-denuncia-container"
                                style={{ 
                                  marginBottom: '32px',
                                  border: '2px solid #e5e7eb',
                                  borderRadius: '8px',
                                  background: '#ffffff',
                                  overflow: 'hidden'
                                }}
                              >
                                {/* Encabezado de la denuncia con rol */}
                                <div 
                                  style={{ 
                                    background: rolPersona === 'DENUNCIANTE' ? 'linear-gradient(135deg, #065f46 0%, #047857 100%)' :
                                               rolPersona === 'SOSPECHOSO' ? 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)' :
                                               rolPersona === 'VÍCTIMA' ? 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' :
                                               'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
                                    padding: '14px 18px',
                                    borderBottom: '2px solid ' + (rolPersona === 'DENUNCIANTE' ? '#10b981' :
                                                                    rolPersona === 'SOSPECHOSO' ? '#dc2626' :
                                                                    rolPersona === 'VÍCTIMA' ? '#3b82f6' : '#dc2626')
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                    <div>
                                      <div style={{ color: '#ffffff', fontSize: '9px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px', opacity: 0.9 }}>
                                        NOTICIA DEL DELITO
                                      </div>
                                      <div style={{ color: '#ffffff', fontSize: '18px', fontWeight: '900', letterSpacing: '0.5px' }}>
                                        Nro. {denuncia.numeroNoticia || `${index + 1}`}
                                      </div>
                                    </div>
                                    {rolPersona && (
                                      <div style={{
                                        background: bgColorRol,
                                        color: colorRol,
                                        padding: '8px 12px',
                                        borderRadius: '4px',
                                        fontSize: '10px',
                                        fontWeight: '900',
                                        letterSpacing: '1px',
                                        textTransform: 'uppercase',
                                        border: `2px solid ${colorRol}`,
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                      }}>
                                        {rolPersona}
              </div>
            )}
                                  </div>
                                </div>
                                
                                {/* Contenido de la denuncia - Diseño compacto y elegante */}
                                <div style={{ padding: '14px 18px' }}>
                                  {/* Delito destacado */}
                                  {denuncia.delito && (
                                    <div style={{ 
                                      marginBottom: '14px',
                                      padding: '10px 14px',
                                      background: '#fef2f2',
                                      borderLeft: '3px solid #dc2626',
                                      borderRadius: '4px'
                                    }}>
                                      <div style={{ fontSize: '9px', fontWeight: '800', color: '#991b1b', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                        DELITO
                                      </div>
                                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#dc2626' }}>
                                        {denuncia.delito}
                                      </div>
              </div>
            )}
                                  
                                  {/* Información principal en formato compacto */}
                                  <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                                    gap: '10px',
                                    marginBottom: '14px'
                                  }}>
                                    {denuncia.fecha && (
                                      <div>
                                        <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
                                          FECHA
                                        </div>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                          {denuncia.fecha}
                                        </div>
              </div>
            )}
                                    {denuncia.hora && (
                                      <div>
                                        <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
                                          HORA
                                        </div>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                          {denuncia.hora}
                                        </div>
              </div>
            )}
                                    {denuncia.lugar && (
                                      <div>
                                        <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
                                          LUGAR
                                        </div>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                          {denuncia.lugar}
                                        </div>
              </div>
            )}
                                    {denuncia.numeroOficio && (
                                      <div>
                                        <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
                                          NRO. OFICIO
                                        </div>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                          {denuncia.numeroOficio}
                                        </div>
              </div>
            )}
                                  </div>
                                  
                                  {/* Fiscalía en formato compacto */}
                                  {denuncia.fiscalia && (
                                    <div style={{ marginBottom: '14px', padding: '10px 14px', background: '#f9fafb', borderRadius: '4px', borderLeft: '3px solid #d1d5db' }}>
                                      <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
                                        FISCALÍA
                                      </div>
                                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#111827' }}>
                                        {denuncia.fiscalia}
                                      </div>
              </div>
            )}
                                  
                                  {/* Sujetos en formato compacto y elegante */}
                                  {denuncia.sujetos && denuncia.sujetos.length > 0 && (
                                    <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '2px solid #e5e7eb' }}>
                                      <div style={{ 
                                        fontSize: '9px', 
                                        fontWeight: '800', 
                                        color: '#6b7280', 
                                        letterSpacing: '0.5px', 
                                        textTransform: 'uppercase', 
                                        marginBottom: '10px' 
                                      }}>
                                        SUJETOS INVOLUCRADOS
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {denuncia.sujetos.map((sujeto, sujetoIndex) => {
                                          // Determinar colores según el estado
                                          let borderColor = '#dc2626';
                                          let bgColor = '#fef2f2';
                                          let badgeBg = '#fee2e2';
                                          let badgeColor = '#991b1b';
                                          let badgeText = 'SOSPECHOSO';
                                          
                                          if (sujeto.estado === 'VICTIMA') {
                                            borderColor = '#3b82f6';
                                            bgColor = '#eff6ff';
                                            badgeBg = '#dbeafe';
                                            badgeColor = '#1e40af';
                                            badgeText = 'VÍCTIMA';
                                          } else if (sujeto.estado === 'DENUNCIANTE') {
                                            borderColor = '#10b981';
                                            bgColor = '#ecfdf5';
                                            badgeBg = '#d1fae5';
                                            badgeColor = '#065f46';
                                            badgeText = 'DENUNCIANTE';
            }
            
            return (
                                            <div 
                                              key={sujetoIndex} 
                                              style={{ 
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '10px 12px',
                                                background: bgColor,
                                                borderLeft: `3px solid ${borderColor}`,
                                                borderRadius: '4px',
                                                gap: '10px'
                                              }}
                                            >
                                              <div style={{ flex: 1 }}>
                                                <div style={{ 
                                                  fontSize: '12px', 
                                                  fontWeight: '800', 
                                                  color: '#111827',
                                                  marginBottom: '3px'
                                                }}>
                                                  {sujeto.nombres}
                                                </div>
                                                {sujeto.cedula && sujeto.cedula !== 'N/A' && (
                                                  <div style={{ 
                                                    fontSize: '10px', 
                                                    color: '#6b7280',
                                                    fontWeight: '600'
                                                  }}>
                                                    Cédula: {sujeto.cedula}
              </div>
            )}
                                              </div>
                                              <div style={{
                                                fontSize: '9px',
                                                fontWeight: '900',
                                                padding: '6px 10px',
                                                borderRadius: '4px',
                                                background: badgeBg,
                                                color: badgeColor,
                                                letterSpacing: '0.5px',
                                                textTransform: 'uppercase',
                                                border: `2px solid ${borderColor}`,
                                                whiteSpace: 'nowrap'
                                              }}>
                                                {badgeText}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
              </div>
            )}
                                  
                                  {/* Digitador y estado (si existe) en formato compacto al final */}
                                  {(denuncia.digitador || denuncia.estado) && (
                                    <div style={{ 
                                      marginTop: '12px', 
                                      paddingTop: '12px', 
                                      borderTop: '1px solid #e5e7eb',
                                      display: 'flex',
                                      gap: '16px',
                                      flexWrap: 'wrap',
                                      fontSize: '10px',
                                      color: '#6b7280'
                                    }}>
                                      {denuncia.digitador && (
                                        <div>
                                          <span style={{ fontWeight: '700' }}>Digitador:</span> {denuncia.digitador}
              </div>
            )}
                                      {denuncia.estado && (
                                        <div>
                                          <span style={{ fontWeight: '700' }}>Estado:</span> {denuncia.estado}
              </div>
            )}
              </div>
            )}
                                </div>
                              </div>
                            );
                          })}
              </div>
            )}
                    </>
            )}
          </div>
              </div>
            )}

            {/* Sección 7: Procesos Judiciales */}
            {(procesosJudiciales || procesosCargando || procesosError) && (
              <div className="cc-exp-section">
                <div 
                  className="cc-exp-section-header"
                  onClick={() => toggleSeccion('07')}
                >
                  <span className="cc-exp-section-number">07</span>
                  <h3 className="cc-exp-section-title">PROCESOS JUDICIALES</h3>
                  <span className={`cc-exp-section-toggle ${seccionesExpandidas.has('07') ? 'expanded' : ''}`}>
                    ▼
                  </span>
                </div>
                <div className={`cc-exp-section-content ${seccionesExpandidas.has('07') ? '' : 'collapsed'}`}>
                  {procesosCargando && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                      <div style={{ marginBottom: '8px' }}>Consultando procesos judiciales...</div>
                      <div style={{ fontSize: '12px' }}>Buscando información en el sistema judicial</div>
              </div>
            )}
                  {procesosError && (
                    <div className="cc-exp-data-item full-width" style={{ background: '#fef2f2', borderLeftColor: '#ef4444' }}>
                      <div className="cc-exp-data-label" style={{ color: '#dc2626' }}>ERROR AL CONSULTAR</div>
                      <div className="cc-exp-data-value" style={{ color: '#991b1b' }}>{procesosError}</div>
              </div>
            )}
                  {procesosJudiciales && !procesosCargando && (
                    <>
                      {procesosJudiciales.mensaje && (
                        <div className="cc-exp-data-item full-width" style={{ marginBottom: '16px' }}>
                          <div className="cc-exp-data-label">INFORMACIÓN</div>
                          <div className="cc-exp-data-value">{procesosJudiciales.mensaje}</div>
              </div>
            )}
                      {procesosJudiciales.procesos && procesosJudiciales.procesos.length > 0 && (
                        <div style={{ width: '100%' }}>
                          {procesosJudiciales.procesos.map((proceso, index) => {
                            // Determinar el rol de la persona consultada
                            const rolPersona = proceso.rol || 'PARTE';
                            let colorRol = '#6b7280';
                            let bgColorRol = '#f3f4f6';
                            
                            if (rolPersona === 'ACTOR') {
                              colorRol = '#065f46';
                              bgColorRol = '#d1fae5';
                            } else if (rolPersona === 'DEMANDADO') {
                              colorRol = '#991b1b';
                              bgColorRol = '#fee2e2';
                            }
                            
                            // Formatear fecha
                            const fechaIngreso = proceso.fechaIngreso 
                              ? new Date(proceso.fechaIngreso).toLocaleDateString('es-EC', { 
                                  day: '2-digit', 
                                  month: '2-digit', 
                                  year: 'numeric' 
                                })
                              : 'N/A';
                            
                    return (
                              <div 
                                key={index} 
                                className="cc-denuncia-container"
                                style={{ 
                                  marginBottom: '32px',
                                  border: '2px solid #e5e7eb',
                                  borderRadius: '8px',
                                  background: '#ffffff',
                                  overflow: 'hidden'
                                }}
                              >
                                {/* Encabezado del proceso */}
                                <div 
                                  style={{ 
                                    background: rolPersona === 'ACTOR' ? 'linear-gradient(135deg, #065f46 0%, #047857 100%)' :
                                               rolPersona === 'DEMANDADO' ? 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)' :
                                               'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
                                    padding: '14px 18px',
                                    borderBottom: '2px solid ' + (rolPersona === 'ACTOR' ? '#10b981' :
                                                                    rolPersona === 'DEMANDADO' ? '#dc2626' : '#dc2626')
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                    <div>
                                      <div style={{ color: '#ffffff', fontSize: '9px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px', opacity: 0.9 }}>
                                        PROCESO JUDICIAL
                                      </div>
                                      <div style={{ color: '#ffffff', fontSize: '18px', fontWeight: '900', letterSpacing: '0.5px' }}>
                                        Nro. {proceso.idJuicio || `${index + 1}`}
                                      </div>
                                    </div>
                                    <div style={{
                                      background: bgColorRol,
                                      color: colorRol,
                                      padding: '8px 12px',
                                      borderRadius: '4px',
                                      fontSize: '10px',
                                      fontWeight: '900',
                                      letterSpacing: '1px',
                                      textTransform: 'uppercase',
                                      border: `2px solid ${colorRol}`,
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}>
                                      {rolPersona}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Contenido del proceso */}
                                <div style={{ padding: '14px 18px' }}>
                                  {/* Delito/Materia destacado */}
                                  {proceso.nombreDelito && (
                                    <div style={{ 
                                      marginBottom: '14px',
                                      padding: '10px 14px',
                                      background: '#fef2f2',
                                      borderLeft: '3px solid #dc2626',
                                      borderRadius: '4px'
                                    }}>
                                      <div style={{ fontSize: '9px', fontWeight: '800', color: '#991b1b', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                        DELITO/MATERIA
                                      </div>
                                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#dc2626' }}>
                                        {proceso.nombreDelito}
                                      </div>
              </div>
            )}
                                  
                                  {/* Información principal */}
                                  <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                                    gap: '10px',
                                    marginBottom: '14px'
                                  }}>
                                    {fechaIngreso && fechaIngreso !== 'N/A' && (
                                      <div>
                                        <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
                                          FECHA INGRESO
                                        </div>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                          {fechaIngreso}
                                        </div>
              </div>
            )}
                                    {proceso.estadoActual && (
                                      <div>
                                        <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
                                          ESTADO
                                        </div>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                          {proceso.estadoActual === 'A' ? 'ACTIVO' : proceso.estadoActual}
                                        </div>
              </div>
            )}
                                    {proceso.nombreMateria && (
                                      <div>
                                        <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
                                          MATERIA
                                        </div>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                          {proceso.nombreMateria}
                                        </div>
              </div>
            )}
                                    {proceso.nombreJudicatura && (
                                      <div>
                                        <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
                                          JUDICATURA
                                        </div>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                          {proceso.nombreJudicatura}
                                        </div>
              </div>
            )}
                                  </div>
                                  
                                  {/* Información detallada del proceso (si está disponible) */}
                                  {proceso.detalle && Array.isArray(proceso.detalle) && proceso.detalle.length > 0 && (
                                    <div style={{ 
                                      marginTop: '14px', 
                                      paddingTop: '14px', 
                                      borderTop: '2px solid #e5e7eb'
                                    }}>
                                      {proceso.detalle.map((detalleItem, detalleIndex) => (
                                        <div key={detalleIndex} style={{ marginBottom: detalleIndex < proceso.detalle.length - 1 ? '16px' : '0' }}>
                                          {/* Información de la Judicatura */}
                                          {(detalleItem.nombreJudicatura || detalleItem.ciudad || detalleItem.idJudicatura) && (
                                            <div style={{ 
                                              marginBottom: '12px',
                                              padding: '10px 14px',
                                              background: '#f0f9ff',
                                              borderLeft: '3px solid #3b82f6',
                                              borderRadius: '4px'
                                            }}>
                                              <div style={{ fontSize: '9px', fontWeight: '800', color: '#1e40af', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                                                JUDICATURA
                                              </div>
                                              {detalleItem.nombreJudicatura && (
                                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e3a8a', marginBottom: '4px' }}>
                                                  {detalleItem.nombreJudicatura}
              </div>
            )}
                                              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '11px', color: '#1e40af', marginTop: '6px' }}>
                                                {detalleItem.ciudad && (
                                                  <div>
                                                    <span style={{ fontWeight: '700' }}>Ciudad:</span> {detalleItem.ciudad}
              </div>
            )}
                                                {detalleItem.idJudicatura && (
                                                  <div>
                                                    <span style={{ fontWeight: '700' }}>ID:</span> {detalleItem.idJudicatura}
              </div>
            )}
          </div>
                                            </div>
                                          )}
                                          
                                          {/* Incidentes de la Judicatura */}
                                          {detalleItem.lstIncidenteJudicatura && Array.isArray(detalleItem.lstIncidenteJudicatura) && detalleItem.lstIncidenteJudicatura.length > 0 && (
                                            <div style={{ marginTop: '12px' }}>
                                              <div style={{ 
                                                fontSize: '9px', 
                                                fontWeight: '800', 
                                                color: '#6b7280', 
                                                letterSpacing: '0.5px', 
                                                textTransform: 'uppercase', 
                                                marginBottom: '10px' 
                                              }}>
                                                INCIDENTES JUDICIALES
                                              </div>
                                              {detalleItem.lstIncidenteJudicatura.map((incidente, incidenteIndex) => (
                                                <div 
                                                  key={incidenteIndex}
                                                  style={{ 
                                                    marginBottom: '12px',
                                                    padding: '12px 14px',
                                                    background: '#f9fafb',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '4px'
                                                  }}
                                                >
                                                  {/* Información del incidente */}
                                                  <div style={{ 
                                                    display: 'grid', 
                                                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                                                    gap: '10px',
                                                    marginBottom: '12px'
                                                  }}>
                                                    {incidente.fechaCrea && (
              <div>
                                                        <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
                                                          FECHA CREACIÓN
                                                        </div>
                                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                          {new Date(incidente.fechaCrea).toLocaleDateString('es-EC', { 
                                                            day: '2-digit', 
                                                            month: '2-digit', 
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                          })}
                                                        </div>
                                                      </div>
                                                    )}
                                                    {incidente.incidente && (
                                                      <div>
                                                        <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
                                                          INCIDENTE
                                                        </div>
                                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                          {incidente.incidente}
                                                        </div>
                                                      </div>
                                                    )}
                                                    {incidente.idIncidenteJudicatura && (
                                                      <div>
                                                        <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
                                                          ID INCIDENTE
                                                        </div>
                                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                          {incidente.idIncidenteJudicatura}
                                                        </div>
                                                      </div>
                                                    )}
                                                    {incidente.idMovimientoJuicioIncidente && (
                                                      <div>
                                                        <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
                                                          ID MOVIMIENTO
                                                        </div>
                                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                          {incidente.idMovimientoJuicioIncidente}
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                  
                                                  {/* Litigantes Actor */}
                                                  {incidente.lstLitiganteActor && Array.isArray(incidente.lstLitiganteActor) && incidente.lstLitiganteActor.length > 0 && (
                                                    <div style={{ 
                                                      marginTop: '12px', 
                                                      paddingTop: '12px', 
                                                      borderTop: '1px solid #e5e7eb'
                                                    }}>
                                                      <div style={{ 
                                                        fontSize: '9px', 
                                                        fontWeight: '800', 
                                                        color: '#065f46', 
                                                        letterSpacing: '0.5px', 
                                                        textTransform: 'uppercase', 
                                                        marginBottom: '8px' 
                                                      }}>
                                                        ACTORES
                                                      </div>
                                                      {incidente.lstLitiganteActor.map((litigante, litIndex) => (
                                                        <div 
                                                          key={litIndex}
                                                          style={{ 
                                                            padding: '8px 10px',
                                                            background: '#ecfdf5',
                                                            borderLeft: '3px solid #10b981',
                                                            borderRadius: '4px',
                                                            marginBottom: '6px'
                                                          }}
                                                        >
                                                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#065f46', marginBottom: '4px' }}>
                                                            {litigante.nombresLitigante || 'N/A'}
                                                          </div>
                                                          {litigante.representadoPor && litigante.representadoPor !== litigante.nombresLitigante && (
                                                            <div style={{ fontSize: '10px', color: '#047857' }}>
                                                              Representado por: {litigante.representadoPor}
                                                            </div>
                                                          )}
                                                          {litigante.idLitigante && (
                                                            <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '4px' }}>
                                                              ID: {litigante.idLitigante}
                                                            </div>
                                                          )}
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                  
                                                  {/* Litigantes Demandado */}
                                                  {incidente.lstLitiganteDemandado && Array.isArray(incidente.lstLitiganteDemandado) && incidente.lstLitiganteDemandado.length > 0 && (
                                                    <div style={{ 
                                                      marginTop: '12px', 
                                                      paddingTop: '12px', 
                                                      borderTop: '1px solid #e5e7eb'
                                                    }}>
                                                      <div style={{ 
                                                        fontSize: '9px', 
                                                        fontWeight: '800', 
                                                        color: '#991b1b', 
                                                        letterSpacing: '0.5px', 
                                                        textTransform: 'uppercase', 
                                                        marginBottom: '8px' 
                                                      }}>
                                                        DEMANDADOS
                                                      </div>
                                                      {incidente.lstLitiganteDemandado.map((litigante, litIndex) => (
                                                        <div 
                                                          key={litIndex}
                                                          style={{ 
                                                            padding: '8px 10px',
                                                            background: '#fef2f2',
                                                            borderLeft: '3px solid #dc2626',
                                                            borderRadius: '4px',
                                                            marginBottom: '6px'
                                                          }}
                                                        >
                                                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#991b1b', marginBottom: '4px' }}>
                                                            {litigante.nombresLitigante || 'N/A'}
                                                          </div>
                                                          {litigante.representadoPor && litigante.representadoPor !== litigante.nombresLitigante && (
                                                            <div style={{ fontSize: '10px', color: '#dc2626' }}>
                                                              Representado por: {litigante.representadoPor}
                                                            </div>
                                                          )}
                                                          {litigante.idLitigante && (
                                                            <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '4px' }}>
                                                              ID: {litigante.idLitigante}
                                                            </div>
                                                          )}
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                  
                                                  {/* Actuaciones Judiciales para este incidente */}
                                                  {proceso.actuaciones && Array.isArray(proceso.actuaciones) && proceso.actuaciones.length > 0 && (
                                                    proceso.actuaciones
                                                      .filter(act => act.idIncidenteJudicatura === incidente.idIncidenteJudicatura)
                                                      .map((actuacionItem, actIndex) => (
                                                        actuacionItem.actuaciones && Array.isArray(actuacionItem.actuaciones) && actuacionItem.actuaciones.length > 0 ? (
                                                          <div key={actIndex} style={{ 
                                                            marginTop: '14px', 
                                                            paddingTop: '14px', 
                                                            borderTop: '2px solid #e5e7eb'
                                                          }}>
                                                            <div style={{ 
                                                              fontSize: '9px', 
                                                              fontWeight: '800', 
                                                              color: '#7c3aed', 
                                                              letterSpacing: '0.5px', 
                                                              textTransform: 'uppercase', 
                                                              marginBottom: '12px' 
                                                            }}>
                                                              ACTUACIONES JUDICIALES
                                                            </div>
                                                            {actuacionItem.actuaciones.map((actuacion, actuacionIndex) => {
                                                              const actuacionKey = `${proceso.idJuicio}-${incidente.idIncidenteJudicatura}-${actuacionIndex}`;
                                                              const isExpanded = actuacionesExpandidas.has(actuacionKey);
                                                              
                                                              const toggleActuacion = () => {
                                                                setActuacionesExpandidas(prev => {
                                                                  const nuevo = new Set(prev);
                                                                  if (nuevo.has(actuacionKey)) {
                                                                    nuevo.delete(actuacionKey);
                                                                  } else {
                                                                    nuevo.add(actuacionKey);
                                                                  }
                                                                  return nuevo;
                                                                });
                                                              };
                                                              
                                                              return (
                                                                <div 
                                                                  key={actuacionIndex}
                                                                  style={{ 
                                                                    marginBottom: '10px',
                                                                    background: '#faf5ff',
                                                                    borderLeft: '3px solid #8b5cf6',
                                                                    borderRadius: '4px',
                                                                    overflow: 'hidden'
                                                                  }}
                                                                >
                                                                  {/* Encabezado desplegable - siempre visible */}
                                                                  <div 
                                                                    onClick={toggleActuacion}
                                                                    style={{ 
                                                                      padding: '12px 14px',
                                                                      cursor: 'pointer',
                                                                      display: 'flex',
                                                                      justifyContent: 'space-between',
                                                                      alignItems: 'center',
                                                                      transition: 'background-color 0.2s',
                                                                      userSelect: 'none'
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3e8ff'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                  >
                                                                    <div style={{ flex: 1 }}>
                                                                      {/* Fecha */}
                                                                      {actuacion.fecha && (
                                                                        <div style={{ marginBottom: '6px' }}>
                                                                          <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '2px' }}>
                                                                            FECHA
                                                                          </div>
                                                                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                                            {new Date(actuacion.fecha).toLocaleDateString('es-EC', { 
                                                                              day: '2-digit', 
                                                                              month: '2-digit', 
                                                                              year: 'numeric',
                                                                              hour: '2-digit',
                                                                              minute: '2-digit'
                                                                            })}
                                                                          </div>
                                                                        </div>
                                                                      )}
                                                                      
                                                                      {/* Tipo de actuación */}
                                                                      {actuacion.tipo && (
                                                                        <div>
                                                                          <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '2px' }}>
                                                                            TIPO DE ACTUACIÓN
                                                                          </div>
                                                                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#7c3aed' }}>
                                                                            {actuacion.tipo}
                                                                          </div>
                                                                        </div>
                                                                      )}
                                                                    </div>
                                                                    
                                                                    {/* Icono de expandir/colapsar */}
                                                                    <div style={{ 
                                                                      marginLeft: '12px',
                                                                      fontSize: '18px',
                                                                      color: '#8b5cf6',
                                                                      transition: 'transform 0.3s',
                                                                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                                                                    }}>
                                                                      ▼
                                                                    </div>
                                                                  </div>
                                                                  
                                                                  {/* Contenido desplegable */}
                                                                  {isExpanded && (
                                                                    <div style={{ 
                                                                      padding: '12px 14px',
                                                                      borderTop: '1px solid #e5e7eb',
                                                                      background: '#ffffff'
                                                                    }}>
                                                                      {/* Actividad/Descripción */}
                                                                      {actuacion.actividad && (
                                                                        <div style={{ marginBottom: '12px' }}>
                                                                          <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                                                                            ACTIVIDAD
                                                                          </div>
                                                                          <div 
                                                                            style={{ 
                                                                              fontSize: '11px', 
                                                                              color: '#374151', 
                                                                              lineHeight: '1.6',
                                                                              maxHeight: '400px',
                                                                              overflow: 'auto',
                                                                              padding: '10px',
                                                                              background: '#f9fafb',
                                                                              borderRadius: '4px',
                                                                              border: '1px solid #e5e7eb'
                                                                            }}
                                                                            dangerouslySetInnerHTML={{ __html: actuacion.actividad }}
                                                                          />
                                                                        </div>
                                                                      )}
                                                                      
                                                                      {/* Información detallada en grid */}
                                                                      <div style={{ 
                                                                        display: 'grid', 
                                                                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                                                                        gap: '10px',
                                                                        marginTop: '12px',
                                                                        paddingTop: '12px',
                                                                        borderTop: '1px solid #e5e7eb'
                                                                      }}>
                                                                        {actuacion.codigo && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              CÓDIGO
                                                                            </div>
                                                                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                                              {actuacion.codigo}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.idJuicio && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              ID JUICIO
                                                                            </div>
                                                                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                                              {actuacion.idJuicio.trim()}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.idJudicatura && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              ID JUDICATURA
                                                                            </div>
                                                                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                                              {actuacion.idJudicatura}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.idMovimientoJuicioIncidente && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              ID MOVIMIENTO
                                                                            </div>
                                                                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                                              {actuacion.idMovimientoJuicioIncidente}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.nombreArchivo && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              ARCHIVO
                                                                            </div>
                                                                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#111827', wordBreak: 'break-word' }}>
                                                                              {actuacion.nombreArchivo}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.visible && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              VISIBLE
                                                                            </div>
                                                                            <div style={{ fontSize: '12px', fontWeight: '700', color: actuacion.visible === 'A' ? '#10b981' : actuacion.visible === 'H' ? '#f59e0b' : '#6b7280' }}>
                                                                              {actuacion.visible === 'A' ? 'ACTIVO' : actuacion.visible === 'H' ? 'OCULTO' : actuacion.visible}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.origen && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              ORIGEN
                                                                            </div>
                                                                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                                              {actuacion.origen}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.ieDocumentoAdjunto && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              DOCUMENTO ADJUNTO
                                                                            </div>
                                                                            <div style={{ fontSize: '12px', fontWeight: '700', color: actuacion.ieDocumentoAdjunto === 'S' ? '#10b981' : '#6b7280' }}>
                                                                              {actuacion.ieDocumentoAdjunto === 'S' ? 'SÍ' : 'NO'}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.tipoIngreso && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              TIPO INGRESO
                                                                            </div>
                                                                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                                              {actuacion.tipoIngreso}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.uuid && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              UUID
                                                                            </div>
                                                                            <div style={{ fontSize: '10px', fontWeight: '600', color: '#111827', wordBreak: 'break-all' }}>
                                                                              {actuacion.uuid}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.alias && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              ALIAS
                                                                            </div>
                                                                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                                              {actuacion.alias}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.cargo && actuacion.cargo.trim() !== '' && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              CARGO
                                                                            </div>
                                                                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                                              {actuacion.cargo}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.nombreUsuarioModifica && actuacion.nombreUsuarioModifica.trim() !== '' && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              USUARIO MODIFICA
                                                                            </div>
                                                                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                                              {actuacion.nombreUsuarioModifica}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.descripcionMotivoVisible && actuacion.descripcionMotivoVisible.trim() !== '' && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              MOTIVO VISIBLE
                                                                            </div>
                                                                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#111827' }}>
                                                                              {actuacion.descripcionMotivoVisible}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.idTablaReferencia && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              ID TABLA REFERENCIA
                                                                            </div>
                                                                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                                              {actuacion.idTablaReferencia}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.ieTablaReferencia && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              TABLA REFERENCIA
                                                                            </div>
                                                                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                                              {actuacion.ieTablaReferencia}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                      </div>
                                                                    </div>
                                                                  )}
                                                                </div>
                                                              );
                                                            })}
                                                          </div>
                                                        ) : null
                                                      ))
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Información adicional */}
                                  {(proceso.nombreProvincia || proceso.nombreEstadoJuicio || proceso.nombreTipoAccion) && (
                                    <div style={{ 
                                      marginTop: '14px', 
                                      paddingTop: '14px', 
                                      borderTop: '1px solid #e5e7eb',
                                      display: 'flex',
                                      gap: '16px',
                                      flexWrap: 'wrap',
                                      fontSize: '10px',
                                      color: '#6b7280'
                                    }}>
                                      {proceso.nombreProvincia && (
                                        <div>
                                          <span style={{ fontWeight: '700' }}>Provincia:</span> {proceso.nombreProvincia}
                                        </div>
                                      )}
                                      {proceso.nombreEstadoJuicio && (
                                        <div>
                                          <span style={{ fontWeight: '700' }}>Estado:</span> {proceso.nombreEstadoJuicio}
                                        </div>
                                      )}
                                      {proceso.nombreTipoAccion && (
                                        <div>
                                          <span style={{ fontWeight: '700' }}>Tipo Acción:</span> {proceso.nombreTipoAccion}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
              </div>
            </div>
            )}

            {/* Sección 8: Procesos Judiciales como Denunciante/Afectado */}
            {(procesosDenunciante || procesosDenuncianteCargando || procesosDenuncianteError) && (
              <div className="cc-exp-section">
                <div 
                  className="cc-exp-section-header"
                  onClick={() => toggleSeccion('08')}
                >
                  <span className="cc-exp-section-number">08</span>
                  <h3 className="cc-exp-section-title">PROCESOS JUDICIALES COMO DENUNCIANTE/AFECTADO</h3>
                  <span className={`cc-exp-section-toggle ${seccionesExpandidas.has('08') ? 'expanded' : ''}`}>
                    ▼
                  </span>
                </div>
                <div className={`cc-exp-section-content ${seccionesExpandidas.has('08') ? '' : 'collapsed'}`}>
                  {procesosDenuncianteCargando && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                      <div style={{ marginBottom: '8px' }}>Consultando procesos como denunciante/afectado...</div>
                      <div style={{ fontSize: '12px' }}>Buscando información en el sistema judicial</div>
                    </div>
                  )}
                  {procesosDenuncianteError && (
                    <div className="cc-exp-data-item full-width" style={{ background: '#fef2f2', borderLeftColor: '#ef4444' }}>
                      <div className="cc-exp-data-label" style={{ color: '#dc2626' }}>ERROR AL CONSULTAR</div>
                      <div className="cc-exp-data-value" style={{ color: '#991b1b' }}>{procesosDenuncianteError}</div>
                    </div>
                  )}
                  {procesosDenunciante && !procesosDenuncianteCargando && (
                    <>
                      {procesosDenunciante.mensaje && (
                        <div className="cc-exp-data-item full-width" style={{ marginBottom: '16px' }}>
                          <div className="cc-exp-data-label">INFORMACIÓN</div>
                          <div className="cc-exp-data-value">{procesosDenunciante.mensaje}</div>
                        </div>
                      )}
                      {procesosDenunciante.procesos && procesosDenunciante.procesos.length > 0 && (
                        <div style={{ width: '100%' }}>
                          {procesosDenunciante.procesos.map((proceso, index) => {
                            const rolPersona = proceso.rol || 'DENUNCIANTE/AFECTADO';
                            let colorRol = '#1e40af';
                            let bgColorRol = '#dbeafe';
                            
                            // Formatear fecha
                            const fechaIngreso = proceso.fechaIngreso 
                              ? new Date(proceso.fechaIngreso).toLocaleDateString('es-EC', { 
                                  day: '2-digit', 
                                  month: '2-digit', 
                                  year: 'numeric' 
                                })
                              : 'N/A';
                            
                            return (
                              <div 
                                key={index} 
                                className="cc-denuncia-container"
                                style={{ 
                                  marginBottom: '32px',
                                  border: '2px solid #e5e7eb',
                                  borderRadius: '8px',
                                  background: '#ffffff',
                                  overflow: 'hidden'
                                }}
                              >
                                {/* Encabezado del proceso */}
                                <div 
                                  style={{ 
                                    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                                    padding: '14px 18px',
                                    borderBottom: '2px solid #3b82f6'
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                    <div>
                                      <div style={{ color: '#ffffff', fontSize: '9px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px', opacity: 0.9 }}>
                                        PROCESO JUDICIAL
                                      </div>
                                      <div style={{ color: '#ffffff', fontSize: '18px', fontWeight: '900', letterSpacing: '0.5px' }}>
                                        Nro. {proceso.idJuicio || `${index + 1}`}
                                      </div>
                                    </div>
                                    <div style={{
                                      background: bgColorRol,
                                      color: colorRol,
                                      padding: '8px 12px',
                                      borderRadius: '4px',
                                      fontSize: '10px',
                                      fontWeight: '900',
                                      letterSpacing: '1px',
                                      textTransform: 'uppercase',
                                      border: `2px solid ${colorRol}`,
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}>
                                      {rolPersona}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Contenido del proceso - Reutilizar el mismo formato que la sección 7 */}
                                <div style={{ padding: '14px 18px' }}>
                                  {/* Delito/Materia destacado */}
                                  {proceso.nombreDelito && (
                                    <div style={{ 
                                      marginBottom: '14px',
                                      padding: '10px 14px',
                                      background: '#fef2f2',
                                      borderLeft: '3px solid #dc2626',
                                      borderRadius: '4px'
                                    }}>
                                      <div style={{ fontSize: '9px', fontWeight: '800', color: '#991b1b', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                        DELITO/MATERIA
                                      </div>
                                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#dc2626' }}>
                                        {proceso.nombreDelito}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Información principal */}
                                  <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                                    gap: '10px',
                                    marginBottom: '14px'
                                  }}>
                                    {fechaIngreso && fechaIngreso !== 'N/A' && (
                                      <div>
                                        <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
                                          FECHA INGRESO
                                        </div>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                          {fechaIngreso}
                                        </div>
                                      </div>
                                    )}
                                    {proceso.estadoActual && (
                                      <div>
                                        <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
                                          ESTADO
                                        </div>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                          {proceso.estadoActual === 'A' ? 'ACTIVO' : proceso.estadoActual}
                                        </div>
                                      </div>
                                    )}
                                    {proceso.nombreMateria && (
                                      <div>
                                        <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
                                          MATERIA
                                        </div>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                          {proceso.nombreMateria}
                                        </div>
                                      </div>
                                    )}
                                    {proceso.nombreJudicatura && (
                                      <div>
                                        <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
                                          JUDICATURA
                                        </div>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                          {proceso.nombreJudicatura}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Información detallada del proceso (si está disponible) - Reutilizar el mismo código de la sección 7 */}
                                  {proceso.detalle && Array.isArray(proceso.detalle) && proceso.detalle.length > 0 && (
                                    <div style={{ 
                                      marginTop: '14px', 
                                      paddingTop: '14px', 
                                      borderTop: '2px solid #e5e7eb'
                                    }}>
                                      {proceso.detalle.map((detalleItem, detalleIndex) => (
                                        <div key={detalleIndex} style={{ marginBottom: detalleIndex < proceso.detalle.length - 1 ? '16px' : '0' }}>
                                          {/* Información de la Judicatura */}
                                          {(detalleItem.nombreJudicatura || detalleItem.ciudad || detalleItem.idJudicatura) && (
                                            <div style={{ 
                                              marginBottom: '12px',
                                              padding: '10px 14px',
                                              background: '#f0f9ff',
                                              borderLeft: '3px solid #3b82f6',
                                              borderRadius: '4px'
                                            }}>
                                              <div style={{ fontSize: '9px', fontWeight: '800', color: '#1e40af', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                                                JUDICATURA
                                              </div>
                                              {detalleItem.nombreJudicatura && (
                                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e3a8a', marginBottom: '4px' }}>
                                                  {detalleItem.nombreJudicatura}
                                                </div>
                                              )}
                                              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '11px', color: '#1e40af', marginTop: '6px' }}>
                                                {detalleItem.ciudad && (
                                                  <div>
                                                    <span style={{ fontWeight: '700' }}>Ciudad:</span> {detalleItem.ciudad}
                                                  </div>
                                                )}
                                                {detalleItem.idJudicatura && (
                                                  <div>
                                                    <span style={{ fontWeight: '700' }}>ID:</span> {detalleItem.idJudicatura}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* Incidentes y actuaciones - Reutilizar el mismo código de la sección 7 */}
                                          {detalleItem.lstIncidenteJudicatura && Array.isArray(detalleItem.lstIncidenteJudicatura) && detalleItem.lstIncidenteJudicatura.length > 0 && (
                                            <div style={{ marginTop: '12px' }}>
                                              <div style={{ 
                                                fontSize: '9px', 
                                                fontWeight: '800', 
                                                color: '#6b7280', 
                                                letterSpacing: '0.5px', 
                                                textTransform: 'uppercase', 
                                                marginBottom: '10px' 
                                              }}>
                                                INCIDENTES JUDICIALES
                                              </div>
                                              {detalleItem.lstIncidenteJudicatura.map((incidente, incidenteIndex) => (
                                                <div 
                                                  key={incidenteIndex}
                                                  style={{ 
                                                    marginBottom: '12px',
                                                    padding: '12px 14px',
                                                    background: '#f9fafb',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '4px'
                                                  }}
                                                >
                                                  {/* Información del incidente */}
                                                  <div style={{ 
                                                    display: 'grid', 
                                                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                                                    gap: '10px',
                                                    marginBottom: '12px'
                                                  }}>
                                                    {incidente.fechaCrea && (
                                                      <div>
                                                        <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
                                                          FECHA CREACIÓN
                                                        </div>
                                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                          {new Date(incidente.fechaCrea).toLocaleDateString('es-EC', { 
                                                            day: '2-digit', 
                                                            month: '2-digit', 
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                          })}
                                                        </div>
                                                      </div>
                                                    )}
                                                    {incidente.incidente && (
                                                      <div>
                                                        <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
                                                          INCIDENTE
                                                        </div>
                                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                          {incidente.incidente}
                                                        </div>
                                                      </div>
                                                    )}
                                                    {incidente.idIncidenteJudicatura && (
                                                      <div>
                                                        <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
                                                          ID INCIDENTE
                                                        </div>
                                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                          {incidente.idIncidenteJudicatura}
                                                        </div>
                                                      </div>
                                                    )}
                                                    {incidente.idMovimientoJuicioIncidente && (
                                                      <div>
                                                        <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '3px' }}>
                                                          ID MOVIMIENTO
                                                        </div>
                                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                          {incidente.idMovimientoJuicioIncidente}
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                  
                                                  {/* Litigantes Actor */}
                                                  {incidente.lstLitiganteActor && Array.isArray(incidente.lstLitiganteActor) && incidente.lstLitiganteActor.length > 0 && (
                                                    <div style={{ 
                                                      marginTop: '12px', 
                                                      paddingTop: '12px', 
                                                      borderTop: '1px solid #e5e7eb'
                                                    }}>
                                                      <div style={{ 
                                                        fontSize: '9px', 
                                                        fontWeight: '800', 
                                                        color: '#065f46', 
                                                        letterSpacing: '0.5px', 
                                                        textTransform: 'uppercase', 
                                                        marginBottom: '8px' 
                                                      }}>
                                                        ACTORES
                                                      </div>
                                                      {incidente.lstLitiganteActor.map((litigante, litIndex) => (
                                                        <div 
                                                          key={litIndex}
                                                          style={{ 
                                                            padding: '8px 10px',
                                                            background: '#ecfdf5',
                                                            borderLeft: '3px solid #10b981',
                                                            borderRadius: '4px',
                                                            marginBottom: '6px'
                                                          }}
                                                        >
                                                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#065f46', marginBottom: '4px' }}>
                                                            {litigante.nombresLitigante || 'N/A'}
                                                          </div>
                                                          {litigante.representadoPor && litigante.representadoPor !== litigante.nombresLitigante && (
                                                            <div style={{ fontSize: '10px', color: '#047857' }}>
                                                              Representado por: {litigante.representadoPor}
                                                            </div>
                                                          )}
                                                          {litigante.idLitigante && (
                                                            <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '4px' }}>
                                                              ID: {litigante.idLitigante}
                                                            </div>
                                                          )}
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                  
                                                  {/* Litigantes Demandado */}
                                                  {incidente.lstLitiganteDemandado && Array.isArray(incidente.lstLitiganteDemandado) && incidente.lstLitiganteDemandado.length > 0 && (
                                                    <div style={{ 
                                                      marginTop: '12px', 
                                                      paddingTop: '12px', 
                                                      borderTop: '1px solid #e5e7eb'
                                                    }}>
                                                      <div style={{ 
                                                        fontSize: '9px', 
                                                        fontWeight: '800', 
                                                        color: '#991b1b', 
                                                        letterSpacing: '0.5px', 
                                                        textTransform: 'uppercase', 
                                                        marginBottom: '8px' 
                                                      }}>
                                                        DEMANDADOS
                                                      </div>
                                                      {incidente.lstLitiganteDemandado.map((litigante, litIndex) => (
                                                        <div 
                                                          key={litIndex}
                                                          style={{ 
                                                            padding: '8px 10px',
                                                            background: '#fef2f2',
                                                            borderLeft: '3px solid #dc2626',
                                                            borderRadius: '4px',
                                                            marginBottom: '6px'
                                                          }}
                                                        >
                                                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#991b1b', marginBottom: '4px' }}>
                                                            {litigante.nombresLitigante || 'N/A'}
                                                          </div>
                                                          {litigante.representadoPor && litigante.representadoPor !== litigante.nombresLitigante && (
                                                            <div style={{ fontSize: '10px', color: '#dc2626' }}>
                                                              Representado por: {litigante.representadoPor}
                                                            </div>
                                                          )}
                                                          {litigante.idLitigante && (
                                                            <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '4px' }}>
                                                              ID: {litigante.idLitigante}
                                                            </div>
                                                          )}
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                  
                                                  {/* Actuaciones Judiciales para este incidente */}
                                                  {proceso.actuaciones && Array.isArray(proceso.actuaciones) && proceso.actuaciones.length > 0 && (
                                                    proceso.actuaciones
                                                      .filter(act => act.idIncidenteJudicatura === incidente.idIncidenteJudicatura)
                                                      .map((actuacionItem, actIndex) => (
                                                        actuacionItem.actuaciones && Array.isArray(actuacionItem.actuaciones) && actuacionItem.actuaciones.length > 0 ? (
                                                          <div key={actIndex} style={{ 
                                                            marginTop: '14px', 
                                                            paddingTop: '14px', 
                                                            borderTop: '2px solid #e5e7eb'
                                                          }}>
                                                            <div style={{ 
                                                              fontSize: '9px', 
                                                              fontWeight: '800', 
                                                              color: '#7c3aed', 
                                                              letterSpacing: '0.5px', 
                                                              textTransform: 'uppercase', 
                                                              marginBottom: '12px' 
                                                            }}>
                                                              ACTUACIONES JUDICIALES
                                                            </div>
                                                            {actuacionItem.actuaciones.map((actuacion, actuacionIndex) => {
                                                              const actuacionKey = `${proceso.idJuicio}-${incidente.idIncidenteJudicatura}-${actuacionIndex}`;
                                                              const isExpanded = actuacionesExpandidas.has(actuacionKey);
                                                              
                                                              const toggleActuacion = () => {
                                                                setActuacionesExpandidas(prev => {
                                                                  const nuevo = new Set(prev);
                                                                  if (nuevo.has(actuacionKey)) {
                                                                    nuevo.delete(actuacionKey);
                                                                  } else {
                                                                    nuevo.add(actuacionKey);
                                                                  }
                                                                  return nuevo;
                                                                });
                                                              };
                                                              
                                                              return (
                                                                <div 
                                                                  key={actuacionIndex}
                                                                  style={{ 
                                                                    marginBottom: '10px',
                                                                    background: '#faf5ff',
                                                                    borderLeft: '3px solid #8b5cf6',
                                                                    borderRadius: '4px',
                                                                    overflow: 'hidden'
                                                                  }}
                                                                >
                                                                  {/* Encabezado desplegable */}
                                                                  <div 
                                                                    onClick={toggleActuacion}
                                                                    style={{ 
                                                                      padding: '12px 14px',
                                                                      cursor: 'pointer',
                                                                      display: 'flex',
                                                                      justifyContent: 'space-between',
                                                                      alignItems: 'center',
                                                                      transition: 'background-color 0.2s',
                                                                      userSelect: 'none'
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3e8ff'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                                  >
                                                                    <div style={{ flex: 1 }}>
                                                                      {actuacion.fecha && (
                                                                        <div style={{ marginBottom: '6px' }}>
                                                                          <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '2px' }}>
                                                                            FECHA
                                                                          </div>
                                                                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                                            {new Date(actuacion.fecha).toLocaleDateString('es-EC', { 
                                                                              day: '2-digit', 
                                                                              month: '2-digit', 
                                                                              year: 'numeric',
                                                                              hour: '2-digit',
                                                                              minute: '2-digit'
                                                                            })}
                                                                          </div>
                                                                        </div>
                                                                      )}
                                                                      {actuacion.tipo && (
                                                                        <div>
                                                                          <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '2px' }}>
                                                                            TIPO DE ACTUACIÓN
                                                                          </div>
                                                                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#7c3aed' }}>
                                                                            {actuacion.tipo}
                                                                          </div>
                                                                        </div>
                                                                      )}
                                                                    </div>
                                                                    <div style={{ 
                                                                      marginLeft: '12px',
                                                                      fontSize: '18px',
                                                                      color: '#8b5cf6',
                                                                      transition: 'transform 0.3s',
                                                                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                                                                    }}>
                                                                      ▼
                                                                    </div>
                                                                  </div>
                                                                  
                                                                  {/* Contenido desplegable */}
                                                                  {isExpanded && (
                                                                    <div style={{ 
                                                                      padding: '12px 14px',
                                                                      borderTop: '1px solid #e5e7eb',
                                                                      background: '#ffffff'
                                                                    }}>
                                                                      {actuacion.actividad && (
                                                                        <div style={{ marginBottom: '12px' }}>
                                                                          <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                                                                            ACTIVIDAD
                                                                          </div>
                                                                          <div 
                                                                            style={{ 
                                                                              fontSize: '11px', 
                                                                              color: '#374151', 
                                                                              lineHeight: '1.6',
                                                                              maxHeight: '400px',
                                                                              overflow: 'auto',
                                                                              padding: '10px',
                                                                              background: '#f9fafb',
                                                                              borderRadius: '4px',
                                                                              border: '1px solid #e5e7eb'
                                                                            }}
                                                                            dangerouslySetInnerHTML={{ __html: actuacion.actividad }}
                                                                          />
                                                                        </div>
                                                                      )}
                                                                      
                                                                      {/* Información detallada en grid */}
                                                                      <div style={{ 
                                                                        display: 'grid', 
                                                                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                                                                        gap: '10px',
                                                                        marginTop: '12px',
                                                                        paddingTop: '12px',
                                                                        borderTop: '1px solid #e5e7eb'
                                                                      }}>
                                                                        {actuacion.codigo && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              CÓDIGO
                                                                            </div>
                                                                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                                              {actuacion.codigo}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.idJuicio && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              ID JUICIO
                                                                            </div>
                                                                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                                              {actuacion.idJuicio.trim()}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.idJudicatura && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              ID JUDICATURA
                                                                            </div>
                                                                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                                              {actuacion.idJudicatura}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.idMovimientoJuicioIncidente && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              ID MOVIMIENTO
                                                                            </div>
                                                                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                                              {actuacion.idMovimientoJuicioIncidente}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.nombreArchivo && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              ARCHIVO
                                                                            </div>
                                                                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#111827', wordBreak: 'break-word' }}>
                                                                              {actuacion.nombreArchivo}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.visible && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              VISIBLE
                                                                            </div>
                                                                            <div style={{ fontSize: '12px', fontWeight: '700', color: actuacion.visible === 'A' ? '#10b981' : actuacion.visible === 'H' ? '#f59e0b' : '#6b7280' }}>
                                                                              {actuacion.visible === 'A' ? 'ACTIVO' : actuacion.visible === 'H' ? 'OCULTO' : actuacion.visible}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.origen && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              ORIGEN
                                                                            </div>
                                                                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                                              {actuacion.origen}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.ieDocumentoAdjunto && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              DOCUMENTO ADJUNTO
                                                                            </div>
                                                                            <div style={{ fontSize: '12px', fontWeight: '700', color: actuacion.ieDocumentoAdjunto === 'S' ? '#10b981' : '#6b7280' }}>
                                                                              {actuacion.ieDocumentoAdjunto === 'S' ? 'SÍ' : 'NO'}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.tipoIngreso && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              TIPO INGRESO
                                                                            </div>
                                                                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                                              {actuacion.tipoIngreso}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.uuid && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              UUID
                                                                            </div>
                                                                            <div style={{ fontSize: '10px', fontWeight: '600', color: '#111827', wordBreak: 'break-all' }}>
                                                                              {actuacion.uuid}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.alias && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              ALIAS
                                                                            </div>
                                                                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                                              {actuacion.alias}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.cargo && actuacion.cargo.trim() !== '' && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              CARGO
                                                                            </div>
                                                                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                                              {actuacion.cargo}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.nombreUsuarioModifica && actuacion.nombreUsuarioModifica.trim() !== '' && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              USUARIO MODIFICA
                                                                            </div>
                                                                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                                              {actuacion.nombreUsuarioModifica}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.descripcionMotivoVisible && actuacion.descripcionMotivoVisible.trim() !== '' && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              MOTIVO VISIBLE
                                                                            </div>
                                                                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#111827' }}>
                                                                              {actuacion.descripcionMotivoVisible}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.idTablaReferencia && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              ID TABLA REFERENCIA
                                                                            </div>
                                                                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                                              {actuacion.idTablaReferencia}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                        {actuacion.ieTablaReferencia && (
                                                                          <div style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                                                                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                                              TABLA REFERENCIA
                                                                            </div>
                                                                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#111827' }}>
                                                                              {actuacion.ieTablaReferencia}
                                                                            </div>
                                                                          </div>
                                                                        )}
                                                                      </div>
                                                                    </div>
                                                                  )}
                                                                </div>
                                                              );
                                                            })}
                                                          </div>
                                                        ) : null
                                                      ))
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Información adicional */}
                                  {(proceso.nombreProvincia || proceso.nombreEstadoJuicio || proceso.nombreTipoAccion) && (
                                    <div style={{ 
                                      marginTop: '14px', 
                                      paddingTop: '14px', 
                                      borderTop: '1px solid #e5e7eb',
                                      display: 'flex',
                                      gap: '16px',
                                      flexWrap: 'wrap',
                                      fontSize: '10px',
                                      color: '#6b7280'
                                    }}>
                                      {proceso.nombreProvincia && (
                                        <div>
                                          <span style={{ fontWeight: '700' }}>Provincia:</span> {proceso.nombreProvincia}
                                        </div>
                                      )}
                                      {proceso.nombreEstadoJuicio && (
                                        <div>
                                          <span style={{ fontWeight: '700' }}>Estado:</span> {proceso.nombreEstadoJuicio}
                                        </div>
                                      )}
                                      {proceso.nombreTipoAccion && (
                                        <div>
                                          <span style={{ fontWeight: '700' }}>Tipo Acción:</span> {proceso.nombreTipoAccion}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Footer del expediente */}
            <div className="cc-exp-footer">
              <div className="cc-exp-footer-line"></div>
              <div className="cc-exp-footer-text">
                EXPEDIENTE GENERADO EL {new Date().toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
        </div>
            </div>
          </div>
        );
      })()}

      {edadError && (
        <div className="cc-empty">{edadError}</div>
      )}
    </div>
  );
}





