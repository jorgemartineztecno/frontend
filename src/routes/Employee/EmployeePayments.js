import React, { useState, useEffect } from "react";
import { apiService } from "../../api/apiService";
import DataTable from "../../components/DataTable";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./EmployeePayments.css";

const EmployeePayments = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [calculatedPayment, setCalculatedPayment] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setMonth(end.getMonth() - 1);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return [start, end];
  };

  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [startDate, endDate] = dateRange;

  const fetchHistory = async () => {
    try {
      const data = await apiService.getPaymentRecords();
      setHistory(data || []);
    } catch {
      setHistory([]);
    }
  };

  useEffect(() => {
    Promise.all([apiService.getEmployees(), apiService.getPaymentRecords()])
      .then(([emp, hist]) => {
        setEmployees(emp || []);
        setHistory(hist || []);
        setLoading(false);
      })
      .catch((err) => {
        setError("Error al cargar datos: " + err.message);
        setLoading(false);
      });
  }, []);

  const handleDateRangeChange = (update) => {
    if (update[0] && update[1]) setDateRange(update);
  };

  const calculatePayments = async () => {
    if (!selectedEmployee) return;
    setCalculating(true);
    setError("");
    setSuccess("");
    setCalculatedPayment(null);

    try {
      const adjustedStart = new Date(startDate);
      adjustedStart.setHours(0, 0, 0, 0);
      const adjustedEnd = new Date(endDate);
      adjustedEnd.setHours(23, 59, 59, 999);

      const total = await apiService.calculateEmployeePayment(
        selectedEmployee, adjustedStart, adjustedEnd
      );

      const employee = employees.find((e) => e.id === selectedEmployee);
      setCalculatedPayment({
        employeeId: selectedEmployee,
        employeeName: employee ? `${employee.name} ${employee.lastName}` : selectedEmployee,
        startDate: adjustedStart,
        endDate: adjustedEnd,
        totalPayment: typeof total === "number" ? total : 0,
      });
    } catch (err) {
      setError("Error al calcular: " + (err.message || "Intenta de nuevo"));
    } finally {
      setCalculating(false);
    }
  };

  const handleSave = async () => {
    if (!calculatedPayment) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await apiService.savePaymentRecord(calculatedPayment);
      setSuccess("✅ Pago guardado correctamente");
      setCalculatedPayment(null);
      await fetchHistory();
    } catch (err) {
      setError("Error al guardar: " + (err.message || "Intenta de nuevo"));
    } finally {
      setSaving(false);
    }
  };

  const historyColumns = [
    {
      key: "employeeName",
      title: "Empleado",
    },
    {
      key: "period",
      title: "Periodo",
      render: (r) =>
        `${new Date(r.startDate).toLocaleDateString()} - ${new Date(r.endDate).toLocaleDateString()}`,
    },
    {
      key: "totalPayment",
      title: "Total Pagado (35%)",
      render: (r) => `$${Number(r.totalPayment).toFixed(2)}`,
    },
    {
      key: "calculatedAt",
      title: "Registrado",
      render: (r) => new Date(r.calculatedAt).toLocaleString(),
    },
  ];

  if (loading) return <div>Cargando datos...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Cálculo de Pagos a Empleados</h2>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "10px 14px", borderRadius: "8px", marginBottom: "12px" }}>
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div style={{ background: "#dcfce7", color: "#166534", padding: "10px 14px", borderRadius: "8px", marginBottom: "12px" }}>
          {success}
        </div>
      )}

      <div className="payment-controls">
        <div className="form-group">
          <label>Empleado:</label>
          <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}>
            <option value="">Seleccionar empleado</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} {e.lastName}
              </option>
            ))}
          </select>
        </div>

        <div className="form-dates">
          <div>
            <label>Fecha Inicio:</label>
            <DatePicker
              selected={startDate}
              onChange={(d) => handleDateRangeChange([d, endDate])}
              selectsStart startDate={startDate} endDate={endDate}
              maxDate={new Date()}
            />
          </div>
          <div>
            <label>Fecha Fin:</label>
            <DatePicker
              selected={endDate}
              onChange={(d) => handleDateRangeChange([startDate, d])}
              selectsEnd startDate={startDate} endDate={endDate}
              minDate={startDate} maxDate={new Date()}
            />
          </div>
          <div className="calc-button">
            <button onClick={calculatePayments} disabled={!selectedEmployee || calculating}>
              {calculating ? "Calculando..." : "Calcular Pago"}
            </button>
          </div>
        </div>
      </div>

      {calculatedPayment && (
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "16px 20px", marginBottom: "20px" }}>
          <h3 style={{ margin: "0 0 10px", color: "#1e40af" }}>Resultado del cálculo</h3>
          <p style={{ margin: "4px 0" }}><strong>Empleado:</strong> {calculatedPayment.employeeName}</p>
          <p style={{ margin: "4px 0" }}>
            <strong>Periodo:</strong> {new Date(calculatedPayment.startDate).toLocaleDateString()} — {new Date(calculatedPayment.endDate).toLocaleDateString()}
          </p>
          <p style={{ margin: "4px 0", fontSize: "18px", color: "#1e40af" }}>
            <strong>Total a pagar (35%):</strong> ${Number(calculatedPayment.totalPayment).toFixed(2)}
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ marginTop: "12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 20px", cursor: "pointer", fontSize: "14px" }}
          >
            {saving ? "Guardando..." : "Guardar Pago"}
          </button>
        </div>
      )}

      <h3 style={{ marginTop: "24px", marginBottom: "10px" }}>Historial de Pagos Guardados</h3>
      <DataTable
        columns={historyColumns}
        data={history}
        emptyMessage="No hay pagos guardados aún"
      />
    </div>
  );
};

export default EmployeePayments;
