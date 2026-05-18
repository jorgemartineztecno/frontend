import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "./authContext";
import { apiService } from "../api/apiService";
import "./loginPage.css";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const token = await apiService.login({ username, password });
      localStorage.setItem("token", token);
      login();
      navigate("/services");
    } catch (error) {
      setError("Credenciales incorrectas o error al conectar con el servidor");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='login-wrapper'> 
      <div className='login-image'>
        <img
          src="/images/mainlogo-cleanbg.png"
          alt="Logo Empresa"
          className="company-logo"
        />
      </div>
      <div className="login-card">
        <div className="card-header">
          <p>Accede a tu cuenta corporativa</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
            <span className="icon-user" />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <span className="icon-lock" />
          </div>
          <div className="form-group">
            <button className="login-button" type="submit" disabled={isLoading}>
              {isLoading ? <span className="spinner" /> : "Iniciar sesión"}
            </button>
          </div>
          <div className="login-footer-links">
            <a href="/support">Soporte</a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
