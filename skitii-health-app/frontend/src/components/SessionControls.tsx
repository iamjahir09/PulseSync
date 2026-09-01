'use client';

interface SessionControlsProps {
  connectionState: 'disconnected' | 'scanning' | 'connecting' | 'connected' | 'reconnecting' | 'error';
  isSessionActive: boolean;
  isPaused: boolean;
  onScan: () => void;
  onMockMode: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onDisconnect: () => void;
}

export default function SessionControls({
  connectionState,
  isSessionActive,
  isPaused,
  onScan,
  onMockMode,
  onPause,
  onResume,
  onEnd,
  onDisconnect,
}: SessionControlsProps) {
  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      {/* Disconnected State */}
      {connectionState === 'disconnected' && (
        <>
          <button className="btn btn-primary" onClick={onScan}>
            🔍 Scan for Device
          </button>
          <button className="btn btn-warning" onClick={onMockMode}>
            🧪 Mock Mode (Demo)
          </button>
        </>
      )}

      {/* Scanning State */}
      {connectionState === 'scanning' && (
        <button className="btn" style={{ background: '#e5e7eb' }} disabled>
          ⏳ Scanning for BLE devices...
        </button>
      )}

      {/* Connecting State */}
      {connectionState === 'connecting' && (
        <button className="btn" style={{ background: '#fef3c7', color: '#92400e' }} disabled>
          🔗 Connecting to device...
        </button>
      )}

      {/* Connected State */}
      {connectionState === 'connected' && (
        <>
          {!isSessionActive ? (
            <button className="btn btn-success" onClick={onScan}>
              Start Session
            </button>
          ) : (
            <>
              <button className="btn btn-warning" onClick={isPaused ? onResume : onPause}>
                {isPaused ? '▶️ Resume' : '⏸️ Pause'}
              </button>
              <button className="btn btn-danger" onClick={onEnd}>
                ⏹️ End Session
              </button>
            </>
          )}
          <button className="btn" style={{ background: '#e5e7eb' }} onClick={onDisconnect}>
            🔌 Disconnect
          </button>
        </>
      )}

      {/* Reconnecting State */}
      {connectionState === 'reconnecting' && (
        <button className="btn" style={{ background: '#fef3c7', color: '#92400e' }} disabled>
          🔄 Reconnecting...
        </button>
      )}

      {/* Error State */}
      {connectionState === 'error' && (
        <button className="btn btn-danger" onClick={onScan}>
          ⚠️ Retry Connection
        </button>
      )}
    </div>
  );
}