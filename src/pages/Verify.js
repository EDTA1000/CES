import React, { useEffect, useState } from 'react';

function Verify() {
  const [status, setStatus] = useState('در حال بررسی پرداخت...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const authority = query.get('Authority');
    const statusParam = query.get('Status');

    if (statusParam !== 'OK') {
      setStatus('❌ پرداخت لغو شد یا ناموفق بود.');
      setLoading(false);
      return;
    }

    const verifyPayment = async () => {
      try {
        const res = await fetch(`https://ces-backend-kltl.onrender.com/api/verify?authority=${authority}`);
        const data = await res.json();

        if (data.success) {
          const expireDays = 30;
          const expireDate = new Date();
          expireDate.setDate(expireDate.getDate() + expireDays);
          // ✅ ذخیره اشتراک تنها در صورت موفقیت آمیز بودن پرداخت
          localStorage.setItem('ces-paid', 'true');
          localStorage.setItem('ces-expire', expireDate.toISOString());
          setStatus('✅ پرداخت با موفقیت انجام شد! در حال انتقال...');
          setTimeout(() => {
            window.location.href = '/CES-car-electronical-simulator/';
          }, 2000);
        } else {
          setStatus('❌ پرداخت ناموفق بود.');
        }
      } catch (err) {
        console.error(err);
        setStatus('⚠️ خطا در بررسی پرداخت. لطفاً دوباره تلاش کنید.');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, []);
  return (
    <div className="subscribe-page">
      <h1>{status}</h1>
      {loading && <p style={{ marginTop: '10px' }}>⏳ لطفاً منتظر بمانید...</p>}
    </div>
  );
}
export default Verify;