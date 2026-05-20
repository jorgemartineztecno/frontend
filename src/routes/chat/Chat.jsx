import React, { useState, useRef, useEffect } from 'react';
import { apiService } from '../../api/apiService';
import './Chat.css';

const Chat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: '¡Hola! Soy el asistente de San Felipe. ¿En qué te ayudo?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [open, messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      // const data = await apiService.sendChatMessage(text);
      // setMessages((prev) => [...prev, { role: 'assistant', text: data.response }]);
      const xaiApiKey = process.env.RSBUILD_XAI_API_KEY;
      if (!xaiApiKey) {
        setMessages((prev) => [...prev, { role: 'assistant', text: '⚠️ API key for X.ai is not configured.' }]);
        setLoading(false);
        return;
      }

      const response = await fetch("https://api.x.ai/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${xaiApiKey}`,
        },
        body: JSON.stringify({
          model: "grok-4.20-reasoning",
          input: text,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || "Error from X.ai API");
      }

      const data = await response.json();
      const assistantMessage = data.response || "No se recibió respuesta.";
      setMessages((prev) => [...prev, { role: 'assistant', text: assistantMessage }]);
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
      setLoading(false);
    }
  };

  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-popup">
          <div className="chat-popup-header">
            <div className="chat-popup-title">
              <div className="chat-avatar-sm">SF</div>
              <div>
                <p className="chat-popup-name">Asistente San Felipe</p>
                <span className="chat-popup-status">● En línea · Gemini AI</span>
              </div>
            </div>
            <button className="chat-close-btn" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="chat-popup-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role}`}>
                {msg.role === 'assistant' && <div className="chat-avatar-xs">SF</div>}
                <div className="chat-msg-bubble">{msg.text}</div>
              </div>
            ))}
            {loading && (
              <div className="chat-msg assistant">
                <div className="chat-avatar-xs">SF</div>
                <div className="chat-msg-bubble typing">
                  <span /><span /><span />
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
