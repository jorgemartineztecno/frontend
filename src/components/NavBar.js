import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../auth/authContext";
import "./NavBar.css";

const NavBar = () => {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="logo-link">
          <img
            src="/images/mainlogo-cleanbg.png"
            alt="Logo Empresa"
            className="nav-logo"
          />
        </Link>
      </div>

      <div className="navbar-links">
        {/* Menú principal */}
        <div className="nav-section">
          <Link to="/dashboard" className="nav-link">
            <i className="fas fa-chart-pie"></i> Inicio
          </Link>
          <Link to="/washes/new" className="nav-link">
            <i className="fas fa-car-wash"></i> Nuevo Lavado
          </Link>
          <Link to="/washes" className="nav-link">
            <i className="fas fa-history"></i> Historial
          </Link>
          <Link to="/payments" className="nav-link">
            <i className="fas fa-history"></i> Pagos
          </Link>
          <Link to="/predictions" className="nav-link">
            <i className="fas fa-chart-line"></i> Predicción del Día
          </Link>
        </div>

        {/* Menú de registros */}
        <div className="nav-dropdown">
          <button className="nav-dropbtn">
            <i className="fas fa-database"></i> Registros
          </button>
          <div className="nav-dropdown-content">
            <Link to="/cars">
              <i className="fas fa-car"></i> Vehículos
            </Link>
            <Link to="/clients">
              <i className="fas fa-users"></i> Clientes
            </Link>
            <Link to="/employees">
              <i className="fas fa-user-tie"></i> Empleados
            </Link>
            <Link to="/services">
              <i className="fas fa-concierge-bell"></i> Servicios
            </Link>
          </div>
        </div>
      </div>

      <div className="navbar-actions">
        <button onClick={handleLogout} className="logout-btn">
          <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
