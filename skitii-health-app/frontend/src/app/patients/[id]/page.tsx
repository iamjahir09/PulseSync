'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

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

interface Session {
  _id: string;
  patientId: string;
  patientName: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  status: string;
  readings: {
    timestamp: string;
    heartRate: number;
    rrIntervals?: number[];
  }[];
  averageHeartRate: number;
  maxHeartRate: number;
  minHeartRate: number;
}

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      const patientRes = await fetch(`http://localhost:5000/patients/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const patientData = await patientRes.json();
      setPatient(patientData);

      const sessionsRes = await fetch(`http://localhost:5000/sessions/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sessionsData = await sessionsRes.json();
      setSessions(sessionsData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const startNewSession = () => {
    router.push(`/session/${patientId}?name=${encodeURIComponent(patient?.name || '')}`);
  };

  const toggleReadings = (sessionId: string) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  if (loading) return <div className="container"><p>Loading...</p></div>;
  if (!patient) return <div className="container"><p>Patient not found</p></div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Patient Profile</h1>
        <div>
          <button className="btn btn-primary" onClick={startNewSession}>
            🚀 Start New Session
          </button>
          <button className="btn" style={{ background: '#e5e7eb', marginLeft: '10px' }} onClick={() => router.push('/patients')}>
            ← Back
          </button>
        </div>
      </div>

      <div className="card">
        <h2>{patient.name}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
          <div><strong>Email:</strong> {patient.email}</div>
          <div><strong>Phone:</strong> {patient.phone || '-'}</div>
          <div><strong>DOB:</strong> {patient.dateOfBirth || '-'}</div>
          <div><strong>Gender:</strong> {patient.gender || '-'}</div>
          <div><strong>Status:</strong> <span style={{ color: patient.isActive ? '#16a34a' : '#dc2626' }}>{patient.isActive ? 'Active' : 'Inactive'}</span></div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>📋 Session History</h3>
        
        {sessions.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No sessions found for this patient.</p>
        ) : (
          <div>
            {sessions.map((session) => (
              <div key={session._id} style={{ borderBottom: '1px solid #e5e7eb', padding: '12px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{formatDate(session.startTime)}</strong>
                    <span style={{ marginLeft: '12px', fontSize: '14px', color: '#6b7280' }}>
                      Duration: {formatTime(session.durationSeconds || 0)}
                    </span>
                    <span style={{ 
                      marginLeft: '12px', 
                      fontSize: '12px', 
                      padding: '2px 10px', 
                      borderRadius: '12px',
                      background: session.status === 'ended' ? '#dcfce7' : '#fef3c7',
                      color: session.status === 'ended' ? '#166534' : '#92400e'
                    }}>
                      {session.status}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '14px', marginRight: '12px' }}>
                      Avg: {session.averageHeartRate || '-'} BPM
                    </span>
                    <button className="btn" style={{ background: '#e5e7eb', fontSize: '12px', padding: '4px 12px' }} onClick={() => toggleReadings(session._id)}>
                      {expandedSession === session._id ? 'Hide Readings' : 'View Readings'}
                    </button>
                  </div>
                </div>

                {expandedSession === session._id && (
                  <div style={{ marginTop: '12px', padding: '12px', background: '#f8fafc', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '12px', fontSize: '14px' }}>
                      <div><strong>Min HR:</strong> {session.minHeartRate || '-'} BPM</div>
                      <div><strong>Max HR:</strong> {session.maxHeartRate || '-'} BPM</div>
                      <div><strong>Avg HR:</strong> {session.averageHeartRate || '-'} BPM</div>
                      <div><strong>Total Readings:</strong> {session.readings?.length || 0}</div>
                    </div>
                    <div style={{ maxHeight: '250px', overflowY: 'auto', fontSize: '13px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#e5e7eb' }}>
                            <th style={{ padding: '6px 10px', textAlign: 'left' }}>#</th>
                            <th style={{ padding: '6px 10px', textAlign: 'left' }}>Time</th>
                            <th style={{ padding: '6px 10px', textAlign: 'left' }}>HR (BPM)</th>
                            <th style={{ padding: '6px 10px', textAlign: 'left' }}>RR (ms)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(session.readings || []).map((r, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <td style={{ padding: '4px 10px' }}>{i + 1}</td>
                              <td style={{ padding: '4px 10px' }}>{new Date(r.timestamp).toLocaleTimeString()}</td>
                              <td style={{ padding: '4px 10px' }}>{r.heartRate}</td>
                              <td style={{ padding: '4px 10px' }}>{r.rrIntervals?.[0] || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}