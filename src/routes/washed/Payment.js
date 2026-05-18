import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../../api/apiService';
import './Payment.css';

const Payment = () => {
  const { washId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    washId: washId || '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    amount: 0,
    reference: '',
    notes: ''
  });
  const [washes, setWashes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!washId) {
        setLoading(true);
        try {
          const washesData = await apiService.getWashedRecords();
          setWashes(washesData);
          setLoading(false);
        } catch (err) {
          setError(err.message);
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [washId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    try {
      await apiService.registerPayment(formData);
      setSuccessMessage('Pago registrado correctamente');
      setTimeout(() => navigate('/payments'), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  if (loading) {
    return <div className="payment-card"><h2>Cargando datos...</h2></div>;
  }

  return (
    <div className="payment-card">
      <h2>Registrar Pago</h2>
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success">{successMessage}</div>}
      <form onSubmit={handleSubmit}>
        {!washId && (
          <div className="form-group">
            <label>Lavado</label>
            <select
              name="washId"
              value={formData.washId}
              onChange={handleChange}
              required
            >
              <option value="">Selecciona un lavado</option>
              {washes.map(wash => (
                <option key={wash.id} value={wash.id}>
                  Lavado #{wash.id} - {wash.clientName} (${wash.total})
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="form-group">
          <label>Fecha de Pago</label>
          <input
            type="date"
            name="paymentDate"
            value={formData.paymentDate}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Método de Pago</label>
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            required
          >
            <option value="cash">Efectivo</option>
            <option value="credit_card">Tarjeta de Crédito</option>
            <option value="debit_card">Tarjeta de Débito</option>
            <option value="transfer">Transferencia Bancaria</option>
          </select>
        </div>
        <div className="form-group">
          <label>Monto</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleNumberChange}
            required
            step="0.01"
          />
        </div>
        {formData.paymentMethod !== 'cash' && (
          <div className="form-group">
            <label>Referencia/Número</label>
            <input
              type="text"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              required
            />
          </div>
        )}
        <div className="form-group">
          <label>Notas</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={2}
            placeholder="Notas (opcional)"
          />
        </div>
        <button type="submit" className="form-button">
          Registrar Pago
        </button>
      </form>
    </div>
  );
};

export default Payment;
