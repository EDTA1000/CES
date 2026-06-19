
let currentUser = { 
    email: localStorage.getItem('userEmail') || null 
};

function getElement(id) {
    const el = document.getElementById(id);
    if (!el) console.warn(`Warning: Element with id "${id}" not found in DOM.`);
    return el;
}


async function updateSubscriptionUI() {
    const email = localStorage.getItem('userEmail');
    const freePlanCard = getElement('free-plan-card');
    const subscriptionBox = getElement('subscription-plans');

    if (!email) {
        if (subscriptionBox) subscriptionBox.classList.add('hidden');
        return;
    }

    try {

        if (subscriptionBox) subscriptionBox.classList.remove('hidden');

        const response = await fetch(`/api/check-user-status?email=${encodeURIComponent(email)}`);
        
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const result = await response.json();
        console.log("User Status Received:", result.status);

        if (result.status === 'new' || result.status === 'active') {
            if (freePlanCard) {
                freePlanCard.style.display = 'block';
            }
        } else if (result.status === 'expired') {
            if (freePlanCard) {
                freePlanCard.style.display = 'none';
            }
        } else {
            if (freePlanCard) freePlanCard.style.display = 'block';
        }

    } catch (error) {
        console.error("Error updating Subscription UI:", error);

        if (subscriptionBox) subscriptionBox.classList.remove('hidden');

        if (freePlanCard) freePlanCard.style.display = 'block';
    }
}


async function buyPlan(planId) {
    if (planId === '7days-free') {
        await handleFreeTrialActivation();
        return;
    }

    const email = localStorage.getItem('userEmail');
    if (!email) {
        alert('ابتدا ایمیل خود را در صفحه اشتراک ثبت کنید.');
        return;
    }

    try {
        const response = await fetch('/api/purchase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, planId })
        });

        const data = await response.json(); 

        if (response.ok && data.success) {
            localStorage.setItem('userEmail', email);
            localStorage.setItem('isSubscribed', 'true');
            alert('اشتراک با موفقیت فعال شد.');
            window.location.href = '/index.html';
        } else {
            alert(data.message || 'خطا در خرید اشتراک');
        }
    } catch (err) {
        console.error('Error during paid subscription:', err);
        alert('خطا در ارتباط با سرور برای خرید پلن.');
    }
}


async function handleFreeTrialActivation() {
    const email = localStorage.getItem('userEmail');
    if (!email) {
        alert('لطفاً ابتدا ایمیل خود را در فرم زیر وارد و ثبت کنید.');
        return;
    }

    try {
        const response = await fetch('/api/activate-free-trial', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }) 
        });

        const data = await response.json(); 

        if (response.ok && data.success) {
            localStorage.setItem('isSubscribed', 'true');
            alert(data.message || 'اشتراک رایگان با موفقیت فعال شد.');
            await updateSubscriptionUI();
        } else {
            alert(data.message || 'خطا در فعال‌سازی اشتراک رایگان');
        }
    } catch (err) {
        console.error('Error activating free trial:', err);
        alert('خطا در ارتباط با سرور برای فعال‌سازی رایگان.');
    }
}

async function handleSubscribe() {
    const emailInput = getElement('email');
    if (!emailInput) return;

    const email = emailInput.value.trim();
    if (!email) {
        alert('لطفاً ایمیل خود را وارد کنید.');
        return;
    }

    try {
        const statusResponse = await fetch(`/api/check-user-status?email=${encodeURIComponent(email)}`);
        
        if (!statusResponse.ok) {
            const errorData = await statusResponse.json().catch(() => ({}));
            throw new Error(errorData.message || 'خطای بررسی وضعیت');
        }

        const statusData = await statusResponse.json();
        currentUser.email = email;
        localStorage.setItem('userEmail', email);

        const activateResponse = await fetch('/api/activate-free-trial', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }) 
        });

        const activateData = await activateResponse.json();

        if (activateResponse.ok && activateData.success) {
            alert('اشتراک رایگان شما با موفقیت فعال شد!');
            
            const emailForm = getElement('email-form-container');
            const plans = getElement('subscription-plans');
            if (emailForm) emailForm.classList.add('hidden');
            if (plans) plans.classList.remove('hidden');
            
            await updateSubscriptionUI();
        } else {
            alert(activateData.message || 'خطا در فعال‌سازی.');
        }

    } catch (err) {
        console.error('Error in registration process:', err);
        alert(err.message || 'خطا در ارتباط با سرور.');
    }
}


async function handleComment() {
    const input = getElement('comment-input-global');
    if (!input) return;
    
    const content = input.value.trim();
    if (!content) return alert('لطفاً نظر خود را بنویسید.');
    if (!currentUser.email) return alert('ابتدا ایمیل خود را در صفحه اشتراک ثبت کنید.');

    try {
        const res = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUser.email, content })
        });
        
        if (res.ok) {
            input.value = '';
            if (typeof loadComments === 'function') loadComments();
        } else {
            alert('خطا در ارسال نظر.');
        }
    } catch (err) {
        console.error('Error posting comment:', err);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    updateSubscriptionUI();

    const subscribeBtn = getElement('subscribe-submit-btn'); 
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', handleSubscribe);
    }

    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
 
        if (typeof updateUIBasedOnStatus === 'function') {
            updateUIBasedOnStatus(userEmail);
        }
    }
});

async function updateUIBasedOnStatus(email) {
    const purchaseBtn = getElement('subscribe-submit-btn');
    if (!purchaseBtn) return;

    try {
        const response = await fetch(`/api/check-user-status?email=${encodeURIComponent(email)}`);
        const result = await response.json();
        
        if (!result.status) return;

        if (result.status === 'active') {
            purchaseBtn.style.display = 'none';
        } else {
            purchaseBtn.style.display = 'block';
            purchaseBtn.textContent = (result.status === 'expired') ? 'تمدید اشتراک' : 'شروع اشتراک';
        }
    } catch (err) {
        console.error('Error updating status button:', err);
    }
}
