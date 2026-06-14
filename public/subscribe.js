let currentUser = {
    id: null,
    name: null,
    email: null,
    avatarUrl: null
};

async function handleSubscribe() {
    const emailInput = document.getElementById('email');
    const email = emailInput.value.trim();
    
    if (!email) {
        alert('لطفاً ایمیل خود را وارد کنید.');
        return;
    }

    const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email }),
    });

    if (response.ok) {
        document.getElementById('email-form-container').style.display = 'none';
        document.getElementById('subscription-plans').style.display = 'block';
        document.getElementById('content-container').innerHTML = '<p>اشتراک خود را انتخاب کنید:</p>';
        const data = await response.json();
        currentUser = data.user;
    } else {
        alert('خطا در ثبت ایمیل. لطفاً دوباره تلاش کنید.');
    }
}

async function buyPlan(planId) {
    if (!currentUser.email) {
        alert('ابتدا باید ایمیل خود را ثبت کنید.');
        return;
    }

    const response = await fetch('/api/purchase', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId: planId, email: currentUser.email }),
    });

    if (response.ok) {
        alert('خرید با موفقیت انجام شد.');
        window.location.href = 'subscribe.html';
    } else {
        alert('خطا در پردازش خرید.');
    }
}

async function handleVote(postId, type) {
    if (!currentUser.email) {
        alert('فقط کاربران ثبت‌نام شده مجاز به رأی‌دهی هستند.');
        return;
    }

    const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId: postId, type: type, email: currentUser.email }),
    });

    if (response.ok) {
        const data = await response.json();
        document.getElementById(`like-count-${postId}`).textContent = data.likes;
        document.getElementById(`dislike-count-${postId}`).textContent = data.dislikes;
    } else {
        alert('خطا در ثبت رأی.');
    }
}

async function handleComment(postId) {
    if (!currentUser.email) {
        alert('لطفاً برای ثبت نظر ایمیل خود را ثبت کنید.');
        return;
    }

    const commentInput = document.getElementById(`comment-input-${postId}`);
    const text = commentInput.value.trim();

    if (!text) return;

    const response = await fetch('/api/comment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId: postId, text: text, user: currentUser }),
    });

    if (response.ok) {
        const newComment = await response.json();
        const commentsList = document.getElementById(`comments-list-${postId}`);
        const commentDiv = document.createElement('div');
        commentDiv.innerHTML = `
            <div class="user-info">
                <img src="${newComment.user.avatarUrl}" alt="avatar">
                <span>${newComment.user.name}</span>
            </div>
            <p>${newComment.text}</p>
        `;
        commentsList.prepend(commentDiv);
        commentInput.value = '';
    } else {
        alert('خطا در ثبت نظر.');
    }
}
