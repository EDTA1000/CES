document.addEventListener('DOMContentLoaded', () => {
    const emailForm = document.getElementById('email-form');
    const voteButtons = document.querySelectorAll('.vote-button');
    const adminControls = document.getElementById('admin-controls');
    const messageDiv = document.getElementById('message');
    const subscribeButton = document.getElementById('subscribe-button');
    const simulationButton = document.getElementById('simulation-button');
    const createPieceButton = document.getElementById('create-piece-button');

    if (adminControls) adminControls.style.display = 'none';

    fetchSiteData();

    const showMessage = (text, color) => {
        if (messageDiv) {
            messageDiv.textContent = text;
            messageDiv.style.color = color;
        }
    };

    const updateButtonVisibility = () => {
        const userEmail = localStorage.getItem('userEmail');
        const isAdmin = adminControls && adminControls.style.display === 'block';

        if (subscribeButton) subscribeButton.style.display = 'none';
        if (simulationButton) simulationButton.style.display = 'none';
        if (createPieceButton) createPieceButton.style.display = 'none'; 
        if (emailForm) emailForm.style.display = 'none'; 

        if (isAdmin) {
            if (adminControls) adminControls.style.display = 'block';
            if (createPieceButton) createPieceButton.style.display = 'block';
            if (simulationButton) simulationButton.style.display = 'block';
        } else if (userEmail) {

            if (simulationButton) simulationButton.style.display = 'block';

        } else {

            if (emailForm) emailForm.style.display = 'block';
            if (subscribeButton) subscribeButton.style.display = 'block';
        }
    };

    if (subscribeButton) {
        subscribeButton.addEventListener('click', () => {
            window.location.href = '/subscribe.html'; 
        });
    }

    if (simulationButton) {
        simulationButton.addEventListener('click', () => {
            const userEmail = localStorage.getItem('userEmail');
            const isAdmin = adminControls && adminControls.style.display === 'block';
            
            if (userEmail || isAdmin) {
                 window.location.href = '/simulation-page.html'; 
            } else {
                showMessage("لطفاً ابتدا با ایمیل وارد شوید یا اشتراک بخرید.", "red");
            }
        });
    }

    if (createPieceButton) {
         createPieceButton.addEventListener('click', () => {

             window.location.href = '/create-piece.html'; 
         });
    }


    emailForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('email-input');
        const email = emailInput?.value.trim();
        
        if (!email) return showMessage("لطفاً ایمیل خود را وارد کنید.", "red");

        try {
            const response = await fetch('/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const result = await response.json();

            if (response.ok) {
                localStorage.setItem('userEmail', email);
                showMessage(result.message, "green");
                emailInput.value = '';
                updateButtonVisibility(); 
            } else {
                showMessage(result.error || "خطا در ثبت‌نام.", "red");
            }
        } catch (error) {
            showMessage("خطا در ارتباط با سرور.", "red");
        }
    });

    voteButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const type = button.dataset.type;
            const email = localStorage.getItem('userEmail');

            if (!email) return showMessage("لطفاً ابتدا ایمیل خود را وارد کنید.", "red");

            try {
                const response = await fetch('/vote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, type })
                });
                const result = await response.json();

                if (response.ok) {
                    showMessage(result.message, "green");
                    fetchSiteData();
                } else {
                    showMessage(result.error || "خطایی رخ داد.", "red");
                }
            } catch (error) {
                showMessage("خطا در ارتباط با سرور.", "red");
            }
        });
    });

    document.addEventListener('keydown', async (event) => {
        if (event.ctrlKey && event.shiftKey && event.code === 'KeyB') {
            event.preventDefault();
            const password = prompt("لطفاً رمز عبور مدیریت را وارد کنید:");
            if (!password) return;

            try {
                const response = await fetch('/verify-admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });

                if (response.ok) {
                    alert("ورود موفقیت‌آمیز بود.");
                    if (adminControls) adminControls.style.display = 'block';
                    window.adminPassword = password; 
                    updateButtonVisibility(); 
                } else {
                    alert("رمز عبور اشتباه است!");
                }
            } catch (err) {
                alert("خطا در ارتباط با سرور.");
            }
        }
    });

    document.getElementById('create-piece-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!window.adminPassword) {
            alert("شما دسترسی ادمین ندارید.");
            return;
        }

        const pieceData = {
            name: document.getElementById('piece-name').value.trim(),
            description: document.getElementById('piece-description').value.trim()
        };

        try {
            const response = await fetch('/create-piece', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: window.adminPassword, pieceData })
            });
            const result = await response.json();

            if (response.ok) {
                alert("قطعه با موفقیت ایجاد شد!");
                document.getElementById('piece-name').value = '';
                document.getElementById('piece-description').value = '';
            } else {
                alert(result.error || "خطا در ایجاد قطعه.");
            }
        } catch (err) {
            alert("خطا در شبکه.");
        }
    });

    updateButtonVisibility(); 
});

async function fetchSiteData() {
    try {
        const response = await fetch('/api/site-data');
        const data = await response.json();
        const likesSpan = document.getElementById('likes-count');
        const dislikesSpan = document.getElementById('dislikes-count');
        
        if (likesSpan) likesSpan.textContent = data.likes || 0;
        if (dislikesSpan) dislikesSpan.textContent = data.dislikes || 0;
    } catch (error) {
        console.error("خطا در دریافت آمار:", error);
    }
}

// Global variables for state management
window.adminPassword = null;
