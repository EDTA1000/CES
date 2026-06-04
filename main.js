let currentUser = JSON.parse(localStorage.getItem('ces_user')) || null;

async function loadSiteData() {
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        
        // بروزرسانی شمارنده‌های اصلی سایت
        const likeBtn = document.getElementById('like-btn');
        const dislikeBtn = document.getElementById('dislike-btn');
        if(likeBtn) likeBtn.innerHTML = `Like <span id="like-count">${data.likes}</span>`;
        if(dislikeBtn) dislikeBtn.innerHTML = `Dislike <span id="dislike-count">${data.dislikes}</span>`;

        const list = document.getElementById('comments-list');
        // حل مشکل شماره ۳: استفاده از کلاس‌های CSS تعریف شده
        list.innerHTML = data.comments.map(c => `
            <div class="comment-item">
                <div class="comment-header">
                    <span>${c.email}</span>
                    <span>${c.date}</span>
                </div>
                <div class="comment-text">${c.text}</div>
                <div class="comment-actions">
                    <button onclick="voteOnComment('like')" class="btn-sm btn-like">👍 لایک</button>
                    <button onclick="voteOnComment('dislike')" class="btn-sm btn-dislike">👎 دیس</button>
                </div>
            </div>
        `).reverse().join('');
    } catch (e) { console.error("Error loading data"); }
}

// تابع رای دهی (هم برای سایت هم برای کامنت)
async function voteOnComment(type) {
    if (!currentUser) return alert("ابتدا باید وارد شوید!");

    try {
        const response = await fetch('/api/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, email: currentUser.email })
        });
        const result = await response.json();
        if (response.ok) {
            alert("رای شما ثبت شد");
            loadSiteData(); // بروزرسانی ظاهر
        } else {
            alert(result.error);
        }
    } catch (err) { alert("خطا در اتصال"); }
}

async function handleLogin() {
    const email = prompt("لطفاً ایمیل خود را وارد کنید:");
    if (!email || !email.includes('@')) return alert("ایمیل نامعتبر است!");

    const response = await fetch('/api/login-or-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    const data = await response.json();
    currentUser = data.user;
    localStorage.setItem('ces_user', JSON.stringify(currentUser));
    updateUI();
}

function handleLogout() {
    localStorage.removeItem('ces_user');
    currentUser = null;
    location.reload();
}

function updateUI() {
    const btnArea = document.getElementById('subscription-button-area');
    const profileArea = document.getElementById('profile-area');

    // نمایش پروفایل (حل مشکل ۵)
    if (profileArea) {
        if (currentUser) {
            profileArea.innerHTML = `
                <div class="user-profile">
                    <div class="user-avatar"></div>
                    <span>${currentUser.email}</span>
                    <button class="logout-btn" onclick="handleLogout()">خروج</button>
                </div>`;
        } else {
            profileArea.innerHTML = "";
        }
    }

    // نمایش دکمه‌ها و مدیریت اشتراک (حل مشکل ۴)
    if (currentUser) {
        const isExpired = new Date(currentUser.expiryDate) < new Date();
        let html = `<div class="user-controls">
                        <button class="btn btn-primary">🛠 ساخت قطعه</button>
                        <button class="btn btn-primary">🧪 شبیه‌سازی</button>
                    </div>`;

        if (isExpired) {
            html += `
                <div class="subscription-box">
                    <p>⚠️ اشتراک شما منقضی شده است!</p>
                    <button class="btn btn-free" onclick="location.href='subscribe.html?mode=free'">🎁 دریافت ۷ روز رایگان</button>
                    <button class="btn btn-buy" onclick="location.href='subscribe.html'">💳 خرید اشتراک</button>
                    <br>
                    <button class="btn-no" onclick="handleLogout()">نه متشکرم (خروج)</button>
                </div>`;
        }
        btnArea.innerHTML = html;
    } else {
        btnArea.innerHTML = `<button class="btn btn-primary" onclick="handleLogin()">ورود به حساب کاربری</button>`;
    }
}

window.onload = () => { updateUI(); loadSiteData(); };
