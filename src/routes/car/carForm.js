import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiService } from "../../api/apiService";
import Form from "../../components/Forms";
import "./CarForm.css";

const CarForm = () => {
  const { licencePlate } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    licencePlate: "",
    make: "",
    year: "",
    color: "",
    clientId: "",
  });
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(!!licencePlate);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Cargar datos iniciales si es edición
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar clientes para el select
        const clientsData = await apiService.getClients();
        setClients(clientsData);

        // Si hay placa, cargar datos del vehículo
        if (licencePlate) {
          const carData = await apiService.getCar(licencePlate);
          setFormData(carData);
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [licencePlate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    try {
      if (licencePlate) {
        await apiService.updateCar(licencePlate, formData);
        setSuccessMessage("Vehículo actualizado correctamente");
      } else {
        await apiService.registerCar(formData);
        setSuccessMessage("Vehículo registrado correctamente");
        setFormData({
          licencePlate: "",
          make: "",
          year: "",
          color: "",
          clientId: "",
        });
      }

      // Redirigir después de 2 segundos
      setTimeout(() => navigate("/cars"), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fields = [
    {
      name: "licencePlate",
      label: "Placa",
      type: "text",
      value: formData.licencePlate,
      onChange: handleChange,
      required: true,
      disabled: !!licencePlate, // Bloquear edición de placa si es edición
    },
    {
      name: "make",
      label: "Marca",
      type: "text",
      value: formData.make,
      onChange: handleChange,
      required: true,
    },
    {
      name: "year",
      label: "Año",
      type: "number",
      value: formData.year,
      onChange: handleChange,
      required: true,
      min: 1990,
      max: new Date().getFullYear() + 1,
    },
    {
      name: "color",
      label: "Color",
      type: "text",
      value: formData.color,
      onChange: handleChange,
      required: true,
    },
    {
      name: "clientId",
      label: "Cliente",
      type: "select",
      value: formData.clientId,
      onChange: handleChange,
      required: true,
      options: [
        { value: "", label: "Seleccione un cliente" },
        ...clients.map((client) => ({
          value: client.id,
          label: `${client.name} ${client.lastName} (${client.nit})`,
        })),
      ],
    },
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando datos del vehículo...</p>
      </div>
    );
  }

  return (
    <div className="car-form-container">
      <h2>{licencePlate ? "Editar Vehículo" : "Registrar Nuevo Vehículo"}</h2>

      <Form
        fields={fields}
        onSubmit={handleSubmit}
        error={error}
        successMessage={successMessage}
        submitText={licencePlate ? "Actualizar Vehículo" : "Registrar Vehículo"}
      />
    </div>
  );
};

export default CarForm;
