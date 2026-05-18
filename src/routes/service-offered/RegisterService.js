import React, { useState } from 'react';

function RegisterService() {
  const [serviceName, setServiceName] = useState('');
  const [price, setPrice] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
  };

  return (
    <div className="container">
      <h2>Registrar Servicio</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="Nombre del servicio" 
          value={serviceName} 
          onChange={(e) => setServiceName(e.target.value)} 
        />
        <input 
          type="number" 
          placeholder="Precio" 
          value={price} 
          onChange={(e) => setPrice(e.target.value)} 
        />
        <button type="submit">Registrar</button>
      </form>
    </div>
  );
}

export default RegisterService;
