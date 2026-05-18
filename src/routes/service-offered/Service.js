import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../api/apiService';
import DataTable from '../../components/DataTable';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchServices = async () => {
    try {
      const data = await apiService.getServices();
      setServices(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleDelete = async ({id}) => {
    try {
      await apiService.deleteService(id);
    } catch (err) {
      console.error(err);
    }finally{
      fetchServices(); // Refrescar la lista después de eliminar
    }
  };

  const columns = [
    { key: 'name', title: 'Nombre' },
    { key: 'description', title: 'Descripción' },
    { 
      key: 'price', 
      title: 'Precio',
      render: (service) => `$${service.price.toFixed(2)}`
    },
    { key: 'duration', title: 'Duración' },
    { 
      key: 'actions',
      title: 'Acciones',
      render: (service) => (
        <div className="actions">
          {/* <button onClick={() => navigate(`/services/edit/${service.id}`)}>
            Editar
          </button> */}
          <button onClick={() => handleDelete(service)}>
            Eliminar
          </button>
        </div>
      )
    }
  ];

  if (loading) return <div>Cargando servicios...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Servicios Ofrecidos</h2>
        <button onClick={() => navigate('/services/new')}>
          + Nuevo Servicio
        </button>
      </div>
      <DataTable 
        columns={columns} 
        data={services} 
        emptyMessage="No hay servicios registrados"
      />
    </div>
  );
};

export default Services;