import React, { useMemo, useRef, useState, useEffect } from 'react'
import { EDGE_URL } from '../lib/supabase'

export default function ValidadorFirma() {
  const [nombre, setNombre] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [resultado, setResultado] = useState(null)
  const [cooldownMs, setCooldownMs] = useState(0)
  const cacheRef = useRef(new Map()) // key: nombre normalizado, value: { data, ts }
  const TTL_MS = 15 * 60 * 1000 // 15 minutos

  // temporizador para countdown
  useEffect(() => {
    if (cooldownMs <= 0) return
    const id = setInterval(() => setCooldownMs((ms) => Math.max(0, ms - 1000)), 1000)
    return () => clearInterval(id)
  }, [cooldownMs])

  const consultar = async (e) => {
    e.preventDefault()
    setError('')
    setResultado(null)
    if (!nombre.trim()) {
      setError('Ingresa un nombre a consultar')
      return
    }
    setCargando(true)
    try {
      const normalizado = nombre.trim().replace(/\s+/g, ' ').toUpperCase()
      // cache local
      const cached = cacheRef.current.get(normalizado)
      if (cached && Date.now() - cached.ts < TTL_MS) {
        setResultado(cached.data)
        setCargando(false)
        return
      }
      const params = new URLSearchParams({ q: normalizado })
      const resp = await fetch(`${EDGE_URL}/nombres-proxy?${params.toString()}`)
      if (resp.status === 404) {
        setResultado([])
        cacheRef.current.set(normalizado, { data: [], ts: Date.now() })
      } else if (resp.status === 429) {
        setError('Límite de consultas alcanzado. Intenta nuevamente en 60 segundos.')
        setCooldownMs(60 * 1000)
      } else if (!resp.ok) {
        const texto = await resp.text()
        throw new Error(`Error ${resp.status}: ${texto}`)
      } else {
        const data = await resp.json()
        setResultado(data)
        cacheRef.current.set(normalizado, { data, ts: Date.now() })
      }
    } catch (err) {
      setError(err.message || 'Error desconocido')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{ padding: 8 }}>
      <style>{`
        .vf-header { display: grid; grid-template-columns: 1fr auto; gap: 6px; margin-bottom: 12px; }
        .vf-input { padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; width: 100%; }
        .vf-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); }
        .vf-toolbar { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
        .vf-empty { padding: 8px 12px; background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; border-radius: 6px; font-size: 13px; margin-bottom: 12px; }

        /* Grid de tarjetas responsive */
        .vf-list { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); 
          gap: 16px; 
          padding: 0; 
          margin: 0; 
          list-style: none; 
        }
        
        /* Tarjeta individual - Estilo Vertical */
        .vf-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          flex-direction: column;
        }
        .vf-card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-color: #bfdbfe; }

        .vf-card-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 16px;
          gap: 12px;
          flex: 1;
        }

        /* Foto centrada arriba */
        .vf-photo-container {
          width: 110px;
          height: 135px; /* Aspecto aproximado foto carnet */
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          overflow: hidden;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .vf-photo { width: 100%; height: 100%; object-fit: cover; }
        .vf-photo-placeholder { font-size: 32px; color: #9ca3af; }
        .vf-photo-loading { font-size: 11px; color: #6b7280; text-align: center; padding: 4px; }

        /* Detalles centrados abajo */
        .vf-details { width: 100%; display: flex; flex-direction: column; gap: 6px; align-items: center; }
        
        .vf-name { 
          font-size: 13px; 
          font-weight: 700; 
          color: #111827; 
          line-height: 1.3;
          margin: 0;
          min-height: 34px; /* Altura mínima para 2 líneas */
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .vf-cedula {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          background: #eff6ff;
          color: #1e40af;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 700;
          display: inline-block;
          border: 1px solid #dbeafe;
          letter-spacing: 0.5px;
        }

        /* Grid de metadatos */
        .vf-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          width: 100%;
          margin-top: 8px;
          background: #f9fafb;
          padding: 8px;
          border-radius: 6px;
          border: 1px solid #f3f4f6;
          text-align: left;
        }
        
        .vf-meta-item {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        
        .vf-meta-item.full-width {
            grid-column: 1 / -1;
            padding-top: 4px;
            border-top: 1px dashed #e5e7eb;
            margin-top: 2px;
        }

        .vf-meta-label { font-weight: 700; color: #9ca3af; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }
        .vf-meta-value { color: #374151; font-weight: 600; font-size: 11px; line-height: 1.2; word-break: break-word; }

        @media (max-width: 640px) {
          .vf-list { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
          .vf-photo-container { width: 90px; height: 110px; }
          .vf-name { font-size: 12px; min-height: 32px; }
          .vf-card-content { padding: 12px 8px; }
          .vf-meta-grid { gap: 6px; padding: 6px; }
        }
      `}</style>

      <div className="vf-header">
        <form onSubmit={consultar} className="vf-toolbar" style={{ gridTemplateColumns: '1fr auto' }}>
          <input
            className="vf-input"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Apellidos y nombres (ej. RODRIGUEZ CARLOS)"
          />
          <button
            type="submit"
            disabled={cargando || cooldownMs > 0}
            style={{
              border: 'none',
              background: '#2563eb',
              color: '#ffffff',
              borderRadius: 6,
              padding: '8px 16px',
              fontWeight: 600,
              fontSize: 13,
              cursor: cargando || cooldownMs > 0 ? 'not-allowed' : 'pointer',
              opacity: cargando || cooldownMs > 0 ? 0.7 : 1,
              transition: 'background 0.2s'
            }}
          >
            {cargando ? 'Consultando…' : cooldownMs > 0 ? `Espera ${Math.ceil(cooldownMs / 1000)}s` : 'Consultar'}
          </button>
        </form>
      </div>

      {error && (
        <div className="vf-empty">{error}</div>
      )}

      {resultado && Array.isArray(resultado) && resultado.length === 0 && (
        <div className="vf-empty">Sin resultados para el nombre ingresado.</div>
      )}

      {resultado && Array.isArray(resultado) && resultado.length > 0 && (
        <ListadoResultados datos={resultado} />
      )}
    </div>
  )
}

function ListadoResultados({ datos }) {
  return (
    <ul className="vf-list">
      {datos.map((item) => (
        <ResultadoCedula key={item.identificacion || item.nombreComercial} item={item} />
      ))}
    </ul>
  )
}

function ResultadoCedula({ item }) {
  const [dataFull, setDataFull] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      // Si el item ya tiene los datos completos (por si la API de búsqueda cambia), usarlos
      if (item.foto || item.lugarNacimiento) {
        setDataFull(item);
        return;
      }

      if (!item.identificacion) return
      setLoading(true)
      try {
        const url = "https://apifirmas.firmasecuador.com/api/usuarios/consultarCedulaPublica";
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cedula: item.identificacion })
        });

        if (response.ok) {
          const data = await response.json()
          setDataFull(data)
        }
      } catch (err) {
        console.error("Error fetching details", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [item])

  // Procesar imagen
  const fotoSrc = useMemo(() => {
    if (!dataFull) return null;
    const fotoField = dataFull.foto || dataFull.imagen || dataFull.fotoBase64 || dataFull.imagenBase64 || dataFull.foto_base64;

    if (!fotoField || typeof fotoField !== 'string') return null;

    let base64Limpio = null;
    let finalSrc = null;

    if (fotoField.startsWith('data:image/')) {
      const parts = fotoField.split('base64,');
      if (parts.length === 2) {
        base64Limpio = repararBase64(parts[1]);
        if (base64Limpio) {
          const mimeMatch = fotoField.match(/data:image\/([^;]+)/);
          const mimeType = mimeMatch ? mimeMatch[1] : 'jpeg';
          finalSrc = `data:image/${mimeType};base64,${base64Limpio}`;
        }
      }
    } else if (fotoField.includes('base64,')) {
      const parts = fotoField.split('base64,');
      if (parts.length === 2) {
        base64Limpio = repararBase64(parts[1]);
        if (base64Limpio) finalSrc = `data:image/jpeg;base64,${base64Limpio}`;
      }
    } else {
      base64Limpio = repararBase64(fotoField);
      if (base64Limpio) finalSrc = `data:image/jpeg;base64,${base64Limpio}`;
    }
    return finalSrc;
  }, [dataFull]);

  // Datos calculados
  const edadCalculada = useMemo(() => {
    if (dataFull?.fechaNacimiento) {
      return calcularEdad(dataFull.fechaNacimiento);
    }
    return null;
  }, [dataFull]);

  const lugarNacimiento = dataFull?.lugarNacimiento || '—';
  // Formatear lugar de nacimiento: Primera letra mayúscula de cada parte, reemplazar barras con espacios
  const lugarFormateado = lugarNacimiento.toLowerCase().replace(/\//g, ' / ');

  const ubicacion = dataFull?.direccion || dataFull?.parroquia || dataFull?.ciudad || '—';
  const estadoCivil = dataFull?.estadoCivil || '—';
  const nacionalidad = dataFull?.nacionalidad || 'ECU';

  return (
    <li className="vf-card">
      <div className="vf-card-content">
        <div className="vf-photo-container">
          {loading ? (
            <div className="vf-photo-loading">Cargando...</div>
          ) : fotoSrc ? (
            <img src={fotoSrc} alt="Foto" className="vf-photo" />
          ) : (
            <div className="vf-photo-placeholder">👤</div>
          )}
        </div>

        <div className="vf-details">
          <h4 className="vf-name" title={item.nombreComercial || dataFull?.nombres}>{item.nombreComercial || dataFull?.nombres || 'Sin nombre'}</h4>

          <div className="vf-cedula">{item.identificacion}</div>

          <div className="vf-meta-grid">
            <div className="vf-meta-item">
              <span className="vf-meta-label">Edad</span>
              <span className="vf-meta-value">{edadCalculada ? `${edadCalculada} años` : '—'}</span>
            </div>

            <div className="vf-meta-item">
              <span className="vf-meta-label">Est. Civil</span>
              <span className="vf-meta-value" style={{ textTransform: 'capitalize' }}>{estadoCivil.toLowerCase()}</span>
            </div>

            <div className="vf-meta-item full-width">
              <span className="vf-meta-label">Lugar Nacimiento</span>
              <span className="vf-meta-value" style={{ textTransform: 'capitalize' }}>{lugarFormateado}</span>
            </div>

            {ubicacion !== '—' && (
              <div className="vf-meta-item full-width">
                <span className="vf-meta-label">Dirección</span>
                <span className="vf-meta-value" style={{ textTransform: 'capitalize' }}>{ubicacion.toLowerCase()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  try {
    const hoy = new Date();
    const cumpleanos = new Date(fechaNacimiento);
    // Validar fecha
    if (isNaN(cumpleanos.getTime())) return null;

    let edad = hoy.getFullYear() - cumpleanos.getFullYear();
    const mes = hoy.getMonth() - cumpleanos.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < cumpleanos.getDate())) {
      edad--;
    }
    return edad;
  } catch {
    return null;
  }
}

// Función robusta para reparar base64
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
