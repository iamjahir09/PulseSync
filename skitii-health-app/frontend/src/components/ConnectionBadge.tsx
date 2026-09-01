'use client';

interface ConnectionBadgeProps {
  state: 'disconnected' | 'scanning' | 'connecting' | 'connected' | 'reconnecting' | 'error';
  deviceName?: string;
}

export default function ConnectionBadge({ state, deviceName }: ConnectionBadgeProps) {
  const getStateLabel = () => {
    switch (state) {
      case 'disconnected': return 'Disconnected';
      case 'scanning': return 'Scanning...';
      case 'connecting': return 'Connecting...';
      case 'connected': return 'Connected';
      case 'reconnecting': return 'Reconnecting...';
      case 'error': return 'Error';
      default: return state;
    }
  };

  return (
    <div className={`connection-badge ${state}`}>
      <span className="dot"></span>
      {getStateLabel()}
      {deviceName && state === 'connected' && (
        <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.7 }}>
          ({deviceName})
        </span>
      )}
    </div>
  );
}