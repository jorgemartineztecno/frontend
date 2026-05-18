import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList,
} from 'recharts';
import { apiService } from '../../api/apiService';
import './Dashboard.css';

const COLORS = ['#3949ab', '#6e8efb', '#2fa1ff', '#a777e3', '#43a047', '#fb8c00'];

const fmt = (n) => `$${Math.round(n).toLocaleString('es-CO')}`;

const Dashboard = () => {
  const [washes, setWashes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.allSettled([
      apiService.getWashedRecords(),
      apiService.getEmployees(),
      apiService.getClients(),
      apiService.getServices(),
    ]).then(([w, e, c, s]) => {
      setWashes(w.status === 'fulfilled' ? w.value || [] : []);
      setEmployees(e.status === 'fulfilled' ? e.value || [] : []);
      setClients(c.status === 'fulfilled' ? c.value || [] : []);
      setServices(s.status === 'fulfilled' ? s.value || [] : []);
      setLoading(false);
    });
  }, []);

  /* ── KPIs ── */
  const totalRevenue = useMemo(() => washes.reduce((s, w) => s + (w.total || 0), 0), [washes]);

  /* ── Lavados + ingresos por mes (últimos 6) ── */
  const monthlyData = useMemo(() => {
    const map = {};
    washes.forEach((w) => {
      const d = new Date(w.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' });
      if (!map[key]) map[key] = { name: label, Lavados: 0, Ingresos: 0 };
      map[key].Lavados++;
      map[key].Ingresos += w.total || 0;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([, v]) => v);
  }, [washes]);

  /* ── Servicios más pedidos ── */
  const serviceData = useMemo(() => {
    const counts = {};
    washes.forEach((w) => {
      (w.serviceOffered || []).forEach((sid) => {
        const svc = services.find((s) => s.id === sid);
        const name = svc ? svc.name : 'Otro';
        counts[name] = (counts[name] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [washes, services]);

  /* ── Top empleados por ingresos ── */
  const employeeData = useMemo(() => {
    const map = {};
    washes.forEach((w) => {
      const emp = employees.find((e) => e.id === w.employee);
      const name = emp ? emp.name : 'N/A';
      map[name] = (map[name] || 0) + (w.total || 0);
    });
    return Object.entries(map)
      .map(([name, Ingresos]) => ({ name, Ingresos }))
      .sort((a, b) => b.Ingresos - a.Ingresos)
      .slice(0, 5);
  }, [washes, employees]);

  /* ── Horas pico ── */
  const hourData = useMemo(() => {
    const counts = {};
    washes.forEach((w) => {
      const h = new Date(w.date).getHours();
      counts[h] = (counts[h] || 0) + 1;
    });
    const max = Math.max(...Object.values(counts), 1);
    return Array.from({ length: 12 }, (_, i) => {
      const h = i + 7;
      const count = counts[h] || 0;
      return { hora: `${h}:00`, Lavados: count, peak: count === max };
    });
  }, [washes]);

  /* ── Lavados por día de la semana ── */
  const weekdayData = useMemo(() => {
    const LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    washes.forEach((w) => {
      counts[new Date(w.date).getDay()]++;
    });
    // Lunes primero
    const ordered = [1, 2, 3, 4, 5, 6, 0].map((d) => ({
      dia: LABELS[d],
      Lavados: counts[d],
    }));
    const max = Math.max(...ordered.map((o) => o.Lavados), 1);
    return ordered.map((o) => ({ ...o, peak: o.Lavados === max }));
  }, [washes]);

  /* ── Últimos 5 lavados ── */
  const recent = useMemo(
    () => [...washes].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
    [washes]
  );

  const getClient = (id) => clients.find((c) => c.id === id);
  const getEmployee = (id) => employees.find((e) => e.id === id);

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-spinner" />
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dash-page">
      {/* ── Header ── */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-subtitle">
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button className="dash-cta" onClick={() => navigate('/washes/new')}>
          + Nuevo Lavado
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="dash-kpis">
        <div className="kpi-card">
          <p className="kpi-label">Total Lavados</p>
          <p className="kpi-value">{washes.length}</p>
        </div>
        <div className="kpi-card kpi-accent">
          <p className="kpi-label">Ingresos Totales</p>
          <p className="kpi-value">{fmt(totalRevenue)}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Clientes</p>
          <p className="kpi-value">{clients.length}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Empleados</p>
          <p className="kpi-value">{employees.length}</p>
        </div>
      </div>

      {/* ── Charts row 1: Mensual + Servicios ── */}
      <div className="dash-charts-row">
        {/* Bar dual: lavados + ingresos por mes */}
        <div className="dash-card dash-card--wide">
          <h3 className="card-title">Lavados e Ingresos por Mes</h3>
          {monthlyData.length === 0 ? (
            <p className="chart-empty">Sin datos suficientes</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val, name) => (name === 'Ingresos' ? fmt(val) : val)} />
                <Bar yAxisId="left" dataKey="Lavados" fill="#6e8efb" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="Ingresos" fill="#3949ab" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Servicios más pedidos: donut + ranking */}
        <div className="dash-card svc-card">
          <h3 className="card-title">Lo Más Pedido</h3>
          {serviceData.length === 0 ? (
            <p className="chart-empty">Sin datos</p>
          ) : (
            <div className="svc-layout">
              <ResponsiveContainer width="45%" height={200}>
                <PieChart>
                  <Pie data={serviceData} cx="50%" cy="50%" innerRadius={48} outerRadius={76} dataKey="value" paddingAngle={3}>
                    {serviceData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} veces`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="svc-rank-list">
                {serviceData.map((s, i) => (
                  <div key={i} className="svc-rank-item">
                    <span className="svc-rank-pos">{i + 1}</span>
                    <div className="svc-rank-info">
                      <span className="svc-rank-name">{s.name}</span>
                      <div className="svc-rank-bar-wrap">
                        <div
                          className="svc-rank-bar"
                          style={{
                            width: `${(s.value / serviceData[0].value) * 100}%`,
                            background: COLORS[i % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                    <span className="svc-rank-count">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Charts row 2: Empleados + Últimos lavados ── */}
      <div className="dash-charts-row">
        <div className="dash-card">
          <h3 className="card-title">Top Empleados por Ingresos</h3>
          {employeeData.length === 0 ? (
            <p className="chart-empty">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={employeeData} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Bar dataKey="Ingresos" radius={[0, 4, 4, 0]}>
                  {employeeData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="dash-card dash-card--wide">
          <div className="card-title-row">
            <h3 className="card-title">Últimos Lavados</h3>
            <button className="dash-link-btn" onClick={() => navigate('/washes')}>Ver todos</button>
          </div>
          {recent.length === 0 ? (
            <p className="chart-empty">Sin registros</p>
          ) : (
            <table className="dash-mini-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Empleado</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((w) => {
                  const cl = getClient(w.client);
                  const em = getEmployee(w.employee);
                  return (
                    <tr key={w.id}>
                      <td>{new Date(w.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</td>
                      <td>{cl ? `${cl.name} ${cl.lastName}` : '—'}</td>
                      <td>{em ? em.name : '—'}</td>
                      <td><span className="total-badge">{fmt(w.total)}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Horas Pico ── */}
      <div className="dash-charts-row">
        <div className="dash-card dash-card--full">
          <h3 className="card-title">Horas Pico — ¿A qué hora se atiende más?</h3>
          {washes.length === 0 ? (
            <p className="chart-empty">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={hourData} margin={{ top: 18, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="hora" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [`${v} lavados`, 'Cantidad']} labelFormatter={(l) => `Hora: ${l}`} />
                <Bar dataKey="Lavados" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {hourData.map((entry, i) => (
                    <Cell key={i} fill={entry.peak ? '#fb8c00' : '#6e8efb'} />
                  ))}
                  <LabelList
                    dataKey="Lavados"
                    position="top"
                    style={{ fontSize: 11, fill: '#374151', fontWeight: 600 }}
                    formatter={(v) => (v > 0 ? v : '')}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <p className="peak-note">
            La barra <span className="peak-dot" /> naranja indica la hora con más lavados
          </p>
        </div>
      </div>

      {/* ── Lavados por día de la semana ── */}
      <div className="dash-charts-row">
        <div className="dash-card dash-card--full">
          <h3 className="card-title">¿Qué día de la semana hay más lavados?</h3>
          {washes.length === 0 ? (
            <p className="chart-empty">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={weekdayData} margin={{ top: 18, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="dia" tick={{ fontSize: 13, fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(v) => [`${v} lavados`, 'Cantidad']}
                  labelFormatter={(l) => `Día: ${l}`}
                />
                <Bar dataKey="Lavados" radius={[8, 8, 0, 0]} maxBarSize={64}>
                  {weekdayData.map((entry, i) => (
                    <Cell key={i} fill={entry.peak ? '#fb8c00' : '#6e8efb'} />
                  ))}
                  <LabelList
                    dataKey="Lavados"
                    position="top"
                    style={{ fontSize: 12, fill: '#374151', fontWeight: 700 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <p className="peak-note">
            La barra <span className="peak-dot" /> naranja indica el día con más lavados
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
