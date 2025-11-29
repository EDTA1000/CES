import React, { useState } from 'react';

function Subscribe() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    // ✅ اصلاح: ایجاد یک متغیر برای ایمیل تمیزشده (بدون فاصله‌های اضافی)
    const trimmedEmail = email.trim(); 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
    // 1. بررسی خالی نبودن (با استفاده از ایمیل تمیزشده)
    if (!trimmedEmail) { 
      setError('لطفاً ایمیل را وارد کنید');
      setLoading(false);
      return;
    }

    // 2. بررسی مطابقت با الگوی Regex (با استفاده از ایمیل تمیزشده)
    if (!emailRegex.test(trimmedEmail)) {
      setError('ایمیل وارد شده معتبر نیست');
      setLoading(false);
      return;
    }

// client-react/src/pages/Subscribe.js

// 🔐 رمز مخفی برای عبور از پرداخت
// اگر ایمیل واردشده با رمز مخفی مطابقت کند، بدون پرداخت، اشتراک فعال می‌شود.
if (trimmedEmail === 'danial.alinasiri1389@gmail.com') {
  const expireDays = 1; // اشتراک موقت ۱ روزه برای توسعه
  const expireDate = new Date();
  expireDate.setDate(expireDate.getDate() + expireDays);
  localStorage.setItem('ces-paid', 'true');
  localStorage.setItem('ces-expire', expireDate.toISOString());
  
   window.location.href = '/CES-car-electronical-simulator/Dashboard'; 
  return;
}
    
    // اگر رمز مخفی نبود، به درگاه پرداخت هدایت می‌شود
    try {
      const res = await fetch('https://ces-backend-kltl.onrender.com/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // ✅ ارسال ایمیل تمیزشده به سرور
        body: JSON.stringify({ email: trimmedEmail }), 
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('خطا در دریافت لینک پرداخت');
      }
    } catch (err) {
      console.error(err);
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="subscribe-page">
      <h1>صفحه اشتراک</h1>
      <p>لطفاً ایمیل خود را وارد کنید تا به درگاه پرداخت منتقل شوید.</p>
      <input
        type="email"
        placeholder="ایمیل شما"
        className="email-input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
      />
      <button 
        className="submit-button"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'در حال انتقال...' : 'پرداخت و ثبت‌نام'}
      </button>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default Subscribe;