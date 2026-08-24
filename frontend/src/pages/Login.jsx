import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanIdentifier = identifier.trim().toLowerCase();

    try {
      const result = await login(cleanIdentifier, password);

      if (result && result.success) {
        const loggedUser = result.user || {};
        if (loggedUser.role === 'admin' || loggedUser.isAdmin) {
          navigate('/admin');
        } else {
          navigate('/caja');
        }
      } else {
        setError(result?.message || 'Credenciales incorrectas');
      }
    } catch (err) {
      setError('Error al conectar con el servidor. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <img src="/logo.png" alt="MG Logo" style={styles.logo} />
          <h2 style={styles.title}>MG PANADERÍA</h2>
          <p style={styles.subtitle}>Sistema de Gestión y Punto de Venta</p>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Usuario o Correo Electrónico</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="ejemplo@panaderia.com o usuario"
              style={styles.input}
              required
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" style={styles.btnSubmit} disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f2337',
    padding: '20px'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '40px 30px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
    textAlign: 'center'
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px'
  },
  logo: {
    width: '160px',
    height: 'auto',
    marginBottom: '12px',
    objectFit: 'contain'
  },
  title: {
    margin: 0,
    fontSize: '1.4rem',
    color: '#1b4332',
    letterSpacing: '1px'
  },
  subtitle: {
    margin: '4px 0 0 0',
    fontSize: '0.85rem',
    color: '#64748b'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    textAlign: 'left'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: 'bold',
    color: '#334155'
  },
  input: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '0.9rem',
    outline: 'none'
  },
  btnSubmit: {
    backgroundColor: '#1b4332',
    color: '#ffffff',
    border: 'none',
    padding: '12px',
    borderRadius: '6px',
    fontWeight: 'bold',
    fontSize: '0.95rem',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'background-color 0.2s'
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    marginBottom: '16px',
    border: '1px solid #fecaca'
  }
};

export default Login;