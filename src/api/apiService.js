const API_BASE_URL = process.env.NODE_ENV === "production"
  ? "https://backend-production-b1a88.up.railway.app"
  : "http://localhost:8080";

const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Error en la solicitud");
    }

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const apiService = {
  // Autenticación
  login: (credentials) =>
    fetchWithAuth("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  // Empleados
  getEmployees: () => fetchWithAuth("/employees"),
  registerEmployee: (employee) =>
    fetchWithAuth("/employees/register", {
      method: "POST",
      body: JSON.stringify(employee),
    }),
  deleteEmployee: (id) =>
    fetchWithAuth(`/employees/${id}`, { method: "DELETE" }),

  // Vehículos
  getCars: () => fetchWithAuth("/cars"),
  registerCar: (car) =>
    fetchWithAuth("/cars/register", {
      method: "POST",
      body: JSON.stringify(car),
    }),
  deleteCar: (id) =>
    fetchWithAuth(`/cars/${id}`, { method: "DELETE" }),

  // Clientes
  getClients: () => fetchWithAuth("/clients"),
  registerClient: (client) =>
    fetchWithAuth("/clients/register", {
      method: "POST",
      body: JSON.stringify(client),
    }),
  deleteClient: (id) =>
    fetchWithAuth(`/clients/${id}`, { method: "DELETE" }),

  // Servicios
  getServices: () => fetchWithAuth("/services"),
  registerService: (service) =>
    fetchWithAuth("/services/register", {
      method: "POST",
      body: JSON.stringify(service),
    }),
  deleteService: (id) =>
    fetchWithAuth(`/services/${id}`, { method: "DELETE" }),

  // Lavados
  getWashedRecords: () => fetchWithAuth("/washed"),
  getWashedRecord: (id) => fetchWithAuth(`/washed/${id}`),
  registerWashed: (record) =>
    fetchWithAuth("/washed/register", {
      method: "POST",
      body: JSON.stringify({
        client: record.clientId,
        employee: record.employeeId,
        car: record.carId,
        serviceOffered: record.serviceIds,
        total: record.total,
      }),
    }),
  updateWashedRecord: (id, record) =>
    fetchWithAuth(`/washed/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        client: record.clientId,
        employee: record.employeeId,
        car: record.carId,
        serviceOffered: record.serviceIds,
        total: record.total,
      }),
    }),
  deleteWashedRecord: (id) =>
    fetchWithAuth(`/washed/${id}`, { method: "DELETE" }),

  calculateEmployeePayment: (employeeId, startDate, endDate) =>
    fetchWithAuth(
      `/washed/employee/${employeeId}/payment?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
      { method: "GET" }
    ),

  // Predicciones
  predictDemand: (data) =>
    fetchWithAuth("/api/predecir", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getPlanDia: (diaSemana) =>
    fetchWithAuth(`/api/dia/${diaSemana}`, { method: "GET" }),
  getOptimizacion: (diaSemana) =>
    fetchWithAuth(`/api/optimizar/${diaSemana}`, { method: "GET" }),
  getPredictionHistory: () =>
    fetchWithAuth("/api/historial", { method: "GET" }),

  // Chat
  sendChatMessage: (message) =>
    fetchWithAuth("/chat/message", {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  // Registros de pago
  savePaymentRecord: (record) =>
    fetchWithAuth("/payment-records/save", {
      method: "POST",
      body: JSON.stringify(record),
    }),
  getPaymentRecords: () => fetchWithAuth("/payment-records"),
  getPaymentRecordsByEmployee: (employeeId) =>
    fetchWithAuth(`/payment-records/employee/${employeeId}`),
};
