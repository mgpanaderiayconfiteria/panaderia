import React, { useState, useEffect } from 'react';

const UsersManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Formulario de Alta
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('cajero');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/users`);
      const data = await res.json();
      if (res.ok) {
        setUsers(data);
      } else {
        setError(data.message || 'Error al obtener usuarios');
      }
    } catch (err) {
      setError('Error de conexión con el servidor al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al dar de alta el usuario');
      }

      setSuccess(`Empleado/Usuario "${data.name}" registrado correctamente.`);
      setName('');
      setEmail('');
      setPassword('');
      setRole('cajero');
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (id, userEmail) => {
    if (userEmail === 'mgpanaderiayconfiteria@gmail.com') {
      alert('No es posible eliminar al Administrador Principal del sistema.');
      return;
    }

    if (!window.confirm(`¿Confirmás dar de baja al usuario: ${userEmail}?`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al dar de baja al usuario');
      }

      setSuccess('Usuario eliminado con éxito.');
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.sectionTitle}>Gestor de Usuarios y Empleados</h2>

      {/* Mensajes de Notificación */}
      {error && <div style={styles.errorBox}>{error}</div>}
      {success && <div style={styles.successBox}>{success}</div>}

      <div style={styles.grid}>
        {/* Formulario de Alta de Usuarios */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Alta de Nuevo Empleado / Usuario</h3>
          <form onSubmit={handleCreateUser} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Nombre Completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Juan Pérez"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Correo Electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@panaderia.com"
                style={styles.input}
                required
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
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Rol en el Sistema</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={styles.select}
              >
                <option value="cajero">Cajero / Vendedor</option>
                <option value="empleado">Empleado General</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <button type="submit" style={styles.btnSubmit}>
              Registrar Usuario
            </button>
          </form>
        </div>

        {/* Tabla / Lista de Usuarios Existentes */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Usuarios Registrados</h3>
          {loading ? (
            <p style={styles.loadingText}>Cargando lista de usuarios...</p>
          ) : users.length === 0 ? (
            <p style={styles.emptyText}>No hay usuarios registrados.</p>
          ) : (
            <div style={styles.tableResponsive}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Nombre</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Rol</th>
                    <th style={styles.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} style={styles.tr}>
                      <td style={styles.td}><strong>{u.name}</strong></td>
                      <td style={styles.td}>{u.email}</td>
                      <td style={styles.td}>
                        <span style={u.role === 'admin' || u.isAdmin ? styles.badgeAdmin : styles.badgeCajero}>
                          {u.role === 'admin' || u.isAdmin ? 'Administrador' : 'Cajero'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {u.email !== 'mgpanaderiayconfiteria@gmail.com' ? (
                          <button
                            onClick={() => handleDeleteUser(u._id, u.email)}
                            style={styles.btnDelete}
                          >
                            Dar de baja
                          </button>
                        ) : (
                          <span style={styles.mainAdminTag}>Principal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  sectionTitle: {
    fontSize: '1.6rem',
    color: '#1b4332',
    marginBottom: '20px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px'
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0'
  },
  cardTitle: {
    margin: '0 0 16px 0',
    fontSize: '1.2rem',
    color: '#0f2337'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '0.85rem',
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
  select: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '0.9rem',
    backgroundColor: '#ffffff',
    outline: 'none'
  },
  btnSubmit: {
    backgroundColor: '#1b4332',
    color: '#ffffff',
    border: 'none',
    padding: '12px',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px'
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
    border: '1px solid #fecaca'
  },
  successBox: {
    backgroundColor: '#f0fdf4',
    color: '#166534',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
    border: '1px solid #bbf7d0'
  },
  tableResponsive: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  th: {
    padding: '10px',
    borderBottom: '2px solid #e2e8f0',
    fontSize: '0.85rem',
    color: '#64748b'
  },
  tr: {
    borderBottom: '1px solid #f1f5f9'
  },
  td: {
    padding: '10px',
    fontSize: '0.85rem',
    color: '#334155'
  },
  badgeAdmin: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 'bold'
  },
  badgeCajero: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 'bold'
  },
  btnDelete: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: 'none',
    padding: '6px 10px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  mainAdminTag: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    fontStyle: 'italic'
  },
  loadingText: {
    color: '#64748b',
    fontSize: '0.9rem'
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: '0.9rem'
  }
};

export default UsersManager;