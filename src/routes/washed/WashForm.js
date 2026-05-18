import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiService } from "../../api/apiService";
import "./WashForm.css";

const WashForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    clientId: "",
    carId: "",
    serviceIds: [],
    employeeId: "",
    observations: "",
    total: 0,
  });
  console.log('formData::: ', formData);

  const [availableServices, setAvailableServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [cars, setCars] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const [clientsRes, carsRes, servicesRes, employeesRes] = await Promise.allSettled([
        apiService.getClients(),
        apiService.getCars(),
        apiService.getServices(),
        apiService.getEmployees(),
      ]);

      const clientsData = clientsRes.status === 'fulfilled' ? clientsRes.value || [] : [];
      const carsData = carsRes.status === 'fulfilled' ? carsRes.value || [] : [];
      const servicesData = servicesRes.status === 'fulfilled' ? servicesRes.value || [] : [];
      const employeesData = employeesRes.status === 'fulfilled' ? employeesRes.value || [] : [];

      setClients(clientsData);
      setCars(carsData);
      setAvailableServices(servicesData);
      setEmployees(employeesData);

      const failures = [clientsRes, carsRes, servicesRes, employeesRes]
        .filter((r) => r.status === 'rejected')
        .map((r) => r.reason?.message || 'Error desconocido');
      if (failures.length > 0) setError(failures.join(' | '));

      if (id) {
        try {
          const washData = await apiService.getWashedRecord(id);
          const selected = servicesData.filter((service) =>
            washData.serviceOffered.includes(service.id)
          );
          setFormData(washData);
          setSelectedServices(selected);
        } catch (err) {
          setError(err.message);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  // Calcular total
  useEffect(() => {
    const newTotal = selectedServices.reduce((sum, service) => sum + service.price, 0);
    const serviceIds = selectedServices.map((service) => service.id);
    setFormData((prev) => ({
      ...prev,
      total: newTotal,
      serviceIds,
    }));
  }, [selectedServices]);

  const handleAddService = (serviceId) => {
    const serviceToAdd = availableServices.find((s) => s.id === serviceId);
    if (serviceToAdd && !selectedServices.some((s) => s.id === serviceId)) {
      setSelectedServices([...selectedServices, serviceToAdd]);
    }
  };

  const handleRemoveService = (serviceId) => {
    setSelectedServices(selectedServices.filter((s) => s.id !== serviceId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    try {
      if (id) {
        await apiService.updateWashedRecord(id, formData);
        setSuccessMessage("Registro de lavado actualizado correctamente");
      } else {
        console.log('formData send::: ', JSON.parse(JSON.stringify(formData)));
        await apiService.registerWashed(formData);
        setSuccessMessage("Lavado registrado correctamente");
        setFormData({
          date: new Date().toISOString().split("T")[0],
          employeeId: "",
          carId: "",
          serviceIds: [],
          total: 0,
        });
        setSelectedServices([]);
      }
      setTimeout(() => navigate("/washes"), 2000);
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

  if (loading) {
    return <div className="wash-form-card"><h2>Cargando datos...</h2></div>;
  }

  return (
    <div className="wash-form-card">
      <h2>{id ? "Editar Lavado" : "Registrar Lavado"}</h2>
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success">{successMessage}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Fecha</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Cliente</label>
          <select
            name="clientId"
            value={formData.clientId}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona un cliente</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} {client.lastName} ({client.nit})
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Vehículo</label>
          <select
            name="carId"
            value={formData.carId}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona un vehículo</option>
            {cars.map((car) => (
              <option key={car.id} value={car.id}>
                {car.make} {car.color} ({car.licencePlate})
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Empleado</label>
          <select
            name="employeeId"
            value={formData.employeeId}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona un empleado</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name} {employee.lastName}
              </option>
            ))}
          </select>
        </div>
        {/* Selección de servicios */}
        <div className="services-selection">
          <div className="available-services">
            <h4>Servicios Disponibles</h4>
            <select
              size={6}
              onChange={(e) => handleAddService(e.target.value)}
              value=""
            >
              <option value="" disabled>
                Selecciona para agregar
              </option>
              {availableServices
                .filter((s) => !selectedServices.some((ss) => ss.id === s.id))
                .map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} (${service.price})
                  </option>
                ))}
            </select>
         
          </div>
          <div className="selected-services">
            <h4>Servicios Seleccionados</h4>
            <ul>
              {selectedServices.length === 0 ? (
                <li style={{ color: "#888" }}>No hay servicios seleccionados</li>
              ) : (
                selectedServices.map((service) => (
                  <li key={service.id}>
                    {service.name} (${service.price})
                    <button
                      type="button"
                      title="Quitar"
                      onClick={() => handleRemoveService(service.id)}
                    >
                      ×
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
        <div className="total-section">
          Total: ${formData.total.toFixed(2)}
        </div>
        <div className="form-group">
          <label>Observaciones</label>
          <textarea
            name="observations"
            value={formData.observations}
            onChange={handleChange}
            rows={2}
            placeholder="Observaciones (opcional)"
          />
        </div>
        <button type="submit" className="form-button">
          {id ? "Actualizar" : "Guardar"}
        </button>
      </form>
    </div>
  );
};

export default WashForm;
