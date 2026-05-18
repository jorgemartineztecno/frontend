import React, { useState, useEffect } from 'react';
import './PredictionForm.css';
import { apiService } from '../../api/apiService';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const nowDay = () => DAYS[new Date().getDay()];
const nowHour = () => new Date().getHours();

const PredictionForm = () => {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    idCliente: '',
    diaSemana: nowDay(),
    hora: nowHour(),
    clima: '',
    temperatura: 24,
    tipoServicio: '',
    historialVisitas: 5,
    promocionesActivas: 'No',
  });
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
        idCliente: parseInt(formData.idCliente) || 1,
        diaSemana: formData.diaSemana,
        hora: parseInt(formData.hora),
        clima: formData.clima,
        temperatura: Number(formData.temperatura),
        tipoServicio: formData.tipoServicio,
        historialVisitas: parseInt(formData.historialVisitas) || 5,
        promocionesActivas: formData.promocionesActivas,
      };

      const response = await apiService.predictDemand(data);
      if (response.error) throw new Error(response.error);
      setPredictionResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDemandColor = (prediccion) => {
    if (!prediccion) return '#6e8efb';
    const p = prediccion.toLowerCase();
    if (p.includes('alto') || p.includes('alta')) return '#43a047';
    if (p.includes('medio') || p.includes('media')) return '#fb8c00';
    return '#e53935';
  };

  const getDemandIcon = (prediccion) => {
    if (!prediccion) return '📊';
    const p = prediccion.toLowerCase();
    if (p.includes('alto') || p.includes('alta')) return '🔥';
    if (p.includes('medio') || p.includes('media')) return '📈';
    return '📉';
  };

  return (
    <div className="prediction-form-container">
      <div className="form-header">
        <h2>Predicción de Demanda</h2>
        <p className="form-subtitle">Selecciona los datos del turno para predecir la demanda</p>
      </div>

      <form onSubmit={handleSubmit} className="prediction-form">

        {/* Fila 1: Empleado + Clima */}
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="idCliente">Empleado</label>
            <select id="idCliente" name="idCliente" value={formData.idCliente} onChange={handleChange} required>
              <option value="">Seleccione un empleado</option>
              {employees.map((emp, idx) => (
                <option key={emp.id} value={idx + 1}>
                  {emp.name} {emp.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="clima">Clima de hoy</label>
            <select id="clima" name="clima" value={formData.clima} onChange={handleChange} required>
              <option value="">¿Cómo está el clima?</option>
              <option value="Soleado">☀️ Soleado</option>
              <option value="Nublado">⛅ Nublado</option>
              <option value="Lluvioso">🌧️ Lluvioso</option>
            </select>
          </div>
        </div>

        {/* Fila 2: Servicio + Día */}
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="tipoServicio">Tipo de Servicio</label>
            <select id="tipoServicio" name="tipoServicio" value={formData.tipoServicio} onChange={handleChange} required>
              <option value="">Seleccione el servicio</option>
              <option value="Basico">🚗 Básico</option>
              <option value="Completo">✨ Completo</option>
              <option value="Premium">💎 Premium</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="diaSemana">Día de la semana</label>
            <select id="diaSemana" name="diaSemana" value={formData.diaSemana} onChange={handleChange} required>
              {DAYS.map((d, i) => (
                <option key={d} value={d}>{DAY_LABELS[i]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Fila 3: Hora + Promociones */}
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="hora">Hora del turno</label>
            <select id="hora" name="hora" value={formData.hora} onChange={handleChange} required>
              {Array.from({ length: 12 }, (_, i) => i + 7).map((h) => (
                <option key={h} value={h}>{h}:00</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="promocionesActivas">¿Hay promoción activa?</label>
            <select id="promocionesActivas" name="promocionesActivas" value={formData.promocionesActivas} onChange={handleChange} required>
              <option value="No">No</option>
              <option value="Si">Sí</option>
            </select>
          </div>
        </div>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? <span className="loading-spinner" /> : '🔮 Predecir Demanda'}
        </button>
      </form>

      {predictionResult && (
        <div className="prediction-result" style={{ borderColor: getDemandColor(predictionResult.prediccion) }}>
          <div className="result-header" style={{ background: getDemandColor(predictionResult.prediccion) }}>
            <span className="result-big-icon">{getDemandIcon(predictionResult.prediccion)}</span>
            <div>
              <p className="result-label-sm">Demanda estimada</p>
              <h2 className="result-main">{predictionResult.prediccion}</h2>
            </div>
          </div>
          <div className="result-body">
            <div className="result-conf-row">
              <span>Confianza</span>
              <span className="result-conf-pct">{predictionResult.confianza}</span>
            </div>
            <div className="conf-bar-wrap">
              <div
                className="conf-bar-fill"
                style={{
                  width: predictionResult.confianza,
                  background: getDemandColor(predictionResult.prediccion),
                }}
              />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default PredictionForm;
