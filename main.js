// لود کردن وضعیت کاربر و نظرات هنگام باز شدن صفحه
document.addEventListener('DOMContentLoaded', async () => {
    await checkAccessStatus();
    loadComments();
});

async function checkAccessStatus() {
    try {
        const response = await fetch('/api/user-status');
        const data = await response.json();
        
        if (data.hasAccess) {
            document.getElementById('btn-simulation').style.display = 'inline-block';
            if (data.isAdmin) {
                document.getElementById('btn-production').style.display = 'inline-block';
            }
        }
    } catch (err) {
        console.error("خطا در دریافت وضعیت:", err);
    }
}
async function vote(id, type) {
    await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type })
    });
    loadComments(); 
}


async function loadComments() {
    const res = await fetch('/api/comments');
    const comments = await res.json();
    const list = document.getElementById('comments-list');
    list.innerHTML = comments.map(c => `
        <div class="comment">
            <p>${c.text}</p>
            <span class="vote-btn" onclick="vote('${c.id}', 'like')">👍 ${c.likes}</span>
            <span class="vote-btn" onclick="vote('${c.id}', 'dislike')">👎 ${c.dislikes}</span>
        </div>
    `).join('');
}

async function submitComment() {
    const text = document.getElementById('new-comment').value;
    await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });
    location.reload();
}
