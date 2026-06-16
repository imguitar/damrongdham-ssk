import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [backendStatus, setBackendStatus] = useState('loading');
  const [dbStatus, setDbStatus] = useState('loading');
  const [message, setMessage] = useState('กำลังเชื่อมต่อ...');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await axios.get('/api/health');
        setBackendStatus('connected');
        setMessage(res.data.message || 'เชื่อมต่อ Backend สำเร็จ');

        if (res.data.database === 'connected') {
          setDbStatus('connected');
        } else {
          setDbStatus('disconnected');
        }
      } catch (err) {
        setBackendStatus('disconnected');
        setDbStatus('disconnected');
        setMessage('ไม่สามารถเชื่อมต่อ Backend ได้');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000); // ตรวจสอบทุก 10 วินาที
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      <h1>🏫 Damrongdham SSK</h1>
      <p style={{ color: '#94a3b8' }}>Docker Development Environment</p>

      <div className="status-card">
        <h2>🖥️ Backend API</h2>
        <div className="status-indicator">
          <span className={`status-dot ${backendStatus}`}></span>
          <span>{backendStatus === 'connected' ? 'เชื่อมต่อแล้ว' : backendStatus === 'loading' ? 'กำลังตรวจสอบ...' : 'ไม่สามารถเชื่อมต่อได้'}</span>
        </div>
      </div>

      <div className="status-card">
        <h2>🗄️ ฐานข้อมูล MySQL</h2>
        <div className="status-indicator">
          <span className={`status-dot ${dbStatus}`}></span>
          <span>{dbStatus === 'connected' ? 'เชื่อมต่อแล้ว' : dbStatus === 'loading' ? 'กำลังตรวจสอบ...' : 'ไม่สามารถเชื่อมต่อได้'}</span>
        </div>
      </div>

      <p style={{ color: '#64748b', fontSize: '0.9rem' }}>{message}</p>

      <div className="tech-stack">
        <span className="tech-badge">⚛️ React</span>
        <span className="tech-badge">⚡ Vite</span>
        <span className="tech-badge">🟢 Node.js</span>
        <span className="tech-badge">🚂 Express</span>
        <span className="tech-badge">🐬 MySQL 8.0</span>
        <span className="tech-badge">📊 phpMyAdmin</span>
      </div>
    </div>
  );
}

export default App;
