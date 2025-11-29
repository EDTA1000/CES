import './App.css'; 
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Subscribe from './pages/Subscribe';
import Verify from './pages/Verify'; 
import React, { useEffect, useState } from 'react'; 
import FeedbackForm from './components/FeedbackForm';
import Dashboard from './pages/Dashboard'; 
import ModelUploader from './pages/ModelUploader'; // ✅ وارد کردن کامپوننت جدید
import { SpeedInsights } from "@vercel/speed-insights/react";
function Home() {
  const navigate = useNavigate();
  const [hasPaid, setHasPaid] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const paid = localStorage.getItem('ces-paid') === 'true';
    const expire = localStorage.getItem('ces-expire');
    let isExpired = true;

    if (paid && expire) {
      const now = new Date();
      const expireDate = new Date(expire);
      if (expireDate > now) {
        setHasPaid(true);
        isExpired = false;
      } else {
        localStorage.removeItem('ces-paid');
        localStorage.removeItem('ces-expire');
        setHasPaid(false);
      }
    } else {
      setHasPaid(false);
    }
    
    setLoading(false);
    
  }, [navigate]);

  if (loading || hasPaid) {
      // اگر هنوز در حال بارگذاری هستیم یا اشتراک فعال است، چیزی نمایش نمی‌دهیم 
      // چون useEffect قرار است هدایت کند.
      return <div className="App">در حال بررسی و هدایت...</div>;
  }
  
  // ✅ نمایش صفحه اصلی (فقط) اگر اشتراک فعال نیست
  return (
    <div className="App">
      <div className="ces-container">
        {/* ... بقیه کد مربوط به رعد و برق و چرخ */}
        <div className="left-side">
          <div className="lightning-wrapper">
            <img src={`${process.env.PUBLIC_URL}/lightning.png`} alt="Lightning" className="lightning" />
            <div className="wheel-on-lightning">
              <img src={`${process.env.PUBLIC_URL}/wheel.png`} alt="wheel" />
            </div>
            <div className="connector-line"></div>
          </div>
        </div>
      </div>

      <img src={`${process.env.PUBLIC_URL}/CES.png`} alt="CES" className="ces-logo" />

      {/* دکمه اشتراک فقط زمانی که hasPaid=false است نمایش داده شود */}
      {!hasPaid && (
        <button className="subscribe-button" onClick={() => navigate('/subscribe')}>
          اشتراک
        </button>
      )}

      <div style={{ marginTop: '40px' }}>
        <FeedbackForm />
      </div>
    </div>
  );
}
function App() {
  return (
    <BrowserRouter basename="/CES-car-electronical-simulator">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/subscribe" element={<Subscribe />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/dashboard" element={<Dashboard />} /> 
        {/* ✅ مسیر جدید برای پنل مدیریت */}
        <Route path="/upload-models" element={<ModelUploader />} /> 
      </Routes>
    </BrowserRouter>
    <SpeedInsights />
  );
}

export default App;