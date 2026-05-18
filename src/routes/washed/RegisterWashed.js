import React, { useState } from 'react';

function RegisterWashed() {
  const [carPlate, setCarPlate] = useState('');
  const [washerId, setWasherId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Lógica para registrar el lavado
  };

  return (
    <div className="container">
      <h2>Registrar Lavado</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="Placa del auto" 
          value={carPlate} 
          onChange={(e) => setCarPlate(e.target.value)} 
        />
        <input 
          type="text" 
          placeholder="ID del lavador" 
          value={washerId} 
          onChange={(e) => setWasherId(e.target.value)} 
        />
        <button type="submit">Registrar</button>
      </form>
    </div>
  );
}

export default RegisterWashed;
