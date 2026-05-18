import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../../api/apiService';
import Form from '../../components/Forms';

const EmployeeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    position: '',
    phoneNumber: ''
  });
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      const fetchEmployee = async () => {
        try {
          const employee = await apiService.getEmployee(id);
          setFormData(employee);
          setLoading(false);
        } catch (err) {
          setError(err.message);
          setLoading(false);
        }
      };
      fetchEmployee();
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await apiService.updateEmployee(id, formData);
      } else {
        await apiService.registerEmployee(formData);
      }
      navigate('/employees');
    } catch (err) {
      setError(err.message);
    }
  };

  const fields = [
    {
      name: 'name',
      label: 'Nombre',
      value: formData.name,
      onChange: (e) => setFormData({...formData, name: e.target.value})
    },
    {
      name: 'lastName',
      label: 'Apellido',
      value: formData.lastName,
      onChange: (e) => setFormData({...formData, lastName: e.target.value})
    },
    {
      name: 'position',
      label: 'Posición',
      value: formData.position,
      onChange: (e) => setFormData({...formData, position: e.target.value})
    },
    {
      name: 'phoneNumber',
      label: 'Teléfono',
      value: formData.phoneNumber,
      onChange: (e) => setFormData({...formData, phoneNumber: e.target.value})
    }
  ];

  if (loading) return <div>Cargando datos del empleado...</div>;

  return (
    <div className="page-container">
      <h2>{id ? 'Editar Empleado' : 'Nuevo Empleado'}</h2>
      <Form
        fields={fields}
        onSubmit={handleSubmit}
        error={error}
        submitText={id ? 'Actualizar' : 'Registrar'}
      />
    </div>
  );
};

export default EmployeeForm;