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
        loadComments(); 
    }
}

async function handleSubscribe() {
    const emailInput = document.getElementById('email');
    const email = emailInput.value.trim();

    if (!email) {
        alert('لطفاً ایمیل خود را وارد کنید.');
        return;
    }

    try {
        const response = await fetch('/api/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            alert(data?.message || 'خطا در ثبت ایمیل');
            return;
        }

        currentUser.email = email;
        document.getElementById('email-form-container').style.display = 'none';
        document.getElementById('subscription-plans').style.display = 'block';
        document.getElementById('content-container').innerHTML = '<p>ایمیل با موفقیت ثبت شد. لطفاً یکی از اشتراک‌ها را انتخاب کنید.</p>';
    } catch (err) {
        console.error('خطا در ثبت ایمیل:', err);
        alert('خطا در ارتباط با سرور');
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
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: currentUser.email,
                planId
            })
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

document.addEventListener('DOMContentLoaded', () => {
    const submitEmailBtn = document.getElementById('submit-email-btn');
    if (submitEmailBtn) {
        submitEmailBtn.addEventListener('click', handleSubscribe);
    }

    const purchaseBtn = document.getElementById('subscribe-purchase-btn');
    if (purchaseBtn) {
        purchaseBtn.addEventListener('click', () => {
            openPurchaseModal(); 
        });
    }
});

function openPurchaseModal() {
    alert("لطفاً پلن مورد نظر خود را انتخاب کنید.");
}
