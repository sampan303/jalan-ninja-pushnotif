import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

export default function AdminUsers({ token, setStatus }) {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(response.data.users);
    } catch (err) {
      setStatus('Gagal memuat daftar admin');
    }
  };

  const addUser = async (event) => {
    event.preventDefault();

    try {
      await axios.post(
        `${API_BASE}/admin/users`,
        { name, email, password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatus('Admin baru berhasil ditambahkan');
      setName('');
      setEmail('');
      setPassword('');
      fetchUsers();
    } catch (err) {
      setStatus('Gagal menambahkan admin: ' + (err.response?.data?.error || err.message));
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();

    try {
      await axios.post(
        `${API_BASE}/admin/users/password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatus('Password berhasil diubah');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setStatus('Gagal mengubah password: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="card admin-users">
      <h2>Kelola Admin</h2>
      <div className="user-section">
        <div>
          <h3>Daftar Admin</h3>
          {users.length === 0 ? (
            <p>Tidak ada admin terdaftar.</p>
          ) : (
            <ul>
              {users.map((user) => (
                <li key={user.id}>
                  <strong>{user.name}</strong> — {user.email}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3>Tambah Admin Baru</h3>
          <form onSubmit={addUser} className="settings-form">
            <label>Nama</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="submit" className="btn-primary">Tambah Admin</button>
          </form>
        </div>
      </div>

      <div className="password-section">
        <h3>Ubah Password Saya</h3>
        <form onSubmit={changePassword} className="settings-form">
          <label>Password Saat Ini</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <label>Password Baru</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <button type="submit" className="btn-primary">Ubah Password</button>
        </form>
      </div>
    </div>
  );
}
