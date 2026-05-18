import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import './PredictionHistory.css';
import { apiService } from '../../api/apiService';
import DataTable from '../../components/DataTable';

const PredictionHistory = () => {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const data = await apiService.getPredictionHistory();
        setHistory(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(history);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), 'historial_predicciones.xlsx');
  };

  const columns = [
    { key: 'id',               title: 'ID' },
    { key: 'diaSemana',        title: 'Día' },
    { key: 'jornada',          title: 'Jornada' },
    { key: 'clima',            title: 'Clima' },
    { key: 'temperatura',      title: 'Temp.',   render: (r) => `${r.temperatura}°C` },
    { key: 'tipoServicio',     title: 'Servicio' },
    { key: 'historialVisitas', title: 'Visitas' },
    { key: 'promocionesActivas', title: 'Promo.' },
    {
      key: 'clientesEstimados',
      title: 'Estimados',
      render: (r) => (
        <span className={`pred-badge pred-badge--${(r.clientesEstimados || '').toLowerCase()}`}>
          {r.clientesEstimados}
        </span>
      ),
    },
    {
      key: 'confianza',
      title: 'Confianza',
      render: (r) => (
        <div className="conf-cell">
          <span className="conf-pct">{r.confianza}%</span>
          <div className="conf-bar">
            <div className="conf-fill" style={{ width: `${r.confianza}%` }} />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="ph-container">
      <div className="ph-header">
        <h2 className="ph-title">Historial de Predicciones</h2>
        {history.length > 0 && (
          <button className="ph-export-btn" onClick={exportToExcel}>
            Exportar Excel
          </button>
        )}
      </div>

      {error && <div className="ph-error">{error}</div>}

      {loading ? (
        <div className="ph-loading">
          <div className="ph-spinner" />
          <p>Cargando historial...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={history}
          emptyMessage="No hay predicciones registradas."
          pageSize={10}
        />
      )}
    </div>
  );
};

export default PredictionHistory;
