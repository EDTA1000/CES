document.addEventListener('DOMContentLoaded', () => {
    setupAdminNavigation();
    setupCommentSystem();
    hideAdminButtons();
    const currentUserEmail = localStorage.getItem('userEmail');
    const isSubscribed = localStorage.getItem('isSubscribed') === 'true';
    if (currentUserEmail) {
       updateUIForLoggedInUser(currentUserEmail, isSubscribed);
    }
    const purchaseBtn = document.getElementById('subscribe-purchase-btn');
    if (purchaseBtn) {
        purchaseBtn.addEventListener('click', () => {
            window.location.href = '/subscribe.html';
        });
    }
});
document.addEventListener('DOMContentLoaded', () => {
    const goToSubscribeBtn = document.getElementById('go-to-subscribe-btn'); 
    
    if (goToSubscribeBtn) {
        goToSubscribeBtn.addEventListener('click', () => {
            window.location.href = 'subscribe.html'; 
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
function getAvatarUrl(email) {
    const hash = btoa(email.toLowerCase().trim()); 
    return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
}
async function loadComments() {
    const list = document.getElementById('comments-list-global');
    if (!list) return;
    try {
        const res = await fetch('/api/comments');
        const data = await res.json();
        
        list.innerHTML = data.map(c => {
            const displayName = c.email.split('@')[0]; 
            const avatar = getAvatarUrl(c.email); 
            
            return `
                <div class="comment-item">
                    <div class="user-info">
                        <img src="${avatar}" width="30" alt="avatar">
                        <strong>${displayName}</strong>
                    </div>
                    <p>${c.content}</p>
		<div class="vote-actions">
  		  <button class="like-btn" data-comment-id="${c.id}">👍 ${c.likes || 0}</button>
  		  <button class="dislike-btn" data-comment-id="${c.id}">👎 ${c.dislikes || 0}</button>
		</div>

    </div>
        </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error("خطا در بارگذاری نظرات:", err);
    } 
} 
async function voteComment(commentId, type) {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
        alert('برای رأی دادن باید وارد شوید.');
        return;
    }

    const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            comment_id: commentId,
            user_email: userEmail,
            vote_type: type
        })
    });

    const data = await res.json();
    if (data.success) {
        loadComments();
    } else {
        alert(data.message || 'شما قبلاً رأی داده‌اید!');
    }
}

function replyTo(username) {
    const input = document.getElementById('comment-input-global');
    input.value = `@${username} `;
    input.focus();
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
function updateUIForLoggedInUser(email, isSubscribed) {
    const authContainer = document.getElementById('email-form-container');
    const plansContainer = document.getElementById('subscription-plans');
    const dashboardActions = document.getElementById('dashboard-actions'); 

    if (isSubscribed) {
        if(authContainer) authContainer.style.display = 'none';
        if(plansContainer) plansContainer.style.display = 'none';
        dashboardActions.innerHTML = `
            <button onclick="window.location.href='/simulation-page.html'">ورود به صفحه شبیه‌سازی</button>
            <button onclick="handleLogout()">خروج از اشتراک</button>
        `;
    }
}

function handleLogout() {
    localStorage.clear(); 
    window.location.reload(); 
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
document.addEventListener('click', (e) => {
    const likeBtn = e.target.closest('.like-btn');
    const dislikeBtn = e.target.closest('.dislike-btn');

    if (likeBtn) {
        voteComment(likeBtn.dataset.commentId, 'like');
    }

    if (dislikeBtn) {
        voteComment(dislikeBtn.dataset.commentId, 'dislike');
    }
});

document.addEventListener('keydown', async (event) => {
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'b') {
        event.preventDefault();

        const password = prompt('مشکلی پیش آمده است؟');
        if (!password) return;

        try {
            const ok = await verifyAdminPassword(password);
            if (ok) {
                showAdminMode();
                alert('ورود موفق بود');
            } else {
                alert('مشکل شما ثبت شد.');
            }
        } catch (err) {
            console.error('Admin login error:', err);
            alert('خطا در ثبت مشکل شما');
        }
    }
});

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


