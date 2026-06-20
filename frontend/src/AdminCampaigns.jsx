import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

export default function AdminCampaigns({ token }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', message: '', sendNow: true });

  useEffect(() => { loadCampaigns(); }, [token]);

  async function loadCampaigns() {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/admin/campaigns`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      setCampaigns(res.data.campaigns || []);
    } catch (err) {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ title: '', message: '', sendNow: true });
    setShowForm(true);
  }

  function openEdit(c) {
    setEditing(c);
    setForm({ title: c.title || '', message: c.message || '', sendNow: !!c.sendNow });
    setShowForm(true);
  }

  function closeForm() { setShowForm(false); setEditing(null); }

  async function submitForm(e) {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`${API_BASE}/admin/campaigns/${editing.id}`, form, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      } else {
        await axios.post(`${API_BASE}/admin/campaigns`, form, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      }
      await loadCampaigns();
      closeForm();
    } catch (err) {
      console.error('Failed saving campaign', err);
      alert('Gagal menyimpan campaign. Lihat console.');
    }
  }

  async function deleteCampaign(id) {
    if (!confirm('Hapus campaign ini?')) return;
    try {
      await axios.delete(`${API_BASE}/admin/campaigns/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      await loadCampaigns();
    } catch (err) {
      console.error('Failed delete', err);
      alert('Gagal menghapus campaign. Lihat console.');
    }
  }

  return (
    <div className="card dark-card campaigns-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Campaigns</h3>
        <div>
          <button type="button" className="btn-primary" onClick={openCreate}>Create Campaign</button>
        </div>
      </div>

      {loading ? (
        <p className="small-text">Loading campaigns...</p>
      ) : (
        <div>
          {campaigns.length === 0 && <p>No campaigns found.</p>}

          {campaigns.length > 0 && (
            <ul style={{ marginTop: 12 }}>
              {campaigns.map((c) => (
                <li key={c.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{c.title}</strong>
                    <div className="small-text">{c.status || 'draft'} — {c.sent || 0} sends</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-ghost" onClick={() => openEdit(c)}>Edit</button>
                    <button className="btn-ghost" onClick={() => deleteCampaign(c.id)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showForm && (
        <div style={{ marginTop: 16 }}>
          <form onSubmit={submitForm}>
            <div style={{ marginBottom: 8 }}>
              <label className="small-text">Title</label>
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label className="small-text">Message</label>
              <textarea className="input" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} required />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <label className="small-text"><input type="checkbox" checked={form.sendNow} onChange={(e) => setForm({ ...form, sendNow: e.target.checked })} /> Send now</label>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
              <button type="button" className="btn-ghost" onClick={closeForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
