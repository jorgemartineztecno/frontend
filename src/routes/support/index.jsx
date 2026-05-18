import React, { useState } from "react";
import "./Support.css";

export default function Support() {
  const [form, setForm] = useState({ nombre: "", email: "", asunto: "", mensaje: "" });
  const [enviado, setEnviado] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí iría la lógica para enviar el formulario (API, email, etc.)
    setEnviado(true);
  };

  return (
    <div className="soporte-container">
      <div className="soporte-card">
        <h2>Soporte</h2>
        <p>¿Tienes alguna pregunta o inconveniente? Completa el formulario y nuestro equipo te responderá a la brevedad.</p>
        {!enviado ? (
          <form className="soporte-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="nombre"
              placeholder="Nombre"
              value={form.nombre}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Correo electrónico"
              value={form.email}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="asunto"
              placeholder="Asunto"
              value={form.asunto}
              onChange={handleChange}
              required
            />
            <textarea
              name="mensaje"
              placeholder="Escribe tu mensaje"
              value={form.mensaje}
              onChange={handleChange}
              required
              rows={4}
            />
            <button type="submit">Enviar mensaje</button>
          </form>
        ) : (
          <div className="soporte-confirmacion">
            <h4>¡Mensaje enviado!</h4>
            <p>Gracias por contactarnos. Te responderemos pronto.</p>
          </div>
        )}
        <div className="soporte-contacto">
          <h4>Contacto directo</h4>
          <p><strong>Email:</strong> soporte@tuempresa.com</p>
          <p><strong>Teléfono:</strong> +52 123 456 7890</p>
          <p><strong>Horario:</strong> Lunes a Viernes, 9:00 a 18:00</p>
        </div>
      </div>
    </div>
  );
}
