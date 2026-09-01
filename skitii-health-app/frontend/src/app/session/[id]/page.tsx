'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

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

  // Mock BLE data generation
  const generateMockHeartRate = () => {
    const baseHR = 65 + Math.floor(Math.random() * 25);
    const rr = 600 + Math.floor(Math.random() * 300);
    return { heartRate: baseHR, rrIntervals: [rr] };
  };

  // Start scanning for BLE devices
  const startScanning = async () => {
    if (!(navigator as any).bluetooth) {
      setError('Web Bluetooth API not supported. Please use Chrome.');
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
        setError('No BLE device found.');
      } else if (err.name === 'SecurityError') {
        setError('BLE requires HTTPS or localhost.');
      } else {
        setError(`Failed: ${err.message}`);
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
      startSession();
    } catch (err: any) {
      setError(`Failed to connect: ${err.message}`);
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
    setError('Device disconnected. Reconnecting...');

    if (bleDevice) {
      setTimeout(async () => {
        try {
          await connectToDevice(bleDevice);
          setError(null);
        } catch (err) {
          setConnectionState('disconnected');
          setError('Unable to reconnect. Scan again.');
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
        
        // Start timer
        timerRef.current = setInterval(() => {
          setSessionTime(prev => prev + 1);
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to start session:', err);
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
    
    // Clear all intervals
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

  // ✅ FIX: Toggle Pause - Timer aur Mock Interval dono ko control karo
  const togglePause = () => {
    setIsPaused(!isPaused);
    
    if (!isPaused) {
      // Pause - Timer aur Mock interval dono roko
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (mockIntervalRef.current) {
        clearInterval(mockIntervalRef.current);
        mockIntervalRef.current = null;
      }
    } else {
      // Resume - Timer aur Mock interval dubara start karo
      timerRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
      
      // Mock interval restart karo
      if (connectionState === 'connected' && !bleDevice) {
        startMockDataGeneration();
      }
    }
  };

  // Mock data generation function
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

  // Mock mode for development
  const startMockMode = () => {
    setConnectionState('connected');
    startSession();
    setIsSessionActive(true);
    setIsPaused(false);

    // Timer start
    timerRef.current = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);

    // Mock data generation start
    startMockDataGeneration();
  };

  // Cleanup on unmount
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

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>BLE Session</h1>
        <button className="btn btn-danger" onClick={() => router.push('/patients')}>
          ← Back
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <strong>Patient:</strong> {patientName}
          </div>
          <div>
            <span className={`connection-badge ${connectionState}`}>
              <span className="dot"></span>
              {connectionState.charAt(0).toUpperCase() + connectionState.slice(1)}
            </span>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '40px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>Heart Rate</div>
            <div style={{ fontSize: '42px', fontWeight: 'bold' }}>
              {heartRate || '--'} <span style={{ fontSize: '18px' }}>BPM</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>RR Interval</div>
            <div style={{ fontSize: '26px', fontWeight: 'bold' }}>
              {rrInterval ? `${rrInterval}ms` : '--'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>Session Time</div>
            <div style={{ fontSize: '26px', fontWeight: 'bold' }}>
              {formatTime(sessionTime)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>Readings</div>
            <div style={{ fontSize: '26px', fontWeight: 'bold' }}>{readings.length}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {connectionState === 'disconnected' && (
            <>
              <button className="btn btn-primary" onClick={startScanning}>
                🔍 Scan for Device
              </button>
              <button className="btn btn-warning" onClick={startMockMode}>
                🧪 Mock Mode (Demo)
              </button>
            </>
          )}

          {connectionState === 'scanning' && (
            <button className="btn" style={{ background: '#e5e7eb' }} disabled>
              ⏳ Scanning...
            </button>
          )}

          {connectionState === 'connecting' && (
            <button className="btn" style={{ background: '#e5e7eb' }} disabled>
              🔗 Connecting...
            </button>
          )}

          {connectionState === 'connected' && isSessionActive && (
            <>
              <button className="btn btn-warning" onClick={togglePause}>
                {isPaused ? '▶️ Resume' : '⏸️ Pause'}
              </button>
              <button className="btn btn-danger" onClick={endSession}>
                ⏹️ End Session
              </button>
            </>
          )}

          {connectionState === 'reconnecting' && (
            <button className="btn" style={{ background: '#fef3c7', color: '#92400e' }} disabled>
              🔄 Reconnecting...
            </button>
          )}
        </div>

        {/* Status indicator */}
        <div style={{ marginTop: '12px', fontSize: '14px', color: '#6b7280' }}>
          Status: {isPaused ? '⏸️ Paused' : isSessionActive ? '▶️ Recording' : '⏹️ Stopped'}
        </div>
      </div>

      {/* Readings History */}
      {readings.length > 0 && (
        <div className="card">
          <h3>📊 Readings History</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>#</th>
                  <th style={{ padding: '8px' }}>Time</th>
                  <th style={{ padding: '8px' }}>HR (BPM)</th>
                  <th style={{ padding: '8px' }}>RR (ms)</th>
                </tr>
              </thead>
              <tbody>
                {readings.slice(-20).map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px' }}>{readings.length - 20 + i + 1}</td>
                    <td style={{ padding: '8px' }}>{new Date(r.timestamp).toLocaleTimeString()}</td>
                    <td style={{ padding: '8px' }}>{r.heartRate}</td>
                    <td style={{ padding: '8px' }}>{r.rrIntervals?.[0] || '-'}</td>
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