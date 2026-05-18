import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../../api/apiService';
import Form from '../../components/Forms';  
import './ClientForm.css';

const ClientForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    nit: '',
    phoneNumber: '',
    email: '',
    address: ''
  });
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Cargar datos iniciales si es edición
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (id) {
          const clientData = await apiService.getClient(id);
          setFormData(clientData);
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      if (id) {
        await apiService.updateClient(id, formData);
        setSuccessMessage('Cliente actualizado correctamente');
      } else {
        await apiService.registerClient(formData);
        setSuccessMessage('Cliente registrado correctamente');
        setFormData({
          name: '',
          lastName: '',
          nit: '',
          phoneNumber: '',
          email: '',
          address: ''
        });
      }
      
      setTimeout(() => navigate('/clients'), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const fields = [
    {
      name: 'name',
      label: 'Nombre',
      type: 'text',
      value: formData.name,
      onChange: handleChange,
      required: true
    },
    {
      name: 'lastName',
      label: 'Apellido',
      type: 'text',
      value: formData.lastName,
      onChange: handleChange,
      required: true
    },
    {
      name: 'nit',
      label: 'NIT',
      type: 'text',
      value: formData.nit,
      onChange: handleChange,
      required: true
    },
    {
      name: 'phoneNumber',
      label: 'Teléfono',
      type: 'tel',
      value: formData.phone,
      onChange: handleChange,
      required: true
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      value: formData.email,
      onChange: handleChange,
      required: true
    },
    {
      name: 'address',
      label: 'Dirección',
      type: 'text',
      value: formData.address,
      onChange: handleChange,
      required: true
    }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando datos del cliente...</p>
      </div>
    );
  }

  return (
    <div className="client-form-container">
      <h2>{id ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}</h2>
      
      <Form
        fields={fields}
        onSubmit={handleSubmit}
        error={error}
        successMessage={successMessage}
        submitText={id ? 'Actualizar Cliente' : 'Registrar Cliente'}
      />
    </div>
  );
};

export default ClientForm;