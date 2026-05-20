import React, { useState } from 'react';
import './PowerBIPage.css';

const POWERBI_URL =
  'https://app.powerbi.com/view?r=eyJrIjoiOTYyYWIzMTUtMTViNy00YTgxLThjMTQtZDA4NTE2ZDVlMmZiIiwidCI6IjlkMTJiZjNmLWU0ZjYtNDdhYi05MTJmLTFhMmYwZmM0OGFhNCIsImMiOjR9';

const PowerBIPage = () => {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <div className={`pbi-page${fullscreen ? ' pbi-page--full' : ''}`}>
      <div className="pbi-header">
        <div className="pbi-header-left">
          <span className="pbi-icon">📊</span>
          <div>
            <h2>Dashboard de Reportes</h2>
            <p>Reportes y analítica avanzada del negocio en tiempo real</p>
          </div>
        </div>
        <div className="pbi-header-actions">
          <button
            className="pbi-btn pbi-btn--ghost"
            onClick={() => setFullscreen(f => !f)}
            title={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {fullscreen ? (
              <><i className="fas fa-compress-alt" /> Salir</>
            ) : (
              <><i className="fas fa-expand-alt" /> Pantalla completa</>
            )}
          </button>
          <a
            href={POWERBI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="pbi-btn pbi-btn--primary"
          >
            <i className="fas fa-external-link-alt" /> Abrir en Power BI
          </a>
        </div>
      </div>

      <div className="pbi-frame-wrap">
        <iframe
          title="Dashboard Power BI"
          src={POWERBI_URL}
          frameBorder="0"
          allowFullScreen
          className="pbi-iframe"
        />
      </div>
    </div>
  );
};

export default PowerBIPage;
