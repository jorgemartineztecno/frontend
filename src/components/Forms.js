import React from 'react';
import './Form.css';

const Form = ({ 
  title, 
  fields, 
  onSubmit, 
  error, 
  successMessage,
  submitText = 'Guardar'
}) => {
  return (
    <div className="form-container">
      <h3>{title}</h3>
      {error && <div className="form-error">{error}</div>}
      {successMessage && <div className="form-success">{successMessage}</div>}

      <form onSubmit={onSubmit}>
        {fields.map((field) => (
          <div key={field.name} className="form-group">
            <label htmlFor={field.name}>{field.label}</label>
            
            {field.type === 'select' ? (
              <select
                id={field.name}
                name={field.name}
                value={field.value || ''}
                onChange={field.onChange}
                required={field.required}
              >
                <option value="">Seleccione...</option>
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                id={field.name}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                required={field.required}
              />
            ) : (
              <input
                id={field.name}
                type={field.type || 'text'}
                name={field.name}
                placeholder={field.placeholder}
                value={field.value}
                onChange={field.onChange}
                required={field.required}
                readOnly={field.readOnly}
                step={field.step}
              />
            )}
          </div>
        ))}
        <button type="submit" className="form-submit-button">
          {submitText}
        </button>
      </form>
    </div>
  );
};

export default Form;