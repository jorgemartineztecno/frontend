import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../../api/apiService';
import Form from '../../components/Forms';  
import './ServiceForm.css';

const ServiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: ''
  });
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (id) {
          const serviceData = await apiService.getService(id);
          setFormData(serviceData);
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
        await apiService.updateService(id, formData);
        setSuccessMessage('Servicio actualizado correctamente');
      } else {
        await apiService.registerService(formData);
        setSuccessMessage('Servicio registrado correctamente');
        setFormData({
          name: '',
          description: '',
          price: '',
          duration: ''
        });
      }
      
      setTimeout(() => navigate('/services'), 2000);
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
      label: 'Nombre del Servicio',
      type: 'text',
      value: formData.name,
      onChange: handleChange,
      required: true
    },
    {
      name: 'description',
      label: 'Descripción',
      type: 'textarea',
      value: formData.description,
      onChange: handleChange,
      required: true
    },
    {
      name: 'price',
      label: 'Precio ($)',
      type: 'number',
      value: formData.price,
      onChange: handleChange,
      required: true,
      min: 0,
      step: 0.01
    },
    {
      name: 'duration',
      label: 'Duración (HH:MM)',
      type: 'text',
      value: formData.duration,
      onChange: handleChange,
      required: true,
      placeholder: 'Ej: 01:30'
    }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando datos del servicio...</p>
      </div>
    );
  }

  return (
    <div className="service-form-container">
      <h2>{id ? 'Editar Servicio' : 'Registrar Nuevo Servicio'}</h2>
      
      <Form
        fields={fields}
        onSubmit={handleSubmit}
        error={error}
        successMessage={successMessage}
        submitText={id ? 'Actualizar Servicio' : 'Registrar Servicio'}
      />
    </div>
  );
};

export default ServiceForm;