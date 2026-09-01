'use client';

export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: '20px',
    md: '40px',
    lg: '60px',
  };

  const borderSizes = {
    sm: '3px',
    md: '4px',
    lg: '5px',
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 20px' }}>
      <div
        className="spinner"
        style={{
          width: sizes[size],
          height: sizes[size],
          borderWidth: borderSizes[size],
        }}
      />
    </div>
  );
}