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

const fmt = (n) => Math.round(n).toLocaleString('es-CO');

const PredictionForm = () => {
  const [selectedDay, setSelectedDay] = useState(todayIndex());
  const [plan, setPlan]               = useState(null);
  const [opt,  setOpt]                = useState(null);
  const [loading, setLoading]         = useState(false);
  const [loadingOpt, setLoadingOpt]   = useState(false);
  const [error, setError]             = useState(null);
  const [showOpt, setShowOpt]         = useState(false);
  const [tiempos, setTiempos]         = useState(null);
  const [loadingTiempos, setLoadingTiempos] = useState(false);
  const [showTiempos, setShowTiempos] = useState(false);

  const fetchPlan = useCallback(async (dayIdx) => {
    setLoading(true);
    setError(null);
    setPlan(null);
    setOpt(null);
    setShowOpt(false);
    setTiempos(null);
    setShowTiempos(false);
    try {
      const dia  = DAYS[dayIdx];
      const data = await apiService.getPlanDia(dia);
      if (data?.error) throw new Error(data.error);
      setPlan(data);
    } catch (err) {
      setError(err.message || 'Error al obtener el plan');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOpt = useCallback(async (dayIdx) => {
    setLoadingOpt(true);
    try {
      const dia  = DAYS[dayIdx];
      const data = await apiService.getOptimizacion(dia);
      if (data?.error) throw new Error(data.error);
      setOpt(data);
      setShowOpt(true);
    } catch (err) {
      setError(err.message || 'Error al optimizar');
    } finally {
      setLoadingOpt(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan(selectedDay);
  }, [selectedDay, fetchPlan]);

  const fetchTiempos = useCallback(async (dayIdx) => {
    setLoadingTiempos(true);
    try {
      const data = await apiService.getOptimizacionTiempos(DAYS[dayIdx]);
      if (data?.error) throw new Error(data.error);
      setTiempos(data);
      setShowTiempos(true);
    } catch (err) {
      setError(err.message || 'Error al calcular tiempos');
    } finally {
      setLoadingTiempos(false);
    }
  }, []);

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

          {/* ── Botón optimizar ── */}
          {!showOpt && (
            <div className="opt-trigger">
              <button
                className="opt-btn"
                onClick={() => fetchOpt(selectedDay)}
                disabled={loadingOpt}
              >
                {loadingOpt
                  ? <><span className="loading-spinner" /> Calculando optimización…</>
                  : '💡 Maximizar ingresos con IO'}
              </button>
              <p className="opt-hint">
                Programación Lineal: calcula el mix de servicios que maximiza tus ingresos
                dado la capacidad real de empleados y demanda predicha.
              </p>
            </div>
          )}

          {/* ── Panel de optimización ── */}
          {showOpt && opt && (
            <div className="opt-panel">
              <div className="opt-panel-header">
                <h3>Optimización de Ingresos — {DAYS[selectedDay]}</h3>
                <button className="opt-close" onClick={() => setShowOpt(false)}>✕</button>
              </div>

              {/* KPIs de optimización */}
              <div className="opt-kpis">
                <div className="opt-kpi opt-kpi--green">
                  <p className="opt-kpi-label">Ingreso óptimo total</p>
                  <p className="opt-kpi-value">${fmt(opt.total_optimo)}</p>
                </div>
                <div className="opt-kpi opt-kpi--gray">
                  <p className="opt-kpi-label">Sin optimizar</p>
                  <p className="opt-kpi-value">${fmt(opt.total_promedio)}</p>
                </div>
                <div className="opt-kpi opt-kpi--blue">
                  <p className="opt-kpi-label">Ganancia adicional</p>
                  <p className="opt-kpi-value">+${fmt(opt.ganancia_adicional)}</p>
                </div>
                <div className="opt-kpi opt-kpi--orange">
                  <p className="opt-kpi-label">Mejora estimada</p>
                  <p className="opt-kpi-value">+{opt.pct_mejora}%</p>
                </div>
              </div>

              {/* Servicios y popularidad */}
              {opt.servicios && opt.servicios.length > 0 && (
                <div className="opt-services">
                  <h4>Servicios en el modelo</h4>
                  <div className="opt-svc-list">
                    {opt.servicios.map((s) => (
                      <div key={s.name} className="opt-svc-item">
                        <span className="opt-svc-name">{s.name}</span>
                        <span className="opt-svc-price">${fmt(s.price)}</span>
                        <div className="opt-svc-bar-wrap">
                          <div
                            className="opt-svc-bar"
                            style={{ width: `${Math.min(100, s.popularity)}%` }}
                          />
                        </div>
                        <span className="opt-svc-pop">{s.popularity}% demanda</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mix por hora */}
              <div className="opt-hours">
                <h4>Mix óptimo por franja horaria</h4>
                <div className="opt-hour-table">
                  <div className="oht-header">
                    <span>Hora</span>
                    <span>Mix recomendado</span>
                    <span>Ingreso óptimo</span>
                    <span>Sin optimizar</span>
                    <span>Capacidad</span>
                  </div>
                  {opt.horas && opt.horas.map((h) => (
                    <div key={h.hora} className="oht-row">
                      <span className="oht-hora">{h.hora}:00</span>
                      <span className="oht-mix">
                        {Object.entries(h.mix_optimo || {}).map(([svc, qty]) => (
                          <span key={svc} className="mix-tag">
                            {svc} ×{qty}
                          </span>
                        ))}
                      </span>
                      <span className="oht-opt">${fmt(h.ingreso_optimo)}</span>
                      <span className="oht-avg">${fmt(h.ingreso_promedio)}</span>
                      <span className="oht-cap">{h.capacidad_usada}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* ── Botón tiempos ── */}
          {!showTiempos && (
            <div className="opt-trigger">
              <button
                className="opt-btn opt-btn--teal"
                onClick={() => fetchTiempos(selectedDay)}
                disabled={loadingTiempos}
              >
                {loadingTiempos
                  ? <><span className="loading-spinner" /> Calculando…</>
                  : '⏱ Optimizar tiempos de espera (M/M/c + SPT)'}
              </button>
              <p className="opt-hint">
                Teoría de colas M/M/c: calcula el tiempo de espera por servicio según empleados disponibles.
                SPT ordena los servicios para minimizar la espera promedio del cliente.
              </p>
            </div>
          )}

          {/* ── Panel tiempos ── */}
          {showTiempos && tiempos && (
            <div className="opt-panel opt-panel--teal">
              <div className="opt-panel-header">
                <h3>Optimización de Tiempos — {DAYS[selectedDay]}</h3>
                <button className="opt-close" onClick={() => setShowTiempos(false)}>✕</button>
              </div>

              {/* Orden SPT */}
              {tiempos.spt && (
                <div className="spt-section">
                  <h4>Orden óptimo de atención (SPT)</h4>
                  <p className="spt-desc">{tiempos.spt.descripcion}</p>
                  <div className="spt-list">
                    {tiempos.spt.orden && tiempos.spt.orden.map((s, i) => (
                      <div key={s.nombre} className="spt-item">
                        <span className="spt-rank">#{i + 1}</span>
                        <span className="spt-name">{s.nombre}</span>
                        <span className="spt-dur">{s.duracion_min} min</span>
                        <span className="spt-price">${fmt(s.precio)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabla por hora — mostrar hora pico */}
              <h4 style={{ marginTop: '1.2rem', fontSize: '0.85rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Análisis por franja horaria
              </h4>
              {tiempos.horas && tiempos.horas
                .filter(h => h.demanda > 0)
                .map(h => (
                  <div key={h.hora} className="tq-hora-block">
                    <div className="tq-hora-title">
                      <span className="tq-hora-label">{h.hora}:00</span>
                      <span className="tq-demanda">{h.demanda} autos/h esperados</span>
                    </div>
                    <div className="tq-svc-table">
                      <div className="tq-header">
                        <span>Servicio</span>
                        <span>Duración</span>
                        <span>Espera actual</span>
                        <span>Emp. óptimos</span>
                        <span>Espera óptima</span>
                        <span>Throughput</span>
                      </div>
                      {h.servicios && h.servicios.map(s => (
                        <div key={s.servicio} className={`tq-row${s.espera_actual_min > 15 ? ' tq-warn' : ''}`}>
                          <span className="tq-svc">{s.servicio}</span>
                          <span>{s.duracion_min} min</span>
                          <span className={s.espera_actual_min > 15 ? 'tq-red' : s.espera_actual_min > 5 ? 'tq-orange' : 'tq-green'}>
                            {s.espera_actual_min >= 999 ? '∞' : `${s.espera_actual_min} min`}
                          </span>
                          <span className="tq-emp">{s.empleados_optimo} emp</span>
                          <span className="tq-green">
                            {s.espera_optima_min >= 999 ? '∞' : `${s.espera_optima_min} min`}
                          </span>
                          <span>{s.throughput_hora}/h</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PredictionForm;
