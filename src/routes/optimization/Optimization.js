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
  if (!opt?.plan) return null;

  // Servicio con mayor ingreso óptimo
  const topSvc = [...opt.plan].sort((a, b) => b.ingreso_optimo - a.ingreso_optimo)[0] ?? null;

  // Servicio más eficiente ($/min)
  const bestEff = [...opt.plan].sort((a, b) => b.eficiencia - a.eficiencia)[0] ?? null;

  // Servicios donde LP recomienda más que el promedio
  const upgraded = opt.plan.filter(r => r.cantidad_optima > r.cantidad_promedio + 0.1);

  return { topSvc, bestEff, upgraded };
};

const HELP_CONTENT = {
  ingresos: {
    title: 'Maximización de Ingresos — Programación Lineal (LP)',
    intro: 'El modelo resuelve un problema de optimización lineal para todo el día: ¿cuántos lavados de cada tipo hacer para ganar el máximo dinero posible, sin exceder la capacidad de los empleados ni la demanda histórica?',
    columns: [
      { label: 'SERVICIO', desc: 'Tipo de lavado ofrecido. Cada uno es una variable de decisión x_i en el modelo.' },
      { label: 'PRECIO', desc: 'Coeficiente de la función objetivo: maximizar Σ precio_i × x_i.' },
      { label: 'DURACIÓN', desc: 'Minutos que toma el servicio. Define la restricción de tiempo: Σ duración_i × x_i ≤ capacidad.' },
      { label: 'CANT. ÓPTIMA', desc: 'Solución del LP: cuántos de este servicio conviene hacer hoy para maximizar ingresos.' },
      { label: 'CANT. PROMEDIO', desc: 'Lo que se hace normalmente según el historial — sin optimizar.' },
      { label: 'INGRESO ÓPTIMO', desc: 'Ingresos que genera este servicio si se sigue el plan óptimo del LP.' },
      { label: 'EFICIENCIA', desc: 'Ingreso por minuto ($/ min). El LP naturalmente prioriza servicios con mayor eficiencia hasta agotar su demanda.' },
    ],
    note: 'La diferencia entre ÓPTIMO y PROMEDIO muestra cuánto dinero se deja de ganar al no seguir el plan. Más datos históricos = predicción de demanda más precisa = mejor plan.',
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

          {/* Modelo LP — función objetivo y restricciones */}
          <div className="lp-model-box">
            <div className="lp-model-header">
              <span className="lp-badge">LP</span>
              <span className="lp-obj">{opt.funcion_objetivo}</span>
            </div>
            <ul className="lp-constraints">
              {opt.restricciones?.map((r, i) => (
                <li key={i}><span className="lp-ri">R{i + 1}</span>{r}</li>
              ))}
            </ul>
          </div>

          {/* KPIs */}
          <div className="kpi-grid">
            <div className="kpi kpi--green">
              <p className="kpi-label">Ingreso óptimo del día</p>
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

          {/* Capacidad de tiempo */}
          <div className="cap-section">
            <div className="cap-row">
              <span className="cap-label">Plan óptimo</span>
              <div className="cap-bar-wrap">
                <div className="cap-bar-fill cap-bar--green"
                  style={{ width: `${Math.min(100, opt.pct_capacidad_optima)}%` }} />
              </div>
              <span className="cap-pct cap-pct--green">{opt.pct_capacidad_optima}%</span>
              <span className="cap-min">{fmt(opt.tiempo_usado_optimo)} / {fmt(opt.capacidad_minutos)} min</span>
            </div>
            <div className="cap-row">
              <span className="cap-label">Sin optimizar</span>
              <div className="cap-bar-wrap">
                <div className="cap-bar-fill cap-bar--gray"
                  style={{ width: `${Math.min(100, opt.pct_capacidad_promedio)}%` }} />
              </div>
              <span className="cap-pct cap-pct--gray">{opt.pct_capacidad_promedio}%</span>
              <span className="cap-min">{fmt(opt.tiempo_usado_promedio)} / {fmt(opt.capacidad_minutos)} min</span>
            </div>
            <p className="cap-note">
              {opt.empleados} empleado{opt.empleados !== 1 ? 's' : ''} × 660 min/día = {fmt(opt.capacidad_minutos)} min disponibles
            </p>
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
                    <div className="rec-card rec-card--green">
                      <p className="rec-card-label">Mayor ingreso óptimo</p>
                      <p className="rec-card-value">{rec.topSvc.servicio}</p>
                      <p className="rec-card-hint">${fmt(rec.topSvc.ingreso_optimo)} · {rec.topSvc.cantidad_optima} lavados</p>
                    </div>
                  )}
                  {rec.bestEff && (
                    <div className="rec-card rec-card--blue">
                      <p className="rec-card-label">Más eficiente ($/min)</p>
                      <p className="rec-card-value">{rec.bestEff.servicio}</p>
                      <p className="rec-card-hint">${rec.bestEff.eficiencia}/min · {rec.bestEff.duracion_min} min/lavado</p>
                    </div>
                  )}
                  {rec.upgraded.length > 0 && (
                    <div className="rec-card rec-card--orange">
                      <p className="rec-card-label">Aumentar vs promedio</p>
                      <p className="rec-card-value">{rec.upgraded[0].servicio}</p>
                      <p className="rec-card-hint">
                        {rec.upgraded[0].cantidad_promedio} → {rec.upgraded[0].cantidad_optima} lavados
                      </p>
                    </div>
                  )}
                </div>
                {rec.upgraded.length > 0 && (
                  <p className="rec-insight">
                    <strong>Acción concreta:</strong> Haz {Math.round(rec.upgraded[0].cantidad_optima)} {rec.upgraded[0].servicio}
                    {rec.upgraded.length > 1 && ` y ${Math.round(rec.upgraded[1].cantidad_optima)} ${rec.upgraded[1].servicio}`} hoy.
                    {rec.bestEff && ` El servicio más rentable por minuto es ${rec.bestEff.servicio} (${rec.bestEff.eficiencia} $/min).`}
                  </p>
                )}
              </div>
            );
          })()}

          {/* Plan diario por servicio */}
          <h4 className="section-title">Plan óptimo del día — por servicio</h4>
          <div className="plan-table">
            <div className="pt-header">
              <span>Servicio</span>
              <span>Precio</span>
              <span>Duración</span>
              <span>Cant. Óptima</span>
              <span>Cant. Promedio</span>
              <span>Ingreso Óptimo</span>
              <span>Eficiencia</span>
            </div>
            {opt.plan?.map(row => {
              const diff = row.cantidad_optima - row.cantidad_promedio;
              return (
                <div key={row.servicio} className={`pt-row${diff > 0.1 ? ' pt-row--up' : diff < -0.1 ? ' pt-row--down' : ''}`}>
                  <span className="pt-svc">{row.servicio}</span>
                  <span className="pt-price">${fmt(row.precio)}</span>
                  <span className="pt-dur">{row.duracion_min} min</span>
                  <span className="pt-opt">
                    {Math.round(row.cantidad_optima)}
                    {diff > 0.1 && <span className="pt-arrow pt-arrow--up"> ↑</span>}
                    {diff < -0.1 && <span className="pt-arrow pt-arrow--down"> ↓</span>}
                  </span>
                  <span className="pt-avg">{Math.round(row.cantidad_promedio)}</span>
                  <span className="pt-rev">${fmt(row.ingreso_optimo)}</span>
                  <span className="pt-eff">${row.eficiencia}/min</span>
                </div>
              );
            })}
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
