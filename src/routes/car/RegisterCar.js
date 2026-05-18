import React, { useState } from 'react';

const RegisterCar = () => {
  const [newCar, setNewCar] = useState({ licencePlate: '', make: '', color: '' });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const token = localStorage.getItem('token');

  const handleRegisterCar = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://backwashapp-production.up.railway.app/cars/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newCar),
      });

      if (response.ok) {
        const savedCar = await response.json();
        setSuccessMessage('Auto registrado con éxito');
        setNewCar({ licencePlate: '', make: '', color: '' });
        setError('');
      } else {
        const errorText = await response.text();
        setError(`Error al registrar el auto: ${errorText}`);
      }
    } catch (error) {
      setError(`Error de conexión: ${error.message}`);
    }
  };

  return (
    <div className="container">
      <h3>Registrar Nuevo Auto</h3>
      {error && <p className="error">{error}</p>}
      {successMessage && <p className="success">{successMessage}</p>}

      <form onSubmit={handleRegisterCar}>
        <input
          type="text"
          placeholder="Placa"
          value={newCar.licencePlate}
          onChange={(e) => setNewCar({ ...newCar, licencePlate: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Color"
          value={newCar.color}
          onChange={(e) => setNewCar({ ...newCar, color: e.target.value })}
          required
        />
        <button type="submit">Registrar Auto</button>
      </form>
    </div>
  );
};

export default RegisterCar;
