import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../api/apiService';
import DataTable from '../../components/DataTable';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchEmployees = async () => {
    try {
      const data = await apiService.getEmployees();
      setEmployees(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setEmployees(employees.filter(emp => emp.id !== id));
      await apiService.deleteEmployee(id);
    } catch (err) {
      console.error(err.message);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const columns = [
    { key: 'id', title: 'ID' },
    { key: 'name', title: 'Nombre' },
    { key: 'lastName', title: 'Apellido' },
    { key: 'position', title: 'Posición' },
    { key: 'phoneNumber', title: 'Teléfono' },
    { 
      key: 'actions', 
      title: 'Acciones',
      render: (item) => (
        <div className="actions">
          {/* <button 
            size="small" 
            onClick={() => navigate(`/employees/edit/${item.id}`)}
          >
            Editar
          </button> */}
          <button
            size="small" 
            variant="danger" 
            onClick={() => handleDelete(item.id)}
          >
            Eliminar
          </button>
        </div>
      )
    }
  ];

  if (loading) return <div>Cargando empleados...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Gestión de Empleados</h2>
        <button onClick={() => navigate('/employees/new')}>
          + Nuevo Empleado
        </button>
      </div>
      
      <DataTable 
        columns={columns} 
        data={employees} 
        emptyMessage="No hay empleados registrados"
      />
    </div>
  );
};

export default Employees;