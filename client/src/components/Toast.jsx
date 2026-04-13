// src/components/Toast.jsx
import { useEffect } from 'react';

export default function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [msg]);

  if (!msg) return null;
  const bg    = type === 'err' ? '#f04060' : type === 'info' ? '#3b82f6' : '#10d97e';
  const color = type === 'err' || type === 'info' ? '#fff' : '#021a0e';
  return (
    <div className="toast" style={{ background: bg, color }}>
      {msg}
    </div>
  );
}
