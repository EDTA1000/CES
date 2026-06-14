const subscribeModule = {
    async handleSubscription(email) {
        if (!this.isValidEmail(email)) {
            alert('ایمیل وارد شده معتبر نیست.');
            return;
        }

        try {
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.message || 'خطا در ثبت نام');
            
            alert('اشتراک شما با موفقیت انجام شد.');
        } catch (error) {
            console.error('Subscription error:', error);
            alert('مشکلی در سرور رخ داده است. لطفاً دوباره تلاش کنید.');
        }
    },

    isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    initOfferContainer(containerId, email) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        
        const btn = document.createElement('button');
        btn.textContent = 'پذیرش پیشنهاد ویژه';
        btn.addEventListener('click', () => this.handleSubscription(email));
        
        container.appendChild(btn);
    }
};

window.subscribeModule = subscribeModule;
