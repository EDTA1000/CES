const subscribeModule = {
    isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },
    async sendSubscriptionRequest(endpoint, payload) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

             const result = await response.json();
               if (response.ok) {
                    let msg = result.message;
                    if (result.expiry) {
                    msg += `\nاین اشتراک تا تاریخ ${result.expiry} معتبر است.`;
               }
             alert(msg);
            }
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'خطا در ارتباط با سرور');
            
            alert(result.message || 'عملیات با موفقیت انجام شد.');
        } catch (error) {
            console.error('Subscription error:', error);
            alert('خطا: ' + error.message);
        }
    },
    initPurchaseBtn() {
        const btn = document.getElementById('subscribe-purchase-btn');
        if (!btn) return;

        btn.addEventListener('click', async () => {
            btn.disabled = true;
            btn.innerText = 'در حال پردازش...';
            await this.sendSubscriptionRequest('/api/purchase', { plan: 'premium' });
            btn.disabled = false;
            btn.innerText = 'خرید اشتراک';
        });
    },

    initFreeTrialBtn(email) {
        const btn = document.getElementById('free-trial-btn');
        if (!btn) return;

        btn.addEventListener('click', async () => {
            await this.sendSubscriptionRequest('/api/subscribe-trial', { email, plan: '7-day-trial' });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    subscribeModule.initPurchaseBtn();
});

window.subscribeModule = subscribeModule;
