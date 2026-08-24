import React, { useState, useEffect } from 'react';

const UsersManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('cajero');

  const [editingUserId, setEditingUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const ROLES_MAP = {
    admin: { label: 'Dueño (Admin)', badgeStyle: 'badgeAdmin' },
    encargado: { label: 'Encargado', badgeStyle: 'badgeEncargado' },
    cajero: { label: 'Cajero / Vendedor', badgeStyle: 'badgeCajero' },
    cocinero: { label: 'Cocinero', badgeStyle: 'badgeCocinero' },
    despachante: { label: 'Despachante', badgeStyle: 'badgeDespachante' }
  };

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/users`);
      const data = await res.json();
      res.ok ? setUsers(data) : setError(data.message || 'Error al obtener usuarios');
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
      const payload = {
        name,
        username: username.toLowerCase().trim(),
        email: email ? email.toLowerCase().trim() : `${username.toLowerCase().trim()}@panaderia.local`,
        password,
        role
      };
      const res = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al dar de alta el usuario');

      setSuccess(`Empleado "${data.name}" registrado correctamente.`);
      setName(''); setUsername(''); setEmail(''); setPassword(''); setRole('cajero');
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) return;
    setError(''); setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/users/${editingUserId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al actualizar la contraseña');

      setSuccess('Contraseña actualizada correctamente.');
      setEditingUserId(null); setNewPassword('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (id, userIdentifier) => {
    if (userIdentifier === 'mgpanaderiayconfiteria@gmail.com' || userIdentifier === 'admin') {
      alert('No es posible eliminar al Administrador Principal del sistema.');
      return;
    }
    if (!window.confirm(`¿Confirmás dar de baja al usuario: ${userIdentifier}?`)) return;

    setError(''); setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al dar de baja al usuario');

      setSuccess('Usuario eliminado con éxito.');
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.sectionTitle}>GESTOR DE USUARIOS Y EMPLEADOS</h2>

      {error && <div style={styles.errorBox}>{error}</div>}
      {success && <div style={styles.successBox}>{success}</div>}

      <div style={styles.grid}>
        {/* Formulario de Alta */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Alta de Nuevo Empleado / Usuario</h3>
          <form onSubmit={handleCreateUser} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Nombre Completo</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Juan Pérez" style={styles.input} required />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Usuario (ingreso rápido)</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ej: juan.perez o cajero1" style={styles.input} required />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Rol en el Sistema</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} style={styles.select}>
                <option value="admin">Dueño (Administrador)</option>
                <option value="encargado">Encargado</option>
                <option value="cajero">Cajero / Vendedor</option>
                <option value="cocinero">Cocinero</option>
                <option value="despachante">Despachante / Pedidos</option>
              </select>
            </div>

            {role === 'admin' && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>Correo Electrónico (Admin)</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ejemplo@panaderia.com" style={styles.input} />
              </div>
            )}

            <div style={styles.inputGroup}>
              <label style={styles.label}>Contraseña Inicial</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={styles.input} required />
            </div>

            <button type="submit" style={styles.btnSubmit}>Registrar Empleado</button>
          </form>
        </div>

        {/* Lista de Usuarios (Adapta Tabla a Tarjetas) */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Usuarios Registrados</h3>

          {editingUserId && (
            <div style={styles.resetCard}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem' }}>Cambiar Contraseña</h4>
              <form onSubmit={handleResetPassword} style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nueva clave" style={{ ...styles.input, flex: '1', minWidth: '120px' }} required />
                <button type="submit" style={styles.btnSave}>Guardar</button>
                <button type="button" onClick={() => setEditingUserId(null)} style={styles.btnCancel}>Cancelar</button>
              </form>
            </div>
          )}

          {loading ? (
            <p style={styles.emptyText}>Cargando usuarios...</p>
          ) : users.length === 0 ? (
            <p style={styles.emptyText}>No hay usuarios registrados.</p>
          ) : (
            <div style={styles.userList}>
              {users.map((u) => {
                const roleInfo = ROLES_MAP[u.role] || ROLES_MAP['cajero'];
                const identifier = u.username || u.email;
                const isMainAdmin = u.email === 'mgpanaderiayconfiteria@gmail.com';

                return (
                  <div key={u._id} style={styles.userCard}>
                    <div style={styles.userInfo}>
                      <span style={styles.userName}>{u.name}</span>
                      <span style={styles.userIdentifier}>{identifier}</span>
                    </div>

                    <div style={styles.userMeta}>
                      <span style={styles[roleInfo.badgeStyle]}>{roleInfo.label}</span>
                      <div style={styles.actionGroup}>
                        <button onClick={() => { setEditingUserId(u._id); setNewPassword(''); }} style={styles.btnReset}>Clave</button>
                        {!isMainAdmin ? (
                          <button onClick={() => handleDeleteUser(u._id, identifier)} style={styles.btnDelete}>Baja</button>
                        ) : (
                          <span style={styles.mainAdminTag}>Principal</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '16px', maxWidth: '1100px', margin: '0 auto' },
  sectionTitle: { fontSize: '1.2rem', fontWeight: 'bold', color: '#1b4332', marginBottom: '16px', letterSpacing: '0.5px' },
  grid: { display: 'flex', flexWrap: 'wrap', gap: '16px' },
  card: { backgroundColor: '#ffffff', padding: '18px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', flex: '1', minWidth: '300px' },
  resetCard: { backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '12px' },
  cardTitle: { margin: '0 0 14px 0', fontSize: '0.9rem', color: '#0f172a', fontWeight: 'bold', textTransform: 'uppercase' },
  form: { display: 'flex', flexDirection: 'column', gap: '10px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '0.75rem', fontWeight: '600', color: '#475569' },
  input: { padding: '8px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' },
  select: { padding: '8px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff', outline: 'none' },
  btnSubmit: { backgroundColor: '#1b4332', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', marginTop: '6px' },
  btnSave: { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' },
  btnCancel: { backgroundColor: '#64748b', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' },
  errorBox: { backgroundColor: '#fef2f2', color: '#991b1b', padding: '10px', borderRadius: '6px', marginBottom: '12px', fontSize: '0.8rem', border: '1px solid #fecaca' },
  successBox: { backgroundColor: '#f0fdf4', color: '#166534', padding: '10px', borderRadius: '6px', marginBottom: '12px', fontSize: '0.8rem', border: '1px solid #bbf7d0' },
  userList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  userCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderRadius: '6px', border: '1px solid #f1f5f9', backgroundColor: '#fafafa', flexWrap: 'wrap', gap: '8px' },
  userInfo: { display: 'flex', flexDirection: 'column', minWidth: '130px', wordBreak: 'break-word' },
  userName: { fontWeight: 'bold', fontSize: '0.85rem', color: '#1e293b' },
  userIdentifier: { fontSize: '0.75rem', color: '#64748b' },
  userMeta: { display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between', flex: '1', minWidth: '180px' },
  actionGroup: { display: 'flex', gap: '6px', alignItems: 'center' },
  badgeAdmin: { backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' },
  badgeEncargado: { backgroundColor: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' },
  badgeCajero: { backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' },
  badgeCocinero: { backgroundColor: '#ffedd5', color: '#9a3412', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' },
  badgeDespachante: { backgroundColor: '#f3e8ff', color: '#6b21a8', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' },
  btnReset: { backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' },
  btnDelete: { backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' },
  mainAdminTag: { fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' },
  emptyText: { color: '#94a3b8', fontSize: '0.85rem' }
};

export default UsersManager;