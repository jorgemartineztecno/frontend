import React, { useState } from "react";

function RegisterClient() {
  const [clientName, setClientName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nit, setNit] = useState("");
  const [phone, setPhone] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Recupera el token del localStorage
  const token = localStorage.getItem("token");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newClient = {
      name: clientName,
      lastName: lastName,
      nit: nit,
      phoneNumber: phone,
    };

    try {
      const response = await fetch("https://backwashapp-production.up.railway.app/clients/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Incluye el token en la autorización
        },
        body: JSON.stringify(newClient),
      });

      if (response.ok) {
        setSuccessMessage("Cliente registrado con éxito.");
        setErrorMessage("");
        // Limpia los campos después de registrar al cliente
        setClientName("");
        setLastName("");
        setNit("");
        setPhone("");
      } else {
        const errorText = await response.text();
        setErrorMessage(`Error al registrar el cliente: ${errorText}`);
        setSuccessMessage("");
      }
    } catch (error) {
      setErrorMessage(`Error de conexión: ${error.message}`);
      setSuccessMessage("");
    }
  };

  return (
    <div className="container">
      <div className="subContainer">
        <h2>Registrar Cliente</h2>
        {successMessage && <p className="success">{successMessage}</p>}
        {errorMessage && <p className="error">{errorMessage}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nombre del cliente"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Apellido"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="NIT"
            value={nit}
            onChange={(e) => setNit(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder="Teléfono"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <button type="submit">Registrar</button>
        </form>
      </div>
    </div>
  );
}

export default RegisterClient;