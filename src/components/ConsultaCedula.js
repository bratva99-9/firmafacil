import React, { useState, useRef } from 'react';

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

  const consultar = async (e) => {
    e.preventDefault();
    setError('');
    setDatos(null);
    
    const ced = cedula.trim();
    const tok = token.trim();
    
    if (!/^\d{10}$/.test(ced)) {
      setError('Ingresa una cédula válida (10 dígitos)');
      return;
    }
    
    if (!tok) {
      setError('Ingresa el token (x-token)');
      return;
    }
    
    // Verificar token antes de hacer la petición
    const validacionToken = verificarToken(tok);
    if (!validacionToken.valido) {
      setError(`⚠️ ${validacionToken.mensaje}`);
      setInfoToken(null);
      return;
    }
    
    // Mostrar información del token si es válido
    if (validacionToken.payload) {
      const exp = validacionToken.payload.exp;
      const ahora = Math.floor(Date.now() / 1000);
      const tiempoRestante = exp - ahora;
      const horasRestantes = Math.floor(tiempoRestante / 3600);
      const minutosRestantes = Math.floor((tiempoRestante % 3600) / 60);
      
      setInfoToken({
        nombre: validacionToken.payload.nombre || 'N/A',
        id: validacionToken.payload.id || 'N/A',
        nivel: validacionToken.payload.nivel || 'N/A',
        expiraEn: tiempoRestante > 0 
          ? `${horasRestantes}h ${minutosRestantes}m` 
          : 'Expirado',
        fechaExpiracion: exp ? new Date(exp * 1000).toLocaleString() : 'N/A'
      });
    }
    
    setCargando(true);
    try {
      const url = "https://apifirmas.firmasecuador.com/api/usuarios/consultarCedula";
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-token': tok
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
      `}</style>

      <h3 className="cc-title">Consultar Cédula</h3>
      <form className="cc-form" onSubmit={consultar}>
        <div className="cc-input-group">
          <label className="cc-input-label">Token (x-token)</label>
          <input 
            className="cc-input" 
            type="text"
            value={token} 
            onChange={(e) => setToken(e.target.value)} 
            placeholder="Ingresa el token de autenticación"
          />
        </div>
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
          <button className="cc-btn" type="submit" disabled={cargando} style={{ alignSelf: 'flex-end' }}>
            {cargando ? 'Consultando…' : 'Consultar'}
          </button>
        </div>
      </form>

      {infoToken && (
        <div className="cc-info-token">
          <strong>ℹ️ Información del Token:</strong>
          <span>ID: {infoToken.id}</span>
          <span>Nombre: {infoToken.nombre}</span>
          <span>Nivel: {infoToken.nivel}</span>
          <span>Expira en: {infoToken.expiraEn}</span>
          <span>Fecha expiración: {infoToken.fechaExpiracion}</span>
        </div>
      )}
      
      {error && <div className="cc-empty">{error}</div>}
      
      {datos && (
        <div className="cc-result">
          <div className="cc-success">✅ Datos encontrados</div>
          
          {/* Mostrar foto si está disponible en base64 */}
          {(() => {
            // Buscar campo de foto en diferentes posibles nombres
            const fotoField = datos.fotoBase64 || datos.foto_base64 || datos.imagenBase64 || 
                            datos.imagen || datos.foto || datos.fotoCedula || datos.foto_cedula;
            
            if (!fotoField || typeof fotoField !== 'string') {
              return null;
            }
            
            // Preparar imagen usando función de reparación robusta
            let imageSrc = null;
            let base64Reparado = null;
            
            // Extraer el base64 puro
            if (fotoField.startsWith('data:image/')) {
              // Ya tiene formato, extraer el base64
              const base64Part = fotoField.split('base64,')[1];
              if (base64Part) {
                base64Reparado = repararBase64(base64Part);
                if (base64Reparado) {
                  // Mantener el tipo MIME original si es posible
                  const mimeMatch = fotoField.match(/data:image\/([^;]+)/);
                  const mimeType = mimeMatch ? mimeMatch[1] : 'jpeg';
                  imageSrc = `data:image/${mimeType};base64,${base64Reparado}`;
                }
              }
            } else if (fotoField.includes('base64,')) {
              // Tiene prefijo base64, pero no data:image
              const base64Part = fotoField.split('base64,')[1];
              if (base64Part) {
                base64Reparado = repararBase64(base64Part);
                if (base64Reparado) {
                  imageSrc = `data:image/jpeg;base64,${base64Reparado}`;
                }
              }
            } else {
              // Es base64 puro
              base64Reparado = repararBase64(fotoField);
              if (base64Reparado) {
                imageSrc = `data:image/jpeg;base64,${base64Reparado}`;
              }
            }
            
            if (!imageSrc || !base64Reparado) {
              return null;
            }
            
            return (
              <FotoComponent imageSrc={imageSrc} base64Reparado={base64Reparado} />
            );
          })()}

          {/* Mostrar datos personales */}
          <div className="cc-grid">
            {datos.nombres && (
              <div className="cc-card">
                <p className="cc-label">Nombres</p>
                <p className="cc-value">{datos.nombres}</p>
              </div>
            )}
            {datos.apellidos && (
              <div className="cc-card">
                <p className="cc-label">Apellidos</p>
                <p className="cc-value">{datos.apellidos}</p>
              </div>
            )}
            {datos.nombre && (
              <div className="cc-card" style={{ gridColumn: '1 / -1' }}>
                <p className="cc-label">Nombre Completo</p>
                <p className="cc-value">{datos.nombre}</p>
              </div>
            )}
            {datos.cedula && (
              <div className="cc-card">
                <p className="cc-label">Cédula</p>
                <p className="cc-value">{datos.cedula}</p>
              </div>
            )}
            {datos.fechaNacimiento && (
              <div className="cc-card">
                <p className="cc-label">Fecha de Nacimiento</p>
                <p className="cc-value">{datos.fechaNacimiento}</p>
              </div>
            )}
            {datos.edad && (
              <div className="cc-card">
                <p className="cc-label">Edad</p>
                <p className="cc-value">{datos.edad} años</p>
              </div>
            )}
            {datos.genero && (
              <div className="cc-card">
                <p className="cc-label">Género</p>
                <p className="cc-value">{datos.genero}</p>
              </div>
            )}
            {datos.estadoCivil && (
              <div className="cc-card">
                <p className="cc-label">Estado Civil</p>
                <p className="cc-value">{datos.estadoCivil}</p>
              </div>
            )}
            {datos.nacionalidad && (
              <div className="cc-card">
                <p className="cc-label">Nacionalidad</p>
                <p className="cc-value">{datos.nacionalidad}</p>
              </div>
            )}
            {datos.provincia && (
              <div className="cc-card">
                <p className="cc-label">Provincia</p>
                <p className="cc-value">{datos.provincia}</p>
              </div>
            )}
            {datos.ciudad && (
              <div className="cc-card">
                <p className="cc-label">Ciudad</p>
                <p className="cc-value">{datos.ciudad}</p>
              </div>
            )}
            {datos.parroquia && (
              <div className="cc-card">
                <p className="cc-label">Parroquia</p>
                <p className="cc-value">{datos.parroquia}</p>
              </div>
            )}
            {datos.direccion && (
              <div className="cc-card" style={{ gridColumn: '1 / -1' }}>
                <p className="cc-label">Dirección</p>
                <p className="cc-value">{datos.direccion}</p>
              </div>
            )}
            {datos.estado && (
              <div className="cc-card">
                <p className="cc-label">Estado</p>
                <p className="cc-value">{datos.estado}</p>
              </div>
            )}
            {datos.lugarNacimiento && (
              <div className="cc-card">
                <p className="cc-label">Lugar de Nacimiento</p>
                <p className="cc-value">{datos.lugarNacimiento}</p>
              </div>
            )}
            {datos.fechaCedulacion && (
              <div className="cc-card">
                <p className="cc-label">Fecha de Cedulación</p>
                <p className="cc-value">{datos.fechaCedulacion}</p>
              </div>
            )}
          </div>

          {/* Mostrar otros campos que puedan existir (excluyendo campos de imagen) */}
          {Object.keys(datos).some(key => {
            const camposExcluidos = [
              'nombres', 'apellidos', 'nombre', 'cedula', 'fechaNacimiento', 'edad', 'genero', 
              'estadoCivil', 'nacionalidad', 'provincia', 'ciudad', 'parroquia', 'direccion', 
              'estado', 'lugarNacimiento', 'fechaCedulacion', 'nombreMadre', 'nombrePadre', 
              'instruccion', 'profesion', 'conyuge',
              'foto', 'fotoBase64', 'foto_base64', 'imagen', 'imagenBase64', 'fotoCedula'
            ];
            return !camposExcluidos.includes(key);
          }) && (
            <div className="cc-section">
              <h4>Información Adicional</h4>
              <div>
                {Object.entries(datos).map(([key, value]) => {
                  const camposExcluidos = [
                    'nombres', 'apellidos', 'nombre', 'cedula', 'fechaNacimiento', 'edad', 'genero', 
                    'estadoCivil', 'nacionalidad', 'provincia', 'ciudad', 'parroquia', 'direccion', 
                    'estado', 'lugarNacimiento', 'fechaCedulacion',
                    'foto', 'fotoBase64', 'foto_base64', 'imagen', 'imagenBase64', 'fotoCedula'
                  ];
                  
                  if (camposExcluidos.includes(key)) {
                    return null;
                  }
                  
                  // Ignorar valores vacíos, null, undefined o objetos
                  if (!value || typeof value === 'object') {
                    return null;
                  }
                  
                  const valorStr = String(value).trim();
                  if (valorStr) {
                    return (
                      <span key={key} className="cc-badge ok">
                        {key}: {valorStr}
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

