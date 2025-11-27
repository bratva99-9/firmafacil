import React, { useState, useRef, useEffect } from 'react';

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

  const consultar = async (e) => {
    e.preventDefault();
    setError('');
    setDatos(null);
    setEdadInfo(null);
    setEdadError('');
    
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
      setDatos(resultado);

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
    } catch (e) {
      setError(e.message || 'Error al consultar la cédula');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ padding: 8 }}>
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
        .cc-expediente { border: 1px solid #e5e7eb; border-radius: 14px; padding: 16px; background: #fff; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08); margin-top: 12px; }
        .cc-expediente-header { display: flex; gap: 16px; flex-wrap: wrap; }
        .cc-photo-wrapper { flex: 1 1 240px; min-width: 220px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 12px; padding: 8px; display: flex; align-items: center; justify-content: center; }
        .cc-photo-wrapper .cc-photo-section { width: 100%; margin-top: 0; }
        .cc-photo-placeholder { text-align: center; font-size: 12px; color: #9ca3af; padding: 24px; }
        .cc-summary { flex: 2 1 320px; display: flex; flex-direction: column; gap: 12px; }
        .cc-summary-label { font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color: #64748b; margin: 0; }
        .cc-summary-name { margin: 0; font-size: 22px; font-weight: 800; color: #0f172a; }
        .cc-summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
        .cc-summary-item { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; background: #f9fafb; }
        .cc-summary-item .label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
        .cc-summary-item .value { font-size: 14px; font-weight: 700; color: #111827; }
        .cc-expediente-body { margin-top: 16px; display: flex; flex-direction: column; gap: 16px; }
        @media (max-width: 640px) {
          .cc-expediente-header { flex-direction: column; }
        }
      `}</style>

      <h3 className="cc-title">Consultar Cédula</h3>

      {tokenStatus && (
        <div className="cc-success">{tokenStatus}</div>
      )}
      {tokenError && (
        <div className="cc-empty">{tokenError}</div>
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
      
      {datos && (() => {
        const edadDetallada = obtenerEdadExtendida();
        const nombrePrincipal =
          datos.nombre ||
          `${datos.nombres || ''} ${datos.apellidos || ''}`.trim() ||
          'Sin registro';

        const resumenItems = [
          { label: 'Cédula', value: datos.cedula },
          { label: 'Edad verificada', value: edadDetallada ? `${edadDetallada} años` : null },
          { label: 'Estado', value: datos.estado },
          { label: 'Expedición', value: datos.fechaCedulacion }
        ];

        const datosPersonales = [
          { label: 'Nombres', value: datos.nombres },
          { label: 'Apellidos', value: datos.apellidos },
          { label: 'Nombre completo', value: datos.nombre },
          { label: 'Fecha de nacimiento', value: datos.fechaNacimiento },
          { label: 'Género', value: datos.genero },
          { label: 'Estado civil', value: datos.estadoCivil },
          { label: 'Edad (registro)', value: datos.edad ? `${datos.edad} años` : null }
        ];

        const datosUbicacion = [
          { label: 'Nacionalidad', value: datos.nacionalidad },
          { label: 'Provincia', value: datos.provincia },
          { label: 'Ciudad', value: datos.ciudad },
          { label: 'Parroquia', value: datos.parroquia },
          { label: 'Dirección', value: datos.direccion },
          { label: 'Lugar de nacimiento', value: datos.lugarNacimiento }
        ];

        const camposAdicionales = Object.entries(datos).filter(([key, value]) => {
          const camposExcluidos = [
            'nombres', 'apellidos', 'nombre', 'cedula', 'fechaNacimiento', 'edad', 'genero',
            'estadoCivil', 'nacionalidad', 'provincia', 'ciudad', 'parroquia', 'direccion',
            'estado', 'lugarNacimiento', 'fechaCedulacion', 'nombreMadre', 'nombrePadre',
            'instruccion', 'profesion', 'conyuge',
            'foto', 'fotoBase64', 'foto_base64', 'imagen', 'imagenBase64', 'fotoCedula'
          ];
          if (camposExcluidos.includes(key)) return false;
          if (!value || typeof value === 'object') return false;
          return String(value).trim().length > 0;
        });

        return (
          <div className="cc-expediente">
            <div className="cc-expediente-header">
              <div className="cc-photo-wrapper">
                {renderFotoCedula()}
              </div>
              <div className="cc-summary">
                <p className="cc-summary-label">Expediente de identidad</p>
                <h3 className="cc-summary-name">{nombrePrincipal}</h3>
                <div className="cc-summary-grid">
                  {resumenItems.filter(item => item.value).map(item => (
                    <div className="cc-summary-item" key={item.label}>
                      <span className="label">{item.label}</span>
                      <span className="value">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="cc-expediente-body">
              <div className="cc-section">
                <h4>Datos personales</h4>
                <div className="cc-grid">
                  {datosPersonales.filter(item => item.value).map(item => (
                    <div className="cc-card" key={item.label}>
                      <p className="cc-label">{item.label}</p>
                      <p className="cc-value">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="cc-section">
                <h4>Ubicación y contacto</h4>
                <div className="cc-grid">
                  {datosUbicacion.filter(item => item.value).map(item => (
                    <div className="cc-card" key={item.label}>
                      <p className="cc-label">{item.label}</p>
                      <p className="cc-value">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {camposAdicionales.length > 0 && (
                <div className="cc-section">
                  <h4>Información adicional</h4>
                  <div>
                    {camposAdicionales.map(([key, value]) => (
                      <span key={key} className="cc-badge ok">
                        {key}: {String(value).trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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





