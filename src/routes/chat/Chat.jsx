import React, { useState, useRef, useEffect } from 'react';
import { apiService } from '../../api/apiService';
import './Chat.css';

const INITIAL_MESSAGE = {
  role: 'assistant',
  text: '¡Hola! Soy tu asistente. Puedo consultar clientes, servicios, empleados y registrar lavados. ¿En qué te ayudo?',
};

const SUGGESTIONS = [
  '¿Cuáles son nuestros servicios?',
  'Muéstrame los clientes registrados',
  'Registra un nuevo cliente',
  '¿Cuántos lavados hay esta semana?',
];

// Renderizador simple de markdown para el chat
const renderText = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let keyIdx = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Línea vacía → espacio
    if (line.trim() === '') {
      elements.push(<div key={keyIdx++} style={{ height: '6px' }} />);
      continue;
    }

    // Elemento de lista: "- texto" o "• texto"
    if (/^[-•*]\s+/.test(line.trim())) {
      const content = line.trim().replace(/^[-•*]\s+/, '');
      elements.push(
        <div key={keyIdx++} className="chat-list-item">
          <span className="chat-bullet">•</span>
          <span>{applyInline(content)}</span>
        </div>
      );
      continue;
    }

    // Encabezado simple: línea que termina en ":"
    if (/^[A-ZÁÉÍÓÚ].*:$/.test(line.trim()) && line.trim().length < 60) {
      elements.push(
        <p key={keyIdx++} className="chat-section-title">{line.trim()}</p>
      );
      continue;
    }

    // Línea normal
    elements.push(<p key={keyIdx++} className="chat-text-line">{applyInline(line)}</p>);
  }

  return elements;
};

// Aplica negrita e itálica dentro de una línea
const applyInline = (text) => {
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const italicMatch = remaining.match(/\*(.+?)\*/);

    let firstMatch = null;
    let matchType = null;

    if (boldMatch && italicMatch) {
      firstMatch = boldMatch.index <= italicMatch.index ? boldMatch : italicMatch;
      matchType = boldMatch.index <= italicMatch.index ? 'bold' : 'italic';
    } else if (boldMatch) {
      firstMatch = boldMatch;
      matchType = 'bold';
    } else if (italicMatch) {
      firstMatch = italicMatch;
      matchType = 'italic';
    }

    if (!firstMatch) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    // Texto antes del match
    if (firstMatch.index > 0) {
      parts.push(<span key={key++}>{remaining.slice(0, firstMatch.index)}</span>);
    }

    // El match en sí
    if (matchType === 'bold') {
      parts.push(<strong key={key++}>{firstMatch[1]}</strong>);
      remaining = remaining.slice(firstMatch.index + firstMatch[0].length);
    } else {
      parts.push(<em key={key++}>{firstMatch[1]}</em>);
      remaining = remaining.slice(firstMatch.index + firstMatch[0].length);
    }
  }

  return parts.length > 0 ? parts : text;
};

const Chat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Procesando...');
  const [sessionId, setSessionId] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      inputRef.current?.focus();
    }
  }, [open, messages]);

  const send = async (text) => {
    if (!text.trim() || loading) return;

    const updatedMessages = [...messages, { role: 'user', text }];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setLoadingText('Procesando...');

    const timer = setTimeout(() => setLoadingText('Consultando base de datos...'), 1800);

    try {
      const history = updatedMessages
        .slice(1)
        .slice(0, -1)
        .map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.text,
        }));

      const data = await apiService.sendChatMessage(text, history, sessionId);
      if (data.sessionId && !sessionId) setSessionId(data.sessionId);
      setMessages((prev) => [...prev, { role: 'assistant', text: data.response }]);
    } catch (err) {
      let errorMsg = 'Error al conectar con el asistente. Intenta de nuevo.';
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
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar">SF</div>
              <div>
                <p className="chat-title">Asistente San Felipe</p>
                <span className="chat-status">
                  <span className="chat-dot" />
                  En línea · Acceso a base de datos
                </span>
              </div>
            </div>
            <div className="chat-header-actions">
              <button className="chat-icon-btn" onClick={handleClear} title="Nueva conversación">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.1"/>
                </svg>
              </button>
              <button className="chat-icon-btn" onClick={() => setOpen(false)} title="Cerrar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Mensajes */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-bubble-wrap ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="chat-avatar-xs">SF</div>
                )}
                <div className={`chat-bubble ${msg.role}`}>
                  {msg.role === 'assistant'
                    ? renderText(msg.text)
                    : <p className="chat-text-line">{msg.text}</p>
                  }
                </div>
              </div>
            ))}

            {showSuggestions && (
              <div className="chat-suggestions">
                <p className="chat-suggestions-label">Sugerencias</p>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} className="chat-suggestion" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="chat-bubble-wrap assistant">
                <div className="chat-avatar-xs">SF</div>
                <div className="chat-bubble assistant chat-loading-bubble">
                  <div className="chat-dots">
                    <span /><span /><span />
                  </div>
                  <span className="chat-loading-label">{loadingText}</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form className="chat-input-bar" onSubmit={handleSend}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu consulta..."
              disabled={loading}
              className="chat-input"
            />
            <button type="submit" disabled={loading || !input.trim()} className="chat-send-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </form>
        </div>
      )}

      <button
        className="chat-fab"
        onClick={() => setOpen((p) => !p)}
        title="Asistente IA"
      >
        {open
          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
        }
      </button>
    </div>
  );
};

export default Chat;
