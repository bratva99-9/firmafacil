import React, { useMemo, useState } from 'react'
import { EDGE_URL } from '../lib/supabase'

export default function ValidadorFirma() {
  const [nombre, setNombre] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [resultado, setResultado] = useState(null)
  // Diseño simplificado: sin filtro y sin detalles

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
      const params = new URLSearchParams({ q: normalizado })
      const resp = await fetch(`${EDGE_URL}/nombres-proxy?${params.toString()}`)
      if (resp.status === 404) {
        setResultado([])
      } else if (!resp.ok) {
        const texto = await resp.text()
        throw new Error(`Error ${resp.status}: ${texto}`)
      } else {
        const data = await resp.json()
        setResultado(data)
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
        .vf-header { display: grid; grid-template-columns: 1fr auto; gap: 6px; margin-bottom: 8px; }
        .vf-input { padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; width: 100%; }
        .vf-input:focus { outline: none; border-color: #a5b4fc; box-shadow: 0 0 0 2px rgba(99,102,241,.12); }
        .vf-toolbar { display: grid; grid-template-columns: 1fr auto; gap: 6px; }
        .vf-empty { padding: 6px 8px; background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; border-radius: 6px; font-size: 12px; }

        /* Lista simple y compacta */
        .vf-list { list-style: none; padding: 0; margin: 6px 0 0; }
        .vf-item { padding: 8px 4px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .vf-item:last-child { border-bottom: none; }
        .vf-item-left { min-width: 0; }
        .vf-name { font-size: 13px; font-weight: 700; color: #111827; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .vf-meta { font-size: 11.5px; color: #6b7280; margin: 2px 0 0; }

        @media (max-width: 768px) {
          .vf-input { font-size: 12px; padding: 6px 8px; }
          .vf-item { padding: 6px 2px; }
          .vf-name { font-size: 12.5px; }
          .vf-meta { font-size: 11px; }
        }
      `}</style>

      <div className="vf-header">
        <form onSubmit={consultar} className="vf-toolbar" style={{ gridTemplateColumns: '1fr auto' }}>
          <input
            className="vf-input"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Apellidos y nombres (ej. CENTENO KEVIN)"
          />
          <button
            type="submit"
            disabled={cargando}
            style={{ border: '1px solid #a5b4fc', background: '#eef2ff', color: '#3730a3', borderRadius: 6, padding: '6px 10px', fontWeight: 700, fontSize: 12 }}
          >
            {cargando ? 'Consultando…' : 'Consultar'}
          </button>
        </form>
      </div>

      {error && (
        <div className="vf-empty" style={{ marginBottom: 12 }}>{error}</div>
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
      {datos.map((item) => {
        const id = item.identificacion || item.nombreComercial
        return (
          <li key={id} className="vf-item">
            <div className="vf-item-left">
              <h4 className="vf-name" title={item.nombreComercial || ''}>{item.nombreComercial || 'Sin nombre'}</h4>
              <p className="vf-meta">Identificación: {item.identificacion || '—'} · Provincia: {extraerProvincia(item) || '—'}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function extraerProvincia(item) {
  // Si alguna respuesta futura trae provincia en otro campo, unifícalo aquí
  // En el dataset actual no hay provincia explícita, devolvemos vacío
  return item.provincia || null
}

 