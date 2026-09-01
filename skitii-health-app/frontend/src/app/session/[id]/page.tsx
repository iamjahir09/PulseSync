'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ToastContainer';

interface BLEHeartRateData {
  heartRate: number;
  rrIntervals?: number[];
  timestamp: Date;
}

type ConnectionState = 'disconnected' | 'scanning' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export default function SessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const patientId = params.id as string;
  const patientName = searchParams.get('name') || 'Unknown Patient';

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [rrInterval, setRrInterval] = useState<number | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [readings, setReadings] = useState<BLEHeartRateData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [bleDevice, setBleDevice] = useState<any>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mockIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const generateMockHeartRate = () => {
    const baseHR = 65 + Math.floor(Math.random() * 25);
    const rr = 600 + Math.floor(Math.random() * 300);
    return { heartRate: baseHR, rrIntervals: [rr] };
  };

  const startScanning = async () => {
    if (!((navigator as any).bluetooth)) {
      setError('Web Bluetooth API is not supported. Please use Chrome browser.');
      showToast('Web Bluetooth not supported', 'error');
      return;
    }

    setConnectionState('scanning');
    setError(null);

    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['heart_rate'],
      });

      setBleDevice(device);
      await connectToDevice(device);
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        setError('No BLE device found. Make sure your device is on and in range.');
        showToast('No BLE device found', 'error');
      } else if (err.name === 'SecurityError') {
        setError('BLE connection requires HTTPS or localhost.');
        showToast('BLE requires HTTPS', 'error');
      } else {
        setError(`Connection failed: ${err.message}`);
        showToast('Connection failed', 'error');
      }
      setConnectionState('disconnected');
    }
  };

  const connectToDevice = async (device: any) => {
    setConnectionState('connecting');

    try {
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleHeartRateData);
      device.addEventListener('gattserverdisconnected', handleDisconnect);

      setConnectionState('connected');
      showToast('Device connected successfully', 'success');
      startSession();
    } catch (err: any) {
      setError(`Failed to connect: ${err.message}`);
      showToast('Connection failed', 'error');
      setConnectionState('disconnected');
    }
  };

  const handleHeartRateData = (event: any) => {
    const value = event.target.value;
    const data = parseHeartRateData(value);

    if (data && !isPaused) {
      setHeartRate(data.heartRate);
      if (data.rrIntervals && data.rrIntervals.length > 0) {
        setRrInterval(data.rrIntervals[0]);
      }

      const reading: BLEHeartRateData = {
        heartRate: data.heartRate,
        rrIntervals: data.rrIntervals,
        timestamp: new Date(),
      };

      setReadings(prev => [...prev, reading]);
      if (sessionIdRef.current) {
        saveReading(sessionIdRef.current, reading);
      }
    }
  };

  const parseHeartRateData = (value: DataView) => {
    try {
      const flags = value.getUint8(0);
      const isHR16Bit = flags & 0x01;
      const hasRR = flags & 0x10;

      let heartRate: number;
      let offset = 1;

      if (isHR16Bit) {
        heartRate = value.getUint16(offset, true);
        offset += 2;
      } else {
        heartRate = value.getUint8(offset);
        offset += 1;
      }

      const rrIntervals: number[] = [];
      if (hasRR) {
        while (offset + 1 < value.byteLength) {
          const rr = value.getUint16(offset, true);
          rrIntervals.push(rr);
          offset += 2;
        }
      }

      return { heartRate, rrIntervals };
    } catch (err) {
      console.error('Parse error:', err);
      return null;
    }
  };

  const handleDisconnect = () => {
    setConnectionState('reconnecting');
    setError('Device disconnected. Attempting to reconnect...');
    showToast('Device disconnected', 'warning');

    if (bleDevice) {
      setTimeout(async () => {
        try {
          await connectToDevice(bleDevice);
          setError(null);
          showToast('Reconnected successfully', 'success');
        } catch (err) {
          setConnectionState('disconnected');
          setError('Unable to reconnect. Please scan again.');
          showToast('Reconnection failed', 'error');
        }
      }, 3000);
    }
  };

  const startSession = async () => {
    try {
      const res = await fetch('http://localhost:5000/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId,
          patientName,
          bleDeviceId: bleDevice?.id || 'mock-device',
          bleDeviceName: bleDevice?.name || 'BLE Device',
          startTime: new Date().toISOString(),
          status: 'active',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        sessionIdRef.current = data._id;
        setIsSessionActive(true);
        setIsPaused(false);
        showToast('Session started', 'success');

        timerRef.current = setInterval(() => {
          setSessionTime(prev => prev + 1);
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to start session:', err);
      showToast('Failed to start session', 'error');
    }
  };

  const saveReading = async (sessionId: string, reading: BLEHeartRateData) => {
    try {
      await fetch(`http://localhost:5000/sessions/${sessionId}/reading`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reading: {
            timestamp: reading.timestamp,
            heartRate: reading.heartRate,
            rrIntervals: reading.rrIntervals,
          },
        }),
      });
    } catch (err) {
      console.error('Failed to save reading:', err);
    }
  };

  const endSession = async () => {
    setIsSessionActive(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mockIntervalRef.current) {
      clearInterval(mockIntervalRef.current);
      mockIntervalRef.current = null;
    }

    if (sessionIdRef.current) {
      try {
        await fetch(`http://localhost:5000/sessions/${sessionIdRef.current}/end`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        });
        showToast('Session ended', 'info');
      } catch (err) {
        console.error('Failed to end session:', err);
      }
    }

    if (bleDevice && bleDevice.gatt) {
      try {
        bleDevice.gatt.disconnect();
      } catch (err) {
        console.error('Error disconnecting:', err);
      }
    }

    setConnectionState('disconnected');
    router.push('/patients');
  };

  const togglePause = () => {
    setIsPaused(!isPaused);

    if (!isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (mockIntervalRef.current) {
        clearInterval(mockIntervalRef.current);
        mockIntervalRef.current = null;
      }
      showToast('Session paused', 'warning');
    } else {
      timerRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);

      if (connectionState === 'connected' && !bleDevice) {
        startMockDataGeneration();
      }
      showToast('Session resumed', 'success');
    }
  };

  const startMockDataGeneration = () => {
    if (mockIntervalRef.current) {
      clearInterval(mockIntervalRef.current);
      mockIntervalRef.current = null;
    }

    mockIntervalRef.current = setInterval(() => {
      if (!isPaused) {
        const mockData = generateMockHeartRate();
        setHeartRate(mockData.heartRate);
        if (mockData.rrIntervals && mockData.rrIntervals.length > 0) {
          setRrInterval(mockData.rrIntervals[0]);
        }

        const reading: BLEHeartRateData = {
          heartRate: mockData.heartRate,
          rrIntervals: mockData.rrIntervals,
          timestamp: new Date(),
        };
        setReadings(prev => [...prev, reading]);

        if (sessionIdRef.current) {
          saveReading(sessionIdRef.current, reading);
        }
      }
    }, 1000);
  };

  const startMockMode = () => {
    setConnectionState('connected');
    showToast('Mock mode started', 'info');
    startSession();
    setIsSessionActive(true);
    setIsPaused(false);

    timerRef.current = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);

    startMockDataGeneration();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mockIntervalRef.current) clearInterval(mockIntervalRef.current);
      if (bleDevice && bleDevice.gatt) {
        try { bleDevice.gatt.disconnect(); } catch (err) { /* ignore */ }
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getStatusText = () => {
    if (isPaused) return 'Paused';
    if (isSessionActive) return 'Recording';
    return 'Stopped';
  };

  const getStatusClass = () => {
    if (isPaused) return 'paused';
    if (isSessionActive) return 'recording';
    return 'stopped';
  };

  return (
    <div className="container">
      <div className="card-header">
        <h1 className="card-title">Session</h1>
        <button className="btn btn-outline" onClick={() => router.push('/patients')}>
          Back
        </button>
      </div>

      <div className="card">
        {/* Patient & Connection Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ fontWeight: 600 }}>Patient:</span> {patientName}
          </div>
          <div>
            <span className={`connection-badge ${connectionState}`}>
              <span className="dot"></span>
              {connectionState.charAt(0).toUpperCase() + connectionState.slice(1)}
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {/* Live Values */}
        <div style={{ display: 'flex', gap: '32px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>Heart Rate</div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#0F172A' }}>
              {heartRate || '--'} <span style={{ fontSize: '16px', fontWeight: 400, color: '#64748B' }}>BPM</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>RR Interval</div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#0F172A' }}>
              {rrInterval ? `${rrInterval} ms` : '--'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>Session Time</div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#0F172A' }}>
              {formatTime(sessionTime)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>Readings</div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#0F172A' }}>
              {readings.length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>Status</div>
            <div>
              <span className={`status-indicator ${getStatusClass()}`}>
                <span className="dot"></span>
                {getStatusText()}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {connectionState === 'disconnected' && (
            <>
              <button className="btn btn-primary" onClick={startScanning}>
                Scan for Device
              </button>
              <button className="btn btn-warning" onClick={startMockMode}>
                Mock Mode
              </button>
            </>
          )}

          {connectionState === 'scanning' && (
            <button className="btn" style={{ background: '#E2E8F0', color: '#475569', cursor: 'default' }} disabled>
              Scanning...
            </button>
          )}

          {connectionState === 'connecting' && (
            <button className="btn" style={{ background: '#E2E8F0', color: '#475569', cursor: 'default' }} disabled>
              Connecting...
            </button>
          )}

          {connectionState === 'connected' && isSessionActive && (
            <>
              <button className="btn btn-warning" onClick={togglePause}>
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button className="btn btn-danger" onClick={endSession}>
                End Session
              </button>
            </>
          )}

          {connectionState === 'reconnecting' && (
            <button className="btn" style={{ background: '#FEF3C7', color: '#92400E', cursor: 'default' }} disabled>
              Reconnecting...
            </button>
          )}
        </div>
      </div>

      {/* Readings History */}
      {readings.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '14px' }}>Readings History</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Time</th>
                  <th>Heart Rate (BPM)</th>
                  <th>RR Interval (ms)</th>
                </tr>
              </thead>
              <tbody>
                {readings.slice(-20).reverse().map((r, i) => (
                  <tr key={i}>
                    <td>{readings.length - i}</td>
                    <td>{new Date(r.timestamp).toLocaleTimeString()}</td>
                    <td>{r.heartRate}</td>
                    <td>{r.rrIntervals?.[0] || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}