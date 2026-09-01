'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Patient {
  _id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  dateOfBirth: string;
  gender: string;
  address: string;
}

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchPatients = async () => {
    try {
      const url = search ? `http://localhost:5000/patients?search=${search}` : 'http://localhost:5000/patients';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPatients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchPatients();
  }, [search, token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPatient
        ? `http://localhost:5000/patients/${editingPatient._id}`
        : 'http://localhost:5000/patients';
      const method = editingPatient ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingPatient(null);
        setFormData({ name: '', email: '', phone: '', dateOfBirth: '', gender: '', address: '' });
        fetchPatients();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await fetch(`http://localhost:5000/patients/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchPatients();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:5000/patients/${id}/deactivate`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchPatients();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      name: patient.name,
      email: patient.email,
      phone: patient.phone || '',
      dateOfBirth: patient.dateOfBirth || '',
      gender: patient.gender || '',
      address: patient.address || '',
    });
    setShowForm(true);
  };

  const startSession = (patientId: string, patientName: string) => {
    router.push(`/session/${patientId}?name=${encodeURIComponent(patientName)}`);
  };

  // ✅ NEW: View Patient Profile
  const viewProfile = (patientId: string) => {
    router.push(`/patients/${patientId}`);
  };

  if (loading) return <div className="container"><p>Loading patients...</p></div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Patients</h1>
        <div>
          <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingPatient(null); setFormData({ name: '', email: '', phone: '', dateOfBirth: '', gender: '', address: '' }); }}>
            + Add Patient
          </button>
          <button className="btn btn-danger" style={{ marginLeft: '10px' }} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Search patients by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: '400px' }}
          />
        </div>

        {showForm && (
          <div className="card" style={{ background: '#f8fafc' }}>
            <h3>{editingPatient ? 'Edit Patient' : 'Add New Patient'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label>Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button type="submit" className="btn btn-primary">{editingPatient ? 'Update' : 'Save'}</button>
                <button type="button" className="btn" style={{ background: '#e5e7eb' }} onClick={() => { setShowForm(false); setEditingPatient(null); }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Name</th>
                <th style={{ padding: '12px' }}>Email</th>
                <th style={{ padding: '12px' }}>Phone</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>{p.name}</td>
                  <td style={{ padding: '12px' }}>{p.email}</td>
                  <td style={{ padding: '12px' }}>{p.phone || '-'}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ color: p.isActive ? '#16a34a' : '#dc2626' }}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {/* ✅ NEW - View Profile Button */}
                    <button 
                      className="btn" 
                      style={{ 
                        marginRight: '6px', 
                        fontSize: '12px', 
                        padding: '4px 12px', 
                        background: '#8b5cf6', 
                        color: 'white' 
                      }} 
                      onClick={() => viewProfile(p._id)}
                    >
                      📋 View
                    </button>
                    
                    {/* Start Session Button */}
                    <button 
                      className="btn btn-primary" 
                      style={{ marginRight: '6px', fontSize: '12px', padding: '4px 12px' }} 
                      onClick={() => startSession(p._id, p.name)}
                    >
                      🚀 Session
                    </button>
                    
                    {/* Edit Button */}
                    <button 
                      className="btn btn-warning" 
                      style={{ marginRight: '6px', fontSize: '12px', padding: '4px 12px' }} 
                      onClick={() => handleEdit(p)}
                    >
                      Edit
                    </button>
                    
                    {/* Deactivate Button */}
                    {p.isActive && (
                      <button 
                        className="btn btn-danger" 
                        style={{ marginRight: '6px', fontSize: '12px', padding: '4px 12px' }} 
                        onClick={() => handleDeactivate(p._id)}
                      >
                        Deactivate
                      </button>
                    )}
                    
                    {/* Delete Button */}
                    <button 
                      className="btn" 
                      style={{ background: '#e5e7eb', fontSize: '12px', padding: '4px 12px' }} 
                      onClick={() => handleDelete(p._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {patients.length === 0 && (
            <p style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>No patients found</p>
          )}
        </div>
      </div>
    </div>
  );
}