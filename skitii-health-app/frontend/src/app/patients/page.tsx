'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastContainer';

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
  const { showToast } = useToast();
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
      setLoading(true);
      const url = search ? `http://localhost:5000/patients?search=${search}` : 'http://localhost:5000/patients';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPatients(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load patients', 'error');
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
    showToast('Logged out', 'info');
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
        showToast(
          editingPatient ? 'Patient updated successfully' : 'Patient added successfully',
          'success'
        );
        setShowForm(false);
        setEditingPatient(null);
        setFormData({ name: '', email: '', phone: '', dateOfBirth: '', gender: '', address: '' });
        fetchPatients();
      } else {
        const error = await res.json();
        showToast(error.message || 'Operation failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Something went wrong', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this patient?')) return;
    try {
      const res = await fetch(`http://localhost:5000/patients/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('Patient deleted', 'info');
        fetchPatients();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to delete patient', 'error');
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:5000/patients/${id}/deactivate`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast('Patient deactivated', 'warning');
        fetchPatients();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to deactivate patient', 'error');
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

  const viewProfile = (patientId: string) => {
    router.push(`/patients/${patientId}`);
  };

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '16px', color: '#64748B' }}>Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="card-header">
        <h1 className="card-title">Patients</h1>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowForm(true);
              setEditingPatient(null);
              setFormData({ name: '', email: '', phone: '', dateOfBirth: '', gender: '', address: '' });
            }}
          >
            Add Patient
          </button>
          <button className="btn btn-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Search + Table */}
      <div className="card">
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Search patients by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: '420px' }}
          />
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="card" style={{ background: '#F8FAFC', marginTop: '16px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>
              {editingPatient ? 'Edit Patient' : 'Add New Patient'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label>Full Name <span className="required">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email <span className="required">*</span></label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main St, City"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="submit" className="btn btn-primary">
                  {editingPatient ? 'Update' : 'Save'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPatient(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Patients Table */}
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p._id}>
                  <td>
                    <strong>{p.name}</strong>
                  </td>
                  <td>{p.email}</td>
                  <td>{p.phone || '-'}</td>
                  <td>
                    <span className={`badge ${p.isActive ? 'badge-active' : 'badge-inactive'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-sm btn-primary"
                        style={{ background: '#64748B' }}
                        onClick={() => viewProfile(p._id)}
                      >
                        View
                      </button>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => startSession(p._id, p.name)}
                      >
                        Session
                      </button>
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => handleEdit(p)}
                      >
                        Edit
                      </button>
                      {p.isActive && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeactivate(p._id)}
                        >
                          Deactivate
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handleDelete(p._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {patients.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
              <p>No patients found</p>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>Click "Add Patient" to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}