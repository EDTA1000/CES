let currentUser = { email: null };

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
        alert('لطفاً ایمیل خود را وارد کنید.');
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

        const statusData = await statusResponse.json().catch(() => null);

        if (!statusResponse.ok) {
            alert(statusData?.message || 'خطا در بررسی وضعیت کاربر');
            return;
        }

        const activateResponse = await fetch('/api/activate-free-trial', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const activateData = await activateResponse.json().catch(() => null);

        if (!activateResponse.ok) {
            alert(activateData?.message || 'خطا در فعال‌سازی اشتراک');
            return;
        }

        currentUser.email = email;

        const emailForm = document.getElementById('email-form-container');
        const plans = document.getElementById('subscription-plans');

        if (emailForm) emailForm.classList.add('hidden');
        if (plans) plans.classList.remove('hidden');

    } catch (err) {
        console.error('خطا در ثبت ایمیل:', err);
        alert('خطا در ارتباط با سرور');
    }
}


async function updateUIBasedOnStatus(email) {
  try {
    const response = await fetch('/api/check-user-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

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

    if (planId === '7days-free') {
        alert('اشتراک رایگان با موفقیت فعال شد.');
        window.location.href = '/index.html';
        return;
    }

    try {
        const response = await fetch('/api/purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUser.email, planId })
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            alert(data?.message || 'خطا در خرید اشتراک');
            return;
        }

        if (data?.success) {
            alert(data.message || 'اشتراک با موفقیت فعال شد.');
            window.location.href = '/index.html';
        } else {
            alert(data?.message || 'خرید ناموفق بود.');
        }
    } catch (err) {
        console.error('خطا در خرید اشتراک:', err);
        alert('خطا در ارتباط با سرور');
    }
}
