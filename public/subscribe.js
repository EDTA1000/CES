let currentUser = { 
    email: localStorage.getItem('userEmail') || null 
};
async function handleComment() {
    const input = document.getElementById('comment-input-global');
    const content = input.value.trim();
    if (!content) return alert('لطفاً نظر خود را بنویسید.');
    if (!currentUser.email) return alert('ابتدا ایمیل خود را در صفحه اشتراک ثبت کنید.');

    const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email, content })
    });
    if (res.ok) {
        input.value = '';
        if (typeof loadComments === 'function') loadComments();
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const subscribeBtn = document.getElementById('subscribe-submit-btn'); 
    
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', handleSubscribe);
    }
});

async function handleSubscribe() {
    const emailInput = document.getElementById('email');
    if (!emailInput) {
        console.error('Element with id "email" not found.');
        alert('خطای داخلی: فیلد ایمیل پیدا نشد.');
        return;
    }

    const email = emailInput.value.trim();

    if (!email) {
        alert('لطفاً ایمیل خود را وارد کنید.');
        return;
    }

    try {
        const statusResponse = await fetch('/api/check-user-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        if (!statusResponse.ok) {
            const errorData = await statusResponse.json().catch(() => ({ message: 'خطای نامشخص سرور' }));
            alert(errorData.message || `خطا در بررسی وضعیت کاربر (Status: ${statusResponse.status})`);
            console.error('Error checking user status:', errorData);
            return;
        }

        const statusData = await statusResponse.json();


        const activateResponse = await fetch('/api/activate-free-trial', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }) 
        });

        if (!activateResponse.ok) {
            const errorData = await activateResponse.json().catch(() => ({ message: 'خطای نامشخص سرور' }));
            alert(errorData.message || `خطا در فعال‌سازی اشتراک (Status: ${activateResponse.status})`);
            console.error('Error activating free trial:', errorData);
            return;
        }

        currentUser.email = email;
        alert('اشتراک رایگان شما با موفقیت فعال شد!');

        const emailForm = document.getElementById('email-form-container');
        const plans = document.getElementById('subscription-plans');

        if (emailForm) emailForm.classList.add('hidden');
        if (plans) plans.classList.remove('hidden');

    } catch (err) {
        console.error('خطای کلی در فرآیند ثبت نام:', err);
        alert('خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.');
    }
}

async function updateUIBasedOnStatus(email) {
  try {
    const response = await fetch('/api/check-user-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const isSubscribed = localStorage.getItem('isSubscribed') === 'true';
    const purchaseBtn = document.getElementById('subscribe-submit-btn');
    if (isSubscribed && purchaseBtn) {
        purchaseBtn.style.display = 'none';
    }
  }

   document.addEventListener('DOMContentLoaded', () => {
      updateUIBasedOnLoginStatus();
      const result = await response.json();
      if (!result.success || !result.data) return;
     
    const { is_subscribed, expiryDate } = result.data;
    const subBtn = document.getElementById('subscribe-submit-btn');
    const now = new Date();
    const expiry = expiryDate ? new Date(expiryDate) : null;
    const isExpired = expiry && expiry < now;
    if (is_subscribed && !isExpired) {
      subBtn.style.display = 'none'; 
      console.log('اشتراک فعال است.');
    } else {
      subBtn.style.display = 'block';
      subBtn.textContent = isExpired ? 'تمدید اشتراک رایگان' : 'شروع اشتراک رایگان';
    }
  } catch (err) {
    console.error('UI update error:', err);
  }
}

async function buyPlan(planId) {
    if (!currentUser.email) {
        alert('ابتدا ایمیل خود را ثبت کنید.');
        return;
    }

    try {
        const response = await fetch('/api/purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUser.email, planId })
        });

        const data = await response.json(); 

        if (response.ok && data.success) {
            // ۲. اصلاح: استفاده از data بجای responseData
            localStorage.setItem('userEmail', currentUser.email);
            localStorage.setItem('isSubscribed', 'true');
            
            alert('اشتراک با موفقیت فعال شد.');
            window.location.href = '/index.html';
        } else {
            alert(data.message || 'خطا در خرید اشتراک');
        }
    } catch (err) {
        console.error('خطا در خرید اشتراک:', err);
    }
}
