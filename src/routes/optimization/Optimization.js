import React, { useState, useCallback } from 'react';
import './Optimization.css';
import { apiService } from '../../api/apiService';

const DAYS = ['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo'];
const DAY_LABELS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const todayIndex = () => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; };
const fmt = (n) => Math.round(n).toLocaleString('es-CO');

const Optimization = () => {
  const [selectedDay, setSelectedDay] = useState(todayIndex());
  const [activeTab, setActiveTab]     = useState('ingresos');

  const [opt,          setOpt]          = useState(null);
  const [tiempos,      setTiempos]      = useState(null);
  const [loadingOpt,   setLoadingOpt]   = useState(false);
  const [loadingTiempos, setLoadingTiempos] = useState(false);
  const [error,        setError]        = useState(null);

  const fetchOpt = useCallback(async (dayIdx) => {
    setLoadingOpt(true); setError(null); setOpt(null);
    try {
      const data = await apiService.getOptimizacion(DAYS[dayIdx]);
      if (data?.error) throw new Error(data.error);
      setOpt(data);
    } catch (e) { setError(e.message); }
    finally { setLoadingOpt(false); }
  }, []);

  const fetchTiempos = useCallback(async (dayIdx) => {
    setLoadingTiempos(true); setError(null); setTiempos(null);
    try {
      const data = await apiService.getOptimizacionTiempos(DAYS[dayIdx]);
      if (data?.error) throw new Error(data.error);
      setTiempos(data);
    } catch (e) { setError(e.message); }
    finally { setLoadingTiempos(false); }
  }, []);

  const handleDay = (idx) => {
    setSelectedDay(idx);
    setOpt(null); setTiempos(null); setError(null);
  };

  const handleAnalizar = () => {
    if (activeTab === 'ingresos') fetchOpt(selectedDay);
    else fetchTiempos(selectedDay);
  };

  return (
    <div className="opt-page">
      {/* Header */}
      <div className="opt-page-header">
        <h2>Investigación de Operaciones</h2>
        <p>Modelos de optimización basados en tus datos reales del negocio</p>
      </div>

      {/* Tabs de modelo */}
      <div className="model-tabs">
        <button
          className={`model-tab${activeTab === 'ingresos' ? ' active' : ''}`}
          onClick={() => { setActiveTab('ingresos'); setOpt(null); setError(null); }}
        >
          <span className="model-tab-icon">💰</span>
          <div>
            <p className="model-tab-title">Maximización de Ingresos</p>
            <p className="model-tab-sub">Programación Lineal (LP)</p>
          </div>
        </button>
        <button
          className={`model-tab${activeTab === 'tiempos' ? ' active' : ''}`}
          onClick={() => { setActiveTab('tiempos'); setTiempos(null); setError(null); }}
        >
          <span className="model-tab-icon">⏱</span>
          <div>
            <p className="model-tab-title">Optimización de Tiempos</p>
            <p className="model-tab-sub">Colas M/M/c + Scheduling SPT</p>
          </div>
        </button>
      </div>

      {/* Descripción del modelo seleccionado */}
      <div className="model-desc">
        {activeTab === 'ingresos' ? (
          <>
            <strong>Programación Lineal:</strong> Dado el número de empleados disponibles
            y la demanda predicha por hora, calcula cuántos lavados de cada servicio
            realizar para <strong>maximizar los ingresos del día</strong>.
          </>
        ) : (
          <>
            <strong>M/M/c (Teoría de Colas):</strong> Calcula el tiempo de espera promedio
            por servicio según empleados y tasa de llegada. <strong>SPT (Shortest Processing Time)</strong> determina
            el orden óptimo de atención para minimizar la espera de tus clientes.
          </>
        )}
      </div>

      {/* Selector de día + botón */}
      <div className="opt-controls">
        <div className="day-tabs">
          {DAYS.map((d, i) => (
            <button
              key={d}
              className={`day-tab${selectedDay === i ? ' active' : ''}${i === todayIndex() ? ' today' : ''}`}
              onClick={() => handleDay(i)}
            >
              <span>{DAY_LABELS[i]}</span>
              {i === todayIndex() && <span className="today-dot" />}
            </button>
          ))}
        </div>
        <button
          className={`run-btn${activeTab === 'tiempos' ? ' run-btn--teal' : ''}`}
          onClick={handleAnalizar}
          disabled={loadingOpt || loadingTiempos}
        >
          {(loadingOpt || loadingTiempos)
            ? <><span className="loading-spinner" /> Calculando…</>
            : `Optimizar ${DAYS[selectedDay]}`}
        </button>
      </div>

      {error && <div className="opt-error"><span>⚠️</span><p>{error}</p></div>}

      {/* ── PANEL INGRESOS (LP) ── */}
      {activeTab === 'ingresos' && opt && (
        <div className="result-panel">
          {/* KPIs */}
          <div className="kpi-grid">
            <div className="kpi kpi--green">
              <p className="kpi-label">Ingreso óptimo</p>
              <p className="kpi-value">${fmt(opt.total_optimo)}</p>
            </div>
            <div className="kpi kpi--gray">
              <p className="kpi-label">Sin optimizar</p>
              <p className="kpi-value">${fmt(opt.total_promedio)}</p>
            </div>
            <div className="kpi kpi--blue">
              <p className="kpi-label">Ganancia adicional</p>
              <p className="kpi-value">+${fmt(opt.ganancia_adicional)}</p>
            </div>
            <div className="kpi kpi--orange">
              <p className="kpi-label">Mejora estimada</p>
              <p className="kpi-value">+{opt.pct_mejora}%</p>
            </div>
          </div>

          {/* Barra comparativa */}
          <div className="compare-bar-wrap">
            <div className="compare-bar-label">
              <span>Sin optimizar</span>
              <span>Óptimo</span>
            </div>
            <div className="compare-bar">
              <div
                className="compare-bar-fill"
                style={{ width: `${Math.min(100, (opt.total_optimo / Math.max(1, opt.total_optimo)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Servicios */}
          {opt.servicios?.length > 0 && (
            <div className="svc-section">
              <h4>Servicios en el modelo</h4>
              <div className="svc-grid">
                {opt.servicios.map(s => (
                  <div key={s.name} className="svc-card">
                    <p className="svc-card-name">{s.name}</p>
                    <p className="svc-card-price">${fmt(s.price)}</p>
                    <div className="svc-pop-bar">
                      <div className="svc-pop-fill" style={{ width: `${Math.min(100, s.popularity)}%` }} />
                    </div>
                    <p className="svc-pop-label">{s.popularity}% demanda</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mix por hora */}
          <h4 className="section-title">Mix óptimo por franja horaria</h4>
          <div className="hour-opt-table">
            <div className="hot-header">
              <span>Hora</span><span>Mix recomendado</span>
              <span>Óptimo</span><span>Promedio</span><span>Cap.</span>
            </div>
            {opt.horas?.map(h => (
              <div key={h.hora} className="hot-row">
                <span className="hot-hora">{h.hora}:00</span>
                <span className="hot-mix">
                  {Object.entries(h.mix_optimo || {}).map(([s, q]) => (
                    <span key={s} className="mix-chip">{s} ×{q}</span>
                  ))}
                </span>
                <span className="hot-opt">${fmt(h.ingreso_optimo)}</span>
                <span className="hot-avg">${fmt(h.ingreso_promedio)}</span>
                <span className="hot-cap">{h.capacidad_usada}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PANEL TIEMPOS (M/M/c + SPT) ── */}
      {activeTab === 'tiempos' && tiempos && (
        <div className="result-panel">
          {/* SPT */}
          {tiempos.spt && (
            <div className="spt-block">
              <h4>Orden óptimo de atención — SPT</h4>
              <p className="spt-desc">{tiempos.spt.descripcion}</p>
              <div className="spt-list">
                {tiempos.spt.orden?.map((s, i) => (
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

          {/* Tabla por hora */}
          <h4 className="section-title">Análisis de colas por franja horaria</h4>
          {tiempos.horas?.filter(h => h.demanda > 0).map(h => (
            <div key={h.hora} className="queue-block">
              <div className="queue-hora-bar">
                <span className="queue-hora">{h.hora}:00</span>
                <span className="queue-demanda">{h.demanda} autos/h esperados</span>
              </div>
              <div className="queue-table">
                <div className="qt-header">
                  <span>Servicio</span><span>Duración</span>
                  <span>Espera actual</span><span>Emp. óptimos</span>
                  <span>Espera óptima</span><span>Throughput</span>
                </div>
                {h.servicios?.map(s => (
                  <div key={s.servicio} className={`qt-row${s.espera_actual_min > 15 ? ' qt-warn' : ''}`}>
                    <span className="qt-svc">{s.servicio}</span>
                    <span>{s.duracion_min} min</span>
                    <span className={s.espera_actual_min >= 999 ? 'qt-red' : s.espera_actual_min > 15 ? 'qt-red' : s.espera_actual_min > 5 ? 'qt-orange' : 'qt-green'}>
                      {s.espera_actual_min >= 999 ? '∞' : `${s.espera_actual_min} min`}
                    </span>
                    <span className="qt-emp">{s.empleados_optimo} emp</span>
                    <span className="qt-green">
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
    </div>
  );
};

export default Optimization;
