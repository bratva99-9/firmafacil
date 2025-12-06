import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ConsultaRUCPagadaTool() {
  const [ruc, setRuc] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [resultado, setResultado] = useState(null)
  const [pagoInfo, setPagoInfo] = useState(null)
  const [pagoCompletado, setPagoCompletado] = useState(false)
  const [creandoPago, setCreandoPago] = useState(false)

  const crearPago = async () => {
    const r = ruc.trim()
    
    if (!/^\d{13}$/.test(r)) {
      setError('Ingresa un RUC válido de 13 dígitos antes de crear el pago')
      return
    }

    setCreandoPago(true)
    setError('')
    
    try {
      // Obtener el email del usuario autenticado
      const { data: { user } } = await supabase.auth.getUser()
      const userEmail = user?.email || null
      const userId = user?.id || null
      
      if (!userEmail) {
        setError('No se pudo obtener el email del usuario. Por favor, inicia sesión nuevamente.')
        return
      }
      
      const orderId = `RUC_${r}_${Date.now()}`
      const montoBase = 1.5 // Monto para pruebas
      
      // No especificar payCurrency para permitir que el usuario elija cualquier criptomoneda
      // Now Payments mostrará todas las opciones disponibles
      
      const { data, error } = await supabase.functions.invoke('nowpayments-payment', {
        body: {
          action: 'create',
          amount: montoBase.toString(),
          currency: 'USD',
          orderId: orderId,
          userEmail: userEmail,
          userId: userId
          // No enviar payCurrency para permitir selección de cualquier criptomoneda
        }
      })

      if (error) {
        console.error('Error creando pago:', error)
        setError(error.message || 'Error al crear el pago')
        return
      }

      if (!data?.success) {
        setError(data?.error || 'No se pudo crear el pago')
        return
      }

      // Log completo de la respuesta para debug
      console.log('Respuesta completa de Now Payments:', JSON.stringify(data, null, 2))
      
      // Extraer todos los campos posibles de la respuesta
      const payment = data.payment || data
      
      // IMPORTANTE: Cuando se crea un invoice con POST /invoice:
      // - El campo "id" devuelto es el invoice_id, NO el payment_id
      // - El payment_id solo existe cuando el usuario realmente inicia el pago
      // - Por lo tanto, NUNCA usar "id" como payment_id si no hay payment_id explícito
      const paymentId = payment?.payment_id || null // Solo usar payment_id si está explícitamente presente
      const invoiceId = payment?.invoice_id || 
                       payment?.invoiceId ||
                       payment?.id || // El "id" es siempre el invoice_id cuando se crea un invoice
                       null
      
      console.log('IDs extraídos en frontend:', {
        payment_id_explicito: payment?.payment_id,
        invoice_id_explicito: payment?.invoice_id || payment?.invoiceId,
        id_campo: payment?.id,
        paymentId_final: paymentId,
        invoiceId_final: invoiceId
      })
      
      // Buscar URL de pago en todos los campos posibles (prioridad: pay_url > invoice_url > payment_url)
      const paymentUrl = payment?.pay_url || 
                        payment?.invoice_url || 
                        payment?.payment_url ||
                        payment?.url ||
                        null
      
      // Validar que tenemos al menos una URL
      if (!paymentUrl) {
        console.error('No se encontró URL de pago en la respuesta:', payment)
        setError('No se pudo obtener la URL de pago. Por favor, intenta de nuevo.')
        return
      }
      
      // Guardar toda la información del pago
      const pagoInfoCompleto = {
        ...payment,
        orderId: orderId,
        payment_id: paymentId,
        invoice_id: invoiceId, // Guardar invoice_id por separado
        payment_url: paymentUrl,
        invoice_url: payment?.invoice_url || paymentUrl,
        pay_url: payment?.pay_url || paymentUrl
      }
      
      setPagoInfo(pagoInfoCompleto)
      
      // Log para debug
      console.log('Pago creado - Información procesada:', {
        orderId: orderId,
        payment_id: paymentId,
        invoice_id: invoiceId,
        payment_url: paymentUrl,
        invoice_url: payment?.invoice_url,
        pay_url: payment?.pay_url,
        todosLosCampos: Object.keys(payment),
        respuestaCompleta: payment
      })
      
      // No abrir nueva ventana - el widget se mostrará en un iframe en la misma página
    } catch (e) {
      console.error('Error invocando nowpayments-payment:', e)
      setError(e.message || 'Error al crear el pago')
    } finally {
      setCreandoPago(false)
    }
  }

  const verificarPago = async () => {
    if (!pagoInfo?.orderId && !pagoInfo?.payment_id && !pagoInfo?.invoice_id) {
      setError('No hay información de pago para verificar')
      return
    }

    setCargando(true)
    setError('')
    
    // IMPORTANTE: Priorizar invoice_id sobre payment_id
    // Cuando se crea un invoice, el "id" es el invoice_id, no el payment_id
    const invoiceId = pagoInfo.invoice_id || pagoInfo.invoiceId || null
    const paymentId = pagoInfo.payment_id || null
    
    console.log('Verificando pago:', {
      orderId: pagoInfo.orderId,
      invoiceId: invoiceId,
      paymentId: paymentId
    })
    
    try {
      const { data, error } = await supabase.functions.invoke('nowpayments-payment', {
        body: {
          action: 'check',
          invoiceId: invoiceId, // Priorizar invoice_id (más confiable para invoices)
          paymentId: paymentId, // Usar payment_id como respaldo
          orderId: pagoInfo.orderId, // Mantener como respaldo
          syncToDb: true // Sincronizar el estado con la BD
        }
      })

      if (error) {
        console.error('Error verificando pago:', error)
        setError(error.message || 'Error al verificar el pago')
        return
      }

      if (!data?.success) {
        setError(data?.error || 'No se pudo verificar el pago')
        return
      }

      const paymentData = Array.isArray(data.payment) ? data.payment[0] : data.payment
      const estadoPago = paymentData?.payment_status || paymentData?.status
      
      if (estadoPago === 'finished' || estadoPago === 'confirmed' || estadoPago === 'paid') {
        setPagoCompletado(true)
        ejecutarConsulta()
      } else {
        setError(`El pago aún no ha sido completado. Estado: ${estadoPago}`)
      }
    } catch (e) {
      console.error('Error verificando pago:', e)
      setError(e.message || 'Error al verificar el pago')
    } finally {
      setCargando(false)
    }
  }

  const ejecutarConsulta = async () => {
    const r = ruc.trim()

    if (!/^\d{13}$/.test(r)) {
      setError('Ingresa un RUC válido de 13 dígitos')
      return
    }

    setCargando(true)
    setError('')
    
    try {
      const { data, error } = await supabase.functions.invoke('consultar-ruc', {
        body: { ruc: r }
      })

      if (error) {
        console.error('Error consultar-ruc:', error)
        setError(error.message || 'Error en la consulta de RUC pagada')
        return
      }

      if (!data?.success) {
        setError(data?.error || 'No se pudo obtener la información del RUC')
        setResultado(data || null)
        return
      }

      setResultado(data)
    } catch (e) {
      console.error('Error invocando consultar-ruc:', e)
      setError(e.message || 'Error en la consulta de RUC pagada')
    } finally {
      setCargando(false)
    }
  }

  const consultar = async (e) => {
    e.preventDefault()
    
    if (!pagoCompletado) {
      setError('Debes completar el pago antes de consultar el RUC')
      return
    }

    ejecutarConsulta()
  }

  return (
    <div className="tool-panel" style={{ padding: 12 }}>
      <style>{`
        .ruc-form { display: grid; grid-template-columns: 1fr auto; gap: 8px; margin-bottom: 12px; }
        .ruc-input { padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; }
        .ruc-btn { border: 1px solid #a5b4fc; background: #eef2ff; color: #3730a3; border-radius: 6px; padding: 6px 10px; font-weight: 700; font-size: 12px; }
        .ruc-alert { padding: 6px 8px; border-radius: 6px; font-size: 12px; margin-bottom: 6px; }
        .ruc-error { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }
        .ruc-ok { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; }
        .ruc-result { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; font-size: 13px; overflow: auto; }
        .ruc-section { margin-top: 12px; }
        .ruc-section-title { font-size: 14px; font-weight: 700; color: #374151; margin: 0 0 8px; }
        .ruc-field { margin-bottom: 8px; }
        .ruc-label { font-weight: 600; color: #6b7280; font-size: 12px; }
        .ruc-value { color: #111827; margin-top: 2px; }
        .payment-modal-overlay { 
          position: fixed; 
          top: 0; 
          left: 0; 
          right: 0; 
          bottom: 0; 
          background-color: rgba(0, 0, 0, 0.9); 
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 10000; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          padding: 16px;
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px) scale(0.98); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .payment-modal-content { 
          background: #1a1a1a; 
          border-radius: 16px; 
          width: 100%; 
          max-width: 600px; 
          height: auto;
          max-height: 85vh;
          overflow: hidden; 
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
          display: flex; 
          flex-direction: column;
          animation: slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .payment-modal-header { 
          padding: 16px 20px; 
          border-bottom: 1px solid rgba(255, 255, 255, 0.1); 
          display: flex; 
          justify-content: space-between; 
          align-items: center;
          background: #1a1a1a;
          flex-shrink: 0;
        }
        .payment-modal-title { 
          font-size: 18px; 
          font-weight: 600; 
          color: #ffffff; 
          margin: 0;
          letter-spacing: -0.01em;
        }
        .payment-modal-close { 
          background: rgba(255, 255, 255, 0.1); 
          border: 1px solid rgba(255, 255, 255, 0.15); 
          font-size: 20px; 
          color: #a0a0a0; 
          cursor: pointer; 
          padding: 0; 
          width: 32px; 
          height: 32px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          border-radius: 8px; 
          transition: all 0.15s ease;
          font-weight: 300;
          line-height: 1;
        }
        .payment-modal-close:hover { 
          background: rgba(255, 255, 255, 0.15); 
          border-color: rgba(255, 255, 255, 0.25);
          color: #ffffff;
        }
        .payment-modal-close:active {
          transform: scale(0.95);
        }
        .payment-modal-body { 
          flex: 1; 
          overflow: hidden; 
          position: relative; 
          background: #1a1a1a;
          display: flex;
          align-items: stretch;
          min-height: 500px;
          max-height: calc(85vh - 60px);
        }
        .payment-widget-iframe { 
          border: none; 
          width: 100%; 
          height: 100%; 
          display: block;
          background: #1a1a1a;
          min-height: 500px;
        }
      `}</style>

      <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px' }}>Consulta de RUC Pagada</h3>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
          Consulta completa de RUC con información detallada del SRI. Requiere pago previo mediante Now Payments.
        </p>
      </div>

      {!pagoCompletado && (
        <div style={{ 
          marginBottom: '16px', 
          padding: '12px', 
          backgroundColor: '#fef3c7', 
          border: '1px solid #fbbf24', 
          borderRadius: '6px' 
        }}>
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ fontSize: '13px', color: '#92400e' }}>💰 Pago Requerido</strong>
            <p style={{ fontSize: '12px', color: '#78350f', margin: '4px 0 0 0' }}>
              Para acceder a esta consulta, primero debes completar el pago mediante Now Payments (criptomonedas).
            </p>
          </div>
          
          <form className="ruc-form" style={{ marginBottom: '8px' }}>
            <input
              className="ruc-input"
              value={ruc}
              onChange={(e) => setRuc(e.target.value)}
              placeholder="Ingresa RUC (13 dígitos)"
              disabled={pagoInfo !== null}
            />
            {!pagoInfo ? (
              <button 
                type="button" 
                className="ruc-btn" 
                onClick={crearPago}
                disabled={creandoPago || !/^\d{13}$/.test(ruc.trim())}
                style={{ 
                  backgroundColor: '#10b981', 
                  borderColor: '#10b981',
                  color: 'white'
                }}
              >
                {creandoPago ? 'Creando pago…' : '💰 Crear Pago'}
              </button>
            ) : (
              <button 
                type="button" 
                className="ruc-btn" 
                onClick={verificarPago}
                disabled={cargando}
                style={{ 
                  backgroundColor: '#3b82f6', 
                  borderColor: '#3b82f6',
                  color: 'white'
                }}
              >
                {cargando ? 'Verificando…' : '✓ Verificar Pago'}
              </button>
            )}
          </form>

          {pagoInfo && (
            <div style={{ 
              marginTop: '8px', 
              padding: '8px', 
              backgroundColor: '#dbeafe', 
              borderRadius: '4px',
              fontSize: '11px',
              color: '#1e40af'
            }}>
              <strong>Pago creado:</strong> {pagoInfo.orderId}<br />
              {pagoInfo.payment_id && (
                <>
                  <strong>Payment ID:</strong> {pagoInfo.payment_id}<br />
                </>
              )}
              <span style={{ fontSize: '10px', color: '#64748b' }}>
                Después de realizar el pago, haz clic en "Verificar Pago" para continuar.
              </span>
            </div>
          )}
          
          {/* Modal/Overlay del Payment Widget - se muestra como sobrepestaña */}
          {pagoInfo && (pagoInfo.payment_url || pagoInfo.invoice_url || pagoInfo.pay_url) && (
            <div 
              className="payment-modal-overlay"
              onClick={(e) => {
                // Cerrar modal al hacer clic fuera del contenido (opcional)
                if (e.target === e.currentTarget) {
                  // No cerrar automáticamente - el usuario debe completar el pago
                }
              }}
            >
              <div 
                className="payment-modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="payment-modal-header">
                  <h3 className="payment-modal-title">Completar Pago</h3>
                  <button
                    className="payment-modal-close"
                    onClick={() => {
                      // Permitir cerrar el modal - el usuario puede verificar después
                      setPagoInfo(null)
                    }}
                    aria-label="Cerrar"
                    title="Cerrar"
                  >
                    ×
                  </button>
                </div>
                <div className="payment-modal-body">
                  {pagoInfo.payment_url || pagoInfo.invoice_url || pagoInfo.pay_url ? (
                    <iframe
                      key={pagoInfo.payment_id || pagoInfo.orderId} // Forzar recarga si cambia
                      src={pagoInfo.pay_url || pagoInfo.invoice_url || pagoInfo.payment_url}
                      className="payment-widget-iframe"
                      allowFullScreen={true}
                      allowPaymentRequest={true}
                      title="Now Payments Widget"
                      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
                      onLoad={() => {
                        console.log('Iframe de pago cargado correctamente')
                      }}
                      onError={(e) => {
                        console.error('Error cargando iframe de pago:', e)
                        setError('Error al cargar la página de pago. Por favor, intenta de nuevo.')
                      }}
                    />
                  ) : (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: '100%',
                      color: '#a0a0a0',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <div style={{ fontSize: '14px' }}>Cargando página de pago...</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Si no carga, verifica la consola del navegador</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {pagoCompletado && (
        <div style={{ 
          marginBottom: '12px', 
          padding: '8px', 
          backgroundColor: '#d1fae5', 
          border: '1px solid #10b981', 
          borderRadius: '6px',
          fontSize: '12px',
          color: '#065f46'
        }}>
          ✓ Pago completado. Puedes proceder con la consulta.
        </div>
      )}

      <form className="ruc-form" onSubmit={consultar}>
        <input
          className="ruc-input"
          value={ruc}
          onChange={(e) => setRuc(e.target.value)}
          placeholder="Ingresa RUC (13 dígitos)"
          disabled={!pagoCompletado}
        />
        <button 
          className="ruc-btn" 
          type="submit" 
          disabled={cargando || !pagoCompletado}
          style={{
            opacity: !pagoCompletado ? 0.5 : 1,
            cursor: !pagoCompletado ? 'not-allowed' : 'pointer'
          }}
        >
          {cargando ? 'Consultando…' : 'Consultar RUC'}
        </button>
      </form>

      {error && (
        <div className="ruc-alert ruc-error">
          {error}
        </div>
      )}

      {resultado?.data && (
        <div className="ruc-result">
          <div className="ruc-section">
            <div className="ruc-section-title">Información del Contribuyente</div>
            {resultado.data.numero_ruc && (
              <div className="ruc-field">
                <div className="ruc-label">RUC:</div>
                <div className="ruc-value">{resultado.data.numero_ruc}</div>
              </div>
            )}
            {resultado.data.razon_social && (
              <div className="ruc-field">
                <div className="ruc-label">Razón Social:</div>
                <div className="ruc-value">{resultado.data.razon_social}</div>
              </div>
            )}
            {resultado.data.estado_contribuyente_ruc && (
              <div className="ruc-field">
                <div className="ruc-label">Estado:</div>
                <div className="ruc-value">{resultado.data.estado_contribuyente_ruc}</div>
              </div>
            )}
            {resultado.data.tipo_contribuyente && (
              <div className="ruc-field">
                <div className="ruc-label">Tipo de Contribuyente:</div>
                <div className="ruc-value">{resultado.data.tipo_contribuyente}</div>
              </div>
            )}
            {resultado.data.actividad_economica_principal && (
              <div className="ruc-field">
                <div className="ruc-label">Actividad Económica Principal:</div>
                <div className="ruc-value">{resultado.data.actividad_economica_principal}</div>
              </div>
            )}
            {resultado.data.regimen && (
              <div className="ruc-field">
                <div className="ruc-label">Régimen:</div>
                <div className="ruc-value">{resultado.data.regimen}</div>
              </div>
            )}
            {resultado.data.categoria && (
              <div className="ruc-field">
                <div className="ruc-label">Categoría:</div>
                <div className="ruc-value">{resultado.data.categoria}</div>
              </div>
            )}
            {resultado.data.fecha_inicio_actividades && (
              <div className="ruc-field">
                <div className="ruc-label">Fecha Inicio Actividades:</div>
                <div className="ruc-value">{resultado.data.fecha_inicio_actividades}</div>
              </div>
            )}
            {resultado.data.obligado_llevar_contabilidad && (
              <div className="ruc-field">
                <div className="ruc-label">Obligado a Llevar Contabilidad:</div>
                <div className="ruc-value">{resultado.data.obligado_llevar_contabilidad}</div>
              </div>
            )}
            {resultado.data.agente_retencion && (
              <div className="ruc-field">
                <div className="ruc-label">Agente de Retención:</div>
                <div className="ruc-value">{resultado.data.agente_retencion}</div>
              </div>
            )}
            {resultado.data.contribuyente_especial && (
              <div className="ruc-field">
                <div className="ruc-label">Contribuyente Especial:</div>
                <div className="ruc-value">{resultado.data.contribuyente_especial}</div>
              </div>
            )}
          </div>

          {resultado.data.representantes_legales && resultado.data.representantes_legales.length > 0 && (
            <div className="ruc-section">
              <div className="ruc-section-title">Representantes Legales</div>
              {resultado.data.representantes_legales.map((rep, idx) => (
                <div key={idx} className="ruc-field">
                  <div className="ruc-value">
                    {rep.nombreCompleto || rep.nombre} - {rep.tipoDocumento || ''} {rep.numeroDocumento || ''}
                  </div>
                </div>
              ))}
            </div>
          )}

          {resultado.data.establecimientos && resultado.data.establecimientos.length > 0 && (
            <div className="ruc-section">
              <div className="ruc-section-title">Establecimientos</div>
              {resultado.data.establecimientos.map((est, idx) => (
                <div key={idx} className="ruc-field">
                  <div className="ruc-value">
                    {est.codigoEstablecimiento || ''} - {est.direccion || ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
