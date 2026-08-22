import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAdmin, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!isAdmin) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.left}>
        <img src="/logo.png" alt="MG Logo" style={styles.logo} />
        <span style={styles.brand}>MG PANADERÍA | Admin</span>
      </div>
      <div style={styles.right}>
        <Link to="/admin" style={styles.link}>Dashboard</Link>
        <Link to="/caja" style={styles.link}>Vista Caja</Link>
        <span style={styles.userInfo}>👤 {user?.name || 'Admin'}</span>
        <button onClick={handleLogout} style={styles.btnLogout}>Cerrar Sesión</button>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    backgroundColor: '#0f2337',
    color: '#ffffff',
    padding: '10px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  logo: {
    height: '30px',
    width: 'auto'
  },
  brand: {
    fontWeight: 'bold',
    fontSize: '0.95rem',
    letterSpacing: '0.5px'
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  link: {
    color: '#cbd5e1',
    textDecoration: 'none',
    fontSize: '0.85rem',
    fontWeight: '600'
  },
  userInfo: {
    fontSize: '0.85rem',
    color: '#94a3b8'
  },
  btnLogout: {
    backgroundColor: '#c62828',
    color: '#ffffff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};

export default Navbar;