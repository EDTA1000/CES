document.addEventListener('DOMContentLoaded', () => {
    setupAdminNavigation();
    setupCommentSystem();
    setupAdminKeyboardShortcut();
    hideAdminButtons();
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
    const submitBtn = document.getElementById('submit-comment-btn');
    const commentText = document.getElementById('comment-text');

    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const content = commentText?.value?.trim();

            if (!content) {
                alert('لطفاً نظر خود را بنویسید.');
                return;
            }

            try {
                const response = await fetch('/api/comments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'guest@user.com',
                        content
                    })
                });

                const data = await response.json().catch(() => null);

                if (!response.ok) {
                    throw new Error(data?.message || 'خطا در ثبت نظر');
                }

                if (data?.success) {
                    alert('نظر شما ثبت شد.');
                    if (commentText) commentText.value = '';
                    loadComments();
                } else {
                    alert(data?.message || 'ثبت نظر ناموفق بود.');
                }
            } catch (err) {
                console.error('خطا در ارسال نظر:', err);
                alert('خطا در ارسال نظر به سرور');
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
        const data = await res.json().catch(() => null);

        if (!res.ok) {
            throw new Error(data?.message || 'خطا در دریافت نظرات');
        }

        if (!Array.isArray(data) || data.length === 0) {
            list.innerHTML = '<p>هنوز نظری ثبت نشده است.</p>';
            return;
        }

        list.innerHTML = data
            .map(c => {
                const content = escapeHtml(c.content || '');
                return `<div class="comment">${content}</div>`;
            })
            .join('');
    } catch (err) {
        console.error('خطا در بارگذاری نظرات:', err);
        list.innerHTML = '<p>در حال حاضر امکان بارگذاری نظرات نیست.</p>';
    }
}

function setupAdminKeyboardShortcut() {
    document.addEventListener('keydown', async (event) => {
        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'b') {
            event.preventDefault();

            const password = prompt('لطفاً رمز عبور ادمین را وارد کنید:');
            if (!password) return;

            try {
                const response = await fetch('/verify-admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });

                const data = await response.json().catch(() => null);

                if (!response.ok) {
                    alert(data?.message || 'رمز عبور اشتباه است.');
                    return;
                }

                if (data?.success) {
                    alert('خوش آمدید ادمین.');
                    showAdminButtons();
                } else {
                    alert(data?.message || 'احراز هویت ناموفق بود.');
                }
            } catch (err) {
                console.error('خطا در احراز هویت:', err);
                alert('خطا در ارتباط با سرور');
            }
        }
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
