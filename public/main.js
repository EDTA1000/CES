
const API = {
    async request(endpoint, method = 'POST', data = {}) {
        try {
            const response = await fetch(`/api/${endpoint}`, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'خطا در ارتباط با سرور');
            return result;
        } catch (error) {
            console.error(`API Error on ${endpoint}:`, error);
            throw error;
        }
    }
};

const UI = {
    showMessage(text, type = 'info') {
        const msgBox = document.getElementById('message-container') || document.body;
        const div = document.createElement('div');
        div.className = `message-${type}`;
        div.textContent = text; // جلوگیری از XSS
        msgBox.appendChild(div);
        setTimeout(() => div.remove(), 5000);
    },

    updateVisibility(isLoggedIn, isAdmin) {
        const loginSection = document.getElementById('login-section');
        const adminSection = document.getElementById('admin-section');
        if (loginSection) loginSection.style.display = isLoggedIn ? 'none' : 'block';
        if (adminSection) adminSection.style.display = isAdmin ? 'block' : 'none';
    }
};

const App = {
    init() {
        this.bindEvents();
        this.fetchSiteData();
    },

    bindEvents() {
        document.getElementById('subscribe-form')?.addEventListener('submit', (e) => this.handleSubscribe(e));
        
        document.getElementById('login-form')?.addEventListener('submit', (e) => this.handleLogin(e));

        document.getElementById('create-part-btn')?.addEventListener('click', () => this.handleCreatePart());
    },

    async handleSubscribe(e) {
        e.preventDefault();
        const email = e.target.email.value;
        try {
            const result = await API.request('subscribe', 'POST', { email });
            UI.showMessage(result.message, "green");
            this.fetchSiteData();
        } catch (err) {
            UI.showMessage(err.message, "red");
        }
    },

    async handleLogin(e) {
        e.preventDefault();
        const { username, password } = e.target;
        try {
            const result = await API.request('login', 'POST', { 
                username: username.value, 
                password: password.value 
            });
            alert("ورود موفقیت‌آمیز بود.");
            UI.updateVisibility(true, result.isAdmin);
        } catch (err) {
            alert(err.message);
        }
    },

    async handleCreatePart() {
        try {
            const result = await API.request('admin/create-part', 'POST', { data: 'sample' });
            alert("قطعه با موفقیت ایجاد شد!");
        } catch (err) {
            alert(err.message);
        }
    },

    async fetchSiteData() {
        try {
            const data = await API.request('stats', 'GET');
            console.log("آمار سایت:", data);
        } catch (error) {
            console.error("خطا در دریافت آمار:", error);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
