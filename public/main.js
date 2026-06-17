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
        const [commentsRes, repliesRes] = await Promise.all([
            fetch('/api/comments'),
            fetch('/api/replies')
        ]);
        
        const comments = await commentsRes.json();
        const allReplies = await repliesRes.json();
        
        list.innerHTML = comments.map(c => {
            const displayName = c.email.split('@')[0]; 
            const avatar = getAvatarUrl(c.email); 
            
            const commentReplies = allReplies.filter(r => r.comment_id === c.id);

	const repliesHTML = commentReplies.map(r => {
	    const replyName = r.user_email ? r.user_email.split('@')[0] : 'کاربر';
	    const replyAvatar = r.user_email ? getAvatarUrl(r.user_email) : 'default-avatar.png';
	
	    return `
	        <div class="reply-item" style="margin-left: 20px; border-left: 2px solid #ccc; padding-left: 10px;">
	            <img src="${replyAvatar}" width="30" alt="avatar">
	            <strong>${replyName}</strong>
	            <p>${r.content}</p>
	        </div>
  	  `;
	}).join('');

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
                    
                    <div class="replies-section">
                        ${repliesHTML}
                    </div>

                    <div id="reply-form-${c.id}" class="reply-container">
                        <textarea id="reply-text-${c.id}"></textarea>
                        <button onclick="submitReply('${c.id}')">ارسال پاسخ</button>
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
function showReplyForm(commentId) {
    const form = document.getElementById(`reply-form-${commentId}`);
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

async function replyTo(username) {
    const input = document.getElementById('comment-input-global');
    input.value = `@${username} `;
    input.focus();
}
async function submitReply(commentId) {
    const replyTextElement = document.getElementById(`reply-text-${commentId}`);
    const content = replyTextElement ? replyTextElement.value : "";
    const userEmail = localStorage.getItem('userEmail');

    if (!userEmail) {
        alert("لطفاً ابتدا وارد شوید.");
        return;
    }

    if (!content.trim()) {
        alert("متن پاسخ نمی‌تواند خالی باشد.");
        return;
    }

    try {
        const response = await fetch('/api/replies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                comment_id: commentId,
                content: content,
                user_email: userEmail
            })
        });

        if (response.ok) {
            alert("پاسخ شما ثبت شد!");
            replyTextElement.value = "";
            hideReplyForm(commentId);
            loadComments();
        } else {
            alert("خطا در ثبت پاسخ. لطفاً دوباره تلاش کنید.");
        }
    } catch (error) {
        console.error("Error submitting reply:", error);
        alert("خطای ارتباط با سرور");
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
function updateUIForLoggedInUser(email, isSubscribed) {
    const authContainer = document.getElementById('email-form-container');
    const plansContainer = document.getElementById('subscription-plans');
    const dashboardActions = document.getElementById('dashboard-actions'); 

    if (isSubscribed) {
        if(authContainer) authContainer.style.display = 'none';
        if(plansContainer) plansContainer.style.display = 'none';
        dashboardActions.innerHTML = `
            <button onclick="window.location.href='/simulation-page.html'" class="btn">ورود به صفحه شبیه‌سازی</button>
            <button onclick="handleLogout()" class="btn">خروج از اشتراک</button>
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

function redirectToSimulation() {
    window.location.href = '/simulation-page';
}

function redirectToCreatePiece() {
    window.location.href = '/create-piece';
}

document.addEventListener('DOMContentLoaded', () => {
    const simBtn = document.getElementById('simulation-btn');
    const pieceBtn = document.getElementById('create-piece-btn');

    if (simBtn) {
        simBtn.addEventListener('click', redirectToSimulation);
    }
    
    if (pieceBtn) {
        pieceBtn.addEventListener('click', redirectToCreatePiece);
    }
});
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


