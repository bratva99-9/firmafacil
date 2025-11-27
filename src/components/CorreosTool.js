import React, { useMemo, useState } from 'react';

export default function CorreosTool() {
  const [showGmailTool, setShowGmailTool] = useState(false);
  const [generateNewAccount, setGenerateNewAccount] = useState('0');
  const [gmailResult, setGmailResult] = useState(null);
  const [gmailError, setGmailError] = useState('');
  const [gmailLoading, setGmailLoading] = useState(false);

  const [gmailAddress, setGmailAddress] = useState('');
  const [gmailAccountToken, setGmailAccountToken] = useState('');
  const [gmailMessages, setGmailMessages] = useState(null);
  const [gmailMessagesError, setGmailMessagesError] = useState('');
  const [gmailMessagesLoading, setGmailMessagesLoading] = useState(false);
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(null);

  const probarApiTemporalGmail = async () => {
    setGmailError('');
    setGmailResult(null);
    setGmailLoading(true);

    try {
      const response = await fetch('https://temporary-gmail-account.p.rapidapi.com/GmailGetAccount', {
        method: 'POST',
        headers: {
          'x-rapidapi-key': '48abc974dbmsh1dd911a04a25bccp1f725djsn8f411b999a1d',
          'x-rapidapi-host': 'temporary-gmail-account.p.rapidapi.com',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          generateNewAccount: Number(generateNewAccount) === 1 ? 1 : 0
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Error en la API de RapidAPI');
      }

      const data = await response.json();
      setGmailResult(data);
      if (data && typeof data === 'object') {
        setGmailAddress(data.address || data.gmailAddress || data.email || '');
        setGmailAccountToken(data.token || data.accountToken || '');
      }
    } catch (err) {
      setGmailError(err.message || 'No se pudo completar la prueba.');
    } finally {
      setGmailLoading(false);
    }
  };

  const obtenerMensajesTemporales = async () => {
    setGmailMessagesError('');
    setGmailMessages(null);

    if (!gmailAddress || !gmailAccountToken) {
      setGmailMessagesError('Proporciona el address y token generados previamente.');
      return;
    }

    setGmailMessagesLoading(true);
    try {
      const response = await fetch('https://temporary-gmail-account.p.rapidapi.com/GmailGetMessages', {
        method: 'POST',
        headers: {
          'x-rapidapi-key': '48abc974dbmsh1dd911a04a25bccp1f725djsn8f411b999a1d',
          'x-rapidapi-host': 'temporary-gmail-account.p.rapidapi.com',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address: gmailAddress,
          token: gmailAccountToken
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Error al obtener los mensajes.');
      }

      const data = await response.json();
      setGmailMessages(data);

      const listaMensajes = Array.isArray(data?.messages)
        ? data.messages
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.result)
            ? data.result
            : Array.isArray(data)
              ? data
              : [];
      setSelectedMessageIndex(listaMensajes.length > 0 ? 0 : null);
    } catch (err) {
      setGmailMessagesError(err.message || 'No se pudieron obtener los mensajes.');
    } finally {
      setGmailMessagesLoading(false);
    }
  };

  const mensajesDisponibles = useMemo(() => {
    if (!gmailMessages) return [];
    if (Array.isArray(gmailMessages?.messages)) return gmailMessages.messages;
    if (Array.isArray(gmailMessages?.data)) return gmailMessages.data;
    if (Array.isArray(gmailMessages?.result)) return gmailMessages.result;
    if (Array.isArray(gmailMessages)) return gmailMessages;
    return [];
  }, [gmailMessages]);

  const mensajeSeleccionado =
    selectedMessageIndex !== null && selectedMessageIndex >= 0
      ? mensajesDisponibles[selectedMessageIndex] || null
      : null;

  return (
    <div>
      <style>{`
        .cc-form { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
        .cc-input-group { display: flex; flex-direction: column; gap: 4px; }
        .cc-input-label { font-size: 11px; color: #6b7280; font-weight: 600; }
        .cc-input { padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; }
        .cc-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1); }
        .cc-btn { border: 1px solid #a5b4fc; background: #eef2ff; color: #3730a3; border-radius: 6px; padding: 6px 10px; font-weight: 700; font-size: 12px; cursor: pointer; }
        .cc-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .cc-empty { padding: 6px 8px; background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; border-radius: 6px; font-size: 12px; margin-bottom: 8px; }
        .cc-mail-container { border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; background: #fff; margin-top: 12px; }
        .cc-mail-list { max-height: 260px; overflow-y: auto; border-bottom: 1px solid #e5e7eb; }
        .cc-mail-item { padding: 10px; border-bottom: 1px solid #f3f4f6; cursor: pointer; transition: background 0.2s ease; }
        .cc-mail-item:last-child { border-bottom: none; }
        .cc-mail-item:hover { background: #f4f4ff; }
        .cc-mail-item.active { background: #eef2ff; border-left: 4px solid #4f46e5; padding-left: 6px; }
        .cc-mail-item h5 { margin: 0 0 4px; font-size: 13px; color: #111827; }
        .cc-mail-item p { margin: 0; font-size: 11px; color: #6b7280; }
        .cc-mail-detail { padding: 12px; }
        .cc-mail-detail h5 { margin: 0 0 6px; font-size: 14px; color: #111827; }
        .cc-mail-detail span { display: block; font-size: 11px; color: #4b5563; margin-bottom: 4px; }
        .cc-mail-body { white-space: pre-wrap; font-size: 12px; color: #111827; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e5e7eb; }
        .cc-provider-btn { border: 1px dashed #c7d2fe; background: #f8faff; color: #312e81; border-radius: 10px; padding: 16px; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 10px; justify-content: center; }
        .cc-provider-btn:hover { background: #eef2ff; }
      `}</style>

      <h4 style={{ marginBottom: 6 }}>Correos Temporales</h4>
      <p style={{ fontSize: 11, color: '#9a3412', margin: '6px 0' }}>
        ⚠️ Esta clave está embebida solo para pruebas locales. No subir a producción.
      </p>

      {!showGmailTool && (
        <div style={{ display: 'grid', gap: 8, maxWidth: 320 }}>
          <button className="cc-provider-btn" type="button" onClick={() => setShowGmailTool(true)}>
            <span role="img" aria-label="gmail">📧</span>
            <span>Gmail temporal (RapidAPI)</span>
          </button>
        </div>
      )}

      {showGmailTool && (
        <>
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="cc-btn"
              type="button"
              onClick={() => setShowGmailTool(false)}
              style={{ background: '#fef3c7', borderColor: '#fdba74', color: '#9a3412' }}
            >
              ← Proveedores
            </button>
          </div>

          <div className="cc-form" style={{ marginTop: 8 }}>
            <div className="cc-input-group">
              <label className="cc-input-label">Generar nueva cuenta</label>
              <select
                className="cc-input"
                value={generateNewAccount}
                onChange={(e) => setGenerateNewAccount(e.target.value)}
              >
                <option value="0">0 - Reutilizar si existe</option>
                <option value="1">1 - Forzar cuenta nueva</option>
              </select>
            </div>
            <button
              className="cc-btn"
              type="button"
              onClick={probarApiTemporalGmail}
              disabled={gmailLoading}
            >
              {gmailLoading ? 'Probando…' : 'Generar cuenta'}
            </button>
          </div>

          {gmailError && <div className="cc-empty">{gmailError}</div>}
          {gmailResult && (
            <pre
              style={{
                background: '#111827',
                color: '#f3f4f6',
                padding: 12,
                borderRadius: 8,
                fontSize: 12,
                overflowX: 'auto'
              }}
            >
              {JSON.stringify(gmailResult, null, 2)}
            </pre>
          )}

          <div className="cc-section" style={{ marginTop: 16 }}>
            <h5 style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#1f2937' }}>Bandeja de mensajes</h5>
            <div className="cc-form" style={{ marginTop: 8 }}>
              <div className="cc-input-group">
                <label className="cc-input-label">Address generado</label>
                <input
                  className="cc-input"
                  type="text"
                  value={gmailAddress}
                  onChange={(e) => setGmailAddress(e.target.value)}
                  placeholder="Ej: cuenta-temporal@gmail.com"
                />
              </div>
              <div className="cc-input-group">
                <label className="cc-input-label">Token generado</label>
                <input
                  className="cc-input"
                  type="text"
                  value={gmailAccountToken}
                  onChange={(e) => setGmailAccountToken(e.target.value)}
                  placeholder="Token devuelto por GetAccount"
                />
              </div>
              <button
                className="cc-btn"
                type="button"
                onClick={obtenerMensajesTemporales}
                disabled={gmailMessagesLoading}
                style={{ marginTop: 4 }}
              >
                {gmailMessagesLoading ? 'Consultando…' : 'Obtener mensajes'}
              </button>
            </div>

            {gmailMessagesError && <div className="cc-empty">{gmailMessagesError}</div>}
            {mensajesDisponibles.length > 0 ? (
              <div className="cc-mail-container">
                <div className="cc-mail-list">
                  {mensajesDisponibles.map((msg, idx) => {
                    const asunto = msg?.subject || msg?.topic || 'Sin asunto';
                    const remitente = msg?.from || msg?.sender || 'Remitente desconocido';
                    const fecha = msg?.date || msg?.receivedAt || msg?.time || '';
                    const cuerpoPlano = typeof msg?.body === 'string' ? msg.body : '';
                    const resumen =
                      msg?.snippet ||
                      msg?.preview ||
                      msg?.summary ||
                      (cuerpoPlano ? `${cuerpoPlano.slice(0, 80)}${cuerpoPlano.length > 80 ? '…' : ''}` : '');
                    const activo = idx === selectedMessageIndex;
                    return (
                      <div
                        key={`${msg?.id || idx}`}
                        className={`cc-mail-item${activo ? ' active' : ''}`}
                        onClick={() => setSelectedMessageIndex(idx)}
                      >
                        <h5>{asunto}</h5>
                        <p><strong>De:</strong> {remitente}</p>
                        {fecha && <p><strong>Fecha:</strong> {fecha}</p>}
                        {resumen && <p>{resumen}</p>}
                      </div>
                    );
                  })}
                </div>
                {mensajeSeleccionado ? (
                  <div className="cc-mail-detail">
                    <h5>{mensajeSeleccionado.subject || mensajeSeleccionado.topic || 'Sin asunto'}</h5>
                    <span><strong>De:</strong> {mensajeSeleccionado.from || mensajeSeleccionado.sender || 'N/D'}</span>
                    {mensajeSeleccionado.to && (
                      <span><strong>Para:</strong> {Array.isArray(mensajeSeleccionado.to) ? mensajeSeleccionado.to.join(', ') : mensajeSeleccionado.to}</span>
                    )}
                    {mensajeSeleccionado.date && (
                      <span><strong>Fecha:</strong> {mensajeSeleccionado.date}</span>
                    )}
                    {mensajeSeleccionado.time && (
                      <span><strong>Hora:</strong> {mensajeSeleccionado.time}</span>
                    )}
                    {mensajeSeleccionado.cc && (
                      <span><strong>CC:</strong> {mensajeSeleccionado.cc}</span>
                    )}
                    {mensajeSeleccionado.replyTo && (
                      <span><strong>Responder a:</strong> {mensajeSeleccionado.replyTo}</span>
                    )}
                    {mensajeSeleccionado.body_html || mensajeSeleccionado.html ? (
                      <div
                        className="cc-mail-body"
                        dangerouslySetInnerHTML={{
                          __html: mensajeSeleccionado.body_html || mensajeSeleccionado.html
                        }}
                      />
                    ) : (
                      <div className="cc-mail-body">
                        {mensajeSeleccionado.body ||
                          mensajeSeleccionado.text ||
                          mensajeSeleccionado.snippet ||
                          'Sin contenido disponible.'}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="cc-mail-detail">
                    <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
                      Selecciona un mensaje para ver el contenido.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              gmailMessages && (
                <div className="cc-empty">
                  La API respondió sin mensajes listables. Revisa la consola para más detalles.
                </div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}

