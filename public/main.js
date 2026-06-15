document.addEventListener('DOMContentLoaded', () => {
    setupAdminNavigation();
    setupCommentSystem();
    setupAdminKeyboardShortcut();
    hideAdminButtons();
    const purchaseBtn = document.getElementById('subscribe-purchase-btn');
    if (purchaseBtn) {
        purchaseBtn.addEventListener('click', () => {
            window.location.href = '/subscribe.html';
        });
    }
});

function hideAdminButtons() {
    const btnCreate = document.getElementById('goto-create-piece');
    const btnSim = document.getElementById('goto-simulation');
    if (btnCreate) btnCreate.style.display = 'none';
    if (btnSim) btnSim.style.display = 'none';
}

function showAdminButtons() {
    const btnCreate = document.getElementById('goto-create-piece');
    const btnSim = document.getElementById('goto-simulation');
    if (btnCreate) btnCreate.style.display = 'block';
    if (btnSim) btnSim.style.display = 'block';
}

function setupAdminNavigation() {
    const btnCreate = document.getElementById('goto-create-piece');
    const btnSim = document.getElementById('goto-simulation');

    if (btnCreate) {
        btnCreate.addEventListener('click', () => {
            window.location.href = '/create-piece';
        });
    }
    if (btnSim) {
        btnSim.addEventListener('click', () => {
            window.location.href = '/simulation-page';
        });
    }
}

function setupCommentSystem() {
    const submitBtn = document.querySelector('button[onclick*="handleComment"]');
    const commentText = document.getElementById('comment-input-global');

    if (submitBtn) {

    }
    loadComments();
}

async function loadComments() {
    const list = document.getElementById('comments-list-global');
    if (!list) return;

    try {
        const res = await fetch('/api/comments');
        const data = await res.json();
        
        list.innerHTML = data.map(c => `
            <div class="comment-item" id="comment-${c.id}">
                <div class="user-info">
                    <img src="${c.user?.avatarUrl || 'default-avatar.png'}" width="30" alt="avatar">
                    <strong>${c.user?.name || 'کاربر'}</strong>
                </div>
                <p>${escapeHtml(c.content)}</p>
                <div class="comment-actions">
                    <button onclick="voteComment(${c.id}, 'up')">👍</button>
                    <button onclick="voteComment(${c.id}, 'down')">👎</button>
                    <span>${c.votes || 0}</span>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error("خطا در بارگذاری نظرات:", err);
    }
}

async function voteComment(id, type) {
    // استفاده از currentUser.email از فایل subscribe.js
    const email = (typeof currentUser !== 'undefined') ? currentUser.email : null;
    
    const res = await fetch('/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type, email })
    });
    if (res.ok) {
        loadComments(); 
    }
}
document.addEventListener('keydown', async (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'B') {
        event.preventDefault();
        const password = prompt('لطفاً رمز مدیریت را وارد کنید:');
        
        if (!password) return;

        try {
            const response = await fetch('/api/admin-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (response.ok) {
                document.getElementById('simulation-btn').style.display = 'block';
                document.getElementById('create-piece-btn').style.display = 'block';
                
                document.getElementById('subscribe-purchase-btn').style.display = 'none';
                document.getElementById('logout-btn').style.display = 'block';
                
                alert('دسترسی ادمین فعال شد');
            } else {
                alert('رمز نادرست است');
            }
        } catch (err) {
            console.error('Error:', err);
        }
    }
});

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


