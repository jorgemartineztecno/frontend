import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../api/apiService';
import DataTable from '../../components/DataTable';
import './WashHistory.css';

const WashHistory = () => {
  const [washes, setWashes] = useState([]);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [cars, setCars] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchAllData = async () => {
    setLoading(true);
    const [washesRes, servicesRes, employeesRes, carsRes, clientsRes] =
      await Promise.allSettled([
        apiService.getWashedRecords(),
        apiService.getServices(),
        apiService.getEmployees(),
        apiService.getCars(),
        apiService.getClients(),
      ]);

    const failures = [washesRes, servicesRes, employeesRes, carsRes, clientsRes]
      .filter((r) => r.status === 'rejected')
      .map((r) => r.reason?.message || 'Error desconocido');

    setWashes(washesRes.status === 'fulfilled' ? washesRes.value || [] : []);
    setServices(servicesRes.status === 'fulfilled' ? servicesRes.value || [] : []);
    setEmployees(employeesRes.status === 'fulfilled' ? employeesRes.value || [] : []);
    setCars(carsRes.status === 'fulfilled' ? carsRes.value || [] : []);
    setClients(clientsRes.status === 'fulfilled' ? clientsRes.value || [] : []);
    setError(failures.length > 0 ? failures.join(' | ') : null);
    setLoading(false);
  };

  useEffect(() => { fetchAllData(); }, []);

  const getService = (id) => services.find((s) => s.id === id);
  const getEmployee = (id) => employees.find((e) => e.id === id);
  const getCar = (id) => cars.find((c) => c.id === id);
  const getClient = (id) => clients.find((c) => c.id === id);

  const clientName = (id) => { const c = getClient(id); return c ? `${c.name} ${c.lastName}` : '—'; };
  const employeeName = (id) => { const e = getEmployee(id); return e ? `${e.name} ${e.lastName}` : '—'; };
  const carLabel = (id) => { const c = getCar(id); return c ? `${c.make} ${c.color} (${c.licencePlate})` : '—'; };

  const filteredWashes = useMemo(() => {
    if (!searchTerm.trim()) return washes;
    const q = searchTerm.toLowerCase();
    return washes.filter((w) => {
      const cl = getClient(w.client);
      const em = getEmployee(w.employee);
      const ca = getCar(w.car);
      return (
        (cl ? `${cl.name} ${cl.lastName}`.toLowerCase().includes(q) : false) ||
        (em ? `${em.name} ${em.lastName}`.toLowerCase().includes(q) : false) ||
        (ca ? `${ca.make} ${ca.color} ${ca.licencePlate}`.toLowerCase().includes(q) : false) ||
        new Date(w.date).toLocaleDateString().toLowerCase().includes(q)
      );
    });
  }, [washes, searchTerm, clients, employees, cars]);

  const totalRevenue = washes.reduce((s, w) => s + (w.total || 0), 0);
  const avgRevenue = washes.length ? totalRevenue / washes.length : 0;

  const columns = [
    {
      key: 'date',
      title: 'Fecha',
      render: (w) =>
        new Date(w.date).toLocaleDateString('es-CO', {
          day: '2-digit', month: 'short', year: 'numeric',
        }),
    },
    {
      key: 'client',
      title: 'Cliente',
      render: (w) => <span className="wh-cell-name">{clientName(w.client)}</span>,
    },
    {
      key: 'car',
      title: 'Vehículo',
      render: (w) => carLabel(w.car),
    },
    {
      key: 'services',
      title: 'Servicios',
      render: (w) => (
        <ul className="services-tag-list">
          {(w.serviceOffered || []).map((sid) => {
            const svc = getService(sid);
            return (
              <li key={sid}>{svc ? `${svc.name}` : sid}</li>
            );
          })}
        </ul>
      ),
    },
    {
      key: 'employee',
      title: 'Empleado',
      render: (w) => employeeName(w.employee),
    },
    {
      key: 'total',
      title: 'Total',
      render: (w) => (
        <span className="total-badge">
          ${(w.total || 0).toLocaleString('es-CO')}
        </span>
      ),
    },
  ];

  const handleDelete = async ({ id }) => {
    if (!window.confirm('¿Eliminar este registro de lavado?')) return;
    try {
      await apiService.deleteWashedRecord(id);
    } catch (err) {
      console.error(err);
    } finally {
      fetchAllData();
    }
  };

  const handleEdit = (wash) => navigate(`/washes/edit/${wash.id}`);

  if (loading) {
    return (
      <div className="wh-loading">
        <div className="wh-spinner" />
        <p>Cargando historial...</p>
      </div>
    );
  }

  return (
    <div className="wh-page">
      {error && (
        <div className="wh-alert">
          <strong>Advertencia:</strong> {error}
        </div>
      )}

      {/* Header */}
      <div className="wh-header">
        <div>
          <h1 className="wh-title">Historial de Lavados</h1>
          <p className="wh-subtitle">{washes.length} registro{washes.length !== 1 ? 's' : ''} en total</p>
        </div>
        <button className="wh-new-btn" onClick={() => navigate('/washes/new')}>
          + Nuevo Lavado
        </button>
      </div>

      {/* Stats */}
      <div className="wh-stats">
        <div className="wh-stat-card">
          <div className="stat-icon stat-icon--washes" />
          <div>
            <p className="stat-label">Total lavados</p>
            <p className="stat-value">{washes.length}</p>
          </div>
        </div>
        <div className="wh-stat-card wh-stat-accent">
          <div className="stat-icon stat-icon--revenue" />
          <div>
            <p className="stat-label">Ingresos totales</p>
            <p className="stat-value">${totalRevenue.toLocaleString('es-CO')}</p>
          </div>
        </div>
        <div className="wh-stat-card">
          <div className="stat-icon stat-icon--avg" />
          <div>
            <p className="stat-label">Promedio por lavado</p>
            <p className="stat-value">${Math.round(avgRevenue).toLocaleString('es-CO')}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="wh-search-row">
        <div className="wh-search-wrap">
          <span className="wh-search-icon">&#128269;</span>
          <input
            type="text"
            className="wh-search"
            placeholder="Buscar por cliente, vehículo, empleado o fecha..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="wh-clear-btn" onClick={() => setSearchTerm('')} title="Limpiar">
              ×
            </button>
          )}
        </div>
        {searchTerm && (
          <span className="wh-count-badge">
            {filteredWashes.length} resultado{filteredWashes.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredWashes}
        emptyMessage={
          searchTerm
            ? 'No hay registros que coincidan con la búsqueda.'
            : 'No hay registros de lavados aún.'
        }
        onDelete={handleDelete}
        onEdit={handleEdit}
        pageSize={8}
      />
    </div>
  );
};

export default WashHistory;
