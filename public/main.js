document.addEventListener('DOMContentLoaded', () => {
    const emailForm = document.getElementById('email-form');
    const voteButtons = document.querySelectorAll('.vote-button');
    const adminControls = document.getElementById('admin-controls'); // The element to show/hide

    // Hide admin controls initially
    if (adminControls) {
        adminControls.style.display = 'none';
    }

    fetchSiteData();

    // Email form submission for signup/access
    if (emailForm) {
        emailForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('email-input');
            const email = emailInput.value.trim();
            const messageDiv = document.getElementById('message');

            if (!email) {
                messageDiv.textContent = "لطفاً ایمیل خود را وارد کنید.";
                messageDiv.style.color = 'red';
                return;
            }

            try {
                const response = await fetch('/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const result = await response.json();

                if (response.ok) {
                    messageDiv.textContent = result.message;
                    messageDiv.style.color = 'green';
                    // Optionally disable form or redirect after success
                } else {
                    messageDiv.textContent = result.error || result.message || "خطایی رخ داد.";
                    messageDiv.style.color = 'red';
                }
            } catch (error) {
                console.error("Signup fetch error:", error);
                messageDiv.textContent = "خطا در ارتباط با سرور.";
                messageDiv.style.color = 'red';
            }
        });
    }

    // Vote button functionality
    voteButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const type = button.dataset.type; // 'like' or 'dislike'
            const userEmail = localStorage.getItem('userEmail'); // Assume email is stored after signup
            const messageDiv = document.getElementById('message');

            if (!userEmail) {
                messageDiv.textContent = "لطفاً ابتدا ایمیل خود را وارد کنید.";
                messageDiv.style.color = 'red';
                return;
            }

            try {
                const response = await fetch('/vote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: userEmail, type: type })
                });
                const result = await response.json();

                if (response.ok) {
                    messageDiv.textContent = result.message;
                    messageDiv.style.color = 'green';
                    fetchSiteData(); // Refresh counts
                } else {
                    messageDiv.textContent = result.error || result.message || "خطایی رخ داد.";
                    messageDiv.style.color = 'red';
                }
            } catch (error) {
                console.error("Vote fetch error:", error);
                messageDiv.textContent = "خطا در ارتباط با سرور.";
                messageDiv.style.color = 'red';
            }
        });
    });

    // Admin access via shortcut
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.shiftKey && event.code === 'KeyB') {
            event.preventDefault();
            const adminPasswordInput = prompt("لطفاً رمز ورود به مدیریت را وارد کنید:");

            // Use fetch to verify password with the server
            fetch('/verify-admin', { // We need to add this route to server.js
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: adminPasswordInput })
            })
            .then(response => response.json())
            .then(data => {
                if (response.ok) {
                    alert("ورود موفقیت‌آمیز بود. بخش مدیریت باز شد.");
                    if (adminControls) {
                        adminControls.style.display = 'block';
                    }
                } else {
                    alert("رمز اشتباه است!");
                }
            })
            .catch(error => {
                console.error("Admin verification error:", error);
                alert("خطا در ارتباط با سرور.");
            });
        }
    });

    // Add a submit handler for the create piece form if it exists
    const createPieceForm = document.getElementById('create-piece-form');
    if (createPieceForm && adminControls && adminControls.style.display === 'block') {
        createPieceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userEmail = localStorage.getItem('userEmail'); // Should be admin email
            const adminPassword = "6.67430...×10^(-11)m³/(kg.s²)"; // Or fetch from a secure place/prompt again
            const pieceNameInput = document.getElementById('piece-name');
            const pieceDescriptionInput = document.getElementById('piece-description');

            const pieceData = {
                name: pieceNameInput.value.trim(),
                description: pieceDescriptionInput.value.trim()
            };

            try {
                const response = await fetch('/create-piece', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: adminPassword, pieceData: pieceData })
                });
                const result = await response.json();

                if (response.ok) {
                    alert("قطعه با موفقیت ایجاد شد!");
                    pieceNameInput.value = '';
                    pieceDescriptionInput.value = '';
                    // Refresh something or show a success message
                } else {
                    alert(result.error || "خطایی رخ داد.");
                }
            } catch (error) {
                console.error("Create piece fetch error:", error);
                alert("خطا در ارتباط با سرور.");
            }
        });
    }
});

async function fetchSiteData() {
    const likesSpan = document.getElementById('likes-count');
    const dislikesSpan = document.getElementById('dislikes-count');

    try {
        const response = await fetch('/api/site-data');
        const data = await response.json();
        if (likesSpan) likesSpan.textContent = data.likes;
        if (dislikesSpan) dislikesSpan.textContent = data.dislikes;
    } catch (error) {
        console.error("Fetch site data error:", error);
        if (likesSpan) likesSpan.textContent = 'N/A';
        if (dislikesSpan) dislikesSpan.textContent = 'N/A';
    }
}
