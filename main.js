let currentUser = JSON.parse(localStorage.getItem('ces_user')) || null;

// ۱. تابع اصلی برای بارگذاری کل داده‌ها (نظرات و لایک‌ها)
async function loadSiteData() {
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        
        // آپدیت آمار لایک/دیس‌لایک
        document.getElementById('like-count').innerText = data.likes;
        document.getElementById('dislike-count').innerText = data.dislikes;

        // نمایش لیست نظرات
        const list = document.getElementById('comments-list');
        list.innerHTML = data.comments.map(c => `
            <div class="comment-item">
                <strong>${c.email}:</strong> <p>${c.text}</p>
                <small>${c.date}</small>
            </div>
        `).reverse().join('');
    } catch (e) { console.error("خطا در بارگذاری داده‌ها"); }
}

// ۲. مدیریت ورود و اشتراک
async function handleLogin() {
    const email = prompt("لطفاً ایمیل خود را وارد کنید:");
    if (!email) return;

    const response = await fetch('/api/login-or-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    const data = await response.json();
    
    currentUser = data.user;
    localStorage.setItem('ces_user', JSON.stringify(currentUser));
    alert(data.message);
    updateUI();
}

// ۳. مدیریت ثبت نظر
async function submitComment() {
    const text = document.getElementById('comment-text').value;
    if (!currentUser) return alert("ابتدا باید وارد شوید.");
    
    const isExpired = new Date(currentUser.expiryDate) < new Date();
    if (isExpired) return alert("اشتراک شما منقضی شده است.");

    const response = await fetch('/api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, email: currentUser.email, isExpired })
    });

    if (response.ok) {
        document.getElementById('comment-text').value = '';
        loadSiteData();
    } else {
        const err = await response.json();
        alert(err.message);
    }
}

// ۴. مدیریت لایک و دیس‌لایک
async function vote(type) {
    if (!currentUser) return alert("ابتدا باید وارد شوید.");
    const isExpired = new Date(currentUser.expiryDate) < new Date();
    if (isExpired) return alert("اشتراک شما منقضی شده است.");

    const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, isExpired })
    });

    if (response.ok) {
        const data = await response.json();
        document.getElementById('like-count').innerText = data.likes;
        document.getElementById('dislike-count').innerText = data.dislikes;
    }
}

// به‌روزرسانی ظاهر سایت بر اساس وضعیت کاربر
function updateUI() {
    const btnArea = document.getElementById('subscription-button-area');
    if (currentUser) {
        const isExpired = new Date(currentUser.expiryDate) < new Date();
        btnArea.innerHTML = `
            <div class="user-info">
                <span>کاربر: ${currentUser.email}</span> | 
                <span>انقضا: ${new Date(currentUser.expiryDate).toLocaleDateString('fa-IR')}</span>
                ${isExpired ? '<b style="color:red"> [منقضی شده]</b>' : ''}
            </div>
        `;
    } else {
        btnArea.innerHTML = `<button onclick="handleLogin()" class="btn btn-primary">ورود / ثبت‌نام با ایمیل</button>`;
    }
}

// اتصال دکمه‌ها به توابع
document.getElementById('submit-comment-btn').addEventListener('click', submitComment);
document.getElementById('like-btn').addEventListener('click', () => vote('like'));
document.getElementById('dislike-btn').addEventListener('click', () => vote('dislike'));

// اجرای اولیه
window.onload = () => {
    updateUI();
    loadSiteData();
};
