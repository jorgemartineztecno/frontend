import React, { useState, useEffect } from 'react';
import './PredictionForm.css';
import { apiService } from '../../api/apiService';

const PredictionForm = () => {
  const [formData, setFormData] = useState({
    idCliente: '',
    diaSemana: '',
    hora: '',
    clima: '',
    temperatura: '',
    tipoServicio: '',
    historialVisitas: '',
    promocionesActivas: '',
  });
  const [employees, setEmployees] = useState([]);
  const [predictionResult, setPredictionResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiService.getEmployees().then(setEmployees).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setPredictionResult(null);
    setLoading(true);

    try {
      const data = {
        idCliente: parseInt(formData.idCliente) || 0,
        diaSemana: formData.diaSemana,
        hora: parseInt(formData.hora),
        clima: formData.clima,
        temperatura: Number(formData.temperatura),
        tipoServicio: formData.tipoServicio,
        historialVisitas: parseInt(formData.historialVisitas) || 0,
        promocionesActivas: formData.promocionesActivas,
      };

      if (data.hora < 0 || data.hora > 23) {
        throw new Error('La hora debe estar entre 0 y 23.');
      }
      if (data.temperatura < -50 || data.temperatura > 50) {
        throw new Error('Temperatura debe estar entre -50 y 50 °C.');
      }
      if (data.historialVisitas < 0) {
        throw new Error('Historial de visitas no puede ser negativo.');
      }

      const response = await apiService.predictDemand(data);
      setPredictionResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prediction-form-container">
      <div className="form-header">
        <h2>Predicción de Demanda</h2>
        <p className="form-subtitle">Complete el formulario para predecir la demanda del servicio de lavado</p>
      </div>

      <form onSubmit={handleSubmit} className="prediction-form">
        <div className="form-grid">
          <div className="form-column">
            <div className="form-field">
              <label htmlFor="idCliente">
                <span className="field-icon">👤</span>
                Empleado
              </label>
              <select
                id="idCliente"
                name="idCliente"
                value={formData.idCliente}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione un empleado</option>
                {employees.map((emp, idx) => (
                  <option key={emp.id} value={idx + 1}>
                    {emp.name} {emp.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="diaSemana">
                <span className="field-icon">📅</span>
                Día de la Semana
              </label>
              <select
                id="diaSemana"
                name="diaSemana"
                value={formData.diaSemana}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione un día</option>
                <option value="Lunes">Lunes</option>
                <option value="Martes">Martes</option>
                <option value="Miercoles">Miércoles</option>
                <option value="Jueves">Jueves</option>
                <option value="Viernes">Viernes</option>
                <option value="Sabado">Sábado</option>
                <option value="Domingo">Domingo</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="hora">
                <span className="field-icon">🕒</span>
                Hora (0–23)
              </label>
              <input
                type="number"
                id="hora"
                name="hora"
                value={formData.hora}
                onChange={handleChange}
                min="0"
                max="23"
                placeholder="Hora del día (ej: 8, 14, 20)"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="temperatura">
                <span className="field-icon">🌡️</span>
                Temperatura (°C)
              </label>
              <input
                type="number"
                id="temperatura"
                name="temperatura"
                value={formData.temperatura}
                onChange={handleChange}
                step="0.1"
                placeholder="Temperatura en grados Celsius"
                required
              />
            </div>
          </div>

          <div className="form-column">
            <div className="form-field">
              <label htmlFor="clima">
                <span className="field-icon">🌤️</span>
                Clima
              </label>
              <select
                id="clima"
                name="clima"
                value={formData.clima}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione el clima</option>
                <option value="Soleado">Soleado</option>
                <option value="Lluvioso">Lluvioso</option>
                <option value="Nublado">Nublado</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="tipoServicio">
                <span className="field-icon">🚿</span>
                Tipo de Servicio
              </label>
              <select
                id="tipoServicio"
                name="tipoServicio"
                value={formData.tipoServicio}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione el servicio</option>
                <option value="Basico">Básico</option>
                <option value="Completo">Completo</option>
                <option value="Premium">Premium</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="historialVisitas">
                <span className="field-icon">📊</span>
                Historial de Visitas
              </label>
              <input
                type="number"
                id="historialVisitas"
                name="historialVisitas"
                value={formData.historialVisitas}
                onChange={handleChange}
                min="0"
                step="1"
                placeholder="Número de visitas previas"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="promocionesActivas">
                <span className="field-icon">🏷️</span>
                Promociones Activas
              </label>
              <select
                id="promocionesActivas"
                name="promocionesActivas"
                value={formData.promocionesActivas}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione una opción</option>
                <option value="Si">Sí</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? (
              <span className="loading-spinner"></span>
            ) : (
              <>
                <span className="button-icon">🔮</span>
                Predecir Demanda
              </>
            )}
          </button>
        </div>
      </form>

      {predictionResult && (
        <div className="prediction-result">
          <div className="result-header">
            <span className="result-icon">✅</span>
            <h3>Resultado de la Predicción</h3>
          </div>
          <div className="result-content">
            <div className="result-item">
              <span className="result-label">Clientes Estimados:</span>
              <span className="result-value">{predictionResult.prediccion}</span>
            </div>
            <div className="result-item">
              <span className="result-label">Confianza:</span>
              <span className="result-value">{predictionResult.confianza}</span>
              <div className="confidence-bar">
                <div
                  className="confidence-fill"
                  style={{ width: predictionResult.confianza }}
                ></div>
              </div>
            </div>
            <div className="result-item">
              <span className="result-label">ID de Registro:</span>
              <span className="result-value">{predictionResult.id}</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default PredictionForm;
