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
      <style>{`
        @keyframes gradientBg {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes floatOrb1 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(60px, -40px) scale(1.1); }
          100% { transform: translate(0px, 0px) scale(1); }
        }

        @keyframes floatOrb2 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-50px, 50px) scale(1.2); }
          100% { transform: translate(0px, 0px) scale(1); }
        }

        .login-bg-animated {
          background: linear-gradient(-45deg, #0f2337, #1b4332, #2b1117, #0b1829);
          background-size: 400% 400%;
          animation: gradientBg 12s ease infinite;
        }

        .orb-1 {
          position: absolute;
          top: 15%;
          left: 15%;
          width: 280px;
          height: 280px;
          background: radial-gradient(circle, rgba(220, 38, 38, 0.22) 0%, rgba(0,0,0,0) 70%);
          border-radius: 50%;
          filter: blur(40px);
          animation: floatOrb1 10s ease-in-out infinite;
          pointer-events: none;
        }

        .orb-2 {
          position: absolute;
          bottom: 15%;
          right: 15%;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, rgba(27, 67, 50, 0.35) 0%, rgba(0,0,0,0) 70%);
          border-radius: 50%;
          filter: blur(50px);
          animation: floatOrb2 14s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>

      {/* Orbes de luz animados de fondo */}
      <div className="orb-1" />
      <div className="orb-2" />

      {/* Tarjeta de login principal */}
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
    padding: '20px',
    position: 'relative',
    overflow: 'hidden'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '40px 30px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
    textAlign: 'center',
    zIndex: 10,
    backdropFilter: 'blur(5px)'
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
    transition: 'background-color 0.2s, transform 0.1s'
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