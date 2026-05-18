import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../api/apiService';
import DataTable from '../../components/DataTable';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchClients = async () => {
    try {
      const data = await apiService.getClients();
      setClients(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDelete = async ({id}) => {
    if (window.confirm('¿Está seguro de eliminar este cliente?')) {
      try {
        await apiService.deleteClient(id);
      } catch (err) {
        console.error(err);
      }finally{
        fetchClients(); // Recargar la lista
      }
    }
  };

  const columns = [
    { key: 'name', title: 'Nombre' },
    { key: 'lastName', title: 'Apellido' },
    { key: 'nit', title: 'NIT' },
    { key: 'phoneNumber', title: 'Teléfono' },
    { 
      key: 'actions',
      title: 'Acciones',
      render: (client) => (
        <div className="actions">
          {/* <button onClick={() => navigate(`/clients/edit/${client.id}`)}>
            Editar
          </button> */}
          <button onClick={() => handleDelete(client)}>
            Eliminar
          </button>
        </div>
      )
    }
  ];

  if (loading) return <div>Cargando clientes...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Clientes Registrados</h2>
        <button onClick={() => navigate('/clients/new')}>
          + Nuevo Cliente
        </button>
      </div>
      <DataTable 
        columns={columns} 
        data={clients} 
        emptyMessage="No hay clientes registrados"
      />
    </div>
  );
};

export default Clients;