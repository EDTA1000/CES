document.addEventListener('DOMContentLoaded', () => {
    setupAdminNavigation();
    setupCommentSystem();
    setupAdminKeyboardShortcut();
    hideAdminButtons();
    const purchaseBtn = document.getElementById('submit-email-btn');
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
function showAdminMode() {
    const subscribeBtn = document.getElementById('subscribe-purchase-btn');
    const simulationBtn = document.getElementById('simulation-btn');
    const createPieceBtn = document.getElementById('create-piece-btn');
    const logoutBtn = document.getElementById('logout-btn');

    if (subscribeBtn) subscribeBtn.style.display = 'none';
    if (simulationBtn) simulationBtn.style.display = 'inline-block';
    if (createPieceBtn) createPieceBtn.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';

    localStorage.setItem('adminMode', 'true');
}

function hideAdminMode() {
    const subscribeBtn = document.getElementById('subscribe-purchase-btn');
    const simulationBtn = document.getElementById('simulation-btn');
    const createPieceBtn = document.getElementById('create-piece-btn');
    const logoutBtn = document.getElementById('logout-btn');

    if (subscribeBtn) subscribeBtn.style.display = 'inline-block';
    if (simulationBtn) simulationBtn.style.display = 'none';
    if (createPieceBtn) createPieceBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';

    localStorage.removeItem('adminMode');
}
document.addEventListener('click', (event) => {
    if (event.target && event.target.id === 'logout-btn') {
        hideAdminMode();
        alert('از اشتراک خارج شدید');
    }
});

async function verifyAdminPassword(password) {
    const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
    });

    if (!res.ok) return false;
    const data = await res.json();
    return data.success === true;
}

document.addEventListener('keydown', async (event) => {
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'b') {
        event.preventDefault();

        const password = prompt('رمز مخفی را وارد کنید:');
        if (!password) return;

        try {
            const ok = await verifyAdminPassword(password);
            if (ok) {
                showAdminMode();
                alert('ورود موفق بود');
            } else {
                alert('رمز اشتباه است');
            }
        } catch (err) {
            console.error('Admin login error:', err);
            alert('خطا در بررسی رمز');
        }
    }
});

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


