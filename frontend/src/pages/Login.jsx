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
        @keyframes floatUpDown1 {
          0% { transform: translateY(0px) scale(1); opacity: 0.25; }
          50% { transform: translateY(-120px) scale(1.15); opacity: 0.45; }
          100% { transform: translateY(0px) scale(1); opacity: 0.25; }
        }

        @keyframes floatUpDown2 {
          0% { transform: translateY(0px) scale(1); opacity: 0.3; }
          50% { transform: translateY(140px) scale(1.1); opacity: 0.5; }
          100% { transform: translateY(0px) scale(1); opacity: 0.3; }
        }

        @keyframes floatUpDown3 {
          0% { transform: translate(0px, 0px) scale(0.9); opacity: 0.2; }
          50% { transform: translate(-80px, -90px) scale(1.2); opacity: 0.4; }
          100% { transform: translate(0px, 0px) scale(0.9); opacity: 0.2; }
        }

        .green-bubble-1 {
          position: absolute;
          top: 10%;
          left: 10%;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, rgba(46, 125, 50, 0.5) 0%, rgba(27, 67, 50, 0) 70%);
          border-radius: 50%;
          filter: blur(45px);
          animation: floatUpDown1 9s ease-in-out infinite;
          pointer-events: none;
        }

        .green-bubble-2 {
          position: absolute;
          bottom: 10%;
          right: 12%;
          width: 380px;
          height: 380px;
          background: radial-gradient(circle, rgba(76, 175, 80, 0.45) 0%, rgba(27, 67, 50, 0) 70%);
          border-radius: 50%;
          filter: blur(55px);
          animation: floatUpDown2 12s ease-in-out infinite;
          pointer-events: none;
        }

        .green-bubble-3 {
          position: absolute;
          bottom: 30%;
          left: 20%;
          width: 240px;
          height: 240px;
          background: radial-gradient(circle, rgba(129, 199, 132, 0.35) 0%, rgba(27, 67, 50, 0) 70%);
          border-radius: 50%;
          filter: blur(40px);
          animation: floatUpDown3 15s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>

      {/* Burbujas verdes flotantes */}
      <div className="green-bubble-1" />
      <div className="green-bubble-2" />
      <div className="green-bubble-3" />

      {/* Tarjeta de Login */}
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
    backgroundColor: '#0a192f',
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
    backdropFilter: 'blur(8px)'
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