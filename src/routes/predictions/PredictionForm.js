import React, { useState, useEffect, useCallback } from 'react';
import './PredictionForm.css';
import { apiService } from '../../api/apiService';

const DAYS = ['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo'];
const DAY_LABELS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

const todayIndex = () => {
  const d = new Date().getDay(); // 0=Dom
  return d === 0 ? 6 : d - 1;   // convertir a 0=Lun
};

const DEMAND_COLOR = { Alto: '#43a047', Medio: '#fb8c00', Bajo: '#e53935' };
const DEMAND_ICON  = { Alto: '🔥', Medio: '📈', Bajo: '📉' };

const PredictionForm = () => {
  const [selectedDay, setSelectedDay] = useState(todayIndex());
  const [plan, setPlan]               = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  const fetchPlan = useCallback(async (dayIdx) => {
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const dia = DAYS[dayIdx];
      const data = await apiService.getPlanDia(dia);
      if (data?.error) throw new Error(data.error);
      setPlan(data);
    } catch (err) {
      setError(err.message || 'Error al obtener el plan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan(selectedDay);
  }, [selectedDay, fetchPlan]);

  const handleDay = (idx) => setSelectedDay(idx);

  const maxHistorico = plan
    ? Math.max(1, ...plan.horas.map((h) => h.historico || 0))
    : 1;

  const resumen = plan?.resumen || {};

  return (
    <div className="plan-container">
      {/* ── Header ── */}
      <div className="plan-header">
        <h2>Plan del Día</h2>
        <p className="plan-subtitle">
          Predicción inteligente basada en el historial real de tu negocio
        </p>
      </div>

      {/* ── Selector de día ── */}
      <div className="day-tabs">
        {DAYS.map((d, i) => (
          <button
            key={d}
            className={`day-tab${selectedDay === i ? ' active' : ''}${i === todayIndex() ? ' today' : ''}`}
            onClick={() => handleDay(i)}
          >
            <span className="day-tab-label">{DAY_LABELS[i]}</span>
            {i === todayIndex() && <span className="today-dot" />}
          </button>
        ))}
      </div>

      {loading && (
        <div className="plan-loading">
          <div className="loading-spinner" />
          <span>Analizando {DAYS[selectedDay]}…</span>
        </div>
      )}

      {error && (
        <div className="plan-error">
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {plan && !loading && (
        <>
          {/* ── Tarjetas de resumen ── */}
          <div className="summary-cards">
            <div className="scard" style={{ borderTop: `4px solid ${DEMAND_COLOR[resumen.demanda_general] || '#6e8efb'}` }}>
              <span className="scard-icon">{DEMAND_ICON[resumen.demanda_general] || '📊'}</span>
              <div>
                <p className="scard-label">Demanda general</p>
                <p className="scard-value" style={{ color: DEMAND_COLOR[resumen.demanda_general] }}>
                  {resumen.demanda_general || '—'}
                </p>
              </div>
            </div>

            <div className="scard" style={{ borderTop: '4px solid #4361ee' }}>
              <span className="scard-icon">⏰</span>
              <div>
                <p className="scard-label">Hora pico</p>
                <p className="scard-value">{resumen.hora_pico != null ? `${resumen.hora_pico}:00` : '—'}</p>
              </div>
            </div>

            <div className="scard" style={{ borderTop: '4px solid #0288d1' }}>
              <span className="scard-icon">👷</span>
              <div>
                <p className="scard-label">Empleados recomendados</p>
                <p className="scard-value">{resumen.empleados_max ?? '—'}</p>
              </div>
            </div>

            <div className="scard" style={{ borderTop: '4px solid #7b1fa2' }}>
              <span className="scard-icon">🚗</span>
              <div>
                <p className="scard-label">Autos estimados</p>
                <p className="scard-value">{resumen.lavados_estimados ?? '—'}</p>
              </div>
            </div>

            {resumen.servicio_top && (
              <div className="scard" style={{ borderTop: '4px solid #f57c00' }}>
                <span className="scard-icon">⭐</span>
                <div>
                  <p className="scard-label">Servicio más pedido</p>
                  <p className="scard-value">{resumen.servicio_top}</p>
                </div>
              </div>
            )}

            {resumen.ingreso_estimado > 0 && (
              <div className="scard" style={{ borderTop: '4px solid #43a047' }}>
                <span className="scard-icon">💰</span>
                <div>
                  <p className="scard-label">Ingreso estimado</p>
                  <p className="scard-value">
                    ${resumen.ingreso_estimado.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Gráfico horario ── */}
          <div className="hour-chart-card">
            <h3 className="chart-title">
              Demanda hora por hora — <strong>{DAYS[selectedDay]}</strong>
            </h3>
            <div className="hour-chart">
              {plan.horas.map((h) => {
                const pct = maxHistorico > 0 ? (h.historico / maxHistorico) * 100 : 20;
                const color = DEMAND_COLOR[h.prediccion] || '#6e8efb';
                return (
                  <div key={h.hora} className="hbar-col">
                    <span className="hbar-pred" style={{ color }}>{DEMAND_ICON[h.prediccion]}</span>
                    <div className="hbar-wrap">
                      <div
                        className="hbar-fill"
                        style={{ height: `${Math.max(pct, 6)}%`, background: color }}
                        title={`${h.hora}:00 → ${h.prediccion} (${h.historico} histórico)`}
                      />
                    </div>
                    <span className="hbar-label">{h.hora}</span>
                    <span className="hbar-emp" title="Empleados recomendados">
                      {'👷'.repeat(h.empleados)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="chart-legend">
              {Object.entries(DEMAND_COLOR).map(([k, v]) => (
                <span key={k} className="legend-item">
                  <span className="legend-dot" style={{ background: v }} />
                  {k}
                </span>
              ))}
            </div>
          </div>

          {/* ── Tabla detalle por hora ── */}
          <div className="hour-table-card">
            <h3 className="chart-title">Detalle por franja horaria</h3>
            <div className="hour-table">
              <div className="ht-header">
                <span>Hora</span>
                <span>Demanda</span>
                <span>Confianza</span>
                <span>Empleados</span>
                <span>Histórico</span>
              </div>
              {plan.horas.map((h) => (
                <div key={h.hora} className={`ht-row${h.hora === resumen.hora_pico ? ' ht-peak' : ''}`}>
                  <span className="ht-hora">
                    {h.hora}:00
                    {h.hora === resumen.hora_pico && <span className="peak-badge">Pico</span>}
                  </span>
                  <span className="ht-pred" style={{ color: DEMAND_COLOR[h.prediccion] }}>
                    {DEMAND_ICON[h.prediccion]} {h.prediccion}
                  </span>
                  <span className="ht-conf">{h.confianza}</span>
                  <span className="ht-emp">{h.empleados} personas</span>
                  <span className="ht-hist">{h.historico} lavados</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PredictionForm;
