import React from 'react';
import { FaWhatsapp, FaInstagram, FaFacebookF } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  const whatsappNumber = "+573003438619";
  const whatsappMessage = "Hola, estoy interesado en sus servicios de lavado";
  
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <footer className="footer">
      <div className="footer-icons">
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" title="Contactar por WhatsApp">
          <FaWhatsapp className="footer-icon" style={{ color: '#25D366' }} />
        </a>
        <a href="https://instagram.com/tu_perfil" target="_blank" rel="noopener noreferrer" title="Síguenos en Instagram">
          <FaInstagram className="footer-icon" style={{ color: '#E1306C' }} />
        </a>
        <a href="https://facebook.com/tu_pagina" target="_blank" rel="noopener noreferrer" title="Síguenos en Facebook">
          <FaFacebookF className="footer-icon" style={{ color: '#1877F2' }} />
        </a>
      </div>
      <div className="footer-copyright">
        ©2024 LAVAUTOS SAN FELIPE
      </div>
    </footer>
  );
};

export default Footer;