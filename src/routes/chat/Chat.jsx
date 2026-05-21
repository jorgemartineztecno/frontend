import React, { useState, useRef, useEffect } from 'react';
import { apiService } from '../../api/apiService';
import './Chat.css';

const INITIAL_MESSAGE = {
  role: 'assistant',
  text: '¡Hola! Soy el asistente de San Felipe. Puedo consultar y registrar información en el sistema. ¿En qué te ayudo?',
};

const SUGGESTIONS = [
  '¿Qué clientes están registrados?',
  'Registra un nuevo cliente',
  '¿Qué servicios ofrecemos?',
  'Registra un lavado',
];

const Chat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Pensando...');
  const [sessionId, setSessionId] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [open, messages]);

  const send = async (text) => {
    if (!text.trim() || loading) return;

    const updatedMessages = [...messages, { role: 'user', text }];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setLoadingText('Pensando...');

    // Simular progreso visual mientras el agente consulta herramientas
    const timer = setTimeout(() => setLoadingText('Consultando base de datos...'), 1500);

    try {
      const history = updatedMessages
        .slice(1)       // omitir mensaje de bienvenida
        .slice(0, -1)   // omitir el mensaje actual
        .map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.text,
        }));

      const data = await apiService.sendChatMessage(text, history, sessionId);
      if (data.sessionId && !sessionId) setSessionId(data.sessionId);
      setMessages((prev) => [...prev, { role: 'assistant', text: data.response }]);
    } catch (err) {
      let errorMsg = 'Lo siento, ocurrió un error al conectar con el asistente.';
      try {
        const parsed = JSON.parse(err.message);
        if (parsed?.error) errorMsg = parsed.error;
      } catch {
        if (err.message) errorMsg = err.message;
      }
      setMessages((prev) => [...prev, { role: 'assistant', text: '⚠️ ' + errorMsg }]);
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    send(input.trim());
  };

  const handleSuggestion = (text) => send(text);

  const handleClear = () => {
    setMessages([INITIAL_MESSAGE]);
    setInput('');
    setSessionId(null);
  };

  const showSuggestions = messages.length === 1 && !loading;

  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-popup">
          <div className="chat-popup-header">
            <div className="chat-popup-title">
              <div className="chat-avatar-sm">SF</div>
              <div>
                <p className="chat-popup-name">Asistente San Felipe</p>
                <span className="chat-popup-status">● En línea · Grok AI</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="chat-close-btn" onClick={handleClear} title="Nueva conversación">↺</button>
              <button className="chat-close-btn" onClick={() => setOpen(false)}>✕</button>
            </div>
          </div>

          <div className="chat-popup-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role}`}>
                {msg.role === 'assistant' && <div className="chat-avatar-xs">SF</div>}
                <div className="chat-msg-bubble">{msg.text}</div>
              </div>
            ))}

            {showSuggestions && (
              <div className="chat-suggestions">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} className="chat-suggestion-btn" onClick={() => handleSuggestion(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="chat-msg assistant">
                <div className="chat-avatar-xs">SF</div>
                <div className="chat-msg-bubble typing-wrap">
                  <div className="chat-msg-bubble typing">
                    <span /><span /><span />
                  </div>
                  <span className="chat-loading-text">{loadingText}</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form className="chat-popup-input" onSubmit={handleSend}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe un mensaje..."
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              ➤
            </button>
          </form>
        </div>
      )}

      <button className="chat-fab" onClick={() => setOpen((prev) => !prev)} title="Asistente IA">
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
};

export default Chat;
