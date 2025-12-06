import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function HistorialPagos() {
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarPagos();
  }, []);

  const cargarPagos = async () => {
    try {
      setCargando(true);
      setError('');

      // Obtener el email del usuario autenticado
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        setError('No se pudo obtener el email del usuario. Por favor, inicia sesión nuevamente.');
        setCargando(false);
        return;
      }

      // Cargar pagos del usuario
      // Mostrar: finished, partially_paid, cancelled, y también waiting, pending (para sincronizar)
      const { data, error: queryError } = await supabase
        .from('pagos_nowpayments')
        .select('*')
        .eq('user_email', user.email)
        .in('payment_status', ['finished', 'partially_paid', 'cancelled', 'waiting', 'pending', 'confirming', 'confirmed'])
        .order('created_at', { ascending: false });

      if (queryError) {
        console.error('Error cargando pagos:', queryError);
        setError('Error al cargar el historial de pagos');
        return;
      }

      setPagos(data || []);
    } catch (e) {
      console.error('Error cargando pagos:', e);
      setError('Error al cargar el historial de pagos');
    } finally {
      setCargando(false);
    }
  };

  const sincronizarPago = async (pago) => {
    // Permitir sincronizar si tiene payment_id O invoice_id
    if (!pago.payment_id && !pago.invoice_id) {
      setError('No se puede sincronizar: falta payment_id o invoice_id');
      return;
    }

    try {
      setCargando(true);
      setError('');

      // IMPORTANTE: Priorizar invoice_id sobre payment_id
      // Si tenemos invoice_id, usarlo primero (más confiable para invoices)
      // Si solo tenemos payment_id, puede que sea en realidad un invoice_id guardado incorrectamente
      const invoiceId = pago.invoice_id || null
      const paymentId = pago.payment_id || null
      
      console.log('Sincronizando pago:', {
        orderId: pago.order_id,
        invoiceId: invoiceId,
        paymentId: paymentId,
        estadoActual: pago.payment_status
      });

      // Sincronizar el estado del pago desde Now Payments
      const { data, error: syncError } = await supabase.functions.invoke('nowpayments-payment', {
        body: {
          action: 'check',
          invoiceId: invoiceId, // Priorizar invoice_id
          paymentId: paymentId, // Usar payment_id como respaldo
          orderId: pago.order_id, // Mantener como respaldo
          syncToDb: true // Sincronizar con la BD
        }
      });

      if (syncError) {
        console.error('Error sincronizando pago:', syncError);
        const errorMessage = syncError.message || JSON.stringify(syncError);
        setError(`Error al sincronizar el pago: ${errorMessage}`);
        return;
      }

      if (!data?.success) {
        const errorMsg = data?.error || 'No se pudo sincronizar el pago';
        console.error('Error en respuesta de sincronización:', errorMsg);
        setError(errorMsg);
        return;
      }

      console.log('Pago sincronizado exitosamente:', data);
      
      // Recargar los pagos para mostrar el estado actualizado
      await cargarPagos();
    } catch (e) {
      console.error('Error sincronizando pago:', e);
      setError(`Error al sincronizar el pago: ${e.message || JSON.stringify(e)}`);
    } finally {
      setCargando(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearMonto = (monto, moneda = 'USD') => {
    if (!monto) return 'N/A';
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: moneda
    }).format(monto);
  };

  const obtenerEstadoColor = (estado) => {
    switch (estado) {
      case 'finished':
        return { bg: '#d1fae5', text: '#065f46', label: 'Completado' };
      case 'partially_paid':
        return { bg: '#fef3c7', text: '#92400e', label: 'Parcialmente Pagado' };
      case 'cancelled':
        return { bg: '#fee2e2', text: '#991b1b', label: 'Cancelado' };
      case 'waiting':
      case 'pending':
        return { bg: '#dbeafe', text: '#1e40af', label: 'Pendiente (Sincronizar)' };
      case 'confirming':
        return { bg: '#e0e7ff', text: '#3730a3', label: 'Confirmando' };
      case 'confirmed':
        return { bg: '#ddd6fe', text: '#5b21b6', label: 'Confirmado' };
      default:
        return { bg: '#e5e7eb', text: '#374151', label: estado };
    }
  };

  const localStyles = `
    .historial-container {
      background: white;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    }

    .historial-header {
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }

    .historial-title {
      font-size: 28px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 8px;
    }

    .historial-subtitle {
      color: #6b7280;
      font-size: 14px;
    }

    .pagos-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .pago-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      transition: all 0.2s;
    }

    .pago-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transform: translateY(-2px);
    }

    .pago-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .pago-info {
      flex: 1;
      min-width: 200px;
    }

    .pago-id {
      font-size: 12px;
      color: #6b7280;
      font-family: monospace;
      margin-bottom: 4px;
    }

    .pago-monto {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 4px;
    }

    .pago-fecha {
      font-size: 13px;
      color: #6b7280;
    }

    .pago-estado {
      display: inline-flex;
      align-items: center;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .pago-detalles {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    }

    .detalle-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .detalle-label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    .detalle-value {
      font-size: 14px;
      color: #1f2937;
      font-weight: 500;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: #6b7280;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e5e7eb;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-container {
      background: #fee2e2;
      border: 1px solid #fca5a5;
      border-radius: 12px;
      padding: 20px;
      color: #991b1b;
      text-align: center;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #6b7280;
    }

    .empty-icon {
      font-size: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .refresh-button {
      background: #667eea;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 16px;
    }

    .refresh-button:hover {
      background: #5568d3;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    @media (max-width: 768px) {
      .historial-container {
        padding: 20px;
      }

      .pago-header {
        flex-direction: column;
      }

      .pago-detalles {
        grid-template-columns: 1fr;
      }
    }
  `;

  if (cargando) {
    return (
      <div className="historial-container">
        <style>{localStyles}</style>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div>Cargando historial de pagos...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="historial-container">
        <style>{localStyles}</style>
        <div className="error-container">
          <div style={{ marginBottom: '12px', fontWeight: 600 }}>Error</div>
          <div>{error}</div>
          <button className="refresh-button" onClick={cargarPagos}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (pagos.length === 0) {
    return (
      <div className="historial-container">
        <style>{localStyles}</style>
        <div className="historial-header">
          <h1 className="historial-title">Historial de Pagos</h1>
          <p className="historial-subtitle">Pagos finalizados, parcialmente pagados, cancelados y pendientes de sincronización</p>
        </div>
        <div className="empty-state">
          <div className="empty-icon">💳</div>
          <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
            No hay pagos registrados
          </div>
          <div style={{ fontSize: '14px', marginBottom: '16px' }}>
            Los pagos completados, parcialmente pagados, cancelados o pendientes aparecerán aquí
          </div>
          <button className="refresh-button" onClick={cargarPagos}>
            Actualizar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="historial-container">
      <style>{localStyles}</style>
      
      <div className="historial-header">
        <h1 className="historial-title">Historial de Pagos</h1>
        <p className="historial-subtitle">
          Mostrando {pagos.length} {pagos.length === 1 ? 'pago' : 'pagos'}
        </p>
      </div>

      <div className="pagos-list">
        {pagos.map((pago) => {
          const estadoInfo = obtenerEstadoColor(pago.payment_status);
          
          return (
            <div key={pago.id} className="pago-card">
              <div className="pago-header">
                <div className="pago-info">
                  <div className="pago-id">Order ID: {pago.order_id}</div>
                  {pago.payment_id && (
                    <div className="pago-id" style={{ marginTop: '4px' }}>
                      Payment ID: {pago.payment_id}
                    </div>
                  )}
                  <div className="pago-monto">
                    {formatearMonto(pago.price_amount, pago.price_currency)}
                  </div>
                  <div className="pago-fecha">
                    {formatearFecha(pago.created_at)}
                  </div>
                </div>
                <div
                  className="pago-estado"
                  style={{
                    backgroundColor: estadoInfo.bg,
                    color: estadoInfo.text
                  }}
                >
                  {estadoInfo.label}
                </div>
              </div>

              <div className="pago-detalles">
                {pago.pay_currency && (
                  <div className="detalle-item">
                    <div className="detalle-label">Moneda de Pago</div>
                    <div className="detalle-value">{pago.pay_currency.toUpperCase()}</div>
                  </div>
                )}
                {pago.pay_amount && (
                  <div className="detalle-item">
                    <div className="detalle-label">Monto Pagado</div>
                    <div className="detalle-value">{formatearMonto(pago.pay_amount, pago.pay_currency)}</div>
                  </div>
                )}
                {pago.paid_at && (
                  <div className="detalle-item">
                    <div className="detalle-label">Fecha de Pago</div>
                    <div className="detalle-value">{formatearFecha(pago.paid_at)}</div>
                  </div>
                )}
                {pago.updated_at && (
                  <div className="detalle-item">
                    <div className="detalle-label">Última Actualización</div>
                    <div className="detalle-value">{formatearFecha(pago.updated_at)}</div>
                  </div>
                )}
                {(pago.payment_status === 'waiting' || pago.payment_status === 'pending' || pago.payment_status === 'confirming' || pago.payment_status === 'confirmed') && (pago.payment_id || pago.invoice_id) && (
                  <div className="detalle-item" style={{ gridColumn: '1 / -1' }}>
                    <button
                      onClick={() => sincronizarPago(pago)}
                      disabled={cargando}
                      style={{
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: cargando ? 'not-allowed' : 'pointer',
                        opacity: cargando ? 0.6 : 1
                      }}
                    >
                      🔄 Sincronizar Estado
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '24px', textAlign: 'center', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="refresh-button" onClick={cargarPagos}>
          Actualizar Lista
        </button>
        <button 
          className="refresh-button" 
          onClick={async () => {
            // Sincronizar todos los pagos que tengan payment_id o invoice_id y no estén en estado final
            const pagosConId = pagos.filter(p => 
              (p.payment_id || p.invoice_id) && 
              !['finished', 'partially_paid', 'cancelled'].includes(p.payment_status)
            );
            if (pagosConId.length === 0) {
              alert('No hay pagos pendientes para sincronizar');
              return;
            }
            
            setCargando(true);
            setError('');
            try {
              for (const pago of pagosConId) {
                await sincronizarPago(pago);
                // Pequeña pausa entre sincronizaciones
                await new Promise(resolve => setTimeout(resolve, 500));
              }
              await cargarPagos();
              alert(`Se sincronizaron ${pagosConId.length} ${pagosConId.length === 1 ? 'pago' : 'pagos'}`);
            } catch (e) {
              console.error('Error sincronizando pagos:', e);
              setError('Error al sincronizar algunos pagos');
            } finally {
              setCargando(false);
            }
          }}
          style={{ background: '#10b981' }}
          disabled={cargando}
        >
          🔄 Sincronizar Todos los Estados
        </button>
      </div>
    </div>
  );
}
