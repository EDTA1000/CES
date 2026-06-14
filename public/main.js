

document.addEventListener('DOMContentLoaded', () => {

    setupAdminNavigation();


    setupCommentSystem();

    setupAdminKeyboardShortcut();
});

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
    const submitBtn = document.getElementById('submit-comment-btn');
    const commentText = document.getElementById('comment-text');

    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const content = commentText.value.trim();
            if (!content) return alert("لطفاً نظر خود را بنویسید.");

            try {
                const response = await fetch('/api/comments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: "guest@user.com", content }) 
                });
                const data = await response.json();
                if (data.success) {
                    alert("نظر شما ثبت شد.");
                    commentText.value = '';
                    loadComments(); 
                }
            } catch (err) {
                console.error("خطا در ارسال نظر:", err);
            }
        });
    }
    loadComments();
}

async function loadComments() {
    const list = document.getElementById('comments-list');
    if (!list) return;

    try {
        const res = await fetch('/api/comments');
        const comments = await res.json();
        list.innerHTML = comments.map(c => `<div class="comment">${c.content}</div>`).join('');
    } catch (err) {
        console.error("خطا در دریافت نظرات:", err);
    }
}


function setupAdminKeyboardShortcut() {
    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.shiftKey && event.key === 'B') {
            event.preventDefault();
            const password = prompt("لطفاً رمز عبور ادمین را وارد کنید:");
            if (!password) return;
            fetch('/verify-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert("خوش آمدید ادمین.");
                } else {
                    alert("رمز عبور اشتباه است.");
                }
            })
            .catch(err => console.error("خطا در احراز هویت:", err));
        }
    });
}
