import React, { useState } from 'react';

const RegisterEmployee = () => {
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    lastName: '',
    position: '',
    phoneNumber: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const token = localStorage.getItem('token');

  const handleRegisterEmployee = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://backwashapp-production.up.railway.app/employees/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newEmployee),
      });

      if (response.ok) {
        const savedEmployee = await response.json();
        setSuccessMessage('Empleado registrado con éxito');
        setNewEmployee({ name: '', lastName: '', position: '', phoneNumber: '' });
        setError('');
      } else {
        const errorText = await response.text();
        setError(`Error al registrar el empleado: ${errorText}`);
      }
    } catch (error) {
      setError(`Error de conexión: ${error.message}`);
    }
  };

  return (
    <div className="container">
      <h3>Registrar Nuevo Empleado</h3>
      {error && <p className="error">{error}</p>}
      {successMessage && <p className="success">{successMessage}</p>}

      <form onSubmit={handleRegisterEmployee}>
        <input
          type="text"
          placeholder="Nombre"
          value={newEmployee.name}
          onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Apellido"
          value={newEmployee.lastName}
          onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Posición"
          value={newEmployee.position}
          onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Teléfono"
          value={newEmployee.phoneNumber}
          onChange={(e) => setNewEmployee({ ...newEmployee, phoneNumber: e.target.value })}
          required
        />
        <button type="submit">Registrar Empleado</button>
      </form>
    </div>
  );
};

export default RegisterEmployee;
