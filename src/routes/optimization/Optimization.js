import React, { useState, useCallback } from 'react';
import './Optimization.css';
import { apiService } from '../../api/apiService';

const DAYS = ['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo'];
const DAY_LABELS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const todayIndex = () => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; };
const fmt = (n) => Math.round(n).toLocaleString('es-CO');

const computeTiemposKPIs = (tiempos) => {
  let totalEsperaActual = 0, totalEsperaOptima = 0, count = 0;
  const serviceMap = {};

  tiempos.horas?.filter(h => h.demanda > 0).forEach(h => {
    h.servicios?.forEach(s => {
      const espeActual = s.espera_actual_min < 999 ? s.espera_actual_min : null;
      const espeOptima = s.espera_optima_min < 999 ? s.espera_optima_min : null;
      if (espeActual !== null && espeOptima !== null) {
        totalEsperaActual += espeActual;
        totalEsperaOptima += espeOptima;
        count++;
      }
      if (!serviceMap[s.servicio]) {
        serviceMap[s.servicio] = {
          nombre: s.servicio,
          duracion_min: s.duracion_min,
          empleados_optimo: s.empleados_optimo,
          espera_optima_min: espeOptima,
          throughput_hora: s.throughput_hora,
          tiempoEfectivo: s.empleados_optimo > 0
            ? Math.round((s.duracion_min / s.empleados_optimo) * 10) / 10
            : s.duracion_min,
        };
      } else {
        // keep worst-case (max employees recommended)
        if (s.empleados_optimo > serviceMap[s.servicio].empleados_optimo) {
          serviceMap[s.servicio].empleados_optimo = s.empleados_optimo;
          serviceMap[s.servicio].tiempoEfectivo = s.empleados_optimo > 0
            ? Math.round((s.duracion_min / s.empleados_optimo) * 10) / 10
            : s.duracion_min;
        }
      }
    });
  });

  const avgActual = count ? Math.round(totalEsperaActual / count) : 0;
  const avgOptima = count ? Math.round(totalEsperaOptima / count) : 0;
  const reduccion = avgActual > 0 ? Math.round((1 - avgOptima / avgActual) * 100) : 0;
  const totalEmpleados = Object.values(serviceMap).reduce((s, x) => s + x.empleados_optimo, 0);

  return { avgActual, avgOptima, reduccion, totalEmpleados, services: Object.values(serviceMap) };
};

const computeRecommendations = (opt) => {
  if (!opt?.horas) return null;

  const improved = opt.horas
    .filter(h => h.ingreso_optimo > h.ingreso_promedio + 50)
    .sort((a, b) => (b.ingreso_optimo - b.ingreso_promedio) - (a.ingreso_optimo - a.ingreso_promedio));

  const svcCount = {};
  opt.horas.forEach(h => {
    Object.entries(h.mix_optimo || {}).forEach(([s]) => {
      svcCount[s] = (svcCount[s] || 0) + 1;
    });
  });
  const topSvcName = Object.entries(svcCount).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topSvcInfo = opt.servicios?.find(s => s.name === topSvcName);
  const topSvc = topSvcName ? { name: topSvcName, price: topSvcInfo?.price, hours: svcCount[topSvcName] } : null;

  const bottlenecks = opt.horas.filter(h => h.capacidad_usada >= 100 && h.ingreso_optimo > 0);

  return { improved, topSvc, bestHour: improved[0] ?? null, bottlenecks };
};

const HELP_CONTENT = {
  ingresos: {
    title: 'Maximización de Ingresos — Programación Lineal',
    intro: 'El modelo calcula cuántos lavados de cada servicio conviene hacer en cada hora para ganar la mayor cantidad de dinero posible, sin sobrepasar la capacidad del negocio.',
    columns: [
      { label: 'HORA', desc: 'Franja horaria del día (7:00 a 18:00).' },
      { label: 'MIX RECOMENDADO', desc: 'Combinación óptima de servicios que el modelo sugiere realizar en esa hora. El número (×0.3) indica cuántas unidades de ese servicio.' },
      { label: 'ÓPTIMO', desc: 'Ingreso máximo posible si se sigue el mix recomendado. Es el resultado de la optimización.' },
      { label: 'PROMEDIO', desc: 'Ingreso esperado sin optimizar, distribuyendo los clientes proporcionalmente según la popularidad histórica de cada servicio.' },
      { label: 'CAP.', desc: 'Capacidad usada: qué tan aprovechada está la capacidad de los empleados en esa hora. 100% = empleados al máximo. Valores altos son buenos si los ingresos también son altos.' },
    ],
    note: 'Si ÓPTIMO y PROMEDIO son iguales, significa que la distribución actual ya es óptima para esa hora, o que se necesitan más datos históricos de lavados para diferenciarlas.',
  },
  tiempos: {
    title: 'Optimización de Tiempos — M/M/c + SPT',
    intro: 'Este modelo busca reducir el tiempo que espera cada cliente antes de ser atendido, calculando cuántos empleados se necesitan y en qué orden atender los servicios.',
    columns: [
      { label: 'ESPERA ACTUAL', desc: 'Tiempo promedio que espera un cliente en la fila con la configuración actual de empleados.' },
      { label: 'EMP. ÓPTIMOS', desc: 'Número de empleados recomendado para que la espera no supere los 10 minutos.' },
      { label: 'ESPERA ÓPTIMA', desc: 'Tiempo de espera estimado si se usa el número óptimo de empleados.' },
      { label: 'THROUGHPUT', desc: 'Cuántos autos puede atender ese servicio por hora con los empleados asignados.' },
      { label: 'ORDEN SPT', desc: 'Orden sugerido de atención: primero los servicios más cortos (Shortest Processing Time) para reducir la espera promedio de todos los clientes.' },
    ],
    note: 'Si la espera muestra ∞ (infinito), significa que la demanda supera la capacidad — se necesitan más empleados urgentemente en esa franja.',
  },
};

const Optimization = () => {
  const [selectedDay, setSelectedDay] = useState(todayIndex());
  const [activeTab, setActiveTab]     = useState('ingresos');

  const [opt,          setOpt]          = useState(null);
  const [tiempos,      setTiempos]      = useState(null);
  const [loadingOpt,   setLoadingOpt]   = useState(false);
  const [loadingTiempos, setLoadingTiempos] = useState(false);
  const [error,        setError]        = useState(null);
  const [showHelp,     setShowHelp]     = useState(false);

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
        <button className="help-btn" onClick={() => setShowHelp(true)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          ¿Cómo funciona?
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

          {/* Recomendaciones */}
          {(() => {
            const rec = computeRecommendations(opt);
            if (!rec) return null;
            return (
              <div className="rec-panel">
                <p className="rec-panel-title">¿Qué hacer hoy?</p>
                <div className="rec-grid">
                  {rec.topSvc && (
                    <div className="rec-card rec-card--blue">
                      <p className="rec-card-label">Servicio a priorizar</p>
                      <p className="rec-card-value">{rec.topSvc.name}</p>
                      <p className="rec-card-hint">
                        {rec.topSvc.price ? `$${fmt(rec.topSvc.price)} · ` : ''}
                        recomendado en {rec.topSvc.hours} franja{rec.topSvc.hours !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                  {rec.bestHour ? (
                    <div className="rec-card rec-card--green">
                      <p className="rec-card-label">Mejor franja horaria</p>
                      <p className="rec-card-value">{rec.bestHour.hora}:00</p>
                      <p className="rec-card-hint">
                        +${fmt(rec.bestHour.ingreso_optimo - rec.bestHour.ingreso_promedio)} sobre el promedio
                      </p>
                    </div>
                  ) : (
                    <div className="rec-card rec-card--green">
                      <p className="rec-card-label">Estado del día</p>
                      <p className="rec-card-value">Ya optimizado</p>
                      <p className="rec-card-hint">La distribución actual es la óptima para este día</p>
                    </div>
                  )}
                  {rec.bottlenecks.length > 0 && (
                    <div className="rec-card rec-card--orange">
                      <p className="rec-card-label">Horas al límite (100%)</p>
                      <p className="rec-card-value">{rec.bottlenecks.slice(0, 2).map(h => `${h.hora}:00`).join(' · ')}</p>
                      <p className="rec-card-hint">Considera asignar más personal en esas franjas</p>
                    </div>
                  )}
                </div>
                {rec.improved.length > 0 && (
                  <p className="rec-insight">
                    <strong>Acción concreta:</strong> En la franja de las {rec.improved[0].hora}:00,
                    el mix sugerido genera{' '}
                    <strong>${fmt(rec.improved[0].ingreso_optimo - rec.improved[0].ingreso_promedio)}</strong> más que tu distribución habitual.
                    {rec.topSvc && ` Prioriza ${rec.topSvc.name} — es el servicio con mayor presencia en el plan óptimo.`}
                  </p>
                )}
              </div>
            );
          })()}

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
      {activeTab === 'tiempos' && tiempos && (() => {
        const kpis = computeTiemposKPIs(tiempos);
        return (
          <div className="result-panel">

            {/* KPIs resumen de tiempos */}
            <div className="kpi-grid">
              <div className="kpi kpi--gray">
                <p className="kpi-label">Espera promedio actual</p>
                <p className="kpi-value">{kpis.avgActual} min</p>
              </div>
              <div className="kpi kpi--green">
                <p className="kpi-label">Espera promedio óptima</p>
                <p className="kpi-value">{kpis.avgOptima} min</p>
              </div>
              <div className="kpi kpi--blue">
                <p className="kpi-label">Reducción de espera</p>
                <p className="kpi-value">−{kpis.reduccion}%</p>
              </div>
              <div className="kpi kpi--orange">
                <p className="kpi-label">Empleados recomendados</p>
                <p className="kpi-value">{kpis.totalEmpleados} emp</p>
              </div>
            </div>

            {/* Tiempo promedio por servicio según empleados */}
            {kpis.services.length > 0 && (
              <div className="svc-section">
                <h4>Tiempo efectivo por servicio según empleados</h4>
                <p className="spt-desc">
                  Tiempo efectivo = duración del servicio ÷ empleados óptimos asignados.
                  Cuantos más empleados trabajan en paralelo, menor el tiempo por cliente.
                </p>
                <div className="svc-time-grid">
                  {kpis.services.map(s => {
                    const pct = s.duracion_min > 0
                      ? Math.max(10, Math.round((s.tiempoEfectivo / s.duracion_min) * 100))
                      : 100;
                    return (
                      <div key={s.nombre} className="svc-time-card">
                        <p className="svc-card-name">{s.nombre}</p>
                        <div className="stc-row">
                          <span className="stc-label">Duración base</span>
                          <span className="stc-val stc-gray">{s.duracion_min} min</span>
                        </div>
                        <div className="stc-row">
                          <span className="stc-label">Empleados óptimos</span>
                          <span className="stc-val stc-blue">{s.empleados_optimo} emp</span>
                        </div>
                        <div className="stc-row">
                          <span className="stc-label">Tiempo efectivo</span>
                          <span className="stc-val stc-green">{s.tiempoEfectivo} min</span>
                        </div>
                        <div className="stc-row">
                          <span className="stc-label">Throughput</span>
                          <span className="stc-val stc-orange">{s.throughput_hora}/h</span>
                        </div>
                        <div className="svc-pop-bar" style={{ marginTop: '8px' }}>
                          <div className="stc-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="svc-pop-label">
                          {100 - pct}% más rápido con {s.empleados_optimo} empleado{s.empleados_optimo !== 1 ? 's' : ''}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
        );
      })()}
      {showHelp && (
        <>
          <div className="help-overlay" onClick={() => setShowHelp(false)} />
          <div className="help-panel">
            <div className="help-panel-header">
              <p className="help-panel-title">{HELP_CONTENT[activeTab].title}</p>
              <button className="help-close-btn" onClick={() => setShowHelp(false)}>✕</button>
            </div>
            <p className="help-intro">{HELP_CONTENT[activeTab].intro}</p>
            <p className="help-cols-title">Significado de columnas</p>
            {HELP_CONTENT[activeTab].columns.map(col => (
              <div key={col.label} className="help-col-item">
                <span className="help-col-label">{col.label}</span>
                <p className="help-col-desc">{col.desc}</p>
              </div>
            ))}
            <div className="help-note">
              <p>{HELP_CONTENT[activeTab].note}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Optimization;
