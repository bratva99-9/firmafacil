import React, { useState } from 'react'
import { EDGE_URL } from '../lib/supabase'

export default function ConsultaPlacas() {
  const [placa, setPlaca] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [html, setHtml] = useState('')
  const [json, setJson] = useState(null)
  const [dueno, setDueno] = useState(null)
  const [sri, setSri] = useState(null)
  const formatDate = (ms) => {
    if (!ms && ms !== 0) return ''
    try {
      const d = new Date(Number(ms))
      if (Number.isNaN(d.getTime())) return ''
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    } catch {
      return ''
    }
  }
  const money = (v) => {
    const n = Number(v)
    return Number.isFinite(n) ? `$${n.toFixed(2)}` : ''
  }

  const consultar = async (e) => {
    e.preventDefault()
    setError('')
    setHtml('')
    setJson(null)
    const p = placa.trim().toUpperCase()
    if (!/^([A-Z]{1,3}[0-9]{3,4}|[A-Z]{2,3}[0-9]{3}[A-Z]?)$/.test(p)) {
      setError('Ingresa una placa válida (ej. JV792R o PCW1234)')
      return
    }
    setCargando(true)
    try {
      const params = new URLSearchParams({ placa: p })
      const [respDetalle, respDueno, respSri] = await Promise.all([
        fetch(`${EDGE_URL}/placas-proxy?${params.toString()}`),
        fetch(`${EDGE_URL}/placa-dueno-proxy?${params.toString()}`),
        fetch(`${EDGE_URL}/sri-placa-proxy?${params.toString()}`)
      ])

      const textDetalle = await respDetalle.text()
      if (!respDetalle.ok) throw new Error(`Error ${respDetalle.status}`)
      try {
        const data = JSON.parse(textDetalle)
        setJson(data)
      } catch {
        setHtml(textDetalle)
      }

      const textDueno = await respDueno.text()
      try {
        const d = JSON.parse(textDueno)
        setDueno(d)
      } catch {
        setDueno({ Nombre: textDueno })
      }

      const textSri = await respSri.text()
      try {
        const s = JSON.parse(textSri)
        setSri(s)
      } catch {
        setSri(null)
      }
    } catch (e) {
      setError(e.message || 'Error consultando placa')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{ padding: 8 }}>
      <style>{`
        .cp-form { display: grid; grid-template-columns: 1fr auto; gap: 6px; margin-bottom: 8px; }
        .cp-input { padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; }
        .cp-btn { border: 1px solid #a5b4fc; background: #eef2ff; color: #3730a3; border-radius: 6px; padding: 6px 10px; font-weight: 700; font-size: 12px; }
        .cp-empty { padding: 6px 8px; background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; border-radius: 6px; font-size: 12px; }
        .cp-result { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px; overflow: auto; }
        .cp-title { font-size: 16px; font-weight: 800; margin: 0 0 6px; }
        .cp-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; }
        .cp-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px; background: #fafafa; }
        .cp-label { font-size: 11px; color: #6b7280; margin: 0; }
        .cp-value { font-size: 13px; font-weight: 700; color: #111827; margin: 2px 0 0; }
        .cp-section { margin-top: 8px; }
        .cp-section h4 { margin: 0 0 6px; font-size: 13px; font-weight: 800; color: #111827; }
        .cp-badges { display: flex; flex-wrap: wrap; gap: 6px; }
        .cp-badge { font-size: 11px; font-weight: 700; border: 1px solid #e5e7eb; border-radius: 999px; padding: 4px 8px; }
        .ok { background: #ecfdf5; color: #065f46; border-color: #a7f3d0; }
        .warn { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
        .cp-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
        .cp-table th, .cp-table td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; }
        .cp-table th { background: #f9fafb; color: #374151; font-weight: 700; }
      `}</style>

      <h3 className="cp-title">Consultar placas</h3>
      <form className="cp-form" onSubmit={consultar}>
        <input className="cp-input" value={placa} onChange={(e) => setPlaca(e.target.value)} placeholder="Ej. JV792R" />
        <button className="cp-btn" type="submit" disabled={cargando}>{cargando ? 'Consultando…' : 'Consultar'}</button>
      </form>

      {error && <div className="cp-empty" style={{ marginBottom: 8 }}>{error}</div>}

      {(json || sri) && (
        <div className="cp-result">
          <div className="cp-grid">
            {json?.CaducidadMatricula && (
              <div className="cp-card">
                <p className="cp-label">Caducidad matrícula</p>
                <p className="cp-value">{json.CaducidadMatricula}</p>
              </div>
            )}
            {json?.UltimoTramite && (
              <div className="cp-card">
                <p className="cp-label">Último trámite</p>
                <p className="cp-value">{json.UltimoTramite}</p>
              </div>
            )}
            {json?.GADUltimoTramite && (
              <div className="cp-card">
                <p className="cp-label">GAD último trámite</p>
                <p className="cp-value">{json.GADUltimoTramite}</p>
              </div>
            )}
            {json?.NumeroTraspasos && (
              <div className="cp-card">
                <p className="cp-label">N° traspasos</p>
                <p className="cp-value">{json.NumeroTraspasos}</p>
              </div>
            )}
            {json?.Cilindraje && (
              <div className="cp-card">
                <p className="cp-label">Cilindraje</p>
                <p className="cp-value">{json.Cilindraje}</p>
              </div>
            )}
            {(json?.Tonelaje || json?.Capacidad) && (
              <div className="cp-card">
                <p className="cp-label">Peso/Capacidad</p>
                <p className="cp-value">{[json?.Tonelaje, json?.Capacidad].filter(Boolean).join(' · ')}</p>
              </div>
            )}
            {json?.Color && (
              <div className="cp-card">
                <p className="cp-label">Color</p>
                <p className="cp-value">{String(json.Color).replace(/\\\//g, '').trim()}</p>
              </div>
            )}

            {sri?.placa && (
              <div className="cp-card">
                <p className="cp-label">Placa</p>
                <p className="cp-value">{sri.placa}</p>
              </div>
            )}
            {sri?.marca && (
              <div className="cp-card">
                <p className="cp-label">Marca / Modelo</p>
                <p className="cp-value">{sri.marca} · {sri.modelo}</p>
              </div>
            )}
            {sri?.anioModelo && (
              <div className="cp-card">
                <p className="cp-label">Año</p>
                <p className="cp-value">{sri.anioModelo} · {sri.clase}</p>
              </div>
            )}
            {sri?.servicio && (
              <div className="cp-card">
                <p className="cp-label">Servicio / Uso</p>
                <p className="cp-value">{sri.servicio} · {sri.tipoUso}</p>
              </div>
            )}
            {sri?.paisFabricacion && (
              <div className="cp-card">
                <p className="cp-label">País fabricación</p>
                <p className="cp-value">{sri.paisFabricacion}</p>
              </div>
            )}
            {sri?.cilindraje && (
              <div className="cp-card">
                <p className="cp-label">Cilindraje</p>
                <p className="cp-value">{sri.cilindraje}</p>
              </div>
            )}
            {sri?.cantonMatricula && (
              <div className="cp-card">
                <p className="cp-label">Cantón Matrícula</p>
                <p className="cp-value">{sri.cantonMatricula}</p>
              </div>
            )}
            {(sri?.fechaUltimaMatricula || sri?.fechaCaducidadMatricula) && (
              <div className="cp-card">
                <p className="cp-label">Fechas matrícula</p>
                <p className="cp-value">Última: {formatDate(sri.fechaUltimaMatricula)} · Caduca: {formatDate(sri.fechaCaducidadMatricula)}</p>
              </div>
            )}
            {sri?.fechaRevision && (
              <div className="cp-card">
                <p className="cp-label">Revisión</p>
                <p className="cp-value">{formatDate(sri.fechaRevision)}</p>
              </div>
            )}
            {(sri?.anioUltimoPago || sri?.total) && (
              <div className="cp-card">
                <p className="cp-label">Pagos</p>
                <p className="cp-value">Año último pago: {sri.anioUltimoPago} · Total: {money(sri.total)}</p>
              </div>
            )}
          </div>

          {(json?.Condicion || json?.Multas || sri?.deudas || sri?.tasas || dueno) && (
            <div className="cp-section">
              {dueno && (
                <div style={{ marginBottom: 8 }}>
                  <h4>Propietario</h4>
                  <div className="cp-badges">
                    {Object.entries(dueno).map(([k, v]) => {
                      let value = String(v)
                      if (k.toLowerCase() === 'nombre') {
                        value = value.split('|')[0].trim()
                      }
                      return (
                        <span key={k} className={`cp-badge ok`}>{k}: {value}</span>
                      )
                    })}
                  </div>
                </div>
              )}
              {json?.Condicion && (
                <div style={{ marginBottom: 8 }}>
                  <h4>Condición</h4>
                  <div className="cp-badges">
                    {Object.entries(json.Condicion).map(([k, v]) => (
                      <span key={k} className={`cp-badge ${v === 'SI' ? 'warn' : 'ok'}`}>{k}: {v}</span>
                    ))}
                  </div>
                </div>
              )}
              {json?.Multas && (
                <div>
                  <h4>Multas</h4>
                  <div className="cp-badges">
                    {Object.entries(json.Multas).map(([k, v]) => (
                      <span key={k} className={`cp-badge ${v === 'SI' ? 'warn' : 'ok'}`}>{k}: {v}</span>
                    ))}
                  </div>
                </div>
              )}

              {(sri?.deudas || sri?.tasas) && (
                <div style={{ marginTop: 8 }}>
                  <h4>Valores SRI</h4>
                  {Array.isArray(sri?.deudas) && sri.deudas.map((d, i) => (
                    <div key={`deu-${i}`} style={{ marginBottom: 8 }}>
                      <div className="cp-badges" style={{ marginBottom: 6 }}>
                        <span className="cp-badge warn">{d.descripcion}</span>
                        {d.subtotal != null && <span className="cp-badge warn">Subtotal: {money(d.subtotal)}</span>}
                      </div>
                      {Array.isArray(d.rubros) && (
                        <table className="cp-table">
                          <thead>
                            <tr>
                              <th>Rubro</th>
                              <th>Beneficiario</th>
                              <th>Periodo</th>
                              <th>Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {d.rubros.map((r, ri) => (
                              <tr key={`r-${i}-${ri}`}>
                                <td>{r.descripcion}</td>
                                <td>{r.beneficiario || ''}</td>
                                <td>{r.periodoFiscal || ''}</td>
                                <td>{money(r.valor)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  ))}
                  {Array.isArray(sri?.tasas) && sri.tasas.map((t, i) => (
                    <div key={`tas-${i}`} style={{ marginBottom: 8 }}>
                      <div className="cp-badges" style={{ marginBottom: 6 }}>
                        <span className="cp-badge ok">Tasa {t.descripcion}</span>
                        {t.subtotal != null && <span className="cp-badge ok">Subtotal: {money(t.subtotal)}</span>}
                      </div>
                      {Array.isArray(t.deudas) && t.deudas.map((d, di) => (
                        <div key={`tasd-${i}-${di}`} style={{ marginBottom: 6 }}>
                          <table className="cp-table">
                            <thead>
                              <tr>
                                <th>Descripción</th>
                                <th>Periodo</th>
                                <th>Valor</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.isArray(d.rubros) && d.rubros.map((r, ri) => (
                                <tr key={`tr-${i}-${di}-${ri}`}>
                                  <td>{r.descripcion}</td>
                                  <td>{r.periodoFiscal || ''}</td>
                                  <td>{money(r.valor)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {html && (
        <div className="cp-result" dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </div>
  )
}


